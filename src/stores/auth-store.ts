import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@/lib/guvenli-depo'
import { DEMO_SIFRE_OZETI } from '@/data/sifre-seed'
import { sifreDogrula, sifreHashle, sifreYukseltilmeli } from '@/lib/sifre'
import { useEkipStore } from '@/stores/ekip-store'

export interface User {
  username: string
  name: string
  initials: string
  unvan: string
  eposta: string
  telefon: string
  /** Demo oturumu — çıkışta sıfırlanmaz, yalnızca rozetle belirtilir */
  demo?: boolean
}

/** Demo yönetici hesabı — şifre yalnızca özet olarak tutulur (bkz. data/sifre-seed.ts) */
const DEMO_USER = {
  username: 'yilmazturk',
  sifreHash: DEMO_SIFRE_OZETI,
  name: 'Tunahan Yılmaztürk',
  unvan: 'Operasyon Müdürü',
  eposta: 'tunahan@vegaosgb.com.tr',
  telefon: '+90 532 100 10 01',
}

const toInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const kullanici = (ad: string, unvan: string, eposta: string, telefon: string, username: string, demo?: boolean): User => ({
  username,
  name: ad,
  initials: toInitials(ad),
  unvan,
  eposta,
  telefon,
  demo,
})

interface AuthState {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  /** Demo oturumu — demo hesabın şifresi yoktur; yalnızca bu yol açabilir. */
  demoLogin: () => boolean
  logout: () => void
  updateUser: (patch: Partial<Omit<User, 'initials'>>) => void
}

/** Kullanıcı adı + şifre eşleşen aktif hesabı bulur (demo yönetici veya ekip hesabı). */
const hesapBul = async (username: string, password: string): Promise<User | null> => {
  if (username === DEMO_USER.username && (await sifreDogrula(password, DEMO_USER.sifreHash))) {
    return kullanici(DEMO_USER.name, DEMO_USER.unvan, DEMO_USER.eposta, DEMO_USER.telefon, DEMO_USER.username)
  }
  const adaylar = useEkipStore.getState().hesaplar.filter((h) => h.kullaniciAdi === username && h.durum === 'Aktif')
  for (const aday of adaylar) {
    if (aday.sifreHash && (await sifreDogrula(password, aday.sifreHash))) {
      const uye = useEkipStore.getState().uyeler.find((u) => u.id === aday.personelId)
      const ad = uye ? `${uye.ad} ${uye.soyad}` : (aday.ad ?? aday.kullaniciAdi)
      return kullanici(ad, aday.rol, aday.eposta, uye?.telefon ?? '', aday.kullaniciAdi)
    }
  }
  return null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (username, password) => {
        const u = await hesapBul(username, password)
        if (!u) return false
        set({ user: u })
        // Eski özet biçimi başarılı girişte PBKDF2'ye yükseltilir
        const hesap = useEkipStore.getState().hesaplar.find((h) => h.kullaniciAdi === username)
        if (hesap && sifreYukseltilmeli(hesap.sifreHash)) {
          useEkipStore.getState().hesapGuncelleById(hesap.id, { sifreHash: await sifreHashle(password) })
        }
        useEkipStore.getState().hesapGuncelleById(hesap?.id ?? '', { sonGiris: new Date().toISOString() })
        return true
      },
      demoLogin: () => {
        set({
          user: kullanici(DEMO_USER.name, DEMO_USER.unvan, DEMO_USER.eposta, DEMO_USER.telefon, DEMO_USER.username, true),
        })
        return true
      },
      logout: () => set({ user: null }),
      updateUser: (patch) =>
        set((s) => {
          if (!s.user) return s
          const next = { ...s.user, ...patch }
          return { user: { ...next, initials: toInitials(next.name) } }
        }),
    }),
    {
      name: 'osgbhub-auth',
      storage: guvenliDepo,
      partialize: (s) => ({ user: s.user }),
    },
  ),
)
