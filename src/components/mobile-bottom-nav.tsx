import type { LucideIcon } from 'lucide-react'
import { ChevronRightIcon, MenuIcon } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export type MobileNavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export type MobileNavSection = {
  label: string
  items: MobileNavItem[]
}

export function MobileBottomNav({
  items,
  menuSections,
}: {
  items: MobileNavItem[]
  menuSections: MobileNavSection[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="Mobil gezinme"
        className="fixed inset-x-3 bottom-2 z-40 lg:hidden"
      >
        <div className="relative isolate overflow-hidden rounded-2xl bg-zinc-950 shadow-[0_12px_40px_-12px_rgba(0,0,0,.8)] ring-1 ring-white/10 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-zinc-950/10 via-zinc-950/15 to-zinc-950/35" />
          <div className="relative z-10 grid grid-cols-5 items-stretch px-1.5 pt-1.5 pb-[calc(.375rem+env(safe-area-inset-bottom))]">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium leading-none transition-colors',
                    isActive ? 'text-amber-300' : 'text-zinc-400 hover:text-zinc-100',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-xl transition-colors',
                        isActive && 'bg-amber-400/15 shadow-[inset_0_0_0_1px_rgba(251,191,36,.16)]',
                      )}
                    >
                      <item.icon className="size-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                    </span>
                    <span className="max-w-full truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Tüm menüyü aç"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium leading-none text-zinc-400 transition-colors hover:text-zinc-100"
            >
              <span className="flex size-8 items-center justify-center rounded-xl">
                <MenuIcon className="size-[18px]" strokeWidth={1.8} />
              </span>
              <span className="max-w-full truncate">Menü</span>
            </button>
          </div>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="bottom"
          showCloseButton
          className="max-h-[82dvh] gap-0 overflow-hidden rounded-t-3xl border-zinc-700 bg-zinc-950/95 p-0 text-zinc-100 backdrop-blur-2xl lg:hidden"
        >
          <SheetHeader className="shrink-0 border-b border-white/10 px-5 pt-5 pb-4 text-left">
            <SheetTitle className="text-base font-semibold text-zinc-100">Tüm menü</SheetTitle>
            <p className="text-xs text-zinc-400">Gitmek istediğiniz alanı seçin.</p>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {menuSections.map((section) => (
              <section key={section.label} className="py-3">
                <h2 className="mb-2 px-1 text-xs font-semibold text-zinc-400">{section.label}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map((item) => (
                    <NavLink
                      key={`${item.to}-${item.label}`}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-14 min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors',
                          isActive
                            ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                            : 'border-white/[0.07] bg-white/[0.035] text-zinc-300 hover:bg-white/[0.08]',
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0 text-amber-400" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{item.label}</span>
                      <ChevronRightIcon className="size-3.5 shrink-0 text-zinc-500" />
                    </NavLink>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
