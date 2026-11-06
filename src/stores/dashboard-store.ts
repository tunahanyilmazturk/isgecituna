/*
 * Dashboard kişiselleştirme + bildirim durumu — kullanıcıya özel widget
 * düzeni ve okundu işaretleri localStorage'da saklanır.
 * Üretimde: tercihler kullanıcı profili kaydında, okundu durumu bildirim
 * tablosunda sunucu tarafında tutulur.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const ANA_WIDGETLAR = [
  { id: 'kpi', ad: 'Genel durum göstergeleri' },
  { id: 'operasyon', ad: 'Günlük operasyon merkezi' },
  { id: 'trend', ad: 'Aylık işlem trendi' },
  { id: 'risk-analiz', ad: 'Risk analizi' },
  { id: 'egitim-analiz', ad: 'Eğitim analizi' },
  { id: 'firma-analiz', ad: 'Firma analizi' },
] as const

export const YAN_WIDGETLAR = [
  { id: 'bildirimler', ad: 'Bildirimler ve hatırlatmalar' },
  { id: 'aktiviteler', ad: 'Son aktiviteler' },
  { id: 'hizli', ad: 'Hızlı erişim' },
] as const

export type WidgetId = (typeof ANA_WIDGETLAR)[number]['id'] | (typeof YAN_WIDGETLAR)[number]['id']

interface DashboardState {
  /** Okunmuş bildirim anahtarları (türetilmiş bildirim kimlikleri) */
  okundu: string[]
  gizli: WidgetId[]
  anaSira: string[]
  yanSira: string[]
  bildirimOku: (id: string) => void
  tumunuOku: (ids: string[]) => void
  widgetGoster: (id: WidgetId, goster: boolean) => void
  widgetTasi: (grup: 'ana' | 'yan', id: string, yon: 1 | -1) => void
  varsayilan: () => void
}

const anaVarsayilan = () => ANA_WIDGETLAR.map((w) => w.id)
const yanVarsayilan = () => YAN_WIDGETLAR.map((w) => w.id)

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      okundu: [],
      gizli: [],
      anaSira: anaVarsayilan(),
      yanSira: yanVarsayilan(),

      bildirimOku: (id) => set((s) => ({ okundu: s.okundu.includes(id) ? s.okundu : [...s.okundu, id] })),
      tumunuOku: (ids) => set((s) => ({ okundu: [...new Set([...s.okundu, ...ids])] })),
      widgetGoster: (id, goster) =>
        set((s) => ({ gizli: goster ? s.gizli.filter((g) => g !== id) : [...new Set([...s.gizli, id])] })),
      widgetTasi: (grup, id, yon) =>
        set((s) => {
          const key = grup === 'ana' ? 'anaSira' : 'yanSira'
          const liste = [...s[key]]
          const i = liste.indexOf(id)
          const j = i + yon
          if (i < 0 || j < 0 || j >= liste.length) return s
          ;[liste[i], liste[j]] = [liste[j], liste[i]]
          return { ...s, [key]: liste }
        }),
      varsayilan: () => set({ gizli: [], anaSira: anaVarsayilan(), yanSira: yanVarsayilan() }),
    }),
    { name: 'isghub-dashboard', version: 1 },
  ),
)
