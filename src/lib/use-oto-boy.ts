import { useEffect, useRef, useState } from 'react'

export function useOtoBoy(
  gorunum: 'liste' | 'kart',
  olc: { satirH: number; baslikH: number; kartH: number; kartW: number },
) {
  const alanRef = useRef<HTMLDivElement>(null)
  const [otoBoy, setOtoBoy] = useState(8)

  useEffect(() => {
    const el = alanRef.current
    if (!el) return
    const hesapla = () => {
      if (gorunum === 'liste') {
        // Sayfa araç çubukları ve alt sayfalama alanı düşüldükten sonra gerçekten
        // listeye ayrılan yüksekliği ölç; viewport hesabı fazladan satır seçip
        // ana sayfada dikey kaydırma oluşturabiliyordu.
        const bos = el.clientHeight - olc.baslikH
        setOtoBoy(Math.max(1, Math.floor(bos / olc.satirH)))
      } else {
        const kolon = Math.max(1, Math.floor(el.clientWidth / olc.kartW))
        const bos = Math.max(el.clientHeight, window.innerHeight - el.getBoundingClientRect().top)
        const satir = Math.max(1, Math.floor(bos / olc.kartH))
        setOtoBoy(kolon * satir)
      }
    }
    hesapla()
    const ro = new ResizeObserver(hesapla)
    ro.observe(el)
    return () => ro.disconnect()
  }, [gorunum, olc.satirH, olc.baslikH, olc.kartH, olc.kartW])

  return { alanRef, otoBoy }
}
