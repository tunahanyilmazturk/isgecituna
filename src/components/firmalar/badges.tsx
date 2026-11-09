import { Pill } from '@/components/pill'
import {
  firmaDurumTone,
  sozlesmeDurumu,
  sozlesmeTone,
  tehlikeTone,
} from '@/data/firmalar'
import { katipDurumTone, kalanGunMetin, kalanGunTone } from '@/data/isgkatip'
import type { Firma, FirmaDurum, TehlikeSinifi } from '@/data/firmalar'
import type { KatipDurum } from '@/data/isgkatip'

export function FirmaDurumBadge({ durum }: { durum: FirmaDurum }) {
  return <Pill tone={firmaDurumTone[durum]}>{durum}</Pill>
}

export function TehlikeBadge({ sinif }: { sinif: TehlikeSinifi | '' }) {
  if (!sinif) return <Pill tone="zinc">—</Pill>
  return <Pill tone={tehlikeTone[sinif]}>{sinif}</Pill>
}

export function SozlesmeBadge({ firma }: { firma: Firma }) {
  const d = sozlesmeDurumu(firma)
  return <Pill tone={sozlesmeTone[d]}>{d === 'Yaklaşıyor' ? 'Yaklaşıyor' : d}</Pill>
}

export function KatipDurumBadge({ durum }: { durum: KatipDurum }) {
  return <Pill tone={katipDurumTone[durum]}>{durum}</Pill>
}

/** Sözleşme bitişine kalan gün — dolunca kırmızı, yaklaşınca turuncu */
export function KalanGunBadge({ bitis }: { bitis: string }) {
  if (!bitis) return <Pill tone="zinc">—</Pill>
  return <Pill tone={kalanGunTone(bitis)}>{kalanGunMetin(bitis)}</Pill>
}

/** Görevlendirilmemiş personel alanı */
export function EksikGorev({ rol }: { rol: string }) {
  return <Pill tone="red">Eksik — {rol} yok</Pill>
}
