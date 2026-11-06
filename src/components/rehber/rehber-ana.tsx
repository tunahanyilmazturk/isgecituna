import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRightIcon, HelpCircleIcon, SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KATEGORILER, kapsamModulleri, rehberAra, type AramaKayit, type RehberKapsam } from '@/data/rehber'
import { modulRehberleri, useRehberStore } from '@/stores/rehber-store'
import { SureRozeti } from './rehber-bits'

const tipEtiket = { modul: 'Modül', rehber: 'Rehber', sss: 'SSS' } as const
const tipRenk = {
  modul: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  rehber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  sss: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
} as const

function AramaKutusu({ kapsam, kok }: { kapsam: RehberKapsam; kok: string }) {
  const [q, setQ] = useState('')
  const store = useRehberStore()
  const sonuclar = useMemo(
    () => rehberAra(q, kapsam, kok, (m) => modulRehberleri(m, store)),
    [q, kapsam, kok, store],
  )
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nasıl firma eklerim? Eğitim nasıl atanır? Denetim nasıl yapılır?…"
        aria-label="Kullanım rehberinde ara"
        className="h-12 w-full rounded-xl border border-input bg-white/90 pr-4 pl-11 text-sm shadow-sm outline-none backdrop-blur placeholder:text-muted-foreground/70 focus-visible:border-amber-400 dark:bg-zinc-900/80"
      />
      {q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-popover shadow-xl">
          {sonuclar.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              "{q}" için sonuç bulunamadı.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {sonuclar.map((s: AramaKayit) => (
                <li key={`${s.tip}-${s.to}`}>
                  <Link
                    to={s.to}
                    onClick={() => setQ('')}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-accent"
                  >
                    <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', tipRenk[s.tip])}>
                      {tipEtiket[s.tip]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{s.baslik}</span>
                      <span className="block truncate text-xs text-muted-foreground">{s.detay}</span>
                    </span>
                    <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function RehberAna({ kapsam, kok }: { kapsam: RehberKapsam; kok: string }) {
  const store = useRehberStore()
  const moduller = kapsamModulleri(kapsam)
  const populer = moduller.filter((m) => m.populer)

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-400/15 via-amber-500/5 to-transparent px-6 py-8 sm:px-8">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-amber-400/20 blur-3xl" />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">isghub Kullanım Merkezi</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          isghub'u daha verimli kullanmak için ihtiyacınız olan tüm bilgiler, adım adım anlatımlar ve
          uygulama rehberleri burada.
        </p>
        <div className="mt-5">
          <AramaKutusu kapsam={kapsam} kok={kok} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Popüler:</span>
          {populer.slice(0, 5).map((m) => (
            <Link
              key={m.id}
              to={`${kok}/${m.id}`}
              className="rounded-full border bg-card/60 px-2.5 py-1 transition-colors hover:border-amber-400/50 hover:bg-amber-500/10"
            >
              {m.ad}
            </Link>
          ))}
        </div>
      </div>

      {/* Kategori → modül kartları */}
      <div className="mt-8 space-y-8">
        {KATEGORILER.map((k) => {
          const liste = moduller.filter((m) => m.kategori === k.id)
          if (liste.length === 0) return null
          return (
            <section key={k.id}>
              <h2 className="text-base font-semibold">{k.ad}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{k.aciklama}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {liste.map((m) => {
                  const rehberler = modulRehberleri(m, store)
                  const dk = rehberler.reduce((t, r) => t + r.sure, 0)
                  return (
                    <Link
                      key={m.id}
                      to={`${kok}/${m.id}`}
                      className="group rounded-xl border bg-card/60 p-4 transition-colors hover:border-amber-400/50 hover:bg-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400">
                          <m.ikon className="size-4.5" />
                        </span>
                        <ArrowRightIcon className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
                      </div>
                      <p className="mt-3 font-medium">{m.ad}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.aciklama}</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {rehberler.length > 0 ? (
                          <>
                            <span>{rehberler.length} rehber</span>
                            <SureRozeti dk={dk} />
                          </>
                        ) : m.yakinda ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-1.5 py-0.5 font-medium text-zinc-500">
                            <HelpCircleIcon className="size-3" /> Yakında
                          </span>
                        ) : (
                          <span>İçerik hazırlanıyor</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
