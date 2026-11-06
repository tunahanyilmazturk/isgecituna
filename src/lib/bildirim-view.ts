import { AlertTriangleIcon, CheckCircle2Icon, UserPlusIcon } from 'lucide-react'
import type { UygulamaBildirimi } from '@/stores/bildirim-store'

/** Uygulama bildiriminin zil menülerinde gösterilecek hali */
export const bildirimGorunumu = (b: UygulamaBildirimi) => ({
  ikon: b.ton === 'red' ? AlertTriangleIcon : b.ton === 'emerald' ? CheckCircle2Icon : UserPlusIcon,
  ton: b.ton,
  baslik: b.baslik,
  detay: b.detay,
  to: b.to,
  okundu: b.okundu,
})
