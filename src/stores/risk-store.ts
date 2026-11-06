/*
 * Risk Değerlendirme store — Zustand + persist.
 * Üretimde bu katman REST/RPC karşılığıdır; aşağıdaki kurallar sunucuda da
 * zorunlu olarak tekrarlanmalıdır:
 *  - puan ve seviye her zaman sunucuda hesaplanır (istemci girdisi güvenilmez)
 *  - tehlike silme soft-delete'tir — değerlendirme/PDF geçmişi korunur
 *  - her mutasyon işlem geçmişine ve audit log'a yazılır
 *  - firma/personel ana verileri kopyalanmaz, yalnızca görünen adlar snapshot'lanır
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  aksiyonSeed,
  puanHesap,
  riskSeed,
  seviyeHesap,
  tehlikeSeed,
  yontemSeed,
  type AksiyonDurum,
  type AksiyonEk,
  type OnayKaydi,
  type RiskAksiyon,
  type RiskDegerlendirme,
  type RiskDurum,
  type RiskEsik,
  type RiskOlay,
  type RiskTehlike,
  type RiskYontem,
} from '@/data/risk'
import { useAyarlarStore } from '@/stores/ayarlar-store'

let seq = 400
const yeniId = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`
const simdi = () => new Date().toISOString().slice(0, 10)
const log = (islem: string, kayit: string, kullanici?: string) =>
  useAyarlarStore.getState().logEkle({ tarih: new Date().toISOString(), kullanici: kullanici ?? 'sistem', islem, kayit })
const olay = (kullanici: string, islem: string, not?: string): RiskOlay => ({ tarih: simdi(), kullanici, islem, not })

/** İstemciden gelen ham tehlike girdisi → puan/seviye sunucu tarafında hesaplanır */
const tehlikeHesapla = (t: Omit<RiskTehlike, 'id' | 'puan' | 'seviye'>, esikler: RiskEsik[], id = yeniId('TH')): RiskTehlike => {
  const puan = puanHesap(t.olasilik, t.siddet)
  return { ...t, id, puan, seviye: seviyeHesap(puan, esikler) }
}

export type DegerlendirmeKayit = Omit<RiskDegerlendirme, 'id' | 'surum' | 'revizyonlar' | 'onaylar' | 'olusturma' | 'guncelleme' | 'gecmis' | 'durum'>
export type TehlikeKayit = Omit<RiskTehlike, 'id' | 'puan' | 'seviye' | 'degerlendirmeId'>
export type AksiyonKayit = Omit<RiskAksiyon, 'id' | 'dosyalar' | 'olusturma' | 'gecmis' | 'durum'>

interface RiskState {
  degerlendirmeler: RiskDegerlendirme[]
  tehlikeler: RiskTehlike[]
  aksiyonlar: RiskAksiyon[]
  yontemler: RiskYontem[]

  /* --- Değerlendirme yaşam döngüsü --- */
  degerlendirmeOlustur: (
    d: DegerlendirmeKayit,
    giris: { kullanici: string; tehlikeler: TehlikeKayit[]; aksiyonlar: Omit<AksiyonKayit, 'degerlendirmeId' | 'firmaId' | 'firmaAd'>[]; durum: 'Taslak' | 'İncelemede' },
  ) => RiskDegerlendirme
  degerlendirmeGuncelle: (id: string, patch: Partial<DegerlendirmeKayit>, kullanici: string) => void
  incelemeGonder: (id: string, kullanici: string) => void
  onayla: (id: string, kullanici: string, not?: string) => void
  revizeIste: (id: string, kullanici: string, not: string) => void
  taslagaAl: (id: string, kullanici: string) => void
  /** Revize edildiğinde eski sürüm özeti saklanır */
  revizeEt: (id: string, kullanici: string, sebep: string) => void

  /* --- Tehlikeler --- */
  tehlikeEkle: (degerlendirmeId: string, t: TehlikeKayit, kullanici: string) => RiskTehlike | null
  tehlikeGuncelle: (id: string, patch: Partial<TehlikeKayit>, kullanici: string) => void
  tehlikeSil: (id: string, kullanici: string) => void // soft delete

  /* --- Aksiyonlar --- */
  aksiyonEkle: (a: Omit<AksiyonKayit, never>, kullanici: string) => RiskAksiyon
  aksiyonDurum: (id: string, durum: AksiyonDurum, kullanici: string, not?: string) => void
  aksiyonTamamla: (id: string, giris: { kullanici: string; not: string; dosyalar?: Omit<AksiyonEk, 'id' | 'tarih' | 'ekleyen'>[] }) => void
  aksiyonYenidenAc: (id: string, kullanici: string, not: string) => void
  aksiyonEkEkle: (id: string, dosya: Omit<AksiyonEk, 'id' | 'tarih'>, kullanici: string) => void
}

export const useRiskStore = create<RiskState>()(
  persist(
    (set, get) => ({
      degerlendirmeler: riskSeed,
      tehlikeler: tehlikeSeed,
      aksiyonlar: aksiyonSeed,
      yontemler: yontemSeed,

      degerlendirmeOlustur: (d, giris) => {
        const id = yeniId('RD')
        const durum: RiskDurum = giris.durum
        const onaylar: OnayKaydi[] =
          durum === 'İncelemede' ? [{ tarih: simdi(), kullanici: giris.kullanici, islem: 'İncelemeye Gönderildi' }] : []
        const yeni: RiskDegerlendirme = {
          ...d,
          id,
          durum,
          surum: 1,
          revizyonlar: [],
          onaylar,
          olusturma: simdi(),
          guncelleme: simdi(),
          gecmis: [
            olay(giris.kullanici, durum === 'İncelemede' ? 'Değerlendirme oluşturuldu ve incelemeye gönderildi' : 'Değerlendirme taslağı oluşturuldu'),
          ],
        }
        const thYeni: RiskTehlike[] = giris.tehlikeler.map((t) =>
          tehlikeHesapla({ ...t, degerlendirmeId: id }, d.esikler),
        )
        const akYeni: RiskAksiyon[] = giris.aksiyonlar.map((a) => {
          // Sihirbaz 'TH-WIZ-<idx>' geçici referansı gönderir → oluşturulan gerçek id'ye eşle
          const wizIdx = a.tehlikeId?.startsWith('TH-WIZ-') ? Number(a.tehlikeId.slice(7)) : null
          const tehlikeId = wizIdx !== null ? thYeni[wizIdx]?.id : a.tehlikeId
          return {
            ...a,
            tehlikeId,
            id: yeniId('AK'),
            degerlendirmeId: id,
            firmaId: d.firmaId,
            firmaAd: d.firmaAd,
            durum: 'Bekliyor' as const,
            dosyalar: [],
            olusturma: simdi(),
            gecmis: [olay(giris.kullanici, 'Aksiyon oluşturuldu')],
          }
        })
        set((s) => ({
          degerlendirmeler: [...s.degerlendirmeler, yeni],
          tehlikeler: [...s.tehlikeler, ...thYeni],
          aksiyonlar: [...s.aksiyonlar, ...akYeni],
        }))
        log('Risk değerlendirmesi oluşturuldu', `${d.ad} — ${d.firmaAd} (${thYeni.length} tehlike, ${akYeni.length} aksiyon)`, giris.kullanici)
        return yeni
      },

      degerlendirmeGuncelle: (id, patch, kullanici) => {
        set((s) => ({
          degerlendirmeler: s.degerlendirmeler.map((d) =>
            d.id === id
              ? { ...d, ...patch, guncelleme: simdi(), gecmis: [...d.gecmis, olay(kullanici, 'Değerlendirme bilgileri güncellendi')] }
              : d,
          ),
        }))
        log('Risk değerlendirmesi güncellendi', id, kullanici)
      },

      incelemeGonder: (id, kullanici) =>
        durumGecis(set, get, id, 'İncelemede', kullanici, 'İncelemeye Gönderildi'),

      onayla: (id, kullanici, not) =>
        durumGecis(set, get, id, 'Onaylandı', kullanici, 'Onaylandı', not ?? 'Değerlendirme onaylandı — belge yayımlandı'),

      revizeIste: (id, kullanici, not) =>
        durumGecis(set, get, id, 'Revize Edilmeli', kullanici, 'Revize İstendi', not),

      taslagaAl: (id, kullanici) =>
        durumGecis(set, get, id, 'Taslak', kullanici, 'Taslağa Alındı'),

      revizeEt: (id, kullanici, sebep) => {
        const d = get().degerlendirmeler.find((x) => x.id === id)
        if (!d) return
        const thSayi = get().tehlikeler.filter((t) => t.degerlendirmeId === id && !t.silindi).length
        const akSayi = get().aksiyonlar.filter((a) => a.degerlendirmeId === id).length
        set((s) => ({
          degerlendirmeler: s.degerlendirmeler.map((x) =>
            x.id === id
              ? {
                  ...x,
                  surum: x.surum + 1,
                  durum: 'Taslak',
                  guncelleme: simdi(),
                  revizyonlar: [
                    ...x.revizyonlar,
                    { surum: x.surum, tarih: simdi(), kullanici, sebep, tehlikeSayisi: thSayi, aksiyonSayisi: akSayi, durum: x.durum },
                  ],
                  gecmis: [...x.gecmis, olay(kullanici, `Revizyon başlatıldı — sürüm ${x.surum + 1}`, sebep)],
                }
              : x,
          ),
        }))
        log('Risk değerlendirmesi revize edildi', `${d.ad} → sürüm ${d.surum + 1}`, kullanici)
      },

      tehlikeEkle: (degerlendirmeId, t, kullanici) => {
        const d = get().degerlendirmeler.find((x) => x.id === degerlendirmeId)
        if (!d) return null
        const yeni = tehlikeHesapla({ ...t, degerlendirmeId }, d.esikler)
        set((s) => ({
          tehlikeler: [...s.tehlikeler, yeni],
          degerlendirmeler: s.degerlendirmeler.map((x) =>
            x.id === degerlendirmeId
              ? { ...x, guncelleme: simdi(), gecmis: [...x.gecmis, olay(kullanici, `Tehlike eklendi — ${t.bolum} / ${t.kaynak}`)] }
              : x,
          ),
        }))
        log('Tehlike eklendi', `${d.ad} — ${t.kaynak} (${yeni.seviye}, puan ${yeni.puan})`, kullanici)
        return yeni
      },

      tehlikeGuncelle: (id, patch, kullanici) => {
        const t = get().tehlikeler.find((x) => x.id === id)
        if (!t) return
        const d = get().degerlendirmeler.find((x) => x.id === t.degerlendirmeId)
        const g = tehlikeHesapla({ ...t, ...patch, degerlendirmeId: t.degerlendirmeId }, d?.esikler ?? yontemSeed[0].esikler, t.id)
        set((s) => ({
          tehlikeler: s.tehlikeler.map((x) => (x.id === id ? g : x)),
          degerlendirmeler: s.degerlendirmeler.map((x) =>
            x.id === t.degerlendirmeId
              ? { ...x, guncelleme: simdi(), gecmis: [...x.gecmis, olay(kullanici, `Tehlike güncellendi — ${g.bolum} / ${g.kaynak}`)] }
              : x,
          ),
        }))
        log('Tehlike güncellendi', `${id} → puan ${g.puan} (${g.seviye})`, kullanici)
      },

      tehlikeSil: (id, kullanici) => {
        const t = get().tehlikeler.find((x) => x.id === id)
        if (!t) return
        set((s) => ({
          tehlikeler: s.tehlikeler.map((x) => (x.id === id ? { ...x, silindi: true } : x)),
          degerlendirmeler: s.degerlendirmeler.map((x) =>
            x.id === t.degerlendirmeId
              ? { ...x, guncelleme: simdi(), gecmis: [...x.gecmis, olay(kullanici, `Tehlike kaldırıldı — ${t.bolum} / ${t.kaynak}`)] }
              : x,
          ),
        }))
        log('Tehlike kaldırıldı', `${id} — ${t.kaynak}`, kullanici)
      },

      aksiyonEkle: (a, kullanici) => {
        const yeni: RiskAksiyon = {
          ...a,
          id: yeniId('AK'),
          durum: 'Bekliyor',
          dosyalar: [],
          olusturma: simdi(),
          gecmis: [olay(kullanici, 'Aksiyon oluşturuldu')],
        }
        set((s) => ({ aksiyonlar: [...s.aksiyonlar, yeni] }))
        log('Aksiyon oluşturuldu', `${a.baslik} — ${a.sorumluAd}`, kullanici)
        return yeni
      },

      aksiyonDurum: (id, durum, kullanici, not) => {
        set((s) => ({
          aksiyonlar: s.aksiyonlar.map((a) =>
            a.id === id ? { ...a, durum, gecmis: [...a.gecmis, olay(kullanici, `Durum: ${durum}`, not)] } : a,
          ),
        }))
      },

      aksiyonTamamla: (id, giris) => {
        const a = get().aksiyonlar.find((x) => x.id === id)
        if (!a) return
        const dosyalar: AksiyonEk[] = (giris.dosyalar ?? []).map((d) => ({
          ...d,
          id: yeniId('EK'),
          tarih: simdi(),
          ekleyen: giris.kullanici,
        }))
        set((s) => ({
          aksiyonlar: s.aksiyonlar.map((x) =>
            x.id === id
              ? {
                  ...x,
                  durum: 'Tamamlandı',
                  tamamlanmaNotu: giris.not,
                  tamamlanmaTarihi: simdi(),
                  tamamlayan: giris.kullanici,
                  dosyalar: [...x.dosyalar, ...dosyalar],
                  gecmis: [...x.gecmis, olay(giris.kullanici, 'Aksiyon tamamlandı', giris.not)],
                }
              : x,
          ),
        }))
        log('Aksiyon tamamlandı', `${a.baslik} — ${a.firmaAd}`, giris.kullanici)
      },

      aksiyonYenidenAc: (id, kullanici, not) => {
        const a = get().aksiyonlar.find((x) => x.id === id)
        if (!a) return
        set((s) => ({
          aksiyonlar: s.aksiyonlar.map((x) =>
            x.id === id
              ? {
                  ...x,
                  durum: 'Bekliyor',
                  tamamlanmaNotu: undefined,
                  tamamlanmaTarihi: undefined,
                  tamamlayan: undefined,
                  gecmis: [...x.gecmis, olay(kullanici, 'Aksiyon yeniden açıldı', not)],
                }
              : x,
          ),
        }))
        log('Aksiyon yeniden açıldı', `${a.baslik} — ${not}`, kullanici)
      },

      aksiyonEkEkle: (id, dosya, kullanici) =>
        set((s) => ({
          aksiyonlar: s.aksiyonlar.map((a) =>
            a.id === id
              ? { ...a, dosyalar: [...a.dosyalar, { ...dosya, id: yeniId('EK'), tarih: simdi() }], gecmis: [...a.gecmis, olay(kullanici, `Dosya eklendi — ${dosya.ad}`)] }
              : a,
          ),
        })),
    }),
    {
      name: 'isghub-risk',
      version: 1,
      migrate: (p) => {
        const s = (p ?? {}) as Partial<RiskState>
        return {
          degerlendirmeler: s.degerlendirmeler ?? riskSeed,
          tehlikeler: s.tehlikeler ?? tehlikeSeed,
          aksiyonlar: s.aksiyonlar ?? aksiyonSeed,
          yontemler: s.yontemler?.length ? s.yontemler : yontemSeed,
        }
      },
      partialize: (s) => ({
        degerlendirmeler: s.degerlendirmeler,
        tehlikeler: s.tehlikeler,
        aksiyonlar: s.aksiyonlar,
        yontemler: s.yontemler,
      }),
    },
  ),
)

/** Durum geçişi + onay kaydı + geçmiş — tek noktadan */
function durumGecis(
  set: (fn: (s: RiskState) => Partial<RiskState>) => void,
  get: () => RiskState,
  id: string,
  hedef: RiskDurum,
  kullanici: string,
  onayIslem: OnayKaydi['islem'],
  not?: string,
) {
  const d = get().degerlendirmeler.find((x) => x.id === id)
  if (!d) return
  set((s) => ({
    degerlendirmeler: s.degerlendirmeler.map((x) =>
      x.id === id
        ? {
            ...x,
            durum: hedef,
            guncelleme: simdi(),
            onaylar: [...x.onaylar, { tarih: simdi(), kullanici, islem: onayIslem, not }],
            gecmis: [...x.gecmis, olay(kullanici, `${onayIslem}${hedef === 'Onaylandı' ? ` — sürüm ${x.surum} yayımlandı` : ''}`, not)],
          }
        : x,
    ),
  }))
  log(`Değerlendirme ${onayIslem.toLowerCase()}`, `${d.ad} — ${d.firmaAd}`, kullanici)
}
