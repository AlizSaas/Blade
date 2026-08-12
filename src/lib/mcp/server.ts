import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

import { toToolFailure } from './error'
import { SellerContext } from './auth'
import { mcpTools } from './tools'

export function createSellerMcpServer(context: SellerContext): McpServer {
  const server = new McpServer({
    name: 'seller-assistant',
    version: '1.0.0',
  })

  for (const tools of mcpTools) {
    server.registerTool(
      tools.name,
      {
        description: tools.description,
        inputSchema: tools.inputShape,
  
      },
      async (input: Record<string, unknown>): Promise<CallToolResult> => {
        try {
          const result = await tools.handler(context, input)

          // This is the single most useful log line you're missing right
          // now: it tells you EXACTLY what a tool returned, including
          // count: 0, without having to guess from the UI card.
          console.log(`[mcp-tool] ${tools.name} succeeded`, {
            companyId: context.companyId,
            userId: context.userId,
            input,
            result,
          })

          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result) }],
            structuredContent: result,
          }
        } catch (error) {
          // This is the block that was silently eating Prisma errors.
          // Log the raw error BEFORE it gets flattened into a generic
          // toToolFailure() response - this is where a real Prisma
          // exception (bad relation, connection error, constraint
          // violation) would actually be visible.
          console.error(`[mcp-tool] ${tools.name} threw an error`, {
            companyId: context.companyId,
            userId: context.userId,
            input,
            error,
            // Prisma errors often have a `.code` (e.g. P2025) - surface it
            // explicitly since it can get lost in generic error logging.
            prismaCode: (error as { code?: string })?.code,
          })

          const failure = toToolFailure(error)
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(failure) }],
            structuredContent: failure as unknown as Record<string, unknown>,
          }
        }
      },
    )
  }

  return server
}