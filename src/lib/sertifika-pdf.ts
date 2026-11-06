/*
 * Sertifika PDF üretimi — belge canvas'a çizilir (Türkçe karakterler ve
 * Geist fontu tarayıcıda doğal desteklenir), PNG olarak jsPDF'e gömülür.
 * A4 yatay, kurumsal tasarım, QR doğrulama kodu.
 */
import { dogrulamaUrl, type Sertifika } from '@/data/sertifikalar'
import { osgbAd, osgbLogoHarf, osgbLogoVeri } from '@/lib/osgb'

const W = 2339 // 297mm @ ~200dpi
const H = 1654 // 210mm

const FONT = `'Geist Variable', 'Geist', 'Segoe UI', system-ui, sans-serif`

const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
}

const logoGorseliYukle = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = reject
  img.src = src
})

/** Sertifikayı canvas'a çizen asıl fonksiyon — önizleme ve PDF aynı çıktıyı üretir */
export const sertifikaCiz = async (
  c: CanvasRenderingContext2D,
  s: Sertifika,
  w = W,
  h = H,
): Promise<void> => {
  const k = w / W // ölçek
  const px = (v: number) => v * k
  const ana = s.sablonSnap.anaRenk
  const vurgu = s.sablonSnap.vurguRenk

  // zemin
  c.fillStyle = '#FBFCFE'
  c.fillRect(0, 0, w, h)

  // filigran
  c.save()
  c.translate(w / 2, h / 2)
  c.rotate(-Math.PI / 10)
  c.font = `700 ${px(210)}px ${FONT}`
  c.fillStyle = `${ana}08`
  c.textAlign = 'center'
  c.fillText(osgbAd(), 0, px(60))
  c.restore()

  // çift çerçeve
  c.strokeStyle = ana
  c.lineWidth = px(9)
  c.strokeRect(px(28), px(28), w - px(56), h - px(56))
  c.strokeStyle = `${vurgu}55`
  c.lineWidth = px(2)
  c.strokeRect(px(52), px(52), w - px(104), h - px(104))

  // üst köşe vurguları
  c.fillStyle = vurgu
  c.fillRect(px(28), px(28), px(150), px(10))
  c.fillRect(w - px(178), px(28), px(150), px(10))

  // logo
  const lx = px(96), ly = px(96)
  const logo = osgbLogoVeri()
  if (logo) {
    const image = await logoGorseliYukle(logo)
    const kutu = px(72)
    const oran = Math.min(kutu / image.naturalWidth, kutu / image.naturalHeight)
    const logoW = image.naturalWidth * oran
    const logoH = image.naturalHeight * oran
    c.save()
    rr(c, lx, ly, px(72), px(72), px(16))
    c.clip()
    c.fillStyle = '#fff'
    c.fillRect(lx, ly, kutu, kutu)
    c.drawImage(image, lx + (kutu - logoW) / 2, ly + (kutu - logoH) / 2, logoW, logoH)
    c.restore()
  } else {
    c.fillStyle = ana
    rr(c, lx, ly, px(72), px(72), px(16))
    c.fill()
    c.fillStyle = '#fff'
    c.font = `800 ${px(30)}px ${FONT}`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(osgbLogoHarf(), lx + px(36), ly + px(38))
  }
  c.textAlign = 'left'
  c.textBaseline = 'alphabetic'
  c.fillStyle = ana
  c.font = `700 ${px(30)}px ${FONT}`
  c.fillText(osgbAd(), lx + px(92), ly + px(34))
  c.fillStyle = '#64748B'
  c.font = `400 ${px(20)}px ${FONT}`
  c.fillText('İş Sağlığı ve Güvenliği Yönetim Sistemi', lx + px(92), ly + px(62))

  // başlık
  c.textAlign = 'center'
  c.fillStyle = ana
  c.font = `700 ${px(46)}px ${FONT}`
  const baslik = s.sablonSnap.baslik
  c.fillText(baslik, w / 2, px(330))
  // başlık altı şerit
  const tw = c.measureText(baslik).width
  c.fillStyle = vurgu
  c.fillRect(w / 2 - tw / 2 - px(40), px(358), px(30), px(4))
  c.fillRect(w / 2 + tw / 2 + px(10), px(358), px(30), px(4))

  // belge türü rozet (resmî belge ayrımı)
  if (s.belgeTuru === 'resmi') {
    c.font = `600 ${px(19)}px ${FONT}`
    const rt = 'RESMÎ BELGE'
    const rw = c.measureText(rt).width + px(36)
    c.strokeStyle = ana
    c.lineWidth = px(1.5)
    rr(c, w / 2 - rw / 2, px(378), rw, px(34), px(17))
    c.stroke()
    c.fillStyle = ana
    c.fillText(rt, w / 2, px(402))
  }

  // takdim metni
  c.fillStyle = '#475569'
  c.font = `400 ${px(26)}px ${FONT}`
  c.fillText('Bu belge,', w / 2, px(480))

  // personel adı — büyük
  c.fillStyle = ana
  c.font = `800 ${px(78)}px ${FONT}`
  c.fillText(s.personelAd, w / 2, px(575))
  // ad altı çizgi
  const nw = Math.min(c.measureText(s.personelAd).width + px(120), w - px(400))
  const gr = c.createLinearGradient(w / 2 - nw / 2, 0, w / 2 + nw / 2, 0)
  gr.addColorStop(0, `${vurgu}00`)
  gr.addColorStop(0.5, vurgu)
  gr.addColorStop(1, `${vurgu}00`)
  c.fillStyle = gr
  c.fillRect(w / 2 - nw / 2, px(598), nw, px(3))

  c.fillStyle = '#475569'
  c.font = `400 ${px(26)}px ${FONT}`
  c.fillText(`${s.firmaAd} çalışanı olarak`, w / 2, px(672))
  c.fillText('aşağıda belirtilen eğitimi başarıyla tamamlayarak', w / 2, px(716))

  // eğitim adı
  c.fillStyle = ana
  c.font = `700 ${px(44)}px ${FONT}`
  c.fillText(`“${s.egitimAd}”`, w / 2, px(792))

  c.fillStyle = '#475569'
  c.font = `400 ${px(25)}px ${FONT}`
  c.fillText(
    `sertifika almaya hak kazanmıştır.  (v${s.egitimSurumNo} · ${s.egitimSure} dk · ${s.egitimKategori})`,
    w / 2,
    px(838),
  )

  // meta üçlü
  const metaY = px(930)
  const metalar: [string, string][] = [
    ['Eğitim Tamamlanma', s.tamamlanmaTarihi],
    ['Düzenlenme Tarihi', s.duzenlenmeTarihi],
    ['Geçerlilik', s.gecerlilikTarihi ?? 'Süresiz'],
  ]
  const mw = w / 3 - px(200)
  metalar.forEach(([l, v], i) => {
    const cx = px(200) + i * (w / 3)
    c.fillStyle = '#94A3B8'
    c.font = `600 ${px(18)}px ${FONT}`
    c.fillText(l.toUpperCase(), cx + mw / 2, metaY)
    c.fillStyle = ana
    c.font = `600 ${px(28)}px ${FONT}`
    c.fillText(v, cx + mw / 2, metaY + px(44))
  })

  // imzalar
  const iy = h - px(330)
  s.sablonSnap.imzalar.forEach((im, i) => {
    const cx = px(280) + i * px(380)
    c.strokeStyle = ana
    c.lineWidth = px(1.5)
    c.beginPath()
    c.moveTo(cx, iy)
    c.lineTo(cx + px(300), iy)
    c.stroke()
    c.textAlign = 'left'
    c.fillStyle = ana
    c.font = `600 ${px(24)}px ${FONT}`
    c.fillText(im.adSoyad, cx, iy + px(40))
    c.fillStyle = '#64748B'
    c.font = `400 ${px(19)}px ${FONT}`
    c.fillText(im.unvan, cx, iy + px(70))
  })

  // QR + doğrulama (sağ alt)
  const { default: QRCode } = await import('qrcode')
  const qEl = document.createElement('canvas')
  await QRCode.toCanvas(qEl, dogrulamaUrl(s.dogrulamaKodu), {
    width: 300,
    margin: 1,
    color: { dark: ana, light: '#00000000' },
  })
  const qSize = px(190)
  const qx = w - px(200) - qSize
  const qy = h - px(330)
  c.strokeStyle = `${ana}40`
  c.lineWidth = px(1.5)
  c.strokeRect(qx - px(14), qy - px(14), qSize + px(28), qSize + px(28))
  c.drawImage(qEl, qx, qy, qSize, qSize)
  c.textAlign = 'center'
  c.fillStyle = '#64748B'
  c.font = `500 ${px(17)}px ${FONT}`
  c.fillText('Doğrulamak için okutun', qx + qSize / 2, qy + qSize + px(44))
  c.fillStyle = ana
  c.font = `700 ${px(21)}px ${FONT}`
  c.fillText(s.sertifikaNo, qx + qSize / 2, qy + qSize + px(76))

  // alt bilgi bandı
  c.fillStyle = `${ana}0D`
  c.fillRect(px(52), h - px(150), w - px(104), px(98))
  c.textAlign = 'left'
  c.fillStyle = '#64748B'
  c.font = `400 ${px(18)}px ${FONT}`
  c.fillText(`Sertifika No: ${s.sertifikaNo}`, px(96), h - px(110))
  c.fillText(`Doğrulama: ${dogrulamaUrl(s.dogrulamaKodu)}`, px(96), h - px(78))
  c.textAlign = 'right'
  c.fillText(`Onaylayan: ${s.onaylayan} · ${s.onayTarihi}`, w - px(96), h - px(110))
  c.fillText('Bu belge elektronik ortamda üretilmiştir', w - px(96), h - px(78))

  // iptal damgası
  if (s.durum === 'İptal Edildi') {
    c.save()
    c.translate(w / 2, h / 2)
    c.rotate(-Math.PI / 9)
    c.font = `800 ${px(120)}px ${FONT}`
    c.strokeStyle = '#DC2626AA'
    c.lineWidth = px(3)
    c.strokeRect(-px(430), -px(80), px(860), px(160))
    c.fillStyle = '#DC2626AA'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText('İPTAL EDİLDİ', 0, 0)
    c.restore()
  }
}

const cizim = async (s: Sertifika): Promise<HTMLCanvasElement> => {
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  await sertifikaCiz(ctx, s)
  return cv
}

/** Önizleme PNG data URL — sertifika başına önbellekte */
const onizleme = new Map<string, Promise<string>>()
export const sertifikaPng = (s: Sertifika): Promise<string> => {
  const key = `${s.id}:${s.durum}`
  if (!onizleme.has(key))
    onizleme.set(
      key,
      cizim(s).then((cv) => cv.toDataURL('image/png')),
    )
  return onizleme.get(key)!
}

/** Değişmez belge — her seferinde donmuş görüntüden aynı çıktı üretilir */
export const sertifikaPdfIndir = async (s: Sertifika): Promise<void> => {
  const { jsPDF } = await import('jspdf')
  const cv = await cizim(s)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, 297, 210, undefined, 'FAST')
  pdf.save(`${s.sertifikaNo}.pdf`)
}

/** PDF'i yeni sekmede görüntüle */
export const sertifikaPdfAc = async (s: Sertifika): Promise<void> => {
  const { jsPDF } = await import('jspdf')
  const cv = await cizim(s)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, 297, 210, undefined, 'FAST')
  window.open(pdf.output('bloburl'), '_blank')
}

/** Eski motorla PDF'in blob URL'i — önizleme penceresine yönlendirmek için (window.open çağırmaz). */
export const sertifikaPdfUrlEski = async (s: Sertifika): Promise<string> => {
  const { jsPDF } = await import('jspdf')
  const cv = await cizim(s)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, 297, 210, undefined, 'FAST')
  return String(pdf.output('bloburl'))
}

/** PNG görüntüsünü yeni pencerede yazdırılabilir hâlde aç */
export const sertifikaYazdir = async (s: Sertifika): Promise<void> => {
  const url = await sertifikaPng(s)
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(
    `<html><head><title>${s.sertifikaNo}</title><style>@page{size:A4 landscape;margin:0}body{margin:0}img{width:100%}</style></head>` +
      `<body><img src="${url}" onload="setTimeout(()=>{print();close()},100)"></body></html>`,
  )
  w.document.close()
}
