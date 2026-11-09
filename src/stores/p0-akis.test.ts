import { beforeEach, describe, expect, it } from 'vitest'
import { durumHesapla, useEgitimlerStore } from './egitimler-store'
import { useFirmalarStore } from './firmalar-store'
import type { EgitimIlerleme, EgitimSurum } from '@/data/egitimler'

const tamamlanmisIcerikler = { 'IC-1': { tamamlandi: true } }

/** Tek zorunlu içerikli, manuel onaylı bir sürüm */
const surum = {
  bolumler: [{ id: 'B-1', baslik: 'Giriş', icerikler: [{ id: 'IC-1', zorunlu: true, tur: 'metin', baslik: 'x', aciklama: '', sureDakika: 5 }] }],
  tamamlama: { sinavZorunlu: false, manuelOnay: true, videoMinYuzde: 0 },
} as unknown as EgitimSurum

const ilerleme = (durum: EgitimIlerleme['durum'], icerikler: EgitimIlerleme['icerikler'] = tamamlanmisIcerikler): EgitimIlerleme =>
  ({
    id: 'ILR-T',
    hesapId: 'FP-T',
    egitimId: 'EGT-T',
    surumId: 'ES-T',
    atamaId: 'ATM-T',
    durum,
    icerikler,
    denemeler: [],
    sonErisim: '2026-11-06T10:00:00',
  }) as EgitimIlerleme

describe('durumHesapla — onay sonrası durum', () => {
  it('içerikler bitince manuel onaylı eğitim Onay Bekliyor olur', () => {
    expect(durumHesapla(surum, ilerleme('Devam Ediyor'))).toBe('Onay Bekliyor')
  })

  it('onaylanmış (Tamamlandı) kayıt içerik yeniden açılınca geri dönmez', () => {
    expect(durumHesapla(surum, ilerleme('Tamamlandı', {}))).toBe('Tamamlandı')
  })
})

describe('ilerlemeTamamla', () => {
  beforeEach(() => {
    useEgitimlerStore.setState((s) => ({
      ilerlemeler: [...s.ilerlemeler.filter((i) => i.id !== 'ILR-T'), ilerleme('Onay Bekliyor')],
    }))
  })

  it('Onay Bekliyor kaydını Tamamlandı yapar', () => {
    useEgitimlerStore.getState().ilerlemeTamamla('FP-T', 'ATM-T')
    const kayit = useEgitimlerStore.getState().ilerlemeler.find((i) => i.id === 'ILR-T')
    expect(kayit?.durum).toBe('Tamamlandı')
  })

  it('başka bir kişinin ya da atamanın kaydına dokunmaz', () => {
    useEgitimlerStore.getState().ilerlemeTamamla('FP-DIGER', 'ATM-T')
    const kayit = useEgitimlerStore.getState().ilerlemeler.find((i) => i.id === 'ILR-T')
    expect(kayit?.durum).toBe('Onay Bekliyor')
  })
})

describe('firmaEkle — ID çakışması', () => {
  it('eklenen her firmaya benzersiz ve mevcut olmayan bir ID verir', () => {
    const onceki = new Set(useFirmalarStore.getState().firmalar.map((f) => f.id))
    const a = useFirmalarStore.getState().firmaEkle({ unvan: 'Test A', kisaAd: 'A' } as never)
    const b = useFirmalarStore.getState().firmaEkle({ unvan: 'Test B', kisaAd: 'B' } as never)
    expect(onceki.has(a.id)).toBe(false)
    expect(onceki.has(b.id)).toBe(false)
    expect(a.id).not.toBe(b.id)
  })
})
