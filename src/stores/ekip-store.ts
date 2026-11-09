import { create } from 'zustand'
import {
  BUGUN,
  ekipSeed,
  gorevlendirmeSeed,
  hesapSeed,
  type EkipUye,
  type Gorevlendirme,
  type KullaniciHesap,
  type PersonelDurum,
  type HesapDurum,
} from '@/data/ekip'

const sonrakiId = (liste: { id: string }[], onek: string) => {
  const max = liste.reduce((m, x) => Math.max(m, parseInt(x.id.split('-')[1] ?? '0', 10) || 0), 0)
  return `${onek}-${String(max + 1).padStart(2, '0')}`
}

interface EkipState {
  uyeler: EkipUye[]
  hesaplar: KullaniciHesap[]
  gorevlendirmeler: Gorevlendirme[]
  uyeEkle: (uye: Omit<EkipUye, 'id' | 'islemGecmisi'>) => EkipUye
  uyeGuncelle: (id: string, patch: Partial<EkipUye>, islemNotu?: string) => void
  uyeDurum: (id: string, durum: PersonelDurum) => void
  hesapOlustur: (hesap: Omit<KullaniciHesap, 'id'>) => KullaniciHesap
  hesapGuncelle: (personelId: string, patch: Partial<KullaniciHesap>, islemNotu?: string) => void
  hesapDurum: (personelId: string, durum: HesapDurum, not?: string) => void
  /** Hesap-id bazlı işlemler — personel bağlantısı olmayan hesaplar dahil */
  hesapGuncelleById: (hesapId: string, patch: Partial<KullaniciHesap>) => void
  hesapDurumById: (hesapId: string, durum: HesapDurum) => void
  davetYenile: (hesapId: string) => string
  davetKabulEt: (token: string, sifreHash: string) => boolean
  izinleriKaydet: (hesapId: string, izinler: string[]) => void
  kapsamKaydet: (hesapId: string, kapsam: KullaniciHesap['kapsam']) => void
  gorevlendirmeEkle: (g: Omit<Gorevlendirme, 'id'>) => void
  gorevlendirmeBitir: (id: string) => void
}

export const useEkipStore = create<EkipState>()((set) => ({
  uyeler: ekipSeed,
  hesaplar: hesapSeed,
  gorevlendirmeler: gorevlendirmeSeed,

  uyeEkle: (uye) => {
    let yeni!: EkipUye
    set((s) => {
      yeni = {
        ...uye,
        id: sonrakiId(s.uyeler, 'PRS'),
        islemGecmisi: [{ tarih: BUGUN, islem: 'Personel kaydı oluşturuldu' }],
      }
      return { uyeler: [yeni, ...s.uyeler] }
    })
    return yeni
  },

  uyeGuncelle: (id, patch, islemNotu) =>
    set((s) => ({
      uyeler: s.uyeler.map((u) =>
        u.id === id
          ? {
              ...u,
              ...patch,
              islemGecmisi: islemNotu
                ? [{ tarih: BUGUN, islem: islemNotu }, ...u.islemGecmisi]
                : u.islemGecmisi,
            }
          : u,
      ),
    })),

  uyeDurum: (id, durum) =>
    set((s) => {
      const ayrildi = durum === 'İşten Ayrıldı'
      return {
        uyeler: s.uyeler.map((u) =>
          u.id === id
            ? {
                ...u,
                durum,
                islemGecmisi: [
                  { tarih: BUGUN, islem: `Personel durumu güncellendi: ${durum}` },
                  ...(ayrildi
                    ? [{ tarih: BUGUN, islem: 'İşten ayrılış — kullanıcı hesabı devre dışı bırakıldı' }]
                    : []),
                  ...u.islemGecmisi,
                ],
              }
            : u,
        ),
        // İşten ayrılan personelin hesabı otomatik devre dışı — geçmiş kayıtlar korunur
        hesaplar: ayrildi
          ? s.hesaplar.map((h) => (h.personelId === id ? { ...h, durum: 'Pasif' as const } : h))
          : s.hesaplar,
      }
    }),

  hesapOlustur: (hesap) => {
    let yeni!: KullaniciHesap
    set((s) => {
      yeni = { ...hesap, id: sonrakiId(s.hesaplar, 'USR') }
      return {
        hesaplar: [...s.hesaplar, yeni],
        uyeler: s.uyeler.map((u) =>
          u.id === hesap.personelId
            ? {
                ...u,
                islemGecmisi: [
                  {
                    tarih: BUGUN,
                    islem: `Kullanıcı hesabı oluşturuldu: ${hesap.kullaniciAdi}`,
                    not: hesap.durum === 'Davet Bekliyor' ? 'Davet bağlantısı gönderildi' : undefined,
                  },
                  ...u.islemGecmisi,
                ],
              }
            : u,
        ),
      }
    })
    return yeni
  },

  hesapGuncelle: (personelId, patch, islemNotu) =>
    set((s) => ({
      hesaplar: s.hesaplar.map((h) => (h.personelId === personelId ? { ...h, ...patch } : h)),
      uyeler: islemNotu
        ? s.uyeler.map((u) =>
            u.id === personelId
              ? { ...u, islemGecmisi: [{ tarih: BUGUN, islem: islemNotu }, ...u.islemGecmisi] }
              : u,
          )
        : s.uyeler,
    })),

  hesapDurum: (personelId, durum, not) =>
    set((s) => ({
      hesaplar: s.hesaplar.map((h) =>
        h.personelId === personelId
          ? { ...h, durum, ...(durum === 'Davet Bekliyor' ? { davetTarihi: BUGUN } : {}) }
          : h,
      ),
      uyeler: s.uyeler.map((u) =>
        u.id === personelId
          ? {
              ...u,
              islemGecmisi: [
                { tarih: BUGUN, islem: `Hesap durumu güncellendi: ${durum}`, not },
                ...u.islemGecmisi,
              ],
            }
          : u,
      ),
    })),

  hesapGuncelleById: (hesapId, patch) =>
    set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.id === hesapId ? { ...h, ...patch } : h)) })),

  hesapDurumById: (hesapId, durum) =>
    set((s) => ({
      hesaplar: s.hesaplar.map((h) => (h.id === hesapId ? { ...h, durum } : h)),
      uyeler: s.uyeler.map((u) =>
        u.id === s.hesaplar.find((h) => h.id === hesapId)?.personelId
          ? {
              ...u,
              islemGecmisi: [
                { tarih: BUGUN, islem: `Hesap durumu güncellendi: ${durum}` },
                ...u.islemGecmisi,
              ],
            }
          : u,
      ),
    })),

  // Davet token'ı tek kullanımlık ve 7 gün geçerli
  davetYenile: (hesapId) => {
    const token = `dvt-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
    set((s) => ({
      hesaplar: s.hesaplar.map((h) =>
        h.id === hesapId
          ? {
              ...h,
              durum: 'Davet Bekliyor' as const,
              davetTarihi: BUGUN,
              davetToken: token,
              davetBitis: `${Number(BUGUN.slice(0, 4)) + 1}${BUGUN.slice(4)}`,
            }
          : h,
      ),
    }))
    return token
  },

  davetKabulEt: (token, sifreHash) => {
    let ok = false
    set((s) => {
      const h = s.hesaplar.find((x) => x.davetToken === token)
      if (!h || !h.davetBitis || h.davetBitis < BUGUN) return {}
      ok = true
      return {
        hesaplar: s.hesaplar.map((x) =>
          x.id === h.id
            ? {
                ...x,
                durum: 'Aktif' as const,
                sifreHash,
                davetToken: undefined,
                davetBitis: undefined,
                sonAktiflik: BUGUN,
              }
            : x,
        ),
        uyeler: s.uyeler.map((u) =>
          u.id === h.personelId
            ? {
                ...u,
                islemGecmisi: [
                  { tarih: BUGUN, islem: 'Kullanıcı daveti kabul edildi — hesap aktifleştirildi' },
                  ...u.islemGecmisi,
                ],
              }
            : u,
        ),
      }
    })
    return ok
  },

  izinleriKaydet: (hesapId, izinler) =>
    set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.id === hesapId ? { ...h, izinler } : h)) })),

  kapsamKaydet: (hesapId, kapsam) =>
    set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.id === hesapId ? { ...h, kapsam } : h)) })),

  gorevlendirmeEkle: (g) =>
    set((s) => ({
      gorevlendirmeler: [...s.gorevlendirmeler, { ...g, id: sonrakiId(s.gorevlendirmeler, 'GRV') }],
      uyeler: s.uyeler.map((u) =>
        u.id === g.personelId
          ? {
              ...u,
              islemGecmisi: [
                { tarih: BUGUN, islem: `Firma görevlendirmesi oluşturuldu (${g.firmaId})` },
                ...u.islemGecmisi,
              ],
            }
          : u,
      ),
    })),

  gorevlendirmeBitir: (id) =>
    set((s) => {
      const g = s.gorevlendirmeler.find((x) => x.id === id)
      return {
        gorevlendirmeler: s.gorevlendirmeler.map((x) =>
          x.id === id ? { ...x, durum: 'Geçmiş' as const, bitis: BUGUN } : x,
        ),
        uyeler: g
          ? s.uyeler.map((u) =>
              u.id === g.personelId
                ? {
                    ...u,
                    islemGecmisi: [
                      { tarih: BUGUN, islem: `Görevlendirme sonlandırıldı (${g.firmaId})` },
                      ...u.islemGecmisi,
                    ],
                  }
                : u,
            )
          : s.uyeler,
      }
    }),
}))
