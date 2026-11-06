export type HariciVideoKaynak =
  | { tur: 'dosya'; url: string }
  | { tur: 'yerlesik'; url: string; saglayici: 'YouTube' | 'Vimeo' }

/** Yalnızca bilinen video sağlayıcılarını iframe'e dönüştürür; diğer URL'ler video kaynağı olmalıdır. */
export const hariciVideoKaynakCoz = (girdi: string): HariciVideoKaynak | null => {
  try {
    const url = new URL(girdi.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    const host = url.hostname.toLowerCase().replace(/^www\./, '')

    if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const parcalar = url.pathname.split('/').filter(Boolean)
      const id = host === 'youtu.be'
        ? parcalar[0]
        : url.searchParams.get('v') ?? (['embed', 'shorts', 'live'].includes(parcalar[0] ?? '') ? parcalar[1] : undefined)
      if (!id || !/^[\w-]{11}$/.test(id)) return null
      const baslangicMetni = url.searchParams.get('start') ?? url.searchParams.get('t') ?? ''
      const zamanParcalari = baslangicMetni.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
      const baslangic = /^\d+$/.test(baslangicMetni)
        ? Number(baslangicMetni)
        : zamanParcalari
          ? Number(zamanParcalari[1] ?? 0) * 3600 + Number(zamanParcalari[2] ?? 0) * 60 + Number(zamanParcalari[3] ?? 0)
          : 0
      const query = new URLSearchParams({ rel: '0', playsinline: '1' })
      if (Number.isFinite(baslangic) && baslangic > 0) query.set('start', String(baslangic))
      return { tur: 'yerlesik', url: `https://www.youtube-nocookie.com/embed/${id}?${query}`, saglayici: 'YouTube' }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const parcalar = url.pathname.split('/').filter(Boolean)
      const id = parcalar.find((parca) => /^\d+$/.test(parca))
      if (!id) return null
      const gizliKod = url.searchParams.get('h') ?? parcalar[parcalar.indexOf(id) + 1]
      const query = new URLSearchParams()
      if (gizliKod && !/^\d+$/.test(gizliKod)) query.set('h', gizliKod)
      const ek = query.size ? `?${query}` : ''
      return { tur: 'yerlesik', url: `https://player.vimeo.com/video/${id}${ek}`, saglayici: 'Vimeo' }
    }

    if (!url.pathname.toLowerCase().match(/\.(mp4|m4v|webm|ogg|ogv|m3u8)$/)) return null
    return { tur: 'dosya', url: url.toString() }
  } catch {
    return null
  }
}
