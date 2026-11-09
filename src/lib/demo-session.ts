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
  DEMO_SURUM,
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

/** Demo sürüm işareti — değişince tarayıcıdaki eski demo kayıtları güncel haline getirilir */
const SURUM_ANAHTARI = 'isghub-demo'

const surumGuncel = (): boolean => {
  try {
    return localStorage.getItem(SURUM_ANAHTARI) === DEMO_SURUM
  } catch {
    return false
  }
}

const surumYaz = (): void => {
  try {
    localStorage.setItem(SURUM_ANAHTARI, DEMO_SURUM)
  } catch {
    /* yoksay */
  }
}

/**
 * Demo kayıtlarını listeye ekler. `guncelle` true ise (yeni demo sürümü) kimliği
 * eşleşen kayıtlar demo sürümüyle değiştirilir; değilse yalnızca eksikler eklenir,
 * böylece demo oturumundaki değişiklikler yenilemede kaybolmaz.
 */
const demoKaydet = <T extends { id: string }>(liste: T[], demo: T[], guncelle: boolean): T[] => {
  const eksik = demo.filter((d) => !liste.some((x) => x.id === d.id))
  if (!guncelle) return [...liste, ...eksik]
  const yeni = new Map<string, T>(demo.map((d): [string, T] => [d.id, d]))
  return [...liste.map((x) => yeni.get(x.id) ?? x), ...eksik]
}

/** Demo kayıtlarını store'lara enjekte et — idempotent */
export const ensureDemoData = (): void => {
  const guncelle = !surumGuncel()
  useEkipStore.setState((s) => ({ hesaplar: demoKaydet(s.hesaplar, [demoHesap], guncelle) }))
  useFirmaPortalStore.setState((s) => ({ yetkililer: demoKaydet(s.yetkililer, [demoYetkili], guncelle) }))
  useFirmalarStore.setState((s) => ({
    firmalar: demoKaydet(s.firmalar, [demoFirma], guncelle),
    katip: demoKaydet(s.katip, [demoKatip], guncelle),
  }))
  usePersonelStore.setState((s) => ({
    personeller: demoKaydet(s.personeller, demoPersoneller, guncelle),
    hesaplar: demoKaydet(s.hesaplar, [demoPortalHesap], guncelle),
    atamalar: demoKaydet(s.atamalar, demoAtamalar, guncelle),
    kvkkTeyitler: demoKaydet(s.kvkkTeyitler, [demoKvkkTeyit], guncelle),
  }))
  // Sertifika kayıtları ilerleme değişiminde çalışan tara() öncesi eklenmeli;
  // aksi halde demo başvurusu yokken otomatik ikinci bir başvuru üretilir.
  useSertifikaStore.setState((s) => ({
    sertifikalar: demoKaydet(s.sertifikalar, [demoSertifika], guncelle),
    basvurular: demoKaydet(s.basvurular, [demoBasvuru], guncelle),
  }))
  useEgitimlerStore.setState((s) => ({
    ilerlemeler: demoKaydet(s.ilerlemeler, demoIlerlemeler, guncelle),
  }))
  if (guncelle) surumYaz()
}
