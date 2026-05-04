import type { Message } from '@/generated/prisma'
import openai from '@/lib/open-ai'

/** Keep this many recent messages verbatim in every request. */
const RECENT_WINDOW = 10

/**
 * When the total message count exceeds this threshold the older messages
 * (everything outside the recent window) are compressed into a short summary
 * using a cheap model, keeping the context small without losing important
 * context from earlier in the conversation.
 */
const SUMMARIZE_THRESHOLD = 20

export interface MessageContext {
  /** Optional summary of messages older than the recent window. */
  systemSummary: string | null
  /** The most recent messages to include verbatim in the prompt. */
  recentMessages: Message[]
}

/**
 * Applies a sliding-window memory strategy to the full message history.
 *
 * - ≤ RECENT_WINDOW messages  → return all, no summary
 * - RECENT_WINDOW < N ≤ SUMMARIZE_THRESHOLD → return last RECENT_WINDOW, no summary
 * - N > SUMMARIZE_THRESHOLD → summarise older messages, return last RECENT_WINDOW
 */
export async function buildMessageContext(messages: Message[]): Promise<MessageContext> {
  if (messages.length <= RECENT_WINDOW) {
    return { systemSummary: null, recentMessages: messages }
  }

  const recentMessages = messages.slice(-RECENT_WINDOW)

  if (messages.length <= SUMMARIZE_THRESHOLD) {
    return { systemSummary: null, recentMessages }
  }

  const olderMessages = messages.slice(0, -RECENT_WINDOW)
  const systemSummary = await summariseMessages(olderMessages)

  return { systemSummary, recentMessages }
}

async function summariseMessages(messages: Message[]): Promise<string> {
  const conversationText = messages
    .map((m) => `${m.Role === 'USER' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Summarise the following conversation in 2-3 sentences, highlighting key topics and any important data mentioned.',
      },
      { role: 'user', content: conversationText },
    ],
    max_tokens: 150,
  })

  return response.choices[0]?.message?.content ?? ''
}
