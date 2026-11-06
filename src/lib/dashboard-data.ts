/*
 * Dashboard veri katmanı — bütün store'lardan tek seferde okuyup dashboard'un
 * ihtiyaç duyduğu bütün türetilmiş veriyi hesaplar. Üretimde bu fonksiyonun
 * karşılığı tek bir optimize edilmiş dashboard API uç noktasıdır; izin ve
 * kapsam filtreleri burada UI içindir, sunucuda aynen uygulanmalıdır.
 */
import { useMemo } from 'react'
import { TODAY } from '@/data/dashboard'
import { hesapGorunenAd } from '@/data/ekip'
import { aksiyonAcik, aksiyonGecikmis, guncelDurum, yenilemeYaklasan } from '@/data/risk'
import { ayKisa, gunFarki, gunKaydir, sonAylar, zamanOnce } from '@/lib/date'
import { izinVar } from '@/lib/izin'
import { useAuthStore } from '@/stores/auth-store'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useOlaylarStore } from '@/stores/olaylar-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useRiskStore } from '@/stores/risk-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'

/* ------------------------------ Tarih aralığı ------------------------------ */

export type AralikKey = 'bugun' | '7g' | '30g' | '90g' | 'yil' | 'ozel'

export const ARALIK_SECENEKLERI: { key: AralikKey; label: string }[] = [
  { key: 'bugun', label: 'Bugün' },
  { key: '7g', label: 'Son 7 gün' },
  { key: '30g', label: 'Son 30 gün' },
  { key: '90g', label: 'Son 90 gün' },
  { key: 'yil', label: 'Bu yıl' },
  { key: 'ozel', label: 'Özel aralık' },
]

export interface Aralik {
  key: AralikKey
  label: string
  baslangic: string
  bitis: string
}

export const aralikCoz = (key: AralikKey, bas?: string, bit?: string): Aralik => {
  const label = ARALIK_SECENEKLERI.find((a) => a.key === key)?.label ?? key
  switch (key) {
    case 'bugun': return { key, label, baslangic: TODAY, bitis: TODAY }
    case '7g': return { key, label, baslangic: gunKaydir(TODAY, -6), bitis: TODAY }
    case '30g': return { key, label, baslangic: gunKaydir(TODAY, -29), bitis: TODAY }
    case '90g': return { key, label, baslangic: gunKaydir(TODAY, -89), bitis: TODAY }
    case 'yil': return { key, label, baslangic: `${TODAY.slice(0, 4)}-01-01`, bitis: TODAY }
    case 'ozel': return { key, label, baslangic: bas ?? TODAY, bitis: bit ?? TODAY }
  }
}

/** Seçilen aralığın hemen öncesindeki eş uzunluktaki pencere (değişim karşılaştırması) */
export const oncekiAralik = (a: Aralik): Aralik => {
  const gun = gunFarki(a.baslangic, a.bitis) + 1
  return { ...a, baslangic: gunKaydir(a.baslangic, -gun), bitis: gunKaydir(a.baslangic, -1) }
}

const icinde = (tarih: string | undefined, a: Aralik) => {
  if (!tarih) return false
  const t = tarih.slice(0, 10)
  return t >= a.baslangic && t <= a.bitis
}

/* --------------------------------- Tipler --------------------------------- */

export interface Kpi {
  id: string
  baslik: string
  deger: number
  alt: string
  /** Önceki eş pencereye göre yeni kayıt farkı — veri yoksa undefined */
  delta?: number
  spark?: number[]
  link: string
}

export type GorevOncelik = 'kritik' | 'yuksek' | 'orta'

export interface Gorev {
  id: string
  tur: string
  baslik: string
  firma: string
  tarih: string
  sorumlu?: string
  oncelik: GorevOncelik
  durum: string
  link: string
  /** Risk aksiyonuysa satır içi tamamlama sunulur */
  aksiyonId?: string
}

export interface Bildirim {
  id: string
  seviye: GorevOncelik
  baslik: string
  detay: string
  tarih: string
  link: string
}

export interface Aktivite {
  id: string
  kullanici: string
  islem: string
  kayit: string
  zaman: string
  link?: string
}

export interface HizliLink {
  baslik: string
  aciklama: string
  link: string
  icon: 'firmalar' | 'personeller' | 'olaylar' | 'katip' | 'egitimler' | 'sertifikalar' | 'risk' | 'ayarlar'
}

export interface DashboardVeri {
  kpis: Kpi[]
  gorevler: Gorev[]
  bildirimler: Bildirim[]
  aktiviteler: Aktivite[]
  trend: { ay: string; etiket: string; aksiyon: number; olay: number; atama: number }[]
  riskDagilim: { seviye: string; adet: number; renk: string }[]
  aksiyonDurum: { durum: string; adet: number; renk: string }[]
  firmaAcik: { ad: string; adet: number }[]
  egitim: { aktifAtama: number; gecikmis: number; ilerlemeToplam: number; tamamlanan: number; oran: number }
  firmaOzet: { aktif: number; pasif: number; yeni: number; personelTop5: { ad: string; adet: number }[] }
  hizliLinkler: HizliLink[]
}

/* ---------------------------- Kayıt→rota eşleşmesi --------------------------- */

const kayitLink = (kayit: string): string | undefined => {
  const k = kayit.trim()
  if (/^(RD-|AK-)/.test(k)) return k.startsWith('RD-') ? `/panel/risk/${k.split(' ')[0]}` : '/panel/aksiyonlar'
  if (/^(OL-)/.test(k)) return '/panel/olaylar'
  if (/^(FR-)/.test(k)) return `/panel/firmalar/${k.split(' ')[0]}`
  const onek = useAyarlarStore.getState().belge.sertifikaOnEk || 'SRT'
  if (k.startsWith(`${onek}-`) || /^(SBV-|CRT-|SRT-|HT-)/.test(k)) return '/panel/sertifikalar'
  if (/^(KT-)/.test(k)) return '/panel/isg-katip'
  if (/^(EA-|ILR-)/.test(k)) return '/panel/egitim-atamalari'
  if (/^(EGT-|EG-)/.test(k)) return '/panel/egitimler'
  if (/^(PRS-|USR-)/.test(k)) return '/panel/ekip'
  if (/^(FP-)/.test(k)) return '/panel/personeller'
  return undefined
}

/* ------------------------------ Ana veri hook'u ---------------------------- */

const SEV_RENK: Record<string, string> = { 'Düşük': '#22C55E', 'Orta': '#F59E0B', 'Yüksek': '#F97316', 'Çok Yüksek': '#EF4444' }
const AKD_RENK: Record<string, string> = { 'Bekliyor': '#71717A', 'Devam Ediyor': '#0EA5E9', 'Kontrol Bekliyor': '#8B5CF6', 'Tamamlandı': '#10B981', 'İptal Edildi': '#3F3F46' }
const ONCELIK_MAP: Record<string, GorevOncelik> = { Kritik: 'kritik', 'Yüksek': 'yuksek', Orta: 'orta', 'Düşük': 'orta' }

export function useDashboardVerisi(aralik: Aralik): DashboardVeri {
  const user = useAuthStore((s) => s.user)
  const { firmalar, katip } = useFirmalarStore()
  const { personeller, atamalar } = usePersonelStore()
  const { egitimler, ilerlemeler } = useEgitimlerStore()
  const { basvurular, sertifikalar } = useSertifikaStore()
  const { degerlendirmeler, tehlikeler, aksiyonlar } = useRiskStore()
  const { olaylar } = useOlaylarStore()
  const { uyeler, hesaplar, gorevlendirmeler } = useEkipStore()
  const { loglar } = useAyarlarStore()

  return useMemo(() => {
    const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
    const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.name ?? '')
    const izin = (k: string) => izinVar(hesap, k)
    const onceki = oncekiAralik(aralik)

    // Modül bazlı kapsam → görünür firma kümesi ('kendi' = firma kısıtı yok,
    // yalnız kullanıcının oluşturduğu kayıtlar — kapsam.ts ile aynı semantik)
    const kapsamFirma = (modul: string): Set<string> | null => {
      const k = hesap?.kapsam?.[modul]
      if (!k || k.tip === 'tumu' || k.tip === 'kendi') return null
      if (k.tip === 'secili') return new Set(k.firmalar ?? [])
      return new Set(
        gorevlendirmeler.filter((g) => g.personelId === hesap?.personelId && g.durum === 'Aktif').map((g) => g.firmaId),
      )
    }
    const gor = (modul: string, firmaId?: string) => {
      const set = kapsamFirma(modul)
      return !firmaId || !set || set.has(firmaId)
    }
    const gorKayit = (modul: string, firmaId: string | undefined, olusturan?: string) => {
      if (!gor(modul, firmaId)) return false
      if (hesap?.kapsam?.[modul]?.tip === 'kendi' && olusturan && olusturan !== kullanici) return false
      return true
    }

    const firmalarG = firmalar.filter((f) => gor('firmalar', f.id))
    const personellerG = personeller.filter((p) => gor('personeller', p.firmaId))
    const aksiyonlarG = aksiyonlar.filter((a) => gorKayit('risk', a.firmaId, a.olusturan))
    const degerlendirmelerG = degerlendirmeler.filter((d) => gorKayit('risk', d.firmaId, d.olusturan))
    const tehlikelerG = tehlikeler.filter((t) => !t.silindi && degerlendirmelerG.some((d) => d.id === t.degerlendirmeId))
    const olaylarG = olaylar.filter((o) => gor('olaylar', o.firmaId))
    const atamalarG = atamalar.filter((a) => gorKayit('personeller', a.firmaId, a.olusturan))
    const sertifikalarG = sertifikalar.filter((s) => gor('sertifikalar', s.firmaId))

    const aylikSayi = (liste: { tarih: string }[]) => {
      const aylar = sonAylar(TODAY, 6)
      return aylar.map((ay) => liste.filter((x) => x.tarih.slice(0, 7) === ay).length)
    }

    const delta = (liste: { tarih: string }[]) => {
      const simdi = liste.filter((x) => icinde(x.tarih, aralik)).length
      const once = liste.filter((x) => icinde(x.tarih, onceki)).length
      return simdi === 0 && once === 0 ? undefined : simdi - once
    }

    /* --------------------------------- KPI'lar -------------------------------- */

    const kpis: Kpi[] = []

    if (izin('firmalar.goruntule')) {
      const aktif = firmalarG.filter((f) => f.durum === 'Aktif')
      kpis.push({
        id: 'firma', baslik: 'Aktif firma', deger: aktif.length,
        alt: `${firmalarG.length} toplam kayıt`,
        delta: delta(firmalarG.map((f) => ({ tarih: f.islemGecmisi[0]?.tarih ?? f.hizmetBaslangic }))),
        spark: aylikSayi(firmalarG.map((f) => ({ tarih: f.islemGecmisi[0]?.tarih ?? f.hizmetBaslangic }))),
        link: '/panel/firmalar',
      })
    }
    if (izin('personeller.goruntule')) {
      const aktif = personellerG.filter((p) => p.durum === 'Aktif')
      kpis.push({
        id: 'personel', baslik: 'Aktif personel', deger: aktif.length,
        alt: `${personellerG.length} kayıtlı çalışan`,
        delta: delta(personellerG.map((p) => ({ tarih: p.olusturma }))),
        spark: aylikSayi(personellerG.map((p) => ({ tarih: p.olusturma }))),
        link: '/panel/personeller',
      })
    }
    if (izin('risk.goruntule')) {
      const acik = aksiyonlarG.filter(aksiyonAcik)
      const gec = aksiyonlarG.filter(aksiyonGecikmis)
      kpis.push({
        id: 'aksiyon', baslik: 'Açık risk aksiyonu', deger: acik.length,
        alt: gec.length ? `${gec.length} gecikmiş` : 'Gecikmiş yok',
        delta: delta(aksiyonlarG.map((a) => ({ tarih: a.olusturma }))),
        spark: aylikSayi(aksiyonlarG.map((a) => ({ tarih: a.olusturma }))),
        link: '/panel/aksiyonlar',
      })
    }
    if (izin('sertifikalar.goruntule')) {
      const bekleyen = basvurular.filter((b) => b.durum === 'İnceleme Bekliyor' || b.durum === 'İnceleniyor')
      kpis.push({
        id: 'sertifika', baslik: 'Onay bekleyen sertifika', deger: bekleyen.length,
        alt: `${sertifikalarG.filter((s) => s.durum === 'Aktif').length} aktif sertifika`,
        delta: delta(basvurular.map((b) => ({ tarih: b.basvuruTarihi }))),
        link: '/panel/sertifika-onay',
      })
    }
    if (izin('egitimler.goruntule')) {
      const aktif = atamalarG.filter((a) => a.durum === 'Aktif')
      const gec = aktif.filter((a) => a.sonTarih < TODAY)
      kpis.push({
        id: 'egitim', baslik: 'Aktif eğitim ataması', deger: aktif.length,
        alt: gec.length ? `${gec.length} süresi geçmiş` : `${egitimler.filter((e) => e.durum === 'Yayında').length} yayında eğitim`,
        delta: delta(atamalarG.map((a) => ({ tarih: a.atamaTarihi }))),
        link: '/panel/egitim-atamalari',
      })
    }
    if (izin('olaylar.goruntule')) {
      const acik = olaylarG.filter((o) => o.durum !== 'Kapatıldı')
      const yeni = olaylarG.filter((o) => o.durum === 'Yeni Bildirildi')
      kpis.push({
        id: 'olay', baslik: 'Açık olay', deger: acik.length,
        alt: `${yeni.length} inceleme bekliyor`,
        delta: delta(olaylarG.map((o) => ({ tarih: o.tarih }))),
        spark: aylikSayi(olaylarG.map((o) => ({ tarih: o.tarih }))),
        link: '/panel/olaylar',
      })
    }

    /* ------------------------- Günlük operasyon öğeleri ------------------------ */

    const gorevler: Gorev[] = []

    for (const a of aksiyonlarG) {
      if (!aksiyonAcik(a)) continue
      const gecikmis = a.hedefTarih < TODAY
      const yakin = gunFarki(TODAY, a.hedefTarih) <= 7
      if (!gecikmis && !yakin) continue
      gorevler.push({
        id: `ak-${a.id}`, tur: 'Risk aksiyonu', baslik: a.baslik, firma: a.firmaAd,
        tarih: a.hedefTarih, sorumlu: a.sorumluAd,
        oncelik: gecikmis && a.oncelik === 'Kritik' ? 'kritik' : ONCELIK_MAP[a.oncelik] ?? 'orta',
        durum: gecikmis ? 'Gecikmiş' : a.durum, link: '/panel/aksiyonlar', aksiyonId: a.id,
      })
    }
    for (const b of basvurular.filter((x) => x.durum === 'İnceleme Bekliyor' || x.durum === 'İnceleniyor')) {
      const p = personeller.find((x) => x.id === b.personelId)
      if (p && !gor('sertifikalar', p.firmaId)) continue
      gorevler.push({
        id: `sbv-${b.id}`, tur: 'Sertifika onayı', baslik: `${p ? `${p.ad} ${p.soyad}` : b.personelId} — sertifika başvurusu`,
        firma: p ? (firmalar.find((f) => f.id === p.firmaId)?.kisaAd ?? '') : '',
        tarih: b.basvuruTarihi,
        oncelik: gunFarki(b.basvuruTarihi, TODAY) > 7 ? 'yuksek' : 'orta',
        durum: b.durum, link: '/panel/sertifika-onay',
      })
    }
    for (const a of atamalarG) {
      if (a.durum !== 'Aktif') continue
      const gecikmis = a.sonTarih < TODAY
      const yakin = gunFarki(TODAY, a.sonTarih) <= 7
      if (!gecikmis && !yakin) continue
      const egitim = egitimler.find((e) => e.id === a.egitimId)
      gorevler.push({
        id: `ea-${a.id}`, tur: 'Eğitim', baslik: `${egitim?.baslik ?? a.egitimId} — ${a.personelIds.length} kişi`,
        firma: firmalar.find((f) => f.id === a.firmaId)?.kisaAd ?? '', tarih: a.sonTarih,
        oncelik: gecikmis ? 'yuksek' : 'orta', durum: gecikmis ? 'Süresi geçti' : 'Son tarih yaklaşıyor',
        link: '/panel/egitim-atamalari',
      })
    }
    for (const d of degerlendirmelerG) {
      const gu = guncelDurum(d)
      if (gu === 'Süresi Doldu') {
        gorevler.push({
          id: `rd-${d.id}`, tur: 'Risk değerlendirmesi', baslik: `${d.ad} — yenileme süresi doldu`,
          firma: d.firmaAd, tarih: d.yenilemeTarihi, oncelik: 'yuksek', durum: 'Süresi doldu', link: `/panel/risk/${d.id}`,
        })
      } else if (gu === 'Onaylandı' && yenilemeYaklasan(d)) {
        gorevler.push({
          id: `rd-${d.id}`, tur: 'Risk değerlendirmesi', baslik: `${d.ad} — yenileme tarihi yaklaşıyor`,
          firma: d.firmaAd, tarih: d.yenilemeTarihi, oncelik: 'orta', durum: 'Yenileme yaklaşıyor', link: `/panel/risk/${d.id}`,
        })
      }
    }
    for (const k of katip.filter((x) => gor('firmalar', x.firmaId))) {
      const f = firmalar.find((x) => x.id === k.firmaId)
      if (k.durum === 'Süresi Dolmuş') {
        gorevler.push({
          id: `kt-${k.id}`, tur: 'İSG-KATİP', baslik: `${f?.kisaAd ?? k.firmaId} — sözleşme süresi doldu`,
          firma: f?.kisaAd ?? '', tarih: k.sozlesmeBitis, oncelik: 'kritik', durum: 'Süresi dolmuş', link: '/panel/isg-katip',
        })
      } else if (k.durum === 'Aktif' && gunFarki(TODAY, k.sozlesmeBitis) <= 30 && k.sozlesmeBitis >= TODAY) {
        gorevler.push({
          id: `kt-${k.id}`, tur: 'İSG-KATİP', baslik: `${f?.kisaAd ?? k.firmaId} — sözleşme bitişi yaklaşıyor`,
          firma: f?.kisaAd ?? '', tarih: k.sozlesmeBitis, oncelik: 'orta', durum: `${gunFarki(TODAY, k.sozlesmeBitis)} gün kaldı`, link: '/panel/isg-katip',
        })
      }
    }
    for (const o of olaylarG.filter((x) => x.durum === 'Yeni Bildirildi' || x.durum === 'İncelemede')) {
      gorevler.push({
        id: `ol-${o.id}`, tur: 'Olay', baslik: o.baslik, firma: o.firma, tarih: o.tarih, sorumlu: o.sorumlu,
        oncelik: o.risk === 'Kritik' ? 'kritik' : o.risk === 'Yüksek' ? 'yuksek' : 'orta',
        durum: o.durum, link: '/panel/olaylar',
      })
    }
    for (const f of firmalarG.filter((x) => x.durum === 'Aktif' && x.hizmetBitis)) {
      const kalan = gunFarki(TODAY, f.hizmetBitis)
      if (kalan < 0 || kalan > 30) continue
      gorevler.push({
        id: `hf-${f.id}`, tur: 'Hizmet sözleşmesi', baslik: `${f.kisaAd} — hizmet süresi doluyor`,
        firma: f.kisaAd, tarih: f.hizmetBitis, oncelik: kalan <= 7 ? 'yuksek' : 'orta',
        durum: `${kalan} gün kaldı`, link: `/panel/firmalar/${f.id}`,
      })
    }

    const sirala = (a: Gorev, b: Gorev) =>
      (b.oncelik === 'kritik' ? 2 : b.oncelik === 'yuksek' ? 1 : 0) - (a.oncelik === 'kritik' ? 2 : a.oncelik === 'yuksek' ? 1 : 0) ||
      a.tarih.localeCompare(b.tarih)
    gorevler.sort(sirala)

    /* ------------------------------- Bildirimler ------------------------------- */

    const bildirimler: Bildirim[] = []
    const gecikmisAks = aksiyonlarG.filter(aksiyonGecikmis)
    if (gecikmisAks.length) {
      bildirimler.push({
        id: 'b-aksiyon', seviye: 'kritik', baslik: `${gecikmisAks.length} risk aksiyonu gecikmiş`,
        detay: gecikmisAks.slice(0, 2).map((a) => a.baslik).join(' · '), tarih: TODAY, link: '/panel/aksiyonlar',
      })
    }
    const bekleyenSayi = basvurular.filter((b) => b.durum === 'İnceleme Bekliyor' || b.durum === 'İnceleniyor').length
    if (bekleyenSayi) {
      bildirimler.push({
        id: 'b-sbv', seviye: 'yuksek', baslik: `${bekleyenSayi} sertifika başvurusu onay bekliyor`,
        detay: 'Başvurular inceleme kuyruğunda', tarih: TODAY, link: '/panel/sertifika-onay',
      })
    }
    const dolmusKatip = katip.filter((k) => k.durum === 'Süresi Dolmuş' && gor('firmalar', k.firmaId))
    for (const k of dolmusKatip.slice(0, 3)) {
      bildirimler.push({
        id: `b-kt-${k.id}`, seviye: 'kritik', baslik: 'Sözleşme süresi dolmuş',
        detay: firmalar.find((f) => f.id === k.firmaId)?.kisaAd ?? k.firmaId, tarih: k.sozlesmeBitis, link: '/panel/isg-katip',
      })
    }
    const dolanRd = degerlendirmelerG.filter((d) => guncelDurum(d) === 'Süresi Doldu')
    if (dolanRd.length) {
      bildirimler.push({
        id: 'b-rd', seviye: 'yuksek', baslik: `${dolanRd.length} değerlendirmenin yenileme süresi doldu`,
        detay: dolanRd.map((d) => d.firmaAd).slice(0, 2).join(' · '), tarih: TODAY, link: '/panel/risk',
      })
    }
    const gecikmisAtama = atamalarG.filter((a) => a.durum === 'Aktif' && a.sonTarih < TODAY)
    if (gecikmisAtama.length) {
      bildirimler.push({
        id: 'b-egitim', seviye: 'orta', baslik: `${gecikmisAtama.length} eğitim atamasının son tarihi geçti`,
        detay: 'Tamamlanmamış eğitimler var', tarih: TODAY, link: '/panel/egitim-atamalari',
      })
    }
    const yeniOlay = olaylarG.filter((o) => o.durum === 'Yeni Bildirildi')
    if (yeniOlay.length) {
      bildirimler.push({
        id: 'b-olay', seviye: 'yuksek', baslik: `${yeniOlay.length} yeni olay bildirimi inceleme bekliyor`,
        detay: yeniOlay[0]?.baslik ?? '', tarih: yeniOlay[0]?.tarih ?? TODAY, link: '/panel/olaylar',
      })
    }

    /* ------------------------------ Son aktiviteler ------------------------------ */

    const hesapAd = (u: string) => {
      const h = hesaplar.find((x) => x.kullaniciAdi === u)
      return h ? hesapGorunenAd(h, uyeler) : u
    }
    const aktiviteler: Aktivite[] = loglar.slice(0, 12).map((l) => ({
      id: l.id,
      kullanici: hesapAd(l.kullanici),
      islem: l.islem,
      kayit: l.kayit,
      zaman: zamanOnce(l.tarih, TODAY),
      link: kayitLink(l.kayit),
    }))

    /* --------------------------------- Grafikler -------------------------------- */

    const aylar = sonAylar(TODAY, 6)
    const trend = aylar.map((ay) => ({
      ay, etiket: ayKisa(ay),
      aksiyon: aksiyonlarG.filter((a) => a.tamamlanmaTarihi?.slice(0, 7) === ay).length,
      olay: olaylarG.filter((o) => o.tarih.slice(0, 7) === ay).length,
      atama: atamalarG.filter((a) => a.atamaTarihi.slice(0, 7) === ay).length,
    }))

    const riskDagilim = ['Çok Yüksek', 'Yüksek', 'Orta', 'Düşük']
      .map((s) => ({ seviye: s, adet: tehlikelerG.filter((t) => t.seviye === s).length, renk: SEV_RENK[s] }))
    const aksiyonDurum = Object.keys(AKD_RENK)
      .map((d) => ({ durum: d, adet: aksiyonlarG.filter((a) => a.durum === d).length, renk: AKD_RENK[d] }))
    const firmaAcikMap = new Map<string, number>()
    for (const a of aksiyonlarG.filter(aksiyonAcik)) firmaAcikMap.set(a.firmaAd, (firmaAcikMap.get(a.firmaAd) ?? 0) + 1)
    const firmaAcik = [...firmaAcikMap].map(([ad, adet]) => ({ ad, adet })).sort((a, b) => b.adet - a.adet).slice(0, 5)

    const ilerlemeToplam = ilerlemeler.length
    const tamamlanan = ilerlemeler.filter((i) => i.durum === 'Tamamlandı').length
    const egitim = {
      aktifAtama: atamalarG.filter((a) => a.durum === 'Aktif').length,
      gecikmis: gecikmisAtama.length,
      ilerlemeToplam, tamamlanan,
      oran: ilerlemeToplam ? Math.round((tamamlanan / ilerlemeToplam) * 100) : 0,
    }

    const personelFirma = new Map<string, number>()
    for (const p of personellerG.filter((x) => x.durum === 'Aktif')) personelFirma.set(p.firmaId, (personelFirma.get(p.firmaId) ?? 0) + 1)
    const personelTop5 = [...personelFirma]
      .map(([id, adet]) => ({ ad: firmalar.find((f) => f.id === id)?.kisaAd ?? id, adet }))
      .sort((a, b) => b.adet - a.adet).slice(0, 5)

    /* ------------------------------- Hızlı erişim ------------------------------- */

    const link: HizliLink[] = [
      izin('firmalar.goruntule') && { baslik: 'Firmalar', aciklama: `${firmalarG.length} kayıt`, link: '/panel/firmalar', icon: 'firmalar' },
      izin('personeller.goruntule') && { baslik: 'Personeller', aciklama: `${personellerG.length} çalışan`, link: '/panel/personeller', icon: 'personeller' },
      izin('risk.goruntule') && { baslik: 'Risk Değerlendirme', aciklama: `${degerlendirmelerG.length} değerlendirme`, link: '/panel/risk', icon: 'risk' },
      izin('olaylar.goruntule') && { baslik: 'Olay Bildirimleri', aciklama: `${olaylarG.length} bildirim`, link: '/panel/olaylar', icon: 'olaylar' },
      izin('egitimler.goruntule') && { baslik: 'Eğitimler', aciklama: `${egitimler.length} eğitim`, link: '/panel/egitimler', icon: 'egitimler' },
      izin('sertifikalar.goruntule') && { baslik: 'Sertifikalar', aciklama: `${sertifikalarG.length} belge`, link: '/panel/sertifikalar', icon: 'sertifikalar' },
      izin('isg-katip.goruntule') && { baslik: 'İSG-KATİP', aciklama: `${katip.length} sözleşme`, link: '/panel/isg-katip', icon: 'katip' },
      izin('ekip.goruntule') && { baslik: 'Ekip', aciklama: `${uyeler.length} üye`, link: '/panel/ekip', icon: 'personeller' },
    ].filter(Boolean) as HizliLink[]

    return {
      kpis, gorevler, bildirimler, aktiviteler, trend, riskDagilim, aksiyonDurum,
      firmaAcik, egitim,
      firmaOzet: {
        aktif: firmalarG.filter((f) => f.durum === 'Aktif').length,
        pasif: firmalarG.filter((f) => f.durum === 'Pasif').length,
        yeni: firmalarG.filter((f) => icinde(f.islemGecmisi[0]?.tarih ?? f.hizmetBaslangic, aralik)).length,
        personelTop5,
      },
      hizliLinkler: link,
    }
  }, [aralik, user, firmalar, katip, personeller, atamalar, egitimler, ilerlemeler, basvurular, sertifikalar, degerlendirmeler, tehlikeler, aksiyonlar, olaylar, uyeler, hesaplar, gorevlendirmeler, loglar])
}
