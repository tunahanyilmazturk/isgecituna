import { useMemo, useState } from 'react'
import { BarChart3Icon, BuildingIcon, CalendarDaysIcon, DownloadIcon, FlaskConicalIcon, HeartPulseIcon, PackageIcon, ReceiptTextIcon, TrendingUpIcon, UsersIcon, WrenchIcon, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatKisa, gunFarki, gunKaydir } from '@/lib/date'
import { xlsxDosyaAdi, xlsxIndir, type ExcelSayfaDef } from '@/lib/excel'
import { BUGUN, HIZMET_TURLERI, TARAMA_DURUMLARI, TEKLIF_DURUMLARI, TEST_KATEGORILERI, teklifKdvDahil, teklifNet, type Tarama, type TaramaDurum, type Teklif, type TeklifDurum } from '@/data/saglik'
import { useEkipStore } from '@/stores/ekip-store'
import { useEkipmanStore, useFirmaStore, usePersonelKayitStore, useTaramaStore, useTeklifStore, useTestPaketiStore, useTestStore } from '@/stores/saglik-stores'
import { saatAraligi, taramaEksikleri, tarihAraligi } from '@/lib/tarama'

/* --------------------------------- Yardımcılar --------------------------------- */

type Sekme = 'taramalar' | 'teklifler' | 'firmalar' | 'ekip' | 'katalog'
const SEKMELER: { k: Sekme; e: string; ikon: LucideIcon }[] = [
  { k: 'taramalar', e: 'Taramalar', ikon: HeartPulseIcon },
  { k: 'teklifler', e: 'Teklifler', ikon: ReceiptTextIcon },
  { k: 'firmalar', e: 'Firmalar', ikon: BuildingIcon },
  { k: 'ekip', e: 'Ekip & ekipman', ikon: UsersIcon },
  { k: 'katalog', e: 'Katalog', ikon: FlaskConicalIcon },
]

type Donem = 'gecmis' | 'gelecek' | 'tumu'
const DONEMLER: { k: Donem; e: string }[] = [
  { k: 'gecmis', e: 'Geçmiş 30 gün' },
  { k: 'gelecek', e: 'Önümüzdeki 30 gün' },
  { k: 'tumu', e: 'Tümü' },
]

const DURUM_RENK: Record<TaramaDurum, string> = { Planlandı: 'bg-orange-400', 'Devam ediyor': 'bg-amber-400', Tamamlandı: 'bg-emerald-500', İptal: 'bg-zinc-400' }
const TEKLIF_RENK: Record<TeklifDurum, string> = { Taslak: 'bg-zinc-400', Gönderildi: 'bg-orange-400', Onaylandı: 'bg-emerald-500', Reddedildi: 'bg-red-500' }
const PALET = ['bg-amber-400', 'bg-orange-400', 'bg-emerald-500', 'bg-violet-400', 'bg-rose-400', 'bg-teal-400', 'bg-zinc-400']

const tl = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`
const sayi = (n: number) => n.toLocaleString('tr-TR')
const yuzde = (pay: number, payda: number) => (payda > 0 ? Math.round((pay / payda) * 100) : 0)

function donemeUyar(tarih: string, donem: Donem) {
  const fark = gunFarki(BUGUN, tarih)
  if (donem === 'gecmis') return fark < 0 && fark >= -30
  if (donem === 'gelecek') return fark >= 0 && fark <= 30
  return true
}

/* Excel sayfaları */
const ozetSayfasi = (ad: string, satirlar: [string, string][]): ExcelSayfaDef => ({
  ad,
  baslik: `${ad} · özet`,
  kolonlar: [
    { label: 'Gösterge', minGenislik: 36 },
    { label: 'Değer', minGenislik: 20 },
  ],
  satirlar,
})

const tabloSayfasi = (ad: string, baslik: string, kolonlar: ExcelSayfaDef['kolonlar'], satirlar: ExcelSayfaDef['satirlar']): ExcelSayfaDef => ({
  ad,
  baslik,
  altBilgi: `${satirlar.length} kayıt`,
  kolonlar,
  satirlar,
})

/* ----------------------------------- Parçalar ----------------------------------- */

function KpiKarti({ etiket, deger, alt, ikon: Ikon }: { etiket: string; deger: string; alt: string; ikon: LucideIcon }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border bg-card p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{etiket}</p>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-amber-600 dark:text-amber-400">
          <Ikon className="size-3.5" />
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{deger}</p>
      <p className="truncate text-[11px] text-muted-foreground">{alt}</p>
    </div>
  )
}

function Bolum({ baslik, aciklama, children, className }: { baslik: string; aciklama?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border bg-card p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold">{baslik}</h2>
        {aciklama && <span className="truncate text-[11px] text-muted-foreground">{aciklama}</span>}
      </div>
      {children}
    </section>
  )
}

/** Tek satırlık yığın çubuğu + açıklama listesi */
function YiginCubugu({ dilimler }: { dilimler: { etiket: string; deger: number; renk: string }[] }) {
  const toplam = dilimler.reduce((s, d) => s + d.deger, 0)
  if (!toplam) return <p className="py-6 text-center text-xs text-muted-foreground">Veri yok.</p>
  return (
    <div className="space-y-2.5">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={dilimler.map((d) => `${d.etiket} ${d.deger}`).join(', ')}>
        {dilimler
          .filter((d) => d.deger > 0)
          .map((d) => (
            <div key={d.etiket} className={cn('h-full transition-[width] duration-500', d.renk)} style={{ width: `${(d.deger / toplam) * 100}%` }} />
          ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
        {dilimler.map((d) => (
          <li key={d.etiket} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span className={cn('size-2 shrink-0 rounded-full', d.renk)} aria-hidden />
              <span className="truncate">{d.etiket}</span>
            </span>
            <span className="font-semibold tabular-nums">{d.deger}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Yatay çubuk listesi */
function YatayCubuklar({ satirlar, birim }: { satirlar: { etiket: string; deger: number; alt?: string }[]; birim?: (n: number) => string }) {
  if (!satirlar.length) return <p className="py-6 text-center text-xs text-muted-foreground">Veri yok.</p>
  const enBuyuk = Math.max(1, ...satirlar.map((s) => s.deger))
  return (
    <ul className="space-y-2.5">
      {satirlar.map((s) => (
        <li key={s.etiket} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-medium">{s.etiket}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {birim ? birim(s.deger) : sayi(s.deger)}
              {s.alt && <span className="ml-1.5 text-[10px]">{s.alt}</span>}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-amber-400 transition-[width] duration-500" style={{ width: `${(s.deger / enBuyuk) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Haftalık yoğunluk: 8 haftalık kişi sayısı (bugünkü hafta vurgulu) */
function HaftalikYogunluk({ taramalar }: { taramalar: Tarama[] }) {
  const kovalar = Array.from({ length: 8 }, (_, i) => {
    const bas = gunKaydir(BUGUN, -28 + i * 7)
    const son = gunKaydir(bas, 6)
    const liste = taramalar.filter((t) => t.durum !== 'İptal' && t.tarih >= bas && t.tarih <= son)
    return { bas, tarama: liste.length, kisi: liste.reduce((s, t) => s + t.kisiSayisi, 0), bu: i === 4 }
  })
  const enBuyuk = Math.max(1, ...kovalar.map((k) => k.kisi))
  return (
    <div className="flex h-44 items-end gap-2">
      {kovalar.map((k) => (
        <div key={k.bas} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{k.kisi || ''}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn('w-full rounded-t-md transition-[height] duration-500', k.bu ? 'bg-amber-400' : 'bg-zinc-300 dark:bg-zinc-600')}
              style={{ height: `${Math.max(k.kisi ? 6 : 2, (k.kisi / enBuyuk) * 100)}%` }}
              title={`${formatKisa(k.bas)} haftası: ${k.tarama} tarama, ${k.kisi} kişi`}
            />
          </div>
          <span className={cn('truncate text-[10px] tabular-nums', k.bu ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{formatKisa(k.bas).replace(/ \d{4}$/, '')}</span>
        </div>
      ))}
    </div>
  )
}

/** Sekme başlığı: açıklama ve Excel indirme */
function SekmeBasligi({ baslik, aciklama, onIndir, indirilebilir }: { baslik: string; aciklama: string; onIndir: () => void; indirilebilir: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{baslik}</h2>
        <p className="text-[11px] text-muted-foreground">{aciklama}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onIndir} disabled={!indirilebilir}>
        <DownloadIcon /> Excel indir
      </Button>
    </div>
  )
}

/* ----------------------------------- Sayfa ----------------------------------- */

export default function IstatistiklerPage() {
  const [sekme, setSekme] = useState<Sekme>('taramalar')
  const [donem, setDonem] = useState<Donem>('gelecek')

  const taramalar = useTaramaStore((s) => s.kayitlar)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const firmalar = useFirmaStore((s) => s.kayitlar)
  const personeller = usePersonelKayitStore((s) => s.kayitlar)
  const ekipUyeleri = useEkipStore((s) => s.uyeler)
  const ekipmanlar = useEkipmanStore((s) => s.kayitlar)
  const testler = useTestStore((s) => s.kayitlar)
  const paketler = useTestPaketiStore((s) => s.kayitlar)

  /* ---------------- Taramalar ---------------- */
  const tarama = useMemo(() => {
    const secili = taramalar.filter((t) => donemeUyar(t.tarih, donem))
    const aktif = secili.filter((t) => t.durum !== 'İptal')
    const planlanan = aktif.reduce((s, t) => s + t.kisiSayisi, 0)
    const tamamlanan = aktif.reduce((s, t) => s + Math.min(t.tamamlanan, t.kisiSayisi), 0)
    const hazirlikEksik = aktif.filter((t) => taramaEksikleri(t).length > 0 && t.durum === 'Planlandı').length
    const hizmetler = HIZMET_TURLERI.map((h) => {
      const liste = aktif.filter((t) => t.hizmet === h)
      return { etiket: h, deger: liste.length, alt: liste.length ? `${sayi(liste.reduce((s, t) => s + t.kisiSayisi, 0))} kişi` : undefined }
    })
      .filter((h) => h.deger > 0)
      .sort((a, b) => b.deger - a.deger)
    const ekipHarita = new Map<string, number>()
    aktif.forEach((t) => (t.ekip ? t.ekip.split(', ') : []).filter(Boolean).forEach((ad) => ekipHarita.set(ad, (ekipHarita.get(ad) ?? 0) + 1)))
    const ekipYuku = [...ekipHarita.entries()].map(([etiket, deger]) => ({ etiket, deger })).sort((a, b) => b.deger - a.deger).slice(0, 8)
    const durumlar = TARAMA_DURUMLARI.map((d) => ({ etiket: d, deger: secili.filter((t) => t.durum === d).length, renk: DURUM_RENK[d] }))
    const ozet: [string, string][] = [
      ['Dönem', DONEMLER.find((d) => d.k === donem)?.e ?? ''],
      ['Tarama (iptal hariç)', sayi(aktif.length)],
      ['Planlanan kişi', sayi(planlanan)],
      ['Tamamlanan kişi', sayi(tamamlanan)],
      ['Tamamlanma', `%${yuzde(tamamlanan, planlanan)}`],
      ['Hazırlığı eksik planlı tarama', sayi(hazirlikEksik)],
    ]
    const satirlar = secili.map((t) => [t.id, t.firma, t.hizmet, tarihAraligi(t), saatAraligi(t), t.lokasyon, t.ekip, t.kisiSayisi, t.tamamlanan, t.durum, t.genelToplam ?? 0] as (string | number)[])
    return { secili, aktif, planlanan, tamamlanan, hazirlikEksik, hizmetler, ekipYuku, durumlar, ozet, satirlar }
  }, [taramalar, donem])

  /* ---------------- Teklifler ---------------- */
  const teklif = useMemo(() => {
    const gonderilen = teklifler.filter((t) => t.durum !== 'Taslak')
    const onayli = teklifler.filter((t) => t.durum === 'Onaylandı')
    const onayliTutar = onayli.reduce((s, t) => s + teklifKdvDahil(t), 0)
    const ortKisi = onayli.length ? Math.round(onayli.reduce((s, t) => s + teklifKdvDahil(t) / Math.max(1, t.kisiSayisi), 0) / onayli.length) : 0
    const durumlar = TEKLIF_DURUMLARI.map((d) => ({ etiket: d, deger: teklifler.filter((t) => t.durum === d).length, renk: TEKLIF_RENK[d] }))
    const firmaGelir = [...onayli
      .reduce((h, t) => h.set(t.firma, (h.get(t.firma) ?? 0) + teklifKdvDahil(t)), new Map<string, number>())
      .entries()]
      .map(([etiket, deger]) => ({ etiket, deger }))
      .sort((a, b) => b.deger - a.deger)
      .slice(0, 6)
    const ozet: [string, string][] = [
      ['Toplam teklif', sayi(teklifler.length)],
      ['Gönderilen', sayi(gonderilen.length)],
      ['Onaylanan', sayi(onayli.length)],
      ['Onay oranı (gönderilenlerde)', `%${yuzde(onayli.length, gonderilen.length)}`],
      ['Onaylı tutar (KDV dahil)', tl(onayliTutar)],
      ['Onaylı teklif kişi başı ortalama', tl(ortKisi)],
    ]
    const satirlar = teklifler.map((t: Teklif) => [t.no, t.firma, t.hizmet, t.kisiSayisi, t.tarih, t.gecerlilik, t.durum, teklifNet(t), teklifKdvDahil(t)] as (string | number)[])
    return { durumlar, firmaGelir, ozet, satirlar, onayliTutar, onayOrani: yuzde(onayli.length, gonderilen.length) }
  }, [teklifler])

  /* ---------------- Firmalar ---------------- */
  const firma = useMemo(() => {
    const aktif = firmalar.filter((f) => f.durum === 'Aktif')
    const ilHarita = new Map<string, number>()
    firmalar.forEach((f) => ilHarita.set(f.il, (ilHarita.get(f.il) ?? 0) + 1))
    const iller = [...ilHarita.entries()].map(([etiket, deger]) => ({ etiket, deger })).sort((a, b) => b.deger - a.deger)
    const taramaSayisi = (unvan: string) => taramalar.filter((t) => t.firma === unvan && t.durum !== 'İptal').length
    const personelSayisi = (unvan: string) => personeller.filter((p) => p.firma === unvan && p.durum === 'Aktif').length
    const enCokTarama = firmalar
      .map((f) => ({ etiket: f.kisaAd, deger: taramaSayisi(f.unvan) }))
      .filter((f) => f.deger > 0)
      .sort((a, b) => b.deger - a.deger)
      .slice(0, 6)
    const ozet: [string, string][] = [
      ['Toplam firma', sayi(firmalar.length)],
      ['Aktif firma', sayi(aktif.length)],
      ['Aktif firma personeli', sayi(personeller.filter((p) => p.durum === 'Aktif').length)],
      ['Farklı il', sayi(ilHarita.size)],
    ]
    const satirlar = firmalar.map((f) => [f.unvan, f.kisaAd, f.il, f.yetkili, f.telefon, f.eposta, f.durum, personelSayisi(f.unvan), taramaSayisi(f.unvan)] as (string | number)[])
    return { iller, enCokTarama, ozet, satirlar, durumlar: [
      { etiket: 'Aktif', deger: aktif.length, renk: 'bg-emerald-500' },
      { etiket: 'Pasif', deger: firmalar.length - aktif.length, renk: 'bg-zinc-400' },
    ] }
  }, [firmalar, personeller, taramalar])

  /* ---------------- Ekip & ekipman ---------------- */
  const ekip = useMemo(() => {
    const aktif = ekipUyeleri.filter((u) => u.durum === 'Aktif')
    const gorevHarita = new Map<string, number>()
    ekipUyeleri.forEach((u) => gorevHarita.set(u.gorev, (gorevHarita.get(u.gorev) ?? 0) + 1))
    const gorevler = [...gorevHarita.entries()].map(([etiket, deger]) => ({ etiket, deger })).sort((a, b) => b.deger - a.deger)
    const hazir = ekipmanlar.filter((e) => e.durum === 'Hazır').length
    const sahada = ekipmanlar.filter((e) => e.durum === 'Sahada').length
    const ariza = ekipmanlar.filter((e) => e.durum === 'Arızalı' || e.durum === 'Bakımda').length
    const kalibrasyonYakin = ekipmanlar.filter((e) => {
      const k = gunFarki(BUGUN, e.kalibrasyonBitis)
      return k <= 30
    }).length
    const ekipmanDurumlar = ['Hazır', 'Sahada', 'Bakımda', 'Arızalı'].map((d, i) => ({ etiket: d, deger: ekipmanlar.filter((e) => e.durum === d).length, renk: PALET[i] }))
    const ozet: [string, string][] = [
      ['Ekip üyesi (toplam)', sayi(ekipUyeleri.length)],
      ['Aktif ekip üyesi', sayi(aktif.length)],
      ['Ekipman (toplam)', sayi(ekipmanlar.length)],
      ['Hazır / sahada', `${sayi(hazir)} / ${sayi(sahada)}`],
      ['Bakım veya arıza', sayi(ariza)],
      ['30 gün içinde kalibrasyon', sayi(kalibrasyonYakin)],
    ]
    return {
      aktifSayi: aktif.length,
      gorevler,
      ekipmanDurumlar,
      ozet,
      uyeSatirlar: ekipUyeleri.map((u) => [`${u.ad} ${u.soyad}`, u.gorev, u.departman, u.calismaTipi, u.iseGiris, u.durum] as (string | number)[]),
      ekipmanSatirlar: ekipmanlar.map((e) => [e.ad, e.tur, e.seriNo, e.konum, e.kalibrasyonBitis, e.durum] as (string | number)[]),
      kalibrasyonYakin,
      ariza,
    }
  }, [ekipUyeleri, ekipmanlar])

  /* ---------------- Katalog ---------------- */
  const katalog = useMemo(() => {
    const aktifTest = testler.filter((t) => t.durum === 'Aktif')
    const kategoriHarita = new Map<string, number>()
    aktifTest.forEach((t) => kategoriHarita.set(t.kategori, (kategoriHarita.get(t.kategori) ?? 0) + 1))
    const kategoriler = TEST_KATEGORILERI.map((k) => ({ etiket: k, deger: kategoriHarita.get(k) ?? 0 })).filter((k) => k.deger > 0)
    const ortFiyat = aktifTest.length ? Math.round(aktifTest.reduce((s, t) => s + t.fiyat, 0) / aktifTest.length) : 0
    const kullanim = (id: string) => teklifler.filter((t) => t.kalemler?.some((k) => k.testId === id)).length + taramalar.filter((t) => t.kalemler?.some((k) => k.testId === id)).length
    const enCokKullanilan = testler
      .map((t) => ({ etiket: t.ad, deger: kullanim(t.id) }))
      .filter((t) => t.deger > 0)
      .sort((a, b) => b.deger - a.deger)
      .slice(0, 6)
    const ozet: [string, string][] = [
      ['Test (aktif / toplam)', `${sayi(aktifTest.length)} / ${sayi(testler.length)}`],
      ['Ortalama test fiyatı', tl(ortFiyat)],
      ['Test paketi', sayi(paketler.length)],
    ]
    return {
      kategoriler,
      enCokKullanilan,
      ozet,
      testSatirlar: testler.map((t) => [t.ad, t.kategori, t.birim, t.referans, t.fiyat, t.durum] as (string | number)[]),
      paketSatirlar: paketler.map((p) => [p.ad, p.hizmet, p.testIdleri.length, p.aciklama] as (string | number)[]),
    }
  }, [testler, paketler, teklifler, taramalar])

  /* ----------------------------- Excel dışa aktarma ----------------------------- */
  const excelIndir = () => {
    const bugun = BUGUN
    if (sekme === 'taramalar') {
      void xlsxIndir(xlsxDosyaAdi(`istatistik_taramalar_${bugun}`), [
        ozetSayfasi('Özet', tarama.ozet),
        tabloSayfasi(
          'Taramalar',
          'Tarama kayıtları',
          [
            { label: 'Kod', minGenislik: 10 },
            { label: 'Firma', minGenislik: 28, wrap: true },
            { label: 'Hizmet', minGenislik: 20 },
            { label: 'Tarih', minGenislik: 18 },
            { label: 'Saat', minGenislik: 14 },
            { label: 'Lokasyon', minGenislik: 22, wrap: true },
            { label: 'Ekip', minGenislik: 30, wrap: true },
            { label: 'Planlanan kişi', tip: 'sayi', minGenislik: 14 },
            { label: 'Tamamlanan', tip: 'sayi', minGenislik: 12 },
            { label: 'Durum', minGenislik: 14 },
            { label: 'Genel toplam', tip: 'para', minGenislik: 16 },
          ],
          tarama.satirlar,
        ),
      ])
    }
    if (sekme === 'teklifler') {
      void xlsxIndir(xlsxDosyaAdi(`istatistik_teklifler_${bugun}`), [
        ozetSayfasi('Özet', teklif.ozet),
        tabloSayfasi(
          'Teklifler',
          'Teklif kayıtları',
          [
            { label: 'Teklif no', minGenislik: 16 },
            { label: 'Firma', minGenislik: 28, wrap: true },
            { label: 'Hizmet', minGenislik: 20 },
            { label: 'Kişi', tip: 'sayi', minGenislik: 10 },
            { label: 'Teklif tarihi', tip: 'tarih', minGenislik: 14 },
            { label: 'Geçerlilik', tip: 'tarih', minGenislik: 14 },
            { label: 'Durum', minGenislik: 14 },
            { label: 'KDV hariç', tip: 'para', minGenislik: 16 },
            { label: 'KDV dahil', tip: 'para', minGenislik: 16 },
          ],
          teklif.satirlar,
        ),
      ])
    }
    if (sekme === 'firmalar') {
      void xlsxIndir(xlsxDosyaAdi(`istatistik_firmalar_${bugun}`), [
        ozetSayfasi('Özet', firma.ozet),
        tabloSayfasi(
          'Firmalar',
          'Firma kayıtları',
          [
            { label: 'Unvan', minGenislik: 32, wrap: true },
            { label: 'Kısa ad', minGenislik: 18 },
            { label: 'İl', minGenislik: 12 },
            { label: 'Yetkili', minGenislik: 20 },
            { label: 'Telefon', minGenislik: 16 },
            { label: 'E-posta', minGenislik: 28 },
            { label: 'Durum', minGenislik: 12 },
            { label: 'Aktif personel', tip: 'sayi', minGenislik: 14 },
            { label: 'Tarama', tip: 'sayi', minGenislik: 10 },
          ],
          firma.satirlar,
        ),
      ])
    }
    if (sekme === 'ekip') {
      void xlsxIndir(xlsxDosyaAdi(`istatistik_ekip_${bugun}`), [
        ozetSayfasi('Özet', ekip.ozet),
        tabloSayfasi(
          'Ekip',
          'Ekip üyeleri',
          [
            { label: 'Ad soyad', minGenislik: 26 },
            { label: 'Görev', minGenislik: 22 },
            { label: 'Departman', minGenislik: 16 },
            { label: 'Çalışma tipi', minGenislik: 16 },
            { label: 'İşe giriş', tip: 'tarih', minGenislik: 14 },
            { label: 'Durum', minGenislik: 12 },
          ],
          ekip.uyeSatirlar,
        ),
        tabloSayfasi(
          'Ekipman',
          'Ekipmanlar',
          [
            { label: 'Ekipman', minGenislik: 30, wrap: true },
            { label: 'Tür', minGenislik: 18 },
            { label: 'Seri no', minGenislik: 14 },
            { label: 'Konum', minGenislik: 16 },
            { label: 'Kalibrasyon bitiş', tip: 'tarih', minGenislik: 18 },
            { label: 'Durum', minGenislik: 12 },
          ],
          ekip.ekipmanSatirlar,
        ),
      ])
    }
    if (sekme === 'katalog') {
      void xlsxIndir(xlsxDosyaAdi(`istatistik_katalog_${bugun}`), [
        ozetSayfasi('Özet', katalog.ozet),
        tabloSayfasi(
          'Testler',
          'Test kataloğu',
          [
            { label: 'Test', minGenislik: 30, wrap: true },
            { label: 'Kategori', minGenislik: 16 },
            { label: 'Birim', minGenislik: 10 },
            { label: 'Referans', minGenislik: 18 },
            { label: 'Fiyat', tip: 'para', minGenislik: 14 },
            { label: 'Durum', minGenislik: 12 },
          ],
          katalog.testSatirlar,
        ),
        tabloSayfasi(
          'Paketler',
          'Test paketleri',
          [
            { label: 'Paket', minGenislik: 28, wrap: true },
            { label: 'Hizmet', minGenislik: 20 },
            { label: 'Test sayısı', tip: 'sayi', minGenislik: 12 },
            { label: 'Açıklama', minGenislik: 40, wrap: true },
          ],
          katalog.paketSatirlar,
        ),
      ])
    }
  }

  return (
    <div className="space-y-4">
      {/* Başlık ve sekmeler */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <BarChart3Icon className="size-5 text-amber-500" /> İstatistikler
          </h1>
          <p className="text-xs text-muted-foreground">Her sekme kendi sayfasının verisini gösterir ve o sekmeye ait Excel dosyasını indirir.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2" role="tablist" aria-label="İstatistik sekmeleri">
        <div className="flex flex-wrap gap-1">
          {SEKMELER.map((s) => (
            <button
              key={s.k}
              type="button"
              role="tab"
              aria-selected={sekme === s.k}
              onClick={() => setSekme(s.k)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                sekme === s.k ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <s.ikon className="size-3.5" /> {s.e}
            </button>
          ))}
        </div>
        {sekme === 'taramalar' && (
          <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-0.5" role="group" aria-label="Dönem">
            {DONEMLER.map((d) => (
              <button
                key={d.k}
                type="button"
                aria-pressed={donem === d.k}
                onClick={() => setDonem(d.k)}
                className={cn('shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors', donem === d.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                {d.e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Taramalar */}
      {sekme === 'taramalar' && (
        <div className="space-y-4">
          <SekmeBasligi baslik="Taramalar" aciklama={`${DONEMLER.find((d) => d.k === donem)?.e} · iptal edilenler sayılardan hariç`} onIndir={excelIndir} indirilebilir={tarama.secili.length > 0} />
          <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-5">
            <KpiKarti ikon={HeartPulseIcon} etiket="Tarama" deger={sayi(tarama.aktif.length)} alt={`${tarama.secili.length - tarama.aktif.length} iptal`} />
            <KpiKarti ikon={UsersIcon} etiket="Planlanan kişi" deger={sayi(tarama.planlanan)} alt={`${sayi(tarama.tamamlanan)} tamamlandı`} />
            <KpiKarti ikon={TrendingUpIcon} etiket="Tamamlanma" deger={`%${yuzde(tarama.tamamlanan, tarama.planlanan)}`} alt="planlanan kişiye oran" />
            <KpiKarti ikon={CalendarDaysIcon} etiket="Hazırlığı eksik" deger={sayi(tarama.hazirlikEksik)} alt="planlı tarama" />
            <KpiKarti ikon={BuildingIcon} etiket="Firma" deger={sayi(new Set(tarama.aktif.map((t) => t.firma)).size)} alt="taramada yer alan" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Bolum baslik="Tarama durumları" aciklama={`${tarama.secili.length} tarama`}>
              <YiginCubugu dilimler={tarama.durumlar} />
            </Bolum>
            <Bolum baslik="Hizmet türüne göre" aciklama="tarama · kişi">
              <YatayCubuklar satirlar={tarama.hizmetler} />
            </Bolum>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
            <Bolum baslik="Haftalık yoğunluk" aciklama="8 hafta · planlanan kişi (iptal hariç)">
              <HaftalikYogunluk taramalar={taramalar} />
            </Bolum>
            <Bolum baslik="Ekip yükü" aciklama="dönemdeki tarama sayısı">
              <YatayCubuklar satirlar={tarama.ekipYuku} />
            </Bolum>
          </div>
        </div>
      )}

      {/* Teklifler */}
      {sekme === 'teklifler' && (
        <div className="space-y-4">
          <SekmeBasligi baslik="Teklifler" aciklama="tüm teklif kayıtları" onIndir={excelIndir} indirilebilir={teklifler.length > 0} />
          <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-5">
            <KpiKarti ikon={ReceiptTextIcon} etiket="Toplam teklif" deger={sayi(teklifler.length)} alt={`${teklifler.filter((t) => t.durum === 'Gönderildi').length} onay bekliyor`} />
            <KpiKarti ikon={TrendingUpIcon} etiket="Onay oranı" deger={`%${teklif.onayOrani}`} alt="gönderilenlerde" />
            <KpiKarti ikon={ReceiptTextIcon} etiket="Onaylı tutar" deger={tl(teklif.onayliTutar)} alt="KDV dahil" />
            <KpiKarti ikon={UsersIcon} etiket="Onaylı kişi" deger={sayi(teklifler.filter((t) => t.durum === 'Onaylandı').reduce((s, t) => s + t.kisiSayisi, 0))} alt="planlanan" />
            <KpiKarti ikon={CalendarDaysIcon} etiket="Süresi dolan" deger={sayi(teklifler.filter((t) => t.durum !== 'Onaylandı' && t.durum !== 'Reddedildi' && gunFarki(BUGUN, t.gecerlilik) < 0).length)} alt="geçerliliği bitmiş" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Bolum baslik="Teklif durumları" aciklama={`${teklifler.length} teklif`}>
              <YiginCubugu dilimler={teklif.durumlar} />
            </Bolum>
            <Bolum baslik="En çok onaylı tutar" aciklama="firmaya göre · KDV dahil">
              <YatayCubuklar satirlar={teklif.firmaGelir} birim={tl} />
            </Bolum>
          </div>
          <div className="flex justify-end">
            <Link to="/panel/teklifler" className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
              Tekliflere git →
            </Link>
          </div>
        </div>
      )}

      {/* Firmalar */}
      {sekme === 'firmalar' && (
        <div className="space-y-4">
          <SekmeBasligi baslik="Firmalar" aciklama="firma kayıtları ve personel dağılımı" onIndir={excelIndir} indirilebilir={firmalar.length > 0} />
          <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
            <KpiKarti ikon={BuildingIcon} etiket="Firma" deger={sayi(firmalar.length)} alt={`${firma.durumlar[0].deger} aktif`} />
            <KpiKarti ikon={UsersIcon} etiket="Aktif personel" deger={sayi(personeller.filter((p) => p.durum === 'Aktif').length)} alt="tüm firmalarda" />
            <KpiKarti ikon={BuildingIcon} etiket="İl sayısı" deger={sayi(firma.iller.length)} alt="farklı il" />
            <KpiKarti ikon={HeartPulseIcon} etiket="Tarama alan firma" deger={sayi(firma.enCokTarama.length)} alt="en az bir tarama" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Bolum baslik="Durum" aciklama="firma kayıtları">
              <YiginCubugu dilimler={firma.durumlar} />
            </Bolum>
            <Bolum baslik="İllere göre" aciklama="firma sayısı">
              <YatayCubuklar satirlar={firma.iller} />
            </Bolum>
          </div>
          <Bolum baslik="En çok taranan firmalar" aciklama="iptal hariç tarama sayısı">
            <YatayCubuklar satirlar={firma.enCokTarama} />
          </Bolum>
        </div>
      )}

      {/* Ekip & ekipman */}
      {sekme === 'ekip' && (
        <div className="space-y-4">
          <SekmeBasligi baslik="Ekip ve ekipman" aciklama="ekip üyeleri, görevler ve ekipman durumu" onIndir={excelIndir} indirilebilir />
          <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
            <KpiKarti ikon={UsersIcon} etiket="Ekip üyesi" deger={sayi(ekipUyeleri.length)} alt={`${ekip.aktifSayi} aktif`} />
            <KpiKarti ikon={WrenchIcon} etiket="Ekipman" deger={sayi(ekipmanlar.length)} alt={`${ekip.ariza} bakım / arıza`} />
            <KpiKarti ikon={CalendarDaysIcon} etiket="Kalibrasyon" deger={sayi(ekip.kalibrasyonYakin)} alt="30 gün içinde" />
            <KpiKarti ikon={UsersIcon} etiket="Görev çeşidi" deger={sayi(ekip.gorevler.length)} alt="ekip içinde" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Bolum baslik="Görevlere göre ekip" aciklama="üye sayısı">
              <YatayCubuklar satirlar={ekip.gorevler} />
            </Bolum>
            <Bolum baslik="Ekipman durumları" aciklama={`${ekipmanlar.length} ekipman`}>
              <YiginCubugu dilimler={ekip.ekipmanDurumlar} />
            </Bolum>
          </div>
        </div>
      )}

      {/* Katalog */}
      {sekme === 'katalog' && (
        <div className="space-y-4">
          <SekmeBasligi baslik="Katalog" aciklama="testler ve test paketleri" onIndir={excelIndir} indirilebilir />
          <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
            <KpiKarti ikon={FlaskConicalIcon} etiket="Aktif test" deger={sayi(testler.filter((t) => t.durum === 'Aktif').length)} alt={`${testler.length} toplam`} />
            <KpiKarti ikon={PackageIcon} etiket="Test paketi" deger={sayi(paketler.length)} alt="kayıtlı" />
            <KpiKarti ikon={FlaskConicalIcon} etiket="Kategori" deger={sayi(katalog.kategoriler.length)} alt="aktif testlerde" />
            <KpiKarti ikon={FlaskConicalIcon} etiket="Ortalama fiyat" deger={tl(testler.filter((t) => t.durum === 'Aktif').length ? Math.round(testler.filter((t) => t.durum === 'Aktif').reduce((s, t) => s + t.fiyat, 0) / testler.filter((t) => t.durum === 'Aktif').length) : 0)} alt="aktif testler" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Bolum baslik="Kategoriler" aciklama="aktif test sayısı">
              <YatayCubuklar satirlar={katalog.kategoriler} />
            </Bolum>
            <Bolum baslik="En çok kullanılan testler" aciklama="teklif ve tarama kalemleri">
              <YatayCubuklar satirlar={katalog.enCokKullanilan} />
            </Bolum>
          </div>
        </div>
      )}

    </div>
  )
}
