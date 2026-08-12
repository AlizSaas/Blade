import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai'

import { getSellerMcpContext } from '@/lib/mcp/auth'
import { SubscriptionRequiredError } from '@/lib/auth'
import { createSellerMCPClient } from '@/lib/mcp/client'
import { buildSellerAssistantSystemPrompt } from '@/lib/mcp/prompt'
import { requiresApprovalToolNames } from '@/lib/mcp/tools'
import { sellerAssistantModel } from '@/lib/mcp/model/model'

export const maxDuration = 60

export async function POST(req: Request) {
  let context

  try {
    context = await getSellerMcpContext()
  } catch (error) {
    console.error('[seller-ai-chat] getSellerMcpContext failed:', error)

    // Distinguish "not a seller at all" from "seller, but needs to upgrade" -
    // the client can show an upgrade CTA instead of a generic access-denied
    // message for the latter.
    if (error instanceof SubscriptionRequiredError) {
      return Response.json({ error: error.message }, { status: 402 })
    }

    return Response.json(
      {
        error:
          'Unauthorized. Only company sellers can use the Seller AI assistant.',
      },
      { status: 403 },
    )
  }

  let messages: UIMessage[]

  try {
    ;({ messages } = await req.json())
  } catch (error) {
    console.error('[seller-ai-chat] Invalid request body:', error)
    return Response.json(
      { error: 'Invalid request body.' },
      { status: 400 },
    )
  }

  let session
  try {
    session = await createSellerMCPClient(context)
  } catch (error) {
    // If the in-memory MCP server/client pairing itself fails to spin up,
    // this used to throw with no context at all.
    console.error('[seller-ai-chat] createSellerMCPClient failed:', error, {
      companyId: context.companyId,
      userId: context.userId,
    })
    return Response.json(
      { error: 'Failed to initialize assistant session.' },
      { status: 500 },
    )
  }

  const modelMessages = await convertToModelMessages(messages)

  try {
    const result = streamText({
      model: sellerAssistantModel,

      system: buildSellerAssistantSystemPrompt(context),

      messages: modelMessages,

      tools: session.tools,

      stopWhen: stepCountIs(8),

      toolApproval: ({ toolCall }) =>
        requiresApprovalToolNames.has(toolCall.toolName)
          ? 'user-approval'
          : 'not-applicable',

      onFinish: async () => {
        await session.close()
      },

      onError: async (error) => {
        // This previously only logged - but streamText's onError receives
        // an { error } wrapper in some versions, not the raw error. Log both
        // shapes defensively so nothing gets lost.
        console.error('[seller-ai-chat] streamText onError:', error)
        await session.close()
      },
    })

    // v7: result.toUIMessageStreamResponse(...) is deprecated. It now
    // splits into toUIMessageStream(...) (wraps result.stream, carries
    // onError) + createUIMessageStreamResponse({ stream }) (builds the
    // actual HTTP Response).
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) => {
          // This only fires for stream-level failures (model call itself
          // throwing) - NOT for tool errors caught inside your tool
          // handlers. Tool-level errors are returned as success:false
          // payloads, not as stream errors, so don't rely on this alone
          // to catch DB issues.
          console.error('[seller-ai-chat] toUIMessageStream onError:', {
            error,
            companyId: context.companyId,
            userId: context.userId,
          })

          return 'The assistant ran into a problem. Please try again.'
        },
      }),
    })
  } catch (error) {
    console.error('[seller-ai-chat] Unhandled error in POST handler:', error)
    await session.close()
    throw error
  }
}