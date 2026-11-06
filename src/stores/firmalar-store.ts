import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@/lib/guvenli-depo'
import { BUGUN, firmalarSeed } from '@/data/firmalar'
import { katipSeed } from '@/data/isgkatip'
import type { Firma, FirmaDurum } from '@/data/firmalar'
import type { KatipDurum, KatipKayit } from '@/data/isgkatip'
import { useOlaylarStore } from '@/stores/olaylar-store'


/** Mevcut kayıtlardaki en büyük sayının bir fazlası — yeniden yüklemeden sonra da çakışmaz */
const sonrakiNo = (kodlar: string[]): number =>
  Math.max(0, ...kodlar.map((k) => Number(k.replace(/\D/g, '')) || 0)) + 1

interface FirmalarState {
  firmalar: Firma[]
  katip: KatipKayit[]

  firmaEkle: (f: Omit<Firma, 'id' | 'kod' | 'islemGecmisi'>) => Firma
  firmaGuncelle: (id: string, patch: Partial<Firma>, islemNot?: string) => void
  firmaDurumAyarla: (id: string, durum: FirmaDurum, not?: string) => void

  katipEkle: (
    k: Omit<KatipKayit, 'id' | 'zamanCizgisi'>,
    ilkIslem?: string,
  ) => KatipKayit
  katipGuncelle: (id: string, patch: Partial<KatipKayit>, islemNot?: string) => void
  katipDurumGuncelle: (id: string, durum: KatipDurum, not?: string) => void
}

export const useFirmalarStore = create<FirmalarState>()(
persist(
  (set, get) => ({
    firmalar: firmalarSeed,
    katip: katipSeed,

    firmaEkle: (f) => {
      const no = sonrakiNo(get().firmalar.map((x) => x.id))
      const kodNo = sonrakiNo(get().firmalar.map((x) => x.kod))
      const yeni: Firma = {
        ...f,
        id: `FR-${String(no).padStart(2, '0')}`,
        kod: `FR-${String(kodNo).padStart(3, '0')}`,
        islemGecmisi: [{ tarih: BUGUN, islem: 'Firma kaydı oluşturuldu' }],
      }
      set((s) => ({ firmalar: [yeni, ...s.firmalar] }))
      return yeni
    },

    firmaGuncelle: (id, patch, islemNot) => {
      const eski = get().firmalar.find((f) => f.id === id)
      if (!eski) return
      set((s) => ({
        firmalar: s.firmalar.map((f) =>
          f.id === id
            ? {
                ...f,
                ...patch,
                islemGecmisi: [
                  ...f.islemGecmisi,
                  { tarih: BUGUN, islem: 'Firma bilgileri güncellendi', not: islemNot },
                ],
              }
            : f,
        ),
      }))
      // Unvan değiştiyse bağlı kayıtlarda güncel unvan görünsün (tek veri merkezi)
      if (patch.unvan && patch.unvan !== eski.unvan) {
        useOlaylarStore.setState((s) => ({
          olaylar: s.olaylar.map((o) =>
            o.firma === eski.unvan ? { ...o, firma: patch.unvan! } : o,
          ),
        }))
      }
    },

    firmaDurumAyarla: (id, durum, not) =>
      set((s) => ({
        firmalar: s.firmalar.map((f) =>
          f.id === id
            ? {
                ...f,
                durum,
                islemGecmisi: [
                  ...f.islemGecmisi,
                  {
                    tarih: BUGUN,
                    islem: durum === 'Pasif' ? 'Firma pasife alındı' : 'Firma aktifleştirildi',
                    not,
                  },
                ],
              }
            : f,
        ),
      })),

    katipEkle: (k, ilkIslem) => {
      const yeni: KatipKayit = {
        ...k,
        id: `KT-2026-${String(Math.max(99, ...get().katip.map((k) => Number(k.id.split('-').pop()) || 0)) + 1).padStart(3, '0')}`,
        zamanCizgisi: [{ tarih: BUGUN, islem: ilkIslem ?? 'Kayıt oluşturuldu' }],
      }
      set((s) => ({ katip: [yeni, ...s.katip] }))
      return yeni
    },

    katipGuncelle: (id, patch, islemNot) =>
      set((s) => ({
        katip: s.katip.map((k) =>
          k.id === id
            ? {
                ...k,
                ...patch,
                zamanCizgisi: [
                  ...k.zamanCizgisi,
                  { tarih: BUGUN, islem: islemNot ?? 'Kayıt güncellendi' },
                ],
              }
            : k,
        ),
      })),

    katipDurumGuncelle: (id, durum, not) =>
      set((s) => ({
        katip: s.katip.map((k) =>
          k.id === id
            ? {
                ...k,
                durum,
                zamanCizgisi: [...k.zamanCizgisi, { tarih: BUGUN, islem: `Durum: ${durum}`, not }],
              }
            : k,
        ),
      })),
  }),
{
  name: 'isghub-firmalar',
  storage: guvenliDepo,
  partialize: (s) => ({ firmalar: s.firmalar, katip: s.katip }),
},
),
)
