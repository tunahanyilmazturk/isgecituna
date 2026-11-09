import { useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ChevronDownIcon, ShieldCheckIcon } from 'lucide-react'
import { navSections } from '@saglik/components/nav-items'
import { BUGUN, gunEkle } from '@saglik/data/saglik'
import { useOsgb } from '@saglik/lib/osgb'
import { cn } from '@saglik/lib/utils'
import { useTaramaStore, useTeklifStore } from '@saglik/stores/saglik-stores'

/** Menü rozetleri: bugün-yarın planlı taramalar ve cevap bekleyen (gönderilmiş) teklifler */
function useRozetler(): Record<string, number> {
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  return useMemo(() => {
    const yarin = gunEkle(1)
    return {
      '/panel/taramalar': taramalar.filter((t) => t.durum === 'Planlandı' && t.tarih >= BUGUN && t.tarih <= yarin).length,
      '/panel/teklifler': teklifler.filter((t) => t.durum === 'Gönderildi').length,
    }
  }, [taramalar, teklifler])
}

const navClass = (isActive: boolean, collapsed?: boolean) =>
  cn(
    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100',
    isActive &&
      'bg-white/10 font-medium text-white shadow-[inset_2px_0_0_0_#fbbf24]',
    collapsed && 'justify-center px-0',
  )

const popRow = (isActive: boolean) =>
  cn(
    'flex items-center gap-2 rounded-md px-2 py-1 text-xs text-popover-foreground transition-colors hover:bg-accent',
    isActive && 'bg-accent font-medium',
  )

function Badge({ n }: { n: number }) {
  return n > 0 ? (
    <span className="ml-auto rounded-md bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold text-zinc-950 tabular-nums">
      {n}
    </span>
  ) : null
}

/** Daraltılmış rayda ikonun sağında açılan flyout panel */
function RailFlyout({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <div className="pointer-events-none invisible absolute top-1/2 left-full z-50 -translate-x-1 -translate-y-1/2 pl-2 opacity-0 transition-all duration-150 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:visible group-hover:translate-x-0 group-hover:opacity-100">
      <div className="w-max min-w-36 rounded-lg border bg-popover p-1 shadow-md">
        {title && (
          <p className="px-2 pt-0.5 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

export function AppSidebarContent({
  onNavigate,
  collapsed,
}: {
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const { pathname } = useLocation()
  const kurum = useOsgb()
  const badges = useRozetler()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navSections
        .flatMap((s) => s.items)
        .filter((i) =>
          i.children?.some((c) => (c.end ? pathname === c.to : pathname.startsWith(c.to))),
        )
        .map((i) => [i.to, true]),
    ),
  )

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className={cn('px-3 pt-3 pb-2', collapsed && 'px-2')}>
        <div
          className={cn(
            'flex items-center gap-2',
            collapsed && 'justify-center',
          )}
        >
          <Link
            to="/panel"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2.5 rounded-lg py-1 focus-visible:outline-none"
            aria-label="osgbhub genel bakış"
          >
            {collapsed ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-400">
                <ShieldCheckIcon className="size-4 text-zinc-950" strokeWidth={2.5} />
              </span>
            ) : (
              <span className="min-w-0">
                <img src="/brand/mobilhub-logo-koyu.svg" alt="mobilhub" className="h-7 w-auto" />
                <span className="block truncate text-[10px] font-medium text-zinc-500">
                  {kurum.kisaAd || kurum.unvan}
                </span>
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav
        className={cn(
          'flex-1 px-2 py-1',
          collapsed ? 'overflow-visible' : 'overflow-y-auto',
        )}
      >
        {navSections.map((section, si) => (
          <div
            key={section.label}
            className={cn(
              'pb-3',
              si > 0 && collapsed && 'mt-1 border-t border-zinc-800 pt-2',
            )}
          >
            {!collapsed && (
              <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-medium tracking-wide text-zinc-500 first:pt-0">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const badge = badges[item.to] ?? 0
                if (!item.children) {
                  return (
                    <div key={item.to} className="group relative">
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          navClass(isActive, collapsed)
                        }
                      >
                        <item.icon className="size-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            <Badge n={badge} />
                          </>
                        )}
                      </NavLink>
                      {collapsed && (
                        <RailFlyout>
                          <NavLink
                            to={item.to}
                            end={item.end}
                            onClick={onNavigate}
                            className={({ isActive }) => popRow(isActive)}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            <Badge n={badge} />
                          </NavLink>
                        </RailFlyout>
                      )}
                    </div>
                  )
                }

                const childActive = item.children.some((c) =>
                  c.end ? pathname === c.to : pathname.startsWith(c.to),
                )
                const isOpen = openGroups[item.to] ?? childActive
                return (
                  <div key={item.to} className="group relative">
                    <div
                      className={cn(
                        navClass(childActive, collapsed),
                        !collapsed && 'relative pr-8',
                      )}
                    >
                      <NavLink
                        to={item.to}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'flex min-w-0 flex-1 items-center gap-2.5',
                          collapsed && 'flex-none justify-center',
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
                        {!collapsed && (
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                        )}
                      </NavLink>
                      {!collapsed && (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenGroups((m) => ({
                              ...m,
                              [item.to]: !(m[item.to] ?? childActive),
                            }))
                          }
                          aria-label={`${item.label} alt menü`}
                          aria-expanded={isOpen}
                          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                        >
                          <ChevronDownIcon
                            className={cn(
                              'size-3.5 transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </button>
                      )}
                    </div>
                    {collapsed && (
                      <RailFlyout title={item.label}>
                        {item.children.map((c) => (
                          <NavLink
                            key={c.to}
                            to={c.to}
                            end={c.end}
                            onClick={onNavigate}
                            className={({ isActive }) => popRow(isActive)}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {c.label}
                            </span>
                            <Badge n={badges[c.to] ?? 0} />
                          </NavLink>
                        ))}
                      </RailFlyout>
                    )}
                    {!collapsed && isOpen && (
                      <div className="relative mt-0.5 ml-4.5 space-y-0.5 border-l border-zinc-700/60 pl-3">
                        {item.children.map((c) => {
                          const childBadge = badges[c.to] ?? 0
                          return (
                            <NavLink
                              key={c.to}
                              to={c.to}
                              end={c.end}
                              onClick={onNavigate}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100',
                                  isActive && 'font-medium text-zinc-100',
                                )
                              }
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {c.label}
                              </span>
                              <Badge n={childBadge} />
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

    </div>
  )
}
