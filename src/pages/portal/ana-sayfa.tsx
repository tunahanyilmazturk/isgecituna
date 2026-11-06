import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AwardIcon,
  Building2Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  GraduationCapIcon,
  LightbulbIcon,
  PlayIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserRoundIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatUzun } from '@/lib/date'
import { kalanGunMetni, gununIpucu, selamlama } from '@/lib/katilimci'
import { sertifikaPdfIndirV2 } from '@/lib/sertifika-render'
import { kisiDurumRenk } from '@/data/personeller'
import { TODAY } from '@/data/dashboard'
import { sertifikaGuncelDurum } from '@/data/sertifikalar'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { kdEtiket, oynatYolu, useAtamalarim, useBen } from '@/pages/portal/portal-ortak'

type Ton = 'amber' | 'emerald' | 'violet' | 'orange'

const tonRenk: Record<Ton, string> = {
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

function OzetKart({ ikon: Ikon, deger, etiket, ton }: { ikon: typeof AwardIcon; deger: number; etiket: string; ton: Ton }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', tonRenk[ton])}>
        <Ikon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl leading-none font-semibold tabular-nums">{deger}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{etiket}</p>
      </div>
    </div>
  )
}

function IlerlemeCubugu({ yuzde, tamam }: { yuzde: number; tamam?: boolean }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
      <div className={cn('h-full rounded-full transition-[width]', tamam ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${yuzde}%` }} />
    </div>
  )
}

/** Katılımcı ana sayfası: sıradaki eğitim, özet, son tarihler, İSG ekibi, son sertifika ve günün ipucu */
export function PortalDashboard() {
  const navigate = useNavigate()
  const { user, p, pid } = useBen()
  const firma = useFirmalarStore((s) => s.firmalar.find((f) => f.id === p?.firmaId))
  const liste = useAtamalarim(pid)
  const sertifikalar = useSertifikaStore((s) => s.sertifikalar)

  const acik = liste.filter((x) => x.kd !== 'Tamamlandı')
  const hero = acik[0]
  const tamamlanan = liste.filter((x) => x.kd === 'Tamamlandı').length
  const devamEden = liste.filter((x) => x.kd === 'Devam Ediyor' || x.kd === 'Onay Bekliyor').length

  const benimSertifikalar = useMemo(
    () =>
      sertifikalar
        .filter((s) => s.personelId === pid)
        .sort((x, y) => y.duzenlenmeTarihi.localeCompare(x.duzenlenmeTarihi)),
    [sertifikalar, pid],
  )
  const gecerliSertifika = benimSertifikalar.filter((s) => sertifikaGuncelDurum(s) === 'Aktif').length
  const sonSertifika = benimSertifikalar[0]

  const ilkAd = user?.name?.split(' ')[0] ?? ''
  const [saat] = useState(() => new Date().getHours())
  const selam = selamlama(saat)
  const ekip = [
    firma?.uzman && { ikon: ShieldCheckIcon, rol: 'İSG uzmanı', ad: `${firma.uzman}${firma.uzmanSinifi ? ` · ${firma.uzmanSinifi} sınıfı` : ''}` },
    firma?.hekim && { ikon: StethoscopeIcon, rol: 'İşyeri hekimi', ad: firma.hekim },
    firma?.dsp && { ikon: UserRoundIcon, rol: 'Diğer sağlık personeli', ad: firma.dsp },
  ].filter(Boolean) as { ikon: typeof ShieldCheckIcon; rol: string; ad: string }[]

  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-8">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{formatUzun(TODAY)}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        {selam}, {ilkAd}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Building2Icon className="size-4" />
        {firma?.unvan ?? 'Firma bilgisi yok'}
        <span aria-hidden>·</span>
        {p?.departman || 'Departman belirtilmedi'}
        {p?.gorev && (
          <>
            <span aria-hidden>·</span>
            {p.gorev}
          </>
        )}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {hero ? (
            <section className="overflow-hidden rounded-2xl border bg-card">
              <div className={cn('relative h-36 bg-gradient-to-br', hero.eg?.kapakTon)}>
                {hero.eg?.kapakGorsel && <img src={hero.eg.kapakGorsel} alt="" className="absolute inset-0 size-full object-cover" />}
                {hero.eg?.kapakGorsel && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />}
                <p className="absolute top-4 left-5 text-[11px] font-medium tracking-widest text-white/85 uppercase">Sıradaki eğitim</p>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn('rounded-full px-2 py-0.5 font-medium', kisiDurumRenk[hero.kd])}>{kdEtiket(hero.kd)}</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <CalendarClockIcon className="size-3.5" />
                    Son tarih {hero.a.sonTarih} · {kalanGunMetni(hero.a.sonTarih)}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{hero.eg?.baslik}</h2>
                {hero.siradaki ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sıradaki ders: <span className="font-medium text-foreground">{hero.siradaki.icerik.baslik}</span>
                    <span aria-hidden> · </span>
                    {hero.siradaki.bolumBaslik}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Tüm dersleri bitirdiniz; sınav veya onay adımı bekleniyor.</p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <IlerlemeCubugu yuzde={hero.yuzde} />
                  <span className="text-xs tabular-nums text-muted-foreground">%{hero.yuzde}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {hero.kalanDk > 0 ? `Tahmini kalan süre ${hero.kalanDk} dk` : 'Kalan ders süresi yok'}
                  </p>
                  <Button size="sm" onClick={() => navigate(oynatYolu(hero.a.egitimId, hero.a.id))}>
                    <PlayIcon /> {hero.yuzde > 0 ? 'Kaldığın yerden devam et' : 'Eğitime başla'}
                  </Button>
                </div>
              </div>
            </section>
          ) : liste.length > 0 ? (
            <section className="flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <CheckCircle2Icon className="size-8 shrink-0 text-emerald-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Tüm atanan eğitimleri tamamladınız</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Belgelerinize “Sertifikalarım” sayfasından ulaşabilirsiniz.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/portal/sertifikalar')}>
                Sertifikalarım
              </Button>
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed py-14 text-center">
              <GraduationCapIcon className="mx-auto size-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium">Henüz size atanmış bir eğitim yok</p>
              <p className="mt-1 text-xs text-muted-foreground">Atamalar yapıldığında eğitimleriniz burada görünecek.</p>
            </section>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
          <OzetKart ikon={GraduationCapIcon} deger={liste.length} etiket="Atanan eğitim" ton="amber" />
          <OzetKart ikon={CheckCircle2Icon} deger={tamamlanan} etiket="Tamamlanan" ton="emerald" />
          <OzetKart ikon={PlayIcon} deger={devamEden} etiket="Devam eden" ton="violet" />
          <OzetKart ikon={AwardIcon} deger={gecerliSertifika} etiket="Geçerli sertifika" ton="orange" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="self-start rounded-2xl border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <h2 className="text-sm font-semibold">Açık eğitimler · son tarihe göre</h2>
            <Button size="sm" variant="ghost" onClick={() => navigate('/portal/egitimler')}>
              Tümünü gör
            </Button>
          </div>
          {acik.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">Açık eğitiminiz bulunmuyor.</p>
          ) : (
            <ul className="divide-y">
              {acik.slice(0, 5).map((x) => (
                <li key={x.a.id}>
                  <button
                    type="button"
                    onClick={() => navigate(oynatYolu(x.a.egitimId, x.a.id))}
                    className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{x.eg?.baslik}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <IlerlemeCubugu yuzde={x.yuzde} />
                        <span className="text-[11px] tabular-nums text-muted-foreground">%{x.yuzde}</span>
                      </div>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-xs tabular-nums">{x.a.sonTarih}</p>
                      <p className="text-[11px] text-muted-foreground">{kalanGunMetni(x.a.sonTarih)}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', kisiDurumRenk[x.kd])}>{kdEtiket(x.kd)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-4">
          {ekip.length > 0 && (
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold">İSG ekibin</h2>
              <ul className="mt-3 space-y-3">
                {ekip.map((e) => (
                  <li key={e.rol} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <e.ikon className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.ad}</p>
                      <p className="text-[11px] text-muted-foreground">{e.rol}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-muted-foreground">Sorularınız için İSG uzmanınıza ulaşabilirsiniz.</p>
            </section>
          )}

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Son sertifikan</h2>
            {sonSertifika ? (
              <div className="mt-3">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: `linear-gradient(135deg, ${sonSertifika.sablonSnap.anaRenk}, ${sonSertifika.sablonSnap.vurguRenk})` }}
                  >
                    <AwardIcon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{sonSertifika.egitimAd}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{sonSertifika.sertifikaNo} · {sonSertifika.duzenlenmeTarihi}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/portal/sertifikalar/${sonSertifika.id}`)}>
                    <EyeIcon /> Görüntüle
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => sertifikaPdfIndirV2(sonSertifika)}>
                    <DownloadIcon /> PDF
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Bir eğitimi tamamladığınızda sertifikanız burada görünecek.</p>
            )}
          </section>

          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <LightbulbIcon className="size-4" /> Günün ipucu
            </p>
            <p className="mt-2 text-sm leading-relaxed">{gununIpucu(TODAY)}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
