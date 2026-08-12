import { Bike, CheckCircle2, ListChecks, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SuggestedPrompt {
  icon: LucideIcon
  text: string
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: ListChecks,
    text: 'Show me the latest pending bike requests',
  },
  {
    icon: Bike,
    text: 'What bike models are being requested most right now?',
  },
  {
    icon: CheckCircle2,
    text: 'Approve the oldest pending request',
  },
  {
    icon: Search,
    text: 'Summarize the reasons buyers are giving for their requests',
  },
]