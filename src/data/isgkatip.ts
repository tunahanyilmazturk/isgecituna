import type { PillTone } from '@/components/pill'
import type { OlayEk } from '@/data/olaylar'
import { TODAY } from '@/data/dashboard'

export type KatipDurum = 'Taslak' | 'Kontrol Bekliyor' | 'Aktif' | 'Süresi Dolmuş' | 'İptal Edildi'

export type GorevlendirmeTuru = 'Uzman' | 'Hekim' | 'DSP'

export interface ZamanOlayi {
  tarih: string
  islem: string
  not?: string
}

export interface KatipKayit {
  id: string
  firmaId: string
  uzman?: string
  uzmanSinifi?: 'A' | 'B' | 'C'
  hekim?: string
  dsp?: string
  gorevBaslangic: string
  gorevBitis: string
  sozlesmeNo: string
  sozlesmeTuru: string
  sozlesmeBaslangic: string
  sozlesmeBitis: string
  belgeler: OlayEk[]
  aciklama?: string
  durum: KatipDurum
  zamanCizgisi: ZamanOlayi[]
}

export const KATIP_DURUMLAR: KatipDurum[] = [
  'Taslak',
  'Kontrol Bekliyor',
  'Aktif',
  'Süresi Dolmuş',
  'İptal Edildi',
]

export const SOZLESME_TURLERI = [
  'OSGB Hizmet Sözleşmesi',
  'Uzman Görevlendirme Sözleşmesi',
  'Hekim Görevlendirme Sözleşmesi',
  'DSP Görevlendirme Sözleşmesi',
  'Danışmanlık Sözleşmesi',
]

export const UZMAN_SINIFLARI = ['A', 'B', 'C'] as const

export const UZMANLAR = ['Tunahan Yılmaztürk', 'Ayşe Kaya', 'Murat Özkan']
export const HEKIMLER = ['Dr. Selin Aydemir', 'Dr. Murat Özkan', 'Dr. Levent Kara']
export const DSPLER = ['Hemşire Kaan Ünal', 'ATT Pınar Doğan', 'Hemşire Seda Yücel']

export const katipDurumTone: Record<KatipDurum, PillTone> = {
  Taslak: 'zinc',
  'Kontrol Bekliyor': 'sky',
  Aktif: 'green',
  'Süresi Dolmuş': 'red',
  'İptal Edildi': 'zinc',
}

const gunFark = (bitis: string) =>
  Math.round(
    (new Date(`${bitis}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86400000,
  )

/** Sözleşme bitişine kalan gün: <0 süresi doldu, <=30 yaklaşıyor */
export const kalanGun = (bitis: string) => gunFark(bitis)

export const kalanGunMetin = (bitis: string) => {
  const k = gunFark(bitis)
  if (k < 0) return 'Süresi doldu'
  return `${k} gün kaldı`
}

export const kalanGunTone = (bitis: string): PillTone => {
  const k = gunFark(bitis)
  if (k < 0) return 'red'
  if (k <= 7) return 'red'
  if (k <= 30) return 'orange'
  return 'zinc'
}

/** Aktif olması gereken kayıtta uzman/hekim görevlendirme eksikliği */
export const eksikGorevlendirme = (k: KatipKayit): string[] => {
  const e: string[] = []
  if (k.durum === 'İptal Edildi' || k.durum === 'Taslak') return e
  if (!k.uzman) e.push('Uzman')
  if (!k.hekim) e.push('Hekim')
  return e
}

const z = (tarih: string, islem: string, not?: string): ZamanOlayi => ({ tarih, islem, not })

export const katipSeed: KatipKayit[] = [
  {
    id: 'KT-2025-014',
    firmaId: 'FR-01',
    uzman: 'Tunahan Yılmaztürk',
    uzmanSinifi: 'B',
    hekim: 'Dr. Selin Aydemir',
    dsp: 'Hemşire Kaan Ünal',
    gorevBaslangic: '2025-01-15',
    gorevBitis: '2027-01-14',
    sozlesmeNo: 'SZL-2025-014',
    sozlesmeTuru: 'OSGB Hizmet Sözleşmesi',
    sozlesmeBaslangic: '2025-01-15',
    sozlesmeBitis: '2027-01-14',
    belgeler: [{ ad: 'akdeniz-osgb-sozlesme.pdf', tur: 'Belge', boyut: '1,2 MB' }],
    durum: 'Aktif',
    zamanCizgisi: [
      z('2025-01-15', 'Sözleşme oluşturuldu', 'SZL-2025-014 yüklendi'),
      z('2025-02-03', 'Uzman görevlendirildi', 'Tunahan Yılmaztürk — B sınıfı'),
      z('2025-02-03', 'Hekim görevlendirildi', 'Dr. Selin Aydemir'),
      z('2025-06-20', 'DSP görevlendirildi', 'Hemşire Kaan Ünal'),
    ],
  },
  {
    id: 'KT-2025-089',
    firmaId: 'FR-02',
    uzman: 'Ayşe Kaya',
    uzmanSinifi: 'C',
    hekim: 'Dr. Selin Aydemir',
    dsp: '',
    gorevBaslangic: '2025-06-01',
    gorevBitis: '2026-11-30',
    sozlesmeNo: 'SZL-2025-089',
    sozlesmeTuru: 'OSGB Hizmet Sözleşmesi',
    sozlesmeBaslangic: '2025-06-01',
    sozlesmeBitis: '2026-11-30',
    belgeler: [{ ad: 'teknik-bakim-sozlesme.pdf', tur: 'Belge', boyut: '890 KB' }],
    aciklama: 'DSP görevlendirmesi Ekim 2026 sonunda kaldırıldı; düşük risk grubu değerlendirmesi yapıldı.',
    durum: 'Aktif',
    zamanCizgisi: [
      z('2025-06-01', 'Sözleşme oluşturuldu', 'SZL-2025-089 yüklendi'),
      z('2025-06-02', 'Uzman görevlendirildi', 'Ayşe Kaya — C sınıfı'),
      z('2025-06-02', 'Hekim görevlendirildi', 'Dr. Selin Aydemir'),
      z('2026-10-28', 'Görevlendirme güncellendi', 'DSP görevlendirmesi sonlandırıldı'),
    ],
  },
  {
    id: 'KT-2025-041',
    firmaId: 'FR-03',
    uzman: 'Tunahan Yılmaztürk',
    uzmanSinifi: 'B',
    hekim: '',
    dsp: '',
    gorevBaslangic: '2025-03-10',
    gorevBitis: '2026-11-18',
    sozlesmeNo: 'SZL-2025-041',
    sozlesmeTuru: 'Uzman Görevlendirme Sözleşmesi',
    sozlesmeBaslangic: '2025-03-10',
    sozlesmeBitis: '2026-11-18',
    belgeler: [],
    aciklama: 'Hekim görevlendirmesi Ağustos 2026\'da karşılıklı fesih ile sonlandırıldı — yenileme bekleniyor.',
    durum: 'Kontrol Bekliyor',
    zamanCizgisi: [
      z('2025-03-10', 'Sözleşme oluşturuldu', 'SZL-2025-041 yüklendi'),
      z('2025-03-11', 'Uzman görevlendirildi', 'Tunahan Yılmaztürk — B sınıfı'),
      z('2026-08-20', 'Görevlendirme güncellendi', 'Hekim sözleşmesi feshedildi'),
    ],
  },
  {
    id: 'KT-2025-112',
    firmaId: 'FR-05',
    uzman: 'Ayşe Kaya',
    uzmanSinifi: 'C',
    hekim: 'Dr. Murat Özkan',
    dsp: 'Hemşire Kaan Ünal',
    gorevBaslangic: '2025-09-01',
    gorevBitis: '2026-11-25',
    sozlesmeNo: 'SZL-2025-112',
    sozlesmeTuru: 'OSGB Hizmet Sözleşmesi',
    sozlesmeBaslangic: '2025-09-01',
    sozlesmeBitis: '2026-11-25',
    belgeler: [{ ad: 'nova-sozlesme-2025.pdf', tur: 'Belge', boyut: '1,4 MB' }],
    durum: 'Aktif',
    zamanCizgisi: [
      z('2025-09-01', 'Sözleşme oluşturuldu', 'SZL-2025-112 yüklendi'),
      z('2025-09-02', 'Uzman görevlendirildi', 'Ayşe Kaya — C sınıfı'),
      z('2025-09-02', 'Hekim görevlendirildi', 'Dr. Murat Özkan'),
      z('2026-10-15', 'Görevlendirme güncellendi', 'Hemşire Kaan Ünal DSP olarak atandı'),
    ],
  },
  {
    id: 'KT-2025-143',
    firmaId: 'FR-06',
    uzman: 'Tunahan Yılmaztürk',
    uzmanSinifi: 'B',
    hekim: '',
    dsp: '',
    gorevBaslangic: '2025-12-01',
    gorevBitis: '2026-12-01',
    sozlesmeNo: 'SZL-2025-143',
    sozlesmeTuru: 'Uzman Görevlendirme Sözleşmesi',
    sozlesmeBaslangic: '2025-12-01',
    sozlesmeBitis: '2026-12-01',
    belgeler: [],
    aciklama: 'Çok tehlikeli sınıfta hekim görevlendirmesi zorunlu — firma onayı bekleniyor.',
    durum: 'Kontrol Bekliyor',
    zamanCizgisi: [
      z('2025-12-01', 'Sözleşme oluşturuldu', 'SZL-2025-143 yüklendi'),
      z('2025-12-02', 'Uzman görevlendirildi', 'Tunahan Yılmaztürk — B sınıfı'),
      z('2026-10-02', 'Hekim görevlendirme talebi iletildi', 'Firma onayı bekleniyor'),
    ],
  },
  {
    id: 'KT-2025-007',
    firmaId: 'FR-04',
    uzman: 'Ayşe Kaya',
    uzmanSinifi: 'C',
    hekim: 'Dr. Levent Kara',
    dsp: '',
    gorevBaslangic: '2025-02-01',
    gorevBitis: '2026-05-31',
    sozlesmeNo: 'SZL-2025-007',
    sozlesmeTuru: 'Danışmanlık Sözleşmesi',
    sozlesmeBaslangic: '2025-02-01',
    sozlesmeBitis: '2026-05-31',
    belgeler: [{ ad: 'protemiz-danismanlik.pdf', tur: 'Belge', boyut: '640 KB' }],
    aciklama: 'Sözleşme süresi doldu, firma pasife alındı. Kayıt arşiv amaçlı korunuyor.',
    durum: 'Süresi Dolmuş',
    zamanCizgisi: [
      z('2025-02-01', 'Sözleşme oluşturuldu', 'SZL-2025-007 yüklendi'),
      z('2025-02-03', 'Uzman görevlendirildi', 'Ayşe Kaya — C sınıfı'),
      z('2025-02-03', 'Hekim görevlendirildi', 'Dr. Levent Kara'),
      z('2026-05-31', 'Sözleşme sonlandırıldı', 'Süre doldu'),
    ],
  },
  {
    id: 'KT-2026-098',
    firmaId: 'FR-07',
    uzman: 'Murat Özkan',
    uzmanSinifi: 'C',
    hekim: '',
    dsp: '',
    gorevBaslangic: '2026-10-15',
    gorevBitis: '2027-10-14',
    sozlesmeNo: 'SZL-2026-098',
    sozlesmeTuru: 'Danışmanlık Sözleşmesi',
    sozlesmeBaslangic: '2026-10-15',
    sozlesmeBitis: '2027-10-14',
    belgeler: [],
    aciklama: 'Firma zorunlu alan eksikleri tamamlanmadan aktif edilemez.',
    durum: 'Taslak',
    zamanCizgisi: [z('2026-10-15', 'Sözleşme taslağı oluşturuldu', 'SZL-2026-098')],
  },
]
