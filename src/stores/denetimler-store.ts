/*
 * Denetimler store — saha denetimi + şablon + bulgu yaşam döngüsü.
 *
 * localStorage persist (`isghub-denetimler`); üretimde inspections,
 * inspection_templates(+versions/categories/items), inspection_responses,
 * inspection_findings, inspection_documents, inspection_history
 * tablolarına karşılık gelir. Yanıtlar `maddeler` snapshot'ında tutulur
 * (şablon sonradan değişse bile tarihsel denetim bütünlüğü korunur).
 * Düzeltici faaliyetler ayrı tabloda tutulmaz — merkezi risk-store.aksiyonlar
 * kullanılır; bulgu.aksiyonId → RiskAksiyon.id, aksiyon.kaynak → bulgu.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@/lib/guvenli-depo'
import {
  bulguSeed,
  denetimSeed,
  denetimTuruSeed,
  maddeIstat,
  puanHesapla,
  sablonSeed,
  type Denetim,
  type DenetimBelge,
  type DenetimBulgu,
  type DenetimEk,
  type DenetimMadde,
  type DenetimOlay,
  type DenetimSablon,
  type DenetimTuru,
  type MaddeSonuc,
  type SablonKategori,
} from '@/data/denetimler'
import { useAyarlarStore } from '@/stores/ayarlar-store'

let seq = 700
const yeniId = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`
const simdi = () => new Date().toISOString().slice(0, 10)
const log = (islem: string, kayit: string, kullanici?: string) =>
  useAyarlarStore.getState().logEkle({ tarih: new Date().toISOString(), kullanici: kullanici ?? 'sistem', islem, kayit })
const olay = (kullanici: string, islem: string, not?: string): DenetimOlay => ({ tarih: simdi(), kullanici, islem, not })

/** Seçili şablonlardan denetim maddeleri snapshot'ı üret */
export const sablondanMaddeler = (sablonlar: DenetimSablon[], sablonIds: string[]): { maddeler: DenetimMadde[]; refler: { sablonId: string; surum: number }[] } => {
  const secili = sablonlar.filter((s) => sablonIds.includes(s.id))
  const maddeler = secili.flatMap((s) =>
    s.kategoriler.flatMap((k) =>
      k.maddeler.map((m): DenetimMadde => ({
        id: yeniId('DM'),
        sablonMaddeId: m.id,
        sablonId: s.id,
        kategoriAd: k.ad,
        soru: m.soru,
        aciklama: m.aciklama,
        onem: m.onem,
        mevzuatRef: m.mevzuatRef,
        zorunlu: m.zorunlu,
        fotografGerekli: m.fotografGerekli ?? false,
        aksiyonKurali: m.aksiyonKurali ?? false,
        fotograflar: [],
      })),
    ),
  )
  return { maddeler, refler: secili.map((s) => ({ sablonId: s.id, surum: s.surum })) }
}

interface DenetimOlusturGiris {
  baslik: string
  firmaId: string
  firmaAd: string
  lokasyon: string
  turId: string
  turAd: string
  planlananTarih: string
  planlananSaat?: string
  uzmanId?: string
  uzmanAd: string
  katilimcilar: { ad: string; rol: Denetim['katilimcilar'][number]['rol'] }[]
  aciklama?: string
  kapsam?: string
  hazirlikNotlari?: string
  sablonIds: string[]
  olusturan: string
}

interface DenetimlerState {
  turler: DenetimTuru[]
  sablonlar: DenetimSablon[]
  denetimler: Denetim[]
  bulgular: DenetimBulgu[]
  sayac: number

  turEkle: (ad: string, aciklama: string | undefined, kullanici: string) => DenetimTuru
  turGuncelle: (id: string, ad: string, aciklama: string | undefined) => void
  turArsiv: (id: string) => void

  sablonOlustur: (giris: { ad: string; aciklama?: string; kategoriler: SablonKategori[] }, kullanici: string) => DenetimSablon
  sablonGuncelle: (id: string, giris: { ad: string; aciklama?: string; kategoriler: SablonKategori[]; not?: string }, kullanici: string) => void
  sablonKopyala: (id: string, kullanici: string) => DenetimSablon | undefined
  sablonArsiv: (id: string) => void

  denetimOlustur: (giris: DenetimOlusturGiris, planla: boolean) => Denetim
  denetimGuncelle: (id: string, patch: Partial<Denetim>, kullanici: string, not?: string) => void
  denetimBaslat: (id: string, kullanici: string) => void
  denetimRaporaAl: (id: string, kullanici: string) => number // eksik zorunlu sayısı döner
  denetimTamamla: (id: string, kullanici: string) => void
  denetimIptal: (id: string, kullanici: string, not?: string) => void

  maddeYanitla: (denetimId: string, maddeId: string, patch: { sonuc?: MaddeSonuc; not?: string; bolum?: string }) => void
  maddeFotoEkle: (denetimId: string, maddeId: string, ek: Omit<DenetimEk, 'id' | 'tarih'>) => void

  bulguEkle: (giris: Omit<DenetimBulgu, 'id' | 'durum' | 'ekler'> & { ekler?: DenetimEk[] }) => DenetimBulgu
  bulguGuncelle: (id: string, patch: Partial<DenetimBulgu>) => void
  bulguAksiyonBagla: (id: string, aksiyonId: string, kullanici: string) => void
  bulguKapat: (id: string, not: string, kullanici: string) => void
  bulguYenidenAc: (id: string, kullanici: string) => void

  belgeEkle: (denetimId: string, belge: Omit<DenetimBelge, 'id'>) => void
}

export const useDenetimlerStore = create<DenetimlerState>()(
  persist(
    (set, get) => ({
      turler: denetimTuruSeed,
      sablonlar: sablonSeed,
      denetimler: denetimSeed,
      bulgular: bulguSeed,
      sayac: 5,

      turEkle: (ad, aciklama, kullanici) => {
        const yeni: DenetimTuru = { id: yeniId('DT'), ad, aciklama, aktif: true }
        set((s) => ({ turler: [...s.turler, yeni] }))
        log('Denetim türü eklendi', `${yeni.id} — ${ad}`, kullanici)
        return yeni
      },
      turGuncelle: (id, ad, aciklama) =>
        set((s) => ({ turler: s.turler.map((t) => (t.id === id ? { ...t, ad, aciklama } : t)) })),
      turArsiv: (id) => set((s) => ({ turler: s.turler.map((t) => (t.id === id ? { ...t, aktif: !t.aktif } : t)) })),

      sablonOlustur: (giris, kullanici) => {
        const yeni: DenetimSablon = {
          id: yeniId('DSB'),
          ...giris,
          surum: 1,
          durum: 'Aktif',
          olusturan: kullanici,
          olusturma: simdi(),
          guncelleme: simdi(),
          surumGecmisi: [{ surum: 1, tarih: simdi(), kullanici, not: 'İlk sürüm' }],
        }
        set((s) => ({ sablonlar: [...s.sablonlar, yeni] }))
        log('Denetim şablonu oluşturuldu', `${yeni.id} — ${giris.ad}`, kullanici)
        return yeni
      },
      sablonGuncelle: (id, giris, kullanici) =>
        set((s) => ({
          sablonlar: s.sablonlar.map((sab) =>
            sab.id === id
              ? {
                  ...sab,
                  ad: giris.ad,
                  aciklama: giris.aciklama,
                  kategoriler: giris.kategoriler,
                  surum: sab.surum + 1,
                  guncelleme: simdi(),
                  surumGecmisi: [...sab.surumGecmisi, { surum: sab.surum + 1, tarih: simdi(), kullanici, not: giris.not }],
                }
              : sab,
          ),
        })),
      sablonKopyala: (id, kullanici) => {
        const kaynak = get().sablonlar.find((s) => s.id === id)
        if (!kaynak) return undefined
        const yeni: DenetimSablon = {
          ...kaynak,
          id: yeniId('DSB'),
          ad: `${kaynak.ad} (kopya)`,
          surum: 1,
          durum: 'Aktif',
          kategoriler: kaynak.kategoriler.map((k) => ({ ...k, id: yeniId('DSK'), maddeler: k.maddeler.map((m) => ({ ...m, id: yeniId('SM') })) })),
          olusturan: kullanici,
          olusturma: simdi(),
          guncelleme: simdi(),
          surumGecmisi: [{ surum: 1, tarih: simdi(), kullanici, not: `${kaynak.id} şablonundan kopyalandı` }],
        }
        set((s) => ({ sablonlar: [...s.sablonlar, yeni] }))
        return yeni
      },
      sablonArsiv: (id) =>
        set((s) => ({ sablonlar: s.sablonlar.map((sab) => (sab.id === id ? { ...sab, durum: sab.durum === 'Aktif' ? 'Arşiv' : 'Aktif' } : sab)) })),

      denetimOlustur: (giris, planla) => {
        const st = get()
        const { maddeler, refler } = sablondanMaddeler(st.sablonlar, giris.sablonIds)
        const n = st.sayac
        const yeni: Denetim = {
          id: yeniId('DN'),
          no: `DN-2026-${String(n).padStart(3, '0')}`,
          baslik: giris.baslik,
          firmaId: giris.firmaId,
          firmaAd: giris.firmaAd,
          lokasyon: giris.lokasyon,
          turId: giris.turId,
          turAd: giris.turAd,
          planlananTarih: giris.planlananTarih,
          planlananSaat: giris.planlananSaat,
          uzmanId: giris.uzmanId,
          uzmanAd: giris.uzmanAd,
          katilimcilar: giris.katilimcilar,
          aciklama: giris.aciklama,
          kapsam: giris.kapsam,
          hazirlikNotlari: giris.hazirlikNotlari,
          sablonlar: refler,
          maddeler,
          durum: planla ? 'Planlandı' : 'Taslak',
          belgeler: [],
          gecmis: [olay(giris.olusturan, planla ? 'Denetim planlandı' : 'Denetim taslağı oluşturuldu')],
          olusturan: giris.olusturan,
          olusturma: simdi(),
          guncelleme: simdi(),
        }
        set((s) => ({ denetimler: [yeni, ...s.denetimler], sayac: s.sayac + 1 }))
        log(planla ? 'Denetim planlandı' : 'Denetim taslağı oluşturuldu', `${yeni.no} — ${giris.baslik} · ${giris.firmaAd}`, giris.olusturan)
        return yeni
      },
      denetimGuncelle: (id, patch, kullanici, not) =>
        set((s) => ({
          denetimler: s.denetimler.map((d) =>
            d.id === id ? { ...d, ...patch, guncelleme: simdi(), gecmis: [...d.gecmis, olay(kullanici, 'Denetim güncellendi', not)] } : d,
          ),
        })),
      denetimBaslat: (id, kullanici) => {
        set((s) => ({
          denetimler: s.denetimler.map((d) =>
            d.id === id ? { ...d, durum: 'Devam Ediyor' as const, gerceklesmeBaslangic: simdi(), guncelleme: simdi(), gecmis: [...d.gecmis, olay(kullanici, 'Denetim başlatıldı')] } : d,
          ),
        }))
        const d = get().denetimler.find((x) => x.id === id)
        if (d) log('Denetim başlatıldı', `${d.no} — ${d.baslik}`, kullanici)
      },
      denetimRaporaAl: (id, kullanici) => {
        const d = get().denetimler.find((x) => x.id === id)
        if (!d) return 0
        const istat = maddeIstat(d.maddeler)
        if (istat.eksikZorunlu > 0) return istat.eksikZorunlu
        set((s) => ({
          denetimler: s.denetimler.map((x) =>
            x.id === id ? { ...x, durum: 'Rapor Bekliyor' as const, guncelleme: simdi(), gecmis: [...x.gecmis, olay(kullanici, 'Saha kontrolleri tamamlandı — rapor bekleniyor')] } : x,
          ),
        }))
        return 0
      },
      denetimTamamla: (id, kullanici) => {
        const d = get().denetimler.find((x) => x.id === id)
        if (!d) return
        const puan = puanHesapla(d.maddeler)
        set((s) => ({
          denetimler: s.denetimler.map((x) =>
            x.id === id
              ? { ...x, durum: 'Tamamlandı' as const, puan, gerceklesmeBitis: simdi(), guncelleme: simdi(), gecmis: [...x.gecmis, olay(kullanici, `Denetim tamamlandı — puan %${puan ?? '—'}`)] }
              : x,
          ),
        }))
        log('Denetim tamamlandı', `${d.no} — ${d.baslik} · puan %${puan ?? '—'}`, kullanici)
      },
      denetimIptal: (id, kullanici, not) =>
        set((s) => ({
          denetimler: s.denetimler.map((d) =>
            d.id === id ? { ...d, durum: 'İptal Edildi' as const, guncelleme: simdi(), gecmis: [...d.gecmis, olay(kullanici, 'Denetim iptal edildi', not)] } : d,
          ),
        })),

      maddeYanitla: (denetimId, maddeId, patch) =>
        set((s) => ({
          denetimler: s.denetimler.map((d) =>
            d.id === denetimId
              ? { ...d, guncelleme: simdi(), maddeler: d.maddeler.map((m) => (m.id === maddeId ? { ...m, ...patch } : m)) }
              : d,
          ),
        })),
      maddeFotoEkle: (denetimId, maddeId, ek) =>
        set((s) => ({
          denetimler: s.denetimler.map((d) =>
            d.id === denetimId
              ? {
                  ...d,
                  guncelleme: simdi(),
                  maddeler: d.maddeler.map((m) =>
                    m.id === maddeId ? { ...m, fotograflar: [...m.fotograflar, { ...ek, id: yeniId('EK'), tarih: simdi() }] } : m,
                  ),
                }
              : d,
          ),
        })),

      bulguEkle: (giris) => {
        const yeni: DenetimBulgu = { ...giris, id: yeniId('BLG'), durum: 'Açık', ekler: giris.ekler ?? [] }
        set((s) => ({ bulgular: [yeni, ...s.bulgular] }))
        const d = get().denetimler.find((x) => x.id === giris.denetimId)
        if (d) {
          set((s) => ({
            denetimler: s.denetimler.map((x) =>
              x.id === d.id ? { ...x, gecmis: [...x.gecmis, olay(giris.kapatan ?? 'sistem', 'Uygunsuzluk kaydedildi', giris.baslik)] } : x,
            ),
          }))
          log('Uygunsuzluk kaydedildi', `${d.no} — ${giris.baslik}`, 'sistem')
        }
        return yeni
      },
      bulguGuncelle: (id, patch) =>
        set((s) => ({ bulgular: s.bulgular.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      bulguAksiyonBagla: (id, aksiyonId, kullanici) => {
        set((s) => ({
          bulgular: s.bulgular.map((b) => (b.id === id ? { ...b, aksiyonId, durum: b.durum === 'Açık' ? 'Aksiyonda' as const : b.durum } : b)),
        }))
        const b = get().bulgular.find((x) => x.id === id)
        if (b) log('Bulgu aksiyona bağlandı', `${b.id} → ${aksiyonId} — ${b.baslik}`, kullanici)
      },
      bulguKapat: (id, not, kullanici) => {
        set((s) => ({
          bulgular: s.bulgular.map((b) =>
            b.id === id ? { ...b, durum: 'Kapatıldı' as const, kapatmaNotu: not, kapatan: kullanici, kapatmaTarihi: simdi() } : b,
          ),
        }))
        const b = get().bulgular.find((x) => x.id === id)
        if (b) log('Uygunsuzluk kapatıldı', `${b.id} — ${b.baslik}`, kullanici)
      },
      bulguYenidenAc: (id, kullanici) => {
        set((s) => ({
          bulgular: s.bulgular.map((b) =>
            b.id === id ? { ...b, durum: 'Açık' as const, kapatmaNotu: undefined, kapatan: undefined, kapatmaTarihi: undefined } : b,
          ),
        }))
        const b = get().bulgular.find((x) => x.id === id)
        if (b) log('Uygunsuzluk yeniden açıldı', `${b.id} — ${b.baslik}`, kullanici)
      },

      belgeEkle: (denetimId, belge) =>
        set((s) => ({
          denetimler: s.denetimler.map((d) =>
            d.id === denetimId ? { ...d, belgeler: [...d.belgeler, { ...belge, id: yeniId('DB') }] } : d,
          ),
        })),
    }),
    { name: 'isghub-denetimler', storage: guvenliDepo },
  ),
)

/** Aksiyon durumu bulgu durumuna senkronu — risk-store değişince çağrılır */
export const bulguAksiyonSenkron = (bulgu: DenetimBulgu, aksiyonDurum?: string): DenetimBulgu['durum'] => {
  if (!aksiyonDurum) return bulgu.durum
  if (aksiyonDurum === 'Kontrol Bekliyor') return 'Kontrol Bekliyor'
  if (aksiyonDurum === 'Tamamlandı') return 'Kontrol Bekliyor' // uzman kontrolü sonrası kapatılır
  if (aksiyonDurum === 'İptal Edildi') return bulgu.durum
  return bulgu.durum === 'Açık' ? 'Aksiyonda' : bulgu.durum
}
