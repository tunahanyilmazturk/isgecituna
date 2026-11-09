import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BuildingIcon,
  CheckIcon,
  FileTextIcon,
  FlaskConicalIcon,
  MapPinIcon,
  MinusIcon,
  PackageIcon,
  PercentIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pill } from '@/components/pill'
import { OzetKontrol, type KontrolMaddesi } from '@/components/ozet-kontrol'
import { FirmaOzet, FirmaSecici } from '@/components/firma-secici'
import { cn } from '@/lib/utils'
import { formatUzun } from '@/lib/date'
import { TEKLIF_TURLERI, TARAMA_DURUMLARI, gunEkle, type TaramaDurum } from '@/data/saglik'
import { useFirmaStore, usePersonelKayitStore, useTaramaStore, useTeklifStore, useTestPaketiStore, useTestStore } from '@/stores/saglik-stores'
import { useEkipStore } from '@/stores/ekip-store'
import { useOsgb } from '@/lib/osgb'
import { saatAraligi } from '@/lib/tarama'

const ADIMLAR = [
  { baslik: 'Tarama bilgileri', kisa: 'Firma ve tür', aciklama: 'Firma, tarama türü, tarih ve saat', ikon: BuildingIcon },
  { baslik: 'Testler', kisa: 'Testler', aciklama: 'Yapılacak testleri seçin', ikon: FlaskConicalIcon },
  { baslik: 'Fiyat', kisa: 'Fiyat', aciklama: 'İndirim, KDV ve toplam', ikon: TagIcon },
  { baslik: 'Ekip ve lokasyon', kisa: 'Ekip', aciklama: 'Saha ekibi üyeleri ve lokasyon', ikon: MapPinIcon },
  { baslik: 'Notlar', kisa: 'Notlar', aciklama: 'Saha notları ve hazır notlar', ikon: FileTextIcon },
  { baslik: 'Ön yazı', kisa: 'Ön yazı', aciklama: 'Tarama ön yazısı ve belge önizleme', ikon: FileTextIcon },
  { baslik: 'Özet ve kayıt', kisa: 'Özet', aciklama: 'Kontrol edin ve kaydedin', ikon: CheckIcon },
] as const

/** Hazır saha notları: mobil sağlık taraması (araç/ünite, numune, gizlilik ve hazırlık) */
const HAZIR_NOTLAR = [
  'Mobil ünite düz ve güvenli bir park alanına yanaşmalı; giriş rampası ve yaya yolu boş tutulmalı.',
  'Kan alımı yapılacak çalışanlar tarama öncesi 8 saat açlık süresine uymalı, kullandıkları ilaçları bildirmeli.',
  'Muayene ve görüşmeler için gizliliği sağlayan ayrı bir oda ya da paravan firma tarafından hazırlanmalı.',
  'Ünitenin elektrik (220 V) ve su bağlantısı tarama başlamadan önce firma yetkilisi tarafından sağlanmalı.',
  'Odyometri ve akciğer fonksiyon testleri için sakin, gürültüsüz bir ortam ayarlanmalı.',
  'Çalışan listesi tarama gününden önce saha ekibine iletilmeli; kimlik kontrolü tarama girişinde yapılır.',
  'Sonuçlar tarama tarihinden sonra 5 iş günü içinde firma yetkilisine iletilir.',
] as const

const ONYAZI_TON = [
  { k: 'kurumsal', e: 'Kurumsal' },
  { k: 'samimi', e: 'Samimi' },
] as const
const ONYAZI_UZUNLUK = [
  { k: 'kisa', e: 'Kısa' },
  { k: 'standart', e: 'Standart' },
  { k: 'detayli', e: 'Detaylı' },
] as const

const TARIH_KISAYOLLARI = [
  { n: 0, e: 'Bugün' },
  { n: 1, e: 'Yarın' },
  { n: 7, e: '+7 gün' },
  { n: 14, e: '+14 gün' },
] as const
const AY_ADLARI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'] as const
const HAFTA_GUNLERI = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'] as const
const KDV_ORANLARI = [0, 1, 10, 20] as const

const tl = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`

type Kalem = { ad: string; miktar: number; birim: number }

/* ----------------------------- Tasarım parçaları ----------------------------- */

function Bolum({ no, baslik, aciklama, sag, children, className }: { no?: number; baslik: string; aciklama?: string; sag?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-2 sm:p-3.5', className)}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {no !== undefined && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {no}
            </span>
          )}
          <h3 className="truncate text-xs font-semibold">{baslik}</h3>
          {aciklama && <span className="hidden truncate text-[11px] text-muted-foreground xl:inline">· {aciklama}</span>}
        </div>
        {sag}
      </header>
      {children}
    </section>
  )
}

function SecimKart({ secili, onClick, children, className }: { secili: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={secili}
      className={cn(
        'rounded-lg border bg-background px-3 py-2 text-left transition-all hover:-translate-y-px hover:shadow-sm',
        secili ? 'border-amber-400 bg-amber-400/10 shadow-sm ring-1 ring-amber-400/50' : 'hover:bg-muted/40',
        className,
      )}
    >
      {children}
    </button>
  )
}

function Chip({ aktif, onClick, children }: { aktif?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={cn(
        'rounded-md px-2.5 py-1 text-[11px] font-medium tabular-nums transition-colors',
        aktif ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** Miktar kontrolü: − [değer] + */
function MiktarKontrol({ deger, onChange }: { deger: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
      <button type="button" aria-label="Miktarı azalt" onClick={() => onChange(Math.max(1, deger - 1))} className="flex size-6 items-center justify-center rounded-md bg-muted hover:bg-muted/70">
        <MinusIcon className="size-3" />
      </button>
      <input
        type="number"
        min={1}
        value={deger}
        aria-label="Miktar"
        onChange={(e) => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        className="w-9 bg-transparent text-center text-xs font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" aria-label="Miktarı artır" onClick={() => onChange(deger + 1)} className="flex size-6 items-center justify-center rounded-md bg-muted hover:bg-muted/70">
        <PlusIcon className="size-3" />
      </button>
    </div>
  )
}

const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const isoToDate = (iso: string) => new Date(`${iso}T00:00:00`)

/** Tarih + saat satırı (başlangıç veya bitiş) */
function ZamanSatiri({ etiket, tarih, saat, onTarih, onSaat }: { etiket: string; tarih: string; saat: string; onTarih: (v: string) => void; onSaat: (v: string) => void }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_6.5rem] items-center gap-2">
      <span className="text-[11px] font-medium text-muted-foreground">{etiket}</span>
      <Input type="date" value={tarih} onChange={(e) => onTarih(e.target.value)} aria-label={`${etiket} tarihi`} className="h-7 text-xs tabular-nums" />
      <Input type="time" value={saat} onChange={(e) => onSaat(e.target.value)} aria-label={`${etiket} saati`} className="h-7 text-xs tabular-nums" />
    </div>
  )
}

/** Mini takvim: iki tıkla aralık seçilir (ilk gün başlangıç, ikinci gün bitiş); seçili aralık amber ile vurgulanır */
function MiniTakvim({ baslangic, bitis, onGun }: { baslangic: string; bitis: string; onGun: (iso: string) => void }) {
  /* Gezinti yapılmadıysa görünüm başlangıç tarihinin ayıdır */
  const [gezinti, setGezinti] = useState<{ yil: number; ay: number } | null>(null)
  const temel = baslangic ? isoToDate(baslangic) : new Date()
  const gorunum = gezinti ?? { yil: temel.getFullYear(), ay: temel.getMonth() }
  const kaydir = (n: number) => {
    const d = new Date(gorunum.yil, gorunum.ay + n, 1)
    setGezinti({ yil: d.getFullYear(), ay: d.getMonth() })
  }
  const bosluk = (new Date(gorunum.yil, gorunum.ay, 1).getDay() + 6) % 7
  const gunSayisi = new Date(gorunum.yil, gorunum.ay + 1, 0).getDate()
  const hucreler: (string | null)[] = [
    ...Array.from({ length: bosluk }, () => null),
    ...Array.from({ length: gunSayisi }, (_, i) => isoOf(new Date(gorunum.yil, gorunum.ay, i + 1))),
  ]
  const bugun = isoOf(new Date())
  const aralikta = (iso: string) => !!baslangic && !!bitis && iso >= baslangic && iso <= bitis

  return (
    <div className="rounded-lg border bg-background p-1.5">
      <div className="mb-0.5 flex items-center justify-between">
        <button type="button" aria-label="Önceki ay" onClick={() => kaydir(-1)} className="flex size-6 items-center justify-center rounded-md hover:bg-muted">
          <ArrowLeftIcon className="size-3.5" />
        </button>
        <span className="text-xs font-semibold">
          {AY_ADLARI[gorunum.ay]} {gorunum.yil}
        </span>
        <button type="button" aria-label="Sonraki ay" onClick={() => kaydir(1)} className="flex size-6 items-center justify-center rounded-md hover:bg-muted">
          <ArrowRightIcon className="size-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-muted-foreground">
        {HAFTA_GUNLERI.map((g) => (
          <span key={g} className="py-0.5">
            {g}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {hucreler.map((iso, i) =>
          iso ? (
            <button
              key={iso}
              type="button"
              aria-label={iso}
              aria-pressed={iso === baslangic || iso === bitis}
              onClick={() => {
                setGezinti(null)
                onGun(iso)
              }}
              className={cn(
                'flex h-5 items-center justify-center rounded-md text-[11px] tabular-nums transition-colors',
                iso === baslangic || iso === bitis ? 'bg-amber-400 font-semibold text-zinc-950' : aralikta(iso) ? 'bg-amber-400/20 text-foreground' : 'hover:bg-muted',
                iso === bugun && !(iso === baslangic || iso === bitis) && 'font-semibold ring-1 ring-amber-400/60',
              )}
            >
              {Number(iso.slice(8))}
            </button>
          ) : (
            <span key={`bos-${i}`} />
          ),
        )}
      </div>
    </div>
  )
}

/* ---------------------------------- Sayfa ---------------------------------- */

/** Tarama planlama sihirbazı — teklif sihirbazıyla aynı yapı: firma, kişi, test, fiyat, ekip, not ve özet. */
export default function TaramaYeniPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const duzenleId = params.get('duzenle')
  const teklifParam = params.get('teklif')
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const ekle = useTaramaStore((s) => s.ekle)
  const guncelle = useTaramaStore((s) => s.guncelle)
  const firmalar = useFirmaStore((s) => s.kayitlar)
  const firmaEkle = useFirmaStore((s) => s.ekle)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const personeller = usePersonelKayitStore((s) => s.kayitlar)
  const testler = useTestStore((s) => s.kayitlar)
  const paketler = useTestPaketiStore((s) => s.kayitlar)

  /* Düzenleme: mevcut tarama; planlama: teklif bağlantısıyla ön doldurma */
  const kaynak = duzenleId ? taramalar.find((t) => t.id === duzenleId) : undefined
  const teklifKaynak = !kaynak && teklifParam ? teklifler.find((t) => t.id === teklifParam) : undefined
  const duzenleModu = !!kaynak

  const [adimIdx, setAdimIdx] = useState(0)
  const [firmaUnvan, setFirmaUnvan] = useState(kaynak?.firma ?? teklifKaynak?.firma ?? params.get('firma') ?? '')
  const [teklifId, setTeklifId] = useState(kaynak?.teklifId ?? teklifKaynak?.id ?? '')
  const [hizmet, setHizmet] = useState<string>(
    kaynak && (TEKLIF_TURLERI as readonly string[]).includes(kaynak.hizmet)
      ? kaynak.hizmet
      : teklifKaynak && (TEKLIF_TURLERI as readonly string[]).includes(teklifKaynak.hizmet)
        ? teklifKaynak.hizmet
        : TEKLIF_TURLERI[0],
  )
  const [tarih, setTarih] = useState(kaynak?.tarih ?? gunEkle(1))
  const [saat, setSaat] = useState(kaynak?.saat ?? '09:00')
  const [bitisTarih, setBitisTarih] = useState(kaynak?.bitisTarih ?? kaynak?.tarih ?? gunEkle(1))
  const [bitisSaat, setBitisSaat] = useState(kaynak?.bitisSaat ?? '17:00')
  const [aralikBekliyor, setAralikBekliyor] = useState(false)
  /* Planlanan kişi sayısı: teklif bağlanınca önerilir, Tarama bilgileri adımında değiştirilebilir */
  const [kisiYedek, setKisiYedek] = useState(kaynak?.kisiSayisi ?? teklifKaynak?.kisiSayisi ?? 10)
  /* Testler: kalem (test → miktar ve birim fiyat) */
  const [kalem, setKalem] = useState<Record<string, Kalem>>(() => {
    const kaynakKalem = kaynak?.kalemler ?? teklifKaynak?.kalemler ?? []
    return Object.fromEntries(kaynakKalem.map((k) => [k.testId, { ad: k.ad, miktar: k.miktar, birim: k.birim }]))
  })
  const [paketSekme, setPaketSekme] = useState<'paket' | 'test'>('paket')
  const [aramaT, setAramaT] = useState('')
  const [kategoriF, setKategoriF] = useState('Tümü')
  const [topluMiktar, setTopluMiktar] = useState(1)
  /* Fiyat */
  const [indirimTip, setIndirimTip] = useState<'yuzde' | 'tl'>('yuzde')
  const [indirimDeger, setIndirimDeger] = useState(kaynak?.iskontoYuzde ?? teklifKaynak?.iskontoYuzde ?? 0)
  const [kdv, setKdv] = useState<number>(kaynak?.kdvOrani ?? teklifKaynak?.kdvOrani ?? 20)
  const [hedef, setHedef] = useState<number | null>(null)
  const [hedefGirdi, setHedefGirdi] = useState('')
  /* Saha ekibi: ekip modülündeki aktif üyeler arasından seçilir */
  const ekipUyeleri = useEkipStore((s) => s.uyeler).filter((u) => u.durum === 'Aktif')
  const [ekipUyeIdleri, setEkipUyeIdleri] = useState<string[]>(kaynak?.ekipUyeIdleri ?? [])
  const [lokasyon, setLokasyon] = useState(kaynak?.lokasyon ?? '')
  /* Tarama ön yazısı: kayıtlı metin düzenlemede korunur; yeni taramada otomatik üretilir */
  const kurum = useOsgb()
  const [onYaziMetin, setOnYaziMetin] = useState(kaynak?.onYazi ?? '')
  const [onYaziDuzenlendi, setOnYaziDuzenlendi] = useState(!!kaynak?.onYazi)
  const [onYaziTon, setOnYaziTon] = useState<'kurumsal' | 'samimi'>('kurumsal')
  const [onYaziUzunluk, setOnYaziUzunluk] = useState<'kisa' | 'standart' | 'detayli'>('standart')
  const [notlar, setNotlar] = useState<string[]>(() => (kaynak?.notlar ? kaynak.notlar.split('\n').map((s) => s.trim()).filter(Boolean) : []))
  const [yeniNot, setYeniNot] = useState('')
  const [tamamlanan, setTamamlanan] = useState(kaynak?.tamamlanan ?? 0)
  const [durum, setDurum] = useState<TaramaDurum>(kaynak?.durum ?? 'Planlandı')
  const [hata, setHata] = useState<string | null>(null)

  const firma = firmalar.find((f) => f.unvan === firmaUnvan)
  const firmaPersoneller = useMemo(() => personeller.filter((p) => p.firma === firmaUnvan && p.durum === 'Aktif'), [personeller, firmaUnvan])
  const calisanSayisi = firmaPersoneller.length
  const planlanan = Math.max(1, kisiYedek)
  const firmaTeklifleri = teklifler.filter((t) => t.firma === firmaUnvan && t.durum !== 'Reddedildi')
  const secilenTeklif = teklifler.find((t) => t.id === teklifId)
  const tarihEtiket = tarih ? new Date(`${tarih}T00:00:00`).toLocaleDateString('tr-TR') : ''
  const baslik = firma ? `${firma.kisaAd} · ${hizmet} · ${tarihEtiket}` : 'Tarama planlayın'
  /* Zaman özeti: aynı gün ise "09:00–17:00", farklı günse başlangıç → bitiş */
  const bitisFarkli = !!bitisTarih && bitisTarih !== tarih
  const zamanMetni = tarih ? (bitisFarkli ? `${formatUzun(tarih)} ${saat} → ${formatUzun(bitisTarih)} ${bitisSaat}` : `${formatUzun(tarih)} · ${saat}–${bitisSaat}`) : '—'
  const gunAraligi = tarih && bitisTarih ? Math.round((isoToDate(bitisTarih).getTime() - isoToDate(tarih).getTime()) / 86400000) + 1 : 0
  const seciliEkipUyeleri = ekipUyeleri.filter((u) => ekipUyeIdleri.includes(u.id))
  const ekipMetni = seciliEkipUyeleri.map((u) => `${u.unvanOnek ? `${u.unvanOnek} ` : ''}${u.ad} ${u.soyad}`).join(', ')
  /** Firma, tarih, saat, kişi, ekip, lokasyon ve testlerden üretilen tarama ön yazısı; ton ve uzunluğa göre değişir */
  const onYaziOtomatik = useMemo(() => {
    if (!firma) return ''
    const samimi = onYaziTon === 'samimi'
    const hitap = samimi ? `Merhaba ${firma.yetkili},` : `Sayın ${firma.yetkili},`
    const tarihMetni = bitisFarkli ? `${formatUzun(tarih)} – ${formatUzun(bitisTarih)} tarihleri arasında` : `${formatUzun(tarih)} tarihinde`
    const p1 = `${kurum.kisaAd || kurum.unvan} olarak ${firma.kisaAd} çalışanlarına yönelik ${hizmet} kapsamındaki mobil sağlık taramasını ${tarihMetni}${lokasyon.trim() ? `, ${lokasyon.trim()} konumunda` : ''} gerçekleştirmek üzere hazırlandık.`
    const p2 = `Taramalar ${saatAraligi({ saat, bitisSaat })} saatleri arasında, ${planlanan} çalışan için planlanmıştır.${ekipMetni ? ` Saha ekibimiz (${ekipMetni}) taramayı yürütecektir.` : ''}`
    const p3 = 'Mobil ünitemiz, çalışanların iş akışını aksatmadan tarama yapabilmesi için sahada hızlı ve gizlilik ilkelerine uygun bir süreç işletir. Her bulgu hekim değerlendirmesiyle sonuçlandırılır.'
    const testler = Object.values(kalem).map((k) => k.ad)
    const p4 = testler.length
      ? `Taramada şu testler uygulanacaktır: ${testler.join(', ')}.`
      : 'Tarama öncesinde ekibimiz çalışan listesini ve test planını firma yetkilisiyle paylaşarak takvimi netleştirecektir.'
    const kapanis = samimi ? 'Sorularınız için her zaman yanınızdayız.' : 'Sorularınız için bizimle iletişime geçmekten memnuniyet duyarız.'
    const veda = samimi ? 'İyi çalışmalar dileriz,' : 'Saygılarımızla,'
    const bolumler =
      onYaziUzunluk === 'kisa' ? [hitap, p1, p2, kapanis] : onYaziUzunluk === 'detayli' ? [hitap, p1, p2, p3, p4, kapanis] : [hitap, p1, p2, p3, kapanis]
    return [...bolumler, veda, kurum.kisaAd || kurum.unvan].join('\n\n')
  }, [firma, hizmet, tarih, bitisTarih, bitisFarkli, saat, bitisSaat, planlanan, ekipMetni, lokasyon, kalem, onYaziTon, onYaziUzunluk, kurum.kisaAd, kurum.unvan])
  const onYazi = onYaziDuzenlendi ? onYaziMetin : onYaziOtomatik
  const onYaziYenile = () => setOnYaziDuzenlendi(false)
  /** Ton veya uzunluk değişince metin yeniden üretilir; elle düzenleme varsa onay istenir */
  const onYaziAyarla = (alan: 'ton' | 'uzunluk', deger: string) => {
    if (onYaziDuzenlendi && !window.confirm('Metinde yaptığınız düzenlemeler silinecek. Devam edilsin mi?')) return
    if (alan === 'ton') setOnYaziTon(deger as typeof onYaziTon)
    else setOnYaziUzunluk(deger as typeof onYaziUzunluk)
    setOnYaziDuzenlendi(false)
  }
  const ekipUyeTikla = (id: string) => setEkipUyeIdleri((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id]))

  /* Testler ve fiyat hesapları */
  const kalemListe = useMemo(() => Object.entries(kalem).map(([id, k]) => ({ id, ...k })).sort((a, b) => a.ad.localeCompare(b.ad, 'tr')), [kalem])
  const aktifTestler = useMemo(() => testler.filter((t) => t.durum === 'Aktif'), [testler])
  const kategoriler = useMemo(() => ['Tümü', ...Array.from(new Set(aktifTestler.map((t) => t.kategori))).sort((a, b) => a.localeCompare(b, 'tr'))], [aktifTestler])
  const bosTestler = useMemo(() => {
    const q = aramaT.toLocaleLowerCase('tr').trim()
    return aktifTestler.filter((t) => !(t.id in kalem) && (kategoriF === 'Tümü' || t.kategori === kategoriF) && (!q || `${t.ad} ${t.kategori}`.toLocaleLowerCase('tr').includes(q)))
  }, [aktifTestler, kalem, aramaT, kategoriF])
  const bosPaketler = useMemo(() => {
    const q = aramaT.toLocaleLowerCase('tr').trim()
    return paketler.filter((p) => !q || p.ad.toLocaleLowerCase('tr').includes(q))
  }, [paketler, aramaT])

  const kalemToplam = kalemListe.reduce((t, k) => t + k.birim * k.miktar, 0)
  const hedefNet = hedef !== null ? hedef / (1 + kdv / 100) : null
  const indirimTL = hedefNet !== null ? kalemToplam - hedefNet : indirimTip === 'yuzde' ? (kalemToplam * indirimDeger) / 100 : Math.min(indirimDeger, kalemToplam)
  const indirimYuzde = kalemToplam > 0 ? (indirimTL / kalemToplam) * 100 : 0
  const netToplam = kalemToplam - indirimTL
  const kdvTutar = (netToplam * kdv) / 100
  const genelToplam = netToplam + kdvTutar

  const testEkle = (id: string, ad: string, fiyat: number) => setKalem((k) => (id in k ? k : { ...k, [id]: { ad, miktar: planlanan, birim: fiyat } }))
  const testCikar = (id: string) =>
    setKalem((k) => {
      const yeni = { ...k }
      delete yeni[id]
      return yeni
    })
  const miktarAyarla = (id: string, n: number) => setKalem((k) => (k[id] ? { ...k, [id]: { ...k[id], miktar: Math.max(1, n) } } : k))
  const birimAyarla = (id: string, n: number) => setKalem((k) => (k[id] ? { ...k, [id]: { ...k[id], birim: Math.max(0, n) } } : k))
  const paketEkle = (ids: string[]) =>
    setKalem((k) => {
      const yeni = { ...k }
      ids.forEach((id) => {
        const t = testler.find((x) => x.id === id)
        if (t && t.durum === 'Aktif' && !(id in yeni)) yeni[id] = { ad: t.ad, miktar: planlanan, birim: t.fiyat }
      })
      return yeni
    })
  const topluUygula = () => setKalem((k) => Object.fromEntries(Object.entries(k).map(([id, v]) => [id, { ...v, miktar: Math.max(1, topluMiktar) }])))
  const kisiyeUygula = () => setKalem((k) => Object.fromEntries(Object.entries(k).map(([id, v]) => [id, { ...v, miktar: planlanan }])))
  const hedefUygula = () => {
    const v = Number(hedefGirdi.replace(',', '.'))
    if (!Number.isFinite(v) || v < 0) return setHata('Geçerli bir genel toplam girin.')
    setHata(null)
    setHedef(v)
  }
  const hedefSifirla = () => {
    setHedef(null)
    setHedefGirdi('')
  }

  const teklifSec = (id: string) => {
    setTeklifId(id)
    const t = teklifler.find((x) => x.id === id)
    if (t) {
      setHizmet((TEKLIF_TURLERI as readonly string[]).includes(t.hizmet) ? t.hizmet : TEKLIF_TURLERI[0])
      setKisiYedek(t.kisiSayisi)
    }
  }

  /* Tarama zamanı: başlangıç seçilince bitiş başlangıçtan önce kalmaz; takvimde iki tıkla aralık seçilir */
  const baslangicYaz = (iso: string) => {
    setTarih(iso)
    if (bitisTarih < iso) setBitisTarih(iso)
  }
  const bitisYaz = (iso: string) => setBitisTarih(tarih && iso && iso < tarih ? tarih : iso)
  const gunSec = (iso: string) => {
    setHata(null)
    if (!aralikBekliyor) {
      setTarih(iso)
      setBitisTarih(iso)
      setAralikBekliyor(true)
    } else if (iso < tarih) {
      setTarih(iso)
      setBitisTarih(tarih)
      setAralikBekliyor(false)
    } else {
      setBitisTarih(iso)
      setAralikBekliyor(false)
    }
  }

  /* Adım bazlı doğrulama: yalnızca ileri ve kayıt öncesi çalışır; adımlar serbestçe gezilir. */
  const dogrula = (i: number): string | null => {
    const adim = ADIMLAR[i].baslik
    if (adim === 'Tarama bilgileri') {
      if (!firmaUnvan) return 'Devam etmek için bir firma seçin.'
      if (!tarih) return 'Bir tarih seçin.'
      if (!/^\d{2}:\d{2}$/.test(saat)) return 'Saati SS:DD biçiminde girin (ör. 09:00).'
      if (!bitisTarih) return 'Bir bitiş tarihi seçin.'
      if (!/^\d{2}:\d{2}$/.test(bitisSaat)) return 'Bitiş saatini SS:DD biçiminde girin.'
      if (`${bitisTarih} ${bitisSaat}` < `${tarih} ${saat}`) return 'Bitiş, başlangıçtan önce olamaz.'
    }
    if (adim === 'Testler' && kalemListe.length === 0) return 'En az bir test ekleyin.'
    if (adim === 'Fiyat' && indirimTip === 'yuzde' && indirimDeger > 100) return 'Yüzde indirim 100 değerini geçemez.'
    if (adim === 'Ekip ve lokasyon' && seciliEkipUyeleri.length === 0) return 'Saha ekibine en az bir üye ekleyin.'
    if (adim === 'Ön yazı' && !onYazi.trim()) return 'Ön yazı boş olamaz.'
    return null
  }
  const adimaGit = (i: number) => {
    setHata(null)
    setAdimIdx(i)
  }
  const ileri = () => {
    const h = dogrula(adimIdx)
    setHata(h)
    if (!h) setAdimIdx((i) => Math.min(i + 1, ADIMLAR.length - 1))
  }
  const geri = () => adimaGit(Math.max(0, adimIdx - 1))

  const notEkle = (metin: string) => {
    const t = metin.trim()
    if (!t) return
    setNotlar((s) => [...s, t])
    setYeniNot('')
  }
  const notGuncelle = (i: number, metin: string) => setNotlar((s) => s.map((x, k) => (k === i ? metin : x)))
  const notSil = (i: number) => setNotlar((s) => s.filter((_, k) => k !== i))
  const notTasi = (i: number, yon: -1 | 1) =>
    setNotlar((s) => {
      const j = i + yon
      if (j < 0 || j >= s.length) return s
      const yeni = [...s]
      ;[yeni[i], yeni[j]] = [yeni[j], yeni[i]]
      return yeni
    })

  const kontrol: KontrolMaddesi[] = [
    { ok: !!firma, metin: firma ? `Firma: ${firma.kisaAd}` : 'Firma seçilmedi', adim: 0 },
    { ok: planlanan >= 1, metin: `${planlanan} kişi planlandı`, adim: 0 },
    { ok: kalemListe.length > 0, metin: kalemListe.length ? `${kalemListe.length} test seçili` : 'Test seçilmedi', adim: 1 },
    { ok: genelToplam > 0, metin: genelToplam > 0 ? `Genel toplam ${tl(genelToplam)}` : 'Toplam tutar sıfır', adim: 2 },
    { ok: !!tarih && /^\d{2}:\d{2}$/.test(saat) && !!bitisTarih, metin: tarih ? zamanMetni : 'Tarih seçilmedi', adim: 0 },
    { ok: !!secilenTeklif, uyari: true, metin: secilenTeklif ? `Teklif: ${secilenTeklif.no}` : 'Teklif bağlanmadı', adim: 0 },
    { ok: !!lokasyon.trim(), uyari: true, metin: lokasyon.trim() ? 'Lokasyon girildi' : 'Lokasyon boş', adim: 3 },
    { ok: seciliEkipUyeleri.length > 0, metin: seciliEkipUyeleri.length ? `${seciliEkipUyeleri.length} ekip üyesi` : 'Ekip üyesi seçilmedi', adim: 3 },
    { ok: notlar.length > 0, uyari: true, metin: notlar.length ? `${notlar.length} saha notu` : 'Saha notu yok', adim: 4 },
    { ok: !!onYazi.trim(), uyari: true, metin: onYazi.trim() ? 'Ön yazı hazır' : 'Ön yazı boş', adim: 5 },
  ]

  const kaydet = () => {
    for (let i = 0; i < ADIMLAR.length - 1; i++) {
      const h = dogrula(i)
      if (h) {
        setHata(h)
        setAdimIdx(i)
        return
      }
    }
    const tamam = durum === 'Tamamlandı' ? planlanan : Math.min(Math.max(0, Math.floor(tamamlanan)), planlanan)
    const veri = {
      firma: firmaUnvan,
      hizmet,
      tarih,
      saat,
      bitisTarih,
      bitisSaat,
      ekip: ekipMetni,
      ekipUyeIdleri,
      onYazi: onYazi.trim() || undefined,
      lokasyon: lokasyon.trim(),
      kisiSayisi: planlanan,
      personelIdleri: kaynak?.personelIdleri,
      kalemler: kalemListe.map((k) => ({ testId: k.id, ad: k.ad, birim: k.birim, miktar: k.miktar })),
      iskontoYuzde: indirimYuzde ? Math.round(indirimYuzde * 100) / 100 : undefined,
      indirimTutar: Math.round(indirimTL * 100) / 100,
      kdvOrani: kdv,
      netToplam: Math.round(netToplam * 100) / 100,
      genelToplam: Math.round(genelToplam),
      tamamlanan: tamam,
      durum,
      teklifId: teklifId || undefined,
      notlar: notlar.map((s) => s.trim()).filter(Boolean).join('\n') || undefined,
    }

    if (kaynak) {
      guncelle(kaynak.id, {
        ...veri,
        gecmis: [{ tarih: new Date().toISOString(), olay: 'Tarama düzenlendi' }, ...(kaynak.gecmis ?? [])],
      })
      toast.success('Tarama güncellendi')
      navigate(`/panel/taramalar/${kaynak.id}`)
      return
    }

    const yeniId = ekle({ ...veri, gecmis: [{ tarih: new Date().toISOString(), olay: 'Tarama planlandı' }] })
    toast.success(`${firma?.kisaAd ?? 'Tarama'} planlandı`)
    navigate(`/panel/taramalar/${yeniId}`)
  }

  /* Klavye: Ctrl+Enter ileri / kaydet, Alt+← / Alt+→ adım değiştirir */
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (adimIdx === ADIMLAR.length - 1) kaydet()
        else ileri()
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        ileri()
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        geri()
      }
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  })

  const sonAdim = adimIdx === ADIMLAR.length - 1
  const iptalHedef = kaynak ? `/panel/taramalar/${kaynak.id}` : '/panel/taramalar'

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[30rem] flex-col gap-3 sm:h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-7.5rem)]">
      {/* Üst şerit */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={iptalHedef}
            aria-label="Geri dön"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div className="min-w-0">
            <p className="hidden text-[11px] font-medium tracking-wide text-amber-600 uppercase sm:block dark:text-amber-400">
              {duzenleModu ? `Düzenleniyor · ${kaynak?.firma}` : teklifKaynak ? `Tekliften planlama · ${teklifKaynak.no}` : 'Yeni tarama'}
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-xl">{baslik}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl bg-zinc-950 px-3 py-1.5 text-white shadow-sm sm:px-4 sm:py-2 dark:bg-zinc-100 dark:text-zinc-900">
          <div className="text-right">
            <p className="text-[10px] tracking-wide uppercase opacity-70">Tahmini toplam</p>
            <p className="text-base font-semibold tabular-nums">{tl(adimIdx >= 3 ? genelToplam : 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-[200px_1fr] lg:grid-rows-none">
        {/* Adım paneli */}
        <aside className="hidden min-h-0 flex-col rounded-xl border bg-card p-2 shadow-sm md:flex">
          <ol className="grid grid-cols-4 gap-1 lg:grid-cols-1 lg:gap-0.5">
            {ADIMLAR.map((a, i) => {
              const aktif = i === adimIdx
              return (
                <li key={a.baslik}>
                  <button
                    type="button"
                    onClick={() => adimaGit(i)}
                    aria-current={aktif ? 'step' : undefined}
                    className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors', aktif ? 'bg-amber-400/15' : 'hover:bg-muted/60')}
                  >
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums', aktif ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'bg-muted text-muted-foreground')}>
                      {i + 1}
                    </span>
                    <span className="hidden min-w-0 lg:block">
                      <span className={cn('block truncate text-xs', aktif ? 'font-semibold' : 'font-medium')}>{a.kisa}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{a.aciklama}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="mt-auto hidden space-y-2 border-t pt-2.5 lg:block">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Özet</p>
            <dl className="space-y-1 text-[11px]">
              {[
                ['Firma', firma?.kisaAd ?? '—'],
                ['Tür', hizmet],
                ['Kişi', `${planlanan}`],
                ['Test', `${kalemListe.length}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        {/* İçerik kartı */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="h-1 shrink-0 bg-muted">
            <div className="h-full bg-amber-400 transition-[width] duration-300" style={{ width: `${((adimIdx + 1) / ADIMLAR.length) * 100}%` }} />
          </div>

          {/* 1. adım: firma, tür, tarih, saat ve başlık */}
          {adimIdx === 0 && (
            <div className="flex min-h-0 flex-1 flex-col justify-start gap-2 overflow-y-auto bg-muted/20 md:overflow-hidden px-2 py-2 sm:gap-2 sm:px-4 sm:py-2.5">
              <Bolum no={1} baslik="Firma" aciklama="Arayarak veya listeden seçin">
                <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                  <FirmaSecici
                    firmalar={firmalar}
                    deger={firmaUnvan}
                    onHizliEkle={firmaEkle}
                    onSec={(u) => {
                      setFirmaUnvan(u)
                      setTeklifId('')
                    }}
                  />
                  <FirmaOzet firma={firma} calisan={calisanSayisi} />
                </div>
              </Bolum>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Bolum no={2} baslik="Tarama türü">
                  <div className="grid grid-cols-2 gap-2">
                    {TEKLIF_TURLERI.map((t) => (
                      <SecimKart key={t} secili={hizmet === t} onClick={() => setHizmet(t)} className="flex items-center gap-2 text-xs font-medium">
                        <span className={cn('hidden size-6 shrink-0 items-center justify-center rounded-md sm:flex', hizmet === t ? 'bg-amber-400 text-zinc-950' : 'bg-muted text-muted-foreground')}>
                          {hizmet === t ? <CheckIcon className="size-3.5" /> : <FlaskConicalIcon className="size-3.5" />}
                        </span>
                        <span className="min-w-0 text-[11px] leading-tight sm:text-xs">{t}</span>
                      </SecimKart>
                    ))}
                  </div>
                </Bolum>
                <Bolum
                  no={3}
                  baslik="Bağlı teklif"
                  aciklama="İsteğe bağlı"
                  sag={
                    <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      Kişi
                      <Input
                        type="number"
                        min={1}
                        value={kisiYedek}
                        aria-label="Planlanan kişi sayısı"
                        onChange={(e) => setKisiYedek(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                        className="h-6 w-16 px-2 text-xs tabular-nums"
                      />
                    </label>
                  }
                >
                  <div className="relative">
                    <FileTextIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={teklifId}
                      onChange={(e) => (e.target.value ? teklifSec(e.target.value) : setTeklifId(''))}
                      disabled={!firmaUnvan}
                      aria-label="Bağlı teklif"
                      className="h-8 w-full rounded-lg border border-input bg-background pr-2.5 pl-7 text-xs outline-none focus-visible:border-ring disabled:opacity-60 dark:bg-input/30"
                    >
                      <option value="">{firmaTeklifleri.length ? 'Teklif bağlamadan planla' : 'Bu firmanın teklifi yok'}</option>
                      {firmaTeklifleri.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.no} · {t.hizmet} · {t.durum}
                        </option>
                      ))}
                    </select>
                  </div>
                </Bolum>
              </div>
              <Bolum no={4} baslik="Tarama zamanı" sag={<span className="hidden text-[11px] text-muted-foreground tabular-nums sm:inline">{zamanMetni}{gunAraligi > 0 ? ` · ${gunAraligi} gün` : ' · Bitiş başlangıçtan önce'}</span>}>
                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_14rem]">
                  <div className="flex flex-col gap-2.5">
                    <ZamanSatiri etiket="Başlangıç" tarih={tarih} saat={saat} onTarih={baslangicYaz} onSaat={setSaat} />
                    <div className="inline-flex flex-wrap self-start rounded-lg bg-muted p-0.5">
                      {TARIH_KISAYOLLARI.map((k) => (
                        <Chip key={k.n} aktif={tarih === gunEkle(k.n)} onClick={() => baslangicYaz(gunEkle(k.n))}>
                          {k.e}
                        </Chip>
                      ))}
                    </div>
                    <ZamanSatiri etiket="Bitiş" tarih={bitisTarih} saat={bitisSaat} onTarih={bitisYaz} onSaat={setBitisSaat} />
                  </div>
                  <MiniTakvim baslangic={tarih} bitis={bitisTarih} onGun={gunSec} />
                </div>
              </Bolum>
              <Bolum no={5} baslik="Tarama başlığı" aciklama="Otomatik oluşur">
                <div className="flex items-center gap-2.5 rounded-lg border-l-4 border-amber-400 bg-background px-3 py-1.5 sm:py-2">
                  <FileTextIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className={cn('truncate text-sm font-semibold', !firma && 'font-normal text-muted-foreground')}>{firma ? baslik : 'Firma seçildiğinde başlık oluşur'}</span>
                </div>
              </Bolum>
            </div>
          )}

          {/* 2. adım: split ekran — sol paket/test, sağ seçilen testler ve miktarlar */}
          {adimIdx === 1 && (
            <div className="grid min-h-0 flex-1 bg-muted/20 p-2 sm:p-3 md:grid-cols-[1fr_1.1fr] md:gap-3">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="shrink-0 space-y-2 border-b p-2">
                  <div className="grid grid-cols-2 rounded-lg bg-muted p-0.5">
                    {(
                      [
                        { k: 'paket', ad: 'Paketler', sayi: bosPaketler.length },
                        { k: 'test', ad: 'Testler', sayi: bosTestler.length },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.k}
                        type="button"
                        onClick={() => setPaketSekme(s.k)}
                        aria-pressed={paketSekme === s.k}
                        className={cn('flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-colors', paketSekme === s.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                      >
                        {s.ad}
                        <span className="rounded bg-muted px-1 text-[10px] tabular-nums">{s.sayi}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input value={aramaT} onChange={(e) => setAramaT(e.target.value)} placeholder={paketSekme === 'paket' ? 'Paket ara' : 'Test ara'} aria-label="Ara" className="h-8 pl-8" />
                    </div>
                    {paketSekme === 'test' && (
                      <select
                        value={kategoriF}
                        onChange={(e) => setKategoriF(e.target.value)}
                        aria-label="Kategoriye göre filtrele"
                        className="h-8 w-36 shrink-0 rounded-lg border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
                      >
                        {kategoriler.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
                  {paketSekme === 'paket' &&
                    bosPaketler.map((p) => {
                      const tamam = p.testIdleri.every((id) => id in kalem)
                      const fiyat = p.testIdleri.reduce((t, id) => {
                        const x = testler.find((y) => y.id === id)
                        return t + (x?.durum === 'Aktif' ? x.fiyat : 0)
                      }, 0)
                      return (
                        <li key={p.id}>
                          <div className={cn('flex items-center gap-2 rounded-lg border bg-background px-2.5 py-2', tamam && 'border-emerald-500/30 bg-emerald-500/5')}>
                            <PackageIcon className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold">{p.ad}</p>
                              <p className="truncate text-[10px] text-muted-foreground tabular-nums">
                                {p.testIdleri.length} test · {tl(fiyat)}
                              </p>
                            </div>
                            <Button size="xs" variant={tamam ? 'ghost' : 'outline'} disabled={tamam} onClick={() => paketEkle(p.testIdleri)}>
                              {tamam ? (
                                <>
                                  <CheckIcon /> Eklendi
                                </>
                              ) : (
                                <>
                                  <PlusIcon /> Ekle
                                </>
                              )}
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  {paketSekme === 'test' &&
                    bosTestler.map((t) => (
                      <li key={t.id}>
                        <button type="button" onClick={() => testEkle(t.id, t.ad, t.fiyat)} className="group flex w-full items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-left transition-colors hover:border-amber-400/60 hover:bg-amber-400/5">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-amber-400 group-hover:text-zinc-950">
                            <PlusIcon className="size-3" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium">{t.ad}</span>
                            <span className="block truncate text-[10px] text-muted-foreground">{t.kategori}</span>
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{tl(t.fiyat)}</span>
                        </button>
                      </li>
                    ))}
                  {((paketSekme === 'paket' && bosPaketler.length === 0) || (paketSekme === 'test' && bosTestler.length === 0)) && (
                    <li className="py-6 text-center text-xs text-muted-foreground">Eşleşen kayıt yok.</li>
                  )}
                </ul>
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="shrink-0 space-y-2 border-b p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold">
                      Seçilen testler <span className="ml-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] tabular-nums">{kalemListe.length}</span>
                    </h3>
                    {kalemListe.length > 0 && (
                      <button type="button" onClick={() => setKalem({})} className="text-[11px] text-muted-foreground hover:text-red-600">
                        Tümünü kaldır
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/50 p-1.5">
                    <span className="pl-1 text-[11px] font-medium text-muted-foreground">Toplu miktar</span>
                    <Input type="number" min={1} value={topluMiktar} onChange={(e) => setTopluMiktar(Math.max(1, Math.floor(Number(e.target.value) || 1)))} aria-label="Toplu miktar" className="h-7 w-16 text-center text-xs tabular-nums" />
                    <Button size="xs" variant="outline" onClick={topluUygula} disabled={kalemListe.length === 0}>
                      Tümüne uygula
                    </Button>
                    <Button size="xs" variant="outline" onClick={kisiyeUygula} disabled={kalemListe.length === 0}>
                      <UsersIcon /> Kişi sayısı ({planlanan})
                    </Button>
                  </div>
                </div>

                <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2.5">
                  {kalemListe.map((k) => (
                    <li key={k.id} className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{k.ad}</p>
                        <p className="truncate text-[10px] text-muted-foreground tabular-nums">
                          {tl(k.birim)} × {k.miktar}
                        </p>
                      </div>
                      <MiktarKontrol deger={k.miktar} onChange={(n) => miktarAyarla(k.id, n)} />
                      <span className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums">{tl(k.birim * k.miktar)}</span>
                      <button type="button" aria-label={`${k.ad} kaldır`} onClick={() => testCikar(k.id)} className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600">
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </li>
                  ))}
                  {kalemListe.length === 0 && (
                    <li className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-center">
                      <FlaskConicalIcon className="size-6 text-muted-foreground/60" />
                      <p className="text-xs font-medium">Henüz test seçilmedi</p>
                      <p className="text-[11px] text-muted-foreground">Soldaki paket veya testlerden ekleyin.</p>
                    </li>
                  )}
                </ul>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Kalem toplamı</span>
                  <span className="text-sm font-semibold tabular-nums">{tl(kalemToplam)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. adım: fiyat — sol kalemler, sağ genel fiyat, indirim, KDV ve tutar özeti */}
          {adimIdx === 2 && (
            <div className="grid min-h-0 flex-1 gap-2.5 bg-muted/20 p-2 sm:p-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.4fr)] md:gap-3">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                  <h3 className="text-xs font-semibold">
                    Kalemler <span className="ml-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] tabular-nums">{kalemListe.length}</span>
                  </h3>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{planlanan} kişi</span>
                </div>
                <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_6rem] items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <span>Test</span>
                  <span className="text-right">Birim</span>
                  <span className="text-center">Miktar</span>
                  <span className="text-right">Tutar</span>
                </div>
                <ul className="flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
                  {kalemListe.map((k) => {
                    const liste = testler.find((t) => t.id === k.id)?.fiyat
                    return (
                      <li key={k.id} className="grid grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_6rem] items-center gap-2 px-3 py-1.5">
                        <span className="truncate text-xs font-medium">{k.ad}</span>
                        <div className="relative">
                          <Input type="number" min={0} value={k.birim} onChange={(e) => birimAyarla(k.id, Number(e.target.value) || 0)} aria-label={`${k.ad} birim fiyat`} className={cn('h-7 pr-5 text-right text-xs tabular-nums', liste !== undefined && k.birim !== liste && 'border-amber-400/70 bg-amber-400/5')} />
                          <span className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[10px] text-muted-foreground">₺</span>
                        </div>
                        <div className="flex justify-center">
                          <MiktarKontrol deger={k.miktar} onChange={(n) => miktarAyarla(k.id, n)} />
                        </div>
                        <span className="text-right text-xs font-semibold tabular-nums">{tl(k.birim * k.miktar)}</span>
                      </li>
                    )
                  })}
                  {kalemListe.length === 0 && <li className="py-8 text-center text-xs text-muted-foreground">Seçilmiş test yok.</li>}
                </ul>
                <div className="flex shrink-0 items-center justify-between border-t bg-muted/30 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">
                    Kalem toplamı <span className="text-muted-foreground/70">(indirim ve KDV öncesi)</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{tl(kalemToplam)}</span>
                </div>
              </div>

              <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
                <Bolum
                  no={1}
                  baslik="Genel fiyat"
                  sag={
                    hedef !== null ? (
                      <button type="button" onClick={hedefSifirla} className="text-[11px] text-muted-foreground hover:text-foreground">
                        Sıfırla
                      </button>
                    ) : undefined
                  }
                >
                  <div className="flex gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <Input type="number" min={0} value={hedefGirdi} onChange={(e) => setHedefGirdi(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && hedefUygula()} placeholder={Math.round(genelToplam).toString()} aria-label="Hedef genel toplam" className="h-8 pr-7 tabular-nums" />
                      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">₺</span>
                    </div>
                    <Button size="sm" onClick={hedefUygula} disabled={hedefGirdi.trim() === '' || kalemToplam <= 0}>
                      Uygula
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {hedef === null
                      ? 'KDV dahil toplamı yazın; fark otomatik indirim ya da artış olur.'
                      : indirimTL >= 0
                        ? <>Otomatik indirim <span className="font-semibold text-red-600 dark:text-red-400">{tl(indirimTL)}</span> (%{indirimYuzde.toFixed(2)})</>
                        : <>Otomatik artış <span className="font-semibold text-emerald-600 dark:text-emerald-400">{tl(-indirimTL)}</span> (%{(-indirimYuzde).toFixed(2)})</>}
                  </p>
                </Bolum>

                <Bolum no={2} baslik="İndirim">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex shrink-0 rounded-lg bg-muted p-0.5">
                      {(
                        [
                          { k: 'yuzde', e: '%' },
                          { k: 'tl', e: '₺' },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.k}
                          type="button"
                          aria-pressed={indirimTip === t.k}
                          onClick={() => {
                            setIndirimTip(t.k)
                            setHedef(null)
                          }}
                          className={cn('min-w-8 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors', indirimTip === t.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                        >
                          {t.e}
                        </button>
                      ))}
                    </div>
                    <div className="relative min-w-0 flex-1">
                      <Input
                        type="number"
                        min={0}
                        max={indirimTip === 'yuzde' ? 100 : undefined}
                        value={indirimDeger}
                        onChange={(e) => {
                          setIndirimDeger(Math.max(0, Number(e.target.value) || 0))
                          setHedef(null)
                        }}
                        aria-label="İndirim değeri"
                        className="h-8 pr-7 tabular-nums"
                      />
                      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">{indirimTip === 'yuzde' ? '%' : '₺'}</span>
                    </div>
                  </div>
                </Bolum>

                <Bolum no={3} baslik="KDV oranı">
                  <div className="flex items-center gap-2">
                    <div className="grid flex-1 grid-cols-4 gap-1">
                      {KDV_ORANLARI.map((o) => (
                        <button
                          key={o}
                          type="button"
                          aria-pressed={kdv === o}
                          onClick={() => setKdv(o)}
                          className={cn('rounded-md border bg-background py-1 text-xs font-semibold tabular-nums transition-colors hover:bg-muted/50', kdv === o && 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/50')}
                        >
                          %{o}
                        </button>
                      ))}
                    </div>
                    <div className="relative w-20 shrink-0">
                      <Input type="number" min={0} max={100} value={kdv} onChange={(e) => setKdv(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} aria-label="KDV oranı (elle)" className="h-8 pr-6 text-right tabular-nums" />
                      <PercentIcon className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </Bolum>

                <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-zinc-950 p-3.5 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                  <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-amber-400/20 blur-2xl" />
                  <p className="relative text-[10px] font-semibold tracking-[0.18em] uppercase opacity-60">Tutar özeti</p>
                  <dl className="relative mt-2 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <dt className="opacity-70">Kalem toplamı</dt>
                      <dd className="font-medium tabular-nums">{tl(kalemToplam)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="opacity-70">{indirimTL >= 0 ? 'İndirim' : 'Artış'}</dt>
                      <dd className={cn('font-medium tabular-nums', indirimTL >= 0 ? 'text-red-400 dark:text-red-600' : 'text-emerald-400 dark:text-emerald-600')}>
                        {indirimTL >= 0 ? '−' : '+'} {tl(Math.abs(indirimTL))}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-1.5 dark:border-black/10">
                      <dt className="opacity-70">Net (KDV hariç)</dt>
                      <dd className="font-semibold tabular-nums">{tl(netToplam)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="opacity-70">KDV %{kdv}</dt>
                      <dd className="font-medium tabular-nums">{tl(kdvTutar)}</dd>
                    </div>
                  </dl>
                  <div className="relative mt-auto rounded-lg bg-amber-400 px-3.5 py-2.5 text-zinc-950">
                    <p className="text-[10px] font-semibold tracking-wide uppercase opacity-70">Genel toplam · KDV dahil</p>
                    <p className="text-2xl font-bold tabular-nums">{tl(genelToplam)}</p>
                  </div>
                  <p className="relative mt-2 text-center text-[11px] opacity-60 tabular-nums">Kişi başı {tl(genelToplam / planlanan)} · {planlanan} kişi</p>
                </section>
              </div>
            </div>
          )}

          {/* 4. adım: ekip ve lokasyon */}
          {adimIdx === 3 && (
            <div className="grid min-h-0 flex-1 gap-2.5 bg-muted/20 p-2 sm:p-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.4fr)] md:gap-3">
              <div className="flex min-h-0 flex-col gap-2.5 overflow-hidden">
                <Bolum
                  no={1}
                  baslik="Saha ekibi"
                  aciklama="Taramayı yürütecek üyeler"
                  sag={<span className="text-[11px] text-muted-foreground tabular-nums">{seciliEkipUyeleri.length} üye seçili</span>}
                >
                  <div className="grid max-h-56 gap-1.5 overflow-y-auto sm:grid-cols-2">
                    {ekipUyeleri.map((u) => {
                      const secili = ekipUyeIdleri.includes(u.id)
                      return (
                        <SecimKart key={u.id} secili={secili} onClick={() => ekipUyeTikla(u.id)} className="flex items-center justify-between gap-2 py-1.5">
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold">
                              {u.ad} {u.soyad}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">{u.gorev}</span>
                          </span>
                          <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', secili ? 'bg-amber-400 text-zinc-950' : 'bg-muted text-muted-foreground')}>
                            {secili ? <CheckIcon className="size-3.5" /> : <UsersIcon className="size-3.5" />}
                          </span>
                        </SecimKart>
                      )
                    })}
                    {ekipUyeleri.length === 0 && <p className="col-span-full py-4 text-center text-xs text-muted-foreground">Ekip modülünde aktif üye yok.</p>}
                  </div>
                </Bolum>
                <Bolum no={2} baslik="Lokasyon" aciklama="Bina, kat veya bölüm">
                  <div className="relative">
                    <MapPinIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input value={lokasyon} onChange={(e) => setLokasyon(e.target.value)} placeholder="Örn. Fabrika A blok, 2. kat" aria-label="Lokasyon" className="h-9 pl-8 text-sm" />
                  </div>
                </Bolum>
              </div>
              <div className="flex min-h-0 flex-col gap-2.5 overflow-hidden">
                <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-zinc-950 p-3.5 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-60">Plan özeti</p>
                  <dl className="mt-2 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <dt className="opacity-70">Zaman</dt>
                      <dd className="font-medium tabular-nums">{zamanMetni}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="opacity-70">Ekip</dt>
                      <dd className="max-w-[60%] truncate text-right font-medium">{ekipMetni || '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-1.5 dark:border-black/10">
                      <dt className="opacity-70">Tür</dt>
                      <dd className="max-w-[60%] truncate font-semibold">{hizmet}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto rounded-lg bg-amber-400 px-3.5 py-2.5 text-zinc-950">
                    <p className="text-[10px] font-semibold tracking-wide uppercase opacity-70">Planlanan kişi</p>
                    <p className="text-2xl font-bold tabular-nums">{planlanan}</p>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* 5. adım: notlar (şartlar düzeniyle) */}
          {adimIdx === 4 && (
            <div className="grid min-h-0 flex-1 gap-2.5 bg-muted/20 p-2 sm:p-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-3">
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                  <h3 className="text-xs font-semibold">
                    Saha notları <span className="ml-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] tabular-nums">{notlar.length}</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Button size="xs" variant="ghost" onClick={() => setNotlar([])} disabled={notlar.length === 0}>
                      Tümünü temizle
                    </Button>
                    <Button size="xs" variant="outline" onClick={() => setNotlar([...HAZIR_NOTLAR.slice(0, 3)])}>
                      <RotateCcwIcon /> Varsayılan
                    </Button>
                  </div>
                </header>

                <div className="shrink-0 space-y-2 border-b p-2.5">
                  <div className="flex gap-1.5">
                    <Input value={yeniNot} onChange={(e) => setYeniNot(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && notEkle(yeniNot)} placeholder="Yeni not yazın ve Enter'a basın" aria-label="Yeni not" className="h-8 text-xs" />
                    <Button size="sm" onClick={() => notEkle(yeniNot)} disabled={!yeniNot.trim()}>
                      <PlusIcon /> Ekle
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="mr-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Hazır notlar</span>
                    {HAZIR_NOTLAR.filter((h) => !notlar.includes(h)).map((h) => (
                      <button key={h} type="button" onClick={() => notEkle(h)} title={h} className="inline-flex max-w-full items-center rounded-full border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-amber-400/60 hover:bg-amber-400/5 hover:text-foreground">
                        <span className="max-w-56 truncate">+ {h}</span>
                      </button>
                    ))}
                    {HAZIR_NOTLAR.every((h) => notlar.includes(h)) && <span className="text-[11px] text-muted-foreground">Tüm hazır notlar eklendi.</span>}
                  </div>
                </div>

                <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2.5">
                  {notlar.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg border bg-background p-2">
                      <span className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">{i + 1}</span>
                      <textarea value={s} onChange={(e) => notGuncelle(i, e.target.value)} rows={2} aria-label={`${i + 1}. not`} className="min-w-0 flex-1 resize-none rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs leading-relaxed outline-none focus:border-input focus:bg-background" />
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button type="button" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => notTasi(i, -1)} className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30">
                          <ArrowUpIcon className="size-3.5" />
                        </button>
                        <button type="button" aria-label="Aşağı taşı" disabled={i === notlar.length - 1} onClick={() => notTasi(i, 1)} className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30">
                          <ArrowDownIcon className="size-3.5" />
                        </button>
                        <button type="button" aria-label="Notu sil" onClick={() => notSil(i)} className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600">
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                  {notlar.length === 0 && (
                    <li className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-6 text-center">
                      <p className="text-xs font-medium">Henüz not yok</p>
                      <p className="text-[11px] text-muted-foreground">Yukarıdan yazın veya hazır notlardan ekleyin.</p>
                    </li>
                  )}
                </ol>
              </section>

              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-muted/40 p-2.5 sm:p-3">
                <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden rounded-md bg-white px-6 py-5 text-zinc-800 shadow-md ring-1 ring-black/5">
                  <p className="shrink-0 text-[11px] font-bold tracking-wide text-zinc-900 uppercase">Saha notları</p>
                  <p className="shrink-0 truncate text-[10px] text-zinc-500">{baslik}</p>
                  <ol className="mt-3 min-h-0 flex-1 space-y-2 overflow-hidden text-[11px] leading-relaxed">
                    {notlar.filter((s) => s.trim()).map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 font-semibold tabular-nums text-zinc-900">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            </div>
          )}

          {/* 6. adım: ön yazı — sol metin düzenleme, sağ belge önizleme */}
          {adimIdx === 5 && (
            <div className="grid min-h-0 flex-1 gap-2.5 bg-muted/20 p-2 sm:p-3 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-3">
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                  <h3 className="text-xs font-semibold">
                    Tarama ön yazısı <span className="ml-1 text-[11px] font-normal text-muted-foreground">· düzenleyebilirsiniz</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {onYaziDuzenlendi && <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">Düzenlendi</span>}
                    <Button size="xs" variant="outline" onClick={onYaziYenile} disabled={!onYaziDuzenlendi}>
                      <RotateCcwIcon /> Otomatik
                    </Button>
                  </div>
                </header>
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Uzunluk</span>
                    <div className="inline-flex rounded-lg bg-muted p-0.5">
                      {ONYAZI_UZUNLUK.map((u) => (
                        <button
                          key={u.k}
                          type="button"
                          aria-pressed={onYaziUzunluk === u.k}
                          onClick={() => onYaziAyarla('uzunluk', u.k)}
                          className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors', onYaziUzunluk === u.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                        >
                          {u.e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Ton</span>
                    <div className="inline-flex rounded-lg bg-muted p-0.5">
                      {ONYAZI_TON.map((t) => (
                        <button
                          key={t.k}
                          type="button"
                          aria-pressed={onYaziTon === t.k}
                          onClick={() => onYaziAyarla('ton', t.k)}
                          className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors', onYaziTon === t.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                        >
                          {t.e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <textarea
                  value={onYazi}
                  onChange={(e) => {
                    setOnYaziMetin(e.target.value)
                    setOnYaziDuzenlendi(true)
                  }}
                  aria-label="Tarama ön yazısı metni"
                  placeholder="Firma seçildiğinde ön yazı otomatik oluşur."
                  className="min-h-0 flex-1 resize-none bg-transparent p-3 text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
                />
                <footer className="flex shrink-0 items-center justify-between border-t px-3 py-1.5 text-[11px] text-muted-foreground tabular-nums">
                  <span>{onYazi.split(/\n\s*\n/).filter(Boolean).length} paragraf</span>
                  <span>{onYazi.length} karakter</span>
                </footer>
              </section>

              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-muted/40 p-2.5 sm:p-3">
                <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden rounded-md bg-white px-6 py-5 text-zinc-800 shadow-md ring-1 ring-black/5">
                  <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 pb-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold tracking-wide text-zinc-900 uppercase">{kurum.kisaAd || kurum.unvan}</p>
                      <p className="truncate text-[10px] text-zinc-500">{kurum.unvan}</p>
                    </div>
                    <p className="shrink-0 text-[10px] text-zinc-500 tabular-nums">{tarih ? formatUzun(tarih) : ''}</p>
                  </div>
                  <p className="mt-2.5 shrink-0 truncate text-[11px] font-semibold text-zinc-900">Konu: {baslik || 'Tarama'}</p>
                  <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-hidden text-[11px] leading-relaxed text-zinc-700">
                    {onYazi
                      .split(/\n\s*\n/)
                      .filter(Boolean)
                      .map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 7. adım: özet ve kayıt */}
          {adimIdx === 6 && (
            <div className="flex min-h-0 flex-1 flex-col justify-start gap-2.5 overflow-y-auto bg-muted/20 md:overflow-hidden px-2 py-2.5 sm:px-4 sm:py-3">
              <div className="grid min-h-0 flex-1 gap-2.5 md:grid-cols-[1.1fr_1fr]">
                <div className="flex min-h-0 flex-col rounded-xl border bg-card p-3.5 shadow-sm">
                  <p className="text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">Tarama planı</p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug">{baslik}</p>
                  <dl className="mt-2.5 grid content-start gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                    {[
                      ['Firma', firma?.unvan ?? '—'],
                      ['Tür', hizmet],
                      ['Zaman', zamanMetni],
                      ['Ekip', ekipMetni || '—'],
                      ['Lokasyon', lokasyon || '—'],
                      ['Kişi', `${planlanan} kişi`],
                      ['Test', `${kalemListe.length} test`],
                    ].map(([k, v]) => (
                      <div key={k} className="min-w-0 border-b border-border/60 pb-1">
                        <dt className="text-[10px] text-muted-foreground">{k}</dt>
                        <dd className="truncate font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-auto flex items-end justify-between gap-2 rounded-lg bg-zinc-950 px-3.5 py-2.5 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <div>
                      <p className="text-[10px] opacity-70">Kişi başı {tl(genelToplam / planlanan)}</p>
                      <p className="text-[11px] opacity-70">KDV dahil toplam</p>
                    </div>
                    <p className="text-xl font-semibold tabular-nums">{tl(genelToplam)}</p>
                  </div>
                </div>
                <div className="flex min-h-0 flex-col gap-2.5">
                  <OzetKontrol maddeler={kontrol} onGit={adimaGit} />
                  <Bolum baslik="Durum" className="gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      {TARAMA_DURUMLARI.map((d) => (
                        <SecimKart key={d} secili={durum === d} onClick={() => setDurum(d)} className="text-center text-xs font-semibold">
                          {d}
                        </SecimKart>
                      ))}
                    </div>
                    {duzenleModu && (
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">Tamamlanan kişi</span>
                        <input type="number" min={0} max={planlanan} value={tamamlanan} onChange={(e) => setTamamlanan(Math.max(0, Number(e.target.value) || 0))} aria-label="Tamamlanan kişi" className="h-7 w-24 rounded-md border border-input bg-background px-2 text-right text-xs tabular-nums outline-none focus-visible:border-ring dark:bg-input/30" />
                      </div>
                    )}
                  </Bolum>
                  <Bolum baslik="Ön yazı" aciklama={`${onYazi.split(/\n\s*\n/).filter(Boolean).length} paragraf`}>
                    <p className="line-clamp-3 text-[11px] leading-snug text-muted-foreground">{onYazi.trim() || 'Ön yazı boş'}</p>
                  </Bolum>
                  <Bolum baslik="Notlar" className="min-h-0 flex-1">
                    <p className="line-clamp-3 text-[11px] leading-snug text-muted-foreground">{notlar.length ? notlar.join(' · ') : 'Saha notu yok'}</p>
                  </Bolum>
                  <div className="flex flex-wrap gap-1">
                    {kalemListe.map((k) => (
                      <Pill key={k.id} tone="zinc">
                        {k.ad} × {k.miktar}
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {hata && (
            <p role="alert" className="mx-4 mb-2 shrink-0 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-700 dark:text-red-400">
              {hata}
            </p>
          )}

          <footer className="flex shrink-0 items-center justify-between gap-2 border-t bg-card px-4 py-2.5">
            <Button variant="outline" size="sm" disabled={adimIdx === 0} onClick={geri}>
              <ArrowLeftIcon /> Geri
            </Button>
            <span className="min-w-0 truncate text-[11px] text-muted-foreground">
              {adimIdx + 1} / {ADIMLAR.length} · {ADIMLAR[adimIdx].baslik}
              <span className="ml-2 hidden text-muted-foreground/70 xl:inline">· Ctrl+Enter ileri · Alt+←/→ adım</span>
            </span>
            {!sonAdim ? (
              <Button size="sm" onClick={ileri} className="min-w-28">
                İleri <ArrowRightIcon />
              </Button>
            ) : (
              <Button size="sm" onClick={kaydet} className="min-w-32 bg-amber-400 text-zinc-950 hover:bg-amber-300">
                <SaveIcon /> {duzenleModu ? 'Değişiklikleri kaydet' : 'Taramayı planla'}
              </Button>
            )}
          </footer>
        </section>
      </div>
    </div>
  )
}
