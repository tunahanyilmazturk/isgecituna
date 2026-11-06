import {
  AwardIcon,
  BookOpenIcon,
  Building2Icon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SirenIcon,
  UsersIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { modulGetir } from '@/data/rehber'
import { rehberGetir, useRehberStore } from '@/stores/rehber-store'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  children?: { to: string; label: string; end?: boolean }[]
}

export const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Modüller',
    items: [
      { to: '/panel', label: 'Genel Bakış', icon: LayoutDashboardIcon, end: true },
      {
        to: '/panel/risk',
        label: 'Risk Değerlendirme',
        icon: ShieldAlertIcon,
        children: [
          { to: '/panel/risk', label: 'Değerlendirmeler', end: true },
          { to: '/panel/aksiyonlar', label: 'Aksiyonlar' },
        ],
      },
      { to: '/panel/olaylar', label: 'Olay Bildirimleri', icon: SirenIcon },
      { to: '/panel/denetimler', label: 'Denetimler', icon: ClipboardCheckIcon },
    ],
  },
  {
    label: 'Eğitim & Belgeler',
    items: [
      {
        to: '/panel/egitimler',
        label: 'Eğitimler',
        icon: GraduationCapIcon,
        children: [
          { to: '/panel/egitimler', label: 'Katalog', end: true },
          { to: '/panel/egitim-atamalari', label: 'Atamalar' },
        ],
      },
      {
        to: '/panel/sertifikalar',
        label: 'Sertifikalar',
        icon: AwardIcon,
        children: [
          { to: '/panel/sertifikalar', label: 'Belgeler', end: true },
          { to: '/panel/sertifika-tasarimlari', label: 'Tasarımlar' },
          { to: '/panel/sertifika-onay', label: 'Onay bekleyen' },
        ],
      },
    ],
  },
  {
    label: 'Organizasyon',
    items: [
      { to: '/panel/firmalar', label: 'Firmalar', icon: Building2Icon },
      { to: '/panel/isg-katip', label: 'İSG-KATİP', icon: ShieldCheckIcon },
      {
        to: '/panel/personeller',
        label: 'Personeller',
        icon: UsersIcon,
        children: [
          { to: '/panel/personeller', label: 'Liste', end: true },
          { to: '/panel/personeller/toplu', label: 'Toplu Oluşturma' },
        ],
      },
      { to: '/panel/ekip', label: 'Ekip', icon: UsersIcon },
    ],
  },
  {
    label: 'Destek',
    items: [
      {
        to: '/panel/rehber',
        label: 'Kullanım Merkezi',
        icon: BookOpenIcon,
        children: [
          { to: '/panel/rehber', label: 'Rehber', end: true },
          { to: '/panel/rehber/yonetim', label: 'İçerik Yönetimi' },
        ],
      },
    ],
  },
]

const allItems = navSections.flatMap((s) => s.items)

export const pageCrumbs = (pathname: string): string[] => {
  if (pathname === '/panel/rehber/yonetim') return ['Kullanım Merkezi', 'İçerik Yönetimi']
  const rehberEslesme = pathname.match(/^\/panel\/rehber\/([^/]+)(?:\/([^/]+))?$/)
  if (rehberEslesme) {
    const m = modulGetir(rehberEslesme[1])
    if (!m) return ['Kullanım Merkezi']
    if (!rehberEslesme[2]) return ['Kullanım Merkezi', m.ad]
    const r = rehberGetir(m.id, rehberEslesme[2], useRehberStore.getState())
    return ['Kullanım Merkezi', m.ad, r?.baslik ?? 'Rehber']
  }
  if (pathname === '/panel/olaylar/yeni') return ['Olay Bildirimleri', 'Yeni Olay']
  if (pathname === '/panel/risk/yeni') return ['Risk Değerlendirme', 'Yeni Değerlendirme']
  if (/^\/panel\/risk\/[^/]+$/.test(pathname)) return ['Risk Değerlendirme', 'Değerlendirme Detayı']
  if (pathname === '/panel/egitimler/yeni') return ['Eğitimler', 'Yeni Eğitim']
  if (pathname === '/panel/egitim-atamalari/yeni') return ['Eğitim Atamaları', 'Toplu Atama']
  if (pathname.endsWith('/duzenle') && pathname.startsWith('/panel/egitimler/'))
    return ['Eğitimler', 'Eğitim Düzenleme']
  if (pathname.startsWith('/panel/egitimler/')) return ['Eğitimler', 'Eğitim Oynatıcı']
  if (pathname === '/panel/personeller/toplu') return ['Personeller', 'Toplu Oluşturma']
  if (pathname.startsWith('/panel/personeller/')) return ['Personeller', 'Personel Detayı']
  if (pathname.startsWith('/panel/firmalar/')) return ['Firmalar', 'Firma Detayı']
  if (pathname.startsWith('/panel/ekip/')) return ['Ekip', 'Personel Detayı']
  for (const item of allItems) {
    const child = item.children?.find((c) =>
      c.end ? pathname === c.to : pathname.startsWith(c.to),
    )
    if (child) {
      // Ana sayfa değilse ve çocuk ebeveynle aynı rotadaysa tek kırıntı yeter
      return child.to === item.to ? [item.label] : [item.label, child.label]
    }
    if (item.end ? pathname === item.to : pathname.startsWith(item.to)) return [item.label]
  }
  if (pathname.startsWith('/panel/ayarlar')) {
    const sub: Record<string, string> = {
      genel: 'Genel Ayarlar',
      kurum: 'Kurum Bilgileri',
      kullanicilar: 'Kullanıcı Yönetimi',
      izinler: 'Erişim İzinleri',
      ekip: 'Ekip ve Personel',
      bildirim: 'Bildirim Ayarları',
      guvenlik: 'Güvenlik ve Oturumlar',
      belgeler: 'Belge ve PDF Ayarları',
      tanimlar: 'Tanımlar ve Kataloglar',
      'is-akisi': 'İş Akışı ve Otomasyon',
      entegrasyonlar: 'Entegrasyonlar',
      veri: 'Veri ve Dışa Aktarım',
      gecmis: 'İşlem Geçmişi',
    }
    const seg = pathname.split('/')[3]
    return sub[seg] ? ['Ayarlar', sub[seg]] : ['Ayarlar']
  }
  if (pathname === '/panel/profil') return ['Profil']
  return []
}
