import { WrenchIcon } from 'lucide-react'
import { ModulListesi, type FormAlan, type Kolon } from '@saglik/components/modul/modul-listesi'
import { Pill, type PillTone } from '@saglik/components/pill'
import { useEkipmanStore } from '@saglik/stores/saglik-stores'
import { BUGUN, EKIPMAN_DURUMLARI, EKIPMAN_TURLERI, gunEkle, type Ekipman, type EkipmanDurum } from '@saglik/data/saglik'
import { formatKisa, gunFarki } from '@saglik/lib/date'

const TON: Record<EkipmanDurum, PillTone> = {
  Hazır: 'green',
  Sahada: 'violet',
  Bakımda: 'amber',
  Arızalı: 'red',
}

/** Kalibrasyonu 30 gün içinde dolacak ya da dolmuş ekipman */
const kalibrasyonYakin = (e: Ekipman) => gunFarki(BUGUN, e.kalibrasyonBitis) <= 30

export default function EkipmanlarPage() {
  const ekipmanlar = useEkipmanStore((s) => s.kayitlar)
  const ekle = useEkipmanStore((s) => s.ekle)
  const guncelle = useEkipmanStore((s) => s.guncelle)
  const sil = useEkipmanStore((s) => s.sil)

  const alanlar: FormAlan<Ekipman>[] = [
    { key: 'ad', label: 'Ekipman adı', tip: 'metin', zorunlu: true, genis: true },
    { key: 'tur', label: 'Tür', tip: 'secim', secenekler: EKIPMAN_TURLERI, zorunlu: true },
    { key: 'durum', label: 'Durum', tip: 'secim', secenekler: EKIPMAN_DURUMLARI },
    { key: 'seriNo', label: 'Seri no', tip: 'metin', zorunlu: true },
    { key: 'konum', label: 'Konum', tip: 'metin' },
    { key: 'kalibrasyonBitis', label: 'Kalibrasyon bitiş', tip: 'tarih', zorunlu: true, genis: true },
  ]

  const kolonlar: Kolon<Ekipman>[] = [
    { baslik: 'Ekipman', hucre: (e) => <span className="font-medium">{e.ad}</span>, sinif: 'min-w-56' },
    { baslik: 'Tür', hucre: (e) => e.tur },
    { baslik: 'Seri no', hucre: (e) => <span className="tabular-nums text-muted-foreground">{e.seriNo}</span> },
    { baslik: 'Konum', hucre: (e) => e.konum },
    {
      baslik: 'Kalibrasyon',
      hucre: (e) => {
        const kalan = gunFarki(BUGUN, e.kalibrasyonBitis)
        return (
          <span className="flex items-center gap-2 tabular-nums">
            {formatKisa(e.kalibrasyonBitis)}
            {kalan < 0 ? (
              <Pill tone="red">Süresi doldu</Pill>
            ) : kalibrasyonYakin(e) ? (
              <Pill tone="orange">{kalan} gün</Pill>
            ) : null}
          </span>
        )
      },
    },
    { baslik: 'Durum', hucre: (e) => <Pill tone={TON[e.durum]}>{e.durum}</Pill> },
  ]

  return (
    <ModulListesi<Ekipman>
      baslik="Ekipmanlar"
      aciklama="Tarama cihazları, konumları ve kalibrasyon takibi."
      ikon={WrenchIcon}
      kayitAdi="ekipman"
      yeniEtiket="Yeni ekipman"
      kayitlar={ekipmanlar}
      alanlar={alanlar}
      kolonlar={kolonlar}
      aramaMetni={(e) => `${e.ad} ${e.tur} ${e.seriNo} ${e.konum}`}
      durum={{ alan: 'durum', secenekler: EKIPMAN_DURUMLARI }}
      istatistik={(liste) => [
        { label: 'Toplam ekipman', deger: liste.length },
        { label: 'Hazır', deger: liste.filter((e) => e.durum === 'Hazır').length, iyi: true },
        { label: 'Sahada', deger: liste.filter((e) => e.durum === 'Sahada').length },
        { label: 'Bakım / arıza', deger: liste.filter((e) => e.durum === 'Bakımda' || e.durum === 'Arızalı').length, iyi: false },
        { label: 'Kalibrasyonu yaklaşan', deger: liste.filter(kalibrasyonYakin).length, iyi: false },
      ]}
      yeniVarsayilan={() => ({
        ad: '',
        tur: EKIPMAN_TURLERI[0],
        seriNo: '',
        kalibrasyonBitis: gunEkle(365),
        durum: 'Hazır',
        konum: 'Merkez depo',
      })}
      onEkle={ekle}
      onGuncelle={guncelle}
      onSil={sil}
    />
  )
}
