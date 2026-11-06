/*
 * Risk değerlendirme PDF raporu — sayfa bileşenleri.
 * Düzen mantığı ve üretim akışı risk-pdf.tsx içindedir.
 */
import type { CSSProperties, ReactNode } from 'react'
import {
  seviyeRenk,
  type RiskAksiyon,
  type RiskDegerlendirme,
  type RiskSeviye,
  type RiskTehlike,
} from '@/data/risk'
import { osgbAd } from '@/lib/osgb'
import { OsgbLogoMark } from '@/components/osgb-logo-mark'
import { MM, PW } from '@/lib/pdf-utils'

/* ------------------------------ Stil sözlüğü ------------------------------- */

const seviyeRozet = (s: RiskSeviye): CSSProperties => ({
  display: 'inline-block',
  padding: '0.6mm 2mm',
  borderRadius: '2mm',
  fontSize: '2.2mm',
  fontWeight: 700,
  background: `${seviyeRenk[s].hex}18`,
  color: seviyeRenk[s].hex,
  whiteSpace: 'nowrap',
})

const S = {
  sayfa: { width: PW, height: 297 * MM, background: '#fff', color: '#18181B', fontFamily: "'Geist','Inter',system-ui,sans-serif", padding: '13mm 14mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' } as CSSProperties,
  ust: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #18181B', paddingBottom: '4mm', marginBottom: '5mm' } as CSSProperties,
  logoKutu: { display: 'flex', alignItems: 'center', gap: '3mm' } as CSSProperties,
  logo: { width: '11mm', height: '11mm', borderRadius: '2.5mm', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '5mm' } as CSSProperties,
  firma: { fontSize: '4.6mm', fontWeight: 700 } as CSSProperties,
  alt: { fontSize: '2.6mm', color: '#71717A' } as CSSProperties,
  bolum: { fontSize: '3.2mm', fontWeight: 700, letterSpacing: '0.4mm', color: '#3F3F46', textTransform: 'uppercase', borderBottom: '1px solid #E4E4E7', paddingBottom: '1.2mm', marginBottom: '2.5mm', marginTop: '4mm' } as CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2.5mm 6mm', fontSize: '2.8mm' } as CSSProperties,
  etiket: { fontSize: '2.2mm', color: '#A1A1AA', marginBottom: '0.3mm' } as CSSProperties,
  deger: { fontSize: '2.8mm', fontWeight: 600 } as CSSProperties,
  tablo: { width: '100%', borderCollapse: 'collapse', fontSize: '2.5mm' } as CSSProperties,
  th: { textAlign: 'left', fontSize: '2.1mm', fontWeight: 700, color: '#52525B', borderBottom: '1.5px solid #D4D4D8', padding: '1.6mm 1.8mm', letterSpacing: '0.15mm' } as CSSProperties,
  td: { borderBottom: '1px solid #E4E4E7', padding: '1.8mm', verticalAlign: 'top' } as CSSProperties,
  imzaKutu: { flex: 1, borderTop: '1px solid #A1A1AA', paddingTop: '1.6mm', textAlign: 'center', fontSize: '2.4mm' } as CSSProperties,
  footer: { marginTop: 'auto', borderTop: '1px solid #E4E4E7', paddingTop: '2mm', display: 'flex', justifyContent: 'space-between', fontSize: '2.1mm', color: '#A1A1AA' } as CSSProperties,
  uyari: { marginTop: '3mm', padding: '2.5mm', borderRadius: '2mm', background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '2.3mm', color: '#92400E' } as CSSProperties,
}

const SEV_SIRA: RiskSeviye[] = ['Çok Yüksek', 'Yüksek', 'Orta', 'Düşük']

const ONCELIK_SEVIYE: Record<RiskAksiyon['oncelik'], RiskSeviye> = {
  Kritik: 'Çok Yüksek',
  Yüksek: 'Yüksek',
  Orta: 'Orta',
  Düşük: 'Düşük',
}

/* ------------------------------- Ortak parçalar ---------------------------- */

function RaporUst({ surumNot }: { surumNot: string }) {
  return (
    <div style={S.ust}>
      <div style={S.logoKutu}>
        <OsgbLogoMark style={S.logo} />
        <div>
          <div style={S.firma}>{osgbAd()}</div>
          <div style={S.alt}>İş Sağlığı ve Güvenliği Yönetim Sistemi</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '3.6mm', fontWeight: 700 }}>RİSK DEĞERLENDİRME RAPORU</div>
        <div style={S.alt}>{surumNot}</div>
      </div>
    </div>
  )
}

function RaporFooter({ d, no, toplam }: { d: RiskDegerlendirme; no: number; toplam: number }) {
  return (
    <div style={S.footer}>
      <span>{d.ad} — {d.firmaAd}</span>
      <span>Sayfa {no} / {toplam} · {d.id} · v{d.surum}</span>
    </div>
  )
}

function TehlikeKart({ t, no, aksiyonAdet }: { t: RiskTehlike; no: number; aksiyonAdet: number }) {
  return (
    <div style={{ border: '1px solid #E4E4E7', borderRadius: '2.5mm', padding: '3mm', marginBottom: '2.5mm' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm', marginBottom: '1.8mm' }}>
        <span style={{ ...seviyeRozet(t.seviye), fontSize: '3mm', padding: '1mm 2.4mm' }}>{t.puan}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '3mm', fontWeight: 700 }}>{t.kaynak}</div>
          <div style={{ fontSize: '2.2mm', color: '#71717A' }}>#{no} · {t.bolum} — {t.faaliyet}</div>
        </div>
        <span style={seviyeRozet(t.seviye)}>{t.seviye}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2mm 5mm', fontSize: '2.3mm', color: '#3F3F46' }}>
        <div><span style={{ color: '#A1A1AA' }}>Olası risk: </span>{t.olasiRisk || '—'}</div>
        <div><span style={{ color: '#A1A1AA' }}>Etkilenen: </span>{t.etkilenenler || '—'}</div>
        <div><span style={{ color: '#A1A1AA' }}>Mevcut önlemler: </span>{t.mevcutOnlemler || '—'}</div>
        <div><span style={{ color: '#A1A1AA' }}>Olası sonuçlar: </span>{t.olasiSonuclar || '—'}</div>
      </div>
      {t.ekOnlemler && (
        <div style={{ marginTop: '1.6mm', padding: '1.6mm 2mm', background: '#F0F9FF', borderRadius: '1.5mm', fontSize: '2.3mm' }}>
          <b>Alınacak önlemler:</b> {t.ekOnlemler}
        </div>
      )}
      <div style={{ marginTop: '1.4mm', fontSize: '2.1mm', color: '#A1A1AA' }}>
        Olasılık {t.olasilik} × Şiddet {t.siddet} = {t.puan} puan · {aksiyonAdet} bağlı aksiyon
      </div>
    </div>
  )
}

interface SayfaProps {
  d: RiskDegerlendirme
  surumNot: string
  no: number
  toplam: number
  children: ReactNode
}

/* ------------------------------- Rapor sayfaları --------------------------- */

/** A4 sayfası — üstbilgi + içerik + altbilgi */
export function RiskSayfa({ d, surumNot, no, toplam, children }: SayfaProps) {
  return (
    <div style={S.sayfa}>
      <RaporUst surumNot={surumNot} />
      {children}
      <RaporFooter d={d} no={no} toplam={toplam} />
    </div>
  )
}

/** Sayfa 1 — işyeri + ekip + özet */
export function RiskKapakSayfa({ d, surumNot, yontemAd, thListe, akListe, no, toplam }: {
  d: RiskDegerlendirme; surumNot: string; yontemAd: string
  thListe: RiskTehlike[]; akListe: RiskAksiyon[]; no: number; toplam: number
}) {
  const sevSayi = (s: string) => thListe.filter((t) => t.seviye === s).length
  return (
    <RiskSayfa d={d} surumNot={surumNot} no={no} toplam={toplam}>
      <div style={S.bolum}>İşyeri ve değerlendirme bilgileri</div>
      <div style={S.grid}>
        {([
          ['Firma', d.firmaAd], ['İşyeri', d.isyeriAd], ['Adres', d.adres || '—'],
          ['Tehlike sınıfı', d.tehlikeSinifi || '—'], ['NACE kodu', d.nace || '—'], ['Faaliyet', d.faaliyet || '—'],
          ['Çalışan sayısı', String(d.calisanSayisi)], ['İşveren', d.isveren || '—'], ['İşveren vekili', d.isverenVekili || '—'],
          ['Değerlendirme tarihi', d.degerlendirmeTarihi], ['Yenileme tarihi', d.yenilemeTarihi], ['Yöntem', yontemAd],
        ] as [string, string][]).map(([l, v]) => (
          <div key={l}><div style={S.etiket}>{l}</div><div style={S.deger}>{v}</div></div>
        ))}
      </div>

      <div style={S.bolum}>Değerlendirme ekibi</div>
      <table style={S.tablo}>
        <thead><tr><th style={S.th}>Ad Soyad</th><th style={S.th}>Rol</th></tr></thead>
        <tbody>
          {d.ekip.map((u, i) => <tr key={i}><td style={S.td}>{u.adSoyad}</td><td style={S.td}>{u.rol}</td></tr>)}
          {d.ekip.length === 0 && <tr><td style={S.td} colSpan={2}>Ekip girilmedi</td></tr>}
        </tbody>
      </table>

      <div style={S.bolum}>Risk özeti — {thListe.length} tehlike, {akListe.length} aksiyon</div>
      <div style={{ display: 'flex', gap: '3mm' }}>
        {SEV_SIRA.map((s) => (
          <div key={s} style={{ flex: 1, border: '1px solid #E4E4E7', borderRadius: '2.5mm', padding: '3mm', textAlign: 'center' }}>
            <div style={{ fontSize: '6mm', fontWeight: 800, color: seviyeRenk[s].hex }}>{sevSayi(s)}</div>
            <div style={{ fontSize: '2.3mm', color: '#71717A' }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '3mm', marginTop: '3mm' }}>
        {(['Bekliyor', 'Devam Ediyor', 'Kontrol Bekliyor', 'Tamamlandı'] as const).map((s) => (
          <div key={s} style={{ flex: 1, border: '1px solid #E4E4E7', borderRadius: '2.5mm', padding: '2.5mm', textAlign: 'center' }}>
            <div style={{ fontSize: '4.6mm', fontWeight: 800 }}>{akListe.filter((a) => a.durum === s).length}</div>
            <div style={{ fontSize: '2.1mm', color: '#71717A' }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={S.uyari}>
        Bu rapor uygulama içi onay ile üretilmiştir; hukuken gerekli imza ve onay süreçlerinin yerine geçmez.
        İlgili mevzuatın öngördüğü onay akışı ayrıca tamamlanmalıdır.
      </div>
    </RiskSayfa>
  )
}

/** Tehlike sayfaları — sabit kart sayısı (kart bölünmez) */
export function RiskTehlikeSayfasi({ d, surumNot, dilim, bas, toplamTh, akListe, no, toplam }: {
  d: RiskDegerlendirme; surumNot: string; dilim: RiskTehlike[]; bas: number
  toplamTh: number; akListe: RiskAksiyon[]; no: number; toplam: number
}) {
  return (
    <RiskSayfa d={d} surumNot={surumNot} no={no} toplam={toplam}>
      <div style={S.bolum}>Tehlikeler ve riskler ({bas + 1}–{Math.min(bas + dilim.length, toplamTh)} / {toplamTh})</div>
      {dilim.map((t, j) => (
        <TehlikeKart key={t.id} t={t} no={bas + j + 1} aksiyonAdet={akListe.filter((a) => a.tehlikeId === t.id).length} />
      ))}
    </RiskSayfa>
  )
}

/** Aksiyon sayfaları */
export function RiskAksiyonSayfasi({ d, surumNot, dilim, bas, toplamAk, no, toplam }: {
  d: RiskDegerlendirme; surumNot: string; dilim: RiskAksiyon[]; bas: number
  toplamAk: number; no: number; toplam: number
}) {
  return (
    <RiskSayfa d={d} surumNot={surumNot} no={no} toplam={toplam}>
      <div style={S.bolum}>Önlem aksiyonları ({bas + 1}–{Math.min(bas + dilim.length, toplamAk)} / {toplamAk})</div>
      <table style={S.tablo}>
        <thead>
          <tr>
            <th style={S.th}>Aksiyon</th><th style={S.th}>Sorumlu</th><th style={S.th}>Öncelik</th>
            <th style={S.th}>Hedef</th><th style={S.th}>Durum</th>
          </tr>
        </thead>
        <tbody>
          {dilim.map((a) => (
            <tr key={a.id}>
              <td style={{ ...S.td, maxWidth: '60mm' }}>
                <div style={{ fontWeight: 600 }}>{a.baslik}</div>
                {a.tamamlanmaNotu && <div style={{ fontSize: '2mm', color: '#059669', marginTop: '0.4mm' }}>✓ {a.tamamlanmaNotu}</div>}
              </td>
              <td style={S.td}>{a.sorumluAd}</td>
              <td style={S.td}><span style={seviyeRozet(ONCELIK_SEVIYE[a.oncelik])}>{a.oncelik}</span></td>
              <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{a.hedefTarih}</td>
              <td style={S.td}>{a.durum}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </RiskSayfa>
  )
}

/** Son sayfa — imza ve revizyon */
export function RiskImzaSayfasi({ d, surumNot, no, toplam }: {
  d: RiskDegerlendirme; surumNot: string; no: number; toplam: number
}) {
  return (
    <RiskSayfa d={d} surumNot={surumNot} no={no} toplam={toplam}>
      <div style={S.bolum}>Onay ve imza alanları</div>
      <p style={{ fontSize: '2.5mm', color: '#52525B', marginBottom: '8mm' }}>
        İşbu risk değerlendirme raporu {d.degerlendirmeTarihi} tarihinde hazırlanmış olup, ilgili mevzuatın
        öngördüğü onay süreçleri ayrıca tamamlanmalıdır. Uygulama içi onaylar belge kayıt geçmişinde izlenir.
      </p>
      <div style={{ display: 'flex', gap: '8mm', marginTop: '14mm' }}>
        {d.ekip.slice(0, 3).map((u, i) => (
          <div key={i} style={S.imzaKutu}>
            <div style={{ fontWeight: 700 }}>{u.adSoyad}</div>
            <div style={{ color: '#71717A' }}>{u.rol}</div>
            <div style={{ color: '#A1A1AA', marginTop: '1mm' }}>İmza / Tarih</div>
          </div>
        ))}
        <div style={S.imzaKutu}>
          <div style={{ fontWeight: 700 }}>{d.isveren}</div>
          <div style={{ color: '#71717A' }}>İşveren / Vekili</div>
          <div style={{ color: '#A1A1AA', marginTop: '1mm' }}>İmza / Tarih</div>
        </div>
      </div>

      <div style={S.bolum}>Revizyon bilgileri</div>
      <table style={S.tablo}>
        <thead><tr><th style={S.th}>Sürüm</th><th style={S.th}>Tarih</th><th style={S.th}>İşlemi yapan</th><th style={S.th}>Açıklama</th></tr></thead>
        <tbody>
          <tr><td style={S.td}>v{d.surum} (güncel)</td><td style={S.td}>{d.guncelleme}</td><td style={S.td}>{d.olusturan}</td><td style={S.td}>Güncel sürüm</td></tr>
          {d.revizyonlar.map((r) => (
            <tr key={r.surum}>
              <td style={S.td}>v{r.surum}</td><td style={S.td}>{r.tarih}</td><td style={S.td}>{r.kullanici}</td>
              <td style={S.td}>{r.sebep} — {r.tehlikeSayisi} tehlike, {r.aksiyonSayisi} aksiyon</td>
            </tr>
          ))}
        </tbody>
      </table>
    </RiskSayfa>
  )
}

/** Aksiyon takip raporu sayfası — merkezi aksiyon listesi için, kendi üstbilgisiyle */
export function AksiyonRaporSayfasi({ baslik, firmaAd, aksiyonlar, dilim, raporTarihi, no, toplam }: {
  baslik: string; firmaAd: string; aksiyonlar: RiskAksiyon[]; dilim: RiskAksiyon[]; raporTarihi: string; no: number; toplam: number
}) {
  return (
    <div style={S.sayfa}>
      <div style={S.ust}>
        <div style={S.logoKutu}>
          <OsgbLogoMark style={S.logo} />
          <div>
            <div style={S.firma}>{osgbAd()}</div>
            <div style={S.alt}>Aksiyon Takip Raporu</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '3.4mm', fontWeight: 700 }}>{baslik}</div>
          <div style={S.alt}>{firmaAd} · {aksiyonlar.length} aksiyon · {raporTarihi}</div>
        </div>
      </div>
      <table style={S.tablo}>
        <thead>
          <tr>
            <th style={S.th}>Aksiyon</th><th style={S.th}>Firma</th><th style={S.th}>Sorumlu</th>
            <th style={S.th}>Öncelik</th><th style={S.th}>Hedef</th><th style={S.th}>Durum</th>
          </tr>
        </thead>
        <tbody>
          {dilim.map((a) => (
            <tr key={a.id}>
              <td style={{ ...S.td, maxWidth: '58mm' }}><div style={{ fontWeight: 600 }}>{a.baslik}</div></td>
              <td style={S.td}>{a.firmaAd}</td>
              <td style={S.td}>{a.sorumluAd}</td>
              <td style={S.td}><span style={seviyeRozet(ONCELIK_SEVIYE[a.oncelik])}>{a.oncelik}</span></td>
              <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{a.hedefTarih}</td>
              <td style={S.td}>{a.durum}</td>
            </tr>
          ))}
          {dilim.length === 0 && <tr><td style={S.td} colSpan={6}>Kayıt yok</td></tr>}
        </tbody>
      </table>
      <div style={S.footer}><span>{baslik}</span><span>Sayfa {no} / {toplam}</span></div>
    </div>
  )
}
