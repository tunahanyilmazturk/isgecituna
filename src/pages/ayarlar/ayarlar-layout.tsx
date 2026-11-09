import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  ArrowLeftIcon,
  BellIcon,
  BookOpenIcon,
  BuildingIcon,
  FileTextIcon,
  HistoryIcon,
  KeyRoundIcon,
  Link2Icon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UsersIcon,
  UsersRoundIcon,
  WorkflowIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MENU = [
  { to: '/panel/ayarlar/genel', label: 'Genel Ayarlar', icon: SettingsIcon },
  { to: '/panel/ayarlar/kurum', label: 'Kurum Bilgileri', icon: BuildingIcon },
  { to: '/panel/ayarlar/kullanicilar', label: 'Kullanıcı Yönetimi', icon: UsersIcon },
  { to: '/panel/ayarlar/izinler', label: 'Erişim İzinleri', icon: KeyRoundIcon },
  { to: '/panel/ayarlar/ekip', label: 'Ekip ve Personel', icon: UsersRoundIcon },
  { to: '/panel/ayarlar/bildirim', label: 'Bildirim Ayarları', icon: BellIcon },
  { to: '/panel/ayarlar/guvenlik', label: 'Güvenlik ve Oturumlar', icon: ShieldCheckIcon },
  { to: '/panel/ayarlar/belgeler', label: 'Belge ve PDF Ayarları', icon: FileTextIcon },
  { to: '/panel/ayarlar/tanimlar', label: 'Tanımlar ve Kataloglar', icon: BookOpenIcon },
  { to: '/panel/ayarlar/is-akisi', label: 'İş Akışı ve Otomasyon', icon: WorkflowIcon },
  { to: '/panel/ayarlar/entegrasyonlar', label: 'Entegrasyonlar', icon: Link2Icon },
  { to: '/panel/ayarlar/veri', label: 'Veri ve Dışa Aktarım', icon: SlidersHorizontalIcon },
  { to: '/panel/ayarlar/gecmis', label: 'İşlem Geçmişi', icon: HistoryIcon },
]

const GRUPLAR = [
  { baslik: 'Çalışma alanı', yollar: MENU.slice(0, 2).map((m) => m.to) },
  { baslik: 'Ekip ve erişim', yollar: MENU.slice(2, 7).map((m) => m.to) },
  { baslik: 'Uygulama ve veriler', yollar: MENU.slice(7).map((m) => m.to) },
]

export default function AyarlarLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const aktif = MENU.find((m) => pathname.startsWith(m.to))
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/panel')}
          className="flex h-9 shrink-0 items-center gap-2 rounded-xl border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Panele dön
        </button>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">YÖNETİM MERKEZİ</div>
          <div className="mt-0.5 truncate text-sm font-semibold tracking-tight">
            {aktif?.label ?? 'Ayarlar'}
            <span className="ml-2 font-normal text-muted-foreground">· Kurum ve uygulama tercihleri</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 md:flex-row md:gap-4">
        <nav aria-label="Ayarlar bölümleri" className="flex shrink-0 gap-1.5 overflow-x-auto pb-1 md:hidden">
          {MENU.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-current={pathname.startsWith(to) ? 'page' : undefined}
              className={({ isActive }) =>
                cn(
                  'flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-amber-500/30 bg-amber-500/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )
              }
            >
              <Icon className="size-3.5" />{label}
            </NavLink>
          ))}
        </nav>

        <nav aria-label="Ayarlar bölümleri" className="hidden max-h-[calc(100dvh-9rem)] w-56 shrink-0 self-start overflow-y-auto rounded-2xl border bg-card p-2 md:block">
          {GRUPLAR.map((grup) => (
            <div key={grup.baslik} className="mb-3 last:mb-0">
              <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-semibold text-muted-foreground">{grup.baslik}</p>
              <div className="space-y-0.5">
                {MENU.filter((m) => grup.yollar.includes(m.to)).map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    aria-current={pathname.startsWith(to) ? 'page' : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-amber-500/10 text-foreground shadow-[inset_2px_0_0_#f59e0b]'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-2xl border bg-card">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
