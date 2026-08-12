import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'

if (!process.env.OPENAI_API_KEY) {
  // Fail fast in development rather than surfacing a confusing provider error
  // deep inside a streamed response.
  console.warn('[admin-ai] OPENAI_API_KEY is not set. The Admin AI assistant will not function.')
}

/**
 * Server-only OpenAI provider for the Admin AI assistant.
 *
 * The API key is read from `OPENAI_API_KEY` on the server and is never sent
 * to, or reachable from, the browser.
 */
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/** Chat model used to power the Admin AI assistant. Override with `OPENAI_ADMIN_AI_MODEL`. */
export const sellerAssistantModel = openaiProvider( 'gpt-4o')
