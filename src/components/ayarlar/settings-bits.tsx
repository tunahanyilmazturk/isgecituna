import { cn } from '@/lib/utils'

/** Sayfa başlık bloğu — başlık + açıklama + sağ aksiyon alanı */
export function AyarBaslik({
  baslik,
  aciklama,
  aksiyon,
}: {
  baslik: string
  aciklama: string
  aksiyon?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 pb-5 sm:px-6">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight">{baslik}</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{aciklama}</p>
      </div>
      {aksiyon}
    </div>
  )
}

/** Bölüm kartı — başlıklı gruplanmış ayar alanı */
export function AyarBolum({
  baslik,
  aciklama,
  children,
}: {
  baslik: string
  aciklama?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-border/60">
      <div className="px-5 pt-5 pb-1 sm:px-6">
        <h2 className="text-sm font-semibold">{baslik}</h2>
        {aciklama && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{aciklama}</p>}
      </div>
      <div className="px-5 pb-5 sm:px-6">{children}</div>
    </section>
  )
}

/** Label + kontrol satırı */
export function Satir({
  label,
  aciklama,
  children,
  className,
}: {
  label: string
  aciklama?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-6 py-2.5', className)}>
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium">{label}</div>
        {aciklama && <div className="mt-0.5 text-[11px] text-muted-foreground">{aciklama}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Basit aç/kapat anahtarı */
export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5.5 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2',
        checked ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 left-0.5 size-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

/** 2-3 kolonlu form grid'i */
export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}

export function AlanLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[11px] font-medium text-muted-foreground">{children}</div>
}
