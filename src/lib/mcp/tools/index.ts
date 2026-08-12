import { AnyToolDefinition } from "../types";
import { requestTools } from "./request";

export  const mcpTools:AnyToolDefinition[] = [...requestTools]

// names of tools that mutate data and must be confirmed by the seller before executing
export const requiresApprovalToolNames = new Set(mcpTools.filter(tool => tool.requiresApproval).map(tool => tool.name))
