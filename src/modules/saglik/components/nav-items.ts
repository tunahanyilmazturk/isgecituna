import {
  Building2Icon,
  BarChart3Icon,
  LayoutDashboardIcon,
  PackageIcon,
  CalendarDaysIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UserRoundIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  children?: { to: string; label: string; end?: boolean }[]
}

/**
 * Kenar çubuğu bölümleri, iş akışının sırasına göre: özet → günlük iş (teklif, tarama, takvim)
 * → müşteri kayıtları → kaynaklar (ekip, ekipman) → kataloglar → sistem.
 */
export const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Özet',
    items: [{ to: '/panel', label: 'Genel Bakış', icon: LayoutDashboardIcon, end: true }],
  },
  {
    label: 'İş akışı',
    items: [
      { to: '/panel/teklifler', label: 'Teklif', icon: ReceiptTextIcon },
      { to: '/panel/taramalar', label: 'Taramalar', icon: HeartPulseIcon },
      { to: '/panel/takvim', label: 'Takvim', icon: CalendarDaysIcon },
    ],
  },
  {
    label: 'Müşteriler',
    items: [
      { to: '/panel/firmalar', label: 'Firmalar', icon: Building2Icon },
      { to: '/panel/personeller', label: 'Firma personeli', icon: UsersIcon },
    ],
  },
  {
    label: 'Ekip ve ekipman',
    items: [
      { to: '/panel/ekip', label: 'Ekip', icon: UserRoundIcon },
      { to: '/panel/ekipmanlar', label: 'Ekipmanlar', icon: WrenchIcon },
    ],
  },
  {
    label: 'Katalog',
    items: [
      { to: '/panel/testler', label: 'Testler', icon: FlaskConicalIcon },
      { to: '/panel/test-paketleri', label: 'Test paketleri', icon: PackageIcon },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/panel/istatistikler', label: 'İstatistikler', icon: BarChart3Icon },
      { to: '/panel/ayarlar', label: 'Ayarlar', icon: SettingsIcon },
    ],
  },
]

const allItems = navSections.flatMap((s) => s.items)

const ayarlarAltSayfalar: Record<string, string> = {
  genel: 'Genel Ayarlar',
  kurum: 'Kurum Bilgileri',
  kullanicilar: 'Kullanıcı Yönetimi',
  izinler: 'Erişim İzinleri',
  ekip: 'Ekip ve Personel',
  bildirim: 'Bildirim Ayarları',
  guvenlik: 'Güvenlik ve Oturumlar',
  belgeler: 'Rapor ve Belgeler',
  tanimlar: 'Tanımlar ve Kataloglar',
  'is-akisi': 'İş Akışı ve Otomasyon',
  entegrasyonlar: 'Entegrasyonlar',
  veri: 'Veri ve Dışa Aktarım',
  gecmis: 'İşlem Geçmişi',
}

/** Kırıntı: etiket + tıklanınca açılacak rota (rotası olmayan kırıntı düz metin kalır). */
export interface Kirinti {
  label: string
  to?: string
}

/** Sayfa kırıntısı: üst menü + (varsa) alt sayfa; her biri bağlantıdır. */
export const pageCrumbs = (pathname: string): Kirinti[] => {
  const ustMenu = (to: string) => {
    const item = allItems.find((i) => i.to === to)
    return { label: item?.label ?? to, to }
  }
  if (pathname === '/panel') return [{ label: 'Genel Bakış' }]
  if (pathname === '/panel/teklifler/yeni') return [ustMenu('/panel/teklifler'), { label: 'Yeni teklif' }]
  if (pathname.startsWith('/panel/teklifler/')) return [ustMenu('/panel/teklifler'), { label: 'Teklif detayı' }]
  if (pathname === '/panel/taramalar/yeni') return [ustMenu('/panel/taramalar'), { label: 'Yeni tarama' }]
  if (pathname.startsWith('/panel/taramalar/')) return [ustMenu('/panel/taramalar'), { label: 'Tarama detayı' }]
  if (pathname.startsWith('/panel/firmalar/')) return [ustMenu('/panel/firmalar'), { label: 'Firma Detayı' }]
  if (pathname.startsWith('/panel/ayarlar')) {
    const seg = pathname.split('/')[3]
    return ayarlarAltSayfalar[seg]
      ? [ustMenu('/panel/ayarlar'), { label: ayarlarAltSayfalar[seg], to: `/panel/ayarlar/${seg}` }]
      : [ustMenu('/panel/ayarlar')]
  }
  if (pathname === '/panel/profil') return [{ label: 'Profil', to: '/panel/profil' }]
  // Segment bazlı eşleşme: /panel/ekip, /panel/ekipmanlar'ı kapsamaz
  const eslesir = (to: string, end?: boolean) =>
    pathname === to || (!end && pathname.startsWith(`${to}/`))
  for (const item of allItems) {
    const child = item.children?.find((c) => eslesir(c.to, c.end))
    if (child) {
      return child.to === item.to
        ? [{ label: item.label, to: item.to }]
        : [{ label: item.label, to: item.to }, { label: child.label, to: child.to }]
    }
    if (eslesir(item.to, item.end)) return [{ label: item.label, to: item.to }]
  }
  return []
}
