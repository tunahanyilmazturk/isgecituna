import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import type { jsPDF } from 'jspdf'
import {
  ArrowLeftIcon,
  DownloadIcon,
  HeartPulseIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  PrinterIcon,
  SaveIcon,
  SearchIcon,
  XIcon,
  ReceiptTextIcon,
  Trash2Icon,
} from 'lucide-react'
import { Button } from '@saglik/components/ui/button'
import { Input } from '@saglik/components/ui/input'
import { Pill, type PillTone } from '@saglik/components/pill'
import { FirmaBaglantisi } from '@saglik/components/firma-link'
import { cn } from '@saglik/lib/utils'
import { formatUzun, gunFarki, gunKaydir } from '@saglik/lib/date'
import { osgbAd, osgbLogoHarf, osgbUnvan, useOsgb } from '@saglik/lib/osgb'
import { teklifDosyaAdi, teklifPdfOlustur } from '@saglik/lib/teklif-pdf'
import { BUGUN, TEKLIF_DURUMLARI, teklifKdvDahil, teklifNet, teklifToplamlariHesapla, type TeklifDurum, type Test } from '@saglik/data/saglik'
import { useFirmaStore, useTeklifStore, useTestStore } from '@saglik/stores/saglik-stores'

const TON: Record<TeklifDurum, PillTone> = {
  Taslak: 'zinc',
  Gönderildi: 'amber',
  Onaylandı: 'green',
  Reddedildi: 'red',
}

type Sekme = 'ozet' | 'kalem' | 'metin' | 'hareket'
const SEKMELER: { k: Sekme; e: string }[] = [
  { k: 'ozet', e: 'Özet' },
  { k: 'kalem', e: 'Kalemler' },
  { k: 'metin', e: 'Metin ve koşullar' },
  { k: 'hareket', e: 'Hareketler' },
]

const tl = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`

function Alan({ etiket, children, className }: { etiket: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 border-b border-border/60 pb-1.5', className)}>
      <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{etiket}</dt>
      <dd className="mt-0.5 truncate text-xs font-medium">{children}</dd>
    </div>
  )
}

export default function TeklifDetayPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const teklif = useTeklifStore((s) => s.kayitlar.find((t) => t.id === id))
  const guncelle = useTeklifStore((s) => s.guncelle)
  const sil = useTeklifStore((s) => s.sil)
  const firma = useFirmaStore((s) => s.kayitlar.find((f) => f.unvan === teklif?.firma))
  const kurum = useOsgb()

  const [sekme, setSekme] = useState<Sekme>('ozet')
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfHata, setPdfHata] = useState<string | null>(null)
  /* Kalemler: hızlı test arama; Metin: düzenleme modu ve taslak alanları */
  const testler = useTestStore((s) => s.kayitlar)
  const [testAra, setTestAra] = useState('')
  const [metinDuzen, setMetinDuzen] = useState(false)
  const [taslakOnYazi, setTaslakOnYazi] = useState('')
  const [taslakSartlar, setTaslakSartlar] = useState<string[]>([])
  const [yeniSart, setYeniSart] = useState('')

  /* Belge her değişimde yeniden üretilir; önizleme için blob adresi kullanılır */
  useEffect(() => {
    if (!teklif) return
    let iptal = false
    let adres: string | null = null
    setPdfUrl(null)
    setPdfHata(null)
    teklifPdfOlustur(teklif, firma, {
      ad: osgbAd(),
      unvan: osgbUnvan(),
      harf: osgbLogoHarf(),
      logo: kurum.logo,
      adres: kurum.adres,
      telefon: kurum.telefon,
      eposta: kurum.eposta,
      web: kurum.web,
      yetkili: kurum.yetkili,
      yetkiliUnvan: kurum.yetkiliUnvan,
    })
      .then((doc) => {
        if (iptal) return
        adres = URL.createObjectURL(doc.output('blob'))
        setPdfDoc(doc)
        setPdfUrl(adres)
      })
      .catch(() => {
        if (!iptal) setPdfHata('PDF oluşturulamadı. Sayfayı yenileyip tekrar deneyin.')
      })
    return () => {
      iptal = true
      if (adres) URL.revokeObjectURL(adres)
    }
  }, [teklif, firma, kurum])

  if (!teklif) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <ReceiptTextIcon className="size-8 text-muted-foreground/60" />
        <p className="text-sm font-medium">Teklif bulunamadı</p>
        <p className="text-xs text-muted-foreground">Kayıt silinmiş olabilir.</p>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/panel/teklifler" />}>
          <ArrowLeftIcon /> Tekliflere dön
        </Button>
      </div>
    )
  }

  const kalemler = teklif.kalemler ?? []
  /* Kalem kaydı yoksa (eski kayıtlar) tek satırlık özet gösterilir */
  const satirlar = kalemler.length
    ? kalemler.map((k) => ({ id: k.testId, ad: k.ad, birim: k.birim, miktar: k.miktar }))
    : [{ id: 'ozet', ad: teklif.paketAdi ?? teklif.hizmet, birim: teklifNet(teklif) / Math.max(1, teklif.kisiSayisi), miktar: Math.max(1, teklif.kisiSayisi) }]
  const net = teklifNet(teklif)
  const genel = teklifKdvDahil(teklif)
  const kdvOran = teklif.kdvOrani ?? 20
  const kdvTutar = genel - net
  /* Çubuk için net tutarın genel toplam içindeki payı (%) */
  const netPay = genel > 0 ? Math.min(100, Math.max(0, (net / genel) * 100)) : 100
  const kalemToplam = kalemler.length ? kalemler.reduce((s, k) => s + k.birim * k.miktar, 0) : net
  const indirim = teklif.indirimTutar ?? Math.max(0, kalemToplam - net)
  const indirimOran = kalemToplam > 0 ? (indirim / kalemToplam) * 100 : 0
  const kisi = Math.max(1, teklif.kisiSayisi)
  const kalan = gunFarki(BUGUN, teklif.gecerlilik)
  const sartlar = (teklif.sartlar ?? []).map((s) => s.trim()).filter(Boolean)
  const paragraflar = (teklif.onYazi ?? '').split(/\n\s*\n/).filter((p) => p.trim())

  /** Yeni hareket kaydını geçmişin başına ekler */
  const hareketEkle = (olay: string) => [{ tarih: new Date().toISOString(), olay }, ...(teklif.gecmis ?? [])]

  /** Kalemleri kaydeder; indirim, net, KDV dahil toplam ve kişi başı fiyat birlikte yeniden hesaplanır */
  const kalemleriKaydet = (yeni: { testId: string; ad: string; birim: number; miktar: number }[], olay?: string) => {
    const h = teklifToplamlariHesapla({ kalemler: yeni, iskontoYuzde: teklif.iskontoYuzde, kdvOrani: teklif.kdvOrani, kisiSayisi: teklif.kisiSayisi })
    guncelle(teklif.id, {
      kalemler: yeni,
      indirimTutar: h.indirimTutar,
      netToplam: h.netToplam,
      genelToplam: h.genelToplam,
      birimFiyat: h.birimFiyat,
      ...(olay ? { gecmis: hareketEkle(olay) } : {}),
    })
  }
  const testEkle = (t: Test) => {
    if (kalemler.some((k) => k.testId === t.id)) return
    kalemleriKaydet([...kalemler, { testId: t.id, ad: t.ad, birim: t.fiyat, miktar: Math.max(1, teklif.kisiSayisi) }], `Test eklendi: ${t.ad}`)
    setTestAra('')
    toast.success(`${t.ad} eklendi`)
  }
  const kalemGuncelle = (testId: string, patch: { miktar?: number; birim?: number }) =>
    kalemleriKaydet(kalemler.map((k) => (k.testId === testId ? { ...k, ...patch } : k)))
  const kalemSil = (testId: string) => {
    const ad = kalemler.find((k) => k.testId === testId)?.ad ?? ''
    kalemleriKaydet(kalemler.filter((k) => k.testId !== testId), `Test kaldırıldı: ${ad}`)
  }
  const aramaSonucu = testAra.toLocaleLowerCase('tr').trim()
  const onerilenTestler = aramaSonucu
    ? testler
        .filter((t) => t.durum === 'Aktif' && !kalemler.some((k) => k.testId === t.id) && `${t.ad} ${t.kategori}`.toLocaleLowerCase('tr').includes(aramaSonucu))
        .slice(0, 8)
    : []

  const metinDuzenleBaslat = () => {
    setTaslakOnYazi(teklif.onYazi ?? '')
    setTaslakSartlar([...(teklif.sartlar ?? [])])
    setYeniSart('')
    setMetinDuzen(true)
  }
  const metinKaydet = () => {
    guncelle(teklif.id, {
      onYazi: taslakOnYazi.trim() || undefined,
      sartlar: taslakSartlar.map((s) => s.trim()).filter(Boolean),
      gecmis: hareketEkle('Ön yazı veya koşullar düzenlendi'),
    })
    setMetinDuzen(false)
    toast.success('Metin ve koşullar kaydedildi')
  }
  const yeniSartEkle = () => {
    if (!yeniSart.trim()) return
    setTaslakSartlar((l) => [...l, yeniSart.trim()])
    setYeniSart('')
  }

  const durumDegistir = (d: TeklifDurum) => {
    if (d === teklif.durum) return
    guncelle(teklif.id, { durum: d, gecmis: hareketEkle(`Durum: ${d}`) })
    toast.success(`Durum “${d}” olarak güncellendi`)
  }
  /** Geçerlilik, bugünden ya da mevcut bitişten (hangisi later ise) n gün uzatılır */
  const gecerliligiUzat = (n: number) => {
    const taban = teklif.gecerlilik > BUGUN ? teklif.gecerlilik : BUGUN
    const yeni = gunKaydir(taban, n)
    guncelle(teklif.id, { gecerlilik: yeni, gecmis: hareketEkle(`Geçerlilik ${formatUzun(yeni)} tarihine uzatıldı`) })
    toast.success(`Geçerlilik ${formatUzun(yeni)} tarihine uzatıldı`)
  }
  /** Geçmiş kayıtları; eski kayıtlarda oluşturma tarihini tek satır olarak gösterir */
  const hareketler = teklif.gecmis?.length
    ? teklif.gecmis
    : [{ tarih: `${teklif.tarih}T00:00:00`, olay: 'Teklif oluşturuldu' }]
  const zamanEtiketi = (iso: string) => new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
  /** Tarama planlama sihirbazını bu teklif verisiyle açar; kayıt yalnızca kullanıcı onayıyla oluşur */
  const taramayaDok = () => {
    if (!teklif) return
    navigate(`/panel/taramalar/yeni?teklif=${teklif.id}`)
  }

  const teklifSil = () => {
    if (!window.confirm(`${teklif.no} numaralı teklif silinsin mi? Bu işlem geri alınamaz.`)) return
    sil(teklif.id)
    toast.success(`${teklif.no} silindi`)
    navigate('/panel/teklifler')
  }
  const pdfIndir = () => {
    if (!pdfDoc) return
    pdfDoc.save(teklifDosyaAdi(teklif))
  }
  /** Belgeyi yeni sekmede açar (tarayıcının kendi PDF görüntüleyicisi) */
  const pdfOnizle = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener')
  }
  const pdfYazdir = () => {
    const pencere = document.getElementById('teklif-pdf-onizleme') as HTMLIFrameElement | null
    try {
      if (!pencere?.contentWindow) throw new Error('önizleme yok')
      pencere.contentWindow.print()
    } catch {
      /* Gömülü önizleme yazdırmayı engelliyorsa belgeyi yeni sekmede aç */
      if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener')
      else toast.error('Belge henüz hazır değil.')
    }
  }

  const kalanEtiket =
    kalan < 0 ? `${Math.abs(kalan)} gün önce doldu` : kalan === 0 ? 'Bugün son gün' : `${kalan} gün kaldı`
  const kalanTon = kalan < 0 ? 'text-red-600 dark:text-red-400' : kalan <= 7 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[32rem] flex-col gap-3 sm:h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-7.5rem)]">
      {/* Üst şerit */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/panel/teklifler"
            aria-label="Tekliflere dön"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">{teklif.no}</span>
              <Pill tone={TON[teklif.durum]}>{teklif.durum}</Pill>
              <span className={cn('text-[11px] tabular-nums', kalanTon)}>{kalanEtiket}</span>
            </div>
            <h1 className="mt-1 truncate text-base font-semibold tracking-tight sm:text-xl">{teklif.baslik ?? teklif.firma}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-0.5" role="group" aria-label="Teklif durumu">
            {TEKLIF_DURUMLARI.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={teklif.durum === d}
                onClick={() => durumDegistir(d)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  teklif.durum === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {d}
              </button>
            ))}
          </div>
          {teklif.durum !== 'Reddedildi' && (
            <>
              <Button variant="outline" size="sm" onClick={taramayaDok} title="Tarama planlama sihirbazını bu teklifle açar">
                <HeartPulseIcon /> Taramaya dök
              </Button>
            </>
          )}
          <Button size="sm" nativeButton={false} render={<Link to={`/panel/teklifler/yeni?duzenle=${teklif.id}`} />} className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
            <PencilIcon /> Düzenle
          </Button>
          <Button variant="ghost" size="sm" onClick={teklifSil} aria-label="Teklifi sil" title="Teklifi sil" className="px-2 text-muted-foreground hover:text-red-600">
            <Trash2Icon />
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:grid-rows-none">
        {/* Sol: bilgi sekmeleri */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
            <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-0.5">
              {SEKMELER.map((s) => (
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
                  {s.k === 'kalem' && <span className="ml-1 tabular-nums opacity-60">{kalemler.length}</span>}
                  {s.k === 'hareket' && <span className="ml-1 tabular-nums opacity-60">{hareketler.length}</span>}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">{kisi} çalışan</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {sekme === 'ozet' && (
              <div className="space-y-3">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Firma</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    <FirmaBaglantisi unvan={teklif.firma} />
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

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <Alan etiket="Hizmet türü">{teklif.hizmet}</Alan>
                  <Alan etiket="Teklif tarihi">{formatUzun(teklif.tarih)}</Alan>
                  <Alan etiket="Geçerlilik">
                    <span>{formatUzun(teklif.gecerlilik)}</span>
                    <span className={cn('ml-1.5 text-[11px] font-normal', kalanTon)}>· {kalanEtiket}</span>
                  </Alan>
                  <Alan etiket="Ödeme koşulu">{teklif.odemeKosulu ?? 'Belirtilmedi'}</Alan>
                  <Alan etiket="Paket">{teklif.paketAdi ?? '—'}</Alan>
                  <Alan etiket="KDV oranı">%{kdvOran}</Alan>
                  {teklif.notlar && (
                    <div className="col-span-2 rounded-lg bg-muted/50 px-3 py-2">
                      <dt className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Not</dt>
                      <dd className="mt-0.5 text-xs whitespace-pre-line">{teklif.notlar}</dd>
                    </div>
                  )}
                </dl>

                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed px-3 py-2">
                  <span className="mr-1 text-[11px] text-muted-foreground">Geçerliliği uzat:</span>
                  {[7, 15, 30].map((n) => (
                    <Button key={n} size="xs" variant="outline" onClick={() => gecerliligiUzat(n)}>
                      +{n} gün
                    </Button>
                  ))}
                  <span className="ml-auto text-[10px] text-muted-foreground">{kalan < 0 ? 'Süre doldu' : 'Bugünden itibaren'}</span>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                  <header className="flex items-center justify-between border-b px-3.5 py-2.5">
                    <h3 className="text-xs font-semibold">Tutar özeti</h3>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">KDV %{kdvOran}</span>
                  </header>

                  <div className="space-y-2 px-3.5 py-3 text-xs">
                    <div className="flex items-center justify-between tabular-nums">
                      <span className="text-muted-foreground">Kalem toplamı</span>
                      <span className="font-medium">{tl(kalemToplam)}</span>
                    </div>
                    {indirim > 0 && (
                      <div className="flex items-center justify-between tabular-nums">
                        <span className="text-muted-foreground">İndirim</span>
                        <span className="inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                          <span className="rounded bg-red-500/10 px-1 py-px text-[10px]">%{indirimOran.toFixed(1)}</span>− {tl(indirim)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t pt-2 tabular-nums">
                      <span className="text-muted-foreground">Net (KDV hariç)</span>
                      <span className="font-semibold">{tl(net)}</span>
                    </div>
                    <div className="flex items-center justify-between tabular-nums">
                      <span className="text-muted-foreground">KDV %{kdvOran}</span>
                      <span className="font-medium">{tl(kdvTutar)}</span>
                    </div>
                  </div>

                  <div className="px-3.5 pb-3">
                    <div
                      className="flex h-2 overflow-hidden rounded-full bg-muted"
                      role="img"
                      aria-label={`Net %${netPay.toFixed(0)}, KDV %${(100 - netPay).toFixed(0)}`}
                    >
                      <div className="bg-zinc-800 transition-[width] duration-500 dark:bg-zinc-300" style={{ width: `${netPay}%` }} />
                      <div className="bg-amber-400 transition-[width] duration-500" style={{ width: `${100 - netPay}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
                      <span>Net %{netPay.toFixed(0)}</span>
                      <span>KDV %{(100 - netPay).toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="m-3 mt-0 rounded-xl bg-zinc-950 p-3.5 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase opacity-60">Genel toplam · KDV dahil</p>
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-amber-400 dark:text-amber-600">{tl(genel)}</p>
                      </div>
                      <div className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-right dark:bg-black/5">
                        <p className="text-[10px] uppercase opacity-60">Kişi başı</p>
                        <p className="text-xs font-semibold tabular-nums">{tl(genel / kisi)}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {sekme === 'kalem' && (
              <div className="space-y-2">
                <div className="space-y-2 rounded-lg border bg-background p-2.5">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={testAra}
                      onChange={(e) => setTestAra(e.target.value)}
                      placeholder="Hızlı ekle: test adı yazın"
                      aria-label="Test ekle"
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  {aramaSonucu ? (
                    <div className="flex flex-wrap gap-1">
                      {onerilenTestler.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => testEkle(t)}
                          className="inline-flex max-w-full items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-[11px] transition-colors hover:border-amber-400/60 hover:bg-amber-400/5"
                        >
                          <PlusIcon className="size-3 shrink-0" />
                          <span className="truncate">{t.ad}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">{tl(t.fiyat)}</span>
                        </button>
                      ))}
                      {onerilenTestler.length === 0 && <span className="text-[11px] text-muted-foreground">Eşleşen aktif test yok.</span>}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Seçilen test {kisi} çalışan miktarıyla eklenir; miktar ve birim fiyatı tablodan değiştirebilirsiniz.
                    </p>
                  )}
                </div>
                {!kalemler.length && (
                  <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                    Bu teklif kalem ayrıntısı olmadan kaydedilmiş; toplam tek satırda gösteriliyor. Yukarıdan test ekleyerek kalemleri oluşturabilirsiniz.
                  </p>
                )}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-[10px] tracking-wide text-muted-foreground uppercase">
                      <th className="py-1.5 text-left font-semibold">Test / muayene</th>
                      <th className="py-1.5 text-right font-semibold">Birim</th>
                      <th className="py-1.5 text-center font-semibold">Miktar</th>
                      <th className="py-1.5 text-right font-semibold">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {kalemler.length
                      ? kalemler.map((k) => (
                          <tr key={k.testId}>
                            <td className="py-1.5 pr-2 font-medium">{k.ad}</td>
                            <td className="py-1.5 text-right">
                              <input
                                type="number"
                                min={0}
                                value={k.birim}
                                aria-label={`${k.ad} birim fiyat`}
                                onChange={(e) => e.target.value !== '' && kalemGuncelle(k.testId, { birim: Math.max(0, Number(e.target.value) || 0) })}
                                className="h-7 w-24 rounded-md border border-input bg-background px-1.5 text-right text-xs tabular-nums outline-none focus-visible:border-ring dark:bg-input/30"
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <input
                                type="number"
                                min={1}
                                value={k.miktar}
                                aria-label={`${k.ad} miktar`}
                                onChange={(e) => e.target.value !== '' && kalemGuncelle(k.testId, { miktar: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                                className="h-7 w-16 rounded-md border border-input bg-background px-1.5 text-center text-xs tabular-nums outline-none focus-visible:border-ring dark:bg-input/30"
                              />
                            </td>
                            <td className="py-1.5 pl-1 text-right">
                              <span className="font-semibold tabular-nums">{tl(k.birim * k.miktar)}</span>
                              <button
                                type="button"
                                aria-label={`${k.ad} kaldır`}
                                onClick={() => kalemSil(k.testId)}
                                className="ml-1.5 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                              >
                                <Trash2Icon className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      : satirlar.map((k) => (
                          <tr key={k.id}>
                            <td className="py-1.5 pr-2 font-medium">{k.ad}</td>
                            <td className="py-1.5 text-right tabular-nums text-muted-foreground">{tl(k.birim)}</td>
                            <td className="py-1.5 text-center tabular-nums">{k.miktar}</td>
                            <td className="py-1.5 text-right font-semibold tabular-nums">{tl(k.birim * k.miktar)}</td>
                          </tr>
                        ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t text-[11px]">
                      <td colSpan={3} className="py-1.5 text-right text-muted-foreground">
                        Kalem toplamı
                      </td>
                      <td className="py-1.5 text-right font-semibold tabular-nums">{tl(kalemToplam)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {sekme === 'hareket' && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Durum, geçerlilik ve kalem değişiklikleri en yeniden eskiye sıralanır. Toplam {hareketler.length} kayıt.
                </p>
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

            {sekme === 'metin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    {metinDuzen
                      ? 'Kalem tutarları değiştiyse ön yazıdaki rakamları da güncelleyin.'
                      : 'Ön yazı ve koşullar PDF belgesine aynen yansır.'}
                  </p>
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
                    <Button size="xs" variant="outline" onClick={metinDuzenleBaslat} className="shrink-0">
                      <PencilIcon /> Düzenle
                    </Button>
                  )}
                </div>

                {metinDuzen ? (
                  <>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold">Ön yazı</p>
                      <textarea
                        value={taslakOnYazi}
                        onChange={(e) => setTaslakOnYazi(e.target.value)}
                        rows={9}
                        aria-label="Ön yazı metni"
                        placeholder="Paragrafları boş satırla ayırın"
                        className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs leading-relaxed outline-none focus-visible:border-ring dark:bg-input/30"
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold">Şartlar ve koşullar</p>
                      <ol className="space-y-1.5">
                        {taslakSartlar.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-2 w-5 shrink-0 text-right text-xs font-semibold tabular-nums">{i + 1}.</span>
                            <textarea
                              value={s}
                              rows={2}
                              aria-label={`${i + 1}. koşul`}
                              onChange={(e) => setTaslakSartlar((l) => l.map((x, k) => (k === i ? e.target.value : x)))}
                              className="min-w-0 flex-1 resize-none rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs leading-relaxed outline-none focus-visible:border-ring dark:bg-input/30"
                            />
                            <button
                              type="button"
                              aria-label={`${i + 1}. koşulu sil`}
                              onClick={() => setTaslakSartlar((l) => l.filter((_, k) => k !== i))}
                              className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                            >
                              <Trash2Icon className="size-3.5" />
                            </button>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-2 flex gap-1.5">
                        <Input
                          value={yeniSart}
                          onChange={(e) => setYeniSart(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              yeniSartEkle()
                            }
                          }}
                          placeholder="Yeni koşul yazın ve Enter'a basın"
                          aria-label="Yeni koşul"
                          className="h-8 text-xs"
                        />
                        <Button size="sm" variant="outline" disabled={!yeniSart.trim()} onClick={yeniSartEkle}>
                          <PlusIcon /> Ekle
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold">Ön yazı</p>
                      {paragraflar.length ? (
                        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                          {paragraflar.map((p, i) => (
                            <p key={i} className="whitespace-pre-line">
                              {p}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Ön yazı girilmemiş.</p>
                      )}
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold">Şartlar ve koşullar</p>
                      {sartlar.length ? (
                        <ol className="space-y-1.5 text-xs leading-relaxed">
                          {sartlar.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="font-semibold tabular-nums">{i + 1}.</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-xs text-muted-foreground">Şartlar girilmemiş.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Sağ: PDF önizleme */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold">Belge önizleme</h3>
              <p className="text-[11px] text-muted-foreground">A4 · PDF</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={pdfYazdir} disabled={!pdfUrl}>
                <PrinterIcon /> Yazdır
              </Button>
              <Button variant="outline" size="sm" onClick={pdfOnizle} disabled={!pdfUrl}>
                <ExternalLinkIcon /> Önizle
              </Button>
              <Button size="sm" onClick={pdfIndir} disabled={!pdfDoc} className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
                <DownloadIcon /> PDF indir
              </Button>
            </div>
          </header>
          <div className="relative min-h-0 flex-1 bg-zinc-200/70 dark:bg-zinc-900">
            {pdfUrl && (
              <iframe
                id="teklif-pdf-onizleme"
                key={pdfUrl}
                title={`${teklif.no} teklif belgesi önizleme`}
                src={pdfUrl}
                className="h-full w-full border-0"
              />
            )}
            {!pdfUrl && !pdfHata && (
              <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin text-amber-500" /> Belge hazırlanıyor…
              </div>
            )}
            {pdfHata && <div className="flex h-full items-center justify-center p-6 text-center text-xs text-red-600">{pdfHata}</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
