import type { Message } from '@/generated/prisma'
import { getOpenAI } from '@/lib/open-ai'

/** Always keep at least this many of the newest messages word-for-word. */
const KEEP_RECENT = 10

/** When the word-for-word part grows past this, the oldest ones are folded into the summary. */
const MAX_VERBATIM = 20

export interface StoredSummary {
  summary: string | null
  summarizedCount: number
}

export interface MessageContext {
  systemSummary: string | null
  recentMessages: Message[]
  /** Set only when a new summary was made and should be saved to the DB. */
  summaryUpdate: { summary: string; summarizedCount: number } | null
}

/**
 * `history` must NOT include the message the user just sent.
 * The summary covers history[0 .. summarizedCount), everything after is sent verbatim.
 */
export async function buildMessageContext(
  history: Message[],
  stored: StoredSummary,
): Promise<MessageContext> {
  // If the stored numbers don't match reality (e.g. messages were deleted), start fresh.
  const isValid =
    stored.summarizedCount <= history.length &&
    (stored.summary !== null || stored.summarizedCount === 0)

  let summary = isValid ? stored.summary : null
  let summarizedCount = isValid ? stored.summarizedCount : 0
  let verbatim = history.slice(summarizedCount)
  let summaryUpdate: MessageContext['summaryUpdate'] = null

  if (verbatim.length > MAX_VERBATIM) {
    const toSummarize = verbatim.slice(0, verbatim.length - KEEP_RECENT)

    try {
      const merged = (await summariseMessages(summary, toSummarize)).trim()
      if (merged) {
        summary = merged
        summarizedCount += toSummarize.length
        verbatim = verbatim.slice(toSummarize.length)
        summaryUpdate = { summary, summarizedCount }
      }
    } catch (err) {
      // Summarizing is a nice-to-have. If it fails, send the longer history instead.
      console.error('Summary failed, sending full history', err)
    }
  }

  return { systemSummary: summary, recentMessages: verbatim, summaryUpdate }
}

async function summariseMessages(
  previousSummary: string | null,
  messages: Message[],
): Promise<string> {
  const text = messages
    .map((m) => `${m.Role === 'USER' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const userContent = previousSummary
    ? `Existing summary:\n${previousSummary}\n\nNew messages:\n${text}`
    : text

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You keep a running summary of a chat between a motorcycle seller and an AI assistant. ' +
          'Merge the existing summary (if any) with the new messages into one summary of at most 5 sentences. ' +
          'Keep topics and decisions. Do NOT keep request counts or statuses, because those change and are always looked up live.',
      },
      { role: 'user', content: userContent },
    ],
    max_tokens: 250,
  })

  return response.choices[0]?.message?.content ?? ''
}