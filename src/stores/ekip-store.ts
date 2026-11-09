import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@/lib/guvenli-depo'
import { ekipSeed, hesapSeed, type EkipUye, type HesapDurum, type KullaniciHesap, type PersonelDurum } from '@/data/ekip'
import type { KapsamHarita } from '@/data/permissions'

const sonrakiId = (liste: { id: string }[], onek: string) => {
  const max = liste.reduce((m, x) => Math.max(m, parseInt(x.id.split('-').pop() ?? '0', 10) || 0), 0)
  return `${onek}-${String(max + 1).padStart(2, '0')}`
}

const davetJetonu = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24)

interface EkipState {
  uyeler: EkipUye[]
  hesaplar: KullaniciHesap[]
  uyeEkle: (uye: Omit<EkipUye, 'id'>) => EkipUye
  uyeGuncelle: (id: string, patch: Partial<EkipUye>) => void
  uyeDurum: (id: string, durum: PersonelDurum) => void
  uyeSil: (id: string) => void
  hesapOlustur: (hesap: Omit<KullaniciHesap, 'id'>) => KullaniciHesap
  hesapGuncelle: (personelId: string, patch: Partial<KullaniciHesap>) => void
  hesapGuncelleById: (hesapId: string, patch: Partial<KullaniciHesap>) => void
  hesapDurumById: (hesapId: string, durum: HesapDurum) => void
  /** Yeni tek kullanımlık davet bağlantısı üretir ve jetonu döndürür */
  davetYenile: (hesapId: string) => string
  izinleriKaydet: (hesapId: string, izinler: string[]) => void
  kapsamKaydet: (hesapId: string, kapsam: KapsamHarita) => void
}

export const useEkipStore = create<EkipState>()(
  persist(
    (set, get) => ({
      uyeler: ekipSeed,
      hesaplar: hesapSeed,

      uyeEkle: (uye) => {
        const yeni: EkipUye = { ...uye, id: sonrakiId(get().uyeler, 'EKP-U') }
        set((s) => ({ uyeler: [...s.uyeler, yeni] }))
        return yeni
      },
      uyeGuncelle: (id, patch) =>
        set((s) => ({ uyeler: s.uyeler.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      uyeDurum: (id, durum) =>
        set((s) => ({ uyeler: s.uyeler.map((u) => (u.id === id ? { ...u, durum } : u)) })),

      uyeSil: (id) => set((s) => ({ uyeler: s.uyeler.filter((u) => u.id !== id) })),
      hesapOlustur: (hesap) => {
        const yeni: KullaniciHesap = { ...hesap, id: sonrakiId(get().hesaplar, 'USR') }
        set((s) => ({ hesaplar: [...s.hesaplar, yeni] }))
        return yeni
      },
      hesapGuncelle: (personelId, patch) =>
        set((s) => ({
          hesaplar: s.hesaplar.map((h) => (h.personelId === personelId ? { ...h, ...patch } : h)),
        })),
      hesapGuncelleById: (hesapId, patch) =>
        set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.id === hesapId ? { ...h, ...patch } : h)) })),
      hesapDurumById: (hesapId, durum) =>
        set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.id === hesapId ? { ...h, durum } : h)) })),

      davetYenile: (hesapId) => {
        const token = davetJetonu()
        const bitis = new Date(Date.now() + 7 * 86400000).toISOString()
        set((s) => ({
          hesaplar: s.hesaplar.map((h) =>
            h.id === hesapId
              ? { ...h, durum: 'Davet Bekliyor', davetToken: token, davetTarihi: new Date().toISOString(), davetBitis: bitis }
              : h,
          ),
        }))
        return token
      },

      izinleriKaydet: (hesapId, izinler) =>
        set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.id === hesapId ? { ...h, izinler } : h)) })),
      kapsamKaydet: (hesapId, kapsam) =>
        set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.id === hesapId ? { ...h, kapsam } : h)) })),
    }),
    { name: 'osgbhub-ekip-v2', storage: guvenliDepo, version: 1 },
  ),
)
