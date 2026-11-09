import { beforeEach, describe, expect, it } from 'vitest'
import { useBildirimStore, hedefBildirimleri, type BildirimHedef } from './bildirim-store'
import { useFirmalarStore } from './firmalar-store'

const ekle = (hedef: BildirimHedef) =>
  useBildirimStore.getState().ekle({ hedef, ton: 'amber', baslik: 'Test', detay: 'd', to: '/x' })

describe('bildirim-store', () => {
  beforeEach(() => useBildirimStore.setState({ bildirimler: [] }))

  it('bildirimleri hedefe göre ayırır', () => {
    ekle('osgb')
    ekle('katilimci:FP-1')
    ekle('firma:FR-01')
    const liste = useBildirimStore.getState().bildirimler
    expect(hedefBildirimleri(liste, 'osgb')).toHaveLength(1)
    expect(hedefBildirimleri(liste, 'katilimci:FP-1')).toHaveLength(1)
    expect(hedefBildirimleri(liste, 'katilimci:FP-2')).toHaveLength(0)
  })

  it('yalnızca ilgili hedefin bildirimlerini okundu yapar', () => {
    ekle('osgb')
    ekle('katilimci:FP-1')
    useBildirimStore.getState().hedefiOkundu('osgb')
    const liste = useBildirimStore.getState().bildirimler
    expect(hedefBildirimleri(liste, 'osgb')[0].okundu).toBe(true)
    expect(hedefBildirimleri(liste, 'katilimci:FP-1')[0].okundu).toBe(false)
  })

  it('en fazla 200 kayıt tutar', () => {
    for (let i = 0; i < 205; i++) ekle('osgb')
    expect(useBildirimStore.getState().bildirimler.length).toBe(200)
  })
})

describe('firma ekleme bildirimi için hedef', () => {
  it('firma kimliği hedef anahtarında kullanılabilir', () => {
    const firma = useFirmalarStore.getState().firmaEkle({ unvan: 'Hedef Test', kisaAd: 'HT' } as never)
    expect(`firma:${firma.id}`).toMatch(/^firma:FR-/)
  })
})
