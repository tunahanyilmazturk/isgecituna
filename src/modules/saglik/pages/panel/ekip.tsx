import { UserRoundIcon } from 'lucide-react'
import { ModulListesi, type FormAlan, type Kolon } from '@saglik/components/modul/modul-listesi'
import { Avatar } from '@saglik/components/ekip/badges'
import { Pill } from '@saglik/components/pill'
import {
  CALISMA_TIPLERI,
  GOREV_TURLERI,
  PERSONEL_DURUMLARI,
  adSoyad,
  gorevTone,
  hesapDurumTone,
  personelDurumTone,
  type EkipUye,
  type HesapDurum,
  type PersonelDurum,
} from '@saglik/data/ekip'
import { useEkipStore } from '@saglik/stores/ekip-store'

const CINSIYET = ['Kadın', 'Erkek'] as const

export default function EkipPage() {
  const uyeler = useEkipStore((s) => s.uyeler)
  const hesaplar = useEkipStore((s) => s.hesaplar)
  const ekle = useEkipStore((s) => s.uyeEkle)
  const guncelle = useEkipStore((s) => s.uyeGuncelle)
  const sil = useEkipStore((s) => s.uyeSil)

  const hesapDurumu = (uyeId: string): HesapDurum | 'Hesap Yok' =>
    hesaplar.find((h) => h.personelId === uyeId)?.durum ?? 'Hesap Yok'

  const alanlar: FormAlan<EkipUye>[] = [
    { key: 'fotograf', label: 'Fotoğraf', tip: 'foto', genis: true },
    { key: 'unvanOnek', label: 'Unvan', tip: 'metin', placeholder: 'Dr., Uzm., Hemşire…' },
    { key: 'cinsiyet', label: 'Cinsiyet', tip: 'secim', secenekler: CINSIYET },
    { key: 'ad', label: 'Ad', tip: 'metin', zorunlu: true },
    { key: 'soyad', label: 'Soyad', tip: 'metin', zorunlu: true },
    { key: 'gorev', label: 'Görev', tip: 'secim', secenekler: GOREV_TURLERI, zorunlu: true },
    { key: 'departman', label: 'Departman', tip: 'metin' },
    { key: 'telefon', label: 'Telefon', tip: 'metin', zorunlu: true },
    { key: 'eposta', label: 'E-posta', tip: 'metin', zorunlu: true },
    { key: 'tc', label: 'TC kimlik no (maskeli)', tip: 'metin', placeholder: '***-***-**00' },
    { key: 'dogumTarihi', label: 'Doğum tarihi', tip: 'tarih' },
    { key: 'meslekiKayitNo', label: 'Meslekî kayıt no', tip: 'metin' },
    { key: 'iseGiris', label: 'İşe giriş', tip: 'tarih', zorunlu: true },
    { key: 'calismaTipi', label: 'Çalışma tipi', tip: 'secim', secenekler: CALISMA_TIPLERI },
    { key: 'durum', label: 'Durum', tip: 'secim', secenekler: PERSONEL_DURUMLARI },
    { key: 'adres', label: 'Adres', tip: 'uzun', genis: true },
    { key: 'aciklama', label: 'Açıklama', tip: 'uzun', genis: true },
  ]

  const kolonlar: Kolon<EkipUye>[] = [
    {
      baslik: 'Ekip üyesi',
      sinif: 'min-w-60',
      hucre: (u) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar uye={u} boyut="md" />
          <div className="min-w-0">
            <p className="truncate font-medium">{adSoyad(u)}</p>
            <p className="truncate text-xs text-muted-foreground">{u.eposta}</p>
          </div>
        </div>
      ),
    },
    { baslik: 'Görev', hucre: (u) => <Pill tone={gorevTone[u.gorev]}>{u.gorev}</Pill> },
    { baslik: 'Telefon', hucre: (u) => <span className="tabular-nums">{u.telefon}</span> },
    { baslik: 'Kayıt no', hucre: (u) => <span className="tabular-nums text-muted-foreground">{u.meslekiKayitNo ?? '—'}</span> },
    {
      baslik: 'Kullanıcı hesabı',
      hucre: (u) => {
        const d = hesapDurumu(u.id)
        return <Pill tone={hesapDurumTone[d]}>{d === 'Hesap Yok' ? 'Hesap yok' : d}</Pill>
      },
    },
    { baslik: 'Durum', hucre: (u) => <Pill tone={personelDurumTone[u.durum as PersonelDurum]}>{u.durum}</Pill> },
  ]

  return (
    <ModulListesi<EkipUye>
      baslik="Ekip"
      aciklama="Tarama ekibindeki hekim, hemşire, teknisyen ve yönetim kadrosu."
      ikon={UserRoundIcon}
      kayitAdi="ekip üyesi"
      yeniEtiket="Yeni üye"
      kayitlar={uyeler}
      alanlar={alanlar}
      kolonlar={kolonlar}
      aramaMetni={(u) => `${adSoyad(u)} ${u.gorev} ${u.telefon} ${u.eposta} ${u.departman ?? ''}`}
      durum={{ alan: 'durum', secenekler: PERSONEL_DURUMLARI }}
      istatistik={(liste) => {
        const aktif = liste.filter((u) => u.durum === 'Aktif').length
        const hekim = liste.filter((u) => u.gorev === 'İşyeri Hekimi').length
        const hesapli = liste.filter((u) => hesaplar.some((h) => h.personelId === u.id)).length
        return [
          { label: 'Toplam üye', deger: liste.length },
          { label: 'Aktif', deger: aktif, iyi: true },
          { label: 'Hekim', deger: hekim },
          { label: 'Hesabı olan', deger: hesapli },
          { label: 'İzinli / pasif', deger: liste.length - aktif },
        ]
      }}
      yeniVarsayilan={() => ({
        unvanOnek: '',
        cinsiyet: 'Kadın',
        fotograf: '',
        ad: '',
        soyad: '',
        gorev: 'Saha Sorumlusu',
        departman: '',
        telefon: '',
        eposta: '',
        tc: '',
        dogumTarihi: '',
        meslekiKayitNo: '',
        iseGiris: new Date().toISOString().slice(0, 10),
        calismaTipi: CALISMA_TIPLERI[0],
        durum: 'Aktif',
        adres: '',
        aciklama: '',
      })}
      onEkle={ekle}
      onGuncelle={guncelle}
      onSil={sil}
    />
  )
}
