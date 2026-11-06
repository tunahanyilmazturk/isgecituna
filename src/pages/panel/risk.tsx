import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Building2Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  FileDownIcon,
  FileWarningIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CipGrup, FiltrePopover, GorunumSec, ListeFooter, StatSerit } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { xlsxTekSayfa } from '@/lib/excel'
import { TODAY } from '@/data/dashboard'
import { aksiyonGecikmis, aksiyonAcik, guncelDurum, riskDurumRenk, seviyeRenk, yenilemeYaklasan, type AksiyonDurum, type RiskDegerlendirme, type RiskSeviye } from '@/data/risk'
import { useRiskStore } from '@/stores/risk-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useIzin } from '@/lib/izin'
import { kapsamdaMi, useRiskKapsam } from '@/lib/risk-kapsam'
import { useOtoBoy } from '@/lib/use-oto-boy'

const CIPLER = ['Tümü', 'Taslak', 'İncelemede', 'Onaylandı', 'Revize Edilmeli', 'Süresi Doldu'] as const
type Cip = (typeof CIPLER)[number]

/* ------------------------- Mini grafikler (saf SVG) ------------------------ */

function Donut({ dagilim }: { dagilim: Record<RiskSeviye, number> }) {
  const toplam = Object.values(dagilim).reduce((a, b) => a + b, 0) || 1
  let aci = -90
  const dilimler = (Object.keys(dagilim) as RiskSeviye[]).map((s) => {
    const pay = dagilim[s] / toplam
    const bas = aci
    aci += pay * 360
    return { s, pay, bas }
  })
  const yay = (a0: number, a1: number, r0: number, r1: number) => {
    const p = (a: number, r: number) => `${50 + r * Math.cos((a * Math.PI) / 180)} ${50 + r * Math.sin((a * Math.PI) / 180)}`
    const buyuk = a1 - a0 > 180 ? 1 : 0
    return `M ${p(a0, r1)} A ${r1} ${r1} 0 ${buyuk} 1 ${p(a1, r1)} L ${p(a1, r0)} A ${r0} ${r0} 0 ${buyuk} 0 ${p(a0, r0)} Z`
  }
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="size-28 shrink-0">
        {dilimler.filter((d) => d.pay > 0).map((d) => (
          <path key={d.s} d={yay(d.bas + 0.8, d.bas + d.pay * 360 - 0.8, 30, 46)} fill={seviyeRenk[d.s].hex} />
        ))}
        <text x="50" y="54" textAnchor="middle" className="fill-foreground text-[15px] font-semibold">{toplam}</text>
      </svg>
      <div className="space-y-1.5 text-xs">
        {(Object.keys(dagilim) as RiskSeviye[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: seviyeRenk[s].hex }} />
            <span className="text-muted-foreground">{s}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums">{dagilim[s]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function YatayBarlar({ ogeler, renk }: { ogeler: { etiket: string; deger: number }[]; renk?: (etiket: string) => string }) {
  const max = Math.max(1, ...ogeler.map((o) => o.deger))
  return (
    <div className="space-y-2">
      {ogeler.map((o) => (
        <div key={o.etiket} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 truncate text-muted-foreground" title={o.etiket}>{o.etiket}</span>
          <div className="h-4.5 flex-1 rounded-sm bg-muted/60">
            <div className="h-full rounded-sm transition-all" style={{ width: `${(o.deger / max) * 100}%`, background: renk?.(o.etiket) ?? 'var(--color-sky-500, #0EA5E9)' }} />
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
          <div className="w-full rounded-t-sm bg-emerald-500/80" style={{ height: `${(v.adet / max) * 100}%`, minHeight: v.adet > 0 ? 4 : 2, opacity: v.adet > 0 ? 1 : 0.25 }} />
          <span className="text-[10px] text-muted-foreground">{v.ay}</span>
        </div>
      ))}
    </div>
  )
}

/* --------------------------------- Sayfa ----------------------------------- */

export default function RiskPage() {
  const { degerlendirmeler, tehlikeler, aksiyonlar } = useRiskStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const nav = useNavigate()
  const olusturIzni = useIzin('risk.olustur')
  const aktarIzni = useIzin('risk.aktar')
  const kapsam = useRiskKapsam()

  // Kapsam görünürlüğü — tüm liste/istatistik/grafik bu süzülmüş küme üzerinden
  const { gorunenDeg, gorunenTh, gorunenAk } = useMemo(() => {
    const deg = degerlendirmeler.filter(
      (d) => kapsamdaMi(kapsam, d.firmaId) && (!kapsam.sadeceKendi || d.olusturan === kapsam.kullanici),
    )
    const ids = new Set(deg.map((d) => d.id))
    return {
      gorunenDeg: deg,
      gorunenTh: tehlikeler.filter((t) => ids.has(t.degerlendirmeId)),
      gorunenAk: aksiyonlar.filter((a) => a.degerlendirmeId !== undefined && ids.has(a.degerlendirmeId)),
    }
  }, [degerlendirmeler, tehlikeler, aksiyonlar, kapsam])

  const [cip, setCip] = useState<Cip>('Tümü')
  const [ara, setAra] = useState('')
  const [firmaF, setFirmaF] = useState('Tümü')
  const [tarihF, setTarihF] = useState('Tümü')
  const [gorunum, setGorunum] = useState<'liste' | 'kart'>('liste')
  const [sayfa, setSayfa] = useState(0)
  const [sayfaBoyu, setSayfaBoyu] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy(gorunum, { satirH: 52, baslikH: 120, kartH: 190, kartW: 330 })
  const boyut = sayfaBoyu === 'oto' ? otoBoy : sayfaBoyu

  const aktifTehlike = useMemo(() => gorunenTh.filter((t) => !t.silindi), [gorunenTh])

  const filtreli = useMemo(() => {
    const q = ara.trim().toLowerCase()
    return gorunenDeg.filter((d) => {
      if (cip !== 'Tümü' && guncelDurum(d) !== cip) return false
      if (firmaF !== 'Tümü' && d.firmaId !== firmaF) return false
      if (tarihF === 'Bu yıl' && !d.degerlendirmeTarihi.startsWith(TODAY.slice(0, 4))) return false
      if (tarihF === 'Yenileme yaklaşan' && !yenilemeYaklasan(d)) return false
      if (tarihF === 'Süresi geçmiş' && !(d.durum === 'Onaylandı' && d.yenilemeTarihi < TODAY)) return false
      if (q && ![d.ad, d.firmaAd, d.isyeriAd, d.faaliyet, d.olusturan].some((x) => x.toLowerCase().includes(q))) return false
      return true
    })
  }, [gorunenDeg, cip, firmaF, tarihF, ara])

  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / boyut))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const sayfaVeri = filtreli.slice(sayfaGuvenli * boyut, sayfaGuvenli * boyut + boyut)

  const ozet = (d: RiskDegerlendirme) => ({
    tehlike: aktifTehlike.filter((t) => t.degerlendirmeId === d.id).length,
    acikAksiyon: gorunenAk.filter((a) => a.degerlendirmeId === d.id && aksiyonAcik(a)).length,
  })

  // ---- İstatistikler (yalnız gerçek veri) ----
  const aktifSayi = gorunenDeg.filter((d) => guncelDurum(d) === 'Onaylandı').length
  const yaklasanSayi = gorunenDeg.filter((d) => yenilemeYaklasan(d)).length
  const gecmisSayi = gorunenDeg.filter((d) => guncelDurum(d) === 'Süresi Doldu').length
  const acikAksiyonSayi = gorunenAk.filter(aksiyonAcik).length
  const gecikmisSayi = gorunenAk.filter(aksiyonGecikmis).length
  const tamamlananSayi = gorunenAk.filter((a) => a.durum === 'Tamamlandı').length

  const seviyeDagilim = useMemo(() => {
    const m: Record<RiskSeviye, number> = { 'Düşük': 0, 'Orta': 0, 'Yüksek': 0, 'Çok Yüksek': 0 }
    for (const t of aktifTehlike) m[t.seviye]++
    return m
  }, [aktifTehlike])

  const aksiyonDagilim = useMemo(() => {
    const m: Record<AksiyonDurum, number> = { 'Bekliyor': 0, 'Devam Ediyor': 0, 'Kontrol Bekliyor': 0, 'Tamamlandı': 0, 'İptal Edildi': 0 }
    for (const a of gorunenAk) m[a.durum]++
    return m
  }, [gorunenAk])

  const aylikTamamlanan = useMemo(() => {
    const aylar: { ay: string; adet: number }[] = []
    const simdi = new Date(TODAY)
    for (let i = 5; i >= 0; i--) {
      const t = new Date(simdi.getFullYear(), simdi.getMonth() - i, 1)
      const anahtar = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`
      aylar.push({
        ay: t.toLocaleDateString('tr-TR', { month: 'short' }),
        adet: gorunenAk.filter((a) => a.tamamlanmaTarihi?.startsWith(anahtar)).length,
      })
    }
    return aylar
  }, [gorunenAk])

  const gorunenFirmalar = useMemo(() => firmalar.filter((f) => kapsamdaMi(kapsam, f.id)), [firmalar, kapsam])

  const firmaAcik = useMemo(() =>
    gorunenFirmalar
      .map((f) => ({ etiket: f.kisaAd, deger: gorunenAk.filter((a) => a.firmaId === f.id && aksiyonAcik(a)).length }))
      .filter((f) => f.deger > 0)
      .sort((a, b) => b.deger - a.deger)
      .slice(0, 6),
  [gorunenFirmalar, gorunenAk])

  const filtreAktif = (firmaF !== 'Tümü' ? 1 : 0) + (tarihF !== 'Tümü' ? 1 : 0)

  const excelAktar = () =>
    xlsxTekSayfa('risk-degerlendirmeler', {
      ad: 'Değerlendirmeler',
      baslik: 'Risk Değerlendirmeleri',
      altBilgi: `${filtreli.length} kayıt`,
      kolonlar: [
        { label: 'Değerlendirme', tip: 'metin' }, { label: 'Firma', tip: 'metin' },
        { label: 'Tehlike Sınıfı', tip: 'metin' }, { label: 'Faaliyet', tip: 'metin' },
        { label: 'Değerlendirme Tarihi', tip: 'tarih' }, { label: 'Yenileme Tarihi', tip: 'tarih' },
        { label: 'Hazırlayan', tip: 'metin' }, { label: 'Tehlike', tip: 'sayi' },
        { label: 'Açık Aksiyon', tip: 'sayi' }, { label: 'Durum', tip: 'metin' },
      ],
      satirlar: filtreli.map((d) => {
        const o = ozet(d)
        return [d.ad, d.firmaAd, d.tehlikeSinifi, d.faaliyet, d.degerlendirmeTarihi, d.yenilemeTarihi, d.olusturan, o.tehlike, o.acikAksiyon, guncelDurum(d)]
      }),
    })

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      {/* Başlık + aksiyonlar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="text-lg font-semibold tracking-tight">Risk Değerlendirme</h1>
          <p className="text-xs text-muted-foreground">Firmalara ait risk değerlendirmeleri, tehlike kayıtları ve önlem aksiyonları</p>
        </div>
        {aktarIzni && (
          <Button variant="outline" size="sm" onClick={() => void excelAktar()}>
            <FileDownIcon /> Excel
          </Button>
        )}
        {olusturIzni && (
          <Button size="sm" onClick={() => nav('/panel/risk/yeni')}>
            <PlusIcon /> Yeni Değerlendirme
          </Button>
        )}
      </div>

      {/* İstatistik şeridi */}
      <StatSerit
        ogeler={[
          { label: 'Toplam', deger: gorunenDeg.length, ikon: ShieldAlertIcon },
          { label: 'Aktif (onaylı)', deger: aktifSayi, ikon: CheckCircle2Icon },
          { label: 'Yenileme yaklaşan', deger: yaklasanSayi, ikon: CalendarClockIcon },
          { label: 'Süresi geçmiş', deger: gecmisSayi, ikon: FileWarningIcon },
          { label: 'Açık aksiyon', deger: acikAksiyonSayi },
          { label: 'Gecikmiş aksiyon', deger: gecikmisSayi, delta: gecikmisSayi > 0 ? '!' : undefined, iyi: gecikmisSayi === 0 },
        ]}
      />

      {/* Grafikler */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Risk seviyesi dağılımı · {aktifTehlike.length} tehlike</p>
          <Donut dagilim={seviyeDagilim} />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Aksiyon durumları · {gorunenAk.length} kayıt</p>
          <YatayBarlar
            ogeler={Object.entries(aksiyonDagilim).map(([etiket, deger]) => ({ etiket, deger }))}
            renk={(e) => ({ 'Bekliyor': '#71717A', 'Devam Ediyor': '#0EA5E9', 'Kontrol Bekliyor': '#8B5CF6', 'Tamamlandı': '#10B981', 'İptal Edildi': '#3F3F46' })[e] ?? '#0EA5E9'}
          />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Aylık tamamlanan aksiyon · {tamamlananSayi} toplam</p>
          <AylikBar veri={aylikTamamlanan} />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Firmaya göre açık aksiyon</p>
          <YatayBarlar ogeler={firmaAcik} renk={() => '#F59E0B'} />
        </div>
      </div>

      {/* Araç çubuğu */}
      <div className="flex flex-wrap items-center gap-2">
        <CipGrup secenekler={CIPLER} value={cip} onChange={(v) => { setCip(v); setSayfa(0) }} />
        <div className="relative ml-auto w-56">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => { setAra(e.target.value); setSayfa(0) }}
            placeholder="Değerlendirme, firma, işyeri ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <FiltrePopover
          aktifSayi={filtreAktif}
          onTemizle={() => { setFirmaF('Tümü'); setTarihF('Tümü'); setSayfa(0) }}
          sorular={[
            { label: 'Firma', value: gorunenFirmalar.find((f) => f.id === firmaF)?.kisaAd ?? 'Tümü', options: ['Tümü', ...gorunenFirmalar.map((f) => f.kisaAd)], onChange: (v) => { setFirmaF(gorunenFirmalar.find((f) => f.kisaAd === v)?.id ?? 'Tümü'); setSayfa(0) } },
            { label: 'Tarih', value: tarihF, options: ['Tümü', 'Bu yıl', 'Yenileme yaklaşan', 'Süresi geçmiş'], onChange: (v) => { setTarihF(v); setSayfa(0) } },
          ]}
        />
        <GorunumSec value={gorunum} onChange={setGorunum} />
      </div>

      {/* Liste / kart */}
      <div ref={alanRef} className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card">
        {gorunum === 'liste' ? (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b bg-card text-left">
              <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:text-xs [&>th]:font-medium [&>th]:text-muted-foreground">
                <th>Değerlendirme</th>
                <th>Firma</th>
                <th>Sınıf</th>
                <th className="hidden xl:table-cell">Faaliyet</th>
                <th>Tarih</th>
                <th>Yenileme</th>
                <th className="hidden lg:table-cell">Hazırlayan</th>
                <th className="text-center">Tehlike</th>
                <th className="text-center">Açık aks.</th>
                <th className="text-right">Durum</th>
              </tr>
            </thead>
            <tbody>
              {sayfaVeri.map((d) => {
                const o = ozet(d)
                const gu = guncelDurum(d)
                return (
                  <tr
                    key={d.id}
                    onClick={() => nav(`/panel/risk/${d.id}`)}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40 [&>td]:px-3 [&>td]:py-3"
                  >
                    <td>
                      <p className="font-medium">{d.ad}</p>
                      <p className="text-xs text-muted-foreground">{d.isyeriAd} · v{d.surum}</p>
                    </td>
                    <td className="text-muted-foreground">{d.firmaAd}</td>
                    <td>
                      {d.tehlikeSinifi && (
                        <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                          d.tehlikeSinifi === 'Çok Tehlikeli' ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : d.tehlikeSinifi === 'Tehlikeli' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400')}>
                          {d.tehlikeSinifi}
                        </span>
                      )}
                    </td>
                    <td className="hidden max-w-44 truncate text-xs text-muted-foreground xl:table-cell">{d.faaliyet}</td>
                    <td className="text-xs whitespace-nowrap text-muted-foreground">{d.degerlendirmeTarihi}</td>
                    <td className="text-xs whitespace-nowrap">
                      <span className={gu === 'Süresi Doldu' ? 'font-medium text-red-500' : yenilemeYaklasan(d) ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                        {d.yenilemeTarihi}
                      </span>
                    </td>
                    <td className="hidden text-xs text-muted-foreground lg:table-cell">{d.olusturan}</td>
                    <td className="text-center tabular-nums">{o.tehlike}</td>
                    <td className="text-center">
                      <span className={cn('tabular-nums', o.acikAksiyon > 0 && 'font-semibold text-amber-600 dark:text-amber-400')}>{o.acikAksiyon}</span>
                    </td>
                    <td className="text-right">
                      <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', riskDurumRenk[gu])}>{gu}</span>
                    </td>
                  </tr>
                )
              })}
              {sayfaVeri.length === 0 && (
                <tr><td colSpan={10} className="py-16 text-center text-sm text-muted-foreground">Kriterlere uygun değerlendirme bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {sayfaVeri.map((d) => {
              const o = ozet(d)
              const gu = guncelDurum(d)
              return (
                <button
                  key={d.id}
                  onClick={() => nav(`/panel/risk/${d.id}`)}
                  className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{d.ad}</p>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', riskDurumRenk[gu])}>{gu}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Building2Icon className="size-3" />{d.firmaAd} · {d.isyeriAd}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{o.tehlike} tehlike</span>
                    <span className={o.acikAksiyon > 0 ? 'font-medium text-amber-600 dark:text-amber-400' : ''}>{o.acikAksiyon} açık aksiyon</span>
                    <span className="ml-auto">{d.degerlendirmeTarihi}</span>
                  </div>
                </button>
              )
            })}
            {sayfaVeri.length === 0 && <p className="col-span-full py-16 text-center text-sm text-muted-foreground">Kriterlere uygun değerlendirme bulunamadı.</p>}
          </div>
        )}
        <ListeFooter
          bas={sayfaGuvenli * boyut + (filtreli.length ? 1 : 0)}
          son={Math.min(filtreli.length, sayfaGuvenli * boyut + boyut)}
          toplam={filtreli.length}
          sayfaGuvenli={sayfaGuvenli}
          sayfaSayisi={sayfaSayisi}
          sayfaBoyu={sayfaBoyu}
          otoBoy={otoBoy}
          onBoyut={setSayfaBoyu}
          onSayfa={setSayfa}
        />
      </div>

    </div>
  )
}
