import { rolIzinleri, type KullaniciHesap } from '@/data/ekip'
import { useEkipStore } from '@/stores/ekip-store'

/**
 * Hesabın geçerli izin seti:
 * - 'Sistem Yöneticisi' rolünde ve açık izin seti yoksa → ['*'] (tümü)
 * - Açık `izinler` yazılmışsa → o liste (rol artık geçersiz)
 * - Yoksa rol şablonundan türetilir
 */
export const hesapIzinleri = (h: KullaniciHesap): string[] => {
  if (h.izinler) return h.izinler
  return h.rol === 'Sistem Yöneticisi' ? ['*'] : rolIzinleri(h.rol)
}

export const izinSayisi = (h: KullaniciHesap) => {
  const iz = hesapIzinleri(h)
  return iz.includes('*') ? Infinity : iz.length
}

/**
 * Merkezi izin denetimi — arayüz katmanı bu fonksiyonu kullanır.
 * ÖNEMLİ: API/backend katmanında aynı kontrol zorunlu olarak tekrarlanmalıdır;
 * buton gizlemek tek başına güvenlik değildir.
 */
export const izinVar = (hesap: KullaniciHesap | undefined, key: string): boolean => {
  if (!hesap || hesap.durum !== 'Aktif') return false
  const iz = hesapIzinleri(hesap)
  if (iz.includes('*')) return true
  const [modul] = key.split('.')
  return iz.includes(key) || iz.includes(`${modul}.*`)
}

/** Aktif oturum sahibinin hesabıyla izin kontrolü yapan hook */
export const useIzin = (key: string): boolean =>
  useEkipStore((s) => {
    const kul = localStorage.getItem('osgbhub-auth')
    if (!kul) return false
    try {
      // osgbhub-auth → { state: { user: { username } } }
      const kullaniciAdi = JSON.parse(kul).state?.user?.username
      return izinVar(s.hesaplar.find((h) => h.kullaniciAdi === kullaniciAdi), key)
    } catch {
      return false
    }
  })
