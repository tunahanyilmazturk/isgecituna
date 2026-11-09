import { describe, expect, it } from 'vitest'
import { atlamaSiniri, enIleriGuncelle, izlenenYuzde } from './izleme'

describe('enIleriGuncelle', () => {
  it('normal oynatmada en uzak noktayı ilerletir', () => {
    expect(enIleriGuncelle(10, 10, 10.25)).toBe(10.25)
  })

  it('büyük zaman sıçramasını (atlama) saymaz', () => {
    expect(enIleriGuncelle(10, 10, 300)).toBe(10)
  })

  it('geriye sarmayı en uzak noktayı düşürmez', () => {
    expect(enIleriGuncelle(120, 60, 50)).toBe(120)
  })

  it('arama sırasında ilerlemeyi dondurur', () => {
    expect(enIleriGuncelle(10, 10, 11, true)).toBe(10)
  })
})

describe('atlamaSiniri', () => {
  it('izlenmemiş konuma atlamayı en uzak noktaya sınırlar', () => {
    expect(atlamaSiniri(500, 120)).toBe(120)
  })

  it('izlenmiş konuma serbest geri ve ileri dönüşe izin verir', () => {
    expect(atlamaSiniri(60, 120)).toBe(60)
    expect(atlamaSiniri(0, 120)).toBe(0)
  })

  it('küçük toleranslı ileri adıma izin verir', () => {
    expect(atlamaSiniri(121, 120)).toBe(121)
  })

  it('negatif hedefi sıfıra çeker', () => {
    expect(atlamaSiniri(-5, 120)).toBe(0)
  })
})

describe('izlenenYuzde', () => {
  it('en uzak noktaya göre yüzde hesaplar', () => {
    expect(izlenenYuzde(300, 600)).toBe(50)
  })

  it('toplam süre bilinmiyorsa sıfır döner', () => {
    expect(izlenenYuzde(300, 0)).toBe(0)
  })
})
