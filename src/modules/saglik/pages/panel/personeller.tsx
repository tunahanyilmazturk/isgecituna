import { FirmaBaglantisi } from '@saglik/components/firma-link'
import { useSearchParams } from 'react-router'
import { UsersIcon } from 'lucide-react'
import { ModulListesi, type FormAlan, type Kolon } from '@saglik/components/modul/modul-listesi'
import { Pill } from '@saglik/components/pill'
import { DEPARTMANLAR, type FirmaPersonel, type PersonelDurum } from '@saglik/data/personeller'
import { useFirmaStore, usePersonelKayitStore } from '@saglik/stores/saglik-stores'
import { formatKisa } from '@saglik/lib/date'

const DURUMLAR: PersonelDurum[] = ['Aktif', 'Pasif']
const CINSIYET = ['Kadın', 'Erkek'] as const

export default function PersonellerPage() {
  const [params] = useSearchParams()
  const firmaParam = params.get('firma') ?? ''
  const yeniAc = params.get('yeni') === '1'
  const personeller = usePersonelKayitStore((s) => s.kayitlar)
  const ekle = usePersonelKayitStore((s) => s.ekle)
  const guncelle = usePersonelKayitStore((s) => s.guncelle)
  const sil = usePersonelKayitStore((s) => s.sil)
  const firmalar = useFirmaStore((s) => s.kayitlar)

  const firmaAdlari = firmalar.map((f) => f.unvan)

  const alanlar: FormAlan<FirmaPersonel>[] = [
    { key: 'firma', label: 'Firma', tip: 'secim', secenekler: firmaAdlari, zorunlu: true, genis: true },
    { key: 'ad', label: 'Ad', tip: 'metin', zorunlu: true },
    { key: 'soyad', label: 'Soyad', tip: 'metin', zorunlu: true },
    { key: 'cinsiyet', label: 'Cinsiyet', tip: 'secim', secenekler: CINSIYET },
    { key: 'tc', label: 'TC kimlik no (maskeli)', tip: 'metin', placeholder: '***-***-**00' },
    { key: 'dogumTarihi', label: 'Doğum tarihi', tip: 'tarih' },
    { key: 'telefon', label: 'Telefon', tip: 'metin', zorunlu: true },
    { key: 'eposta', label: 'E-posta', tip: 'metin' },
    { key: 'departman', label: 'Departman', tip: 'secim', secenekler: DEPARTMANLAR },
    { key: 'pozisyon', label: 'Pozisyon', tip: 'metin' },
    { key: 'iseGiris', label: 'İşe giriş', tip: 'tarih', zorunlu: true },
    { key: 'durum', label: 'Durum', tip: 'secim', secenekler: DURUMLAR },
  ]

  const kolonlar: Kolon<FirmaPersonel>[] = [
    {
      baslik: 'Çalışan',
      sinif: 'min-w-56',
      hucre: (p) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">
            {`${p.ad[0] ?? ""}${p.soyad[0] ?? ""}`.toLocaleUpperCase("tr")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {p.ad} {p.soyad}
            </p>
            <p className="truncate text-xs text-muted-foreground">{p.pozisyon}</p>
          </div>
        </div>
      ),
    },
    { baslik: 'Firma', hucre: (p) => <FirmaBaglantisi unvan={p.firma} className="truncate" /> },
    { baslik: 'Departman', hucre: (p) => p.departman, siralama: (p) => p.departman },
    { baslik: 'Telefon', hucre: (p) => <span className="tabular-nums">{p.telefon}</span> },
    { baslik: 'İşe giriş', hucre: (p) => <span className="tabular-nums">{formatKisa(p.iseGiris)}</span>, siralama: (p) => p.iseGiris },
    { baslik: 'Durum', hucre: (p) => <Pill tone={p.durum === 'Aktif' ? 'green' : 'zinc'}>{p.durum}</Pill> },
  ]

  return (
    <ModulListesi<FirmaPersonel>
      baslik="Personeller"
      aciklama="Firmalarda taramaya tabi tutulacak çalışanlar."
      ikon={UsersIcon}
      kayitAdi="personel"
      yeniEtiket="Yeni personel"
      ilkArama={params.get('q') ?? firmaParam}
      ilkYeni={yeniAc ? { firma: firmaParam } : undefined}
      kayitlar={personeller}
      alanlar={alanlar}
      kolonlar={kolonlar}
      aramaMetni={(p) => `${p.ad} ${p.soyad} ${p.firma} ${p.departman} ${p.pozisyon} ${p.telefon}`}
      durum={{ alan: 'durum', secenekler: DURUMLAR }}
      ekFiltreler={[{ alan: 'firma', etiket: 'Firma', secenekler: firmaAdlari }]}
      istatistik={(liste) => {
        const aktif = liste.filter((p) => p.durum === 'Aktif').length
        return [
          { label: 'Toplam personel', deger: liste.length },
          { label: 'Aktif', deger: aktif, iyi: true },
          { label: 'Pasif', deger: liste.length - aktif },
          { label: 'Firma', deger: new Set(liste.map((p) => p.firma)).size },
          { label: 'Kadın', deger: liste.filter((p) => p.cinsiyet === 'Kadın').length },
          { label: 'Erkek', deger: liste.filter((p) => p.cinsiyet === 'Erkek').length },
        ]
      }}
      yeniVarsayilan={() => ({
        firma: firmaAdlari[0] ?? '',
        ad: '',
        soyad: '',
        cinsiyet: 'Kadın',
        tc: '',
        dogumTarihi: '',
        telefon: '',
        eposta: '',
        departman: DEPARTMANLAR[0],
        pozisyon: '',
        iseGiris: new Date().toISOString().slice(0, 10),
        durum: 'Aktif',
      })}
      onEkle={ekle}
      onGuncelle={guncelle}
      onSil={sil}
    />
  )
}
