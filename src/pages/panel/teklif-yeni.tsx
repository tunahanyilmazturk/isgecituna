import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  ArrowLeftIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  BookmarkIcon,
  RotateCcwIcon,
  XIcon,
  ArrowUpIcon,
  RefreshCwIcon,
  CalendarDaysIcon,
  CheckIcon,
  FileTextIcon,
  FlaskConicalIcon,
  MinusIcon,
  PackageIcon,
  PercentIcon,
  PlusIcon,
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
import { cn } from '@/lib/utils'
import { useOsgb } from '@/lib/osgb'
import { useKosulStore } from '@/stores/kosul-store'
import { useTeklifTaslakStore } from '@/stores/teklif-taslak-store'
import { formatUzun, gunFarki, gunKaydir } from '@/lib/date'
import { BUGUN, ODEME_KOSULLARI, TEKLIF_TURLERI, gunEkle, type TeklifDurum } from '@/data/saglik'
import { FirmaSecici, FirmaOzet } from '@/components/firma-secici'
import { useFirmaStore, usePersonelKayitStore, useTeklifStore, useTestPaketiStore, useTestStore } from '@/stores/saglik-stores'

const ADIMLAR = [
  { baslik: 'Teklif bilgileri', kisa: 'Firma ve tür', aciklama: 'Firma, teklif türü, tarih ve geçerlilik', ikon: FileTextIcon },
  { baslik: 'Hizmetler ve miktar', kisa: 'Hizmetler', aciklama: 'Testleri seçin, miktarları belirleyin', ikon: FlaskConicalIcon },
  { baslik: 'Fiyat', kisa: 'Fiyat', aciklama: 'İskonto ve toplam tutar', ikon: TagIcon },
  { baslik: 'Ön yazı', kisa: 'Ön yazı', aciklama: 'Teklif metni ve belge önizleme', ikon: FileTextIcon },
  { baslik: 'Şartlar ve koşullar', kisa: 'Şartlar', aciklama: 'Madde madde koşullar', ikon: FileTextIcon },
  { baslik: 'Özet ve kayıt', kisa: 'Özet', aciklama: 'Kontrol edin ve kaydedin', ikon: CheckIcon },
] as const

const GECERLILIK_SECENEKLERI = [7, 15, 30, 60, 90] as const
const KDV_ORANLARI = [0, 1, 10, 20] as const
/** Hazır şartlar ve koşullar */
const HAZIR_SARTLAR = [
  'Teklif, belirtilen geçerlilik süresi boyunca geçerlidir.',
  'Tarama tarihleri taraflarca karşılıklı olarak belirlenir ve planlanır.',
  'Ödeme, hizmetin tamamlanmasını izleyen fatura tarihinden itibaren 30 gün içinde yapılır.',
  'Firma; tarama için gerekli alanı, personeli ve evrakı hazır bulundurmakla yükümlüdür.',
  'Tarama iptalleri en az 48 saat önceden bildirilmelidir; aksi halde iptal bedeli uygulanabilir.',
  'Sağlık verileri 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında gizli tutulur, sonuçlar kişi bazında raporlanır.',
  'Ek test ve muayene talepleri ayrı teklif ile fiyatlandırılır.',
  'Sonuçların değerlendirilmesi hekim onayı ile tamamlanır.',
] as const
const ONYAZI_UZUNLUK = [
  { k: 'kisa', e: 'Kısa' },
  { k: 'standart', e: 'Standart' },
  { k: 'detayli', e: 'Detaylı' },
] as const
const ONYAZI_TON = [
  { k: 'kurumsal', e: 'Kurumsal' },
  { k: 'samimi', e: 'Samimi' },
  { k: 'teknik', e: 'Teknik' },
] as const

const tl = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`
const kisaTarih = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR')
const teklifBasligi = (firmaAdi: string, tur: string, tarih: string) => `${firmaAdi} · ${tur} teklifi · ${kisaTarih(tarih)}`

/** Yarım kalan teklifin taslak alanları (otomatik kaydedilir) */
interface TaslakVeri {
  firmaUnvan: string
  tur: string
  gecerlilikGun: number
  kalem: Record<string, number>
  paketAdi: string
  indirimTip: 'yuzde' | 'tl'
  indirimDeger: number
  kdv: number
  hedef: number | null
  fiyatOverride: Record<string, number>
  durum: TeklifDurum
  notlar: string
  onYaziMetin: string
  onYaziDuzenlendi: boolean
  onYaziUzunluk: 'kisa' | 'standart' | 'detayli'
  onYaziTon: 'kurumsal' | 'samimi' | 'teknik'
  sartlar: string[]
  odemeKosulu: string
  adimIdx: number
}

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


/** Miktar kontrolü: − [değer] + */
function MiktarKontrol({ deger, onChange, boyut = 'normal' }: { deger: number; onChange: (n: number) => void; boyut?: 'normal' | 'kucuk' }) {
  const kucuk = boyut === 'kucuk'
  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
      <button
        type="button"
        aria-label="Miktarı azalt"
        onClick={() => onChange(Math.max(1, deger - 1))}
        className={cn('flex items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/70', kucuk ? 'size-6' : 'size-7')}
      >
        <MinusIcon className="size-3" />
      </button>
      <input
        type="number"
        min={1}
        value={deger}
        aria-label="Miktar"
        onChange={(e) => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        className={cn(
          'bg-transparent text-center font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
          kucuk ? 'w-9 text-xs' : 'w-12 text-sm',
        )}
      />
      <button
        type="button"
        aria-label="Miktarı artır"
        onClick={() => onChange(deger + 1)}
        className={cn('flex items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/70', kucuk ? 'size-6' : 'size-7')}
      >
        <PlusIcon className="size-3" />
      </button>
    </div>
  )
}

/* ---------------------------------- Sayfa ---------------------------------- */

/** Teklif türüne özgü ön yazı içerikleri */
const TUR_METNI: Record<string, { amac: string; plan: string; takip: string; teknik: string; detay: string }> = {
  'İşe giriş taraması': {
    amac: 'işe başlayacak çalışanların mesleki sağlık uygunluğunun belirlenmesi ve işe giriş sağlık değerlendirmelerinin tamamlanması',
    plan: 'Muayeneler işe başlama tarihinden önce tamamlanacak; her çalışan için uygunluk durumunu gösteren bir belge düzenlenecektir.',
    takip: 'Uygunluk kararları kişi bazında kurumunuza bildirilecek; kısıtlı çalışma gerektiren durumlar ayrıca raporlanacaktır.',
    teknik: 'İşe giriş muayeneleri, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler uyarınca işyeri hekimi gözetiminde yapılacak ve sonuçlar kişi bazında belgelenecektir.',
    detay: 'Detaylı kapsamda işe giriş formu ve çalışanların önceki sağlık kayıtları değerlendirmeye alınacaktır.',
  },
  'Periyodik muayene': {
    amac: 'mevcut çalışanların düzenli sağlık gözetiminin sürdürülmesi ve maruziyet risklerine bağlı periyodik muayene ve tetkiklerin yapılması',
    plan: 'Muayene periyotları çalışanların risk sınıfına göre belirlenecek; takvim üretim vardiyalarına uygun olarak planlanacaktır.',
    takip: 'Tekrarlayan bulgular ve önlem önerileri dönem sonunda kurumunuza ayrıca raporlanacaktır.',
    teknik: 'Periyodik sağlık gözetimi, 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili mevzuat gereği işyeri hekimi gözetiminde yürütülecek; sonuçlar kişi bazında izlenerek belgelenecektir.',
    detay: 'Detaylı kapsamda önceki muayene sonuçları karşılaştırmalı olarak incelenecek ve risk grubu bazında değerlendirme raporu hazırlanacaktır.',
  },
}

export default function TeklifYeniPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const firmalar = useFirmaStore((s) => s.kayitlar)
  const firmaEkle = useFirmaStore((s) => s.ekle)
  const personeller = usePersonelKayitStore((s) => s.kayitlar)
  const paketler = useTestPaketiStore((s) => s.kayitlar)
  const testler = useTestStore((s) => s.kayitlar)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const ekle = useTeklifStore((s) => s.ekle)
  const guncelle = useTeklifStore((s) => s.guncelle)

  /* Kopya: var olan teklif taban alınır (revize). Taslak: yarım kalan kayıt geri yüklenebilir. */
  /* duzenle: mevcut teklifi günceller; kopya: yeni teklif için taban alır */
  const duzenleId = params.get('duzenle')
  const hedefId = duzenleId ?? params.get('kopya')
  const kaynak = hedefId ? teklifler.find((t) => t.id === hedefId) : undefined
  const duzenleModu = !!duzenleId && !!kaynak
  const kaynakTur = kaynak && (TEKLIF_TURLERI as readonly string[]).includes(kaynak.hizmet) ? kaynak.hizmet : TEKLIF_TURLERI[0]
  const taslak = useTeklifTaslakStore((s) => s.taslak)
  const taslakKaydet = useTeklifTaslakStore((s) => s.kaydet)
  const taslakTemizle = useTeklifTaslakStore((s) => s.temizle)
  const [taslakGoster, setTaslakGoster] = useState(() => !kaynak && !params.get('firma') && !!taslak)

  const [adimIdx, setAdimIdx] = useState(0)
  const [firmaUnvan, setFirmaUnvan] = useState(() => kaynak?.firma ?? params.get('firma') ?? '')
  const [tur, setTur] = useState<string>(kaynakTur)
  const [gecerlilikGun, setGecerlilikGun] = useState<number>(30)
  const [kalem, setKalem] = useState<Record<string, number>>(() =>
    Object.fromEntries((kaynak?.kalemler ?? []).map((k) => [k.testId, k.miktar])),
  )
  const [paketAdi, setPaketAdi] = useState(kaynak?.paketAdi ?? '')
  const [sekme, setSekme] = useState<'paket' | 'test'>('paket')
  const [aramaT, setAramaT] = useState('')
  const [kategoriF, setKategoriF] = useState('Tümü')
  const [topluMiktar, setTopluMiktar] = useState(1)
  const [indirimTip, setIndirimTip] = useState<'yuzde' | 'tl'>('yuzde')
  const [indirimDeger, setIndirimDeger] = useState(kaynak?.iskontoYuzde ?? 0)
  const [kdv, setKdv] = useState<number>(kaynak?.kdvOrani ?? 20)
  /** Hedef genel toplam (KDV dahil); doluysa indirim/artış buna göre otomatik hesaplanır */
  const [hedef, setHedef] = useState<number | null>(null)
  const [hedefGirdi, setHedefGirdi] = useState("")
  /** Kalem bazında birim fiyat düzenlemesi (liste fiyatından farklıysa) */
  const [fiyatOverride, setFiyatOverride] = useState<Record<string, number>>(() =>
    Object.fromEntries((kaynak?.kalemler ?? []).map((k) => [k.testId, k.birim])),
  )
  const [durum, setDurum] = useState<TeklifDurum>('Taslak')
  const [notlar, setNotlar] = useState(kaynak?.notlar ?? '')
  const [odemeKosulu, setOdemeKosulu] = useState<string>(kaynak?.odemeKosulu ?? ODEME_KOSULLARI[2])
  const [hata, setHata] = useState<string | null>(null)

  /* Teklif tarihi: varsayılan bugün; düzenlemede kayıtlı tarih. Geçerlilik tarihten itibaren hesaplanır. */
  const [tarih, setTarih] = useState<string>(() => kaynak?.tarih ?? BUGUN)
  const gecerlilikTarihi = gunKaydir(tarih, gecerlilikGun)
  const firma = firmalar.find((f) => f.unvan === firmaUnvan)
  const baslik = firma ? teklifBasligi(firma.kisaAd, tur, tarih) : ''

  /** Firma çalışan sayısı: aktif personel adedi (miktar varsayılanı) */
  const calisanSayisi = useMemo(
    () => (firma ? personeller.filter((p) => p.firma === firma.unvan && p.durum === 'Aktif').length : 0),
    [personeller, firma],
  )
  const varsayilanMiktar = Math.max(1, calisanSayisi)

  const secilenIdler = Object.keys(kalem)
  const secilenTestler = useMemo(
    () =>
      Object.keys(kalem)
        .map((id) => testler.find((t) => t.id === id))
        .filter((t): t is NonNullable<typeof t> => !!t)
        .sort((a, b) => a.kategori.localeCompare(b.kategori, 'tr') || a.ad.localeCompare(b.ad, 'tr')),
    [kalem, testler],
  )
  const aktifTestler = useMemo(() => testler.filter((t) => t.durum === 'Aktif'), [testler])
  const kategoriler = useMemo(() => ['Tümü', ...Array.from(new Set(aktifTestler.map((t) => t.kategori))).sort((a, b) => a.localeCompare(b, 'tr'))], [aktifTestler])
  const bosTestler = useMemo(() => {
    const q = aramaT.toLocaleLowerCase('tr').trim()
    return aktifTestler.filter(
      (t) =>
        !(t.id in kalem) &&
        (kategoriF === 'Tümü' || t.kategori === kategoriF) &&
        (!q || `${t.ad} ${t.kategori}`.toLocaleLowerCase('tr').includes(q)),
    )
  }, [aktifTestler, kalem, aramaT, kategoriF])
  const bosPaketler = useMemo(() => {
    const q = aramaT.toLocaleLowerCase('tr').trim()
    return paketler.filter((p) => !q || p.ad.toLocaleLowerCase('tr').includes(q))
  }, [paketler, aramaT])

  const birimOf = (t: { id: string; fiyat: number }) => fiyatOverride[t.id] ?? t.fiyat
  const kalemToplam = secilenTestler.reduce((t, x) => t + birimOf(x) * (kalem[x.id] ?? 0), 0)
  const hedefNet = hedef !== null ? hedef / (1 + kdv / 100) : null
  const indirimTL =
    hedefNet !== null
      ? kalemToplam - hedefNet
      : indirimTip === "yuzde"
        ? (kalemToplam * indirimDeger) / 100
        : Math.min(indirimDeger, kalemToplam)
  const indirimYuzde = kalemToplam > 0 ? (indirimTL / kalemToplam) * 100 : 0
  const netToplam = kalemToplam - indirimTL
  const kdvTutar = (netToplam * kdv) / 100
  const genelToplam = netToplam + kdvTutar
  const kisi = Math.max(1, calisanSayisi)
  const netBirim = netToplam / kisi

  const kurum = useOsgb()
  /* Düzenlemede kayıtlı ön yazı korunur; kopyada tarih ve tutarlarla yeniden üretilir */
  const [onYaziMetin, setOnYaziMetin] = useState(() => (duzenleModu ? (kaynak?.onYazi ?? '') : ''))
  const [onYaziDuzenlendi, setOnYaziDuzenlendi] = useState(() => duzenleModu && !!kaynak?.onYazi)
  const [onYaziUzunluk, setOnYaziUzunluk] = useState<'kisa' | 'standart' | 'detayli'>('standart')
  const [onYaziTon, setOnYaziTon] = useState<'kurumsal' | 'samimi' | 'teknik'>('kurumsal')
  /** Firma, tür, kişi, test ve tutar bilgilerinden; teklif türüne, uzunluğa ve tona göre üretilen ön yazı */
  const onYaziOtomatik = useMemo(() => {
    if (!firma) return ''
    const cfg = TUR_METNI[tur] ?? TUR_METNI[TEKLIF_TURLERI[0]]
    const turKucuk = tur.toLocaleLowerCase('tr')
    const onek =
      onYaziTon === 'samimi'
        ? 'Sizin için hazırladığımız'
        : onYaziTon === 'teknik'
          ? 'Mevzuat gereklilikleri doğrultusunda hazırlanan'
          : 'Kurumunuz için hazırladığımız'
    const hitap = onYaziTon === 'samimi' ? `Merhaba ${firma.yetkili},` : `Sayın ${firma.yetkili},`
    const giris = `${onek} ${turKucuk} teklifimiz; ${cfg.amac} amacıyla ${kisi} çalışanınızı kapsayan bir tarama programını içermektedir.`
    const kapsam = `Program ${secilenTestler.length} farklı test ve muayeneden oluşmaktadır${paketAdi ? `; ${paketAdi} temel alınmıştır` : ''}.${kisi >= 50 ? ' Çalışan sayınız göz önüne alınarak saha ekibinin vardiya düzenine uygun bir çizelge hazırlanacaktır.' : ''}`
    const metodoloji =
      onYaziTon === 'teknik'
        ? `${cfg.teknik} ${cfg.takip}`
        : onYaziTon === 'samimi'
          ? `${cfg.plan} Her çalışana sonuçları gizlilik içinde anlatılacak ve kurumunuza toplu bir rapor sunulacaktır.`
          : `${cfg.plan} ${cfg.takip}`
    const detayNotu = onYaziTon === 'teknik' ? '' : cfg.detay
    const testListesi = secilenTestler.length > 0 ? `Teklifte yer alan testler: ${secilenTestler.map((t) => t.ad).join(', ')}.` : ''
    const indirimNotu = indirimTL > 0 ? `; teklifte %${indirimYuzde.toFixed(1)} indirim uygulanmıştır` : ''
    const acelesi = gecerlilikGun <= 15 ? ' Geçerlilik süresi kısa olduğundan onayınızı önceliklendirmenizi rica ederiz.' : ''
    const fiyat = `Genel toplam KDV dahil ${tl(genelToplam)} olup kişi başı ${tl(genelToplam / kisi)} tutarındadır${indirimNotu}. Ödeme koşulu: ${odemeKosulu.toLocaleLowerCase('tr')}. Teklif ${kisaTarih(gecerlilikTarihi)} tarihine kadar geçerlidir.${acelesi}`
    const kapanis = onYaziTon === 'samimi' ? 'Sorularınız için her zaman yanınızdayız.' : 'Sorularınız için bizimle iletişime geçmekten memnuniyet duyarız.'
    const veda = onYaziTon === 'samimi' ? 'İyi çalışmalar dileriz,' : onYaziTon === 'teknik' ? 'Bilgilerinize sunarız,' : 'Saygılarımızla,'

    const bolumler =
      onYaziUzunluk === 'kisa'
        ? [hitap, `${giris} ${fiyat}`, kapanis]
        : onYaziUzunluk === 'standart'
          ? [hitap, `${giris} ${kapsam}`, metodoloji, fiyat, kapanis]
          : [hitap, `${giris} ${kapsam}`, metodoloji, detayNotu, testListesi, fiyat, kapanis]
    return [...bolumler.filter(Boolean), veda, kurum.kisaAd || kurum.unvan].join('\n\n')
  }, [firma, tur, kisi, secilenTestler, paketAdi, genelToplam, indirimTL, indirimYuzde, gecerlilikGun, gecerlilikTarihi, kurum.kisaAd, kurum.unvan, onYaziUzunluk, onYaziTon, odemeKosulu])
  const onYazi = onYaziDuzenlendi ? onYaziMetin : onYaziOtomatik
  const onYaziYenile = () => setOnYaziDuzenlendi(false)
  /** Uzunluk veya ton değişince metin yeniden üretilir; elle düzenleme varsa onay istenir. */
  const onYaziAyarla = (alan: 'uzunluk' | 'ton', deger: string) => {
    if (onYaziDuzenlendi && !window.confirm('Metinde yaptığınız düzenlemeler silinecek. Devam edilsin mi?')) return
    if (alan === 'uzunluk') setOnYaziUzunluk(deger as typeof onYaziUzunluk)
    else setOnYaziTon(deger as typeof onYaziTon)
    setOnYaziDuzenlendi(false)
  }

  /** Şartlar ve koşullar maddeleri */
  const [sartlar, setSartlar] = useState<string[]>(() => kaynak?.sartlar ?? HAZIR_SARTLAR.slice(0, 4))
  const [yeniSart, setYeniSart] = useState('')
  const kayitliKosullar = useKosulStore((s) => s.kayitli)
  const kosulKaydet = useKosulStore((s) => s.ekle)
  const kosulSil = useKosulStore((s) => s.sil)
  const kutuphane = useMemo(() => Array.from(new Set<string>([...HAZIR_SARTLAR, ...kayitliKosullar])), [kayitliKosullar])
  const varsayilanaDon = () => setSartlar(HAZIR_SARTLAR.slice(0, 4))
  const sartEkle = (metin: string) => {
    const t = metin.trim()
    if (!t) return
    setSartlar((s) => [...s, t])
    setYeniSart('')
  }
  const sartGuncelle = (i: number, metin: string) => setSartlar((s) => s.map((x, k) => (k === i ? metin : x)))
  const sartSil = (i: number) => setSartlar((s) => s.filter((_, k) => k !== i))
  const sartTasi = (i: number, yon: -1 | 1) =>
    setSartlar((s) => {
      const j = i + yon
      if (j < 0 || j >= s.length) return s
      const yeni = [...s]
      ;[yeni[i], yeni[j]] = [yeni[j], yeni[i]]
      return yeni
    })

  const testEkle = (id: string, miktar = varsayilanMiktar) => {
    setKalem((k) => (id in k ? k : { ...k, [id]: miktar }))
  }
  const testCikar = (id: string) =>
    setKalem((k) => {
      const yeni = { ...k }
      delete yeni[id]
      return yeni
    })
  const miktarAyarla = (id: string, n: number) => setKalem((k) => ({ ...k, [id]: Math.max(1, n) }))
  const paketEkle = (adi: string, ids: string[]) => {
    setPaketAdi(adi)
    setKalem((k) => {
      const yeni = { ...k }
      ids.forEach((id) => {
        if (!(id in yeni)) yeni[id] = varsayilanMiktar
      })
      return yeni
    })
  }
  const topluUygula = () => setKalem((k) => Object.fromEntries(Object.keys(k).map((id) => [id, Math.max(1, topluMiktar)])))
  const calisanUygula = () => setKalem((k) => Object.fromEntries(Object.keys(k).map((id) => [id, varsayilanMiktar])))
  const tumunuTemizle = () => {
    setKalem({})
    setPaketAdi('')
  }

  /** Genel toplam (KDV dahil) hedefini uygular: fark otomatik indirim (+) ya da artış (−) olur. */
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

  /** Adım bazlı doğrulama — yalnızca "İleri" ve "Kaydet" öncesi çalışır; adımlar serbestçe gezilebilir. */
  const dogrula = (adimI: number): string | null => {
    const adim = ADIMLAR[adimI].baslik
    if (adim === 'Teklif bilgileri' && !firma) return 'Devam etmek için bir firma seçin.'
    if (adim === 'Hizmetler ve miktar' && secilenIdler.length === 0) return 'En az bir test ekleyin.'
    if (adim === 'Fiyat' && indirimTip === 'yuzde' && indirimDeger > 100) return 'Yüzde indirim 100 değerini geçemez.'
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

  const kaydet = () => {
    for (let i = 0; i < ADIMLAR.length - 1; i++) {
      const h = dogrula(i)
      if (h) {
        setHata(h)
        setAdimIdx(i)
        return
      }
    }
    if (!firma) return setHata('Firma seçilmedi.')
    /* Düzenleme modunda teklif tarihi ve numarası korunur; kayıt aynı teklifin üzerine yazılır. */
    const kayitTarih = duzenleModu && kaynak ? kaynak.tarih : tarih
    const veri = {
      baslik: firma ? teklifBasligi(firma.kisaAd, tur, kayitTarih) : baslik,
      firma: firma.unvan,
      hizmet: tur,
      kisiSayisi: kisi,
      birimFiyat: Math.round(netBirim),
      tarih: kayitTarih,
      gecerlilik: gecerlilikTarihi,
      durum,
      paketAdi: paketAdi || undefined,
      iskontoYuzde: indirimYuzde ? Math.round(indirimYuzde * 100) / 100 : undefined,
      indirimTutar: Math.round(indirimTL * 100) / 100,
      netToplam: Math.round(netToplam * 100) / 100,
      genelToplam: Math.round(genelToplam),
      kdvOrani: kdv,
      odemeKosulu,
      notlar: notlar.trim() || undefined,
      kalemler: secilenTestler.map((t) => ({ testId: t.id, ad: t.ad, birim: birimOf(t), miktar: kalem[t.id] ?? 1 })),
      onYazi: onYazi.trim() || undefined,
      sartlar: sartlar.map((s) => s.trim()).filter(Boolean),
    }
    if (duzenleModu && kaynak) {
      guncelle(kaynak.id, {
        ...veri,
        gecmis: [{ tarih: new Date().toISOString(), olay: 'Teklif düzenlendi' }, ...(kaynak.gecmis ?? [])],
      })
      toast.success(`${kaynak.no} güncellendi`)
      navigate(`/panel/teklifler/${kaynak.id}`)
      return
    }
    const no = `TKL-${new Date().getFullYear()}-${String(teklifler.length + 1).padStart(3, '0')}`
    const yeniId = ekle({
      ...veri,
      no,
      gecmis: [{ tarih: new Date().toISOString(), olay: 'Teklif oluşturuldu' }],
    })
    taslakTemizle()
    toast.success(`${no} oluşturuldu`)
    navigate(`/panel/teklifler/${yeniId}`)
  }

  /* Taslak: değişiklikler kısa gecikmeyle yerel depoya yazılır; kayıt sonrası silinir. */
  const taslakVeri: TaslakVeri = {
    firmaUnvan,
    tur,
    gecerlilikGun,
    kalem,
    paketAdi,
    indirimTip,
    indirimDeger,
    kdv,
    hedef,
    fiyatOverride,
    durum,
    notlar,
    onYaziMetin,
    onYaziDuzenlendi,
    onYaziUzunluk,
    onYaziTon,
    sartlar,
    odemeKosulu,
    adimIdx,
  }
  const taslakJson = JSON.stringify(taslakVeri)
  useEffect(() => {
    /* Mevcut kayıt düzenlenirken taslak yazılmaz; taslak yalnızca yeni teklif içindir */
    if (kaynak) return
    if (!firmaUnvan && secilenIdler.length === 0 && !notlar.trim()) return
    const zamanlayici = window.setTimeout(() => taslakKaydet(JSON.parse(taslakJson) as Record<string, unknown>), 400)
    return () => window.clearTimeout(zamanlayici)
    // Yalnızca taslak içeriği değişince yeniden planla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taslakJson])

  const taslakUygula = () => {
    const v = (taslak?.veri ?? {}) as Partial<TaslakVeri>
    setFirmaUnvan(v.firmaUnvan ?? '')
    setTur(v.tur ?? TEKLIF_TURLERI[0])
    setGecerlilikGun(v.gecerlilikGun ?? 30)
    setKalem(v.kalem ?? {})
    setPaketAdi(v.paketAdi ?? '')
    setIndirimTip(v.indirimTip ?? 'yuzde')
    setIndirimDeger(v.indirimDeger ?? 0)
    setKdv(v.kdv ?? 20)
    setHedef(v.hedef ?? null)
    setHedefGirdi(v.hedef != null ? String(v.hedef) : '')
    setFiyatOverride(v.fiyatOverride ?? {})
    setDurum(v.durum ?? 'Taslak')
    setNotlar(v.notlar ?? '')
    setOnYaziMetin(v.onYaziMetin ?? '')
    setOnYaziDuzenlendi(v.onYaziDuzenlendi ?? false)
    setOnYaziUzunluk(v.onYaziUzunluk ?? 'standart')
    setOnYaziTon(v.onYaziTon ?? 'kurumsal')
    setSartlar(v.sartlar ?? HAZIR_SARTLAR.slice(0, 4))
    setOdemeKosulu(v.odemeKosulu ?? ODEME_KOSULLARI[2])
    setAdimIdx(0)
    setTaslakGoster(false)
    toast.success('Taslak yüklendi')
  }
  const taslakSil = () => {
    taslakTemizle()
    setTaslakGoster(false)
  }

  /* Kayıt öncesi kontrol listesi: engeller kırmızı, uyarılar sarı gösterilir */
  const kontrol: KontrolMaddesi[] = [
    { ok: !!firma, metin: firma ? `Firma: ${firma.kisaAd}` : 'Firma seçilmedi', adim: 0 },
    { ok: secilenIdler.length > 0, metin: `${secilenIdler.length} test seçili`, adim: 1 },
    { ok: genelToplam > 0, metin: genelToplam > 0 ? `Genel toplam ${tl(genelToplam)}` : 'Toplam tutar sıfır', adim: 2 },
    { ok: onYazi.trim().length > 0, uyari: true, metin: onYazi.trim() ? 'Ön yazı hazır' : 'Ön yazı boş', adim: 3 },
    { ok: sartlar.some((s) => s.trim()), uyari: true, metin: sartlar.some((s) => s.trim()) ? 'Şartlar eklendi' : 'Şartlar eklenmedi', adim: 4 },
    {
      ok: indirimYuzde <= 50,
      uyari: true,
      metin: indirimYuzde <= 50 ? `İndirim %${indirimYuzde.toFixed(1)}` : `İndirim yüksek (%${indirimYuzde.toFixed(1)})`,
      adim: 2,
    },
  ]

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

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[30rem] flex-col gap-3 sm:h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-7.5rem)]">
      {/* Üst şerit */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/panel/teklifler"
            aria-label="Tekliflere dön"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div className="min-w-0">
            <p className="hidden text-[11px] font-medium tracking-wide text-amber-600 uppercase sm:block dark:text-amber-400">
              {duzenleModu && kaynak ? `Düzenleniyor · ${kaynak.no}` : kaynak ? `Kopya · ${kaynak.no}` : 'Yeni teklif'}
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-xl">{baslik || 'Teklif hazırlayın'}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl bg-zinc-950 px-3 py-1.5 text-white shadow-sm sm:px-4 sm:py-2 dark:bg-zinc-100 dark:text-zinc-900">
          <div className="text-right">
            <p className="text-[10px] tracking-wide uppercase opacity-70">Tahmini toplam</p>
            <p className="text-base font-semibold tabular-nums">{tl(adimIdx >= 1 ? genelToplam : 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-[200px_1fr] lg:grid-rows-none">
        {/* Adım paneli — tüm adımlar serbestçe seçilebilir */}
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
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                      aktif ? 'bg-amber-400/15' : 'hover:bg-muted/60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
                        aktif ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'bg-muted text-muted-foreground',
                      )}
                    >
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
                ['Tür', tur],
                ['Test', `${secilenIdler.length}`],
                ['Geçerlilik', `${gecerlilikGun} gün`],
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

          {/* 1. adım: firma ve tür */}
          {adimIdx === 0 && (
            <div className="flex min-h-0 flex-1 flex-col justify-start gap-2 overflow-y-auto bg-muted/20 md:overflow-hidden px-2 py-2 sm:gap-2.5 sm:px-4 sm:py-3">
              {taslakGoster && taslak && (
                <div role="status" className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1.5">
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Yarım kalan bir taslağınız var <span className="text-muted-foreground tabular-nums">({new Date(taslak.savedAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })})</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button size="xs" variant="outline" onClick={taslakUygula}>
                      Taslağı yükle
                    </Button>
                    <Button size="xs" variant="ghost" onClick={taslakSil}>
                      Sil
                    </Button>
                  </div>
                </div>
              )}
              <Bolum no={1} baslik="Firma" aciklama="Arayarak veya listeden seçin">
                <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                  <FirmaSecici firmalar={firmalar} deger={firmaUnvan} onSec={setFirmaUnvan} onHizliEkle={firmaEkle} />
                  <FirmaOzet firma={firma} calisan={calisanSayisi} />
                </div>
              </Bolum>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Bolum no={2} baslik="Teklif türü">
                  <div className="grid grid-cols-2 gap-2">
                    {TEKLIF_TURLERI.map((t) => (
                      <SecimKart key={t} secili={tur === t} onClick={() => setTur(t)} className="flex items-center gap-2 text-xs font-medium">
                        <span className={cn('hidden size-6 shrink-0 items-center justify-center rounded-md sm:flex', tur === t ? 'bg-amber-400 text-zinc-950' : 'bg-muted text-muted-foreground')}>
                          {tur === t ? <CheckIcon className="size-3.5" /> : <UsersIcon className="size-3.5" />}
                        </span>
                        <span className="min-w-0 text-[11px] leading-tight sm:text-xs">{t}</span>
                      </SecimKart>
                    ))}
                  </div>
                </Bolum>
                <Bolum no={3} baslik="Teklif tarihi" sag={tarih === BUGUN ? <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">Bugün</span> : <button type="button" onClick={() => setTarih(BUGUN)} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">Bugüne dön</button>}>
                  <div className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2">
                    <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" />
                    <Input type="date" value={tarih} onChange={(e) => e.target.value && setTarih(e.target.value)} aria-label="Teklif tarihi" className="h-7 w-40 border-0 px-0 text-xs font-semibold tabular-nums shadow-none focus-visible:ring-0" />
                    <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">{formatUzun(tarih)}</span>
                  </div>
                </Bolum>
              </div>
              <Bolum
                no={4}
                baslik="Geçerlilik süresi"
                sag={<span className="hidden text-[11px] text-muted-foreground tabular-nums sm:inline">{gecerlilikGun} gün · {formatUzun(gecerlilikTarihi)}</span>}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    min={tarih}
                    value={gecerlilikTarihi}
                    onChange={(e) => {
                      const g = gunFarki(tarih, e.target.value)
                      if (g >= 1) setGecerlilikGun(g)
                    }}
                    className="h-8 w-40 tabular-nums"
                    aria-label="Geçerlilik bitiş tarihi"
                  />
                  <div className="inline-flex flex-wrap rounded-lg bg-muted p-0.5">
                    {GECERLILIK_SECENEKLERI.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGecerlilikGun(g)}
                        aria-pressed={gecerlilikGun === g}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-[11px] font-medium tabular-nums transition-colors',
                          gecerlilikGun === g ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {g} gün<span className="hidden sm:inline"> · {kisaTarih(gunEkle(g))}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Bolum>
              <Bolum no={5} baslik="Teklif başlığı" aciklama="Otomatik oluşur">
                <div className="flex items-center gap-2.5 rounded-lg border-l-4 border-amber-400 bg-background px-3 py-1.5 sm:py-2">
                  <FileTextIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className={cn('truncate text-sm font-semibold', !baslik && 'font-normal text-muted-foreground')}>
                    {baslik || 'Firma seçildiğinde başlık oluşur'}
                  </span>
                </div>
              </Bolum>
            </div>
          )}

          {/* 2. adım: split ekran — sol hizmetler, sağ seçilen testler */}
          {adimIdx === 1 && (
            <div className="grid min-h-0 flex-1 bg-muted/20 p-2 sm:p-3 md:grid-cols-[1fr_1.1fr] md:gap-3">
              {/* Sol: hizmetler */}
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
                        onClick={() => setSekme(s.k)}
                        aria-pressed={sekme === s.k}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-colors',
                          sekme === s.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {s.ad}
                        <span className="rounded bg-muted px-1 text-[10px] tabular-nums">{s.sayi}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input value={aramaT} onChange={(e) => setAramaT(e.target.value)} placeholder={sekme === 'paket' ? 'Paket ara' : 'Test ara'} aria-label="Ara" className="h-8 pl-8" />
                    </div>
                    {sekme === 'test' && (
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
                  {sekme === 'paket' &&
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
                            <Button size="xs" variant={tamam ? 'ghost' : 'outline'} disabled={tamam} onClick={() => paketEkle(p.ad, p.testIdleri)}>
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
                  {sekme === 'test' &&
                    bosTestler.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => testEkle(t.id)}
                          className="group flex w-full items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-left transition-colors hover:border-amber-400/60 hover:bg-amber-400/5"
                        >
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
                  {((sekme === 'paket' && bosPaketler.length === 0) || (sekme === 'test' && bosTestler.length === 0)) && (
                    <li className="py-6 text-center text-xs text-muted-foreground">Eşleşen kayıt yok.</li>
                  )}
                </ul>
              </div>

              {/* Sağ: seçilen testler ve miktarlar */}
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="shrink-0 space-y-2 border-b p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold">
                      Seçilen testler <span className="ml-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] tabular-nums">{secilenTestler.length}</span>
                    </h3>
                    {secilenTestler.length > 0 && (
                      <button type="button" onClick={tumunuTemizle} className="text-[11px] text-muted-foreground hover:text-red-600">
                        Tümünü kaldır
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/50 p-1.5">
                    <span className="pl-1 text-[11px] font-medium text-muted-foreground">Toplu miktar</span>
                    <Input
                      type="number"
                      min={1}
                      value={topluMiktar}
                      onChange={(e) => setTopluMiktar(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                      aria-label="Toplu miktar"
                      className="h-7 w-16 text-center text-xs tabular-nums"
                    />
                    <Button size="xs" variant="outline" onClick={topluUygula} disabled={secilenTestler.length === 0}>
                      Tümüne uygula
                    </Button>
                    <Button size="xs" variant="outline" onClick={calisanUygula} disabled={secilenTestler.length === 0 || calisanSayisi === 0}>
                      <UsersIcon /> Çalışan sayısı ({calisanSayisi})
                    </Button>
                  </div>
                </div>

                <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2.5">
                  {secilenTestler.map((t) => {
                    const m = kalem[t.id] ?? 1
                    return (
                      <li key={t.id} className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{t.ad}</p>
                          <p className="truncate text-[10px] text-muted-foreground tabular-nums">
                            {t.kategori} · {tl(t.fiyat)} × {m}
                          </p>
                        </div>
                        <MiktarKontrol deger={m} onChange={(n) => miktarAyarla(t.id, n)} boyut="kucuk" />
                        <span className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums">{tl(t.fiyat * m)}</span>
                        <button
                          type="button"
                          aria-label={`${t.ad} kaldır`}
                          onClick={() => testCikar(t.id)}
                          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </li>
                    )
                  })}
                  {secilenTestler.length === 0 && (
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

          {/* 3. adım: fiyat */}
          {adimIdx === 2 && (
            <div className="grid min-h-0 flex-1 gap-2.5 bg-muted/20 p-2 sm:p-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.4fr)] md:gap-3">
              {/* Sol: kalemler — birim fiyat ve miktar satır içinde düzenlenir */}
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                  <h3 className="text-xs font-semibold">
                    Kalemler <span className="ml-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] tabular-nums">{secilenTestler.length}</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground tabular-nums">{kisi} çalışan</span>
                    <select
                      value={odemeKosulu}
                      onChange={(e) => setOdemeKosulu(e.target.value)}
                      aria-label="Ödeme koşulu"
                      title="Ödeme koşulu"
                      className="h-7 max-w-52 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
                    >
                      {ODEME_KOSULLARI.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_6rem] items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <span>Test</span>
                  <span className="text-right">Birim</span>
                  <span className="text-center">Miktar</span>
                  <span className="text-right">Tutar</span>
                </div>
                <ul className="flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
                  {secilenTestler.map((t) => {
                    const m = kalem[t.id] ?? 1
                    const b = birimOf(t)
                    return (
                      <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_6rem] items-center gap-2 px-3 py-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-xs font-medium">{t.ad}</span>
                          <span className="shrink-0 rounded bg-muted px-1 py-px text-[10px] text-muted-foreground">{t.kategori}</span>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            value={b}
                            onChange={(e) => setFiyatOverride((o) => ({ ...o, [t.id]: Math.max(0, Number(e.target.value) || 0) }))}
                            aria-label={`${t.ad} birim fiyat`}
                            className={cn('h-7 pr-5 text-right text-xs tabular-nums', b !== t.fiyat && 'border-amber-400/70 bg-amber-400/5')}
                          />
                          <span className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[10px] text-muted-foreground">₺</span>
                        </div>
                        <div className="flex justify-center">
                          <MiktarKontrol deger={m} onChange={(n) => miktarAyarla(t.id, n)} boyut="kucuk" />
                        </div>
                        <span className="text-right text-xs font-semibold tabular-nums">{tl(b * m)}</span>
                      </li>
                    )
                  })}
                  {secilenTestler.length === 0 && <li className="py-8 text-center text-xs text-muted-foreground">Seçilmiş test yok.</li>}
                </ul>
                <div className="flex shrink-0 items-center justify-between border-t bg-muted/30 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">
                    Kalem toplamı <span className="text-muted-foreground/70">(indirim ve KDV öncesi)</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{tl(kalemToplam)}</span>
                </div>
              </div>

              {/* Sağ: ayarlar ve tutar özeti */}
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
                      <Input
                        type="number"
                        min={0}
                        value={hedefGirdi}
                        onChange={(e) => setHedefGirdi(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && hedefUygula()}
                        placeholder={Math.round(genelToplam).toString()}
                        aria-label="Hedef genel toplam"
                        className="h-8 pr-7 tabular-nums"
                      />
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
                          className={cn(
                            'min-w-8 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
                            indirimTip === t.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                          )}
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
                      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                        {indirimTip === 'yuzde' ? '%' : '₺'}
                      </span>
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
                          className={cn(
                            'rounded-md border bg-background py-1 text-xs font-semibold tabular-nums transition-colors hover:bg-muted/50',
                            kdv === o && 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/50',
                          )}
                        >
                          %{o}
                        </button>
                      ))}
                    </div>
                    <div className="relative w-20 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={kdv}
                        onChange={(e) => setKdv(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                        aria-label="KDV oranı (elle)"
                        className="h-8 pr-6 text-right tabular-nums"
                      />
                      <PercentIcon className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </Bolum>

                {/* Tutar özeti */}
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
                      <dd className="flex items-center gap-1.5 font-medium tabular-nums">
                        <span className={cn(indirimTL >= 0 ? 'text-red-400 dark:text-red-600' : 'text-emerald-400 dark:text-emerald-600')}>
                          {indirimTL >= 0 ? '−' : '+'} {tl(Math.abs(indirimTL))}
                        </span>
                        <span className="rounded bg-white/10 px-1 py-px text-[10px] dark:bg-black/10">%{Math.abs(indirimYuzde).toFixed(1)}</span>
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
                  <p className="relative mt-2 text-center text-[11px] opacity-60 tabular-nums">Kişi başı {tl(genelToplam / kisi)} · {kisi} çalışan</p>
                </section>
              </div>
            </div>
          )}

          {adimIdx === 3 && (
            <div className="grid min-h-0 flex-1 gap-2.5 bg-muted/20 p-2 sm:p-3 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-3">
              {/* Sol: metin düzenleme */}
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                  <h3 className="text-xs font-semibold">
                    Ön yazı metni <span className="ml-1 text-[11px] font-normal text-muted-foreground">· düzenleyebilirsiniz</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {onYaziDuzenlendi && (
                      <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">Düzenlendi</span>
                    )}
                    <Button size="xs" variant="outline" onClick={onYaziYenile} disabled={!onYaziDuzenlendi}>
                      <RefreshCwIcon /> Otomatik
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
                          className={cn(
                            'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                            onYaziUzunluk === u.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                          )}
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
                          className={cn(
                            'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                            onYaziTon === t.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                          )}
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
                  aria-label="Ön yazı metni"
                  placeholder="Firma seçildiğinde ön yazı otomatik oluşur."
                  className="min-h-0 flex-1 resize-none bg-transparent p-3 text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
                />
                <footer className="flex shrink-0 items-center justify-between border-t px-3 py-1.5 text-[11px] text-muted-foreground tabular-nums">
                  <span>{onYazi.split(/\n\s*\n/).filter(Boolean).length} paragraf</span>
                  <span>{onYazi.length} karakter</span>
                </footer>
              </section>

              {/* Sağ: belge önizleme */}
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-muted/40 p-2.5 sm:p-3">
                <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden rounded-md bg-white px-6 py-5 text-zinc-800 shadow-md ring-1 ring-black/5">
                  <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 pb-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold tracking-wide text-zinc-900 uppercase">{kurum.kisaAd || kurum.unvan}</p>
                      <p className="truncate text-[10px] text-zinc-500">{kurum.unvan}</p>
                    </div>
                    <p className="shrink-0 text-[10px] text-zinc-500 tabular-nums">{formatUzun(tarih)}</p>
                  </div>
                  <p className="mt-2.5 shrink-0 truncate text-[11px] font-semibold text-zinc-900">Konu: {baslik || 'Teklif'}</p>
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

          {adimIdx === 4 && (
            <div className="grid min-h-0 flex-1 gap-2.5 bg-muted/20 p-2 sm:p-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-3">
              {/* Sol: madde listesi */}
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
                  <h3 className="text-xs font-semibold">
                    Şartlar ve koşullar <span className="ml-1 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[11px] tabular-nums">{sartlar.length}</span>
                  </h3>
                  <div className="flex items-center gap-1.5"><Button size="xs" variant="ghost" onClick={() => setSartlar([])} disabled={sartlar.length === 0}>Tümünü temizle</Button><Button size="xs" variant="outline" onClick={varsayilanaDon}><RotateCcwIcon /> Varsayılan</Button></div>
                </header>

                <div className="shrink-0 space-y-2 border-b p-2.5">
                  <div className="flex gap-1.5">
                    <Input
                      value={yeniSart}
                      onChange={(e) => setYeniSart(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sartEkle(yeniSart)}
                      placeholder="Yeni koşul yazın ve Enter'a basın"
                      aria-label="Yeni koşul"
                      className="h-8 text-xs"
                    />
                    <Button size="sm" onClick={() => sartEkle(yeniSart)} disabled={!yeniSart.trim()}>
                      <PlusIcon /> Ekle
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="mr-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Kütüphane</span>
                    {kutuphane
                      .filter((h) => !sartlar.includes(h))
                      .map((h) => (
                        <span
                          key={h}
                          className="inline-flex max-w-full items-center rounded-full border bg-background text-[11px] text-muted-foreground transition-colors hover:border-amber-400/60 hover:bg-amber-400/5 hover:text-foreground"
                        >
                          <button type="button" onClick={() => sartEkle(h)} title={h} className="max-w-56 truncate py-0.5 pr-1 pl-2">
                            + {h}
                          </button>
                          {kayitliKosullar.includes(h) && (
                            <button
                              type="button"
                              aria-label={`${h} kütüphaneden sil`}
                              onClick={() => kosulSil(h)}
                              className="mr-1 flex size-4 shrink-0 items-center justify-center rounded-full hover:bg-red-500/10 hover:text-red-600"
                            >
                              <XIcon className="size-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    {kutuphane.every((h) => sartlar.includes(h)) && <span className="text-[11px] text-muted-foreground">Tüm koşullar eklendi.</span>}
                  </div>
                </div>

                <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2.5">
                  {sartlar.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg border bg-background p-2">
                      <span className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {i + 1}
                      </span>
                      <textarea
                        value={s}
                        onChange={(e) => sartGuncelle(i, e.target.value)}
                        rows={2}
                        aria-label={`${i + 1}. koşul`}
                        className="min-w-0 flex-1 resize-none rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs leading-relaxed outline-none focus:border-input focus:bg-background"
                      />
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button
                          type="button"
                          aria-label="Kütüphaneye kaydet"
                          title="Kütüphaneye kaydet"
                          disabled={!s.trim() || kayitliKosullar.includes(s.trim())}
                          onClick={() => kosulKaydet(s)}
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-amber-400/15 hover:text-amber-700 disabled:opacity-30"
                        >
                          <BookmarkIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Yukarı taşı"
                          disabled={i === 0}
                          onClick={() => sartTasi(i, -1)}
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                        >
                          <ArrowUpIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Aşağı taşı"
                          disabled={i === sartlar.length - 1}
                          onClick={() => sartTasi(i, 1)}
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                        >
                          <ArrowDownIcon className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Koşulu sil"
                          onClick={() => sartSil(i)}
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                  {sartlar.length === 0 && (
                    <li className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-6 text-center">
                      <p className="text-xs font-medium">Henüz koşul yok</p>
                      <p className="text-[11px] text-muted-foreground">Yukarıdan yazın veya hazır koşullardan ekleyin.</p>
                    </li>
                  )}
                </ol>
              </section>

              {/* Sağ: belge önizleme */}
              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-muted/40 p-2.5 sm:p-3">
                <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden rounded-md bg-white px-6 py-5 text-zinc-800 shadow-md ring-1 ring-black/5">
                  <p className="shrink-0 text-[11px] font-bold tracking-wide text-zinc-900 uppercase">Şartlar ve koşullar</p>
                  <p className="shrink-0 truncate text-[10px] text-zinc-500">{baslik || 'Teklif'}</p>
                  <ol className="mt-3 min-h-0 flex-1 space-y-2 overflow-hidden text-[11px] leading-relaxed">
                    {sartlar
                      .filter((s) => s.trim())
                      .map((s, i) => (
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

          {/* 4. adım: özet ve kayıt */}
          {adimIdx === 5 && (
            <div className="flex min-h-0 flex-1 flex-col justify-start gap-2.5 overflow-y-auto bg-muted/20 md:overflow-hidden px-2 py-2.5 sm:px-4 sm:py-3">
              <div className="grid min-h-0 flex-1 gap-2.5 md:grid-cols-[1.1fr_1fr]">
                <div className="flex min-h-0 flex-col rounded-xl border bg-card p-3.5 shadow-sm">
                  <p className="text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">Teklif belgesi</p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug">{baslik}</p>
                  <dl className="mt-2.5 grid content-start gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                    {[
                      ['Firma', firma?.unvan ?? '—'],
                      ['Tür', tur],
                      ['Çalışan', `${kisi} kişi`],
                      ['Kalem', `${secilenTestler.length} test${paketAdi ? ` · ${paketAdi}` : ''}`],
                      ['Geçerlilik', `${formatUzun(gecerlilikTarihi)} (${gecerlilikGun} gün)`],
                      ['Ödeme koşulu', odemeKosulu],
                      ['İndirim', indirimTip === 'yuzde' ? `%${indirimDeger}` : tl(indirimTL)],
                      ['KDV', `%${kdv}`],
                    ].map(([k, v]) => (
                      <div key={k} className="min-w-0 border-b border-border/60 pb-1">
                        <dt className="text-[10px] text-muted-foreground">{k}</dt>
                        <dd className="truncate font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-auto flex items-end justify-between gap-2 rounded-lg bg-zinc-950 px-3.5 py-2.5 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <div>
                      <p className="text-[10px] opacity-70">Kişi başı {tl(netBirim)}</p>
                      <p className="text-[11px] opacity-70">KDV dahil toplam</p>
                    </div>
                    <p className="text-xl font-semibold tabular-nums">{tl(genelToplam)}</p>
                  </div>
                </div>
                <div className="flex min-h-0 flex-col gap-2.5">
                  <Bolum no={3} baslik="Şartlar ve koşullar" aciklama={`${sartlar.filter((s) => s.trim()).length} madde`}>
                    <ol className="space-y-0.5 text-[11px] leading-snug">
                      {sartlar
                        .filter((s) => s.trim())
                        .map((s, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="font-semibold tabular-nums">{i + 1}.</span>
                            <span className="min-w-0 truncate">{s}</span>
                          </li>
                        ))}
                    </ol>
                  </Bolum>
                  <OzetKontrol maddeler={kontrol} onGit={adimaGit} />
                  <Bolum baslik="Ön yazı" aciklama={`${onYazi.split(/\n\s*\n/).filter(Boolean).length} paragraf`}>
                    <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{onYazi.trim() || 'Ön yazı boş'}</p>
                  </Bolum>
                  <Bolum no={1} baslik="Teklif durumu">
                    <div className="grid grid-cols-2 gap-2">
                      {(['Taslak', 'Gönderildi'] as const).map((d) => (
                        <SecimKart key={d} secili={durum === d} onClick={() => setDurum(d)} className="text-center text-xs font-semibold">
                          {d}
                        </SecimKart>
                      ))}
                    </div>
                  </Bolum>
                  <Bolum no={2} baslik="Notlar" aciklama="İsteğe bağlı" className="flex-1">
                    <textarea
                      value={notlar}
                      onChange={(e) => setNotlar(e.target.value)}
                      rows={2}
                      placeholder="Teklife eklenecek not…"
                      className="w-full flex-1 resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
                    />
                  </Bolum>
                  <div className="flex flex-wrap gap-1">
                    {secilenTestler.map((t) => (
                      <Pill key={t.id} tone="zinc">
                        {t.ad} × {kalem[t.id]}
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
                <SaveIcon /> Teklifi kaydet
              </Button>
            )}
          </footer>
        </section>
      </div>
    </div>
  )
}
