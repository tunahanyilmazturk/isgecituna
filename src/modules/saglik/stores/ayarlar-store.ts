import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@saglik/lib/guvenli-depo'
import {
  auditSeed,
  basarisizSeed,
  belgeSeed,
  bildirimSeed,
  entegrasyonSeed,
  genelSeed,
  guvenlikSeed,
  kurumSeed,
  otomasyonSeed,
  oturumSeed,
  tanimSeed,
  type AuditLog,
  type BasarisizGiris,
  type BelgeAyarlari,
  type BildirimTercih,
  type Entegrasyon,
  type GenelAyarlar,
  type GuvenlikAyarlari,
  type KurumBilgileri,
  type OtomasyonKural,
  type Oturum,
  type TanimGrup,
} from '@saglik/data/ayarlar'

const yeniLogId = (liste: AuditLog[]) => {
  const max = liste.reduce((m, x) => Math.max(m, parseInt(x.id.split('-')[1] ?? '0', 10) || 0), 0)
  return `LOG-${String(max + 1).padStart(3, '0')}`
}

interface AyarlarState {
  genel: GenelAyarlar
  kurum: KurumBilgileri
  bildirimler: BildirimTercih[]
  guvenlik: GuvenlikAyarlari
  belge: BelgeAyarlari
  tanimlar: TanimGrup[]
  otomasyonlar: OtomasyonKural[]
  entegrasyonlar: Entegrasyon[]
  oturumlar: Oturum[]
  basarisizlar: BasarisizGiris[]
  loglar: AuditLog[]

  genelKaydet: (g: GenelAyarlar) => void
  kurumKaydet: (k: KurumBilgileri) => void
  bildirimAyarla: (tur: string, kanal: 'uygulama' | 'eposta' | 'sms', v: boolean) => void
  guvenlikKaydet: (g: GuvenlikAyarlari) => void
  belgeKaydet: (b: BelgeAyarlari) => void
  tanimEkle: (key: string, deger: string) => void
  tanimSil: (key: string, deger: string) => void
  otomasyonToggle: (id: string) => void
  entegrasyonDurum: (key: string, durum: Entegrasyon['durum']) => void
  oturumSonlandir: (id: string) => void
  hesapOturumlariSonlandir: (hesapId: string) => void
  logEkle: (l: Omit<AuditLog, 'id'>) => void
}

export const useAyarlarStore = create<AyarlarState>()(
  persist(
    (set) => ({
  genel: genelSeed,
  kurum: kurumSeed,
  bildirimler: bildirimSeed,
  guvenlik: guvenlikSeed,
  belge: belgeSeed,
  tanimlar: tanimSeed,
  otomasyonlar: otomasyonSeed,
  entegrasyonlar: entegrasyonSeed,
  oturumlar: oturumSeed,
  basarisizlar: basarisizSeed,
  loglar: auditSeed,

  genelKaydet: (g) => set({ genel: g }),
  kurumKaydet: (k) => set({ kurum: k }),
  bildirimAyarla: (tur, kanal, v) =>
    set((s) => ({
      bildirimler: s.bildirimler.map((b) => (b.tur === tur ? { ...b, [kanal]: v } : b)),
    })),
  guvenlikKaydet: (g) => set({ guvenlik: g }),
  belgeKaydet: (b) => set({ belge: b }),
  tanimEkle: (key, deger) =>
    set((s) => ({
      tanimlar: s.tanimlar.map((t) =>
        t.key === key && !t.degerler.includes(deger)
          ? { ...t, degerler: [...t.degerler, deger] }
          : t,
      ),
    })),
  tanimSil: (key, deger) =>
    set((s) => ({
      tanimlar: s.tanimlar.map((t) =>
        t.key === key ? { ...t, degerler: t.degerler.filter((d) => d !== deger) } : t,
      ),
    })),
  otomasyonToggle: (id) =>
    set((s) => ({
      otomasyonlar: s.otomasyonlar.map((o) => (o.id === id ? { ...o, aktif: !o.aktif } : o)),
    })),
  entegrasyonDurum: (key, durum) =>
    set((s) => ({
      entegrasyonlar: s.entegrasyonlar.map((e) => (e.key === key ? { ...e, durum } : e)),
    })),
  oturumSonlandir: (id) =>
    set((s) => ({ oturumlar: s.oturumlar.map((o) => (o.id === id ? { ...o, aktif: false } : o)) })),
  hesapOturumlariSonlandir: (hesapId) =>
    set((s) => ({
      oturumlar: s.oturumlar.map((o) => (o.hesapId === hesapId ? { ...o, aktif: false } : o)),
    })),
      logEkle: (l) => set((s) => ({ loglar: [{ ...l, id: yeniLogId(s.loglar) }, ...s.loglar] })),
    }),
    {
      name: 'osgbhub-ayarlar-v2', // v2: sağlık taraması kataloğu; eski İSG kayıtları yüklenmesin
      storage: guvenliDepo,
      /* Eski persist kayıtlarında kisaAd gibi yeni alanlar eksik olabilir —
         kurum nesnesini seed ile derin birleştir */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AyarlarState>
        return {
          ...current,
          ...p,
          kurum: { ...current.kurum, ...(p.kurum ?? {}) },
          belge: { ...current.belge, ...(p.belge ?? {}) },
          genel: { ...current.genel, ...(p.genel ?? {}) },
          guvenlik: { ...current.guvenlik, ...(p.guvenlik ?? {}) },
        }
      },
    },
  ),
)
