import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@/lib/guvenli-depo'

/**
 * Rol bazlı bildirimler. Hedef:
 * - 'osgb'            → İSG uzmanı / yönetim
 * - 'firma:<firmaId>' → firma yetkilileri
 * - 'katilimci:<pid>' → çalışan (katılımcı) hesabı
 *
 * Firma kaynaklı her işlem İSG uzmanına bildirilir; firma atama yapamaz.
 */
export type BildirimHedef = 'osgb' | `firma:${string}` | `katilimci:${string}`

export interface UygulamaBildirimi {
  id: string
  hedef: BildirimHedef
  tarih: string
  baslik: string
  detay: string
  ton: 'red' | 'amber' | 'emerald'
  to: string
  okundu: boolean
}

interface BildirimState {
  bildirimler: UygulamaBildirimi[]
  ekle: (b: Omit<UygulamaBildirimi, 'id' | 'tarih' | 'okundu'>) => void
  /** Bir hedefe ait tüm bildirimleri okundu işaretler */
  hedefiOkundu: (hedef: BildirimHedef) => void
}

const SINIR = 200
let seq = 0

export const useBildirimStore = create<BildirimState>()(
  persist(
    (set) => ({
      bildirimler: [],
      ekle: (b) =>
        set((s) => ({
          bildirimler: [
            { ...b, id: `BLD-${Date.now().toString(36)}${(seq++).toString(36)}`, tarih: new Date().toISOString(), okundu: false },
            ...s.bildirimler,
          ].slice(0, SINIR),
        })),
      hedefiOkundu: (hedef) =>
        set((s) => ({
          bildirimler: s.bildirimler.map((b) => (b.hedef === hedef && !b.okundu ? { ...b, okundu: true } : b)),
        })),
    }),
    { name: 'isghub-bildirim', storage: guvenliDepo },
  ),
)

/** Store dışından (olay yerinden) bildirim göndermek için kısayol */
export const bildirimGonder = (b: Omit<UygulamaBildirimi, 'id' | 'tarih' | 'okundu'>) =>
  useBildirimStore.getState().ekle(b)

export const hedefBildirimleri = (liste: UygulamaBildirimi[], hedef: BildirimHedef) =>
  liste.filter((b) => b.hedef === hedef)
