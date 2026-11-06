/*
 * Firma portalı store — firma yetkilisi hesapları.
 * Üretimde hesap işlemleri transaction içinde; durum geçişleri ve davet
 * tek kullanımlık token ile sunucuda doğrulanır. Tüm firma kapsamlı
 * sorgular sunucuda üyelik tablosuyla sınırlandırılır.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TODAY } from '@/data/dashboard'
import { sifreHashle } from '@/data/ekip'
import { firmaYetkiliSeed, type FirmaYetkili, type YetkiliDurum } from '@/data/firma-portal'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { usePersonelStore } from '@/stores/personeller-store'

let seq = 0
const nid = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`
const token = () => `dvt-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
const simdi = () => new Date().toISOString()
const log = (islem: string, kayit: string, kullanici?: string) =>
  useAyarlarStore.getState().logEkle({ tarih: simdi(), kullanici: kullanici ?? 'sistem', islem, kayit })

const gecmis = (y: FirmaYetkili, islem: string, detay?: string): FirmaYetkili => ({
  ...y,
  islemGecmisi: [...y.islemGecmisi, { tarih: simdi(), islem, detay }],
})

interface FirmaPortalState {
  yetkililer: FirmaYetkili[]
  yetkiliEkle: (y: Omit<FirmaYetkili, 'id' | 'oturumlar' | 'olusturma' | 'islemGecmisi'>, kullanici?: string) => FirmaYetkili
  yetkiliGuncelle: (id: string, patch: Partial<FirmaYetkili>, islem?: string, kullanici?: string) => void
  yetkiliDurum: (id: string, durum: YetkiliDurum, kullanici?: string) => void
  davetYenile: (id: string, kullanici?: string) => string
  davetKabul: (tkn: string, sifre: string) => boolean
  sifreSifirla: (id: string, kullanici?: string) => void
  sifreDegistir: (id: string, yeniSifre: string) => void
  oturumKapat: (id: string, oturumId: string, kullanici?: string) => void
  izinKaydet: (id: string, izinler: string[], kullanici?: string) => void
  kullaniciAlinmi: (kullaniciAdi: string) => boolean
}

export const useFirmaPortalStore = create<FirmaPortalState>()(
  persist(
    (set, get) => ({
      yetkililer: firmaYetkiliSeed,

      yetkiliEkle: (y, kullanici) => {
        const yeni: FirmaYetkili = {
          ...y,
          id: nid('FY'),
          oturumlar: [],
          olusturma: TODAY,
          islemGecmisi: [{ tarih: simdi(), islem: 'Firma yetkilisi hesabı oluşturuldu' }],
        }
        set((s) => ({ yetkililer: [yeni, ...s.yetkililer] }))
        log('Firma yetkilisi oluşturuldu', `${y.ad} ${y.soyad} (@${y.kullaniciAdi}) · ${y.firmaId}`, kullanici)
        return yeni
      },

      yetkiliGuncelle: (id, patch, islem, kullanici) => {
        const eski = get().yetkililer.find((y) => y.id === id)
        if (!eski) return
        set((s) => ({
          yetkililer: s.yetkililer.map((y) => (y.id === id ? gecmis({ ...y, ...patch }, islem ?? 'Bilgiler güncellendi') : y)),
        }))
        if (islem) log('Firma yetkilisi güncellendi', `${eski.kullaniciAdi} — ${islem}`, kullanici)
      },

      yetkiliDurum: (id, durum, kullanici) => {
        const eski = get().yetkililer.find((y) => y.id === id)
        if (!eski) return
        set((s) => ({
          yetkililer: s.yetkililer.map((y) =>
            y.id === id
              ? gecmis(
                  { ...y, durum, oturumlar: durum === 'Aktif' ? y.oturumlar : [] },
                  `Durum: ${durum}`,
                )
              : y,
          ),
        }))
        log('Firma yetkilisi durum değişikliği', `${eski.kullaniciAdi} → ${durum}`, kullanici)
      },

      davetYenile: (id, kullanici) => {
        const t = token()
        set((s) => ({
          yetkililer: s.yetkililer.map((y) =>
            y.id === id
              ? gecmis(
                  { ...y, davetToken: t, davetBitis: new Date(Date.now() + 7 * 86400000).toISOString(), durum: 'Davet Bekliyor' },
                  'Davet bağlantısı yenilendi',
                )
              : y,
          ),
        }))
        log('Firma yetkilisi daveti yenilendi', get().yetkililer.find((y) => y.id === id)?.kullaniciAdi ?? id, kullanici)
        return t
      },

      davetKabul: (tkn, sifre) => {
        const y = get().yetkililer.find(
          (x) => x.davetToken === tkn && x.durum === 'Davet Bekliyor',
        )
        if (!y || (y.davetBitis && y.davetBitis < simdi())) return false
        set((s) => ({
          yetkililer: s.yetkililer.map((x) =>
            x.id === y.id
              ? gecmis(
                  { ...x, durum: 'Aktif', sifreHash: sifreHashle(sifre), davetToken: undefined, davetBitis: undefined },
                  'Davet kabul edildi — şifre belirlendi',
                )
              : x,
          ),
        }))
        log('Firma yetkilisi daveti kabul edildi', y.kullaniciAdi, y.kullaniciAdi)
        return true
      },

      /** OSGB yöneticisi şifre sıfırlar — eski hash geçersiz, ilk girişte değişim zorunlu */
      sifreSifirla: (id, _kullanici) =>
        set((s) => ({
          yetkililer: s.yetkililer.map((y) =>
            y.id === id
              ? gecmis(
                  { ...y, sifreHash: undefined, sifreDegisimZorunlu: false, durum: 'Davet Bekliyor', davetToken: token(), davetBitis: new Date(Date.now() + 7 * 86400000).toISOString(), oturumlar: [] },
                  'Şifre sıfırlandı — yeni davet bağlantısı üretildi',
                )
              : y,
          ),
        })),

      sifreDegistir: (id, yeniSifre) =>
        set((s) => ({
          yetkililer: s.yetkililer.map((y) =>
            y.id === id
              ? gecmis({ ...y, sifreHash: sifreHashle(yeniSifre), sifreDegisimZorunlu: false }, 'Şifre değiştirildi')
              : y,
          ),
        })),

      oturumKapat: (id, oturumId, kullanici) => {
        const y = get().yetkililer.find((x) => x.id === id)
        set((s) => ({
          yetkililer: s.yetkililer.map((x) =>
            x.id === id
              ? gecmis({ ...x, oturumlar: x.oturumlar.filter((o) => o.id !== oturumId) }, 'Oturum sonlandırıldı', oturumId)
              : x,
          ),
        }))
        if (y) log('Firma yetkilisi oturumu sonlandırıldı', `${y.kullaniciAdi} · ${oturumId}`, kullanici)
      },

      izinKaydet: (id, izinler, kullanici) => {
        const y = get().yetkililer.find((x) => x.id === id)
        if (!y) return
        set((s) => ({
          yetkililer: s.yetkililer.map((x) => (x.id === id ? gecmis({ ...x, izinler }, 'Yetki seti güncellendi', `${izinler.length} izin`) : x)),
        }))
        log('Firma yetkilisi yetkileri güncellendi', `${y.kullaniciAdi} — ${izinler.length} izin`, kullanici)
      },

      kullaniciAlinmi: (kullaniciAdi) =>
        get().yetkililer.some((y) => y.kullaniciAdi === kullaniciAdi) ||
        usePersonelStore.getState().kullaniciAlinmi(kullaniciAdi),
    }),
    { name: 'isghub-firma-portal' },
  ),
)

/** Oturum sahibi yetkilinin hesabı — tip 'firma' iken firmaId kapsamı buradan gelir */
export const aktifYetkili = (): FirmaYetkili | undefined => {
  try {
    const kul = localStorage.getItem('isghub-auth')
    if (!kul) return undefined
    const user = JSON.parse(kul).state?.user
    if (user?.tip !== 'firma' || !user.yetkiliId) return undefined
    return useFirmaPortalStore.getState().yetkililer.find((y) => y.id === user.yetkiliId)
  } catch {
    return undefined
  }
}
