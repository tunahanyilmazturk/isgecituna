import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@saglik/lib/guvenli-depo'

/** Sihirbazda yarım kalan teklifin taslağı (tek bir taslak tutulur). */
export interface TeklifTaslagi {
  savedAt: string
  veri: Record<string, unknown>
}

interface TaslakState {
  taslak: TeklifTaslagi | null
  kaydet: (veri: Record<string, unknown>) => void
  temizle: () => void
}

export const useTeklifTaslakStore = create<TaslakState>()(
  persist(
    (set) => ({
      taslak: null,
      kaydet: (veri) => set({ taslak: { savedAt: new Date().toISOString(), veri } }),
      temizle: () => set({ taslak: null }),
    }),
    { name: 'osgbhub-teklif-taslak', storage: guvenliDepo, version: 1 },
  ),
)
