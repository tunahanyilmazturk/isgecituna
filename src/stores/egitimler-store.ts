import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@/lib/guvenli-depo'
import { TODAY } from '@/data/dashboard'
import { yuksekteEgitim } from '@/data/egitim-yuksekte'
import { temelIsgSurum4 } from '@/data/egitim-temel-isg'
import { temelIsgOnSinavi } from '@/data/egitimler'
import {
  egitimSeed,
  ilerlemeSeed,
  varsayilanTamamlama,
  type Egitim,
  type EgitimIlerleme,
  type EgitimSurum,
  type IcerikIlerleme,
  type IlerlemeDurum,
  type OnSinavKayit,
  type SinavDeneme,
} from '@/data/egitimler'

let seq = 100
const yeniId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`

/** Zorunlu içeriklerin tamamını ve sınav durumunu değerlendirip eğitim durumunu üretir */
export const durumHesapla = (surum: EgitimSurum, il: EgitimIlerleme): IlerlemeDurum => {
  // Onaylanmış (Tamamlandı) kayıt, içerik yeniden açıldığında "Onay Bekliyor"a geri dönmez
  if (il.durum === 'Tamamlandı') return 'Tamamlandı'
  const zorunlular = surum.bolumler.flatMap((b) => b.icerikler).filter((i) => i.zorunlu)
  const tamam = zorunlular.every((i) => il.icerikler[i.id]?.tamamlandi)
  if (!tamam) return zorunlular.some((i) => il.icerikler[i.id]) ? 'Devam Ediyor' : 'Başlamadı'
  if (!surum.tamamlama.sinavZorunlu || !surum.sinav) {
    return surum.tamamlama.manuelOnay ? 'Onay Bekliyor' : 'Tamamlandı'
  }
  const son = il.denemeler[il.denemeler.length - 1]
  if (!son) return 'Sınav Bekleniyor'
  if (!son.gecti) {
    const hak = surum.sinav.ayarlar.denemeHakki
    return hak > 0 && il.denemeler.length >= hak ? 'Sınav Başarısız' : 'Sınav Bekleniyor'
  }
  return surum.tamamlama.manuelOnay ? 'Onay Bekliyor' : 'Tamamlandı'
}

interface EgitimlerState {
  egitimler: Egitim[]
  ilerlemeler: EgitimIlerleme[]
  egitimEkle: (e: Egitim) => void
  egitimGuncelle: (id: string, patch: Partial<Egitim>) => void
  egitimSil: (id: string) => void
  egitimCogalt: (id: string) => void
  yayinla: (id: string) => void
  arsivle: (id: string) => void
  surumKaydet: (egitimId: string, surum: EgitimSurum) => void
  yeniSurum: (egitimId: string) => void
  ilerlemeGetir: (hesapId: string, egitimId: string, atamaId?: string, surumId?: string) => EgitimIlerleme
  icerikIlerlemeKaydet: (hesapId: string, egitimId: string, icerikId: string, patch: Partial<IcerikIlerleme>, atamaId?: string, surumId?: string) => void
  denemeEkle: (hesapId: string, egitimId: string, deneme: Omit<SinavDeneme, 'no'>, atamaId?: string, surumId?: string) => boolean
  onSinavKaydet: (hesapId: string, egitimId: string, kayit: OnSinavKayit, atamaId?: string, surumId?: string) => void
  /** İSG onayı verildiğinde "Onay Bekliyor" kaydını "Tamamlandı" yapar */
  ilerlemeTamamla: (hesapId: string, atamaId: string) => void
}

export const useEgitimlerStore = create<EgitimlerState>()(
  persist(
    (set, get) => ({
      egitimler: [...egitimSeed, yuksekteEgitim],
      ilerlemeler: ilerlemeSeed,

      egitimEkle: (e) => set((s) => ({ egitimler: [e, ...s.egitimler] })),

      egitimGuncelle: (id, patch) =>
        set((s) => ({
          egitimler: s.egitimler.map((e) =>
            e.id === id ? { ...e, ...patch, guncelleme: TODAY } : e,
          ),
        })),

      egitimSil: (id) =>
        set((s) => ({
          egitimler: s.egitimler.filter((e) => e.id !== id),
          ilerlemeler: s.ilerlemeler.filter((i) => i.egitimId !== id),
        })),

      egitimCogalt: (id) =>
        set((s) => {
          const kaynak = s.egitimler.find((e) => e.id === id)
          if (!kaynak) return s
          const surumler: EgitimSurum[] = kaynak.surumler.map((sv) => ({
            ...sv,
            id: yeniId('ES'),
            durum: sv.id === kaynak.aktifSurumId ? 'taslak' : 'eski',
          }))
          const aktif = surumler.find((sv) => sv.durum === 'taslak') ?? surumler[surumler.length - 1]
          const kopya: Egitim = {
            ...kaynak,
            id: yeniId('EGT'),
            baslik: `${kaynak.baslik} (Kopya)`,
            durum: 'Taslak',
            surumler,
            aktifSurumId: aktif.id,
            guncelleme: TODAY,
          }
          return { egitimler: [kopya, ...s.egitimler] }
        }),

      yayinla: (id) =>
        set((s) => ({
          egitimler: s.egitimler.map((e) =>
            e.id === id ? { ...e, durum: 'Yayında', guncelleme: TODAY } : e,
          ),
        })),

      arsivle: (id) =>
        set((s) => ({
          egitimler: s.egitimler.map((e) =>
            e.id === id
              ? {
                  ...e,
                  durum: e.durum === 'Arşiv' ? 'Taslak' : 'Arşiv',
                  guncelleme: TODAY,
                }
              : e,
          ),
        })),

      surumKaydet: (egitimId, surum) =>
        set((s) => ({
          egitimler: s.egitimler.map((e) =>
            e.id === egitimId
              ? {
                  ...e,
                  surumler: e.surumler.map((sv) => (sv.id === surum.id ? surum : sv)),
                  guncelleme: TODAY,
                }
              : e,
          ),
        })),

      /** Yayındaki eğitim için yeni taslak sürüm üretir; eski sürüm korunur */
      yeniSurum: (egitimId) =>
        set((s) => ({
          egitimler: s.egitimler.map((e) => {
            if (e.id !== egitimId) return e
            const aktif = e.surumler.find((sv) => sv.id === e.aktifSurumId)
            if (!aktif) return e
            const yeni: EgitimSurum = {
              ...aktif,
              id: yeniId('ES'),
              no: Math.max(...e.surumler.map((sv) => sv.no)) + 1,
              durum: 'taslak',
              not: 'Yeni sürüm taslağı',
              tarih: TODAY,
              tamamlama: { ...aktif.tamamlama },
              bolumler: aktif.bolumler.map((b) => ({ ...b, icerikler: [...b.icerikler] })),
            }
            return {
              ...e,
              surumler: [
                ...e.surumler.map((sv) =>
                  sv.id === e.aktifSurumId ? { ...sv, durum: 'eski' as const } : sv,
                ),
                yeni,
              ],
              aktifSurumId: yeni.id,
              guncelleme: TODAY,
            }
          }),
        })),

      ilerlemeGetir: (hesapId, egitimId, atamaId, hedefSurumId) => {
        const { ilerlemeler, egitimler } = get()
        const egitim = egitimler.find((e) => e.id === egitimId)
        const surumId = hedefSurumId ?? (atamaId
          ? (ilerlemeler.find((i) => i.atamaId === atamaId)?.surumId ?? egitim?.aktifSurumId ?? '')
          : (egitim?.aktifSurumId ?? ''))
        const mevcut = ilerlemeler.find(
          (i) =>
            i.hesapId === hesapId &&
            i.egitimId === egitimId &&
            i.surumId === surumId &&
            i.atamaId === atamaId,
        )
        if (mevcut) return mevcut
        const yeni: EgitimIlerleme = {
          id: yeniId('ILR'),
          hesapId,
          egitimId,
          surumId,
          atamaId,
          durum: 'Başlamadı',
          icerikler: {},
          denemeler: [],
          sonErisim: new Date().toISOString(),
        }
        set((s) => ({ ilerlemeler: [...s.ilerlemeler, yeni] }))
        return yeni
      },

      icerikIlerlemeKaydet: (hesapId, egitimId, icerikId, patch, atamaId, hedefSurumId) =>
        set((s) => {
          const egitim = s.egitimler.find((e) => e.id === egitimId)
          if (!egitim) return s
          const surumId = hedefSurumId ?? egitim.aktifSurumId
          const surum = egitim.surumler.find((sv) => sv.id === surumId)
          if (!surum?.bolumler.some((b) => b.icerikler.some((i) => i.id === icerikId))) return s
          const ilerlemeler = s.ilerlemeler.map((il) => {
            if (il.hesapId !== hesapId || il.egitimId !== egitimId || il.surumId !== surumId || il.atamaId !== atamaId)
              return il
            const guncel: EgitimIlerleme = {
              ...il,
              icerikler: {
                ...il.icerikler,
                [icerikId]: { ...(il.icerikler[icerikId] ?? { tamamlandi: false }), ...patch },
              },
              sonErisim: new Date().toISOString(),
            }
            if (surum) guncel.durum = durumHesapla(surum, guncel)
            return guncel
          })
          return { ilerlemeler }
        }),

      ilerlemeTamamla: (hesapId, atamaId) =>
        set((s) => ({
          ilerlemeler: s.ilerlemeler.map((il) =>
            il.hesapId === hesapId && il.atamaId === atamaId && il.durum === 'Onay Bekliyor'
              ? { ...il, durum: 'Tamamlandı' as const }
              : il,
          ),
        })),

      onSinavKaydet: (hesapId, egitimId, kayit, atamaId, surumId) => {
        get().ilerlemeGetir(hesapId, egitimId, atamaId, surumId)
        set((s) => ({
          ilerlemeler: s.ilerlemeler.map((il) =>
            il.hesapId === hesapId && il.egitimId === egitimId && il.surumId === surumId && il.atamaId === atamaId
              ? { ...il, onSinav: kayit, sonErisim: new Date().toISOString() }
              : il,
          ),
        }))
      },

      denemeEkle: (hesapId, egitimId, deneme, atamaId, hedefSurumId) => {
        let kaydedildi = false
        set((s) => {
          const egitim = s.egitimler.find((e) => e.id === egitimId)
          if (!egitim) return s
          const surumId = hedefSurumId ?? egitim.aktifSurumId
          const surum = egitim.surumler.find((sv) => sv.id === surumId)
          if (!surum?.sinav) return s
          const zorunlular = surum.bolumler.flatMap((b) => b.icerikler).filter((i) => i.zorunlu)
          const ilerlemeler = s.ilerlemeler.map((il) => {
            if (il.hesapId !== hesapId || il.egitimId !== egitimId || il.surumId !== surumId || il.atamaId !== atamaId)
              return il
            if (zorunlular.some((i) => !il.icerikler[i.id]?.tamamlandi)) return il
            const hak = surum.sinav!.ayarlar.denemeHakki
            if (hak > 0 && il.denemeler.length >= hak) return il
            const guncel: EgitimIlerleme = {
              ...il,
              denemeler: [...il.denemeler, { ...deneme, no: il.denemeler.length + 1 }],
              sonErisim: new Date().toISOString(),
            }
            if (surum) guncel.durum = durumHesapla(surum, guncel)
            kaydedildi = true
            return guncel
          })
          return { ilerlemeler }
        })
        return kaydedildi
      },
    }),
    {
      name: 'isghub-egitimler',
      storage: guvenliDepo,
      partialize: (s) => ({ egitimler: s.egitimler, ilerlemeler: s.ilerlemeler }),
      version: 8,
      migrate: (persistedState, version) => {
        let state = persistedState as EgitimlerState
        // v2: yeni işe özgü eğitim paketleri, mevcut kayıtlara eklenir (aynı id varsa dokunulmaz)
        if (version < 2) {
          const mevcutlar = state.egitimler ?? []
          const eksikler = [...egitimSeed, yuksekteEgitim].filter((e) => !mevcutlar.some((x) => x.id === e.id))
          state = { ...state, egitimler: [...mevcutlar, ...eksikler] }
        }
        // v3: Yüksekte Güvenli Çalışma slayt görsellerini ve kapağını yeni görsel paketiyle eşleştir.
        if (version < 3) {
          const seedSurum = yuksekteEgitim.surumler.find((sv) => sv.id === yuksekteEgitim.aktifSurumId)
          const egitimler = state.egitimler ?? []
          const yuksekteVar = egitimler.some((e) => e.id === yuksekteEgitim.id)
          state = {
            ...state,
            egitimler: yuksekteVar
              ? egitimler.map((e) => e.id !== yuksekteEgitim.id ? e : ({
                ...e,
                kapakGorsel: yuksekteEgitim.kapakGorsel,
                surumler: e.surumler.map((sv) => sv.id !== yuksekteEgitim.aktifSurumId || !seedSurum ? sv : ({
                  ...sv,
                  bolumler: seedSurum.bolumler,
                })),
              }))
              : [...egitimler, yuksekteEgitim],
          }
        }
        // v4: ön sınavı, EGT-01'in hem atanmış v2 hem güncel v3 sürümüne ekle.
        // Atamalar sürüm kimliğini koruduğu için eski atamalar da bu adımı görmelidir.
        if (version < 4) {
          state = {
            ...state,
            egitimler: (state.egitimler ?? []).map((e) => e.id !== 'EGT-01' ? e : ({
              ...e,
              surumler: e.surumler.map((sv) =>
                (sv.id === 'ES-0102' || sv.id === 'ES-0103') && !sv.onSinav
                  ? { ...sv, onSinav: temelIsgOnSinavi }
                  : sv,
              ),
            })),
          }
        }
        // v5: Yüksekte Güvenli Çalışma'nın 5 bölüm / 20 içerik ve yenilenen sınavlarını
        // yeni sürüm olarak ekle. Eski sürüm ile ona bağlı katılımcı ilerlemesi korunur.
        if (version < 5) {
          const guncelSurum = yuksekteEgitim.surumler.find((sv) => sv.id === yuksekteEgitim.aktifSurumId)
          const egitimler = state.egitimler ?? []
          const yuksekteVar = egitimler.some((e) => e.id === yuksekteEgitim.id)
          state = {
            ...state,
            egitimler: yuksekteVar && guncelSurum
              ? egitimler.map((e) => {
                if (e.id !== yuksekteEgitim.id) return e
                const oncekiler = e.surumler.map((sv) =>
                  sv.id === e.aktifSurumId ? { ...sv, durum: 'eski' as const } : sv,
                )
                return {
                  ...e,
                  aktifSurumId: guncelSurum.id,
                  durum: 'Yayında' as const,
                  guncelleme: TODAY,
                  surumler: [
                    ...oncekiler.filter((sv) => sv.id !== guncelSurum.id),
                    { ...guncelSurum, durum: 'aktif' as const },
                  ],
                }
              })
              : yuksekteVar
                ? egitimler
                : [...egitimler, yuksekteEgitim],
          }
        }
        // v6: 5 bölümlü paketin bölüm yapısını düzelt; aynı sürüm kimliği korunur,
        // böylece katılımcıların mevcut içerik ilerlemesi sıfırlanmaz.
        if (version < 6) {
          const guncelSurum = yuksekteEgitim.surumler.find((sv) => sv.id === yuksekteEgitim.aktifSurumId)
          if (guncelSurum) {
            state = {
              ...state,
              egitimler: (state.egitimler ?? []).map((e) => e.id !== yuksekteEgitim.id ? e : ({
                ...e,
                guncelleme: TODAY,
                surumler: e.surumler.map((sv) => sv.id === guncelSurum.id ? guncelSurum : sv),
              })),
            }
          }
        }
        // v7: Temel İSG içeriğini 5 bölüm / 20 görselli ders, kolay ön sınav
        // ve konuya dayalı 20 soruluk son sınavla yenile. Önceki sürüm ve
        // katılımcı ilerlemeleri korunur; mevcut atamalar kendi sürümünde kalır.
        if (version < 7) {
          const hazir = egitimSeed.find((e) => e.id === 'EGT-01')
          const mevcutlar = state.egitimler ?? []
          state = {
            ...state,
            egitimler: hazir
              ? mevcutlar.some((e) => e.id === 'EGT-01')
                ? mevcutlar.map((e) => e.id !== 'EGT-01' ? e : ({
                  ...e,
                  baslik: hazir.baslik,
                  aciklama: hazir.aciklama,
                  sureDakika: hazir.sureDakika,
                  hedefler: hazir.hedefler,
                  etiketler: hazir.etiketler,
                  kapakGorsel: hazir.kapakGorsel,
                  aktifSurumId: temelIsgSurum4.id,
                  durum: 'Yayında' as const,
                  guncelleme: TODAY,
                  surumler: [
                    ...e.surumler
                      .filter((sv) => sv.id !== temelIsgSurum4.id)
                      .map((sv) => sv.id === e.aktifSurumId ? { ...sv, durum: 'eski' as const } : sv),
                    { ...temelIsgSurum4, durum: 'aktif' as const },
                  ],
                }))
                : [...mevcutlar, hazir]
              : mevcutlar,
          }
        }
        // v8: Ön sınavlarda seçenek sırasını her denemede karıştırarak doğru
        // yanıtın sürekli aynı harfte görünmesini önle. Sorular ve kayıtlı
        // katılımcı yanıtları değişmeden kalır.
        if (version < 8) {
          const seedIds = new Set(['EGT-01', 'EGT-YUK'])
          state = {
            ...state,
            egitimler: (state.egitimler ?? []).map((egitim) => seedIds.has(egitim.id)
              ? {
                ...egitim,
                surumler: egitim.surumler.map((surum) => surum.onSinav
                  ? { ...surum, onSinav: { ...surum.onSinav, ayarlar: { ...surum.onSinav.ayarlar, sikKaristir: true } } }
                  : surum),
              }
              : egitim),
          }
        }
        if (version >= 1) return state
        const mevcut = state.egitimler?.find((e) => e.id === 'EGT-01')
        const hazir = egitimSeed.find((e) => e.id === 'EGT-01')
        if (!mevcut || !hazir || mevcut.aktifSurumId !== 'ES-0102') return state
        const eskiSurumler = mevcut.surumler.map((sv) => ({ ...sv, durum: 'eski' as const }))
        const yeniSurum = hazir.surumler.find((sv) => sv.id === 'ES-0103')
        if (!yeniSurum) return state
        return {
          ...state,
          egitimler: state.egitimler.map((e) =>
            e.id === 'EGT-01'
              ? {
                  ...hazir,
                  surumler: [...eskiSurumler, yeniSurum],
                  aktifSurumId: yeniSurum.id,
                }
              : e,
          ),
        }
      },
    },
  ),
)

export const aktifSurum = (e: Egitim): EgitimSurum =>
  e.surumler.find((sv) => sv.id === e.aktifSurumId) ?? e.surumler[e.surumler.length - 1]

export { varsayilanTamamlama }
