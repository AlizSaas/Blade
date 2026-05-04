import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateAuthRequest } from '@/lib/auth'
import openai from '@/lib/open-ai'
import { $Enums } from '@/generated/prisma'
import arcjet, { shield, tokenBucket } from '@arcjet/next'
import type { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources/index.mjs'
import { AI_TOOLS, executeToolCall } from '@/lib/ai/tools'
import { buildPromptMessages } from '@/lib/ai/prompt'
import { buildMessageContext } from '@/lib/ai/memory'

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['ip.src'],
  rules: [
    tokenBucket({
      mode: 'LIVE',
      refillRate: 100,
      interval: '1h',
      capacity: 500,
    }),
    shield({
      mode: 'DRY_RUN',
    }),
  ],
})

const messageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, 'Message content cannot be empty'),
})

/** SSE line helpers */
function sseChunk(text: string): string {
  return `data: ${JSON.stringify({ t: 'chunk', v: text })}\n\n`
}
function sseDone(id: string, ts: string): string {
  return `data: ${JSON.stringify({ t: 'done', id, ts })}\n\n`
}
function sseError(message: string): string {
  return `data: ${JSON.stringify({ t: 'error', e: message })}\n\n`
}

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { conversationId, content } = messageSchema.parse(body)

    // ── Auth ────────────────────────────────────────────────────────────────
    const sessionUser = await validateAuthRequest()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: sessionUser.id },
      include: { subscription: true },
    })

    if (!user || user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Only sellers can talk to the AI' }, { status: 403 })
    }

    if (user.subscription?.plan === 'FREE') {
      return NextResponse.json({ error: 'Upgrade your plan to use the AI chatbot' }, { status: 403 })
    }

    // ── Load conversation + company ────────────────────────────────────────
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { company: true },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // ── Memory strategy: load all messages then apply windowing ────────────
    const allMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })

    // ── Persist the incoming user message ──────────────────────────────────
    await prisma.message.create({
      data: { content, conversationId, Role: $Enums.MessageRole.USER },
    })

    // ── Arcjet rate-limit / shield ─────────────────────────────────────────
    const decision = await aj.protect(req, { requested: 1 })

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
      }
    }

    if (decision.reason.isShield()) {
      return NextResponse.json({ error: 'Request blocked by security rules.' }, { status: 403 })
    }

    // ── Build context-compressed prompt ───────────────────────────────────
    const { systemSummary, recentMessages } = await buildMessageContext(allMessages)

    const promptMessages = buildPromptMessages(
      conversation.company.name,
      systemSummary,
      recentMessages,
      content,
    )

    // ── Phase 1: resolve tool calls (non-streaming) ────────────────────────
    const toolResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: promptMessages,
      tools: AI_TOOLS,
      tool_choice: 'auto',
    })

    const assistantMsg = toolResponse.choices[0].message

    // Build the updated message list that includes the assistant turn + tool results
    const messagesForFinalCall: ChatCompletionMessageParam[] = [
      ...promptMessages,
      {
        role: 'assistant',
        content: assistantMsg.content,
        tool_calls: assistantMsg.tool_calls,
      },
    ]

    if (assistantMsg.tool_calls?.length) {
      const toolResults = await Promise.all(
        assistantMsg.tool_calls.map(async (tc: ChatCompletionMessageToolCall) => {
          const result = await executeToolCall(
            tc.function.name,
            JSON.parse(tc.function.arguments) as Record<string, unknown>,
            sessionUser.id,
          )
          return {
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: result,
          }
        }),
      )
      messagesForFinalCall.push(...toolResults)
    }

    const encoder = new TextEncoder()

    // If Phase 1 already produced a text response (no tools were called),
    // stream the content directly without a second roundtrip.
    if (!assistantMsg.tool_calls?.length && assistantMsg.content) {
      const directContent = assistantMsg.content

      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(sseChunk(directContent)))

            const aiMessage = await prisma.message.create({
              data: {
                content: directContent,
                conversationId,
                Role: $Enums.MessageRole.AI,
              },
            })

            controller.enqueue(
              encoder.encode(sseDone(aiMessage.id, aiMessage.createdAt.toISOString())),
            )
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Streaming error'
            controller.enqueue(encoder.encode(sseError(msg)))
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // ── Phase 2: stream the synthesised final response ─────────────────────
    const finalStream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messagesForFinalCall,
      stream: true,
    })

    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = ''
        try {
          for await (const chunk of finalStream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              fullContent += text
              controller.enqueue(encoder.encode(sseChunk(text)))
            }
          }

          const aiMessage = await prisma.message.create({
            data: {
              content: fullContent || "Sorry, I couldn't understand that.",
              conversationId,
              Role: $Enums.MessageRole.AI,
            },
          })

          controller.enqueue(
            encoder.encode(sseDone(aiMessage.id, aiMessage.createdAt.toISOString())),
          )
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Streaming error'
          controller.enqueue(encoder.encode(sseError(msg)))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    console.error(err)
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

const clearConversationSchema = z.object({
  conversationId: z.string().uuid(),
})

export const DELETE = async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { conversationId } = clearConversationSchema.parse(body)

    const sessionUser = await validateAuthRequest()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { sellerId: true, seller: { select: { clerkId: true } } },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.seller.clerkId !== sessionUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.message.deleteMany({ where: { conversationId } })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error(err)
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
