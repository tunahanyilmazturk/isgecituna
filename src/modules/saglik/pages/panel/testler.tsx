import { FlaskConicalIcon } from 'lucide-react'
import { ModulListesi, type FormAlan, type Kolon } from '@saglik/components/modul/modul-listesi'
import { Pill, type PillTone } from '@saglik/components/pill'
import { useTestStore } from '@saglik/stores/saglik-stores'
import { TEST_KATEGORILERI, type Test } from '@saglik/data/saglik'

const DURUMLAR = ['Aktif', 'Pasif'] as const

/** Kategori renkleri: her grup kendi tonuyla ayrışır */
const KATEGORI_TON: Record<(typeof TEST_KATEGORILERI)[number], PillTone> = {
  Laboratuvar: 'violet',
  Ölçüm: 'green',
  Solunum: 'violet',
  İşitme: 'amber',
  Göz: 'orange',
  'Fizik muayene': 'zinc',
  Görüntüleme: 'red',
}

const tl = (n: number) => `${n.toLocaleString('tr-TR')} ₺`

export default function TestlerPage() {
  const testler = useTestStore((s) => s.kayitlar)
  const ekle = useTestStore((s) => s.ekle)
  const guncelle = useTestStore((s) => s.guncelle)
  const sil = useTestStore((s) => s.sil)

  const alanlar: FormAlan<Test>[] = [
    { key: 'ad', label: 'Test adı', tip: 'metin', zorunlu: true, genis: true },
    { key: 'kategori', label: 'Kategori', tip: 'secim', secenekler: TEST_KATEGORILERI, zorunlu: true },
    { key: 'durum', label: 'Durum', tip: 'secim', secenekler: DURUMLAR },
    { key: 'fiyat', label: 'Fiyat (₺)', tip: 'sayi', zorunlu: true },
    { key: 'birim', label: 'Birim', tip: 'metin', placeholder: 'mg/dL, mmHg …' },
    { key: 'referans', label: 'Referans aralığı', tip: 'metin', genis: true },
  ]

  const kolonlar: Kolon<Test>[] = [
    {
      baslik: 'Test',
      hucre: (t) => (
        <div className="min-w-0">
          <p className="font-medium">{t.ad}</p>
          {t.birim && t.birim !== '—' && <p className="text-xs text-muted-foreground">Birim: {t.birim}</p>}
        </div>
      ),
      sinif: 'min-w-56',
    },
    { baslik: 'Kategori', hucre: (t) => <Pill tone={KATEGORI_TON[t.kategori as keyof typeof KATEGORI_TON] ?? 'zinc'}>{t.kategori}</Pill> },
    { baslik: 'Referans', hucre: (t) => <span className="tabular-nums">{t.referans}</span> },
    {
      baslik: 'Fiyat',
      hucre: (t) => <span className="font-medium tabular-nums">{tl(t.fiyat)}</span>,
      sinif: 'text-right',
    },
    {
      baslik: 'Durum',
      hucre: (t) => <Pill tone={t.durum === 'Aktif' ? 'green' : 'zinc'}>{t.durum}</Pill>,
    },
  ]

  return (
    <ModulListesi<Test>
      baslik="Testler"
      aciklama="Taramalarda uygulanan tetkik ve ölçümler, referans aralıkları ve fiyatları."
      ikon={FlaskConicalIcon}
      kayitAdi="test"
      yeniEtiket="Yeni test"
      kayitlar={testler}
      alanlar={alanlar}
      kolonlar={kolonlar}
      aramaMetni={(t) => `${t.ad} ${t.kategori} ${t.referans} ${t.birim}`}
      durum={{ alan: 'durum', secenekler: DURUMLAR }}
      ekFiltreler={[{ alan: 'kategori', etiket: 'Kategori', secenekler: TEST_KATEGORILERI }]}
      istatistik={(liste) => {
        const aktif = liste.filter((t) => t.durum === 'Aktif')
        const ortFiyat = aktif.length ? Math.round(aktif.reduce((t, x) => t + x.fiyat, 0) / aktif.length) : 0
        const enPahali = aktif.reduce<Test | null>((m, x) => (!m || x.fiyat > m.fiyat ? x : m), null)
        return [
          { label: 'Toplam test', deger: liste.length },
          { label: 'Aktif', deger: aktif.length, iyi: true },
          { label: 'Pasif', deger: liste.length - aktif.length, iyi: false },
          { label: 'Kategori', deger: new Set(liste.map((t) => t.kategori)).size },
          { label: 'Ort. fiyat', deger: tl(ortFiyat) },
          { label: 'En pahalı', deger: enPahali ? tl(enPahali.fiyat) : '—' },
        ]
      }}
      yeniVarsayilan={() => ({
        ad: '',
        kategori: TEST_KATEGORILERI[0],
        birim: '',
        referans: '',
        fiyat: 0,
        durum: 'Aktif',
      })}
      onEkle={ekle}
      onGuncelle={guncelle}
      onSil={sil}
    />
  )
}
