import { Link } from 'react-router'
import { Building2Icon } from 'lucide-react'
import { ModulListesi, type FormAlan, type Kolon } from '@/components/modul/modul-listesi'
import { Pill } from '@/components/pill'
import { FIRMA_ILLERI, type Firma, type FirmaDurum } from '@/data/firmalar'
import { useFirmaStore, usePersonelKayitStore, useTaramaStore, useTeklifStore } from '@/stores/saglik-stores'

const DURUMLAR: FirmaDurum[] = ['Aktif', 'Pasif']

export default function FirmalarPage() {
  const firmalar = useFirmaStore((s) => s.kayitlar)
  const ekle = useFirmaStore((s) => s.ekle)
  const guncelle = useFirmaStore((s) => s.guncelle)
  const sil = useFirmaStore((s) => s.sil)
  const personeller = usePersonelKayitStore((s) => s.kayitlar)
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const teklifler = useTeklifStore((s) => s.kayitlar)

  const alanlar: FormAlan<Firma>[] = [
    { key: 'unvan', label: 'Ticari unvan', tip: 'metin', zorunlu: true, genis: true },
    { key: 'kisaAd', label: 'Kısa ad', tip: 'metin' },
    { key: 'il', label: 'İl', tip: 'secim', secenekler: FIRMA_ILLERI },
    { key: 'vergiDairesi', label: 'Vergi dairesi', tip: 'metin' },
    { key: 'vergiNo', label: 'Vergi no', tip: 'metin' },
    { key: 'yetkili', label: 'Yetkili kişi', tip: 'metin' },
    { key: 'telefon', label: 'Telefon', tip: 'metin' },
    { key: 'eposta', label: 'E-posta', tip: 'metin' },
    { key: 'adres', label: 'Adres', tip: 'uzun', genis: true },
    { key: 'durum', label: 'Durum', tip: 'secim', secenekler: DURUMLAR },
  ]

  const kolonlar: Kolon<Firma>[] = [
    {
      baslik: 'Firma',
      sinif: 'min-w-64',
      hucre: (f) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400">
            <Building2Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <Link
              to={`/panel/firmalar/${f.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate font-medium hover:underline"
            >
              {f.unvan}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{f.kisaAd}</p>
          </div>
        </div>
      ),
    },
    { baslik: 'İl', hucre: (f) => f.il, siralama: (f) => f.il },
    {
      baslik: 'Yetkili',
      hucre: (f) => (
        <div className="min-w-0">
          <p className="truncate">{f.yetkili}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{f.telefon}</p>
        </div>
      ),
    },
    {
      baslik: 'Çalışan',
      sinif: 'text-right',
      hucre: (f) => <span className="tabular-nums">{personeller.filter((p) => p.firma === f.unvan).length}</span>,
    },
    {
      baslik: 'Tarama / teklif',
      sinif: 'text-right',
      hucre: (f) => (
        <span className="tabular-nums text-muted-foreground">
          {taramalar.filter((t) => t.firma === f.unvan).length} / {teklifler.filter((t) => t.firma === f.unvan).length}
        </span>
      ),
    },
    { baslik: 'Durum', hucre: (f) => <Pill tone={f.durum === 'Aktif' ? 'green' : 'zinc'}>{f.durum}</Pill>, siralama: (f) => f.durum },
  ]

  return (
    <ModulListesi<Firma>
      baslik="Firmalar"
      aciklama="Tarama hizmeti verilen kurumlar, yetkili kişiler ve çalışan sayıları."
      ikon={Building2Icon}
      kayitAdi="firma"
      yeniEtiket="Yeni firma"
      kayitlar={firmalar}
      alanlar={alanlar}
      kolonlar={kolonlar}
      aramaMetni={(f) => `${f.unvan} ${f.kisaAd} ${f.il} ${f.yetkili} ${f.vergiNo}`}
      durum={{ alan: 'durum', secenekler: DURUMLAR }}
      ekFiltreler={[{ alan: 'il', etiket: 'İl', secenekler: FIRMA_ILLERI }]}
      istatistik={(liste) => {
        const aktif = liste.filter((f) => f.durum === 'Aktif').length
        return [
          { label: 'Toplam firma', deger: liste.length },
          { label: 'Aktif', deger: aktif, iyi: true },
          { label: 'Pasif', deger: liste.length - aktif },
          { label: 'Toplam çalışan', deger: personeller.length },
          { label: 'Tarama', deger: taramalar.length },
          { label: 'Teklif', deger: teklifler.length },
        ]
      }}
      yeniVarsayilan={() => ({
        unvan: '',
        kisaAd: '',
        vergiDairesi: '',
        vergiNo: '',
        il: FIRMA_ILLERI[0],
        adres: '',
        yetkili: '',
        telefon: '',
        eposta: '',
        durum: 'Aktif',
      })}
      onEkle={ekle}
      onGuncelle={guncelle}
      onSil={sil}
    />
  )
}
