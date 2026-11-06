/*
 * Demo oturum yönetimi — istemci prototipi.
 *
 * Çalışma modeli:
 *  - demoLogin() önce tüm 'isghub-*' persist anahtarlarının anlık görüntüsünü
 *    alır (isghub-auth hariç), sonra src/data/demo.ts kayıtlarını store'lara
 *    enjekte eder.
 *  - Demo oturumu kapandığında (logout ya da farklı hesaba giriş) anlık
 *    görüntü geri yüklenir ve sayfa yenilenir → demo kayıtları ve demo
 *    oturumunda yapılan değişiklikler tamamen izole kalır.
 *  - Persist'li olmayan store'lar (ekip, firmalar, olaylar, ayarlar) bellekte
 *    enjekte edilir; çıkıştaki reload ile yeniden seed'e döner.
 *
 * Dürüst sınır: bu, localStorage tabanlı bir yalıtımdır. Üretimde demo
 * oturumları sunucuda izole demo tenant'ında, süreli token ve rate limit ile
 * oluşturulmalı; geri yükleme/sıfırlama sunucuda yapılmalıdır.
 */
import {
  demoAtamalar,
  demoBasvuru,
  demoFirma,
  demoHesap,
  demoIlerlemeler,
  demoKatip,
  demoKvkkTeyit,
  demoPersoneller,
  demoPortalHesap,
  demoSertifika,
  demoYetkili,
} from '@/data/demo'
import { useEkipStore } from '@/stores/ekip-store'
import { useFirmaPortalStore } from '@/stores/firma-portal-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'

const BACKUP_PREFIX = 'isghub-demo-backup/'
const PERSIST_PREFIX = 'isghub-'
const SKIP = new Set(['isghub-auth', 'isghub-demo'])

const persistKeys = (): string[] => {
  const keys: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PERSIST_PREFIX) && !SKIP.has(k)) keys.push(k)
    }
  } catch {
    /* yoksay */
  }
  return keys
}

export const hasDemoBackup = (): boolean => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(BACKUP_PREFIX)) return true
    }
  } catch {
    /* yoksay */
  }
  return false
}

/** Anlık görüntüyü at: demo değişiklikleri kalıcı hale gelir, geri yükleme yapılmaz. */
export const clearDemoBackup = (): void => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const bk = localStorage.key(i)
      if (bk?.startsWith(BACKUP_PREFIX)) localStorage.removeItem(bk)
    }
  } catch {
    /* yoksay */
  }
}

/** Persist'li store anahtarlarının anlık görüntüsü — demo başlamadan ÖNCE çağrılır */
export const snapshotDemoStores = (): void => {
  persistKeys().forEach((k) => {
    const v = localStorage.getItem(k)
    if (v !== null) localStorage.setItem(BACKUP_PREFIX + k, v)
  })
}

/** Anlık görüntüyü geri yükle; backup anahtarlarını temizle. Sonrasında reload gerekir. */
export const restoreDemoStores = (): void => {
  try {
    const yedekler: [string, string][] = []
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const bk = localStorage.key(i)
      if (bk?.startsWith(BACKUP_PREFIX)) {
        const v = localStorage.getItem(bk)
        if (v !== null) yedekler.push([bk.slice(BACKUP_PREFIX.length), v])
        localStorage.removeItem(bk)
      }
    }
    // Demo oturumunda bu anahtarlara yazılan her şeyi sil, sonra geri koy
    persistKeys().forEach((k) => localStorage.removeItem(k))
    yedekler.forEach(([k, v]) => localStorage.setItem(k, v))
  } catch {
    /* yoksay */
  }
}

/** Demo kayıtları store'lara enjekte et — idempotent */
export const ensureDemoData = (): void => {
  useEkipStore.setState((s) => ({
    hesaplar: s.hesaplar.some((h) => h.id === demoHesap.id) ? s.hesaplar : [...s.hesaplar, demoHesap],
  }))
  useFirmaPortalStore.setState((s) => ({
    yetkililer: s.yetkililer.some((y) => y.id === demoYetkili.id) ? s.yetkililer : [...s.yetkililer, demoYetkili],
  }))
  useFirmalarStore.setState((s) => ({
    firmalar: s.firmalar.some((f) => f.id === demoFirma.id) ? s.firmalar : [...s.firmalar, demoFirma],
    katip: s.katip.some((k) => k.id === demoKatip.id) ? s.katip : [...s.katip, demoKatip],
  }))
  usePersonelStore.setState((s) => ({
    personeller: [...s.personeller, ...demoPersoneller.filter((p) => !s.personeller.some((x) => x.id === p.id))],
    hesaplar: s.hesaplar.some((h) => h.id === demoPortalHesap.id) ? s.hesaplar : [...s.hesaplar, demoPortalHesap],
    atamalar: [...s.atamalar, ...demoAtamalar.filter((a) => !s.atamalar.some((x) => x.id === a.id))],
    kvkkTeyitler: s.kvkkTeyitler.some((t) => t.id === demoKvkkTeyit.id) ? s.kvkkTeyitler : [...s.kvkkTeyitler, demoKvkkTeyit],
  }))
  useEgitimlerStore.setState((s) => ({
    ilerlemeler: [...s.ilerlemeler, ...demoIlerlemeler.filter((i) => !s.ilerlemeler.some((x) => x.id === i.id))],
  }))
  useSertifikaStore.setState((s) => ({
    sertifikalar: s.sertifikalar.some((c) => c.id === demoSertifika.id) ? s.sertifikalar : [...s.sertifikalar, demoSertifika],
    basvurular: s.basvurular.some((b) => b.id === demoBasvuru.id) ? s.basvurular : [...s.basvurular, demoBasvuru],
  }))
}
