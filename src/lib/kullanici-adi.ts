/** Ad ve soyaddan önerilen kullanıcı adı (ör. “Ayşe” + “Çelik Yılmaz” → ayse.celikyilmaz). Türkçe karakterler sadeleştirilir. */
export const kullaniciOner = (ad: string, soyad: string): string =>
  [ad, soyad]
    .join('.')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9.]/g, '')

/** Varsayılan şifre: yönetici değiştirmezse kullanılır, çalışan ilk girişte değiştirir. */
export const VARSAYILAN_SIFRE = '123456'

/** Rastgele, okunması kolay şifre (harf + rakam). */
export const rastgeleSifreUret = (uzunluk = 10): string => {
  const karakterler = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bayt = new Uint32Array(uzunluk)
  crypto.getRandomValues(bayt)
  return Array.from(bayt, (b) => karakterler[b % karakterler.length]).join('')
}
