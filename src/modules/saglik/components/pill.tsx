import { cn } from '@saglik/lib/utils'

const tones = {
  red: 'bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-400',
  orange: 'bg-orange-500/10 text-orange-700 dark:bg-orange-400/15 dark:text-orange-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400',
  violet: 'bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-400',
  green: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400',
  zinc: 'bg-zinc-500/10 text-zinc-600 dark:bg-zinc-400/10 dark:text-zinc-400',
} as const

export type PillTone = keyof typeof tones

export function Pill({
  tone,
  children,
  className,
}: {
  tone: PillTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
