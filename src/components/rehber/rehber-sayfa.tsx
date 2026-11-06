import { Link } from 'react-router'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { modulGetir, rotaKapsamdaMi, type RehberKapsam } from '@/data/rehber'
import { modulRehberleri, rehberDurum, rehberGetir, useRehberStore } from '@/stores/rehber-store'
import { Dikkat, DurumRozeti, Ipucu, RehberGorsel, SureRozeti } from './rehber-bits'

export function RehberSayfa({
  kapsam,
  kok,
  modulId,
  rehberId,
}: {
  kapsam: RehberKapsam
  kok: string
  modulId: string
  rehberId: string
}) {
  const store = useRehberStore()
  const m = modulGetir(modulId)
  const r = m ? rehberGetir(modulId, rehberId, store) : undefined

  if (!m || !r || !m.kapsam.includes(kapsam)) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-lg font-medium">Rehber bulunamadı</p>
        <Link to={kok} className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-600 hover:underline dark:text-amber-400">
          Kullanım Merkezi'ne dön <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    )
  }

  const liste = modulRehberleri(m, store)
  const idx = liste.findIndex((x) => x.id === rehberId)
  const onceki = idx > 0 ? liste[idx - 1] : undefined
  const sonraki = idx >= 0 && idx < liste.length - 1 ? liste[idx + 1] : undefined
  const hedefHam = r.rota ?? m.rota
  const hedef = rotaKapsamdaMi(hedefHam, kapsam) ? hedefHam : undefined
  const hedefKapali = hedefHam && !hedef

  return (
    <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[1fr_210px]">
      <div className="min-w-0 max-w-3xl">
        <Link
          to={`${kok}/${m.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" /> {m.ad}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{r.baslik}</h1>
          <DurumRozeti durum={rehberDurum(store.durumlar, r.id)} />
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{r.aciklama}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{r.adimlar.length} adım</span>
          <SureRozeti dk={r.sure} />
        </div>

        {/* Adımlar */}
        <ol className="mt-8 space-y-8">
          {r.adimlar.map((a, i) => (
            <li key={i} id={`adim-${i + 1}`} className="scroll-mt-20">
              <div className="flex items-start gap-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{a.baslik}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.aciklama}</p>
                  <div className="mt-3 space-y-3">
                    <RehberGorsel rehberId={r.id} adimIdx={i} adim={a} />
                    {a.ipucu && <Ipucu>{a.ipucu}</Ipucu>}
                    {a.dikkat && <Dikkat>{a.dikkat}</Dikkat>}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Sonuç + modüle git */}
        {(r.sonuc || hedefHam) && (
          <div className="mt-10 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-400/10 to-transparent p-5">
            {r.sonuc && (
              <div className="flex items-start gap-2.5">
                <CheckCircle2Icon className="mt-0.5 size-4.5 shrink-0 text-emerald-500" />
                <p className="text-sm leading-relaxed">{r.sonuc}</p>
              </div>
            )}
            {hedef && (
              <Link
                to={hedef}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-500',
                  r.sonuc && 'mt-4',
                )}
              >
                {m.ad} modülüne git <ExternalLinkIcon className="size-3.5" />
              </Link>
            )}
            {hedefKapali && (
              <p className={cn('text-xs text-muted-foreground', r.sonuc && 'mt-3')}>
                Bu ekran ilgili portal hesabıyla kullanılabilir — mevcut oturumunuzun erişiminde
                değildir.
              </p>
            )}
          </div>
        )}

        {/* Önceki / Sonraki */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {onceki ? (
            <Link
              to={`${kok}/${m.id}/${onceki.id}`}
              className="group rounded-xl border px-4 py-3 transition-colors hover:border-amber-400/50"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowLeftIcon className="size-3" /> Önceki rehber
              </span>
              <span className="mt-1 block truncate text-sm font-medium">{onceki.baslik}</span>
            </Link>
          ) : (
            <span />
          )}
          {sonraki && (
            <Link
              to={`${kok}/${m.id}/${sonraki.id}`}
              className="group rounded-xl border px-4 py-3 text-right transition-colors hover:border-amber-400/50"
            >
              <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                Sonraki rehber <ArrowRightIcon className="size-3" />
              </span>
              <span className="mt-1 block truncate text-sm font-medium">{sonraki.baslik}</span>
            </Link>
          )}
        </div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-4 space-y-5">
          {hedefKapali && (
            <p className="rounded-xl border border-dashed px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Bu ekran ilgili portal hesabıyla kullanılabilir — mevcut oturumunuzun erişiminde
              değildir.
            </p>
          )}
          {hedef && (
            <Link
              to={hedef}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-500"
            >
              Modüle git <ExternalLinkIcon className="size-3.5" />
            </Link>
          )}
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              Adımlar
            </p>
            <ol className="mt-2 space-y-1 border-l pl-3">
              {r.adimlar.map((a, i) => (
                <li key={i}>
                  <a
                    href={`#adim-${i + 1}`}
                    className="flex items-baseline gap-2 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="text-[10px] font-bold text-amber-500">{i + 1}</span>
                    <span className="truncate">{a.baslik}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  )
}
