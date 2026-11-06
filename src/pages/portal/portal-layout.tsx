import { useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import {
  AlertTriangleIcon,
  AwardIcon,
  BookOpenIcon,
  CalendarClockIcon,
  GraduationCapIcon,
  HomeIcon,
  UserIcon,
} from 'lucide-react'
import { PortalTopbar, type PortalBildirim } from '@/components/portal-topbar'
import { cn } from '@/lib/utils'
import { gunFarki } from '@/lib/date'
import { useOsgb } from '@/lib/osgb'
import { TODAY } from '@/data/dashboard'
import { ilerlemedenKisi } from '@/data/personeller'
import { useAuthStore } from '@/stores/auth-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'

const menu = [
  { to: '/portal', label: 'Ana Sayfa', ikon: HomeIcon, end: true },
  { to: '/portal/egitimler', label: 'Eğitimlerim', ikon: GraduationCapIcon },
  { to: '/portal/sertifikalar', label: 'Sertifikalarım', ikon: AwardIcon },
  { to: '/portal/profil', label: 'Profilim', ikon: UserIcon },
  { to: '/portal/rehber', label: 'Kullanım Merkezi', ikon: BookOpenIcon },
]

function PortalNav({ onNavigate }: { onNavigate?: () => void }) {
  const osgb = useOsgb()
  const ad = osgb.kisaAd || osgb.unvan
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
          {ad.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Eğitim Portalı</p>
          <p className="truncate text-[11px] text-muted-foreground">{ad}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {menu.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive ? 'bg-amber-500/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
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

/** Çalışan portalı — yönetim modülleri bu alanda yok; erişim RequireAuth'ta tip='portal' ile sınırlı */
export default function PortalLayout() {
  const { pathname } = useLocation()
  const pid = useAuthStore((s) => s.user?.personelId ?? '')
  const atamalar = usePersonelStore((s) => s.atamalar)
  const ilerlemeler = useEgitimlerStore((s) => s.ilerlemeler)
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const sertifikalar = useSertifikaStore((s) => s.sertifikalar)

  const aktif =
    menu.find((m) => (m.end ? pathname === m.to : pathname.startsWith(m.to)))?.label ?? 'Portal'

  const bildirimler = useMemo<PortalBildirim[]>(() => {
    const egitimAd = (id: string) => egitimler.find((e) => e.id === id)?.baslik ?? 'Eğitim'
    const benim = atamalar
      .filter((a) => a.durum !== 'İptal' && a.personelIds.includes(pid))
      .map((a) => ({
        a,
        kd: ilerlemedenKisi(
          ilerlemeler.find((i) => i.hesapId === pid && i.atamaId === a.id)?.durum,
          a.sonTarih,
        ),
      }))
    const geciken = benim.filter((x) => x.kd === 'Gecikti')
    const yaklasan = benim.filter(
      (x) => x.kd !== 'Gecikti' && x.kd !== 'Tamamlandı' && x.kd !== 'Başarısız' &&
        gunFarki(TODAY, x.a.sonTarih) >= 0 && gunFarki(TODAY, x.a.sonTarih) <= 7,
    )
    return [
      ...geciken.map(({ a }) => ({
        ikon: AlertTriangleIcon,
        ton: 'red' as const,
        baslik: 'Eğitim son tarihi geçti',
        detay: `${egitimAd(a.egitimId)} · son ${a.sonTarih}`,
        to: '/portal/egitimler',
      })),
      ...yaklasan.map(({ a }) => ({
        ikon: CalendarClockIcon,
        ton: 'amber' as const,
        baslik: `Son tarihe ${gunFarki(TODAY, a.sonTarih)} gün`,
        detay: `${egitimAd(a.egitimId)} · ${a.sonTarih}`,
        to: '/portal/egitimler',
      })),
      ...sertifikalar
        .filter((s) => s.personelId === pid && s.durum === 'Aktif')
        .slice(0, 3)
        .map((s) => ({
          ikon: AwardIcon,
          ton: 'emerald' as const,
          baslik: 'Sertifikanız hazır',
          detay: s.sertifikaNo,
          to: '/portal/sertifikalar',
        })),
    ]
  }, [atamalar, ilerlemeler, egitimler, sertifikalar, pid])

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card/40 lg:flex">
        <PortalNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar
          kok="Eğitim Portalı"
          aktif={aktif}
          kullaniciTo="/portal/profil"
          bildirimler={bildirimler}
        />
        <main className="min-w-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav
        items={menu
          .slice(0, 4)
          .map(({ to, label, ikon, end }) => ({ to, label, icon: ikon, end }))}
        menuSections={[{
          label: 'Eğitim portalı',
          items: menu.map(({ to, label, ikon, end }) => ({ to, label, icon: ikon, end })),
        }]}
      />
    </div>
  )
}
