import type { PillTone } from '@/components/pill'
import type { Oncelik } from '@/data/dashboard'

export const oncelikTone: Record<Oncelik, PillTone> = {
  kritik: 'red',
  yuksek: 'amber',
  orta: 'zinc',
  dusuk: 'zinc',
}

export const oncelikLabel: Record<Oncelik, string> = {
  kritik: 'Kritik',
  yuksek: 'Yüksek',
  orta: 'Orta',
  dusuk: 'Düşük',
}
