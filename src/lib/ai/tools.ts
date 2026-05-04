import type { ChatCompletionTool } from 'openai/resources/index.mjs'
import { prisma } from '@/lib/prisma'

/** Formats a buyer's full name, safely omitting a missing last name. */
function formatCustomerName(firstname: string, lastname: string | null): string {
  return `${firstname} ${lastname ?? ''}`.trim()
}

export const AI_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_request_counts',
      description:
        'Returns the count of bike requests grouped by status (approved, rejected, pending, total) for the authenticated seller.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_latest_requests',
      description: 'Returns the most recent bike requests for the authenticated seller.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of requests to return. Defaults to 10, maximum 20.',
          },
        },
        required: [],
      },
    },
  },
]

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  sellerClerkId: string,
): Promise<string> {
  if (toolName === 'get_request_counts') {
    const [approvedCount, rejectedCount, pendingCount] = await Promise.all([
      prisma.bikeRequest.count({
        where: { seller: { clerkId: sellerClerkId }, status: 'APPROVED' },
      }),
      prisma.bikeRequest.count({
        where: { seller: { clerkId: sellerClerkId }, status: 'REJECTED' },
      }),
      prisma.bikeRequest.count({
        where: { seller: { clerkId: sellerClerkId }, status: 'PENDING' },
      }),
    ])
    const totalCount = approvedCount + rejectedCount + pendingCount
    return JSON.stringify({ approvedCount, rejectedCount, pendingCount, totalCount })
  }

  if (toolName === 'get_latest_requests') {
    const limit = Math.min(typeof args.limit === 'number' ? args.limit : 10, 20)
    const requests = await prisma.bikeRequest.findMany({
      where: { seller: { clerkId: sellerClerkId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        bikeModel: true,
        createdAt: true,
        buyer: { select: { firstname: true, lastname: true } },
      },
    })
    return JSON.stringify(
      requests.map((r) => ({
        id: r.id,
        status: r.status,
        bikeModel: r.bikeModel,
        customerName: formatCustomerName(r.buyer.firstname, r.buyer.lastname),
        createdAt: r.createdAt.toISOString(),
      })),
    )
  }

  return JSON.stringify({ error: `Unknown tool: ${toolName}` })
}
