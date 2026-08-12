import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createMCPClient } from '@ai-sdk/mcp'
import type { SellerContext } from './auth'
import { z } from 'zod'
import type { ToolSet } from 'ai'
import { createSellerMcpServer } from './server'
import { mcpTools } from './tools'

export interface SellerMCPClientInterface {
  tools: ToolSet
  close: () => Promise<void>
}

export async function createSellerMCPClient(
  context: SellerContext,
): Promise<SellerMCPClientInterface> {
  const server = createSellerMcpServer(context)
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair()

  try {
    await server.connect(serverTransport)
  } catch (error) {
    console.error('[mcp-client] server.connect failed:', error)
    throw error
  }

  const client = await createMCPClient({ transport: clientTransport })

  const schemas = Object.fromEntries(
    mcpTools.map((tool) => [
      tool.name,
      { inputSchema: z.object(tool.inputShape), outputSchema: tool.outputSchema },
    ]),
  )

  let tools: ToolSet
  try {
    tools = (await client.tools({ schemas })) as unknown as ToolSet
  } catch (error) {
    // If tool schema registration itself fails (e.g. a Zod shape mismatch
    // between inputShape and outputSchema), this used to throw with no
    // indication of which tool or why.
    console.error('[mcp-client] client.tools() failed:', error, {
      registeredToolNames: mcpTools.map((t) => t.name),
    })
    await client.close()
    await server.close()
    throw error
  }

  return {
    tools,
    close: async () => {
      try {
        await client.close()
        await server.close()
      } catch (error) {
        console.error('[mcp-client] error during session close:', error)
      }
    },
  }
}