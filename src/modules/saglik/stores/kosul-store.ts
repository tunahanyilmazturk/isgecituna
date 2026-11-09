import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@saglik/lib/guvenli-depo'

/** Kullanıcının kaydettiği şartlar ve koşullar (teklifler arasında yeniden kullanılır). */
interface KosulState {
  kayitli: string[]
  ekle: (metin: string) => void
  sil: (metin: string) => void
}

export const useKosulStore = create<KosulState>()(
  persist(
    (set, get) => ({
      kayitli: [],
      ekle: (metin) => {
        const t = metin.trim()
        if (!t || get().kayitli.includes(t)) return
        set((s) => ({ kayitli: [...s.kayitli, t] }))
      },
      sil: (metin) => set((s) => ({ kayitli: s.kayitli.filter((x) => x !== metin) })),
    }),
    { name: 'osgbhub-kosullar', storage: guvenliDepo, version: 1 },
  ),
)
