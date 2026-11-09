import { describe, expect, it } from 'vitest'
import { pdfOlustur } from './pdf-utils'

// 1x1 PNG — jsPDF gerçek bir görüntü gömdüğünü doğrulamak için yeterli
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const sahteCanvas = () => ({ toDataURL: () => PNG }) as unknown as HTMLCanvasElement

describe('pdfOlustur', () => {
  it('her sayfayı kendi yönüyle ekler', async () => {
    const pdf = await pdfOlustur(
      [
        { cv: sahteCanvas(), yon: 'yatay' },
        { cv: sahteCanvas(), yon: 'dikey' },
      ],
      { baslik: 'Test belgesi' },
    )
    expect(pdf.getNumberOfPages()).toBe(2)
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 1)
  })

  it('başlık ve üretici bilgisini belge özelliklerine yazar', async () => {
    const pdf = await pdfOlustur([{ cv: sahteCanvas(), yon: 'dikey' }], { baslik: 'Test belgesi', konu: 'Denetim' })
    const icerik = new TextDecoder('latin1').decode(pdf.output('arraybuffer'))
    expect(icerik).toContain('Test belgesi')
    expect(icerik).toContain('isghub')
  })

  it('sayfa olmadan belge üretmez', async () => {
    await expect(pdfOlustur([], { baslik: 'Boş' })).rejects.toThrow('en az bir sayfa')
  })
})
