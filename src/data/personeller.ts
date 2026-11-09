/* Müşteri firmalarının çalışanları — taramaya tabi kişiler. */

import type { Cinsiyet } from '@/data/ekip'

export type PersonelDurum = 'Aktif' | 'Pasif'

export interface FirmaPersonel {
  id: string
  /** Firma unvanı (firmalar ile bağlantı) */
  firma: string
  ad: string
  soyad: string
  cinsiyet?: Cinsiyet
  /** Maskeli saklanır (KVKK): ***-***-**12 */
  tc?: string
  dogumTarihi?: string
  telefon: string
  eposta: string
  departman: string
  pozisyon: string
  iseGiris: string
  durum: PersonelDurum
}

export const DEPARTMANLAR = ['Üretim', 'Bakım', 'Lojistik', 'İdari', 'Mutfak', 'Depo', 'Diğer'] as const

export const personellerSeed: FirmaPersonel[] = [
  { id: 'PRS-01', firma: 'Akdeniz Metal San. ve Tic. A.Ş.', ad: 'Mehmet', soyad: 'Demir', cinsiyet: 'Erkek', tc: '***-***-**21', telefon: '0532 401 11 01', eposta: 'mehmet.demir@akdenizmetal.com.tr', departman: 'Üretim', pozisyon: 'Kaynakçı', iseGiris: '2019-03-11', durum: 'Aktif' },
  { id: 'PRS-02', firma: 'Akdeniz Metal San. ve Tic. A.Ş.', ad: 'Elif', soyad: 'Aktaş', cinsiyet: 'Kadın', tc: '***-***-**47', telefon: '0533 402 22 02', eposta: 'elif.aktas@akdenizmetal.com.tr', departman: 'İdari', pozisyon: 'Muhasebe uzmanı', iseGiris: '2021-07-01', durum: 'Aktif' },
  { id: 'PRS-03', firma: 'Akdeniz Metal San. ve Tic. A.Ş.', ad: 'Burak', soyad: 'Koç', cinsiyet: 'Erkek', tc: '***-***-**90', telefon: '0534 403 33 03', eposta: 'burak.koc@akdenizmetal.com.tr', departman: 'Bakım', pozisyon: 'Bakım teknisyeni', iseGiris: '2017-10-02', durum: 'Aktif' },
  { id: 'PRS-04', firma: 'Ege Lojistik Ltd. Şti.', ad: 'Ayşe', soyad: 'Kılıç', cinsiyet: 'Kadın', tc: '***-***-**13', telefon: '0535 404 44 04', eposta: 'ayse.kilic@egelojistik.com.tr', departman: 'Depo', pozisyon: 'Depo görevlisi', iseGiris: '2022-01-17', durum: 'Aktif' },
  { id: 'PRS-05', firma: 'Ege Lojistik Ltd. Şti.', ad: 'Can', soyad: 'Şen', cinsiyet: 'Erkek', tc: '***-***-**58', telefon: '0536 405 55 05', eposta: 'can.sen@egelojistik.com.tr', departman: 'Lojistik', pozisyon: 'Sevkiyat sorumlusu', iseGiris: '2020-05-20', durum: 'Aktif' },
  { id: 'PRS-06', firma: 'Marmara Tekstil A.Ş.', ad: 'Zeynep', soyad: 'Arslan', cinsiyet: 'Kadın', tc: '***-***-**36', telefon: '0537 406 66 06', eposta: 'zeynep.arslan@marmaratekstil.com.tr', departman: 'Üretim', pozisyon: 'Dikim operatörü', iseGiris: '2018-09-03', durum: 'Aktif' },
  { id: 'PRS-07', firma: 'Marmara Tekstil A.Ş.', ad: 'Okan', soyad: 'Yurt', cinsiyet: 'Erkek', tc: '***-***-**74', telefon: '0538 407 77 07', eposta: 'okan.yurt@marmaratekstil.com.tr', departman: 'Üretim', pozisyon: 'Kesim operatörü', iseGiris: '2023-02-14', durum: 'Pasif' },
  { id: 'PRS-08', firma: 'Anadolu Gıda San. A.Ş.', ad: 'Leyla', soyad: 'Öztürk', cinsiyet: 'Kadın', tc: '***-***-**02', telefon: '0539 408 88 08', eposta: 'leyla.ozturk@anadolugida.com.tr', departman: 'Mutfak', pozisyon: 'Üretim sorumlusu', iseGiris: '2016-06-27', durum: 'Aktif' },
]
