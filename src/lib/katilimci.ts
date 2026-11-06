import { TODAY } from '@/data/dashboard'
import { KATILIMCI_IPUCLARI } from '@/data/katilimci-ipuclari'

/** Yalnızca bu yardımcıların ihtiyaç duyduğu minimum eğitim şekli */
export interface IcerikYapisi {
  id: string
  baslik: string
  zorunlu: boolean
  sureDakika: number
}

export interface SurumYapisi {
  bolumler: { baslik: string; icerikler: IcerikYapisi[] }[]
}

export interface IcerikDurumu {
  icerikler: Record<string, { tamamlandi?: boolean }>
}

export interface SiradakiIcerik {
  icerik: IcerikYapisi
  bolumBaslik: string
  /** Zorunlu içerikler içinde 1'den başlayan sıra numarası */
  sira: number
  toplam: number
}

const zorunluIcerikler = (sv: SurumYapisi | undefined) =>
  sv?.bolumler.flatMap((b) => b.icerikler.filter((i) => i.zorunlu).map((i) => ({ ...i, bolumBaslik: b.baslik }))) ?? []

/** İlk tamamlanmamış zorunlu içerik; hepsi bitmişse null. */
export const siradakiIcerik = (sv: SurumYapisi | undefined, il: IcerikDurumu | undefined): SiradakiIcerik | null => {
  const liste = zorunluIcerikler(sv)
  const ix = liste.findIndex((i) => !il?.icerikler[i.id]?.tamamlandi)
  if (ix === -1) return null
  const { bolumBaslik, ...icerik } = liste[ix]
  return { icerik, bolumBaslik, sira: ix + 1, toplam: liste.length }
}

/** Tamamlanmamış zorunlu içeriklerin toplam süresi (dakika). */
export const kalanSureDakika = (sv: SurumYapisi | undefined, il: IcerikDurumu | undefined): number =>
  zorunluIcerikler(sv)
    .filter((i) => !il?.icerikler[i.id]?.tamamlandi)
    .reduce((toplam, i) => toplam + i.sureDakika, 0)

/** Saate göre karşılama metni. */
export const selamlama = (saat: number): string => {
  if (saat >= 5 && saat < 11) return 'Günaydın'
  if (saat >= 11 && saat < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

/** İki ISO tarih arasındaki gün farkı (to - from). */
export const gunFarki = (from: string, to: string): number =>
  Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000)

/** Son tarihe kalan gün metni, `bugun` referans alınarak. */
export const kalanGunMetni = (tarih: string, bugun: string = TODAY): string => {
  const fark = gunFarki(bugun, tarih)
  if (!Number.isFinite(fark)) return ''
  if (fark < 0) return `${Math.abs(fark)} gün gecikti`
  if (fark === 0) return 'bugün son gün'
  return `${fark} gün kaldı`
}

/** Yılın kaçıncı günü olduğu (0 tabanlı), ipucu seçimi için. */
export const gunIndeksi = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number)
  const bas = Date.UTC(y, 0, 1)
  return Math.floor((Date.UTC(y, m - 1, d) - bas) / 86_400_000)
}

/** Verilen güne ait ipucu; her gün farklı, aynı gün aynı kalır. */
export const gununIpucu = (iso: string = TODAY): string => {
  const liste = KATILIMCI_IPUCLARI
  return liste[gunIndeksi(iso) % liste.length]
}
