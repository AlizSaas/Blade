import type { ChatCompletionTool } from 'openai/resources/index.mjs'
import { prisma } from '@/lib/prisma'

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
      parameters: { type: 'object', properties: {}, required: [] },
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

/** `sellerId` is the database User.id of the logged-in seller (not the Clerk id). */
export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  sellerId: string,
): Promise<string> {
  if (toolName === 'get_request_counts') {
    // One query instead of three.
    const grouped = await prisma.bikeRequest.groupBy({
      by: ['status'],
      where: { sellerId },
      _count: { _all: true },
    })

    const countFor = (status: 'APPROVED' | 'REJECTED' | 'PENDING') =>
      grouped.find((g) => g.status === status)?._count._all ?? 0

    const approvedCount = countFor('APPROVED')
    const rejectedCount = countFor('REJECTED')
    const pendingCount = countFor('PENDING')

    return JSON.stringify({
      approvedCount,
      rejectedCount,
      pendingCount,
      totalCount: approvedCount + rejectedCount + pendingCount,
    })
  }

  if (toolName === 'get_latest_requests') {
    const requested = typeof args.limit === 'number' && Number.isFinite(args.limit) ? args.limit : 10
    const limit = Math.max(1, Math.min(Math.floor(requested), 20))

    const requests = await prisma.bikeRequest.findMany({
      where: { sellerId },
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