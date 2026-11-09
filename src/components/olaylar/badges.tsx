import { Pill } from '@/components/pill'
import { durumTone, riskTone, turTone } from '@/data/olaylar'
import type { OlayDurumu, OlayTuru, RiskSeviyesi } from '@/data/olaylar'

export function RiskBadge({ risk }: { risk: RiskSeviyesi }) {
  return <Pill tone={riskTone[risk]}>{risk}</Pill>
}

export function DurumBadge({ durum }: { durum: OlayDurumu }) {
  return <Pill tone={durumTone[durum]}>{durum}</Pill>
}

export function TurBadge({ tur }: { tur: OlayTuru }) {
  return <Pill tone={turTone[tur]}>{tur}</Pill>
}
