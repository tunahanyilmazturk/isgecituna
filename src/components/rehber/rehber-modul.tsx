import { Link } from 'react-router'
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  ListChecksIcon,
  TimerIcon,
} from 'lucide-react'
import { modulGetir, rotaKapsamdaMi, type RehberKapsam } from '@/data/rehber'
import { modulRehberleri, rehberDurum, useRehberStore } from '@/stores/rehber-store'
import { Bolum, DurumRozeti, Sss, SureRozeti } from './rehber-bits'

function SagPanel({
  basliklar,
  modulRota,
  rotaAcik,
  iliskili,
  kok,
}: {
  basliklar: { id: string; ad: string }[]
  modulRota?: string
  rotaAcik: boolean
  iliskili?: { id: string; ad: string }[]
  kok: string
}) {
  return (
    <div className="sticky top-4 space-y-5">
      {modulRota && !rotaAcik && (
        <p className="rounded-xl border border-dashed px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Bu modülün ekranı başka bir portalda — ilgili hesap türüyle giriş yapıldığında
          kullanılabilir.
        </p>
      )}
      {modulRota && rotaAcik && (
        <Link
          to={modulRota}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-500"
        >
          Modüle git <ExternalLinkIcon className="size-3.5" />
        </Link>
      )}
      <div>
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          Bu sayfada
        </p>
        <ul className="mt-2 space-y-1 border-l pl-3">
          {basliklar.map((b) => (
            <li key={b.id}>
              <a
                href={`#${b.id}`}
                className="block py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {b.ad}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {iliskili && iliskili.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            İlgili modüller
          </p>
          <ul className="mt-2 space-y-1">
            {iliskili.map((m) => (
              <li key={m.id}>
                <Link
                  to={`${kok}/${m.id}`}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {m.ad} <ArrowRightIcon className="size-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function RehberModul({
  kapsam,
  kok,
  modulId,
}: {
  kapsam: RehberKapsam
  kok: string
  modulId: string
}) {
  const store = useRehberStore()
  const m = modulGetir(modulId)
  if (!m || !m.kapsam.includes(kapsam)) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-lg font-medium">Modül bulunamadı</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Bu rehber mevcut değil veya hesabınızın erişim kapsamında değil.
        </p>
        <Link to={kok} className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-600 hover:underline dark:text-amber-400">
          Kullanım Merkezi'ne dön <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    )
  }

  const rehberler = modulRehberleri(m, store)
  const iliskili = (m.iliskili ?? [])
    .map((id) => modulGetir(id))
    .filter((x): x is NonNullable<typeof x> => !!x && x.kapsam.includes(kapsam))
  const rotaAcik = rotaKapsamdaMi(m.rota, kapsam)
  const basliklar = [
    { id: 'nedir', ad: 'Nedir?' },
    ...(m.sekmeler?.length ? [{ id: 'sekmeler', ad: 'Sekmeler' }] : []),
    ...(rehberler.length ? [{ id: 'rehberler', ad: 'Kullanım rehberleri' }] : []),
    ...(m.sss.length ? [{ id: 'sss', ad: 'Sık sorulan sorular' }] : []),
    ...(m.yakinda?.length ? [{ id: 'yakinda', ad: 'Yakında' }] : []),
  ]

  return (
    <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[1fr_210px]">
      <div className="min-w-0 max-w-3xl">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
            <m.ikon className="size-5.5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{m.ad}</h1>
            <p className="text-sm text-muted-foreground">{m.aciklama}</p>
          </div>
        </div>

        <section className="mt-8 space-y-3">
          <Bolum id="nedir">{m.ad} nedir?</Bolum>
          <p className="text-sm leading-relaxed text-muted-foreground">{m.nedir}</p>
          <dl className="grid gap-3 rounded-xl border bg-card/60 p-4 sm:grid-cols-2">
            {m.neZaman && (
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Ne zaman kullanılır?
                </dt>
                <dd className="mt-1 text-sm">{m.neZaman}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Kimler kullanabilir?
              </dt>
              <dd className="mt-1 text-sm">{m.kimler}</dd>
            </div>
          </dl>
        </section>

        {m.sekmeler && m.sekmeler.length > 0 && (
          <section className="mt-8">
            <Bolum id="sekmeler">Sekmeler ve görevleri</Bolum>
            <ul className="mt-3 divide-y rounded-xl border">
              {m.sekmeler.map((s) => (
                <li key={s.ad} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <ListChecksIcon className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{s.ad}</p>
                    <p className="text-sm text-muted-foreground">{s.gorev}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {rehberler.length > 0 && (
          <section className="mt-8">
            <Bolum id="rehberler">Kullanım rehberleri</Bolum>
            <div className="mt-3 space-y-2.5">
              {rehberler.map((r) => (
                <Link
                  key={r.id}
                  to={`${kok}/${m.id}/${r.id}`}
                  className="group flex items-center gap-4 rounded-xl border bg-card/60 px-4 py-3.5 transition-colors hover:border-amber-400/50 hover:bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      {r.baslik} <DurumRozeti durum={rehberDurum(store.durumlar, r.id)} />
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{r.aciklama}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{r.adimlar.length} adım</span>
                    <SureRozeti dk={r.sure} />
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {m.sss.length > 0 && (
          <section className="mt-8">
            <Bolum id="sss">Sık sorulan sorular</Bolum>
            <div className="mt-3">
              <Sss liste={m.sss} />
            </div>
          </section>
        )}

        {m.yakinda && m.yakinda.length > 0 && (
          <section className="mt-8">
            <Bolum id="yakinda">Yakında</Bolum>
            <ul className="mt-3 space-y-2">
              {m.yakinda.map((y) => (
                <li
                  key={y}
                  className="flex items-start gap-2.5 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground"
                >
                  <TimerIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  {y}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Bu özellikler geliştirme aşamasındadır; yayına alındığında rehberleri burada listelenir.
            </p>
          </section>
        )}
      </div>

      <aside className="hidden xl:block">
        <SagPanel
          basliklar={basliklar}
          modulRota={m.rota}
          rotaAcik={rotaAcik}
          iliskili={iliskili.map((x) => ({ id: x.id, ad: x.ad }))}
          kok={kok}
        />
      </aside>
    </div>
  )
}
