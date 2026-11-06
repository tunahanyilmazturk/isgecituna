/*
 * Firma evrakları — İSG uzmanının firmaya yüklediği belgeler.
 * Prototip: dosya içeriği data URL olarak localStorage'da tutulur (boyut sınırlı).
 * Üretimde: dosyalar nesne depolamada (S3 vb.) saklanmalı; yetkilendirme sunucuda
 * firma kapsamına göre yapılmalıdır.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const EVRAK_KATEGORILERI = [
  'İSG Sözleşmesi',
  'Risk Değerlendirme Raporu',
  'Acil Durum Planı',
  'Denetim Raporu',
  'Eğitim Belgesi',
  'Diğer',
] as const
export type EvrakKategori = (typeof EVRAK_KATEGORILERI)[number]

/** Tek dosya için üst sınır (bayt). */
export const EVRAK_MAX_BOYUT = 2 * 1024 * 1024
/** localStorage için toplam güvenli sınır (karakter; data URL metni kullanılır). */
const TOPLAM_SINIR = 3.5 * 1024 * 1024 * 1.37
export const EVRAK_KABUL = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png'

export interface Evrak {
  id: string
  firmaId: string
  ad: string
  kategori: EvrakKategori
  dosyaAdi: string
  mime: string
  boyut: number
  /** data URL — dosya içeriği */
  icerik: string
  yukleyen: string
  tarih: string
}

interface EvrakState {
  evraklar: Evrak[]
  ekle: (e: Omit<Evrak, 'id' | 'tarih'>) => void
  sil: (id: string) => void
}

export const useEvrakStore = create<EvrakState>()(
  persist(
    (set) => ({
      evraklar: [],
      ekle: (e) =>
        set((s) => ({
          evraklar: [{ ...e, id: `EV-${Date.now().toString(36)}`, tarih: new Date().toISOString() }, ...s.evraklar],
        })),
      sil: (id) => set((s) => ({ evraklar: s.evraklar.filter((x) => x.id !== id) })),
    }),
    { name: 'isghub-evraklar' },
  ),
)

/** Yeni dosya depoya sığar mı? (mevcut içerik + yeni dosya) */
export const depoSigarMi = (evraklar: Evrak[], yeniBoyut: number) => {
  const mevcut = evraklar.reduce((t, e) => t + e.icerik.length, 0)
  return mevcut + yeniBoyut * 1.37 <= TOPLAM_SINIR
}

export const dosyaOku = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const okuyucu = new FileReader()
    okuyucu.onload = () => resolve(String(okuyucu.result))
    okuyucu.onerror = () => reject(okuyucu.error)
    okuyucu.readAsDataURL(file)
  })

export const dosyaIndir = (e: Evrak) => {
  const a = document.createElement('a')
  a.href = e.icerik
  a.download = e.dosyaAdi
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Tarayıcıda doğrudan gösterilebilen türler (PDF ve görseller). */
export const onizlenebilir = (mime: string) => mime === 'application/pdf' || mime.startsWith('image/')

export const boyutMetni = (bayt: number) =>
  bayt >= 1024 * 1024 ? `${(bayt / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bayt / 1024))} KB`

export const uzanti = (dosyaAdi: string) => dosyaAdi.split('.').pop()?.toUpperCase() ?? ''
