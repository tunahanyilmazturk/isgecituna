import { useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  LayoutGridIcon,
  LayoutListIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ---------- Filtre ----------

export function SecimAlan({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-7 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}

export interface FiltreSoru {
  label: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}

export function FiltrePopover({
  sorular,
  aktifSayi,
  onTemizle,
}: {
  sorular: FiltreSoru[]
  aktifSayi: number
  onTemizle: () => void
}) {
  const [acik, setAcik] = useState(false)
  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setAcik((a) => !a)} aria-expanded={acik}>
        <SlidersHorizontalIcon /> Filtreler
        {aktifSayi > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-zinc-950">
            {aktifSayi}
          </span>
        )}
      </Button>
      {acik && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAcik(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-64 space-y-3 rounded-xl border bg-popover p-4 shadow-lg">
            {sorular.map((s) => (
              <SecimAlan key={s.label} {...s} />
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onTemizle()
                setAcik(false)
              }}
            >
              Filtreleri temizle
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function CipGrup<T extends string>({
  secenekler,
  value,
  onChange,
}: {
  secenekler: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {secenekler.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
            value === t
              ? 'border-transparent bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

export function GorunumSec({
  value,
  onChange,
}: {
  value: 'liste' | 'kart'
  onChange: (v: 'liste' | 'kart') => void
}) {
  return (
    <div className="flex items-center rounded-lg border p-0.5">
      {(
        [
          { id: 'liste', ikon: LayoutListIcon, label: 'Liste görünümü' },
          { id: 'kart', ikon: LayoutGridIcon, label: 'Kart görünümü' },
        ] as const
      ).map((v) => (
        <button
          key={v.id}
          type="button"
          aria-label={v.label}
          title={v.label}
          onClick={() => onChange(v.id)}
          className={cn(
            'flex size-6 items-center justify-center rounded-md transition-colors',
            value === v.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <v.ikon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}

// ---------- Tablo ----------

export function SortBaslik<T extends string>({
  label,
  id,
  aktif,
  yon,
  onClick,
  className,
}: {
  label: string
  id: T
  aktif: T
  yon: 1 | -1
  onClick: (s: T) => void
  className?: string
}) {
  const secili = aktif === id
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onClick(id)}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-foreground',
          secili ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
        {secili ? (
          yon === 1 ? (
            <ArrowUpIcon className="size-3" />
          ) : (
            <ArrowDownIcon className="size-3" />
          )
        ) : (
          <ArrowUpDownIcon className="size-3 opacity-40" />
        )}
      </button>
    </th>
  )
}

export function SkeletonTablo() {
  return (
    <div className="space-y-px p-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-3.5 w-12 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3.5 min-w-0 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  )
}

// ---------- İstatistik şeridi ----------

export interface StatOge {
  label: string
  deger: string | number
  delta?: string
  iyi?: boolean
  ikon?: React.ComponentType<{ className?: string }>
}

export function StatSerit({ ogeler }: { ogeler: StatOge[] }) {
  return (
    <div className="grid grid-cols-3 divide-x rounded-xl border bg-card lg:grid-cols-6">
      {ogeler.map((s, i) => (
        <div key={s.label} className={cn('px-3.5 py-2.5', i > 2 && 'border-t lg:border-t-0')}>
          <div className="flex items-center justify-between">
            <p className="truncate text-xs text-muted-foreground">{s.label}</p>
            {s.ikon && <s.ikon className="size-3.5 shrink-0 text-muted-foreground/60" />}
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <p className="text-xl leading-none font-medium tabular-nums">{s.deger}</p>
            {s.delta && (
              <span
                className={cn(
                  'text-[11px] font-medium tabular-nums',
                  s.iyi !== false
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {s.delta}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------- Seçim çubuğu ----------

export function SecimBar({
  adet,
  onAktar,
  onSil,
  silLabel = 'Sil',
  onKapat,
}: {
  adet: number
  onAktar: () => void
  onSil: () => void
  silLabel?: string
  onKapat: () => void
}) {
  return (
    <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-popover px-3 py-1.5 shadow-lg">
      <span className="text-xs font-medium whitespace-nowrap">{adet} kayıt seçildi</span>
      <Button variant="outline" size="xs" onClick={onAktar}>
        <DownloadIcon /> Aktar
      </Button>
      <Button variant="destructive" size="xs" onClick={onSil}>
        <Trash2Icon /> {silLabel}
      </Button>
      <button
        type="button"
        aria-label="Seçimi temizle"
        onClick={onKapat}
        className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}

// ---------- Sayfalama ----------

export function ListeFooter({
  bas,
  son,
  toplam,
  sayfaGuvenli,
  sayfaSayisi,
  sayfaBoyu,
  otoBoy,
  onBoyut,
  onSayfa,
}: {
  bas: number
  son: number
  toplam: number
  sayfaGuvenli: number
  sayfaSayisi: number
  sayfaBoyu: 'oto' | number
  otoBoy: number
  onBoyut: (v: 'oto' | number) => void
  onSayfa: (v: number | ((s: number) => number)) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="tabular-nums">
          {bas}–{son} / {toplam} kayıt
        </span>
        <select
          value={sayfaBoyu}
          onChange={(e) => onBoyut(e.target.value === 'oto' ? 'oto' : Number(e.target.value))}
          aria-label="Sayfa başına kayıt"
          className="h-6 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
        >
          <option value="oto">Otomatik ({otoBoy})</option>
          {[5, 8, 10, 15, 20].map((n) => (
            <option key={n} value={n}>
              {n} / sayfa
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={sayfaGuvenli === 0}
          onClick={() => onSayfa((s) => s - 1)}
          aria-label="Önceki sayfa"
          className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <span className="tabular-nums">
          {sayfaGuvenli + 1}/{sayfaSayisi}
        </span>
        <button
          type="button"
          disabled={sayfaGuvenli >= sayfaSayisi - 1}
          onClick={() => onSayfa((s) => s + 1)}
          aria-label="Sonraki sayfa"
          className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-40"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}

// ---------- Otomatik sayfa boyutu ----------

// useOtoBoy @/lib/use-oto-boy altına taşındı (fast-refresh uyumlu ayrım)
