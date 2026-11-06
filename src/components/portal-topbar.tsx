import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BellIcon, LogOutIcon, type LucideIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

export interface PortalBildirim {
  ikon: LucideIcon
  ton: 'red' | 'amber' | 'emerald'
  baslik: string
  detay: string
  to: string
}

const tonlar: Record<PortalBildirim['ton'], string> = {
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

function BildirimMenusu({ bildirimler }: { bildirimler: PortalBildirim[] }) {
  const [open, setOpen] = useState(false)
  const [okundu, setOkundu] = useState(false)
  const navigate = useNavigate()
  const okunmamis = okundu ? 0 : bildirimler.length

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Bildirimler${okunmamis > 0 ? ` (${okunmamis})` : ''}`}
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <BellIcon className="size-4" />
        {okunmamis > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-zinc-950 ring-2 ring-background tabular-nums">
            {okunmamis}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-popover shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <p className="text-sm font-medium">Bildirimler</p>
              {okunmamis > 0 && (
                <button
                  type="button"
                  onClick={() => setOkundu(true)}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Tümünü okundu say
                </button>
              )}
            </div>
            {bildirimler.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Yeni bildirim yok — her şey yolunda.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto p-1.5">
                {bildirimler.map((b, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        navigate(b.to)
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-lg',
                          tonlar[b.ton],
                        )}
                      >
                        <b.ikon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{b.baslik}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {b.detay}
                        </span>
                      </span>
                      {i < okunmamis && (
                        <span className="size-1.5 shrink-0 rounded-full bg-amber-400" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function PortalTopbar({
  kok,
  aktif,
  kullaniciTo,
  bildirimler,
}: {
  /** Breadcrumb kökü — firma kısa adı veya portal adı */
  kok: string
  /** Aktif sayfa etiketi */
  aktif: string
  /** Kullanıcı bloğunun gideceği sayfa */
  kullaniciTo: string
  bildirimler: PortalBildirim[]
}) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b px-3 lg:px-5">
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="shrink-0 text-muted-foreground">{kok}</span>
        <span className="shrink-0 text-muted-foreground/60">/</span>
        <span className="truncate font-medium">{aktif}</span>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <BildirimMenusu bildirimler={bildirimler} />
        <ThemeToggle />
        <div className="ml-1 flex items-center gap-2 border-l pl-3">
          <Link
            to={kullaniciTo}
            className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-muted"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-zinc-950">
              {user?.initials}
            </span>
            <span className="hidden max-w-36 truncate text-sm font-medium md:block">
              {user?.name}
            </span>
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
      </div>
    </div>
  )
}
