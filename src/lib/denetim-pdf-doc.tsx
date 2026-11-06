/*
 * Denetim PDF raporu — sayfa bileşenleri.
 * Kurumsal düzen: kapak/özet, kontrol listesi sonuçları, uygunsuzluklar
 * (fotoğraflı), aksiyonlar, imza alanları. Üretim akışı denetim-pdf.tsx'te.
 */
import type { CSSProperties, ReactNode } from 'react'
import {
  maddeIstat,
  type Denetim,
  type DenetimBulgu,
  type DenetimMadde,
} from '@/data/denetimler'
import type { RiskAksiyon } from '@/data/risk'
import { osgbAd } from '@/lib/osgb'
import { OsgbLogoMark } from '@/components/osgb-logo-mark'
import { MM } from '@/lib/pdf-utils'

type MaddeIstat = ReturnType<typeof maddeIstat>

const S = {
  sayfa: { width: 210 * MM, minHeight: 297 * MM, background: '#fff', color: '#18181B', fontFamily: "'Geist','Inter',system-ui,sans-serif", padding: '13mm 14mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' } as CSSProperties,
  ust: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #18181B', paddingBottom: '4mm', marginBottom: '5mm' } as CSSProperties,
  logo: { width: '11mm', height: '11mm', borderRadius: '2.5mm', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '4.2mm' } as CSSProperties,
  bolum: { fontSize: '3.1mm', fontWeight: 700, letterSpacing: '0.4mm', color: '#3F3F46', textTransform: 'uppercase', borderBottom: '1px solid #E4E4E7', paddingBottom: '1.2mm', marginBottom: '2.5mm', marginTop: '4mm' } as CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2.5mm 6mm', fontSize: '2.8mm' } as CSSProperties,
  etiket: { fontSize: '2.2mm', color: '#A1A1AA', marginBottom: '0.3mm' } as CSSProperties,
  deger: { fontSize: '2.8mm', fontWeight: 600 } as CSSProperties,
  tablo: { width: '100%', borderCollapse: 'collapse', fontSize: '2.4mm' } as CSSProperties,
  th: { textAlign: 'left', fontSize: '2mm', fontWeight: 700, color: '#52525B', borderBottom: '1.5px solid #D4D4D8', padding: '1.5mm 1.6mm' } as CSSProperties,
  td: { borderBottom: '1px solid #E4E4E7', padding: '1.6mm', verticalAlign: 'top' } as CSSProperties,
  imzaKutu: { flex: 1, borderTop: '1px solid #A1A1AA', paddingTop: '1.6mm', textAlign: 'center', fontSize: '2.4mm' } as CSSProperties,
  footer: { marginTop: 'auto', borderTop: '1px solid #E4E4E7', paddingTop: '2mm', display: 'flex', justifyContent: 'space-between', fontSize: '2.1mm', color: '#A1A1AA' } as CSSProperties,
  uyari: { marginTop: '3mm', padding: '2.5mm', borderRadius: '2mm', background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '2.3mm', color: '#92400E' } as CSSProperties,
}

const sonucStil = (s?: string): CSSProperties => ({
  display: 'inline-block', padding: '0.6mm 2mm', borderRadius: '2mm', fontSize: '2.1mm', fontWeight: 700, whiteSpace: 'nowrap',
  background: s === 'Uygun' ? '#10B98118' : s === 'Uygunsuz' ? '#EF444418' : s === 'Gözlem' ? '#F59E0B18' : '#71717A18',
  color: s === 'Uygun' ? '#047857' : s === 'Uygunsuz' ? '#B91C1C' : s === 'Gözlem' ? '#B45309' : '#52525B',
})
const onemStil = (o: string): CSSProperties => ({
  display: 'inline-block', padding: '0.5mm 1.8mm', borderRadius: '2mm', fontSize: '2mm', fontWeight: 700,
  background: o === 'Kritik' ? '#EF444418' : o === 'Yüksek' ? '#F9731618' : o === 'Orta' ? '#F59E0B18' : '#71717A18',
  color: o === 'Kritik' ? '#B91C1C' : o === 'Yüksek' ? '#C2410C' : o === 'Orta' ? '#B45309' : '#52525B',
})

const tarih = (iso?: string) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

/* ------------------------------- Ortak parçalar ---------------------------- */

function Ust({ d }: { d: Denetim }) {
  return (
    <div style={S.ust}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3mm' }}>
        <OsgbLogoMark style={S.logo} />
        <div>
          <div style={{ fontSize: '4.4mm', fontWeight: 700 }}>{osgbAd()}</div>
          <div style={{ fontSize: '2.5mm', color: '#71717A' }}>Saha Denetim Raporu</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '3.6mm', fontWeight: 700 }}>{d.no}</div>
        <div style={{ fontSize: '2.4mm', color: '#71717A' }}>{tarih(d.gerceklesmeBaslangic ?? d.planlananTarih)}</div>
      </div>
    </div>
  )
}

function Footer({ d, no, toplam }: { d: Denetim; no: number; toplam: number }) {
  return (
    <div style={S.footer}>
      <span>{d.no} — {d.firmaAd}</span>
      <span>Bu rapor {osgbAd()} tarafından isghub ile üretilmiştir · Sayfa {no}/{toplam}</span>
    </div>
  )
}

/** A4 sayfası — içerik + altbilgi */
export function DenetimSayfa({ d, no, toplam, children }: {
  d: Denetim; no: number; toplam: number; children: ReactNode
}) {
  return (
    <div style={S.sayfa}>
      {children}
      <Footer d={d} no={no} toplam={toplam} />
    </div>
  )
}

/* ------------------------------- Rapor sayfaları --------------------------- */

/** Sayfa 1 — kapak + özet */
export function DenetimKapak({ d, ist, puan, bulguSayi }: {
  d: Denetim; ist: MaddeIstat; puan: number | undefined; bulguSayi: number
}) {
  return (
    <>
      <Ust d={d} />
      <div style={{ fontSize: '6mm', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.5mm' }}>{d.baslik}</div>
      <div style={{ fontSize: '2.8mm', color: '#52525B', marginBottom: '3mm' }}>{d.turAd} · {d.durum}</div>
      <div style={S.grid}>
        {(
          [
            ['Firma', d.firmaAd], ['İşyeri / Lokasyon', d.lokasyon], ['Denetim Türü', d.turAd],
            ['Planlanan Tarih', `${tarih(d.planlananTarih)}${d.planlananSaat ? ` ${d.planlananSaat}` : ''}`],
            ['Gerçekleşme', tarih(d.gerceklesmeBaslangic)], ['Sorumlu Uzman', d.uzmanAd],
            ['Denetim Puanı', puan !== undefined ? `%${puan}` : 'Hesaplanmadı'],
            ['Kontrol Maddesi', String(ist.toplam)], ['Uygunsuzluk', String(bulguSayi)],
          ] as const
        ).map(([t, v]) => (
          <div key={t}><div style={S.etiket}>{t}</div><div style={S.deger}>{v}</div></div>
        ))}
      </div>
      {d.kapsam && <div style={S.uyari}><b>Kapsam:</b> {d.kapsam}</div>}
      {d.aciklama && <div style={{ marginTop: '2mm', fontSize: '2.6mm', color: '#52525B' }}>{d.aciklama}</div>}

      <div style={S.bolum}>Sonuç özeti</div>
      <div style={{ display: 'flex', gap: '3mm' }}>
        {(
          [
            ['Uygun', ist.uygun, '#047857', '#ECFDF5'],
            ['Uygunsuz', ist.uygunsuz, '#B91C1C', '#FEF2F2'],
            ['Uygulanamaz', ist.uygulanamaz, '#52525B', '#F4F4F5'],
            ['Gözlem', ist.gozlem, '#B45309', '#FFFBEB'],
            ['Cevapsız', ist.cevapsiz, '#52525B', '#F4F4F5'],
          ] as const
        ).map(([l, v, c, bg]) => (
          <div key={l} style={{ flex: 1, borderRadius: '2mm', padding: '3mm', background: bg, textAlign: 'center' }}>
            <div style={{ fontSize: '6.5mm', fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: '2.2mm', color: c }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={S.bolum}>Denetim ekibi ve şablonlar</div>
      <table style={S.tablo}>
        <tbody>
          {d.katilimcilar.map((k, i) => (
            <tr key={i}>
              <td style={{ ...S.td, fontWeight: 600, width: '55%' }}>{k.ad}</td>
              <td style={S.td}>{k.rol}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '2.5mm', fontSize: '2.4mm', color: '#52525B' }}>
        Kullanılan kontrol listeleri: {d.sablonlar.map((s) => `${s.sablonId} (v${s.surum})`).join(', ')}
      </div>
      {d.hazirlikNotlari && <div style={{ marginTop: '2mm', fontSize: '2.4mm', color: '#52525B' }}><b>Hazırlık notları:</b> {d.hazirlikNotlari}</div>}
    </>
  )
}

/** Kontrol listesi sonuçları sayfası */
export function DenetimMaddeListe({ d, dilim, basNo, p, maddeSayfa, puan }: {
  d: Denetim; dilim: DenetimMadde[]; basNo: number; p: number; maddeSayfa: number; puan: number | undefined
}) {
  return (
    <>
      <Ust d={d} />
      <div style={S.bolum}>Kontrol listesi sonuçları {maddeSayfa > 1 ? `(${p + 1}/${maddeSayfa})` : ''}</div>
      <table style={S.tablo}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: '5%' }}>#</th>
            <th style={{ ...S.th, width: '14%' }}>Kategori</th>
            <th style={S.th}>Kontrol maddesi</th>
            <th style={{ ...S.th, width: '9%' }}>Önem</th>
            <th style={{ ...S.th, width: '12%' }}>Sonuç</th>
            <th style={{ ...S.th, width: '26%' }}>Not / Bölüm</th>
          </tr>
        </thead>
        <tbody>
          {dilim.map((m, i) => (
            <tr key={m.id}>
              <td style={S.td}>{basNo + i + 1}</td>
              <td style={S.td}>{m.kategoriAd}</td>
              <td style={S.td}>
                {m.soru}
                {m.mevzuatRef ? <div style={{ fontSize: '1.9mm', color: '#A1A1AA' }}>{m.mevzuatRef}</div> : null}
              </td>
              <td style={S.td}><span style={onemStil(m.onem)}>{m.onem}</span></td>
              <td style={S.td}><span style={sonucStil(m.sonuc)}>{m.sonuc ?? '—'}</span></td>
              <td style={S.td}>{[m.bolum, m.not].filter(Boolean).join(' — ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {p === maddeSayfa - 1 && (
        <div style={{ marginTop: '3mm', fontSize: '2.3mm', color: '#71717A' }}>
          Puan hesabı: uygun / (uygun + uygunsuz) × 100 = %{puan ?? '—'}. Uygulanamaz ve gözlem puanlamaya dahil değildir.
        </div>
      )}
    </>
  )
}

/** Uygunsuzluk sayfası */
export function DenetimBulguListe({ d, dilim, aksiyonlar, p, bulguSayfa }: {
  d: Denetim; dilim: DenetimBulgu[]; aksiyonlar: RiskAksiyon[]; p: number; bulguSayfa: number
}) {
  return (
    <>
      <Ust d={d} />
      <div style={S.bolum}>Uygunsuzluklar {bulguSayfa > 1 ? `(${p + 1}/${bulguSayfa})` : ''}</div>
      {dilim.length === 0 && <div style={{ fontSize: '2.6mm', color: '#71717A' }}>Bu denetimde uygunsuzluk tespit edilmedi.</div>}
      {dilim.map((b) => {
        const ak = aksiyonlar.find((a) => a.id === b.aksiyonId)
        const foto = b.ekler.find((e) => e.tur === 'fotograf' && e.dataUrl)
        const maddeFoto = d.maddeler.find((m) => m.id === b.maddeId)?.fotograflar.find((f) => f.dataUrl)
        return (
          <div key={b.id} style={{ border: '1px solid #E4E4E7', borderRadius: '2mm', padding: '3mm', marginBottom: '2.5mm', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3mm' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '2mm', alignItems: 'center' }}>
                  <span style={onemStil(b.onem)}>{b.onem}</span>
                  <span style={{ fontSize: '2mm', color: '#71717A' }}>{b.id} · {b.durum}</span>
                </div>
                <div style={{ fontSize: '3mm', fontWeight: 700, marginTop: '1mm' }}>{b.baslik}</div>
                <div style={{ fontSize: '2.4mm', color: '#52525B', marginTop: '1mm' }}>{b.aciklama}</div>
                <div style={{ fontSize: '2.1mm', color: '#71717A', marginTop: '1.2mm' }}>
                  {[b.bolum && `Bölüm: ${b.bolum}`, b.sorumluAd && `Sorumlu: ${b.sorumluAd}`, b.hedefTarih && `Hedef: ${tarih(b.hedefTarih)}`, ak && `Aksiyon: ${ak.id} (${ak.durum})`].filter(Boolean).join(' · ')}
                </div>
                {b.onerilenFaaliyet && <div style={{ marginTop: '1.5mm', padding: '1.6mm', background: '#F4F4F5', borderRadius: '1.5mm', fontSize: '2.2mm' }}><b>Önerilen düzeltici faaliyet:</b> {b.onerilenFaaliyet}</div>}
                {b.kapatmaNotu && <div style={{ marginTop: '1.5mm', padding: '1.6mm', background: '#ECFDF5', borderRadius: '1.5mm', fontSize: '2.2mm' }}><b>Kapatma notu:</b> {b.kapatmaNotu} — {b.kapatan}</div>}
              </div>
              {(foto?.dataUrl ?? maddeFoto?.dataUrl) && (
                <img src={(foto?.dataUrl ?? maddeFoto?.dataUrl)!} alt="bulgu" style={{ width: '38mm', height: '28mm', objectFit: 'cover', borderRadius: '1.5mm', border: '1px solid #E4E4E7' }} />
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

/** Son sayfa — aksiyonlar + genel değerlendirme + imza */
export function DenetimKapanis({ d, aksiyonlar, bulgular, ist, puan }: {
  d: Denetim; aksiyonlar: RiskAksiyon[]; bulgular: DenetimBulgu[]; ist: MaddeIstat; puan: number | undefined
}) {
  return (
    <>
      <Ust d={d} />
      <div style={S.bolum}>Düzeltici faaliyetler</div>
      {aksiyonlar.length === 0 ? (
        <div style={{ fontSize: '2.6mm', color: '#71717A' }}>Bu denetimden düzeltici faaliyet oluşturulmadı.</div>
      ) : (
        <table style={S.tablo}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: '12%' }}>No</th>
              <th style={S.th}>Faaliyet</th>
              <th style={{ ...S.th, width: '10%' }}>Öncelik</th>
              <th style={{ ...S.th, width: '16%' }}>Sorumlu</th>
              <th style={{ ...S.th, width: '12%' }}>Hedef</th>
              <th style={{ ...S.th, width: '13%' }}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {aksiyonlar.map((a) => (
              <tr key={a.id}>
                <td style={{ ...S.td, fontFamily: 'monospace' }}>{a.id}</td>
                <td style={S.td}>{a.baslik}</td>
                <td style={S.td}>{a.oncelik}</td>
                <td style={S.td}>{a.sorumluAd}</td>
                <td style={S.td}>{tarih(a.hedefTarih)}</td>
                <td style={S.td}>{a.durum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={S.bolum}>Genel değerlendirme</div>
      <div style={{ fontSize: '2.6mm', lineHeight: 1.5, color: '#3F3F46' }}>
        {d.no} numaralı denetim {tarih(d.gerceklesmeBaslangic ?? d.planlananTarih)} tarihinde {d.firmaAd} işyerinde gerçekleştirilmiştir.
        {ist.toplam} kontrol maddesinden {ist.toplam - ist.cevapsiz} tanesi değerlendirilmiş; {ist.uygunsuz} uygunsuzluk tespit edilmiştir.
        {puan !== undefined ? ` Denetim puanı %${puan} olarak hesaplanmıştır.` : ''}
        {bulgular.length > 0 ? ` Tespit edilen ${bulgular.length} uygunsuzluk için ${aksiyonlar.length} düzeltici faaliyet planlanmış/atanmıştır.` : ''}
      </div>
      {bulgular.some((b) => b.onem === 'Kritik') && (
        <div style={{ ...S.uyari, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
          <b>Kritik uygunsuzluk:</b> Bu denetimde kritik önem dereceli {bulgular.filter((b) => b.onem === 'Kritik').length} uygunsuzluk tespit edilmiştir — giderilmeden ilgili süreçlerin gözden geçirilmesi önerilir.
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <div style={S.bolum}>Onay ve imza</div>
        <div style={{ display: 'flex', gap: '8mm' }}>
          <div style={S.imzaKutu}>
            <div style={{ fontWeight: 700 }}>Denetimi Gerçekleştiren</div>
            <div style={{ marginTop: '8mm' }}>{d.uzmanAd}</div>
            <div style={{ color: '#A1A1AA', fontSize: '2mm' }}>İSG Uzmanı</div>
          </div>
          <div style={S.imzaKutu}>
            <div style={{ fontWeight: 700 }}>İşyeri Temsilcisi</div>
            <div style={{ marginTop: '8mm' }}>{d.katilimcilar.find((k) => k.rol === 'İşveren Temsilcisi')?.ad ?? '—'}</div>
            <div style={{ color: '#A1A1AA', fontSize: '2mm' }}>Ad / İmza / Tarih</div>
          </div>
          <div style={S.imzaKutu}>
            <div style={{ fontWeight: 700 }}>Onaylayan</div>
            <div style={{ marginTop: '8mm' }}>{d.olusturan}</div>
            <div style={{ color: '#A1A1AA', fontSize: '2mm' }}>OSGB Yönetimi</div>
          </div>
        </div>
      </div>
    </>
  )
}
