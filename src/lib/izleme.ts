/**
 * Video izleme kuralları — saf fonksiyonlar (oynatıcıdan bağımsız, test edilebilir).
 *
 * İlerleme yalnızca "en uzak izlenen nokta" ile ölçülür. Kaydırma çubuğu, ok tuşları veya
 * sar düğmeleriyle henüz izlenmemiş bir konuma atlamak bu noktayı ilerletmez.
 */

/** Atlama toleransı (sn): kısa gecikmeler ve kare hassasiyeti için */
const TOLERANS_SN = 1

/** Normal oynatmada iki zaman güncellemesi arasındaki en büyük kabul edilen fark (sn) */
const NORMAL_ILERLEME_SN = 1.5

/**
 * En uzak izlenen noktayı günceller. Yalnızca gerçek oynatma sırasında (atlama yokken)
 * ve küçük adımlarla ilerlenen zamanlar sayılır.
 */
export const enIleriGuncelle = (enIleri: number, onceki: number, yeni: number, aranıyor = false): number => {
  if (aranıyor) return enIleri
  const adim = yeni - onceki
  if (adim < 0 || adim > NORMAL_ILERLEME_SN) return enIleri
  return Math.max(enIleri, yeni)
}

/** Hedef konumu, izlenen en uzak noktanın ötesine geçmeyecek şekilde sınırlar. */
export const atlamaSiniri = (hedef: number, enIleri: number): number =>
  hedef > enIleri + TOLERANS_SN ? enIleri : Math.max(0, hedef)

/** Süreye göre izlenen yüzde (0–100). Toplam bilinmiyorsa 0. */
export const izlenenYuzde = (enIleri: number, toplam: number): number =>
  toplam > 0 ? Math.min(100, Math.round((enIleri / toplam) * 100)) : 0
