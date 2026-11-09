/*
 * Toplu personel aktarma yardımcıları — saf fonksiyonlar.
 * Üretimde aynı doğrulamalar backend'de de tekrarlanmalıdır.
 */

export type TopluKol =
  | 'ad'
  | 'soyad'
  | 'tc'
  | 'firma'
  | 'kullaniciAdi'
  | 'sifre'
  | 'departman'
  | 'gorev'

export interface KolDef {
  key: TopluKol
  label: string
  genislik: number
  /** Yapıştırılan veride tanınan başlık takma adları (normalize edilmiş karşılaştırma) */
  eslesme: string[]
}

export const TOPLU_KOLONLAR: KolDef[] = [
  { key: 'ad', label: 'Ad', genislik: 120, eslesme: ['ad', 'adı', 'adi', 'isim', 'ilk ad', 'first name', 'name', 'öad', 'ön ad', 'önad'] },
  { key: 'soyad', label: 'Soyad', genislik: 120, eslesme: ['soyad', 'soyadı', 'soyadi', 'surname', 'last name', 'aile adı'] },
  { key: 'tc', label: 'T.C. Kimlik No', genislik: 130, eslesme: ['tc', 't.c.', 'tckn', 'tc kimlik', 'tc kimlik no', 't.c. kimlik no', 'kimlik', 'kimlik no', 'kimlik numarası', 'tc no'] },
  { key: 'firma', label: 'Firma', genislik: 190, eslesme: ['firma', 'firma adı', 'firma adi', 'işyeri', 'is yeri', 'iş yeri', 'şirket', 'sirket', 'kurum', 'işveren', 'company'] },
  { key: 'kullaniciAdi', label: 'Kullanıcı Adı', genislik: 140, eslesme: ['kullanıcı adı', 'kullanici adi', 'kullaniciadi', 'username', 'kullanıcı'] },
  { key: 'sifre', label: 'Şifre', genislik: 110, eslesme: ['şifre', 'sifre', 'parola', 'password', 'geçici şifre'] },
  { key: 'departman', label: 'Departman', genislik: 120, eslesme: ['departman', 'bölüm', 'bolum', 'birim', 'department', 'departmant'] },
  { key: 'gorev', label: 'Görev', genislik: 140, eslesme: ['görev', 'gorev', 'meslek', 'unvan', 'ünvan', 'pozisyon', 'iş', 'görevi', 'title'] },
]

export const DUZENLENEBILIR: TopluKol[] = TOPLU_KOLONLAR.map((k) => k.key)

/** Türkçe-duyarlı normalize: küçük harf + aksan/indirgeme */
export const trNorm = (s: string) =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim()

const normBaslik = (s: string) => trNorm(s).replace(/[._\-/\\()]/g, ' ').replace(/\s+/g, ' ').trim()

// Alias'lar normalize edilmiş hâlde önbellekte tutulur (e-posta ↔ e posta gibi)
const ALIAS: [TopluKol, string[]][] = TOPLU_KOLONLAR.map((k) => [
  k.key,
  k.eslesme.map(normBaslik),
])

/** Başlık hücresini bilinen kolona eşle — eşleşemezse null döner */
export const baslikEslestir = (h: string): TopluKol | null => {
  const n = normBaslik(h)
  if (!n) return null
  for (const [key, adlar] of ALIAS) {
    if (adlar.includes(n)) return key
    // Birebir değilse "içerir" kuralı: 'T.C. Kimlik Numarası' gibi uzantılar
    if (adlar.some((a) => a.length > 2 && n.startsWith(`${a} `))) return key
  }
  return null
}

/** Satırın başlık satırı olup olmadığı — çoğunluğu tanınan başlıksa true */
export const baslikSatirimi = (satir: string[]) =>
  satir.filter((c) => baslikEslestir(c) !== null).length >= Math.max(1, Math.floor(satir.length / 3))

const AYRACLAR = ['\t', ';', ',']

/**
 * TSV/CSV metni satır matrisine çevirir.
 * Excel panosu her zaman TAB ayracıyla gelir; Türkçe CSV'lerde ';' yaygındır.
 * Ayraç satır bazında en yüksek frekanslı olana göre seçilir.
 */
export const metinAyristir = (metin: string): string[][] =>
  metin
    .split(/\r?\n/)
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      const ayrac = AYRACLAR.map((a) => ({ a, n: l.split(a).length })).sort((x, y) => y.n - x.n)[0].a
      return l.split(ayrac).map((c) => c.trim().replace(/^"(.*)"$/s, '$1').trim())
    })

/** TC kimlik no — 11 hane + resmi checksum algoritması */
export const tcGecerli = (tc: string): boolean => {
  if (!/^\d{11}$/.test(tc) || tc[0] === '0') return false
  const d = tc.split('').map(Number)
  const tek = d[0] + d[2] + d[4] + d[6] + d[8]
  const cift = d[1] + d[3] + d[5] + d[7]
  if ((tek * 7 - cift) % 10 !== d[9]) return false
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10]
}

/**
 * Ad+soyaddan kullanıcı adı üretir: adın ilk kelimesi + soyadın son kelimesi.
 * 'Mehmet Can Demir' → 'mehmet.demir'
 */
export const kullaniciAdiUret = (ad: string, soyad: string): string => {
  const ilk = trNorm(ad).split(/\s+/)[0] ?? ''
  const son = trNorm(soyad).split(/\s+/).pop() ?? ''
  return [ilk, son].filter(Boolean).join('.').replace(/[^a-z0-9.]/g, '')
}

/** Çakışan kullanıcı adına sıra numarası ekleyerek benzersiz üret */
export const benzersizKullaniciAdi = (taban: string, alinmi: (k: string) => boolean): string => {
  if (!taban) return ''
  if (!alinmi(taban)) return taban
  for (let i = 2; i < 1000; i++) {
    const aday = `${taban}${i}`
    if (!alinmi(aday)) return aday
  }
  return `${taban}.${Date.now().toString(36)}`
}

/** Karıştırılabilir karakterler dışarıda bırakılarak geçici şifre üretir */
export const rastgeleSifre = (uzunluk = 10): string => {
  const alfabe = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const dizi = new Uint32Array(uzunluk)
  crypto.getRandomValues(dizi)
  return [...dizi].map((n) => alfabe[n % alfabe.length]).join('')
}

/** İçerik parmak izi — KVKK metin sürümü değişmezliğini doğrulamak için */
export const icerikHash = (s: string): string => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

/** Toplu işlem satır tipi — grid ve doğrulama bunun üzerinde çalışır */
export interface TopluSatir {
  id: string
  hucre: Record<TopluKol, string>
  /** Oluşturma sonrası durum: 'olusturuldu' | 'hata' | 'bekliyor' */
  sonuc?: { ok: boolean; mesaj?: string }
}

let satirSeq = 0
export const bosSatir = (): TopluSatir => ({
  id: `s-${Date.now().toString(36)}-${(satirSeq++).toString(36)}`,
  hucre: {
    ad: '', soyad: '', tc: '', firma: '',
    kullaniciAdi: '', sifre: '', departman: '', gorev: '',
  },
})
