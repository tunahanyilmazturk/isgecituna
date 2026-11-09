/**
 * Şifre özeti — PBKDF2-SHA256 (Web Crypto), kullanıcı başına rastgele tuz.
 *
 * Kayıt biçimi: `pbkdf2-sha256$<iterasyon>$<tuz base64>$<özet base64>`
 * Eski biçim (`fnv1a$...`) yalnızca doğrulama için tanınır; başarılı girişte
 * yeni biçime yükseltilir (bkz. auth-store).
 *
 * Not: İstemci tarafı hash, sunucu tarafı kimlik doğrulamanın yerini tutmaz.
 * Gerçek üretimde doğrulama backend'de yapılmalıdır.
 */

export const SIFRE_ITERASYON = 600_000
const PREFIX = 'pbkdf2-sha256$'
const LEGACY_PREFIX = 'fnv1a$'
const enc = new TextEncoder()

const toB64 = (bytes: Uint8Array): string => {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

const fromB64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

const turet = async (sifre: string, tuz: Uint8Array<ArrayBuffer>, iterasyon: number): Promise<Uint8Array> => {
  const anahtar = await crypto.subtle.importKey('raw', enc.encode(sifre), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: tuz, iterations: iterasyon },
    anahtar,
    256,
  )
  return new Uint8Array(bits)
}

/** Yeni kayıt için özet üretir (rastgele tuzlu). */
export const sifreHashle = async (sifre: string): Promise<string> => {
  const tuz = crypto.getRandomValues(new Uint8Array(16))
  const ozet = await turet(sifre, tuz, SIFRE_ITERASYON)
  return `${PREFIX}${SIFRE_ITERASYON}$${toB64(tuz)}$${toB64(ozet)}`
}

const sabitZamanliEsit = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false
  let fark = 0
  for (let i = 0; i < a.length; i++) fark |= a[i] ^ b[i]
  return fark === 0
}

/** Eski FNV-1a özeti — yalnızca eski kayıtları doğrulamak için. */
const eskiFnv1a = (s: string): string => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `${LEGACY_PREFIX}${(h >>> 0).toString(16)}`
}

/** Kayıtlı özete göre şifreyi doğrular. */
export const sifreDogrula = async (sifre: string, kayitli?: string): Promise<boolean> => {
  if (!kayitli) return false
  if (kayitli.startsWith(PREFIX)) {
    const [, iterasyon, tuzB64, ozetB64] = kayitli.split('$')
    const ozet = await turet(sifre, fromB64(tuzB64), Number(iterasyon))
    return sabitZamanliEsit(ozet, fromB64(ozetB64))
  }
  if (kayitli.startsWith(LEGACY_PREFIX)) return eskiFnv1a(sifre) === kayitli
  return false
}

/** Kayıt hâlâ eski biçimde mi (yükseltme gerekir)? */
export const sifreYukseltilmeli = (kayitli?: string): boolean =>
  !!kayitli && !kayitli.startsWith(PREFIX)
