/*
 * Sertifika store — başvuru kuyruğu, sertifika kayıtları, şablonlar.
 * Üretimde: benzersizlik DB unique constraint + transaction ile,
 * sertifika numarası sayaç tablosundan atomik üretilmelidir.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TODAY } from '@/data/dashboard'
import {
  basvuruSeed,
  sablonSeed,
  sertifikaSeed,
  sertifikaGuncelDurum,
  type BelgeTuru,
  type Sertifika,
  type SertifikaBasvuru,
  type SertifikaSablon,
  type TasarimSnap,
} from '@/data/sertifikalar'
import { sablonDuzen, tasarimSeed, type TasarimSablon, type Yon } from '@/data/sertifika-tasarim'
import { usePersonelStore, personelAd } from '@/stores/personeller-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useAyarlarStore } from '@/stores/ayarlar-store'

let seq = 100
const yeniId = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`
const simdi = () => new Date().toISOString()
const log = (islem: string, kayit: string, kullanici?: string) =>
  useAyarlarStore.getState().logEkle({ tarih: simdi(), kullanici: kullanici ?? 'sistem', islem, kayit })

/** Eski sertifika kayıtlarına güncel eğitim sürümünden arka yüz ve konu snapshot'ı ekle. */
const sertifikalariIkiYuzluYap = (liste: Sertifika[], tasarimlar: TasarimSablon[]): Sertifika[] => {
  const egitimler = useEgitimlerStore.getState().egitimler
  const varsayilan = tasarimlar.find((t) => t.varsayilan && !t.arsiv) ?? tasarimlar[0]
  if (!varsayilan) return liste

  return liste.map((sertifika) => {
    const sablon = tasarimlar.find((t) => t.id === (sertifika.tasarim?.sablonId ?? sertifika.sablonId)) ?? varsayilan
    const yon = sertifika.tasarim?.yon ?? sablon.yon
    const egitim = egitimler.find((e) => e.id === sertifika.egitimId)
    const surum = egitim?.surumler.find((s) => s.id === sertifika.surumId)
    const egitimKonulari = sertifika.egitimKonulari?.length
      ? sertifika.egitimKonulari
      : surum?.bolumler.flatMap((bolum) => bolum.icerikler.map((icerik) => ({ bolum: bolum.baslik, baslik: icerik.baslik, sureDakika: icerik.sureDakika }))) ?? []
    const arkaElemanlar = sablonDuzen(sablon, yon, 'arka')
    const tasarim: TasarimSnap = {
      sablonId: sablon.id,
      sablonAd: sertifika.tasarim?.sablonAd ?? sablon.ad,
      surum: sertifika.tasarim?.surum ?? sablon.surum,
      yon,
      zemin: sertifika.tasarim?.zemin ?? sablon.zemin,
      font: sertifika.tasarim?.font ?? sablon.font,
      elemanlar: sertifika.tasarim?.elemanlar?.length ? sertifika.tasarim.elemanlar : sablonDuzen(sablon, yon),
      arkaElemanlar,
      arkaZemin: sertifika.tasarim?.arkaZemin ?? sertifika.tasarim?.zemin ?? sablon.zemin,
    }
    const degisti = !sertifika.tasarim?.elemanlar?.length
      || JSON.stringify(sertifika.tasarim.arkaElemanlar ?? []) !== JSON.stringify(arkaElemanlar)
      || !sertifika.egitimKonulari?.length
    if (!degisti) return sertifika

    const eskiTasarimVar = !!sertifika.tasarim?.elemanlar?.length
    return {
      ...sertifika,
      sablonId: sablon.id,
      sablonSnap: eskiTasarimVar ? sertifika.sablonSnap : {
        baslik: sablon.ad,
        anaRenk: '#27272A',
        vurguRenk: '#F59E0B',
        imzalar: sertifika.sablonSnap.imzalar,
      },
      egitimKonulari,
      tasarim,
      gecmis: [...sertifika.gecmis, {
        tarih: TODAY,
        kullanici: 'Sistem',
        islem: 'Sertifika arka yüz tasarımı yenilendi',
        not: 'Yeni konu listesi düzeni uygulandı; ön yüz ve eski PDF sürümleri korundu.',
      }],
    }
  })
}

/** Tahmin edilmesi zor doğrulama kodu — üretimde crypto_random + unique index */
const dogrulamaKoduUret = (): string => {
  const a = new Uint8Array(6)
  crypto.getRandomValues(a)
  return [...a].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10)
}

interface SertifikaState {
  basvurular: SertifikaBasvuru[]
  sertifikalar: Sertifika[]
  sablonlar: SertifikaSablon[]
  /** v2 — eleman-tabanlı tasarım şablonları */
  tasarimlar: TasarimSablon[]
  /** Üretilen son sertifika numarası sayacı */
  sertifikaSayac: number
  /** İlerlemeyi tarayıp uygun tamamlamalar için başvuru üretir — idempotent */
  tara: () => number
  inceleAl: (id: string, kullanici: string) => void
  onayla: (
    id: string,
    giris: { kullanici: string; sablonId: string; duzenlenmeTarihi: string; gecerlilikTarihi?: string; not?: string; katilimDetayi?: import('@/data/sertifikalar').SertifikaKatilimDetayi },
  ) => Sertifika | null
  reddet: (id: string, giris: { kullanici: string; neden: string; aciklama: string }) => void
  tekrarGonder: (id: string, kullanici: string) => void
  iptalEt: (sertifikaId: string, giris: { kullanici: string; neden: string }) => void
  sablonGuncelle: (id: string, patch: Partial<SertifikaSablon>) => void
  sablonEkle: (s: Omit<SertifikaSablon, 'id'>) => void
  /* ------- Tasarım Merkezi (v2) ------- */
  tasarimKaydet: (id: string, patch: Partial<TasarimSablon>, kullanici?: string) => void
  tasarimEkle: (t: Omit<TasarimSablon, 'id' | 'surum' | 'olusturma' | 'guncelleme' | 'kullanimSayisi'>) => TasarimSablon
  tasarimKopyala: (id: string) => TasarimSablon | null
  tasarimArsivle: (id: string, arsiv: boolean) => void
  tasarimVarsayilan: (id: string) => void
  /** Sertifika alan güncellemesi — kaynak bağlı alanlar (tamamlanma, sınav, sürüm) burada değişmez */
  sertifikaDuzenle: (id: string, patch: { duzenlenmeTarihi?: string; gecerlilikTarihi?: string; aciklama?: string }, kullanici: string) => void
  /** Şablon değiştir — numara korunur, yeni anlık görüntü + PDF sürümü üretilir */
  sablonDegistir: (id: string, yeniSablonId: string, yon: Yon, kullanici: string) => void
  pdfYenidenUret: (id: string, kullanici: string, sebep: string) => void
}

/**
 * Bir atama+personel tamamlaması sertifika başvurusuna uygun mu?
 * İlerleme 'Tamamlandı' veya 'Onay Bekliyor' ise koşullar sağlanmış demektir
 * (durumHesapla zorunlu içerik + sınav koşulunu zaten uygular).
 */
export const basvuruUygunMu = (personelId: string, atamaId: string) => {
  const { ilerlemeler } = useEgitimlerStore.getState()
  const il = ilerlemeler.find(
    (i) => i.hesapId === personelId && i.atamaId === atamaId,
  )
  return il?.durum === 'Tamamlandı' || il?.durum === 'Onay Bekliyor' ? il : null
}

export const useSertifikaStore = create<SertifikaState>()(
  persist(
    (set, get) => ({
      basvurular: basvuruSeed,
      sertifikalar: sertifikalariIkiYuzluYap(sertifikaSeed, tasarimSeed),
      sablonlar: sablonSeed,
      tasarimlar: tasarimSeed,
      sertifikaSayac: sertifikaSeed.length,

      tara: () => {
        const { atamalar } = usePersonelStore.getState()
        const { ilerlemeler } = useEgitimlerStore.getState()
        const yeniler: SertifikaBasvuru[] = []
        for (const a of atamalar) {
          if (a.durum === 'İptal') continue
          for (const pid of a.personelIds) {
            // aynı atama+personel için tek başvuru — mükerrer engeli
            if (get().basvurular.some((b) => b.atamaId === a.id && b.personelId === pid)) continue
            if (yeniler.some((b) => b.atamaId === a.id && b.personelId === pid)) continue
            const il = ilerlemeler.find((i) => i.hesapId === pid && i.atamaId === a.id)
            if (!il || (il.durum !== 'Tamamlandı' && il.durum !== 'Onay Bekliyor')) continue
            const son = il.denemeler[il.denemeler.length - 1]
            const tamTarih =
              [...il.denemeler].reverse().find((d) => d.gecti)?.tarih.slice(0, 10) ??
              Object.values(il.icerikler)
                .map((x) => x.tamamlanmaTarihi)
                .filter(Boolean)
                .sort()
                .at(-1) ??
              il.sonErisim.slice(0, 10)
            yeniler.push({
              id: yeniId('SBV'),
              atamaId: a.id,
              personelId: pid,
              egitimId: a.egitimId,
              surumId: a.surumId,
              basvuruTarihi: TODAY,
              durum: 'İnceleme Bekliyor',
              tamamlanmaTarihi: tamTarih,
              sinavPuani: son?.puan,
              sinavGecti: son?.gecti,
              denemeSayisi: il.denemeler.length,
              olaylar: [
                { tarih: simdi(), kullanici: 'Sistem', islem: 'Başvuru oluşturuldu — eğitim tamamlandı' },
              ],
            })
          }
        }
        if (yeniler.length) {
          set((s) => ({ basvurular: [...yeniler, ...s.basvurular] }))
          log('Sertifika başvurusu', `${yeniler.length} yeni başvuru otomatik oluşturuldu`)
        }
        return yeniler.length
      },

      inceleAl: (id, kullanici) =>
        set((s) => ({
          basvurular: s.basvurular.map((b) =>
            b.id === id && b.durum === 'İnceleme Bekliyor'
              ? {
                  ...b,
                  durum: 'İnceleniyor',
                  inceleyen: kullanici,
                  olaylar: [...b.olaylar, { tarih: simdi(), kullanici, islem: 'İncelemeye alındı' }],
                }
              : b,
          ),
        })),

      onayla: (id, giris) => {
        const b = get().basvurular.find((x) => x.id === id)
        if (!b || b.durum === 'Onaylandı' || b.durum === 'İptal Edildi') return null
        const { personeller } = usePersonelStore.getState()
        const { egitimler } = useEgitimlerStore.getState()
        const { firmalar } = useFirmalarStore.getState()
        const p = personeller.find((x) => x.id === b.personelId)
        const a = usePersonelStore.getState().atamalar.find((x) => x.id === b.atamaId)
        const e = egitimler.find((x) => x.id === b.egitimId)
        const sv = e?.surumler.find((x) => x.id === b.surumId)
        const egitimKonulari = sv?.bolumler.flatMap((bolum) => bolum.icerikler.map((icerik) => ({ bolum: bolum.baslik, baslik: icerik.baslik, sureDakika: icerik.sureDakika }))) ?? []
        // v2 tasarım şablonu öncelikli — yoksa eski tip şablon
        const tsb = get().tasarimlar.find((x) => x.id === giris.sablonId) ?? get().tasarimlar.find((x) => x.varsayilan)
        const sablon = tsb ? undefined : get().sablonlar.find((x) => x.id === giris.sablonId) ?? get().sablonlar.find((x) => x.varsayilan)
        if (!p || !a || !e || (!sablon && !tsb)) return null
        const sablonRef = tsb ? {
          belgeTuru: tsb.belgeTuru,
          baslik: tsb.ad,
          anaRenk: '#27272A',
          vurguRenk: '#F59E0B',
          imzalar: [{ unvan: 'OSGB Sorumlu Müdürü', adSoyad: giris.kullanici }],
        } : sablon!
        const tasarimSnap: TasarimSnap | undefined = tsb
          ? {
              sablonId: tsb.id,
              sablonAd: tsb.ad,
              surum: tsb.surum,
              yon: tsb.yon,
              zemin: tsb.zemin,
              font: tsb.font,
              elemanlar: sablonDuzen(tsb, tsb.yon),
              arkaElemanlar: sablonDuzen(tsb, tsb.yon, 'arka'),
              arkaZemin: tsb.zemin,
            }
          : undefined

        const onek = useAyarlarStore.getState().belge.sertifikaOnEk || 'SRT'
        const no = `${onek}-${TODAY.slice(0, 4)}-${String(get().sertifikaSayac + 1).padStart(6, '0')}`
        const crt: Sertifika = {
          id: yeniId('CRT'),
          sertifikaNo: no,
          dogrulamaKodu: dogrulamaKoduUret(),
          basvuruId: b.id,
          atamaId: b.atamaId,
          personelId: b.personelId,
          firmaId: a.firmaId,
          egitimId: b.egitimId,
          surumId: b.surumId,
          personelAd: personelAd(p),
          personelGorev: p.gorev || undefined,
          personelTc: tsb && sablonDuzen(tsb, tsb.yon).some((el) => el.tur === 'alan' && el.alan === 'employee_id') ? p.tc || undefined : undefined,
          firmaAd: firmalar.find((f) => f.id === a.firmaId)?.unvan ?? a.firmaId,
          egitimAd: e.baslik,
          egitimSurumNo: sv?.no ?? 0,
          egitimSure: e.sureDakika,
          egitimKonulari,
          katilimDetayi: giris.katilimDetayi,
          egitimKategori: e.kategori,
          belgeTuru: sablonRef.belgeTuru,
          sablonId: tsb?.id ?? sablon!.id,
          sablonSnap: {
            baslik: sablonRef.baslik,
            anaRenk: sablonRef.anaRenk,
            vurguRenk: sablonRef.vurguRenk,
            imzalar: [...sablonRef.imzalar],
          },
          tasarim: tasarimSnap,
          pdfSurumler: tasarimSnap
            ? [{ surum: 1, tarih: simdi(), kullanici: giris.kullanici, sebep: 'İlk üretim', tasarim: tasarimSnap }]
            : undefined,
          tamamlanmaTarihi: b.tamamlanmaTarihi,
          duzenlenmeTarihi: giris.duzenlenmeTarihi,
          gecerlilikTarihi: giris.gecerlilikTarihi || undefined,
          onaylayan: giris.kullanici,
          onayTarihi: TODAY,
          durum: 'Aktif',
          gecmis: [
            ...b.olaylar,
            { tarih: simdi(), kullanici: giris.kullanici, islem: `Onaylandı — ${no} düzenlendi`, not: giris.not },
          ],
        }
        set((s) => ({
          sertifikaSayac: s.sertifikaSayac + 1,
          sertifikalar: [crt, ...s.sertifikalar],
          basvurular: s.basvurular.map((x) =>
            x.id === id
              ? {
                  ...x,
                  durum: 'Onaylandı' as const,
                  onaylayan: giris.kullanici,
                  onayTarihi: TODAY,
                  sertifikaId: crt.id,
                  olaylar: crt.gecmis,
                }
              : x,
          ),
        }))
        log('Sertifika onaylandı', `${no} — ${crt.personelAd} / ${crt.egitimAd}`, giris.kullanici)
        return crt
      },

      reddet: (id, giris) => {
        set((s) => ({
          basvurular: s.basvurular.map((b) =>
            b.id === id && (b.durum === 'İnceleme Bekliyor' || b.durum === 'İnceleniyor' || b.durum === 'Eksik Koşul')
              ? {
                  ...b,
                  durum: 'Reddedildi' as const,
                  retNedeni: giris.neden,
                  retAciklama: giris.aciklama,
                  inceleyen: giris.kullanici,
                  olaylar: [
                    ...b.olaylar,
                    { tarih: simdi(), kullanici: giris.kullanici, islem: 'Reddedildi', not: `${giris.neden} — ${giris.aciklama}` },
                  ],
                }
              : b,
          ),
        }))
        log('Sertifika başvurusu reddedildi', `${id} — ${giris.neden}`, giris.kullanici)
      },

      /** Ret/eksik sonrası eksiklik giderilince tekrar kuyruğa alınır */
      tekrarGonder: (id, kullanici) =>
        set((s) => ({
          basvurular: s.basvurular.map((b) =>
            b.id === id && (b.durum === 'Reddedildi' || b.durum === 'Eksik Koşul')
              ? {
                  ...b,
                  durum: 'İnceleme Bekliyor' as const,
                  retNedeni: undefined,
                  retAciklama: undefined,
                  olaylar: [...b.olaylar, { tarih: simdi(), kullanici, islem: 'Tekrar incelemeye gönderildi' }],
                }
              : b,
          ),
        })),

      iptalEt: (sertifikaId, giris) => {
        set((s) => ({
          sertifikalar: s.sertifikalar.map((c) =>
            c.id === sertifikaId && c.durum !== 'İptal Edildi'
              ? {
                  ...c,
                  durum: 'İptal Edildi' as const,
                  iptalNedeni: giris.neden,
                  iptalTarihi: TODAY,
                  gecmis: [...c.gecmis, { tarih: simdi(), kullanici: giris.kullanici, islem: 'Sertifika iptal edildi', not: giris.neden }],
                }
              : c,
          ),
        }))
        const c = get().sertifikalar.find((x) => x.id === sertifikaId)
        log('Sertifika iptal edildi', `${c?.sertifikaNo ?? sertifikaId} — ${giris.neden}`, giris.kullanici)
      },

      sablonGuncelle: (id, patch) =>
        set((s) => ({
          sablonlar: s.sablonlar.map((x) =>
            x.id === id
              ? {
                  ...x,
                  ...patch,
                  // varsayılan tekil tutulur
                  ...(patch.varsayilan ? {} : {}),
                }
              : patch.varsayilan
                ? { ...x, varsayilan: false }
                : x,
          ),
        })),

      sablonEkle: (s0) =>
        set((s) => ({ sablonlar: [...s.sablonlar, { ...s0, id: yeniId('STB') }] })),

      /* --------------------- Tasarım Merkezi (v2) --------------------- */

      tasarimEkle: (t) => {
        const yeni: TasarimSablon = { ...t, id: yeniId('TSB'), surum: 1, olusturma: TODAY, guncelleme: TODAY, kullanimSayisi: 0 }
        set((s) => ({ tasarimlar: [...s.tasarimlar, yeni] }))
        log('Sertifika şablonu oluşturuldu', `${yeni.ad} (${yeni.id})`)
        return yeni
      },

      tasarimKaydet: (id, patch, kullanici) => {
        set((s) => ({
          tasarimlar: s.tasarimlar.map((t) =>
            t.id === id ? { ...t, ...patch, surum: t.surum + (patch.duzenYatay || patch.duzenDikey || patch.duzenArkaYatay || patch.duzenArkaDikey ? 1 : 0), guncelleme: TODAY } : t,
          ),
        }))
        const t = get().tasarimlar.find((x) => x.id === id)
        if (t && (patch.duzenYatay || patch.duzenDikey || patch.duzenArkaYatay || patch.duzenArkaDikey))
          log('Sertifika şablonu düzenlendi', `${t.ad} → sürüm ${t.surum}`, kullanici)
      },

      tasarimKopyala: (id) => {
        const kaynak = get().tasarimlar.find((t) => t.id === id)
        if (!kaynak) return null
        return get().tasarimEkle({
          ...kaynak,
          ad: `${kaynak.ad} (Kopya)`,
          varsayilan: false,
          duzenYatay: kaynak.duzenYatay.map((e) => ({ ...e, id: `e${Math.random().toString(36).slice(2, 8)}` })),
          duzenDikey: kaynak.duzenDikey.map((e) => ({ ...e, id: `e${Math.random().toString(36).slice(2, 8)}` })),
          duzenArkaYatay: sablonDuzen(kaynak, 'yatay', 'arka').map((e) => ({ ...e, id: `e${Math.random().toString(36).slice(2, 8)}` })),
          duzenArkaDikey: sablonDuzen(kaynak, 'dikey', 'arka').map((e) => ({ ...e, id: `e${Math.random().toString(36).slice(2, 8)}` })),
        })
      },

      tasarimArsivle: (id, arsiv) =>
        set((s) => ({
          tasarimlar: s.tasarimlar.map((t) =>
            t.id === id ? { ...t, arsiv, aktif: arsiv ? false : t.aktif, varsayilan: arsiv ? false : t.varsayilan, guncelleme: TODAY } : t,
          ),
        })),

      tasarimVarsayilan: (id) =>
        set((s) => ({
          tasarimlar: s.tasarimlar.map((t) => ({ ...t, varsayilan: t.id === id })),
        })),

      sertifikaDuzenle: (id, patch, kullanici) => {
        set((s) => ({
          sertifikalar: s.sertifikalar.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...(patch.duzenlenmeTarihi !== undefined && { duzenlenmeTarihi: patch.duzenlenmeTarihi }),
                  ...(patch.gecerlilikTarihi !== undefined && { gecerlilikTarihi: patch.gecerlilikTarihi || undefined }),
                  ...(patch.aciklama !== undefined && { aciklama: patch.aciklama }),
                  gecmis: [...c.gecmis, { tarih: simdi(), kullanici, islem: 'Sertifika bilgileri düzenlendi' }],
                }
              : c,
          ),
        }))
        const c = get().sertifikalar.find((x) => x.id === id)
        log('Sertifika düzenlendi', `${c?.sertifikaNo ?? id}`, kullanici)
      },

      sablonDegistir: (id, yeniSablonId, yon, kullanici) => {
        const c = get().sertifikalar.find((x) => x.id === id)
        const t = get().tasarimlar.find((x) => x.id === yeniSablonId)
        if (!c || !t) return
        const snap: TasarimSnap = {
          sablonId: t.id, sablonAd: t.ad, surum: t.surum, yon,
          zemin: t.zemin, font: t.font, elemanlar: sablonDuzen(t, yon),
          arkaElemanlar: sablonDuzen(t, yon, 'arka'), arkaZemin: t.zemin,
        }
        set((s) => ({
          sertifikalar: s.sertifikalar.map((x) =>
            x.id === id
              ? {
                  ...x,
                  tasarim: snap,
                  sablonId: t.id,
                  sablonSnap: { baslik: t.ad, anaRenk: '#27272A', vurguRenk: '#F59E0B', imzalar: x.sablonSnap.imzalar },
                  pdfSurumler: [
                    ...(x.pdfSurumler ?? []),
                    { surum: (x.pdfSurumler?.length ?? 0) + 1, tarih: simdi(), kullanici, sebep: `Şablon değiştirildi → ${t.ad}`, tasarim: snap },
                  ],
                  gecmis: [...x.gecmis, { tarih: simdi(), kullanici, islem: `Şablon değiştirildi — ${t.ad} (${yon})` }],
                }
              : x,
          ),
          tasarimlar: s.tasarimlar.map((x) => (x.id === t.id ? { ...x, kullanimSayisi: x.kullanimSayisi + 1 } : x)),
        }))
        log('Sertifika şablonu değiştirildi', `${c.sertifikaNo} → ${t.ad}`, kullanici)
      },

      pdfYenidenUret: (id, kullanici, sebep) => {
        const c = get().sertifikalar.find((x) => x.id === id)
        if (!c?.tasarim) return
        set((s) => ({
          sertifikalar: s.sertifikalar.map((x) =>
            x.id === id
              ? {
                  ...x,
                  pdfSurumler: [
                    ...(x.pdfSurumler ?? []),
                    { surum: (x.pdfSurumler?.length ?? 0) + 1, tarih: simdi(), kullanici, sebep, tasarim: x.tasarim! },
                  ],
                  gecmis: [...x.gecmis, { tarih: simdi(), kullanici, islem: 'PDF yeniden oluşturuldu', not: sebep }],
                }
              : x,
          ),
        }))
        log('Sertifika PDF yeniden üretildi', `${c.sertifikaNo} — ${sebep}`, kullanici)
      },
    }),
    {
      name: 'isghub-sertifikalar',
      // Arka yüz konu listesi yenilendi; aktif sertifikaların arka yüzü güncellenir.
      version: 5,
      migrate: (p) => {
        const s = (p ?? {}) as Partial<SertifikaState>
        const varsayilan = tasarimSeed.find((t) => t.varsayilan && !t.arsiv) ?? tasarimSeed[0]
        const tasarimlar = s.tasarimlar?.length
          ? [
              ...s.tasarimlar.map((t) => {
                const yeni = tasarimSeed.find((x) => x.id === t.id) ?? varsayilan
                return {
                  ...yeni,
                  ...t,
                  duzenArkaYatay: yeni.duzenArkaYatay,
                  duzenArkaDikey: yeni.duzenArkaDikey,
                  surum: Math.max(t.surum, yeni.surum + 1),
                  guncelleme: TODAY,
                }
              }),
              ...tasarimSeed.filter((t) => !s.tasarimlar!.some((x) => x.id === t.id)),
            ]
          : tasarimSeed
        const sertifikalar = sertifikalariIkiYuzluYap(s.sertifikalar ?? sertifikaSeed, tasarimlar)
        return {
          basvurular: s.basvurular ?? basvuruSeed,
          sertifikalar,
          tasarimlar,
          sablonlar: s.sablonlar?.length ? s.sablonlar : sablonSeed,
          sertifikaSayac: typeof s.sertifikaSayac === 'number' ? s.sertifikaSayac : (s.sertifikalar?.length ?? 0),
        }
      },
      partialize: (s) => ({
        basvurular: s.basvurular,
        sertifikalar: s.sertifikalar,
        sablonlar: s.sablonlar,
        tasarimlar: s.tasarimlar,
        sertifikaSayac: s.sertifikaSayac,
      }),
    },
  ),
)

/* İlerleme değiştiğinde yeni tamamlamaları otomatik başvuruya çevir.
 * (egitimler-store → sertifikalar-store tek yönlü bağımlılık; döngü yok) */
useEgitimlerStore.subscribe((s, prev) => {
  if (s.ilerlemeler !== prev.ilerlemeler) useSertifikaStore.getState().tara()
})

export { sertifikaGuncelDurum }
export type { BelgeTuru }
