'use client'

import { Bot, User } from 'lucide-react'
import { isToolUIPart, type UIMessage } from 'ai'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { GenericToolPart, ToolCall } from './tool'


interface ChatMessageProps {
  message: UIMessage
  timestamp?: Date
  onRespondToApproval: (approvalId: string, approved: boolean) => void
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-lg font-bold mt-2 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold mt-2 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="ml-2">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ node, inline, children, ...props }: any) =>
    inline ? (
      <code className="bg-black/20 px-1 py-0.5 rounded text-xs" {...props}>
        {children}
      </code>
    ) : (
      <pre className="bg-black/20 p-2 rounded text-xs overflow-x-auto my-1" {...props}>
        <code>{children}</code>
      </pre>
    ),
  p: ({ children }) => <p className="mb-1">{children}</p>,
}

export function ChatMessage({ message, timestamp, onRespondToApproval }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className="mt-0.5 shrink-0">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={cn('flex min-w-0 max-w-[85%] flex-col gap-2', isUser && 'items-end')}>
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            if (!part.text) return null
            return (
              <div
                key={index}
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                )}
              >
                <ReactMarkdown components={markdownComponents}>{part.text}</ReactMarkdown>
              </div>
            )
          }

          if (isToolUIPart(part)) {
            return (
              <ToolCall key={index} part={part as unknown as GenericToolPart} onRespond={onRespondToApproval} />
            )
          }

          return null
        })}
        {timestamp && (
          <span className="px-1 text-[11px] text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}