import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateAuthRequest } from '@/lib/auth'
import { getOpenAI } from '@/lib/open-ai'
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
    tokenBucket({ mode: 'LIVE', refillRate: 100, interval: '1h', capacity: 500 }),
    shield({ mode: 'DRY_RUN' }),
  ],
})

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1, 'Message content cannot be empty').max(2000, 'Message is too long'),
})

const clearConversationSchema = z.object({
  conversationId: z.string().uuid(),
})

/** Fallback used when the AI returns an empty response. Must match the UI fallback. */
const AI_FALLBACK_MESSAGE = "Sorry, I couldn't understand that."

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

function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

function saveAiMessage(conversationId: string, content: string) {
  return prisma.message.create({
    data: { content, conversationId, Role: $Enums.MessageRole.AI },
  })
}

/** Sends a complete text answer as SSE and saves it. */
function streamFixedText(conversationId: string, text: string): Response {
  const encoder = new TextEncoder()

  return sseResponse(
    new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(sseChunk(text)))
          const aiMessage = await saveAiMessage(conversationId, text)
          controller.enqueue(encoder.encode(sseDone(aiMessage.id, aiMessage.createdAt.toISOString())))
        } catch (err) {
          controller.enqueue(encoder.encode(sseError(err instanceof Error ? err.message : 'Streaming error')))
        } finally {
          controller.close()
        }
      },
    }),
  )
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof z.ZodError) {
    return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }
  console.error(err)
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
}

export const POST = async (req: NextRequest) => {
  try {
    const { conversationId, content } = messageSchema.parse(await req.json())

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

    // ── Load conversation + ownership check ────────────────────────────────
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { company: true },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.sellerId !== user.id || conversation.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Arcjet (before saving anything, so blocked requests leave no orphan messages)
    const decision = await aj.protect(req, { requested: 1 })

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
      }
      return NextResponse.json({ error: 'Request blocked by security rules.' }, { status: 403 })
    }

    // ── Save the user's message ────────────────────────────────────────────
    const userMessage = await prisma.message.create({
      data: { content, conversationId, Role: $Enums.MessageRole.USER },
    })

    // ── History WITHOUT the new message (buildPromptMessages adds it itself) ─
    const allMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })
    const history = allMessages.filter((m) => m.id !== userMessage.id)

    const { systemSummary, recentMessages, summaryUpdate } = await buildMessageContext(history, {
      summary: conversation.summary,
      summarizedCount: conversation.summarizedCount,
    })

    if (summaryUpdate) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: summaryUpdate,
      })
    }

    const promptMessages = buildPromptMessages(
      conversation.company.name,
      systemSummary,
      recentMessages,
      content,
    )

    // ── Phase 1: let the model decide whether it needs tools ───────────────
    const openai = getOpenAI()

    const toolResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: promptMessages,
      tools: AI_TOOLS,
      tool_choice: 'auto',
    })

    const assistantMsg = toolResponse.choices[0].message
    const toolCalls = assistantMsg.tool_calls ?? []

    // No tools needed: send the answer directly (or the fallback if it was empty).
    if (toolCalls.length === 0) {
      return streamFixedText(conversationId, assistantMsg.content?.trim() || AI_FALLBACK_MESSAGE)
    }

    // ── Run the tools ──────────────────────────────────────────────────────
    const toolResults = await Promise.all(
      toolCalls.map(async (tc: ChatCompletionMessageToolCall) => {
        let parsedArgs: Record<string, unknown> = {}
        try {
          parsedArgs = JSON.parse(tc.function.arguments) as Record<string, unknown>
        } catch {
          // bad JSON from the model: run the tool with no arguments
        }

        let result: string
        try {
          result = await executeToolCall(tc.function.name, parsedArgs, user.id)
        } catch (err) {
          console.error(`Tool ${tc.function.name} failed`, err)
          result = JSON.stringify({ error: 'Tool failed. Data is unavailable.' })
        }

        return { role: 'tool' as const, tool_call_id: tc.id, content: result }
      }),
    )

    const messagesForFinalCall: ChatCompletionMessageParam[] = [
      ...promptMessages,
      { role: 'assistant', content: assistantMsg.content, tool_calls: toolCalls },
      ...toolResults,
    ]

    // ── Phase 2: stream the final answer ───────────────────────────────────
    const finalStream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messagesForFinalCall,
      stream: true,
    })

    const encoder = new TextEncoder()

    return sseResponse(
      new ReadableStream({
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

            const aiMessage = await saveAiMessage(conversationId, fullContent || AI_FALLBACK_MESSAGE)
            controller.enqueue(encoder.encode(sseDone(aiMessage.id, aiMessage.createdAt.toISOString())))
          } catch (err) {
            controller.enqueue(encoder.encode(sseError(err instanceof Error ? err.message : 'Streaming error')))
          } finally {
            controller.close()
          }
        },
      }),
    )
  } catch (err: unknown) {
    return errorResponse(err)
  }
}

export const DELETE = async (req: NextRequest) => {
  try {
    const { conversationId } = clearConversationSchema.parse(await req.json())

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

    // Delete messages AND reset the summary together, or the AI would
    // keep remembering a conversation the seller cleared.
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { conversationId } }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { summary: null, summarizedCount: 0 },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return errorResponse(err)
  }
}