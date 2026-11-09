/* Müşteri firmalar — tarama hizmeti alan kurumlar. */

export type FirmaDurum = 'Aktif' | 'Pasif'

export interface Firma {
  id: string
  unvan: string
  kisaAd: string
  vergiDairesi: string
  vergiNo: string
  il: string
  adres: string
  yetkili: string
  telefon: string
  eposta: string
  durum: FirmaDurum
}

export const FIRMA_ILLERI = ['Kocaeli', 'İzmir', 'Tekirdağ', 'İstanbul', 'Bursa', 'Ankara'] as const

export const firmalarSeed: Firma[] = [
  {
    id: 'FR-01',
    unvan: 'Akdeniz Metal San. ve Tic. A.Ş.',
    kisaAd: 'Akdeniz Metal',
    vergiDairesi: 'Gebze',
    vergiNo: '4410028731',
    il: 'Kocaeli',
    adres: 'Gebze OSB 3. Cad. No:14',
    yetkili: 'Nurcan Aksoy',
    telefon: '0262 555 01 10',
    eposta: 'ik@akdenizmetal.com.tr',
    durum: 'Aktif',
  },
  {
    id: 'FR-02',
    unvan: 'Ege Lojistik Ltd. Şti.',
    kisaAd: 'Ege Lojistik',
    vergiDairesi: 'Aliağa',
    vergiNo: '3120457786',
    il: 'İzmir',
    adres: 'Aliağa Depo Bölgesi No:7',
    yetkili: 'Hakan Demirtaş',
    telefon: '0232 611 22 33',
    eposta: 'operasyon@egelojistik.com.tr',
    durum: 'Aktif',
  },
  {
    id: 'FR-03',
    unvan: 'Marmara Tekstil A.Ş.',
    kisaAd: 'Marmara Tekstil',
    vergiDairesi: 'Çerkezköy',
    vergiNo: '6150098214',
    il: 'Tekirdağ',
    adres: 'Çerkezköy OSB Üretim Alanı',
    yetkili: 'Gülay Tunç',
    telefon: '0282 758 40 00',
    eposta: 'insankaynaklari@marmaratekstil.com.tr',
    durum: 'Aktif',
  },
  {
    id: 'FR-04',
    unvan: 'Anadolu Gıda San. A.Ş.',
    kisaAd: 'Anadolu Gıda',
    vergiDairesi: 'Gebze',
    vergiNo: '2770881345',
    il: 'Kocaeli',
    adres: 'Gebze Tesis Yolu No:22',
    yetkili: 'Serkan Yalçın',
    telefon: '0262 644 18 90',
    eposta: 'saglik@anadolugida.com.tr',
    durum: 'Aktif',
  },
]
