'use client'

import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  ClipboardList,
  Loader2,
  ShieldAlert,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * Loosely typed shape covering both static (`tool-<name>`) and dynamic
 * MCP tool UI parts. The MCP tool set is discovered at runtime, so the AI
 * SDK cannot narrow `part.type` to string literals at compile time - we
 * pattern-match on `toolName` and `state` instead.
 */
export interface GenericToolPart {
  type: string
  toolCallId: string
  state:
    | 'input-streaming'
    | 'input-available'
    | 'approval-requested'
    | 'approval-responded'
    | 'output-available'
    | 'output-error'
    | 'output-denied'
  input?: unknown
  output?: unknown
  errorText?: string
  approval?: {
    id: string
    approved?: boolean
    reason?: string
    isAutomatic?: boolean
  }
}

interface ToolMeta {
  icon: LucideIcon
  label: string
  runningLabel: string
}

const TOOL_META: Record<string, ToolMeta> = {
  get_latest_requests: {
    icon: ClipboardList,
    label: 'Latest requests',
    runningLabel: 'Fetching pending requests…',
  },
  approve_request: {
    icon: CheckCircle2,
    label: 'Approve request',
    runningLabel: 'Preparing approval…',
  },
}

const DEFAULT_META: ToolMeta = { icon: Bike, label: 'Tool', runningLabel: 'Working…' }

function shortId(id: unknown) {
  if (typeof id !== 'string') return String(id)
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}

function getRequestStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
      return (
        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
          Approved
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
          Pending
        </Badge>
      )
  }
}

function describeAction(toolName: string, input: unknown): string {
  const args = (input ?? {}) as Record<string, unknown>
  switch (toolName) {
    case 'approve_request':
      return `Approve bike request #${shortId(args.requestId)}${
        args.notes ? ` with note: "${String(args.notes)}"` : '.'
      }`
    default:
      return `Run ${toolName.replace(/_/g, ' ')}.`
  }
}

function summarizeOutput(toolName: string, output: unknown): string {
  const result = output as Record<string, unknown> | undefined
  if (!result || typeof result !== 'object') return 'Done.'
  if (result.success === false) return String(result.error ?? 'This action failed.')

  switch (toolName) {
    case 'get_latest_requests': {
      const count = Number(result.count ?? 0)
      return `Found ${count} pending request${count === 1 ? '' : 's'}.`
    }
    case 'approve_request': {
      const request = result.request as { bikeModel?: string } | undefined
      return request?.bikeModel ? `Approved request for "${request.bikeModel}".` : 'Request approved.'
    }
    default:
      return 'Done.'
  }
}

function RequestMiniList({ requests }: { requests: Array<Record<string, unknown>> }) {
  const shown = requests.slice(0, 5)
  return (
    <div className="space-y-2">
      {shown.map((req) => (
        <div
          key={String(req.id)}
          className="space-y-1 rounded-md border bg-background/60 px-2.5 py-1.5 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate font-medium">{String(req.bikeModel)}</span>
            {getRequestStatusBadge(String(req.status))}
          </div>
          {typeof req.reason === 'string' && req.reason.length > 0 && (
            <p className="truncate text-muted-foreground">{req.reason}</p>
          )}
        </div>
      ))}
      {requests.length > shown.length && (
        <p className="pl-1 text-xs text-muted-foreground">+{requests.length - shown.length} more</p>
      )}
    </div>
  )
}

function ToolOutputDetail({ toolName, output }: { toolName: string; output: unknown }) {
  const result = output as Record<string, unknown> | undefined
  if (!result || result.success === false) return null

  if (toolName === 'get_latest_requests' && Array.isArray(result.requests) && result.requests.length > 0) {
    return <RequestMiniList requests={result.requests as Array<Record<string, unknown>>} />
  }
  if (toolName === 'approve_request' && result.request) {
    const request = result.request as { bikeModel?: string; status?: string }
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-xs">
        <span className="min-w-0 flex-1 truncate font-medium">{request.bikeModel}</span>
        {getRequestStatusBadge(String(request.status))}
      </div>
    )
  }
  return null
}

export function ToolCall({
  part,
  onRespond,
}: {
  part: GenericToolPart
  onRespond: (approvalId: string, approved: boolean) => void
}) {
  const toolName = part.type.startsWith('tool-') ? part.type.slice('tool-'.length) : part.type
  const meta = TOOL_META[toolName] ?? DEFAULT_META
  const Icon = meta.icon

  const isRunning = part.state === 'input-streaming' || part.state === 'input-available'
  const isAwaitingApproval = part.state === 'approval-requested' && !part.approval?.isAutomatic
  const isAutoApproving = part.state === 'approval-requested' && part.approval?.isAutomatic
  const isResponded = part.state === 'approval-responded'
  const isDenied = part.state === 'output-denied'
  const isError = part.state === 'output-error'
  const isDone = part.state === 'output-available'

  if (isAwaitingApproval && part.approval) {
    const approvalId = part.approval.id
    return (
      <Card className="max-w-md gap-3 border-amber-300/70 bg-amber-50/70 py-3 dark:border-amber-900/60 dark:bg-amber-950/20">
        <CardContent className="space-y-3 px-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-300">
            <ShieldAlert className="size-4" />
            Confirmation needed
          </div>
          <p className="text-sm text-muted-foreground">{describeAction(toolName, part.input)}</p>
          <Separator className="bg-amber-200/70 dark:bg-amber-900/50" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onRespond(approvalId, false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onRespond(approvalId, true)}>
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('max-w-md gap-2 py-3', isError && 'border-destructive/50')}>
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center gap-2 text-sm">
          {isRunning || isAutoApproving || isResponded ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : isError ? (
            <XCircle className="size-4 shrink-0 text-destructive" />
          ) : isDenied ? (
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          )}
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium">{meta.label}</span>
        </div>
        <p className="pl-6 text-xs text-muted-foreground">
          {isRunning && meta.runningLabel}
          {isAutoApproving && 'Auto-approved, running…'}
          {isResponded && (part.approval?.approved ? 'Confirmed, running…' : 'Cancelling…')}
          {isDenied && (part.approval?.reason || 'This action was cancelled and did not run.')}
          {isError && (part.errorText || 'Something went wrong running this tool.')}
          {isDone && summarizeOutput(toolName, part.output)}
        </p>
        {isDone && (
          <div className="pl-6">
            <ToolOutputDetail toolName={toolName} output={part.output} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}