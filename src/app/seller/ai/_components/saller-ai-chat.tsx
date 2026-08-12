'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import {
  AlertCircle,
  ArrowLeft,
  Bike,
  Bot,
  Lightbulb,
  Loader2,
  MoreVertical,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet'

import Link from 'next/link'
import { SuggestionCard } from './suggestion-card'
import { SUGGESTED_PROMPTS } from './suggestions'
import { ChatMessage } from './chat-message'

interface SellerAiChatProps {
  sellerName: string
}

// NOTE: point this at wherever the seller MCP route.ts (createSellerMCPClient)
// is actually mounted in your app router, e.g. app/api/seller/ai/chat/route.ts
const SELLER_CHAT_API = '/api/ai/mcp'

export default function SellerAiChat({ sellerName }: SellerAiChatProps) {
  const [input, setInput] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [timestampState, setTimestampState] = useState<{ count: number; map: Map<string, Date> }>({
    count: 0,
    map: new Map(),
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error, addToolApprovalResponse, setMessages, regenerate, clearError } =
    useChat({
      transport: new DefaultChatTransport({ api: SELLER_CHAT_API }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    })

  const isBusy = status === 'submitted' || status === 'streaming'
  const isThinking = status === 'submitted' && messages.at(-1)?.role !== 'assistant'

  // Assign a stable client-side timestamp the first time each message is
  // seen. This mirrors React's documented "adjusting state during render"
  // pattern (comparing against a value derived from a previous render)
  // rather than mutating a ref or calling setState from inside an effect.
  let timestamps = timestampState.map
  if (messages.length !== timestampState.count) {
    const next = new Map(timestampState.map)
    for (const message of messages) {
      if (!next.has(message.id)) next.set(message.id, new Date())
    }
    timestamps = next
    setTimestampState({ count: messages.length, map: next })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, status])

  const canSend = input.trim().length > 0 && !isBusy

  function handleSend(text?: string) {
    const value = (text ?? input).trim()
    if (!value || isBusy) return
    sendMessage({ text: value })
    setInput('')
    setSuggestionsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  function handleApprovalResponse(approvalId: string, approved: boolean) {
    addToolApprovalResponse({ id: approvalId, approved })
  }

  function handleClear() {
    setMessages([])
    setTimestampState({ count: 0, map: new Map() })
    clearError()
  }

  const hasMessages = messages.length > 0

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            {/* Left: Back + Title Section */}
            <div className="flex min-w-0 items-center gap-4">
              <Link
                href="/seller"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Back to seller dashboard"
              >
                <ArrowLeft className="size-4" />
              </Link>

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  <Bike className="size-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold tracking-tight">Seller AI Assistant</h1>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
                    Bike requests & approvals
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex shrink-0 items-center gap-1">
              <Badge
                variant="secondary"
                className="hidden gap-1.5 bg-primary/8 text-primary/90 hover:bg-primary/12 sm:inline-flex"
              >
                <Sparkles className="size-3" />
                <span className="text-xs font-medium">AI</span>
              </Badge>

              <Sheet open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Suggested prompts" className="h-9 w-9">
                        <Lightbulb className="size-4" />
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Suggested prompts</TooltipContent>
                </Tooltip>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle>Suggested prompts</SheetTitle>
                    <SheetDescription>Quick questions to get started.</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-4">
                    {SUGGESTED_PROMPTS.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.text}
                        icon={suggestion.icon}
                        prompt={suggestion.text}
                        onSelect={handleSend}
                        disabled={isBusy}
                      />
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More options" className="h-9 w-9">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={!hasMessages || isBusy} onClick={handleClear} variant="destructive">
                    <Trash2 className="size-4" />
                    Clear conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
            {!hasMessages && (
              <EmptyState sellerName={sellerName} onSelect={handleSend} disabled={isBusy} />
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                timestamp={timestamps.get(message.id)}
                onRespondToApproval={handleApprovalResponse}
              />
            ))}

            {isThinking && (
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <Card className="border-destructive/50">
                <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    Something went wrong. Please try again.
                  </div>
                  <Button size="sm" variant="outline" onClick={() => regenerate()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Composer */}
        <div className="shrink-0 bg-background p-4 sm:p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring"
          >
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about bike requests..."
              rows={1}
              disabled={isBusy}
              className="max-h-40 min-h-9 flex-1 resize-none border-0 py-2 shadow-none focus-visible:ring-0"
              aria-label="Message the Seller AI assistant"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" size="icon" disabled={!canSend} aria-label="Send message">
                  {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send (Enter)</TooltipContent>
            </Tooltip>
          </form>
          <p className="mx-auto mt-2 max-w-3xl px-1 text-center text-[11px] text-muted-foreground">
            Press Enter to send, Shift+Enter for a new line. Approving a request always requires your confirmation.
          </p>
        </div>
      </div>
    </TooltipProvider>
  )
}

function EmptyState({
  sellerName,
  onSelect,
  disabled,
}: {
  sellerName: string
  onSelect: (prompt: string) => void
  disabled?: boolean
}) {
  const firstName = useMemo(() => sellerName.split(' ')[0], [sellerName])

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Bike className="size-7" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">Hi {firstName}, how can I help?</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Ask about pending bike requests, or ask me to review and approve one for you.
        </p>
      </div>
      <div className="grid w-full gap-2.5 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((suggestion) => (
          <SuggestionCard
            key={suggestion.text}
            icon={suggestion.icon}
            prompt={suggestion.text}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}