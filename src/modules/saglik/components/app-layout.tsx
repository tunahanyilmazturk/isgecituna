import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { ChevronLeftIcon, ChevronRightIcon, HeartPulseIcon, LayoutDashboardIcon, LogOutIcon, ReceiptTextIcon, SettingsIcon, UserRoundIcon, UsersIcon } from 'lucide-react'
import { NotificationsMenu } from '@saglik/components/notifications-menu'
import { ThemeToggle } from '@saglik/components/theme-toggle'
import { TopbarSearch } from '@saglik/components/topbar-search'
import { AppSidebarContent } from '@saglik/components/app-sidebar'
import { navSections, pageCrumbs } from '@saglik/components/nav-items'
import { useAuthStore } from '@saglik/stores/auth-store'
import { cn } from '@saglik/lib/utils'
import { MobileBottomNav, type MobileNavItem, type MobileNavSection } from '@saglik/components/mobile-bottom-nav'

const mobileItems: MobileNavItem[] = [
  { to: '/panel', label: 'Ana Sayfa', icon: LayoutDashboardIcon, end: true },
  { to: '/panel/taramalar', label: 'Taramalar', icon: HeartPulseIcon },
  { to: '/panel/teklifler', label: 'Teklif', icon: ReceiptTextIcon },
  { to: '/panel/ekip', label: 'Ekip', icon: UsersIcon },
]

const mobileMenuSections: MobileNavSection[] = [
  ...navSections.map((section) => ({
    label: section.label,
    items: section.items.flatMap((item) =>
      item.children?.length
        ? item.children.map((child) => ({ ...child, icon: item.icon }))
        : [{ to: item.to, label: item.label, icon: item.icon, end: item.end }],
    ),
  })),
  {
    label: 'Hesap',
    items: [
      { to: '/panel/profil', label: 'Profil', icon: UserRoundIcon },
      { to: '/panel/ayarlar', label: 'Ayarlar', icon: SettingsIcon },
    ],
  },
]

function TopbarUser() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="ml-1 flex items-center gap-2 border-l pl-3">
      <Link
        to="/panel/profil"
        className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-muted"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-zinc-950">
          {user?.initials}
        </span>
        <span className="hidden max-w-36 truncate text-sm font-medium md:block">{user?.name}</span>
        {user?.demo && (
          <span className="hidden rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 md:block dark:text-amber-400">
            Demo
          </span>
        )}
      </Link>
      <button
        type="button"
        aria-label="Çıkış yap"
        title="Çıkış yap"
        onClick={() => {
          logout()
          navigate('/giris')
        }}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOutIcon className="size-4" />
      </button>
    </div>
  )
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('osgbhub-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const { pathname } = useLocation()
  const crumbs = pageCrumbs(pathname)

  // Toplu oluşturma sayfası geniş çalışma alanı ister — girince otomatik daralt,
  // çıkınca kullanıcının önceki tercihine dön
  const onceCollapsed = useRef<boolean | null>(null)
  useEffect(() => {
    if (pathname === '/panel/personeller/toplu') {
      setCollapsed((c) => {
        if (onceCollapsed.current === null) onceCollapsed.current = c
        return true
      })
    } else if (onceCollapsed.current !== null) {
      const prev = onceCollapsed.current
      onceCollapsed.current = null
      setCollapsed(prev)
    }
  }, [pathname])

  return (
    <div className="flex h-dvh bg-background">
      <aside
        className={cn(
          'relative hidden shrink-0 py-2 pl-2 transition-[width] duration-200 lg:block',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900">
          <AppSidebarContent collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => {
            const next = !c
            try { localStorage.setItem('osgbhub-sidebar-collapsed', String(next)) } catch { /* saklama kapalıysa yalnızca oturum boyunca uygula */ }
            return next
          })}
          aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          className="absolute top-1/2 -right-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
        >
          {collapsed ? (
            <ChevronRightIcon className="size-3.5" />
          ) : (
            <ChevronLeftIcon className="size-3.5" />
          )}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b px-3 lg:px-5">
          <nav aria-label="Konum" className="flex min-w-0 items-center gap-1.5 text-sm">
            <Link to="/panel" className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
              osgbhub
            </Link>
            {crumbs.map((c, i) => {
              const son = i === crumbs.length - 1
              const sinif = cn(
                'truncate rounded px-1 transition-colors',
                son ? 'font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
              return (
                <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 text-muted-foreground/60">/</span>
                  {c.to && !son ? (
                    <Link to={c.to} className={sinif}>
                      {c.label}
                    </Link>
                  ) : (
                    <span className={sinif} aria-current={son ? 'page' : undefined}>
                      {c.label}
                    </span>
                  )}
                </span>
              )
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <TopbarSearch />
            <NotificationsMenu />
            <ThemeToggle />
            <TopbarUser />
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full w-full flex-col p-4 pb-24 sm:p-5 sm:pb-24 lg:pb-5">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav items={mobileItems} menuSections={mobileMenuSections} />
    </div>
  )
}
