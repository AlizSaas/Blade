import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { toolFailureSchema, toToolFailure, ToolError } from '../error'
import { AnyToolDefinition, defineTool } from '@/lib/mcp/types'
import { SellerContext } from '../auth'

// ============================================================================
// SCHEMAS
// ============================================================================

const bikeRequestSummary = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  bikeModel: z.string(),
  url: z.string(),
  reason: z.string(),
  notes: z.string().nullable(),
  buyer: z.object({ id: z.string() }),
  seller: z.object({ id: z.string() }),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const getLatestRequestsOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    count: z.number(),
    requests: z.array(bikeRequestSummary),
  }),
  toolFailureSchema,
])

export const approveRequestOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    message: z.string(),
    request: z.object({
      id: z.string(),
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
      bikeModel: z.string(),
      updatedAt: z.string(),
    }),
  }),
  toolFailureSchema,
])

// ============================================================================
// TOOLS
// ============================================================================

export const getLatestRequestsTool = defineTool({
  name: 'get_latest_requests',
  description: 'Fetch the most recent pending bike requests that need approval. Always use this first to see what requests are available.',
  inputShape: {
    limit: z.number().int().min(1).max(50).default(10).describe('Max number of requests to return (default 10, max 50).'),
  },
  outputSchema: getLatestRequestsOutputSchema,
  handler: async (context: SellerContext, input): Promise<z.infer<typeof getLatestRequestsOutputSchema>> => {
    try {
      const requests = await prisma.bikeRequest.findMany({
        where: {
          status: 'PENDING',
          // Scope by the BUYER's company, not the seller's. sellerId is a
          // required FK that only gets set to the actual approving seller
          // once a request is approved/rejected (see updateRequestBikeStatus).
          // Before that it points at whatever placeholder seller was used at
          // creation time, so filtering on seller.companyId incorrectly
          // excludes freshly-created pending requests.
          buyer: {
            companyId: context.companyId,
          },
        },
        include: {
          buyer: { select: { id: true } },
          seller: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })

      return {
        success: true,
        count: requests.length,
        requests: requests.map((req) => ({
          id: req.id,
          status: req.status as 'PENDING' | 'APPROVED' | 'REJECTED',
          bikeModel: req.bikeModel,
          url: req.url,
          reason: req.reason.length > 220 ? req.reason.slice(0, 220) + '…' : req.reason,
          notes: req.notes ? (req.notes.length > 220 ? req.notes.slice(0, 220) + '…' : req.notes) : null,
          buyer: { id: req.buyer.id },
          seller: { id: req.seller.id },
          createdAt: req.createdAt.toISOString(),
          updatedAt: req.updatedAt.toISOString(),
        })),
      }
    } catch (error) {
      return toToolFailure(error)
    }
  },
})

export const approveRequestTool = defineTool({
  name: 'approve_request',
  description: 'Approve a pending bike request by request ID.',
  inputShape: {
    requestId: z.string().describe('The ID of the bike request to approve.'),
    notes: z.string().optional().describe('Optional additional notes to attach to this request.'),
  },
  outputSchema: approveRequestOutputSchema,
  handler: async (context: SellerContext, input): Promise<z.infer<typeof approveRequestOutputSchema>> => {
    try {
      // Verify the request's BUYER belongs to the authenticated seller's
      // company — same rule used by updateRequestBikeStatus. Do not check
      // seller.companyId here; sellerId isn't reliably the current company
      // until this handler assigns it below.
      const existingRequest = await prisma.bikeRequest.findUnique({
        where: { id: input.requestId },
        include: { buyer: { select: { companyId: true } } },
      })

      if (!existingRequest) {
        throw new ToolError('Request not found', 'REQUEST_NOT_FOUND')
      }

      if (existingRequest.buyer.companyId !== context.companyId) {
        throw new ToolError('Unauthorized: request does not belong to your company', 'UNAUTHORIZED')
      }

      const request = await prisma.bikeRequest.update({
        where: { id: input.requestId },
        data: {
          status: 'APPROVED',
          // Attribute the approval to the seller who actually approved it,
          // matching updateRequestBikeStatus's behavior.
          sellerId: context.userId,
          ...(input.notes && { notes: input.notes }),
          updatedAt: new Date(),
        },
      })

      return {
        success: true,
        message: `Request ${request.id} approved successfully.`,
        request: {
          id: request.id,
          status: 'APPROVED',
          bikeModel: request.bikeModel,
          updatedAt: request.updatedAt.toISOString(),
        },
      }
    } catch (error) {
      return toToolFailure(error)
    }
  },
})

export const requestTools: AnyToolDefinition[] = [getLatestRequestsTool, approveRequestTool]