import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@/lib/guvenli-depo'
import { TODAY } from '@/data/dashboard'
import { icerikHash } from '@/lib/toplu'
import { bildirimGonder } from '@/stores/bildirim-store'
import {
  atamaSeed,
  kvkkMetinSeed,
  personelSeed,
  portalHesapSeed,
  type AtamaDurum,
  type EgitimAtama,
  type FirmaPersonel,
  type KvkkMetin,
  type KvkkTeyit,
  type PersonelDurum,
  type PortalHesap,
} from '@/data/personeller'

let seq = 0
const nid = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`
/** Yeni atamada çalışanların hesabına bildirim düşer (İSG tarafından atandığı için her zaman görünür) */
const katilimcilaraBildir = (personelIds: string[], sonTarih: string) =>
  personelIds.forEach((pid) =>
    bildirimGonder({
      hedef: `katilimci:${pid}`,
      ton: 'amber',
      baslik: 'Size yeni bir eğitim atandı',
      detay: `Son tarih ${sonTarih} · Eğitimlerim sayfanızdan başlayabilirsiniz`,
      to: '/portal/egitimler',
    }),
  )

const token = () => `dvt-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`

/** Toplu aktarma kaydı — personel + opsiyonel hesap tek atomik işlemde oluşur */
export interface TopluKayit {
  firmaId: string
  ad: string
  soyad: string
  tc?: string
  telefon?: string
  eposta?: string
  departman: string
  gorev: string
  sicilNo?: string
  hesap: boolean
  kullaniciAdi: string
  /** Şifre özeti (lib/sifre.ts) — çağıran hash'ler; store açık şifre almaz */
  sifreHash: string
  sifreDegisimZorunlu: boolean
  islemNotu: string
}

export interface TopluSonuc {
  ok: boolean
  mesaj?: string
  personelId?: string
  hesapId?: string
}
const gecmisEkle = (p: FirmaPersonel, islem: string, detay?: string): FirmaPersonel => ({
  ...p,
  islemGecmisi: [...p.islemGecmisi, { tarih: new Date().toISOString(), islem, detay }],
})

interface PersonelState {
  personeller: FirmaPersonel[]
  hesaplar: PortalHesap[]
  atamalar: EgitimAtama[]
  kvkkMetinler: KvkkMetin[]
  kvkkTeyitler: KvkkTeyit[]
  personelEkle: (p: Omit<FirmaPersonel, 'id' | 'olusturma' | 'islemGecmisi' | 'firmaGecmisi'>) => FirmaPersonel
  personelGuncelle: (id: string, patch: Partial<FirmaPersonel>) => void
  personelDurum: (id: string, durum: PersonelDurum) => void
  firmaDegistir: (id: string, firmaId: string) => void
  hesapOlustur: (personelId: string, kullaniciAdi: string, mod: 'davet' | 'sifre', sifreHash?: string) => PortalHesap
  hesapGuncelle: (id: string, patch: Partial<PortalHesap>) => void
  davetYenile: (hesapId: string) => string
  davetKabul: (tkn: string, sifreHash: string) => boolean
  oturumKapat: (hesapId: string, oturumId: string) => void
  atamaEkle: (a: Omit<EgitimAtama, 'id' | 'olaylar' | 'durum'>) => EgitimAtama
  /** Toplu atama: tüm kayıtlar tek set() içinde yazılır; yazılan kayıt sayısını döner. */
  topluAtamaEkle: (kayitlar: Omit<EgitimAtama, 'id' | 'olaylar' | 'durum'>[]) => number
  atamaDurum: (id: string, durum: AtamaDurum) => void
  sonTarihGuncelle: (id: string, tarih: string) => void
  hatirlatmaGonder: (id: string) => void
  /**
   * İSG uzmanının mevcut atamaya katılımcı eklemesi — aynı atamada zaten olan id'ler atlanır.
   * Firma kullanıcıları bu işlemi yapamaz (firma portalında buton yok).
   */
  atamaKatilimciEkle: (id: string, personelIds: string[], kim: string) => number
  epostaAlinmi: (eposta: string, haricPersonel?: string) => boolean
  kullaniciAlinmi: (kullaniciAdi: string) => boolean
  /**
   * Atomik batch: personel + hesap aynı set() içinde — yarım kalmış/ilişkisiz kayıt oluşmaz.
   * Satır bazında mükerrer denetimi yapılır; kısmi hata durumunda başarılılar korunur.
   */
  topluOlusturBatch: (kayitlar: TopluKayit[], hariciKullaniciVar?: (k: string) => boolean) => TopluSonuc[]
  sifreDegistir: (hesapId: string, sifreHash: string) => void
  /** Yönetici sıfırlaması: geçici şifre atar, ilk girişte değişim zorunlu kılar, açık oturumları kapatır */
  sifreSifirla: (hesapId: string, sifreHash: string, kim: string) => void
  /** Aktif metin için teyit yoksa true — backend'de de her istekte doğrulanmalıdır */
  kvkkBekliyor: (hesapId: string) => boolean
  kvkkTeyitEt: (hesapId: string) => void
}

export const usePersonelStore = create<PersonelState>()(
  persist(
    (set, get) => ({
      personeller: personelSeed,
      hesaplar: portalHesapSeed,
      atamalar: atamaSeed,
      kvkkMetinler: kvkkMetinSeed,
      kvkkTeyitler: [],

      personelEkle: (p) => {
        const yeni: FirmaPersonel = {
          ...p,
          id: nid('FP'),
          firmaGecmisi: [{ firmaId: p.firmaId, baslangic: TODAY }],
          olusturma: TODAY,
          islemGecmisi: [{ tarih: new Date().toISOString(), islem: 'Kayıt oluşturuldu' }],
        }
        set((s) => ({ personeller: [yeni, ...s.personeller] }))
        return yeni
      },

      personelGuncelle: (id, patch) =>
        set((s) => ({
          personeller: s.personeller.map((p) =>
            p.id === id ? gecmisEkle({ ...p, ...patch }, 'Bilgiler güncellendi') : p,
          ),
        })),

      personelDurum: (id, durum) =>
        set((s) => ({
          personeller: s.personeller.map((p) =>
            p.id === id ? gecmisEkle({ ...p, durum }, `Durum: ${durum}`) : p,
          ),
          // Hesap kapatılsa da geçmiş kayıtlar korunur — yalnız durum güncellenir
          hesaplar:
            durum === 'Pasif' || durum === 'Ayrıldı'
              ? s.hesaplar.map((h) =>
                  h.personelId === id && h.durum === 'Aktif' ? { ...h, durum: 'Askıda' as const } : h,
                )
              : s.hesaplar,
        })),

      firmaDegistir: (id, firmaId) =>
        set((s) => ({
          personeller: s.personeller.map((p) =>
            p.id === id
              ? gecmisEkle(
                  {
                    ...p,
                    firmaId,
                    firmaGecmisi: [
                      ...p.firmaGecmisi.map((f) => (f.bitis ? f : { ...f, bitis: TODAY })),
                      { firmaId, baslangic: TODAY },
                    ],
                  },
                  'Firma değişikliği',
                  `${p.firmaId} → ${firmaId}`,
                )
              : p,
          ),
        })),

      hesapOlustur: (personelId, kullaniciAdi, mod, sifreHash) => {
        const personel = get().personeller.find((p) => p.id === personelId)
        if (!personel) throw new Error('Personel bulunamadı')
        if (get().hesaplar.some((h) => h.personelId === personelId && h.durum !== 'Pasif'))
          throw new Error('Bu personelin zaten aktif bir hesabı var')
        const yeni: PortalHesap = {
          id: nid('PH'),
          personelId,
          kullaniciAdi,
          eposta: personel.eposta,
          sifreHash: mod === 'sifre' && sifreHash ? sifreHash : undefined,
          sifreDegisimTarihi: mod === 'sifre' && sifreHash ? new Date().toISOString() : undefined,
          davetToken: mod === 'davet' ? token() : undefined,
          davetBitis:
            mod === 'davet' ? new Date(Date.now() + 7 * 86400000).toISOString() : undefined,
          durum: mod === 'davet' ? 'Davet Bekliyor' : 'Aktif',
          oturumlar: [],
          olusturma: TODAY,
        }
        set((s) => ({
          hesaplar: [...s.hesaplar, yeni],
          personeller: s.personeller.map((p) =>
            p.id === personelId ? gecmisEkle(p, `Kullanıcı hesabı oluşturuldu (@${kullaniciAdi})`) : p,
          ),
        }))
        return yeni
      },

      hesapGuncelle: (id, patch) =>
        set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),

      davetYenile: (hesapId) => {
        const t = token()
        set((s) => ({
          hesaplar: s.hesaplar.map((h) =>
            h.id === hesapId
              ? {
                  ...h,
                  davetToken: t,
                  davetBitis: new Date(Date.now() + 7 * 86400000).toISOString(),
                  durum: 'Davet Bekliyor',
                }
              : h,
          ),
        }))
        return t
      },

      /** Davet tek kullanımlık ve sürelidir — kabulde hesap aktifleşir */
      davetKabul: (tkn, sifreHash) => {
        const h = get().hesaplar.find(
          (x) => x.davetToken === tkn && x.durum === 'Davet Bekliyor',
        )
        if (!h || (h.davetBitis && h.davetBitis < new Date().toISOString())) return false
        set((s) => ({
          hesaplar: s.hesaplar.map((x) =>
            x.id === h.id
              ? {
                  ...x,
                  durum: 'Aktif',
                  sifreHash,
                  sifreDegisimTarihi: new Date().toISOString(),
                  davetToken: undefined,
                  davetBitis: undefined,
                }
              : x,
          ),
        }))
        return true
      },

      oturumKapat: (hesapId, oturumId) =>
        set((s) => ({
          hesaplar: s.hesaplar.map((h) =>
            h.id === hesapId ? { ...h, oturumlar: h.oturumlar.filter((o) => o.id !== oturumId) } : h,
          ),
        })),

      /** Aynı personelin aynı eğitimi tekrar alması serbest — her atama bağımsız kayıt */
      atamaEkle: (a) => {
        const yeni: EgitimAtama = {
          ...a,
          id: nid('ATM'),
          durum: 'Aktif',
          olaylar: [{ tarih: new Date().toISOString(), islem: `Atama oluşturuldu — ${a.personelIds.length} personel` }],
        }
        set((s) => ({ atamalar: [yeni, ...s.atamalar] }))
        katilimcilaraBildir(yeni.personelIds, yeni.sonTarih)
        return yeni
      },

      topluAtamaEkle: (kayitlar) => {
        if (!kayitlar.length) return 0
        const yeniler: EgitimAtama[] = kayitlar.map((a) => ({
          ...a,
          id: nid('ATM'),
          durum: 'Aktif',
          olaylar: [{ tarih: new Date().toISOString(), islem: `Atama oluşturuldu — ${a.personelIds.length} personel` }],
        }))
        set((s) => ({ atamalar: [...yeniler, ...s.atamalar] }))
        yeniler.forEach((y) => katilimcilaraBildir(y.personelIds, y.sonTarih))
        return yeniler.length
      },

      atamaDurum: (id, durum) =>
        set((s) => ({
          atamalar: s.atamalar.map((a) =>
            a.id === id
              ? {
                  ...a,
                  durum,
                  olaylar: [...a.olaylar, { tarih: new Date().toISOString(), islem: `Durum: ${durum}` }],
                }
              : a,
          ),
        })),

      sonTarihGuncelle: (id, tarih) =>
        set((s) => ({
          atamalar: s.atamalar.map((a) =>
            a.id === id
              ? {
                  ...a,
                  sonTarih: tarih,
                  olaylar: [...a.olaylar, { tarih: new Date().toISOString(), islem: `Son tarih güncellendi: ${tarih}` }],
                }
              : a,
          ),
        })),

      hatirlatmaGonder: (id) =>
        set((s) => ({
          atamalar: s.atamalar.map((a) =>
            a.id === id
              ? {
                  ...a,
                  olaylar: [...a.olaylar, { tarih: new Date().toISOString(), islem: 'Hatırlatma gönderildi' }],
                }
              : a,
          ),
        })),

      atamaKatilimciEkle: (id, personelIds, kim) => {
        const a = get().atamalar.find((x) => x.id === id)
        if (!a || a.durum === 'İptal') return -1
        const yeniler = personelIds.filter((p) => !a.personelIds.includes(p))
        if (yeniler.length === 0) return 0
        set((s) => ({
          atamalar: s.atamalar.map((x) =>
            x.id === id
              ? {
                  ...x,
                  personelIds: [...x.personelIds, ...yeniler],
                  olaylar: [
                    ...x.olaylar,
                    { tarih: new Date().toISOString(), islem: `${kim} ${yeniler.length} katılımcı ekledi` },
                  ],
                }
              : x,
          ),
        }))
        return yeniler.length
      },

      epostaAlinmi: (eposta, haricPersonel) =>
        get().personeller.some(
          (p) => p.id !== haricPersonel && p.eposta.toLowerCase() === eposta.toLowerCase(),
        ) || get().hesaplar.some((h) => h.eposta.toLowerCase() === eposta.toLowerCase()),

      kullaniciAlinmi: (kullaniciAdi) =>
        get().hesaplar.some((h) => h.kullaniciAdi === kullaniciAdi),

      topluOlusturBatch: (kayitlar, hariciKullaniciVar) => {
        const sonuclar: TopluSonuc[] = []
        const eklenenP: FirmaPersonel[] = []
        const eklenenH: PortalHesap[] = []
        const simdi = new Date().toISOString()
        const epostaSet = new Set(get().personeller.map((p) => p.eposta.toLowerCase()))
        get().hesaplar.forEach((h) => epostaSet.add(h.eposta.toLowerCase()))
        const tcSet = new Set(get().personeller.map((p) => p.tc).filter(Boolean))
        const kulSet = new Set(get().hesaplar.map((h) => h.kullaniciAdi))

        for (const k of kayitlar) {
          const ep = (k.eposta ?? '').toLowerCase()
          if (ep && epostaSet.has(ep)) {
            sonuclar.push({ ok: false, mesaj: 'E-posta zaten kayıtlı' })
            continue
          }
          if (k.tc && tcSet.has(k.tc)) {
            sonuclar.push({ ok: false, mesaj: 'T.C. kimlik no zaten kayıtlı' })
            continue
          }
          if (k.hesap && (kulSet.has(k.kullaniciAdi) || hariciKullaniciVar?.(k.kullaniciAdi))) {
            sonuclar.push({ ok: false, mesaj: 'Kullanıcı adı çakışması' })
            continue
          }
          const p: FirmaPersonel = {
            id: nid('FP'),
            firmaId: k.firmaId,
            ad: k.ad,
            soyad: k.soyad,
            eposta: k.eposta ?? '',
            telefon: k.telefon ?? '',
            tc: k.tc || undefined,
            departman: k.departman,
            gorev: k.gorev,
            sicilNo: k.sicilNo ?? '',
            durum: 'Aktif',
            firmaGecmisi: [{ firmaId: k.firmaId, baslangic: TODAY }],
            olusturma: TODAY,
            islemGecmisi: [{ tarih: simdi, islem: k.islemNotu }],
          }
          eklenenP.push(p)
          if (ep) epostaSet.add(ep)
          if (k.tc) tcSet.add(k.tc)
          if (k.hesap) {
            const h: PortalHesap = {
              id: nid('PH'),
              personelId: p.id,
              kullaniciAdi: k.kullaniciAdi,
              eposta: k.eposta ?? '',
              sifreHash: k.sifreHash,
              sifreDegisimTarihi: k.sifreHash ? new Date().toISOString() : undefined,
              sifreDegisimZorunlu: k.sifreDegisimZorunlu,
              durum: 'Aktif',
              oturumlar: [],
              olusturma: TODAY,
            }
            eklenenH.push(h)
            kulSet.add(k.kullaniciAdi)
            p.islemGecmisi.push({
              tarih: simdi,
              islem: `Kullanıcı hesabı oluşturuldu (@${k.kullaniciAdi})`,
            })
          }
          sonuclar.push({ ok: true, personelId: p.id, hesapId: k.hesap ? eklenenH[eklenenH.length - 1].id : undefined })
        }
        if (eklenenP.length > 0)
          set((s) => ({
            personeller: [...eklenenP, ...s.personeller],
            hesaplar: [...s.hesaplar, ...eklenenH],
          }))
        return sonuclar
      },

      sifreDegistir: (hesapId, sifreHash) =>
        set((s) => ({
          hesaplar: s.hesaplar.map((h) =>
            h.id === hesapId
              ? { ...h, sifreHash, sifreDegisimZorunlu: false, sifreDegisimTarihi: new Date().toISOString() }
              : h,
          ),
        })),

      sifreSifirla: (hesapId, sifreHash, kim) => {
        const h = get().hesaplar.find((x) => x.id === hesapId)
        if (!h) return
        const simdi = new Date().toISOString()
        set((s) => ({
          hesaplar: s.hesaplar.map((x) =>
            x.id === hesapId
              ? { ...x, sifreHash, sifreDegisimZorunlu: true, sifreDegisimTarihi: simdi, oturumlar: [] }
              : x,
          ),
          personeller: s.personeller.map((p) =>
            p.id === h.personelId ? gecmisEkle(p, `Katılımcı şifresi sıfırlandı (${kim})`) : p,
          ),
        }))
      },

      kvkkBekliyor: (hesapId) => {
        const aktif = get().kvkkMetinler.find((m) => m.aktif)
        if (!aktif) return false
        return !get().kvkkTeyitler.some((t) => t.hesapId === hesapId && t.metinId === aktif.id)
      },

      kvkkTeyitEt: (hesapId) => {
        const aktif = get().kvkkMetinler.find((m) => m.aktif)
        const hesap = get().hesaplar.find((h) => h.id === hesapId)
        if (!aktif || !hesap) return
        const teyit: KvkkTeyit = {
          id: nid('KVT'),
          hesapId,
          personelId: hesap.personelId,
          metinId: aktif.id,
          metinSurum: aktif.surum,
          icerikHash: icerikHash(aktif.icerik),
          teyitZamani: new Date().toISOString(),
          teyitTuru: 'aydinlatma',
          userAgent: navigator.userAgent,
        }
        set((s) => ({
          kvkkTeyitler: [...s.kvkkTeyitler, teyit],
          personeller: s.personeller.map((p) =>
            p.id === hesap.personelId
              ? gecmisEkle(p, `KVKK aydınlatma metni teyit edildi (v${aktif.surum})`)
              : p,
          ),
        }))
      },
    }),
    {
      name: 'isghub-personeller',
      storage: guvenliDepo,
      version: 1,
      migrate: (state) => {
        // v0 → v1: firmaId 'FRM-00X' → firma.id 'FR-0X' eşlemesi
        const harita: Record<string, string> = { 'FRM-001': 'FR-01', 'FRM-002': 'FR-02', 'FRM-003': 'FR-03' }
        const donustur = (id: string) => harita[id] ?? id
        const s = state as { personeller?: FirmaPersonel[]; atamalar?: EgitimAtama[] }
        s.personeller?.forEach((p) => {
          p.firmaId = donustur(p.firmaId)
          p.firmaGecmisi?.forEach((g) => (g.firmaId = donustur(g.firmaId)))
        })
        s.atamalar?.forEach((a) => (a.firmaId = donustur(a.firmaId)))
        return state
      },
    },
  ),
)

export const personelAd = (p: FirmaPersonel) => `${p.ad} ${p.soyad}`
export const personelHesap = (s: PersonelState, personelId: string) =>
  s.hesaplar.find((h) => h.personelId === personelId && h.durum !== 'Pasif')
export const personelAtamalari = (s: PersonelState, personelId: string) =>
  s.atamalar.filter((a) => a.durum !== 'İptal' && a.personelIds.includes(personelId))
