import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowLeftIcon,
  FileBarChartIcon,
  FileDownIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { xlsxTekSayfa } from '@/lib/excel'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import { ayKisa, formatKisa, gunFarki, sonAylar } from '@/lib/date'
import { ONEMLER, bulguDurumRenk, onemRenk, puanHesapla } from '@/data/denetimler'
import { aksiyonAcik, aksiyonGecikmis } from '@/data/risk'
import { useDenetimlerStore } from '@/stores/denetimler-store'
import { useRiskStore } from '@/stores/risk-store'
import { useIzin } from '@/lib/izin'
import { kapsamdaMi, useKapsam } from '@/lib/kapsam'

const onemHex: Record<string, string> = { Düşük: '#71717A', Orta: '#F59E0B', Yüksek: '#F97316', Kritik: '#EF4444' }

function YatayBarlar({ ogeler, renk }: { ogeler: { etiket: string; deger: number }[]; renk?: (e: string) => string }) {
  const max = Math.max(1, ...ogeler.map((o) => o.deger))
  return (
    <div className="space-y-2">
      {ogeler.map((o) => (
        <div key={o.etiket} className="flex items-center gap-2 text-xs">
          <span className="w-32 shrink-0 truncate text-muted-foreground" title={o.etiket}>{o.etiket}</span>
          <div className="h-4.5 flex-1 rounded-sm bg-muted/60">
            <div className="h-full rounded-sm transition-all" style={{ width: `${(o.deger / max) * 100}%`, background: renk?.(o.etiket) ?? '#F59E0B' }} />
          </div>
          <span className="w-6 text-right font-medium tabular-nums">{o.deger}</span>
        </div>
      ))}
      {ogeler.length === 0 && <p className="text-xs text-muted-foreground">Veri yok</p>}
    </div>
  )
}

function AylikBar({ veri }: { veri: { ay: string; adet: number }[] }) {
  const max = Math.max(1, ...veri.map((v) => v.adet))
  return (
    <div className="flex h-28 items-end gap-2">
      {veri.map((v) => (
        <div key={v.ay} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{v.adet > 0 ? v.adet : ''}</span>
          <div className="w-full rounded-t-sm bg-amber-500/80" style={{ height: `${(v.adet / max) * 100}%`, minHeight: v.adet > 0 ? 4 : 2, opacity: v.adet > 0 ? 1 : 0.25 }} />
          <span className="text-[10px] text-muted-foreground">{v.ay}</span>
        </div>
      ))}
    </div>
  )
}

function Kart({ baslik, alt, children }: { baslik: string; alt?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium">{baslik}</h2>
      {alt && <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{alt}</p>}
      {!alt && <div className="mb-3" />}
      {children}
    </div>
  )
}

export default function DenetimRaporlarPage() {
  const nav = useNavigate()
  const { denetimler, bulgular, sablonlar } = useDenetimlerStore()
  const aksiyonlar = useRiskStore((s) => s.aksiyonlar)
  const aktarIzni = useIzin('gorevlendirmeler.aktar')
  const kapsam = useKapsam('denetimler')

  const gorunen = useMemo(() => denetimler.filter((d) => kapsamdaMi(kapsam, d.firmaId) && (!kapsam.sadeceKendi || d.olusturan === kapsam.kullanici)), [denetimler, kapsam])
  const ids = useMemo(() => new Set(gorunen.map((d) => d.id)), [gorunen])
  const gBulgular = useMemo(() => bulgular.filter((b) => ids.has(b.denetimId)), [bulgular, ids])
  const gAksiyonlar = useMemo(() => aksiyonlar.filter((a) => a.kaynak?.tur === 'denetim' && ids.has(a.kaynak.denetimId ?? '')), [aksiyonlar, ids])

  const aylik = useMemo(() => {
    const aylar = sonAylar(TODAY, 6)
    return aylar.map((ym) => ({ ay: ayKisa(ym), adet: gorunen.filter((d) => d.planlananTarih.startsWith(ym)).length }))
  }, [gorunen])

  const turDag = useMemo(() => {
    const m = new Map<string, number>()
    gorunen.forEach((d) => m.set(d.turAd, (m.get(d.turAd) ?? 0) + 1))
    return [...m.entries()].map(([etiket, deger]) => ({ etiket, deger })).sort((a, b) => b.deger - a.deger)
  }, [gorunen])

  const firmaDag = useMemo(() => {
    const m = new Map<string, { denetim: number; bulgu: number }>()
    gorunen.forEach((d) => {
      const e = m.get(d.firmaAd) ?? { denetim: 0, bulgu: 0 }
      e.denetim += 1
      e.bulgu += gBulgular.filter((b) => b.denetimId === d.id).length
      m.set(d.firmaAd, e)
    })
    return [...m.entries()].map(([firma, v]) => ({ firma, ...v })).sort((a, b) => b.denetim - a.denetim)
  }, [gorunen, gBulgular])

  const onemDag = useMemo(() => ONEMLER.map((o) => ({ etiket: o, deger: gBulgular.filter((b) => b.onem === o).length })), [gBulgular])

  const sikBulgu = useMemo(() => {
    const m = new Map<string, number>()
    gBulgular.forEach((b) => {
      const anahtar = b.maddeId ? (gorunen.flatMap((d) => d.maddeler).find((m2) => m2.id === b.maddeId)?.soru ?? b.baslik) : b.baslik
      m.set(anahtar, (m.get(anahtar) ?? 0) + 1)
    })
    return [...m.entries()].map(([etiket, deger]) => ({ etiket, deger })).sort((a, b) => b.deger - a.deger).slice(0, 8)
  }, [gBulgular, gorunen])

  const kapanmaSure = useMemo(() => {
    const sureler = gAksiyonlar.filter((a) => a.durum === 'Tamamlandı' && a.tamamlanmaTarihi).map((a) => gunFarki(a.baslangicTarihi, a.tamamlanmaTarihi!))
    return sureler.length ? Math.round(sureler.reduce((a, b) => a + b, 0) / sureler.length) : null
  }, [gAksiyonlar])

  const puanTrend = useMemo(() => {
    const aylar = sonAylar(TODAY, 6)
    return aylar.map((ym) => {
      const l = gorunen.filter((d) => d.planlananTarih.startsWith(ym) && puanHesapla(d.maddeler) !== undefined)
      const ort = l.length ? Math.round(l.reduce((a, d) => a + (puanHesapla(d.maddeler) ?? 0), 0) / l.length) : null
      return { ay: ayKisa(ym), puan: ort }
    })
  }, [gorunen])

  const gecikmis = gAksiyonlar.filter(aksiyonGecikmis)
  const acikBulgu = gBulgular.filter((b) => b.durum !== 'Kapatıldı' && b.durum !== 'İptal Edildi')

  const excel = () =>
    xlsxTekSayfa('denetim-raporu', {
      ad: 'Denetim Analizi',
      baslik: 'Denetim Raporları ve Analiz',
      altBilgi: 'Gerçek denetim, uygunsuzluk ve aksiyon kayıtlarından hesaplanır',
      kolonlar: [
        { label: 'Metrik', tip: 'metin' },
        { label: 'Değer', tip: 'metin' },
      ],
      satirlar: [
        ['Toplam denetim', gorunen.length],
        ['Planlanan', gorunen.filter((d) => d.durum === 'Planlandı').length],
        ['Devam eden', gorunen.filter((d) => d.durum === 'Devam Ediyor').length],
        ['Tamamlanan', gorunen.filter((d) => d.durum === 'Tamamlandı').length],
        ['Toplam uygunsuzluk', gBulgular.length],
        ['Açık uygunsuzluk', acikBulgu.length],
        ['Denetim aksiyonu', gAksiyonlar.length],
        ['Açık aksiyon', gAksiyonlar.filter(aksiyonAcik).length],
        ['Gecikmiş aksiyon', gecikmis.length],
        ['Ortalama kapanma süresi (gün)', kapanmaSure ?? ''],
        [],
        ['— Firmaya göre denetim —', ''],
        ...firmaDag.map((f) => [f.firma, f.denetim]),
        [],
        ['— Önem dağılımı —', ''],
        ...onemDag.map((o) => [o.etiket, o.deger]),
        [],
        ['— En sık uygunsuzluklar —', ''],
        ...sikBulgu.map((s) => [s.etiket, s.deger]),
      ],
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" onClick={() => nav('/panel/denetimler')} className="mb-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeftIcon className="size-3.5" /> Denetimler
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Denetim raporları ve analiz</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Gerçek denetim, uygunsuzluk ve aksiyon kayıtlarından hesaplanır.</p>
        </div>
        {aktarIzni && (
          <Button variant="outline" size="sm" onClick={excel}><FileDownIcon /> Excel'e aktar</Button>
        )}
      </div>

      {gorunen.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-20">
          <FileBarChartIcon className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Analiz için denetim kaydı gerekiyor — önce denetim oluşturun.</p>
          <Button size="sm" onClick={() => nav('/panel/denetimler/yeni')}>Denetim oluştur</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Kart baslik="Aylara göre denetim" alt="Son 6 ay, planlanan tarihe göre">
              <AylikBar veri={aylik} />
            </Kart>
            <Kart baslik="Denetim puanı trendi" alt="Aylık ortalama — uygun/(uygun+uygunsuz)">
              <div className="flex h-28 items-end gap-2">
                {puanTrend.map((v) => (
                  <div key={v.ay} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{v.puan !== null ? `%${v.puan}` : ''}</span>
                    <div className={cn('w-full rounded-t-sm', (v.puan ?? 0) >= 80 ? 'bg-emerald-500/80' : (v.puan ?? 0) >= 50 ? 'bg-amber-500/80' : 'bg-red-500/70')} style={{ height: `${v.puan ?? 0}%`, minHeight: v.puan !== null ? 4 : 2, opacity: v.puan !== null ? 1 : 0.2 }} />
                    <span className="text-[10px] text-muted-foreground">{v.ay}</span>
                  </div>
                ))}
              </div>
            </Kart>
            <Kart baslik="Denetim türlerine göre dağılım">
              <YatayBarlar ogeler={turDag} />
            </Kart>
            <Kart baslik="Önem seviyelerine göre uygunsuzluk">
              <YatayBarlar ogeler={onemDag} renk={(e) => onemHex[e]} />
            </Kart>
            <Kart baslik="Firmalara göre denetim" alt="Denetim sayısı ve toplam uygunsuzluk">
              <div className="space-y-2.5">
                {firmaDag.map((f) => (
                  <div key={f.firma} className="flex items-center gap-3 text-sm">
                    <span className="w-36 shrink-0 truncate font-medium">{f.firma}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{f.denetim} denetim</span>
                    {f.bulgu > 0 && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">{f.bulgu} uygunsuzluk</span>}
                  </div>
                ))}
              </div>
            </Kart>
            <Kart baslik="Aksiyon sağlığı" alt="Denetimden doğan düzeltici faaliyetler">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['Toplam', gAksiyonlar.length, ''],
                    ['Açık', gAksiyonlar.filter(aksiyonAcik).length, ''],
                    ['Gecikmiş', gecikmis.length, gecikmis.length ? 'text-red-600 dark:text-red-400' : ''],
                  ] as const
                ).map(([l, v, c]) => (
                  <div key={l} className="rounded-lg border bg-background px-3 py-2.5 text-center">
                    <p className={cn('text-xl font-semibold tabular-nums', c)}>{v}</p>
                    <p className="text-[11px] text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Ortalama kapanma süresi: <b className="text-foreground">{kapanmaSure !== null ? `${kapanmaSure} gün` : '—'}</b>
              </p>
              <div className="mt-2 space-y-1">
                {gecikmis.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{a.baslik}</span>
                    <span className="shrink-0 font-medium text-red-600 tabular-nums dark:text-red-400">{gunFarki(a.hedefTarih, TODAY)}g gecikti</span>
                  </div>
                ))}
              </div>
            </Kart>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Kart baslik="En sık karşılaşılan uygunsuzluklar" alt="Madde sorusuna göre gruplanmış">
              <YatayBarlar ogeler={sikBulgu} renk={() => '#F97316'} />
            </Kart>
            <Kart baslik={`Açık uygunsuzluklar (${acikBulgu.length})`}>
              <div className="space-y-2">
                {acikBulgu.slice(0, 8).map((b) => {
                  const d = denetimler.find((x) => x.id === b.denetimId)
                  return (
                    <div key={b.id} className="flex items-center gap-2.5 text-sm">
                      <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium', onemRenk[b.onem])}>{b.onem}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{b.baslik}</p>
                        <p className="text-[11px] text-muted-foreground">{d?.no} · {b.tespitTarihi ? formatKisa(b.tespitTarihi) : ''}</p>
                      </div>
                      <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium', bulguDurumRenk[b.durum])}>{b.durum}</span>
                    </div>
                  )
                })}
                {acikBulgu.length === 0 && <p className="text-xs text-muted-foreground">Açık uygunsuzluk yok.</p>}
              </div>
            </Kart>
          </div>

          <p className="text-xs text-muted-foreground">
            Bu raporlar store'daki gerçek kayıtlardan hesaplanır — <Link to="/panel/denetimler" className="font-medium text-amber-600 hover:underline dark:text-amber-400">denetim listesine dön →</Link>
            {' '}· Şablon sürümleri: {sablonlar.map((s) => `${s.ad} v${s.surum}`).join(', ')}
          </p>
        </>
      )}
    </div>
  )
}
