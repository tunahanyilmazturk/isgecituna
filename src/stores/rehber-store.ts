import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MODULLER, type Modul, type Rehber, type RehberDurum } from '@/data/rehber'

export const gorselAnahtar = (rehberId: string, adimIdx: number) => `${rehberId}#${adimIdx}`

interface RehberState {
  /** mevcut rehberlerin üzerine yazılan düzenleme anlık görüntüleri */
  duzenlemeler: Record<string, Rehber>
  /** modül bazında UI'dan eklenen yeni rehberler */
  ozelRehberler: Record<string, Rehber[]>
  /** rehberId → durum (tohum varsayılanı Yayında) */
  durumlar: Record<string, RehberDurum>
  /** rehberId#adimIdx → yüklenen görsel dataUrl */
  gorseller: Record<string, string>
  duzenle: (rehber: Rehber) => void
  ekle: (modulId: string, rehber: Rehber) => void
  durumAyarla: (rehberId: string, durum: RehberDurum) => void
  gorselKaydet: (rehberId: string, adimIdx: number, dataUrl: string) => void
  sifirla: (rehberId: string) => void
}

export const useRehberStore = create<RehberState>()(
  persist(
    (set) => ({
      duzenlemeler: {},
      ozelRehberler: {},
      durumlar: {},
      gorseller: {},
      duzenle: (rehber) =>
        set((s) => ({ duzenlemeler: { ...s.duzenlemeler, [rehber.id]: rehber } })),
      ekle: (modulId, rehber) =>
        set((s) => ({
          ozelRehberler: {
            ...s.ozelRehberler,
            [modulId]: [...(s.ozelRehberler[modulId] ?? []), rehber],
          },
        })),
      durumAyarla: (rehberId, durum) =>
        set((s) => ({ durumlar: { ...s.durumlar, [rehberId]: durum } })),
      gorselKaydet: (rehberId, adimIdx, dataUrl) =>
        set((s) => ({ gorseller: { ...s.gorseller, [gorselAnahtar(rehberId, adimIdx)]: dataUrl } })),
      sifirla: (rehberId) =>
        set((s) => {
          const duzenlemeler = { ...s.duzenlemeler }
          delete duzenlemeler[rehberId]
          return { duzenlemeler }
        }),
    }),
    { name: 'isghub-rehber' },
  ),
)

/* ------------------------- birleştirilmiş okuma -------------------------- */

export const rehberDurum = (
  durumlar: Record<string, RehberDurum>,
  rehberId: string,
): RehberDurum => durumlar[rehberId] ?? 'Yayında'

/** Modülün yayında görünür rehberleri — tohum + düzenleme + özel eklemeler */
export const modulRehberleri = (
  m: Modul,
  s: Pick<RehberState, 'duzenlemeler' | 'ozelRehberler' | 'durumlar'>,
): Rehber[] => {
  const birlesik = [...m.rehberler.map((r) => s.duzenlemeler[r.id] ?? r), ...(s.ozelRehberler[m.id] ?? [])]
  return birlesik.filter((r) => rehberDurum(s.durumlar, r.id) !== 'Arşiv')
}

export const rehberGetir = (
  modulId: string,
  rehberId: string,
  s: Pick<RehberState, 'duzenlemeler' | 'ozelRehberler'>,
): Rehber | undefined =>
  s.duzenlemeler[rehberId] ??
  MODULLER.find((m) => m.id === modulId)?.rehberler.find((r) => r.id === rehberId) ??
  s.ozelRehberler[modulId]?.find((r) => r.id === rehberId)

/** Tüm rehberler düz liste (yönetim ekranı) */
export const tumRehberler = (
  s: Pick<RehberState, 'duzenlemeler' | 'ozelRehberler'>,
): { modul: Modul; rehber: Rehber; ozel: boolean }[] =>
  MODULLER.flatMap((m) => [
    ...m.rehberler.map((r) => ({ modul: m, rehber: s.duzenlemeler[r.id] ?? r, ozel: false })),
    ...(s.ozelRehberler[m.id] ?? []).map((r) => ({ modul: m, rehber: r, ozel: true })),
  ])
