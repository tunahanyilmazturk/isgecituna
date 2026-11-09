import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Dialog } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import {
  ChevronRightIcon,
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

type DemoPortal = 'panel'

/* ------------------------------ Marka içeriği ------------------------------ */

/* ------------------------------- Demo giriş -------------------------------- */

const DEMO_BUTONLAR: {
  key: DemoPortal
  icon: typeof ShieldCheckIcon
  ad: string
  alt: string
  ton: string
}[] = [
  {
    key: 'panel',
    icon: ShieldCheckIcon,
    ad: 'OSGB Yönetim demosu',
    alt: 'Firmalar, ekip, personeller, taramalar ve testler',
    ton: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
]

/* --------------------------------- Yasal ----------------------------------- */

type YasalTur = 'gizlilik' | 'kvkk' | 'kosullar'

const YASAL: Record<YasalTur, { baslik: string; govde: string }> = {
  gizlilik: {
    baslik: 'Gizlilik Bildirimi',
    govde: `osgbhub olarak gizliliğinize önem veriyoruz. Bu platformda tutulan veriler, mobil sağlık taraması hizmetlerinin yürütülmesi amacıyla, hesabınızın bağlı olduğu kuruluşun talimatları doğrultusunda işlenir.

Giriş sayfasında tarayıcınızda yalnızca oturum ve görünüm tercihi gibi zorunlu teknik bilgiler saklanır; pazarlama veya üçüncü taraf izleme amaçlı çerez kullanılmaz.

Kişisel verilerin işlenmesine ilişkin ayrıntılı hukuki çerçeve için KVKK Aydınlatma Metni'ni inceleyebilirsiniz.`,
  },
  kvkk: {
    baslik: 'KVKK Aydınlatma Metni',
    govde: 'Ad, soyad, TC kimlik no, iletişim ve sağlık tarama sonuçları gibi kişisel veriler, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; işyeri hekimliği ve iş sağlığı hizmetlerinin yürütülmesi amacıyla işlenir. Erişimler yetki matrisine göre sınırlandırılır ve işlem geçmişine kaydedilir.',
  },
  kosullar: {
    baslik: 'Kullanım Koşulları',
    govde: `osgbhub, mobil sağlık taramalarının yönetimi için kuruluşlara sunulan bir yazılım hizmetidir.

Hesabınız, bağlı olduğunuz kuruluş tarafından oluşturulur ve yetkilendirilir. Platformu yalnızca size tanımlanan yetki kapsamında kullanabilirsiniz; hesap bilgilerinizi üçüncü kişilerle paylaşamazsınız.

Sistemdeki kayıtlar kuruluşunuzun yasal yükümlülükleri kapsamında tutulur ve denetlenebilir. Hizmetin kesintisizliği için makul özen gösterilir; planlı bakım çalışmaları önceden duyurulur.

Bu metin bilgilendirme amaçlıdır; bağlayıcı koşullar kuruluşunuzla imzalanan hizmet sözleşmesinde yer alır.`,
  },
}

/* --------------------------------- Sayfa ----------------------------------- */

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [hata, setHata] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [demoYuklenen, setDemoYuklenen] = useState<DemoPortal | null>(null)
  const [yasal, setYasal] = useState<YasalTur | null>(null)
  const [sifreAcik, setSifreAcik] = useState(false)
  const login = useAuthStore((s) => s.login)
  const demoLogin = useAuthStore((s) => s.demoLogin)
  const navigate = useNavigate()

  // Yalnız yönetim paneli var; tüm girişler panele yönlendirilir.
  const hedefRota = () => '/panel'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setHata(null)
    if (!username.trim()) {
      setHata('Kullanıcı adınızı girin.')
      return
    }
    if (!password) {
      setHata('Şifrenizi girin.')
      return
    }
    setLoading(true)
    // Kısa bekleme: yükleme durumunun algılanabilir olması için (prototip)
    await new Promise((r) => setTimeout(r, 450))
    const ok = await login(username.trim(), password)
    setLoading(false)
    if (!ok) {
      setHata('Kullanıcı adı veya şifre hatalı. Bilgilerinizi kontrol edip tekrar deneyin.')
      return
    }
    const u = useAuthStore.getState().user
    toast.success(`Hoş geldin, ${u?.name?.split(' ')[0] ?? ''}!`)
    navigate(hedefRota())
  }

  const demoAc = async (portal: DemoPortal) => {
    setDemoYuklenen(portal)
    await new Promise((r) => setTimeout(r, 500))
    const ok = demoLogin()
    setDemoYuklenen(null)
    if (!ok) {
      // Yarım kalmış yedek geri yüklendi ve sayfa yenileniyor
      return
    }
    toast.success(`Demo oturumu başladı — çıkışta veriler sıfırlanır.`)
    navigate(hedefRota())
  }

  return (
    <div className="dark relative min-h-svh overflow-hidden bg-[#11110f]">
      {/* Yedek zemin: görsel yoksa marka renkli gradyan görünür */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.25),transparent_60%),linear-gradient(160deg,#1c1a16,#0a0a0a)]" />
      <img
        src="/images/osgbhub-giris-gorsel.png"
        alt=""
        aria-hidden="true"
        onError={(e) => (e.currentTarget.style.display = 'none')}
        className="absolute inset-0 size-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50" />
      {/* ------------------------------- Sağ: giriş ------------------------------ */}
      <div className="relative z-10 flex min-h-svh flex-col px-6 sm:px-10">
        <div className="absolute top-6 left-6 flex items-center gap-3 text-white sm:top-8 sm:left-10">
          <img src="/images/osgbhub-logo.svg" alt="osgbhub" className="h-9 w-auto" />
        </div>

        <div className="flex flex-1 items-center justify-start pt-24 pb-8 sm:pt-28 lg:pt-20">
          <div className="dark w-full max-w-sm rounded-2xl border-0 bg-zinc-900/30 p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-7">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Tekrar hoş geldiniz</h1>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Hesabınıza giriş yapın — yönetim paneline yönlendirilirsiniz.
                girişten kendi portalına yönlendirilir.
              </p>
            </div>

            <form className="mt-5 space-y-3.5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="username">Kullanıcı adı</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="kullaniciadi"
                  autoComplete="username"
                  className="h-10.5 text-[15px]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifre</Label>
                  <button
                    type="button"
                    onClick={() => setSifreAcik(true)}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Şifremi unuttum
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-10.5 pr-11 text-[15px]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </div>
              </div>

              <div aria-live="polite">
                {hata && (
                  <p className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-[13px] text-red-600 dark:text-red-400">
                    <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                    {hata}
                  </p>
                )}
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] select-none">
                <Checkbox checked={remember} onCheckedChange={setRemember} />
                Beni hatırla
              </label>

              <Button type="submit" size="lg" className="h-10.5 w-full text-[15px]" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    Giriş yapılıyor…
                  </>
                ) : (
                  'Giriş yap'
                )}
              </Button>
            </form>

            <div className="mt-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">veya demo ile keşfedin</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-3.5 space-y-1.5">
              {DEMO_BUTONLAR.map((k) => {
                const yukleniyor = demoYuklenen === k.key
                return (
                  <button
                    key={k.key}
                    type="button"
                    disabled={demoYuklenen !== null}
                    onClick={() => demoAc(k.key)}
                    className="group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors hover:border-foreground/25 hover:bg-muted/40 disabled:opacity-60"
                  >
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', k.ton)}>
                      {yukleniyor ? (
                        <LoaderCircleIcon className="size-3.5 animate-spin" />
                      ) : (
                        <k.icon className="size-3.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium">{k.ad}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{k.alt}</span>
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground/80">
              Demo verileri gerçek kayıtlardan izole tutulur; oturum kapandığında sıfırlanır.
            </p>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
              Giriş yaparak{' '}
              <button type="button" onClick={() => setYasal('kosullar')} className="underline underline-offset-2 hover:text-foreground">
                kullanım koşullarını
              </button>{' '}
              ve{' '}
              <button type="button" onClick={() => setYasal('gizlilik')} className="underline underline-offset-2 hover:text-foreground">
                gizlilik bildirimini
              </button>{' '}
              kabul etmiş olursunuz.
            </p>
          </div>
        </div>

        <p className="pb-5 text-center text-[11px] text-white/70">
          © 2026 osgbhub
        </p>
      </div>

      {/* --------------------------- Şifremi unuttum ---------------------------- */}
      <Dialog.Root open={sifreAcik} onOpenChange={setSifreAcik}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-popover p-6 shadow-2xl transition duration-200 data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            <Dialog.Title className="text-base font-semibold tracking-tight">
              Şifre sıfırlama
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Şifrenizi sıfırlamak için kuruluşunuzdaki yöneticinize veya osgbhub destek
              ekibine başvurun. Size iletilen davet bağlantısıyla yeni şifrenizi
              belirleyebilirsiniz.
            </Dialog.Description>
            <div className="mt-4 flex justify-end">
              <Dialog.Close render={<Button variant="outline" size="sm" />}>Anladım</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ------------------------------ Yasal modal ----------------------------- */}
      <Dialog.Root open={yasal !== null} onOpenChange={(o) => !o && setYasal(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[80vh] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-popover shadow-2xl transition duration-200 data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <Dialog.Title className="text-base font-semibold tracking-tight">
                {yasal ? YASAL[yasal].baslik : ''}
              </Dialog.Title>
              <Dialog.Close
                render={
                  <button
                    type="button"
                    aria-label="Kapat"
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  />
                }
              >
                <XIcon className="size-4" />
              </Dialog.Close>
            </div>
            <div className="overflow-y-auto p-5">
              <Dialog.Description className="text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {yasal ? YASAL[yasal].govde : ''}
              </Dialog.Description>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
