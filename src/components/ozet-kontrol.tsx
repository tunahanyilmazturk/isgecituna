import { ArrowRightIcon, CheckIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Özet kontrol maddesi: `adim` verilirse madde tıklanabilir ve ilgili sihirbaz adımına götürür */
export interface KontrolMaddesi {
  ok: boolean
  uyari?: boolean
  metin: string
  adim?: number
}

/** Sihirbaz özet adımında kontrol listesi: eksik / uyarı sayısı rozeti ve tıklayınca ilgili adıma gitme */
export function OzetKontrol({ maddeler, onGit }: { maddeler: KontrolMaddesi[]; onGit: (adim: number) => void }) {
  const eksik = maddeler.filter((m) => !m.ok && !m.uyari).length
  const uyari = maddeler.filter((m) => !m.ok && m.uyari).length

  return (
    <section className="flex min-h-0 flex-col rounded-xl border bg-card">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="text-xs font-semibold">Kontrol</h3>
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
            eksik
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : uyari
                ? 'bg-amber-400/20 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
          )}
        >
          {eksik ? `${eksik} eksik` : uyari ? `${uyari} uyarı` : 'Hazır'}
        </span>
      </header>
      <ul className="grid gap-0.5 p-1.5 sm:grid-cols-2">
        {maddeler.map((m) => {
          const icerik = (
            <>
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  m.ok
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : m.uyari
                      ? 'bg-amber-400/25 text-amber-700 dark:text-amber-400'
                      : 'bg-red-500/15 text-red-600 dark:text-red-400',
                )}
                aria-hidden
              >
                {m.ok ? <CheckIcon className="size-2.5" /> : m.uyari ? '!' : <XIcon className="size-2.5" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-left">{m.metin}</span>
              {m.adim !== undefined && <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground/60" aria-hidden />}
            </>
          )
          return (
            <li key={m.metin}>
              {m.adim !== undefined ? (
                <button
                  type="button"
                  onClick={() => onGit(m.adim!)}
                  title="İlgili adıma git"
                  className="flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] transition-colors hover:bg-muted"
                >
                  {icerik}
                </button>
              ) : (
                <div className="flex min-w-0 items-center gap-1.5 px-1.5 py-1 text-[11px]">{icerik}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
