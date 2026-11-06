import { describe, expect, it } from 'vitest'
import {
  gunIndeksi,
  gununIpucu,
  kalanGunMetni,
  kalanSureDakika,
  selamlama,
  siradakiIcerik,
  type SurumYapisi,
} from './katilimci'
import { KATILIMCI_IPUCLARI } from '@/data/katilimci-ipuclari'

const surum: SurumYapisi = {
  bolumler: [
    {
      baslik: 'Giriş',
      icerikler: [
        { id: 'A', baslik: 'Kavramlar', zorunlu: true, sureDakika: 5 },
        { id: 'B', baslik: 'Kısa not', zorunlu: false, sureDakika: 3 },
      ],
    },
    {
      baslik: 'Riskler',
      icerikler: [
        { id: 'C', baslik: 'Risk rehberi', zorunlu: true, sureDakika: 12 },
        { id: 'D', baslik: 'KKD', zorunlu: true, sureDakika: 9 },
      ],
    },
  ],
}

describe('siradakiIcerik', () => {
  it('ilk tamamlanmamış zorunlu içeriği ve zorunlu sırasını döner', () => {
    const sonuc = siradakiIcerik(surum, { icerikler: { A: { tamamlandi: true } } })
    expect(sonuc?.icerik.id).toBe('C')
    expect(sonuc?.bolumBaslik).toBe('Riskler')
    expect(sonuc?.sira).toBe(2)
    expect(sonuc?.toplam).toBe(3)
  })

  it('isteğe bağlı içerikleri sıraya dahil etmez', () => {
    const sonuc = siradakiIcerik(surum, undefined)
    expect(sonuc?.icerik.id).toBe('A')
    expect(sonuc?.toplam).toBe(3)
  })

  it('tüm zorunlu içerikler bitince null döner', () => {
    const sonuc = siradakiIcerik(surum, {
      icerikler: { A: { tamamlandi: true }, C: { tamamlandi: true }, D: { tamamlandi: true } },
    })
    expect(sonuc).toBeNull()
  })
})

describe('kalanSureDakika', () => {
  it('yalnızca tamamlanmamış zorunlu içeriklerin süresini toplar', () => {
    expect(kalanSureDakika(surum, undefined)).toBe(26)
    expect(kalanSureDakika(surum, { icerikler: { C: { tamamlandi: true } } })).toBe(14)
  })
})

describe('selamlama', () => {
  it('saate göre doğru karşılamayı seçer', () => {
    expect(selamlama(8)).toBe('Günaydın')
    expect(selamlama(14)).toBe('İyi günler')
    expect(selamlama(21)).toBe('İyi akşamlar')
    expect(selamlama(2)).toBe('İyi akşamlar')
  })
})

describe('kalanGunMetni', () => {
  it('geçmiş, bugün ve gelecek tarihleri ayırt eder', () => {
    expect(kalanGunMetni('2026-11-03', '2026-11-06')).toBe('3 gün gecikti')
    expect(kalanGunMetni('2026-11-06', '2026-11-06')).toBe('bugün son gün')
    expect(kalanGunMetni('2026-11-10', '2026-11-06')).toBe('4 gün kaldı')
  })
})

describe('gununIpucu', () => {
  it('aynı gün için aynı ipucunu, farklı günler için farklı ipuçlarını döner', () => {
    expect(gununIpucu('2026-11-06')).toBe(gununIpucu('2026-11-06'))
    expect(gununIpucu('2026-11-06')).not.toBe(gununIpucu('2026-11-07'))
    expect(KATILIMCI_IPUCLARI).toContain(gununIpucu('2026-11-06'))
  })

  it('gün indeksi yılın başından itibaren hesaplanır', () => {
    expect(gunIndeksi('2026-01-01')).toBe(0)
    expect(gunIndeksi('2026-11-06')).toBe(309)
  })
})
