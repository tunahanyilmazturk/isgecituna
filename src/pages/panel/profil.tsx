import { useState } from 'react'
import {
  AtSignIcon,
  BadgeCheckIcon,
  BriefcaseBusinessIcon,
  CheckIcon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  RotateCcwIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

type ProfilForm = {
  name: string
  username: string
  unvan: string
  eposta: string
  telefon: string
}

function profilFormu(user: ReturnType<typeof useAuthStore.getState>['user']): ProfilForm {
  return {
    name: user?.name ?? '',
    username: user?.username ?? '',
    unvan: user?.unvan ?? '',
    eposta: user?.eposta ?? '',
    telefon: user?.telefon ?? '',
  }
}

export default function ProfilPage() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState<ProfilForm>(() => profilFormu(user))
  const current = profilFormu(user)
  const dirty = Object.keys(form).some((key) => form[key as keyof ProfilForm] !== current[key as keyof ProfilForm])

  const alan = (
    key: keyof ProfilForm,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="space-y-2">
      <Label htmlFor={`profil-${key}`} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input
        id={`profil-${key}`}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="h-10 rounded-xl bg-background/70 px-3.5"
        {...props}
      />
    </div>
  )

  const kaydet = () => {
    updateUser(form)
    toast.success('Profil bilgileri güncellendi.')
  }

  const sifirla = () => setForm(current)
  const hesapTuru = 'Yönetim paneli'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">HESABIM</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Profil ve hesap bilgileri</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            İletişim ve profil bilgilerinizi tek yerden yönetin.
          </p>
        </div>
        {user?.demo && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <BadgeCheckIcon className="size-3.5" /> Demo hesabı
          </span>
        )}
      </header>

      <section className="relative isolate overflow-hidden rounded-2xl border bg-card p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,158,11,.13),transparent_58%)]" />
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <div className="relative flex size-[68px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-xl font-bold tracking-tight text-zinc-950 shadow-[0_8px_24px_-10px_rgba(245,158,11,.8)]">
            {user?.initials || 'IS'}
            <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-white">
              <CheckIcon className="size-3" strokeWidth={3} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="truncate text-lg font-semibold tracking-tight">{user?.name || 'Kullanıcı'}</h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                Aktif
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user?.unvan || 'Görev belirtilmemiş'}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><AtSignIcon className="size-3.5 text-amber-500" />{user?.username || '—'}</span>
              <span className="inline-flex min-w-0 items-center gap-1.5"><MailIcon className="size-3.5 shrink-0 text-amber-500" /><span className="truncate">{user?.eposta || 'E-posta eklenmemiş'}</span></span>
            </div>
          </div>
          <div className="hidden rounded-xl border bg-background/55 px-3.5 py-2.5 text-right sm:block">
            <p className="text-[10px] font-medium text-muted-foreground">HESAP TÜRÜ</p>
            <p className="mt-1 text-sm font-semibold">{hesapTuru}</p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,.8fr)]">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-base font-semibold">Kişisel bilgiler</h2>
              <p className="mt-1 text-xs text-muted-foreground">Profilinizde gösterilen bilgileri güncelleyin.</p>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UserRoundIcon className="size-4" />
            </span>
          </div>

          <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
            {alan('name', 'Ad soyad', { autoComplete: 'name' })}
            {alan('username', 'Kullanıcı adı', { autoComplete: 'username' })}
            {alan('unvan', 'Görev / unvan', { autoComplete: 'organization-title' })}
            {alan('telefon', 'Telefon', { type: 'tel', autoComplete: 'tel', placeholder: '+90 5xx xxx xx xx' })}
            <div className="sm:col-span-2">
              {alan('eposta', 'E-posta adresi', { type: 'email', autoComplete: 'email', placeholder: 'ad@kurum.com' })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              {dirty ? 'Kaydedilmemiş değişiklikleriniz var.' : 'Bilgileriniz güncel.'}
            </p>
            <div className="flex items-center gap-2">
              {dirty && (
                <Button type="button" variant="outline" onClick={sifirla}>
                  <RotateCcwIcon /> Geri al
                </Button>
              )}
              <Button
                type="button"
                onClick={kaydet}
                disabled={!dirty}
                className={cn(dirty && 'bg-amber-500 text-zinc-950 hover:bg-amber-400')}
              >
                <SaveIcon /> Kaydet
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-500/10 text-foreground">
                <ShieldCheckIcon className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Hesap özeti</h2>
                <p className="text-xs text-muted-foreground">Oturum bilgileriniz</p>
              </div>
            </div>
            <dl className="mt-4 divide-y">
              <div className="flex items-start gap-3 py-3">
                <BriefcaseBusinessIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <dt className="text-[11px] text-muted-foreground">Erişim alanı</dt>
                  <dd className="mt-0.5 text-sm font-medium">{hesapTuru}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 py-3">
                <AtSignIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <dt className="text-[11px] text-muted-foreground">Kullanıcı adı</dt>
                  <dd className="mt-0.5 break-all text-sm font-medium">@{user?.username || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 py-3">
                <PhoneIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <dt className="text-[11px] text-muted-foreground">Telefon</dt>
                  <dd className="mt-0.5 text-sm font-medium">{user?.telefon || 'Eklenmemiş'}</dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-amber-500/15 bg-amber-500/[.045] p-4">
            <div className="flex gap-2.5">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <h2 className="text-xs font-semibold">Bilgilerinizi güncel tutun</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Adınız, göreviniz ve iletişim bilgileriniz çalışma alanındaki profilinizde kullanılır.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
