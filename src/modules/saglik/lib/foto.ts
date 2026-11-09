/**
 * Yüklenen fotoğrafı kare kırpıp küçültür ve JPEG data URL döndürür.
 * localStorage'da yer kaplamasın diye boyut 256px ile sınırlanır (~20–40 KB).
 */
export const fotoKucult = (dosya: File, boyut = 256): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!dosya.type.startsWith('image/')) return reject(new Error('Yalnızca görsel dosyası yükleyebilirsiniz.'))
    const url = URL.createObjectURL(dosya)
    const img = new Image()
    img.onload = () => {
      const kenar = Math.min(img.naturalWidth, img.naturalHeight)
      const sx = (img.naturalWidth - kenar) / 2
      const sy = (img.naturalHeight - kenar) / 2
      const canvas = document.createElement('canvas')
      canvas.width = boyut
      canvas.height = boyut
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return reject(new Error('Görsel işlenemedi.'))
      }
      ctx.drawImage(img, sx, sy, kenar, kenar, 0, 0, boyut, boyut)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Görsel okunamadı.'))
    }
    img.src = url
  })
