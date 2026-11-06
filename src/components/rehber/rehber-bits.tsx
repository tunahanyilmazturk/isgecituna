import { useState } from 'react'
import {
  ChevronDownIcon,
  ClockIcon,
  ImageOffIcon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
  ZoomInIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RehberAdim, RehberDurum } from '@/data/rehber'
import { gorselAnahtar, useRehberStore } from '@/stores/rehber-store'

/* --------------------------- süre / durum rozeti --------------------------- */

export const SureRozeti = ({ dk }: { dk: number }) => (
  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
    <ClockIcon className="size-3" /> ~{dk} dk
  </span>
)

export const DurumRozeti = ({ durum }: { durum: RehberDurum }) =>
  durum === 'Yayında' ? null : (
    <span
      className={cn(
        'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
        durum === 'Taslak'
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          : 'bg-zinc-500/15 text-zinc-500',
      )}
    >
      {durum}
    </span>
  )

/* ------------------------------ ekran görüntüsü ----------------------------- */

export function RehberGorsel({
  rehberId,
  adimIdx,
  adim,
}: {
  rehberId: string
  adimIdx: number
  adim: RehberAdim
}) {
  const [acik, setAcik] = useState(false)
  const [hata, setHata] = useState(false)
  const ozel = useRehberStore((s) => s.gorseller[gorselAnahtar(rehberId, adimIdx)])
  const src = ozel ?? (adim.gorsel ? `/rehber/${adim.gorsel}` : undefined)

  const isaretKatmani = (buyuk = false) =>
    adim.isaretler?.map((i) => (
      <span
        key={i.no ?? `${i.x}-${i.y}`}
        title={i.aciklama}
        className={cn(
          'absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-400 font-bold text-zinc-950 shadow-lg ring-2 ring-zinc-950/60',
          buyuk ? 'size-7 text-sm' : 'size-5 text-[10px]',
        )}
        style={{ left: `${i.x}%`, top: `${i.y}%` }}
      >
        {i.no ?? '•'}
      </span>
    ))

  if (!src || hata) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground">
        <ImageOffIcon className="size-4" />
        {src ? 'Görsel yüklenemedi' : 'Ekran görüntüsü hazırlanıyor'}
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="group relative block w-full overflow-hidden rounded-xl border text-left"
        aria-label="Görseli büyüt"
      >
        <img
          src={src}
          alt={adim.baslik}
          loading="lazy"
          onError={() => setHata(true)}
          className="w-full bg-muted object-cover"
        />
        {isaretKatmani()}
        <span className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-lg bg-zinc-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomInIcon className="size-3.5" />
        </span>
      </button>
      {adim.isaretler?.some((i) => i.aciklama) && (
        <ol className="mt-2 space-y-0.5">
          {adim.isaretler
            .filter((i) => i.aciklama)
            .map((i) => (
              <li key={i.no} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex size-4 items-center justify-center rounded-full bg-amber-400/15 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                  {i.no}
                </span>
                {i.aciklama}
              </li>
            ))}
        </ol>
      )}
      {acik && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4"
          onClick={() => setAcik(false)}
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            onClick={() => setAcik(false)}
          >
            <XIcon className="size-5" />
          </button>
          <div className="relative max-h-[90vh] max-w-6xl">
            <img
              src={src}
              alt={adim.baslik}
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
            {isaretKatmani(true)}
          </div>
        </div>
      )}
    </>
  )
}

/* ------------------------------ ipucu / dikkat ------------------------------ */

export const Ipucu = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3.5 py-2.5 text-sm">
    <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
    <span className="text-amber-900 dark:text-amber-200/90">{children}</span>
  </div>
)

export const Dikkat = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3.5 py-2.5 text-sm">
    <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
    <span className="text-red-900 dark:text-red-200/90">{children}</span>
  </div>
)

/* ---------------------------------- SSS ----------------------------------- */

export function Sss({ liste }: { liste: { soru: string; cevap: string }[] }) {
  const [acik, setAcik] = useState<number | null>(null)
  return (
    <div className="divide-y rounded-xl border">
      {liste.map((s, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setAcik(acik === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50"
          >
            {s.soru}
            <ChevronDownIcon
              className={cn('size-4 shrink-0 text-muted-foreground transition-transform', acik === i && 'rotate-180')}
            />
          </button>
          {acik === i && (
            <p className="px-4 pb-3.5 text-sm leading-relaxed text-muted-foreground">{s.cevap}</p>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------- bölüm başlığı ------------------------------ */

export const Bolum = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="scroll-mt-20 text-lg font-semibold tracking-tight">
    {children}
  </h2>
)
