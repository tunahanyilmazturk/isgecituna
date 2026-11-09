import type { Tarama, TaramaDurum } from '@/data/saglik'
import { formatKisa } from '@/lib/date'

/**
 * Planlı taramanın eksik hazırlıkları: test, ekip, lokasyon, teklif bağlantısı ve ön yazı.
 * Tamamlanan ve iptal edilen taramalarda kontrol yapılmaz.
 */
export function taramaEksikleri(t: Pick<Tarama, 'durum' | 'kalemler' | 'ekip' | 'lokasyon' | 'teklifId' | 'onYazi'>): string[] {
  if (t.durum === 'Tamamlandı' || t.durum === 'İptal') return []
  const eksik: string[] = []
  if (!t.kalemler?.length) eksik.push('Test yok')
  if (!t.ekip) eksik.push('Ekip yok')
  if (!t.lokasyon?.trim()) eksik.push('Lokasyon yok')
  if (!t.teklifId) eksik.push('Teklif bağlı değil')
  if (!t.onYazi?.trim()) eksik.push('Ön yazı yok')
  return eksik
}

/** Saat aralığı: "09:00–17:00"; bitiş saati yoksa yalnızca başlangıç */
export const saatAraligi = (t: Pick<Tarama, 'saat' | 'bitisSaat'>) => (t.bitisSaat ? `${t.saat}–${t.bitisSaat}` : t.saat)

/** Tarih aralığı: tek günse "10 Kas", çok günse "10 Kas → 12 Kas" */
export const tarihAraligi = (t: Pick<Tarama, 'tarih' | 'bitisTarih'>) =>
  t.bitisTarih && t.bitisTarih !== t.tarih ? `${formatKisa(t.tarih)} → ${formatKisa(t.bitisTarih)}` : formatKisa(t.tarih)

/** Bir sonraki adıma geçiş: Planlandı → Devam ediyor → Tamamlandı */
export const SONRAKI_DURUM: Partial<Record<TaramaDurum, TaramaDurum>> = {
  Planlandı: 'Devam ediyor',
  'Devam ediyor': 'Tamamlandı',
}

/**
 * Durum değişikliğinin kayıt yamasını üretir. Tamamlanınca planlanan tüm kişiler
 * tamamlanmış sayılır; her değişiklik hareket geçmişine yazılır.
 */
export function durumPatch(t: Tarama, durum: TaramaDurum): Partial<Tarama> {
  const tamamlanan = durum === 'Tamamlandı' ? t.kisiSayisi : t.tamamlanan
  return {
    durum,
    tamamlanan,
    gecmis: [{ tarih: new Date().toISOString(), olay: `Durum: ${durum}` }, ...(t.gecmis ?? [])],
  }
}

/** Tamamlanma yüzdesi (0–100) */
export const ilerlemeOrani = (t: Pick<Tarama, 'kisiSayisi' | 'tamamlanan'>) =>
  t.kisiSayisi ? Math.min(100, Math.round((t.tamamlanan / t.kisiSayisi) * 100)) : 0
