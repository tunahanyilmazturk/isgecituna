import { useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import {
  AlertTriangleIcon,
  AwardIcon,
  BookOpenIcon,
  Building2Icon,
  CalendarClockIcon,
  FileTextIcon,
  FileWarningIcon,
  GraduationCapIcon,
  HomeIcon,
  MailWarningIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react'
import { PortalTopbar, type PortalBildirim } from '@/components/portal-topbar'
import { cn } from '@/lib/utils'
import { gunFarki } from '@/lib/date'
import { useOsgb } from '@/lib/osgb'
import { TODAY } from '@/data/dashboard'
import { useFirmaKapsam, useFIzin, takipSatirlari } from './bits'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { FirmaAvatar } from '@/components/firmalar/firma-avatar'

const menu = [
  { to: '/firma', label: 'Dashboard', ikon: HomeIcon, end: true },
  { to: '/firma/calisanlar', label: 'Çalışanlarım', ikon: UsersIcon },
  { to: '/firma/egitimler', label: 'Eğitimlerimiz', ikon: GraduationCapIcon },
  { to: '/firma/takip', label: 'Eğitim Takibi', ikon: TrendingUpIcon },
  { to: '/firma/sertifikalar', label: 'Sertifikalar', ikon: AwardIcon },
  { to: '/firma/evraklar', label: 'Evraklar', ikon: FileTextIcon },
  { to: '/firma/profil', label: 'Firma Profilim', ikon: Building2Icon },
  { to: '/firma/hesap', label: 'Hesap Ayarları', ikon: SettingsIcon },
  { to: '/firma/rehber', label: 'Kullanım Merkezi', ikon: BookOpenIcon },
]

function FirmaNav({ onNavigate }: { onNavigate?: () => void }) {
  const { firma } = useFirmaKapsam()
  const goruntule = useFIzin('calisan.goruntule')
  const osgb = useOsgb()
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <FirmaAvatar ad={firma?.kisaAd || firma?.unvan || 'Firma'} logo={firma?.logo} className="size-9 rounded-xl text-xs" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{firma?.kisaAd ?? 'Firma Portalı'}</p>
          <p className="truncate text-[11px] text-muted-foreground">{osgb.kisaAd || osgb.unvan}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {menu
          .filter((m) => m.to !== '/firma/calisanlar' || goruntule)
          .map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-amber-500/10 font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )
              }
            >
              <m.ikon className="size-4" /> {m.label}
            </NavLink>
          ))}
      </nav>
    </div>
  )
}

/** Firma yetkilisi portalı — yönetim modülleri ve çalışan portalı bu alanda yok */
export default function FirmaLayout() {
  const { pathname } = useLocation()
  const kapsam = useFirmaKapsam()
  const calisanGoruntule = useFIzin('calisan.goruntule')
  const { firma, hesaplar, pidSet, basvurularim } = kapsam

  const aktif =
    menu.find((m) => (m.end ? pathname === m.to : pathname.startsWith(m.to)))?.label ?? 'Portal'

  const bildirimler = useMemo<PortalBildirim[]>(() => {
    const satirlar = takipSatirlari(kapsam)
    const acik = satirlar.filter((s) => s.durum !== 'Tamamlandı')
    const geciken = acik.filter((s) => s.sonTarih < TODAY)
    const yaklasan = acik.filter((s) => {
      const g = gunFarki(TODAY, s.sonTarih)
      return g >= 0 && g <= 7
    })
    const inceleme = basvurularim.filter(
      (b) => b.durum === 'İnceleme Bekliyor' || b.durum === 'İnceleniyor',
    )
    const davet = hesaplar.filter((h) => h.durum === 'Davet Bekliyor' && pidSet.has(h.personelId))
    return [
      ...(geciken.length > 0
        ? [
            {
              ikon: AlertTriangleIcon,
              ton: 'red' as const,
              baslik: `${geciken.length} eğitim kaydı gecikti`,
              detay: 'Son tarihi geçen tamamlanmamış atamalar var',
              to: '/firma/takip',
            },
          ]
        : []),
      ...(yaklasan.length > 0
        ? [
            {
              ikon: CalendarClockIcon,
              ton: 'amber' as const,
              baslik: `${yaklasan.length} eğitim için son tarih yaklaşıyor`,
              detay: 'Önümüzdeki 7 gün içinde tamamlanması gerekenler',
              to: '/firma/takip',
            },
          ]
        : []),
      ...inceleme.map((b) => ({
        ikon: FileWarningIcon,
        ton: 'amber' as const,
        baslik: 'Sertifika başvurusu inceleniyor',
        detay: `${b.id} · ${b.durum}`,
        to: '/firma/sertifikalar',
      })),
      ...(davet.length > 0
        ? [
            {
              ikon: MailWarningIcon,
              ton: 'amber' as const,
              baslik: `${davet.length} çalışan davetine yanıt bekleniyor`,
              detay: 'Hesabını henüz etkinleştirmeyen çalışanlar',
              to: '/firma/calisanlar',
            },
          ]
        : []),
    ]
  }, [kapsam, basvurularim, hesaplar, pidSet])

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card/40 lg:flex">
        <FirmaNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar
          kok={firma?.kisaAd ?? 'Firma Portalı'}
          aktif={aktif}
          kullaniciTo="/firma/hesap"
          bildirimler={bildirimler}
        />
        <main className="min-w-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav
        items={menu
          .filter((m) => m.to !== '/firma/calisanlar' || calisanGoruntule)
          .slice(0, 4)
          .map(({ to, label, ikon, end }) => ({ to, label, icon: ikon, end }))}
        menuSections={[{
          label: 'Firma alanı',
          items: menu
            .filter((m) => m.to !== '/firma/calisanlar' || calisanGoruntule)
            .map(({ to, label, ikon, end }) => ({ to, label, icon: ikon, end })),
        }]}
      />
    </div>
  )
}
