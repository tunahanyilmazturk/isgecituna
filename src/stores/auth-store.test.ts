import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth-store'
import { useEkipStore } from './ekip-store'

/** Eski FNV-1a özeti — eski kayıt yükseltmesini sınamak için. */
const eskiFnv = (s: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `fnv1a$${(h >>> 0).toString(16)}`
}

describe('auth-store.login', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null })
  })

  it('yanlış şifreyle oturum açmaz', async () => {
    expect(await useAuthStore.getState().login('akaya', 'yanlis-sifre')).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('bilinmeyen kullanıcı adıyla oturum açmaz', async () => {
    expect(await useAuthStore.getState().login('yok-boyle-biri', 'isg2026')).toBe(false)
  })

  it('doğru şifreyle ekip hesabına giriş yapar', async () => {
    expect(await useAuthStore.getState().login('akaya', 'isg2026')).toBe(true)
    expect(useAuthStore.getState().user?.username).toBe('akaya')
  })

  it('eski FNV-1a kaydını başarılı girişte PBKDF2 biçimine yükseltir', async () => {
    useEkipStore.setState((s) => ({
      hesaplar: s.hesaplar.map((h) => (h.kullaniciAdi === 'akaya' ? { ...h, sifreHash: eskiFnv('isg2026') } : h)),
    }))
    expect(await useAuthStore.getState().login('akaya', 'isg2026')).toBe(true)
    const kayit = useEkipStore.getState().hesaplar.find((h) => h.kullaniciAdi === 'akaya')
    expect(kayit?.sifreHash?.startsWith('pbkdf2-sha256$')).toBe(true)
    // Yükseltilmiş kayıt ile giriş hâlâ çalışır
    useAuthStore.setState({ user: null })
    expect(await useAuthStore.getState().login('akaya', 'isg2026')).toBe(true)
  })
})
