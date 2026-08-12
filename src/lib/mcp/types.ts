import { z } from 'zod'
import { SellerContext } from './auth'





export interface ToolDefinition<
  Shape extends z.ZodRawShape = z.ZodRawShape,
  Output extends z.ZodTypeAny = z.ZodTypeAny,
> {
  name: string
  description: string
  inputShape: Shape
  outputSchema: Output

  requiresApproval?: boolean
  handler: (context:SellerContext, input: z.infer<z.ZodObject<Shape>>) => Promise<z.infer<Output>>
}

export function defineTool<Shape extends z.ZodRawShape, Output extends z.ZodTypeAny>(
  definition: ToolDefinition<Shape, Output>
): ToolDefinition<Shape, Output> {
  return definition
}

export type AnyToolDefinition = ToolDefinition<any, any>


