import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@/lib/guvenli-depo'
import { adSoyad } from '@/data/ekip'
import { DEMO_FIRMA_ID, DEMO_KATILIMCI_KULLANICI, DEMO_YONETIM_KULLANICI, DEMO_FIRMA_KULLANICI } from '@/data/demo'
import { DEMO_SIFRE_OZETI } from '@/data/sifre-seed'
import { clearDemoBackup, ensureDemoData, hasDemoBackup, restoreDemoStores, snapshotDemoStores } from '@/lib/demo-session'
import { sifreDogrula, sifreHashle, sifreYukseltilmeli } from '@/lib/sifre'
import { useEkipStore } from '@/stores/ekip-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useFirmaPortalStore } from '@/stores/firma-portal-store'

export interface User {
  username: string
  name: string
  initials: string
  unvan: string
  eposta: string
  telefon: string
  /** 'portal' = çalışan eğitim portalı; 'firma' = müşteri firma yetkilisi portalı */
  tip?: 'admin' | 'portal' | 'firma'
  personelId?: string
  /** tip='firma' iken: yetkili hesabı ve kapsam firma */
  yetkiliId?: string
  firmaId?: string
  /** Demo oturumu — gerçek oturumlardan ayrışır; çıkışta store'lar geri yüklenir */
  demo?: boolean
}

export type DemoPortal = 'panel' | 'firma' | 'portal'

/** Demo yönetici hesabı — şifre yalnızca özet olarak tutulur (bkz. data/sifre-seed.ts) */
const DEMO_USER = {
  username: 'yilmazturk',
  sifreHash: DEMO_SIFRE_OZETI,
  name: 'Tunahan Yılmaztürk',
  unvan: 'İSG Uzmanı',
  eposta: 'tunahan@isghub.com',
  telefon: '+90 532 000 00 00',
}

const toInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

interface AuthState {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  /**
   * Demo oturumu başlatır. Demo hesapların şifresi yoktur — yalnızca bu yol açabilir.
   * İstemci prototipi: gerçek verilerin anlık görüntüsü alınır, demo kayıtları
   * enjekte edilir; çıkışta geri yüklenir. Üretimde sunucu, izole demo
   * tenant'ında süreli oturum oluşturmalıdır.
   */
  demoLogin: (portal: DemoPortal) => boolean
  logout: () => void
  updateUser: (patch: Partial<Omit<User, 'initials'>>) => void
}

// Kullanıcı adı + şifre, mevcut store'lardaki herhangi bir hesapla eşleşiyor mu (oturum açmadan).
const kimlikVarMi = async (username: string, password: string): Promise<boolean> => {
  if (username === DEMO_USER.username && (await sifreDogrula(password, DEMO_USER.sifreHash))) return true
  const adaylar = [
    ...useEkipStore.getState().hesaplar.filter((x) => x.kullaniciAdi === username && x.durum === 'Aktif'),
    ...useFirmaPortalStore.getState().yetkililer.filter((y) => y.kullaniciAdi === username && y.durum === 'Aktif'),
    ...usePersonelStore.getState().hesaplar.filter((x) => x.kullaniciAdi === username && x.durum === 'Aktif'),
  ]
  for (const aday of adaylar) {
    if (await sifreDogrula(password, aday.sifreHash)) return true
  }
  return false
}

/** Eski biçim özet başarılı girişte yeni biçime (PBKDF2) yükseltilir; güncel kayıt dokunulmaz. */
const ozetYukseltme = async (kayitli: string | undefined, password: string): Promise<{ sifreHash?: string }> =>
  sifreYukseltilmeli(kayitli) ? { sifreHash: await sifreHashle(password) } : {}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (username, password) => {
        // Yarım kalmış demo yedeği varsa: hesap demo sırasında oluşturulmuşsa demo değişiklikleri kalıcı olur,
        // aksi halde gerçek veri geri yüklenir (oturum reload ile sıfırlanır).
        if (hasDemoBackup()) {
          if (!(await kimlikVarMi(username, password))) {
            restoreDemoStores()
            if (typeof window !== 'undefined') window.location.reload()
            return false
          }
          clearDemoBackup()
        }
        if (username === DEMO_USER.username && (await sifreDogrula(password, DEMO_USER.sifreHash))) {
          set({
            user: {
              username: DEMO_USER.username,
              name: DEMO_USER.name,
              initials: toInitials(DEMO_USER.name),
              unvan: DEMO_USER.unvan,
              eposta: DEMO_USER.eposta,
              telefon: DEMO_USER.telefon,
            },
          })
          return true
        }
        // Ekip modülündeki kullanıcı hesapları — personel bağı opsiyonel
        const hesap = useEkipStore
          .getState()
          .hesaplar.find((h) => h.kullaniciAdi === username && h.durum === 'Aktif' && h.sifreHash)
        if (hesap && (await sifreDogrula(password, hesap.sifreHash))) {
          const personel = useEkipStore.getState().uyeler.find((u) => u.id === hesap.personelId)
          const name = personel ? adSoyad(personel) : (hesap.ad ?? hesap.kullaniciAdi)
          set({
            user: {
              username: hesap.kullaniciAdi,
              name,
              initials: toInitials(name),
              unvan: personel?.gorev ?? hesap.rol,
              eposta: hesap.eposta,
              telefon: personel?.telefon ?? '',
            },
          })
          useEkipStore.getState().hesapGuncelleById(hesap.id, {
            sonGiris: new Date().toISOString(),
            sonAktiflik: new Date().toISOString(),
            ...(await ozetYukseltme(hesap.sifreHash, password)),
          })
          return true
        }
        // Müşteri firma yetkilisi hesapları — firma portalı kullanıcısı olarak giriş
        const fy = useFirmaPortalStore
          .getState()
          .yetkililer.find((y) => y.kullaniciAdi === username && y.durum === 'Aktif' && y.sifreHash)
        if (fy && (await sifreDogrula(password, fy.sifreHash))) {
          const name = `${fy.ad} ${fy.soyad}`
          set({
            user: {
              username: fy.kullaniciAdi,
              name,
              initials: toInitials(name),
              unvan: fy.gorev || 'Firma Yetkilisi',
              eposta: fy.eposta,
              telefon: fy.telefon,
              tip: 'firma',
              yetkiliId: fy.id,
              firmaId: fy.firmaId,
            },
          })
          useFirmaPortalStore.getState().yetkiliGuncelle(fy.id, {
            sonGiris: new Date().toISOString(),
            oturumlar: [
              ...fy.oturumlar,
              { id: `OT-${Date.now().toString(36)}`, cihaz: 'Tarayıcı', ip: '—', tarih: new Date().toISOString() },
            ],
            ...(await ozetYukseltme(fy.sifreHash, password)),
          })
          return true
        }
        // Müşteri firma çalışan hesapları — portal kullanıcısı olarak giriş
        const ph = usePersonelStore
          .getState()
          .hesaplar.find((h) => h.kullaniciAdi === username && h.durum === 'Aktif' && h.sifreHash)
        if (ph && (await sifreDogrula(password, ph.sifreHash))) {
          const personel = usePersonelStore.getState().personeller.find((p) => p.id === ph.personelId)
          const name = personel ? `${personel.ad} ${personel.soyad}` : ph.kullaniciAdi
          set({
            user: {
              username: ph.kullaniciAdi,
              name,
              initials: toInitials(name),
              unvan: personel?.gorev ?? 'Çalışan',
              eposta: ph.eposta,
              telefon: personel?.telefon ?? '',
              tip: 'portal',
              personelId: ph.personelId,
            },
          })
          usePersonelStore.getState().hesapGuncelle(ph.id, {
            oturumlar: [
              ...ph.oturumlar,
              {
                id: `OT-${Date.now().toString(36)}`,
                cihaz: 'Tarayıcı',
                ip: '—',
                tarih: new Date().toISOString(),
              },
            ],
            ...(await ozetYukseltme(ph.sifreHash, password)),
          })
          return true
        }
        return false
      },
      demoLogin: (portal) => {
        const aktif = useAuthStore.getState().user
        if (aktif?.demo !== true && hasDemoBackup()) {
          // Yedek var ama demo kullanıcı yok → yarım kalmış oturum; geri yükle
          restoreDemoStores()
          if (typeof window !== 'undefined') window.location.reload()
          return false
        }
        if (!aktif?.demo) snapshotDemoStores()
        ensureDemoData()
        const simdi = new Date().toISOString()
        const oturum = { id: `OT-${Date.now().toString(36)}`, cihaz: 'Tarayıcı (demo)', ip: '—', tarih: simdi }
        if (portal === 'panel') {
          const hesap = useEkipStore.getState().hesaplar.find((h) => h.kullaniciAdi === DEMO_YONETIM_KULLANICI)
          if (!hesap) return false
          const name = hesap.ad ?? hesap.kullaniciAdi
          set({
            user: {
              username: hesap.kullaniciAdi,
              name,
              initials: toInitials(name),
              unvan: hesap.rol,
              eposta: hesap.eposta,
              telefon: '',
              demo: true,
            },
          })
          useEkipStore.getState().hesapGuncelleById(hesap.id, { sonGiris: simdi, sonAktiflik: simdi })
          return true
        }
        if (portal === 'firma') {
          const fy = useFirmaPortalStore.getState().yetkililer.find((y) => y.kullaniciAdi === DEMO_FIRMA_KULLANICI)
          if (!fy) return false
          const name = `${fy.ad} ${fy.soyad}`
          set({
            user: {
              username: fy.kullaniciAdi,
              name,
              initials: toInitials(name),
              unvan: fy.gorev || 'Firma Yetkilisi',
              eposta: fy.eposta,
              telefon: fy.telefon,
              tip: 'firma',
              yetkiliId: fy.id,
              firmaId: DEMO_FIRMA_ID,
              demo: true,
            },
          })
          useFirmaPortalStore.getState().yetkiliGuncelle(fy.id, { sonGiris: simdi, oturumlar: [...fy.oturumlar, oturum] })
          return true
        }
        const ph = usePersonelStore.getState().hesaplar.find((h) => h.kullaniciAdi === DEMO_KATILIMCI_KULLANICI)
        if (!ph) return false
        const personel = usePersonelStore.getState().personeller.find((p) => p.id === ph.personelId)
        const name = personel ? `${personel.ad} ${personel.soyad}` : ph.kullaniciAdi
        set({
          user: {
            username: ph.kullaniciAdi,
            name,
            initials: toInitials(name),
            unvan: personel?.gorev ?? 'Çalışan',
            eposta: ph.eposta,
            telefon: personel?.telefon ?? '',
            tip: 'portal',
            personelId: ph.personelId,
            demo: true,
          },
        })
        usePersonelStore.getState().hesapGuncelle(ph.id, { sonGiris: simdi, oturumlar: [...ph.oturumlar, oturum] })
        return true
      },
      logout: () => {
        const demo = useAuthStore.getState().user?.demo === true
        set({ user: null })
        if (demo) {
          // Demo oturumu bitti — gerçek verileri geri yükle ve yeniden başlat
          restoreDemoStores()
          if (typeof window !== 'undefined') window.location.reload()
        }
      },
      updateUser: (patch) =>
        set((s) =>
          s.user
            ? {
                user: {
                  ...s.user,
                  ...patch,
                  initials: toInitials(patch.name ?? s.user.name),
                },
              }
            : s,
        ),
    }),
    {
      name: 'isghub-auth',
      storage: guvenliDepo,
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthState> | undefined
        return {
          ...current,
          ...p,
          user: p?.user
            ? {
                ...p.user,
                unvan: p.user.unvan ?? 'İSG Uzmanı',
                eposta: p.user.eposta ?? '',
                telefon: p.user.telefon ?? '',
              }
            : null,
        }
      },
      onRehydrateStorage: () => (state) => {
        // Demo oturumu sayfa yenilemesinde in-memory store'lardan düşer —
        // rehydration'da demo kayıtlarını (hesap dahil) geri enjekte et,
        // yoksa useIzin gibi hesap-bazlı kontroller sessizce bozulur.
        if (state?.user?.demo === true) ensureDemoData()
      },
    },
  ),
)
