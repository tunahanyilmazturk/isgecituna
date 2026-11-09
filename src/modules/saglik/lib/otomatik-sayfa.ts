import { useLayoutEffect, useState, type RefObject } from 'react'

/** Sayfa altındaki sayfalama çubuğu ve uygulama kenar boşluğu için ayrılan alan (px) */
const ALT_PAY = 96
/** Mobilde alt gezinme çubuğu da hesaba katılır */
const MOBIL_ALT_PAY = 160
const BASLIK_YUKSEKLIK = 37
const KART_ARASI = 12

/**
 * Listenin ekrana sığacak kadar kayıt sayısını hesaplar; sayfada kaydırma çıkmadan
 * tek ekran kullanılmasını sağlar.
 *  - 'liste': tablo satırları (başlık ayrıca düşülür)
 *  - 'kart': ızgara kartları (sütun sayısı ızgaranın şablonundan okunur)
 * `ref` liste kapsayıcısına bağlanır. `tetik` değişince ölçüm yenilenir.
 */
export function useOtomatikSatir(ref: RefObject<HTMLDivElement | null>, mod: 'liste' | 'kart', tetik: unknown[]): number {
  const [satir, setSatir] = useState(8)

  useLayoutEffect(() => {
    const hesapla = () => {
      const el = ref.current
      if (!el) return
      const ustKonum = el.getBoundingClientRect().top
      const altPay = window.innerWidth < 768 ? MOBIL_ALT_PAY : ALT_PAY
      const kullanilabilir = Math.max(0, window.innerHeight - ustKonum - altPay)

      if (mod === 'liste') {
        const satirEl = el.querySelector('tbody tr') as HTMLElement | null
        const satirYuksekligi = satirEl?.getBoundingClientRect().height || 44
        setSatir(Math.max(3, Math.floor((kullanilabilir - BASLIK_YUKSEKLIK) / satirYuksekligi)))
        return
      }

      const izgara = (el.classList.contains('grid') ? el : el.querySelector('.grid')) as HTMLElement | null
      const kaynak = izgara ?? el
      const kart = kaynak.firstElementChild as HTMLElement | null
      const kartYuksekligi = kart?.getBoundingClientRect().height || 120
      const sutun = Math.max(1, getComputedStyle(kaynak).gridTemplateColumns.split(' ').filter(Boolean).length)
      const satirSayisi = Math.max(1, Math.floor((kullanilabilir + KART_ARASI) / (kartYuksekligi + KART_ARASI)))
      setSatir(satirSayisi * sutun)
    }

    hesapla()
    window.addEventListener('resize', hesapla)
    return () => window.removeEventListener('resize', hesapla)
    // Ölçüm; görünüm ve kayıt sayısı değişince yeniden yapılır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod, ...tetik])

  return satir
}
