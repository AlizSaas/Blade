'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuggestionCardProps {
  icon: LucideIcon
  prompt: string
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function SuggestionCard({ icon: Icon, prompt, onSelect, disabled }: SuggestionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(prompt)}
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-background/60 p-3 text-left text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50'
      )}
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="leading-snug text-foreground/90">{prompt}</span>
    </button>
  )
}