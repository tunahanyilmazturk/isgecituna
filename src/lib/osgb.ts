import { useAyarlarStore } from '@/stores/ayarlar-store'

/**
 * OSGB kiracı adı — isghub'ı kullanan kurumun görünen adı.
 * Ürün adı her zaman 'isghub'dur; OSGB adı Ayarlar → Kurum Bilgileri'nden gelir
 * ve belge üstbilgileri, portallar, PDF/Excel çıktılarında kiracıyı temsil eder.
 * Üretimde bu değer tenant bağlamından sunucu tarafında çözülmelidir.
 */
export const osgbAd = (): string =>
  useAyarlarStore.getState().kurum.kisaAd || useAyarlarStore.getState().kurum.unvan

export const osgbUnvan = (): string => useAyarlarStore.getState().kurum.unvan

/** OSGB markası — PNG/JPEG/WebP data URL olarak ayarlarda saklanır */
export const osgbLogoVeri = (): string | undefined => useAyarlarStore.getState().kurum.logo || undefined

/** Belge/PDF logo kutuları için baş harfler — 'Vega OSGB' → 'VO' */
export const osgbLogoHarf = (): string => {
  const ad = osgbAd().trim()
  const harfler = ad.split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('')
  return (harfler || 'O').toLocaleUpperCase('tr')
}

/** React hook — kurum bilgisini aboneli okur */
export const useOsgb = () => useAyarlarStore((s) => s.kurum)
