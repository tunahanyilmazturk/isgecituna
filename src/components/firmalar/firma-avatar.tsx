import { cn } from '@/lib/utils'

export function FirmaAvatar({
  ad,
  logo,
  className,
}: {
  ad: string
  logo?: string
  className?: string
}) {
  const initials = ad.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? '').join('').toLocaleUpperCase('tr') || 'FR'
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-500/15 text-sm font-bold',
        logo ? 'bg-white p-1' : 'bg-amber-400 text-zinc-950',
        className,
      )}
    >
      {logo ? <img src={logo} alt={`${ad} logosu`} className="size-full object-contain" /> : initials}
    </span>
  )
}
