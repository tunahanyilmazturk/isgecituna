import { create } from 'zustand'
import { BUGUN, olaylarSeed } from '@/data/olaylar'
import type { Olay, OlayAksiyon, OlayDurumu } from '@/data/olaylar'

let sayac = 200

interface OlaylarState {
  olaylar: Olay[]
  ekle: (o: Omit<Olay, 'id' | 'gecmis' | 'durum'>) => Olay
  guncelle: (id: string, patch: Partial<Olay>) => void
  durumGuncelle: (id: string, durum: OlayDurumu, not?: string) => void
  aksiyonEkle: (olayId: string, a: Omit<OlayAksiyon, 'id' | 'tamamlandi'>) => void
  aksiyonTamamla: (olayId: string, aksiyonId: string, not?: string) => void
  sil: (ids: string[]) => Olay[]
  geriYukle: (kayitlar: Olay[]) => void
}

export const useOlaylarStore = create<OlaylarState>((set, get) => ({
  olaylar: olaylarSeed,

  ekle: (o) => {
    const max = Math.max(...get().olaylar.map((x) => Number(x.id.slice(3))))
    const yeni: Olay = {
      ...o,
      id: `OL-${max + 1}`,
      durum: 'Yeni Bildirildi',
      gecmis: [{ durum: 'Yeni Bildirildi', tarih: BUGUN, not: 'Bildirim oluşturuldu' }],
    }
    set((s) => ({ olaylar: [yeni, ...s.olaylar] }))
    return yeni
  },

  guncelle: (id, patch) =>
    set((s) => ({ olaylar: s.olaylar.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),

  durumGuncelle: (id, durum, not) =>
    set((s) => ({
      olaylar: s.olaylar.map((o) =>
        o.id === id
          ? { ...o, durum, gecmis: [...o.gecmis, { durum, tarih: BUGUN, not }] }
          : o,
      ),
    })),

  aksiyonEkle: (olayId, a) =>
    set((s) => ({
      olaylar: s.olaylar.map((o) =>
        o.id === olayId
          ? {
              ...o,
              aksiyonlar: [
                ...o.aksiyonlar,
                { ...a, id: `AKS-${sayac++}`, tamamlandi: false },
              ],
            }
          : o,
      ),
    })),

  sil: (ids) => {
    const idSet = new Set(ids)
    const silinen = get().olaylar.filter((o) => idSet.has(o.id))
    set((s) => ({ olaylar: s.olaylar.filter((o) => !idSet.has(o.id)) }))
    return silinen
  },

  geriYukle: (kayitlar) =>
    set((s) => ({
      olaylar: [...s.olaylar, ...kayitlar].sort((a, b) => b.id.localeCompare(a.id)),
    })),

  aksiyonTamamla: (olayId, aksiyonId, not) =>
    set((s) => ({
      olaylar: s.olaylar.map((o) =>
        o.id === olayId
          ? {
              ...o,
              aksiyonlar: o.aksiyonlar.map((a) =>
                a.id === aksiyonId
                  ? { ...a, tamamlandi: true, tamamlanmaNotu: not ?? 'Tamamlandı' }
                  : a,
              ),
            }
          : o,
      ),
    })),
}))
