import { FirmaBaglantisi } from '@saglik/components/firma-link'
import { Link, Navigate, useSearchParams } from 'react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DownloadIcon, EyeIcon, Loader2Icon, ReceiptTextIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@saglik/components/ui/button'
import { useOsgb } from '@saglik/lib/osgb'
import { kurumBilgisi, teklifDosyaAdi, teklifPdfOlustur } from '@saglik/lib/teklif-pdf'
import { ModulListesi, type FormAlan, type Kolon } from '@saglik/components/modul/modul-listesi'
import { Pill, type PillTone } from '@saglik/components/pill'
import { useFirmaStore } from '@saglik/stores/saglik-stores'
import { useTeklifStore } from '@saglik/stores/saglik-stores'
import { BUGUN, HIZMET_TURLERI, TEKLIF_DURUMLARI, teklifKdvDahil, teklifNet, type Teklif, type TeklifDurum } from '@saglik/data/saglik'
import { formatKisa, formatUzun, gunFarki } from '@saglik/lib/date'
import { cn } from '@saglik/lib/utils'

const TON: Record<TeklifDurum, PillTone> = {
  Taslak: 'zinc',
  Gönderildi: 'amber',
  Onaylandı: 'green',
  Reddedildi: 'red',
}

const tl = (n: number) => `${n.toLocaleString('tr-TR')} ₺`

/**
 * Satır işlemleri: önizleme (yeni sekmede PDF), PDF indirme ve silme.
 * Belge isteğe bağlı üretilir; tıklamalar satır bağlantısını tetiklemez.
 */
function TeklifIslemleri({ teklif, onSil }: { teklif: Teklif; onSil: (id: string) => void }) {
  const firma = useFirmaStore((s) => s.kayitlar.find((f) => f.unvan === teklif.firma))
  const kurum = useOsgb()
  const [mesgul, setMesgul] = useState<'onizle' | 'indir' | null>(null)

  const belgeUret = () => teklifPdfOlustur(teklif, firma, kurumBilgisi(kurum))

  const onizle = async () => {
    /* Pencereyi tıklama anında açıp belgeyi hazır olunca yükler; açılır pencere engellenmez. */
    const pencere = window.open('', '_blank')
    setMesgul('onizle')
    try {
      const doc = await belgeUret()
      const adres = URL.createObjectURL(doc.output('blob'))
      if (pencere) pencere.location.href = adres
      else window.open(adres, '_blank', 'noopener')
      window.setTimeout(() => URL.revokeObjectURL(adres), 60_000)
    } catch {
      pencere?.close()
      toast.error('Belge oluşturulamadı')
    } finally {
      setMesgul(null)
    }
  }

  const indir = async () => {
    setMesgul('indir')
    try {
      const doc = await belgeUret()
      doc.save(teklifDosyaAdi(teklif))
    } catch {
      toast.error('Belge oluşturulamadı')
    } finally {
      setMesgul(null)
    }
  }

  const sil = () => {
    if (!window.confirm(`${teklif.no} numaralı teklif silinsin mi? Bu işlem geri alınamaz.`)) return
    onSil(teklif.id)
    toast.success(`${teklif.no} silindi`)
  }

  const dur = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  return (
    <div className="inline-flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="xs" className="px-1.5" aria-label={`${teklif.no} önizle`} title="Önizle" disabled={mesgul !== null} onClick={(e) => dur(e, onizle)}>
        {mesgul === 'onizle' ? <Loader2Icon className="animate-spin" /> : <EyeIcon />}
      </Button>
      <Button variant="ghost" size="xs" className="px-1.5" aria-label={`${teklif.no} PDF indir`} title="PDF indir" disabled={mesgul !== null} onClick={(e) => dur(e, indir)}>
        {mesgul === 'indir' ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
      </Button>
      <Button variant="ghost" size="xs" className="px-1.5 text-muted-foreground hover:text-red-600" aria-label={`${teklif.no} sil`} title="Sil" onClick={(e) => dur(e, sil)}>
        <Trash2Icon />
      </Button>
    </div>
  )
}

export default function TekliflerPage() {
  const [params] = useSearchParams()
  const firmaParam = params.get('firma') ?? ''
  const yeniAc = params.get('yeni') === '1'
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const sil = useTeklifStore((s) => s.sil)
  const guncelle = useTeklifStore((s) => s.guncelle)
  const firmalar = useFirmaStore((s) => s.kayitlar)

  const firmaSecenekleri = useMemo(() => firmalar.map((f) => f.unvan), [firmalar])

  /* Yeni teklif her zaman sihirbazdan oluşturulur; eski "yeni" paneli kayıt eksik bırakıyordu. */
  if (yeniAc) {
    return <Navigate to={`/panel/teklifler/yeni${firmaParam ? `?firma=${encodeURIComponent(firmaParam)}` : ''}`} replace />
  }

  /* Filtre ve Excel için alan tanımları; kayıt düzenleme satır tıklamasıyla detay sayfasında yapılır. */
  const alanlar: FormAlan<Teklif>[] = [
    { key: 'firma', label: 'Firma', tip: 'secim', secenekler: firmaSecenekleri, zorunlu: true, genis: true },
    { key: 'hizmet', label: 'Hizmet', tip: 'secim', secenekler: HIZMET_TURLERI, zorunlu: true, genis: true },
    { key: 'kisiSayisi', label: 'Kişi sayısı', tip: 'sayi', zorunlu: true },
    { key: 'birimFiyat', label: 'Kişi başı fiyat (₺)', tip: 'sayi', zorunlu: true },
    { key: 'tarih', label: 'Teklif tarihi', tip: 'tarih', zorunlu: true },
    { key: 'gecerlilik', label: 'Geçerlilik tarihi', tip: 'tarih', zorunlu: true },
    { key: 'durum', label: 'Durum', tip: 'secim', secenekler: TEKLIF_DURUMLARI, genis: true },
  ]

  const kolonlar: Kolon<Teklif>[] = [
    {
      baslik: 'Teklif / no',
      hucre: (t) => (
        <div className="min-w-0">
          <Link
            to={`/panel/teklifler/${t.id}`}
            onClick={(e) => e.stopPropagation()}
            title={t.baslik ?? t.firma}
            className="block max-w-80 truncate font-medium hover:text-amber-700 hover:underline dark:hover:text-amber-400"
          >
            {t.baslik ?? t.firma}
          </Link>
          <p className="text-xs text-muted-foreground tabular-nums">{t.no}</p>
        </div>
      ),
    },
    { baslik: 'Firma', hucre: (t) => <FirmaBaglantisi unvan={t.firma} className="font-medium" />, sinif: 'min-w-56' },
    { baslik: 'Hizmet', hucre: (t) => t.hizmet },
    { baslik: 'Kişi', hucre: (t) => <span className="tabular-nums">{t.kisiSayisi}</span>, sinif: 'text-right' },
    {
      baslik: 'Toplam (KDV dahil)',
      siralama: (t) => teklifKdvDahil(t),
      hucre: (t) => (
        <div className="text-right">
          <p className="font-medium tabular-nums">{tl(teklifKdvDahil(t))}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">KDV hariç {tl(teklifNet(t))}</p>
        </div>
      ),
      sinif: 'text-right',
    },
    {
      baslik: 'Geçerlilik',
      siralama: (t) => t.gecerlilik,
      hucre: (t) => {
        const kalan = gunFarki(BUGUN, t.gecerlilik)
        const onaylandi = t.durum === 'Onaylandı'
        const doldu = !onaylandi && kalan < 0
        const yakin = !onaylandi && kalan >= 0 && kalan <= 7
        const etiket = onaylandi
          ? formatKisa(t.gecerlilik)
          : doldu
            ? 'Süresi doldu'
            : kalan === 0
              ? 'Bugün son gün'
              : `${kalan} gün kaldı`
        return (
          <span
            title={formatUzun(t.gecerlilik)}
            className={cn(
              'tabular-nums',
              doldu && 'font-medium text-red-600 dark:text-red-400',
              yakin && 'font-medium text-amber-700 dark:text-amber-400',
              !doldu && !yakin && 'text-muted-foreground',
            )}
          >
            {etiket}
          </span>
        )
      },
    },
    { baslik: 'Durum', hucre: (t) => <Pill tone={TON[t.durum]}>{t.durum}</Pill> },
    {
      baslik: 'İşlemler',
      sinif: 'text-right',
      hucre: (t) => <TeklifIslemleri teklif={t} onSil={sil} />,
    },
  ]

  /** Seçili tekliflerin durumunu toplu değiştirir; her kayda hareket notu düşer. */
  const topluDurum = (ids: string[], durum: TeklifDurum) => {
    let sayi = 0
    ids.forEach((id) => {
      const t = teklifler.find((x) => x.id === id)
      if (!t || t.durum === durum) return
      guncelle(id, {
        durum,
        gecmis: [{ tarih: new Date().toISOString(), olay: `Durum: ${durum}` }, ...(t.gecmis ?? [])],
      })
      sayi++
    })
    toast.success(sayi ? `${sayi} teklif “${durum}” olarak güncellendi` : 'Seçili tekliflerde değişiklik yok')
  }

  return (
    <ModulListesi<Teklif>
      baslik="Teklif"
      aciklama="Firmalara verilen tarama teklifleri ve onay durumları."
      ikon={ReceiptTextIcon}
      kayitAdi="teklif"
      yeniEtiket="Yeni teklif"
      yeniHref="/panel/teklifler/yeni"
      ilkArama={params.get('q') ?? firmaParam}
      satirHref={(t) => `/panel/teklifler/${t.id}`}
      topluEylemler={[
        { etiket: 'Gönderildi yap', onUygula: (ids) => topluDurum(ids, 'Gönderildi') },
        { etiket: 'Onaylandı yap', onUygula: (ids) => topluDurum(ids, 'Onaylandı') },
        { etiket: 'Reddedildi yap', onUygula: (ids) => topluDurum(ids, 'Reddedildi') },
      ]}
      kayitlar={teklifler}
      alanlar={alanlar}
      kolonlar={kolonlar}
      aramaMetni={(t) => `${t.no} ${t.firma} ${t.hizmet} ${t.durum}`}
      durum={{ alan: 'durum', secenekler: TEKLIF_DURUMLARI }}
      istatistik={(liste) => {
        const onaylanan = liste.filter((t) => t.durum === 'Onaylandı')
        const gonderilen = liste.filter((t) => t.durum === 'Gönderildi' || t.durum === 'Onaylandı' || t.durum === 'Reddedildi')
        const oran = gonderilen.length ? Math.round((onaylanan.length / gonderilen.length) * 100) : 0
        return [
          { label: 'Toplam teklif', deger: liste.length },
          { label: 'Onay bekleyen', deger: liste.filter((t) => t.durum === 'Gönderildi').length },
          { label: 'Onaylanan', deger: onaylanan.length, iyi: true },
          { label: 'Onaylanan tutar', deger: tl(onaylanan.reduce((t, x) => t + teklifKdvDahil(x), 0)) },
          { label: 'Onay oranı (gönderilenlerde)', deger: `%${oran}` },
        ]
      }}
      yeniVarsayilan={() => ({
        no: `TKL-2026-${String(teklifler.length + 1).padStart(3, '0')}`,
        firma: firmaSecenekleri[0] ?? '',
        hizmet: HIZMET_TURLERI[0],
        kisiSayisi: 1,
        birimFiyat: 0,
        tarih: BUGUN,
        gecerlilik: BUGUN,
        durum: 'Taslak',
      })}
      onEkle={() => undefined}
      onGuncelle={guncelle}
      onSil={sil}
    />
  )
}
