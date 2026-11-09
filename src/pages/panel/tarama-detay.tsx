import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import type { jsPDF } from 'jspdf'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  XIcon,
  DownloadIcon,
  ExternalLinkIcon,
  HeartPulseIcon,
  Loader2Icon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PrinterIcon,
  Trash2Icon,
} from 'lucide-react'
import { osgbAd, osgbLogoHarf, osgbUnvan, useOsgb } from '@/lib/osgb'
import { taramaDosyaAdi, taramaIsListesiPdfOlustur, taramaPdfOlustur } from '@/lib/tarama-pdf'
import type { KurumBilgi } from '@/lib/teklif-pdf'
import { useEkipStore } from '@/stores/ekip-store'
import { Button } from '@/components/ui/button'
import { Pill, type PillTone } from '@/components/pill'
import { Input } from '@/components/ui/input'
import { FirmaBaglantisi } from '@/components/firma-link'
import { cn } from '@/lib/utils'
import { formatKisa, gunFarki } from '@/lib/date'
import { BUGUN, HIZMET_TURLERI, ISLISTESI_HAZIRLIK, TARAMA_DURUMLARI, gunEkle, teklifToplamlariHesapla, type Tarama, type TaramaDurum, type TaramaIsListesi, type Test } from '@/data/saglik'
import type { EkipUye } from '@/data/ekip'
import { SONRAKI_DURUM, durumPatch, ilerlemeOrani, saatAraligi, tarihAraligi } from '@/lib/tarama'
import { useFirmaStore, useTaramaStore, useTeklifStore, useTestStore } from '@/stores/saglik-stores'

const TON: Record<TaramaDurum, PillTone> = {
  Planlandı: 'violet',
  'Devam ediyor': 'amber',
  Tamamlandı: 'green',
  İptal: 'zinc',
}

type Sekme = 'ozet' | 'testler' | 'isListesi' | 'metin' | 'hareket' | 'ilerleme'

function Alan({ etiket, children }: { etiket: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-b border-border/60 pb-1.5">
      <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{etiket}</dt>
      <dd className="mt-0.5 truncate text-xs font-medium">{children}</dd>
    </div>
  )
}

const zamanEtiketi = (iso: string) => new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })

type OzetTaslak = { tarih: string; saat: string; bitisTarih: string; bitisSaat: string; lokasyon: string; hizmet: string; kisiSayisi: number; ekipIds: string[] }
const BOS_OZET: OzetTaslak = { tarih: '', saat: '09:00', bitisTarih: '', bitisSaat: '17:00', lokasyon: '', hizmet: '', kisiSayisi: 1, ekipIds: [] }
type Belge = { doc: jsPDF | null; url: string | null; hata: string | null; ad: string }
const BOS_BELGE: Belge = { doc: null, url: null, hata: null, ad: '' }
const isListesiDosyaAdi = (t: Tarama) => `${t.id.replace(/[^\w-]+/g, '_')}_is_listesi.pdf`

/** Kurum kaydından PDF'lerin kullandığı kurum bilgisi */
function osgbBilgi(k: ReturnType<typeof useOsgb>): KurumBilgi {
  return {
    ad: osgbAd(),
    unvan: osgbUnvan(),
    harf: osgbLogoHarf(),
    logo: k.logo,
    adres: k.adres,
    telefon: k.telefon,
    eposta: k.eposta,
    web: k.web,
    yetkili: k.yetkili,
    yetkiliUnvan: k.yetkiliUnvan,
  }
}

/** Ekip üyeleri: ekip modülünden (kimlikle) ya da kayıtlı ad listesinden */
function ekipKatilimcilari(t: Tarama, uyeler: EkipUye[]): { anahtar: string; ad: string; gorev: string }[] {
  if (t.ekipUyeIdleri?.length)
    return t.ekipUyeIdleri.map((id) => {
      const u = uyeler.find((x) => x.id === id)
      return { anahtar: id, ad: u ? `${u.unvanOnek ? `${u.unvanOnek} ` : ''}${u.ad} ${u.soyad}` : id, gorev: u?.gorev ?? '' }
    })
  return (t.ekip ? t.ekip.split(', ').filter(Boolean) : []).map((ad) => ({ anahtar: ad, ad, gorev: '' }))
}

export default function TaramaDetayPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const tarama = useTaramaStore((s) => s.kayitlar.find((t) => t.id === id))
  const guncelle = useTaramaStore((s) => s.guncelle)
  const sil = useTaramaStore((s) => s.sil)
  const firma = useFirmaStore((s) => s.kayitlar.find((f) => f.unvan === tarama?.firma))
  const teklif = useTeklifStore((s) => s.kayitlar.find((t) => t.id === tarama?.teklifId))
  const [sekme, setSekme] = useState<Sekme>('ozet')
  const kurum = useOsgb()
  const ekipModulUyeleri = useEkipStore((s) => s.uyeler)
  const testler = useTestStore((s) => s.kayitlar)
  const [planBelge, setPlanBelge] = useState<Belge>(BOS_BELGE)
  const [isBelge, setIsBelge] = useState<Belge>(BOS_BELGE)
  const [bugunGirdi, setBugunGirdi] = useState('')
  const [ozetDuzen, setOzetDuzen] = useState(false)
  const [ozetTaslak, setOzetTaslak] = useState<OzetTaslak>(BOS_OZET)
  const [metinDuzen, setMetinDuzen] = useState(false)
  const [taslakOnYazi, setTaslakOnYazi] = useState('')
  const [taslakNotlar, setTaslakNotlar] = useState('')
  const [testAra, setTestAra] = useState('')

  /* Tarama planı ve iş listesi belgeleri değişimde yeniden üretilir; önizleme için blob adresi kullanılır */
  useEffect(() => {
    if (!tarama) return
    let iptal = false
    let adres: string | null = null
    setPlanBelge({ ...BOS_BELGE, ad: taramaDosyaAdi(tarama) })
    taramaPdfOlustur(tarama, firma, osgbBilgi(kurum), teklif?.no)
      .then((doc) => {
        if (iptal) return
        adres = URL.createObjectURL(doc.output('blob'))
        setPlanBelge({ doc, url: adres, hata: null, ad: taramaDosyaAdi(tarama) })
      })
      .catch(() => {
        if (!iptal) setPlanBelge({ ...BOS_BELGE, hata: 'PDF oluşturulamadı. Sayfayı yenileyip tekrar deneyin.' })
      })
    return () => {
      iptal = true
      if (adres) URL.revokeObjectURL(adres)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarama, firma, teklif?.no, kurum.logo, kurum.adres, kurum.telefon, kurum.eposta, kurum.web, kurum.yetkili, kurum.yetkiliUnvan])

  useEffect(() => {
    if (!tarama) return
    let iptal = false
    let adres: string | null = null
    const katilimcilar = ekipKatilimcilari(tarama, ekipModulUyeleri).map((u) => ({ ad: u.ad, gorev: u.gorev, katildi: !!tarama.isListesi?.katilim[u.anahtar] }))
    setIsBelge({ ...BOS_BELGE, ad: isListesiDosyaAdi(tarama) })
    taramaIsListesiPdfOlustur(tarama, firma, osgbBilgi(kurum), katilimcilar)
      .then((doc) => {
        if (iptal) return
        adres = URL.createObjectURL(doc.output('blob'))
        setIsBelge({ doc, url: adres, hata: null, ad: isListesiDosyaAdi(tarama) })
      })
      .catch(() => {
        if (!iptal) setIsBelge({ ...BOS_BELGE, hata: 'İş listesi oluşturulamadı. Sayfayı yenileyip tekrar deneyin.' })
      })
    return () => {
      iptal = true
      if (adres) URL.revokeObjectURL(adres)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarama, firma, ekipModulUyeleri, kurum.logo, kurum.adres, kurum.telefon, kurum.eposta, kurum.web, kurum.yetkili, kurum.yetkiliUnvan])

  /* Sekmeye göre sağdaki önizlemede görünen belge */
  const aktifBelge = sekme === 'isListesi' ? isBelge : planBelge
  const pdfIndir = () => {
    if (aktifBelge.doc) aktifBelge.doc.save(aktifBelge.ad)
  }
  const pdfOnizle = () => {
    if (aktifBelge.url) window.open(aktifBelge.url, '_blank', 'noopener')
  }
  const pdfYazdir = () => {
    const pencere = document.getElementById('tarama-pdf-onizleme') as HTMLIFrameElement | null
    try {
      if (!pencere?.contentWindow) throw new Error('önizleme yok')
      pencere.contentWindow.print()
    } catch {
      if (aktifBelge.url) window.open(aktifBelge.url, '_blank', 'noopener')
      else toast.error('Belge henüz hazır değil.')
    }
  }


  if (!tarama) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <HeartPulseIcon className="size-8 text-muted-foreground/60" />
        <p className="text-sm font-medium">Tarama bulunamadı</p>
        <p className="text-xs text-muted-foreground">Kayıt silinmiş olabilir.</p>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/panel/taramalar" />}>
          <ArrowLeftIcon /> Taramalara dön
        </Button>
      </div>
    )
  }

  const oran = ilerlemeOrani(tarama)
  const kalanGun = gunFarki(BUGUN, tarama.tarih)
  const kalanEtiket =
    tarama.durum === 'Tamamlandı'
      ? 'Tamamlandı'
      : tarama.durum === 'İptal'
        ? 'İptal edildi'
        : kalanGun < 0
          ? `${Math.abs(kalanGun)} gün önce`
          : kalanGun === 0
            ? 'Bugün'
            : kalanGun === 1
              ? 'Yarın'
              : `${kalanGun} gün sonra`
  const kalanTon =
    tarama.durum === 'Tamamlandı' || tarama.durum === 'İptal'
      ? 'text-muted-foreground'
      : kalanGun === 0
        ? 'font-medium text-amber-700 dark:text-amber-400'
        : kalanGun < 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-muted-foreground'
  const sonraki = SONRAKI_DURUM[tarama.durum]
  const kalanKisi = Math.max(0, tarama.kisiSayisi - tarama.tamamlanan)
  /* Hız: başlangıçtan bugüne kadarki günlük ortalama; tahmini bitiş kalan kişinin bu hızla tamamlanma tarihi */
  const tahmin = (() => {
    if (tarama.tamamlanan === 0 || tarama.tarih > BUGUN || kalanKisi === 0 || tarama.durum === 'İptal') return null
    const gecen = Math.max(1, gunFarki(tarama.tarih, BUGUN) + 1)
    const hiz = tarama.tamamlanan / gecen
    return { hiz: Math.round(hiz * 10) / 10, tarih: gunEkle(Math.ceil(kalanKisi / hiz)) }
  })()
  const bugunSayi = Math.max(0, Math.floor(Number(bugunGirdi) || 0))
  const ilerlemeEkle = () => {
    ilerlemeAyarla(tarama.tamamlanan + bugunSayi)
    setBugunGirdi('')
  }
  const hareketler = tarama.gecmis?.length
    ? tarama.gecmis
    : [{ tarih: `${tarama.tarih}T${/^\d{2}:\d{2}$/.test(tarama.saat) ? tarama.saat : '00:00'}:00`, olay: 'Tarama planlandı' }]

  /* Fiyat özeti: kayıtlı tutarlar varsa onlar, yoksa kalemlerden hesaplanır */
  const kalemler = tarama.kalemler ?? []
  const kalemToplam = kalemler.reduce((s, k) => s + k.birim * k.miktar, 0)
  const indirim = tarama.indirimTutar ?? 0
  const net = tarama.netToplam ?? kalemToplam - indirim
  const kdvOran = tarama.kdvOrani ?? 20
  const genelToplam = tarama.genelToplam ?? Math.round(net * (1 + kdvOran / 100))
  const ekipUyeleri = tarama.ekip ? tarama.ekip.split(', ').filter(Boolean) : []
  const paraBicim = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`
  /* Fiyat özeti kartı: Testler ve Özet sekmelerinde ortak kullanılır */
  const kdvTutarOzet = genelToplam - net
  const oranYuzde = (x: number) => (genelToplam > 0 ? Math.round((x / genelToplam) * 100) : 0)
  const tutarOzetiKarti = kalemler.length > 0 ? (
    <div className="space-y-3 p-3">
      <div className="flex items-end justify-between gap-3 rounded-lg bg-zinc-950 px-3.5 py-3 text-white dark:bg-zinc-100 dark:text-zinc-900">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-60">Genel toplam · KDV dahil</p>
          <p className="text-2xl font-bold tabular-nums">{paraBicim(genelToplam)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] tracking-wide uppercase opacity-60">Kişi başı</p>
          <p className="text-sm font-semibold tabular-nums">{paraBicim(genelToplam / Math.max(1, tarama.kisiSayisi))}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Net %${oranYuzde(net)}, KDV %${oranYuzde(kdvTutarOzet)}`}>
          <div className="bg-emerald-500 transition-[width] duration-500" style={{ width: `${oranYuzde(net)}%` }} />
          <div className="bg-amber-400 transition-[width] duration-500" style={{ width: `${oranYuzde(kdvTutarOzet)}%` }} />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden /> Net %{oranYuzde(net)}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-400" aria-hidden /> KDV %{oranYuzde(kdvTutarOzet)}
          </span>
        </div>
      </div>

      <dl className="divide-y rounded-lg border text-xs tabular-nums">
        <div className="flex items-center justify-between px-3 py-2">
          <dt className="text-muted-foreground">Kalem toplamı</dt>
          <dd className="font-medium">{paraBicim(kalemToplam)}</dd>
        </div>
        {indirim > 0 && (
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-muted-foreground">
              İndirim
              {tarama.iskontoYuzde ? <span className="ml-1.5 rounded bg-red-500/10 px-1 py-px text-[10px] text-red-600 dark:text-red-400">%{tarama.iskontoYuzde}</span> : null}
            </dt>
            <dd className="font-medium text-red-600 dark:text-red-400">− {paraBicim(indirim)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between bg-muted/40 px-3 py-2">
          <dt className="text-muted-foreground">Net (KDV hariç)</dt>
          <dd className="font-semibold">{paraBicim(net)}</dd>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <dt className="text-muted-foreground">KDV %{kdvOran}</dt>
          <dd className="font-medium">{paraBicim(kdvTutarOzet)}</dd>
        </div>
      </dl>
    </div>
  ) : null

  /* İş listesi: hazırlık, ekip katılımı ve test başına yapılan sayı; her değişiklik kayda yazılır */
  const isListesi: TaramaIsListesi = tarama.isListesi ?? { hazirlik: {}, katilim: {}, yapilan: {} }
  const isGuncelle = (yeni: TaramaIsListesi) => guncelle(tarama.id, { isListesi: yeni })
  const hazirlikDegistir = (k: string) => isGuncelle({ ...isListesi, hazirlik: { ...isListesi.hazirlik, [k]: !isListesi.hazirlik[k] } })
  const katilimDegistir = (anahtar: string) => isGuncelle({ ...isListesi, katilim: { ...isListesi.katilim, [anahtar]: !isListesi.katilim[anahtar] } })
  const yapilanAyarla = (testId: string, n: number, hedef: number) =>
    isGuncelle({ ...isListesi, yapilan: { ...isListesi.yapilan, [testId]: Math.min(hedef, Math.max(0, Math.floor(n) || 0)) } })
  /* Elle girilen yapılan sayısı silinince alan yeniden boş görünür */
  const yapilanTemizle = (testId: string) => {
    const yeniYapilan = { ...isListesi.yapilan }
    delete yeniYapilan[testId]
    isGuncelle({ ...isListesi, yapilan: yeniYapilan })
  }
  /** Ekip üyeleri: ekip modülünden (kimlikle) ya da kayıtlı ad listesinden */
  const isEkipUyeleri = ekipKatilimcilari(tarama, ekipModulUyeleri)
  const hazirTamam = ISLISTESI_HAZIRLIK.filter((h) => isListesi.hazirlik[h.k]).length
  const katilanSayi = isEkipUyeleri.filter((u) => isListesi.katilim[u.anahtar]).length
  const hedefToplam = kalemler.reduce((s, k) => s + k.miktar, 0)
  const yapilanToplam = kalemler.reduce((s, k) => s + Math.min(k.miktar, isListesi.yapilan[k.testId] ?? 0), 0)

  /* ---- Düzenleme: tarama bilgileri, test planı ve metin ---- */
  const hareketEkle = (olay: string) => [{ tarih: new Date().toISOString(), olay }, ...(tarama.gecmis ?? [])]

  const ozetBaslat = () => {
    setOzetTaslak({
      tarih: tarama.tarih,
      saat: tarama.saat,
      bitisTarih: tarama.bitisTarih ?? tarama.tarih,
      bitisSaat: tarama.bitisSaat ?? tarama.saat,
      lokasyon: tarama.lokasyon,
      hizmet: tarama.hizmet,
      kisiSayisi: tarama.kisiSayisi,
      ekipIds: tarama.ekipUyeIdleri ?? [],
    })
    setOzetDuzen(true)
  }
  const ozetEkipTikla = (id: string) =>
    setOzetTaslak((o) => ({ ...o, ekipIds: o.ekipIds.includes(id) ? o.ekipIds.filter((x) => x !== id) : [...o.ekipIds, id] }))
  const ozetKaydet = () => {
    if (!ozetTaslak.tarih) return toast.error('Bir başlangıç tarihi seçin')
    const bitis = ozetTaslak.bitisTarih || ozetTaslak.tarih
    if (`${bitis} ${ozetTaslak.bitisSaat}` < `${ozetTaslak.tarih} ${ozetTaslak.saat}`) return toast.error('Bitiş, başlangıçtan önce olamaz')
    const secili = ekipModulUyeleri.filter((u) => ozetTaslak.ekipIds.includes(u.id))
    guncelle(tarama.id, {
      tarih: ozetTaslak.tarih,
      saat: ozetTaslak.saat,
      bitisTarih: bitis,
      bitisSaat: ozetTaslak.bitisSaat,
      lokasyon: ozetTaslak.lokasyon.trim(),
      hizmet: ozetTaslak.hizmet,
      kisiSayisi: Math.max(1, Math.floor(ozetTaslak.kisiSayisi) || 1),
      ekipUyeIdleri: ozetTaslak.ekipIds,
      ekip: secili.map((u) => `${u.unvanOnek ? `${u.unvanOnek} ` : ''}${u.ad} ${u.soyad}`).join(', '),
      gecmis: hareketEkle('Tarama bilgileri düzenlendi'),
    })
    setOzetDuzen(false)
    toast.success('Tarama bilgileri kaydedildi')
  }

  /** Test planını kaydeder; iskonto, KDV ve tüm tutarlar birlikte yeniden hesaplanır */
  const kalemlerKaydet = (yeni: { testId: string; ad: string; birim: number; miktar: number }[], olay?: string, iskonto = tarama.iskontoYuzde ?? 0, kdv = tarama.kdvOrani ?? 20) => {
    const h = teklifToplamlariHesapla({ kalemler: yeni, iskontoYuzde: iskonto, kdvOrani: kdv, kisiSayisi: tarama.kisiSayisi })
    guncelle(tarama.id, {
      kalemler: yeni,
      iskontoYuzde: iskonto || undefined,
      kdvOrani: kdv,
      indirimTutar: h.indirimTutar,
      netToplam: h.netToplam,
      genelToplam: h.genelToplam,
      ...(olay ? { gecmis: hareketEkle(olay) } : {}),
    })
  }
  const testEkle = (t: Test) => {
    if (kalemler.some((k) => k.testId === t.id)) return
    kalemlerKaydet([...kalemler, { testId: t.id, ad: t.ad, birim: t.fiyat, miktar: Math.max(1, tarama.kisiSayisi) }], `Test eklendi: ${t.ad}`)
    setTestAra('')
    toast.success(`${t.ad} eklendi`)
  }
  const kalemGuncelle = (testId: string, patch: { miktar?: number; birim?: number }) =>
    kalemlerKaydet(kalemler.map((k) => (k.testId === testId ? { ...k, ...patch } : k)))
  const kalemSil = (testId: string, ad: string) => kalemlerKaydet(kalemler.filter((k) => k.testId !== testId), `Test kaldırıldı: ${ad}`)
  const testAdaylari = testAra.trim()
    ? testler
        .filter((t) => t.durum === 'Aktif' && !kalemler.some((k) => k.testId === t.id) && `${t.ad} ${t.kategori}`.toLocaleLowerCase('tr').includes(testAra.toLocaleLowerCase('tr').trim()))
        .slice(0, 8)
    : []

  const metinBaslat = () => {
    setTaslakOnYazi(tarama.onYazi ?? '')
    setTaslakNotlar(tarama.notlar ?? '')
    setMetinDuzen(true)
  }
  const metinKaydet = () => {
    guncelle(tarama.id, {
      onYazi: taslakOnYazi.trim() || undefined,
      notlar: taslakNotlar.trim() || undefined,
      gecmis: hareketEkle('Ön yazı veya notlar düzenlendi'),
    })
    setMetinDuzen(false)
    toast.success('Metin ve notlar kaydedildi')
  }

  const durumDegistir = (d: TaramaDurum) => {
    if (d === tarama.durum) return
    guncelle(tarama.id, durumPatch(tarama, d))
    toast.success(`Durum “${d}” olarak güncellendi`)
  }

  /* Tamamlanan kişi sayısı; her değişiklik hareket geçmişine yazılır */
  const ilerlemeAyarla = (n: number) => {
    const yeni = Math.min(tarama.kisiSayisi, Math.max(0, n))
    if (yeni === tarama.tamamlanan) return
    /* İlk ilerleme kaydıyla planlı tarama kendiliğinden devam ediyor durumuna geçer */
    const durum = yeni > 0 && tarama.durum === 'Planlandı' ? { durum: 'Devam ediyor' as const } : {}
    guncelle(tarama.id, {
      ...durum,
      tamamlanan: yeni,
      gecmis: [{ tarih: new Date().toISOString(), olay: `İlerleme: ${yeni}/${tarama.kisiSayisi} kişi` }, ...(tarama.gecmis ?? [])],
    })
  }

  const taramaSil = () => {
    if (!window.confirm(`${tarama.firma} taraması silinsin mi? Bu işlem geri alınamaz.`)) return
    sil(tarama.id)
    toast.success('Tarama silindi')
    navigate('/panel/taramalar')
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[32rem] flex-col gap-3 sm:h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-7.5rem)]">
      {/* Üst şerit */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/panel/taramalar"
            aria-label="Taramalara dön"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {tarihAraligi(tarama)} · {saatAraligi(tarama)}
              </span>
              <Pill tone={TON[tarama.durum]}>{tarama.durum}</Pill>
              <span className={cn('text-[11px] tabular-nums', kalanTon)}>{kalanEtiket}</span>
            </div>
            <h1 className="mt-1 truncate text-base font-semibold tracking-tight sm:text-xl">{tarama.firma}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-0.5" role="group" aria-label="Tarama durumu">
            {TARAMA_DURUMLARI.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={tarama.durum === d}
                onClick={() => durumDegistir(d)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  tarama.durum === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <Button size="sm" nativeButton={false} render={<Link to={`/panel/taramalar/yeni?duzenle=${tarama.id}`} />} className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
            <PencilIcon /> Düzenle
          </Button>
          <Button variant="ghost" size="sm" onClick={taramaSil} aria-label="Taramayı sil" title="Sil" className="px-2 text-muted-foreground hover:text-red-600">
            <Trash2Icon />
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,0.9fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:grid-rows-none">
        {/* Sol: özet ve hareketler */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
            <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-0.5">
              {(
                [
                  { k: 'ozet', e: 'Özet' },
                  { k: 'testler', e: `Testler ${kalemler.length}` },
                  { k: 'isListesi', e: 'İş listesi' },
                  { k: 'metin', e: 'Metin' },
                  { k: 'hareket', e: `Hareketler ${hareketler.length}` },
                  { k: 'ilerleme', e: 'İlerleme' },
                ] as const
              ).map((s) => (
                <button
                  key={s.k}
                  type="button"
                  aria-pressed={sekme === s.k}
                  onClick={() => setSekme(s.k)}
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                    sekme === s.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s.e}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">{tarama.hizmet}</span>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {sekme === 'ozet' && (
              <>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Firma</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    <FirmaBaglantisi unvan={tarama.firma} />
                  </p>
                  {firma ? (
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{firma.yetkili}</span>
                      <span>· {firma.il}</span>
                      <a href={`tel:${firma.telefon.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1 hover:text-amber-700 hover:underline dark:hover:text-amber-400">
                        <PhoneIcon className="size-3" /> {firma.telefon}
                      </a>
                      <a href={`mailto:${firma.eposta}`} className="inline-flex min-w-0 items-center gap-1 hover:text-amber-700 hover:underline dark:hover:text-amber-400">
                        <MailIcon className="size-3 shrink-0" /> <span className="truncate">{firma.eposta}</span>
                      </a>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Firma kaydı bulunamadı</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Tarama bilgileri</p>
                  {ozetDuzen ? (
                    <div className="flex items-center gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => setOzetDuzen(false)}>
                        <XIcon /> Vazgeç
                      </Button>
                      <Button size="xs" onClick={ozetKaydet} className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
                        <SaveIcon /> Kaydet
                      </Button>
                    </div>
                  ) : (
                    <Button size="xs" variant="outline" onClick={ozetBaslat}>
                      <PencilIcon /> Düzenle
                    </Button>
                  )}
                </div>
                {ozetDuzen && (
                  <div className="grid grid-cols-2 gap-2.5 rounded-lg border bg-background p-3">
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Başlangıç tarihi
                      <Input type="date" value={ozetTaslak.tarih} onChange={(e) => setOzetTaslak({ ...ozetTaslak, tarih: e.target.value })} className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Başlangıç saati
                      <Input type="time" value={ozetTaslak.saat} onChange={(e) => setOzetTaslak({ ...ozetTaslak, saat: e.target.value })} className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Bitiş tarihi
                      <Input type="date" value={ozetTaslak.bitisTarih} onChange={(e) => setOzetTaslak({ ...ozetTaslak, bitisTarih: e.target.value })} className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Bitiş saati
                      <Input type="time" value={ozetTaslak.bitisSaat} onChange={(e) => setOzetTaslak({ ...ozetTaslak, bitisSaat: e.target.value })} className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="col-span-2 space-y-1 text-[11px] font-medium text-muted-foreground">
                      Lokasyon
                      <Input value={ozetTaslak.lokasyon} onChange={(e) => setOzetTaslak({ ...ozetTaslak, lokasyon: e.target.value })} placeholder="Bina, kat veya bölüm" className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Hizmet türü
                      <select value={ozetTaslak.hizmet} onChange={(e) => setOzetTaslak({ ...ozetTaslak, hizmet: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs font-normal text-foreground outline-none focus-visible:border-ring">
                        {HIZMET_TURLERI.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Planlanan kişi
                      <Input type="number" min={1} value={ozetTaslak.kisiSayisi} onChange={(e) => setOzetTaslak({ ...ozetTaslak, kisiSayisi: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} className="h-8 text-xs font-normal text-foreground tabular-nums" />
                    </label>
                    <div className="col-span-2 space-y-1.5">
                      <p className="text-[11px] font-medium text-muted-foreground">Saha ekibi</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ekipModulUyeleri
                          .filter((u) => u.durum === 'Aktif')
                          .map((u) => {
                            const secili = ozetTaslak.ekipIds.includes(u.id)
                            return (
                              <button
                                key={u.id}
                                type="button"
                                aria-pressed={secili}
                                onClick={() => ozetEkipTikla(u.id)}
                                className={cn('rounded-full border px-2.5 py-1 text-[11px] transition-colors', secili ? 'border-emerald-500/50 bg-emerald-500/10 font-medium' : 'hover:bg-muted')}
                              >
                                {u.ad} {u.soyad}
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                )}
                {!ozetDuzen && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <Alan etiket="Tarih">{tarihAraligi(tarama)}</Alan>
                  <Alan etiket="Saat">{saatAraligi(tarama)}</Alan>
                  <Alan etiket="Lokasyon">{tarama.lokasyon || '—'}</Alan>
                  <div className="min-w-0 border-b border-border/60 pb-1.5">
                    <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Saha ekibi</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {ekipUyeleri.length ? ekipUyeleri.map((u) => <Pill key={u} tone="zinc">{u}</Pill>) : <span className="text-xs font-medium">—</span>}
                    </dd>
                  </div>
                  <Alan etiket="Hizmet">{tarama.hizmet}</Alan>
                  <Alan etiket="Bağlı teklif">
                    {teklif ? (
                      <Link to={`/panel/teklifler/${teklif.id}`} className="hover:text-amber-700 hover:underline dark:hover:text-amber-400">
                        {teklif.no} · {teklif.durum}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </Alan>
                </dl>
                )}


                {tutarOzetiKarti && (
                  <div className="rounded-lg border bg-background">
                    <p className="border-b px-3 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Fiyat özeti</p>
                    {tutarOzetiKarti}
                  </div>
                )}
              </>
            )}

            {sekme === 'isListesi' && (
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border bg-background px-3 py-2">
                    <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Hazırlık</p>
                    <p className="text-sm font-bold tabular-nums">
                      {hazirTamam} / {ISLISTESI_HAZIRLIK.length}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background px-3 py-2">
                    <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Ekip katılımı</p>
                    <p className="text-sm font-bold tabular-nums">
                      {katilanSayi} / {isEkipUyeleri.length}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background px-3 py-2">
                    <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Test tamamlama</p>
                    <p className="text-sm font-bold tabular-nums">{hedefToplam ? `%${Math.round((yapilanToplam / hedefToplam) * 100)}` : '—'}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Ekibe vermek için sağdaki önizlemeden yazdırabilir ya da PDF indirebilirsiniz.</p>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                  <section className="rounded-lg border bg-background">
                    <p className="border-b px-3 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Hazırlık</p>
                    <ul className="divide-y">
                      {ISLISTESI_HAZIRLIK.map((h) => {
                        const tamam = !!isListesi.hazirlik[h.k]
                        return (
                          <li key={h.k}>
                            <button type="button" onClick={() => hazirlikDegistir(h.k)} aria-pressed={tamam} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50">
                              <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border', tamam ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-input')}>
                                {tamam && <CheckIcon className="size-3" />}
                              </span>
                              <span className={cn(tamam && 'text-muted-foreground line-through')}>{h.e}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>

                  <section className="rounded-lg border bg-background p-3">
                    <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Ekip katılımı</p>
                    {isEkipUyeleri.length ? (
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {isEkipUyeleri.map((u) => {
                          const katildi = !!isListesi.katilim[u.anahtar]
                          return (
                            <button
                              key={u.anahtar}
                              type="button"
                              onClick={() => katilimDegistir(u.anahtar)}
                              aria-pressed={katildi}
                              className={cn('flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors', katildi ? 'border-emerald-500/40 bg-emerald-500/5' : 'hover:bg-muted/50')}
                            >
                              <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border', katildi ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-input')}>
                                {katildi && <CheckIcon className="size-3" />}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-medium">{u.ad}</span>
                                {u.gorev && <span className="block truncate text-[11px] text-muted-foreground">{u.gorev}</span>}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Ekip üyesi seçilmedi.</p>
                    )}
                  </section>

                  <section className="rounded-lg border bg-background">
                    <p className="border-b px-3 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Test uygulama</p>
                    {kalemler.length ? (
                      <ul className="divide-y">
                        {kalemler.map((k) => {
                          const yapilan = Math.min(k.miktar, isListesi.yapilan[k.testId] ?? 0)
                          const tamam = yapilan >= k.miktar
                          const oran = k.miktar ? Math.round((yapilan / k.miktar) * 100) : 0
                          return (
                            <li key={k.testId} className="space-y-1.5 px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="min-w-0 truncate text-xs font-medium">{k.ad}</span>
                                <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">hedef {k.miktar}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
                                  <button type="button" aria-label={`${k.ad} sayısını azalt`} onClick={() => yapilanAyarla(k.testId, yapilan - 1, k.miktar)} disabled={yapilan === 0} className="flex size-6 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/70 disabled:opacity-40">
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    max={k.miktar}
                                    value={isListesi.yapilan[k.testId] ?? ''}
                                    placeholder="…"
                                    aria-label={`${k.ad} yapılan kişi`}
                                    onChange={(e) => (e.target.value === '' ? yapilanTemizle(k.testId) : yapilanAyarla(k.testId, Number(e.target.value), k.miktar))}
                                    className="w-12 bg-transparent text-center text-xs font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button type="button" aria-label={`${k.ad} sayısını artır`} onClick={() => yapilanAyarla(k.testId, yapilan + 1, k.miktar)} disabled={tamam} className="flex size-6 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/70 disabled:opacity-40">
                                    +
                                  </button>
                                </div>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div className={cn('h-full rounded-full transition-[width] duration-500', tamam ? 'bg-emerald-500' : 'bg-amber-400')} style={{ width: `${oran}%` }} />
                                </div>
                                <button type="button" onClick={() => yapilanAyarla(k.testId, k.miktar, k.miktar)} disabled={tamam} className="shrink-0 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">
                                  Hepsi
                                </button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="px-3 py-3 text-xs text-muted-foreground">Bu taramaya test eklenmedi.</p>
                    )}
                  </section>
                </div>
              </div>
            )}

            {sekme === 'testler' && (
              <div className="space-y-3">
                <div className="rounded-lg border bg-background">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Test planı</p>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {kalemler.length} test · {tarama.kisiSayisi} kişi
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2 text-[11px] text-muted-foreground">
                    <label className="flex items-center gap-1.5">
                      İskonto %
                      <Input type="number" min={0} max={100} value={tarama.iskontoYuzde ?? 0} onChange={(e) => kalemlerKaydet(kalemler, undefined, Math.min(100, Math.max(0, Number(e.target.value) || 0)), tarama.kdvOrani ?? 20)} aria-label="İskonto yüzdesi" className="h-7 w-16 text-right text-xs tabular-nums" />
                    </label>
                    <label className="flex items-center gap-1.5">
                      KDV
                      <select value={tarama.kdvOrani ?? 20} onChange={(e) => kalemlerKaydet(kalemler, undefined, tarama.iskontoYuzde ?? 0, Number(e.target.value))} aria-label="KDV oranı" className="h-7 rounded-md border border-input bg-background px-1.5 text-xs text-foreground outline-none">
                        {[0, 1, 10, 20].map((o) => (
                          <option key={o} value={o}>
                            %{o}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="space-y-2 border-b p-3">
                    <div className="relative">
                      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input value={testAra} onChange={(e) => setTestAra(e.target.value)} placeholder="Test ekle: ad veya kategori yazın" aria-label="Test ekle" className="h-8 pl-8 text-xs" />
                    </div>
                    {testAra.trim() && (
                      <div className="flex flex-wrap gap-1">
                        {testAdaylari.map((t) => (
                          <button key={t.id} type="button" onClick={() => testEkle(t)} className="inline-flex max-w-full items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-[11px] transition-colors hover:border-amber-400/60 hover:bg-amber-400/5">
                            <PlusIcon className="size-3 shrink-0" />
                            <span className="truncate">{t.ad}</span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">{paraBicim(t.fiyat)}</span>
                          </button>
                        ))}
                        {testAdaylari.length === 0 && <span className="text-[11px] text-muted-foreground">Eşleşen aktif test yok.</span>}
                      </div>
                    )}
                  </div>
                  {kalemler.length ? (
                    <ul className="divide-y text-xs">
                      {kalemler.map((k) => (
                        <li key={k.testId} className="flex flex-wrap items-center gap-2 px-3 py-2">
                          <span className="min-w-0 flex-1 truncate font-medium">{k.ad}</span>
                          <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            kişi
                            <Input type="number" min={1} value={k.miktar} onChange={(e) => kalemGuncelle(k.testId, { miktar: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} aria-label={`${k.ad} miktar`} className="h-7 w-16 text-right text-xs tabular-nums" />
                          </label>
                          <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            birim
                            <Input type="number" min={0} value={k.birim} onChange={(e) => kalemGuncelle(k.testId, { birim: Math.max(0, Number(e.target.value) || 0) })} aria-label={`${k.ad} birim fiyat`} className="h-7 w-20 text-right text-xs tabular-nums" />
                          </label>
                          <span className="w-24 text-right font-semibold tabular-nums">{paraBicim(k.birim * k.miktar)}</span>
                          <button type="button" aria-label={`${k.ad} kaldır`} onClick={() => kalemSil(k.testId, k.ad)} className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600">
                            <Trash2Icon className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-3 text-xs text-muted-foreground">Bu taramaya test eklenmedi.</p>
                  )}
                  {tutarOzetiKarti}
                </div>
              </div>
            )}
            {sekme === 'metin' && (
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="flex shrink-0 items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">{metinDuzen ? 'Ön yazı ve notları düzenleyip kaydedin.' : 'Ön yazı ve saha notları iş listesi ve belgelere yansır.'}</p>
                  {metinDuzen ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => setMetinDuzen(false)}>
                        <XIcon /> Vazgeç
                      </Button>
                      <Button size="xs" onClick={metinKaydet} className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
                        <SaveIcon /> Kaydet
                      </Button>
                    </div>
                  ) : (
                    <Button size="xs" variant="outline" onClick={metinBaslat}>
                      <PencilIcon /> Düzenle
                    </Button>
                  )}
                </div>
                {metinDuzen ? (
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold">Tarama ön yazısı</p>
                      <textarea value={taslakOnYazi} onChange={(e) => setTaslakOnYazi(e.target.value)} rows={10} aria-label="Tarama ön yazısı metni" placeholder="Paragrafları boş satırla ayırın" className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs leading-relaxed outline-none focus-visible:border-ring dark:bg-input/30" />
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold">Saha notları</p>
                      <textarea value={taslakNotlar} onChange={(e) => setTaslakNotlar(e.target.value)} rows={5} aria-label="Saha notları" placeholder="Her satır bir not olarak kaydedilir" className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs leading-relaxed outline-none focus-visible:border-ring dark:bg-input/30" />
                    </div>
                  </div>
                ) : (
                  <>
                    {tarama.notlar && (
                      <div className="shrink-0 rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Saha notları</p>
                        <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs">
                          {tarama.notlar.split('\n').filter((n) => n.trim()).map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {tarama.onYazi ? (
                      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Tarama ön yazısı</p>
                        <div className="mt-0.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto text-xs leading-relaxed">
                          {tarama.onYazi.split(/\n\s*\n/).filter((p) => p.trim()).map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Ön yazı eklenmedi.</p>
                    )}
                  </>
                )}
              </div>
            )}
            {sekme === 'ilerleme' && (
              <div className="flex flex-col gap-3">
                <ol className="grid grid-cols-3 gap-1 rounded-lg border bg-background p-1.5" aria-label="Tarama aşamaları">
                  {(['Planlandı', 'Devam ediyor', 'Tamamlandı'] as const).map((d, i) => {
                    const aktif = tarama.durum === d
                    const gecildi = TARAMA_DURUMLARI.indexOf(tarama.durum) > i
                    return (
                      <li key={d}>
                        <button
                          type="button"
                          aria-pressed={aktif}
                          onClick={() => durumDegistir(d)}
                          className={cn(
                            'flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors',
                            aktif ? 'bg-amber-400 text-zinc-950' : gecildi ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground hover:bg-muted',
                          )}
                        >
                          <span className="tabular-nums opacity-70">{i + 1}</span>
                          {d}
                        </button>
                      </li>
                    )
                  })}
                </ol>
                {tarama.durum === 'İptal' && <p className="text-[11px] text-muted-foreground">Bu tarama iptal edildi; ilerleme kaydı tutulmaz.</p>}

                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Tamamlanan</p>
                      <p className="text-3xl font-bold tabular-nums">
                        {tarama.tamamlanan}
                        <span className="text-base font-medium text-muted-foreground"> / {tarama.kisiSayisi} kişi</span>
                      </p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">%{oran}</p>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Tamamlanma %${oran}`}>
                    <div className="h-full rounded-full bg-amber-400 transition-[width] duration-500" style={{ width: `${oran}%` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Kalan</p>
                      <p className="text-sm font-bold tabular-nums">{kalanKisi} kişi</p>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Hız</p>
                      <p className="text-sm font-bold tabular-nums">{tahmin ? `${tahmin.hiz} kişi/gün` : '—'}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Tahmini bitiş</p>
                      <p className="text-sm font-bold tabular-nums">{tahmin ? formatKisa(tahmin.tarih) : '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border bg-background p-3">
                  <p className="text-xs font-semibold">Tamamlanan kişi ekle</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={kalanKisi}
                      value={bugunGirdi}
                      onChange={(e) => setBugunGirdi(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && bugunSayi > 0 && ilerlemeEkle()}
                      placeholder="Kaç kişi tamamlandı?"
                      aria-label="Tamamlanan kişi sayısı"
                      className="h-8 text-xs tabular-nums"
                    />
                    <Button size="sm" onClick={ilerlemeEkle} disabled={bugunSayi < 1 || kalanKisi === 0}>
                      Ekle
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[1, 5, 10, 25].map((n) => (
                      <Button key={n} size="xs" variant="outline" onClick={() => ilerlemeAyarla(tarama.tamamlanan + n)} disabled={kalanKisi === 0 || tarama.durum === 'İptal'}>
                        +{n}
                      </Button>
                    ))}
                    <Button size="xs" variant="ghost" onClick={() => ilerlemeAyarla(tarama.kisiSayisi)} disabled={kalanKisi === 0 || tarama.durum === 'İptal'}>
                      Hepsi tamam
                    </Button>
                    <Button size="xs" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => ilerlemeAyarla(0)} disabled={tarama.tamamlanan === 0}>
                      Sıfırla
                    </Button>
                  </div>
                </div>

                {sonraki && (
                  <Button onClick={() => durumDegistir(sonraki)} className="w-full bg-amber-400 text-zinc-950 hover:bg-amber-300">
                    Sonraki adım: {sonraki} <ArrowRightIcon />
                  </Button>
                )}
              </div>
            )}

            {sekme === 'hareket' && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">Durum ve ilerleme değişiklikleri en yeniden eskiye sıralanır.</p>
                <ol className="relative space-y-3 border-l pl-4">
                  {hareketler.map((h, i) => (
                    <li key={`${h.tarih}-${i}`} className="relative text-xs">
                      <span className="absolute top-1 -left-[21px] size-2.5 rounded-full border-2 border-background bg-amber-400" aria-hidden />
                      <p className="font-medium">{h.olay}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">{zamanEtiketi(h.tarih)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>

        {/* Sağ: belge önizleme */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{sekme === 'isListesi' ? 'İş listesi belgesi' : 'Tarama planı belgesi'}</p>
                  <p className="text-[11px] text-muted-foreground">A4 · PDF</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={pdfYazdir} disabled={!aktifBelge.url}>
                    <PrinterIcon /> Yazdır
                  </Button>
                  <Button variant="outline" size="sm" onClick={pdfOnizle} disabled={!aktifBelge.url}>
                    <ExternalLinkIcon /> Önizle
                  </Button>
                  <Button size="sm" onClick={pdfIndir} disabled={!aktifBelge.doc} className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
                    <DownloadIcon /> PDF indir
                  </Button>
                </div>
              </div>
              <div className="relative min-h-[24rem] flex-1 bg-zinc-200/70 dark:bg-zinc-900">
                {aktifBelge.url && <iframe id="tarama-pdf-onizleme" key={aktifBelge.url} title={`${tarama.id} belge önizleme`} src={aktifBelge.url} className="absolute inset-0 h-full w-full border-0" />}
                {!aktifBelge.url && !aktifBelge.hata && (
                  <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin text-amber-500" /> Belge hazırlanıyor…
                  </div>
                )}
                {aktifBelge.hata && <div className="flex h-full items-center justify-center p-6 text-center text-xs text-red-600">{aktifBelge.hata}</div>}
              </div>
            </div>
        </section>
      </div>
    </div>
  )
}
