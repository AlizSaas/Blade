import { z } from 'zod'

/**
 * Structured, safe error handling for MCP tools.
 *
 * Tools never throw raw Prisma/database errors back to the model. Instead,
 * expected business-rule violations are raised as `ToolError` and every tool
 * handler converts unknown errors into a generic, non-leaking message before
 * they are returned to the AI.
 */
export class ToolError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'ToolError'
    this.code = code
  }
}

export interface ToolFailure {
  success: false
  error: string
  code: string
}

/** Shared zod shape for the failure branch of every tool's output schema. */
export const toolFailureSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string(),
})

/**
 * Converts any thrown error into a structured, safe-to-expose failure object.
 * Unexpected errors (Prisma/database/etc.) are logged server-side and masked
 * with a generic message so internals are never leaked to the model or user.
 */
export function toToolFailure(error: unknown): ToolFailure {
  if (error instanceof ToolError) {
    return { success: false, error: error.message, code: error.code }
  }

  console.error('[seller-ai-tool-error]', error)
  return {
    success: false,
    error: 'Something went wrong while performing this operation.',
    code: 'INTERNAL_ERROR',
  }
}
