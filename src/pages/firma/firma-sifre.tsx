import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { KeyRoundIcon, ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alan } from '@/components/form-bits'
import { useAuthStore } from '@/stores/auth-store'
import { useFirmaPortalStore } from '@/stores/firma-portal-store'
import { useYetkili } from './bits'

/** İlk giriş / sıfırlama sonrası zorunlu şifre belirleme — geçici şifre kalıcı parola değildir */
export default function FirmaSifrePage() {
  const yetkili = useYetkili()
  const { sifreDegistir } = useFirmaPortalStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')

  const kaydet = () => {
    if (!yetkili) return
    if (s1.length < 6) return toast.error('Şifre en az 6 karakter olmalı')
    if (s1 !== s2) return toast.error('Şifreler eşleşmiyor')
    sifreDegistir(yetkili.id, s1)
    toast.success('Şifreniz belirlendi — firma portalına yönlendiriliyorsunuz')
    navigate('/firma')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-[13px] font-bold text-zinc-950">
            {yetkili?.ad?.[0] ?? 'F'}
          </span>
          <div>
            <div className="text-[14px] font-semibold tracking-tight">Şifre Belirleme</div>
            <div className="text-[11px] text-muted-foreground">{yetkili?.ad} {yetkili?.soyad} · @{yetkili?.kullaniciAdi}</div>
          </div>
        </div>
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-[12px] text-muted-foreground">
            Güvenliğiniz için ilk girişte kendi şifrenizi belirlemeniz gerekir. Geçici şifreler kalıcı parola olarak kullanılmaz.
          </p>
        </div>
        <div className="space-y-3">
          <Alan label="Yeni şifre">
            <Input type="password" value={s1} onChange={(e) => setS1(e.target.value)} placeholder="En az 6 karakter" />
          </Alan>
          <Alan label="Yeni şifre (tekrar)">
            <Input type="password" value={s2} onChange={(e) => setS2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && kaydet()} />
          </Alan>
          <Button className="w-full" onClick={kaydet}>
            <KeyRoundIcon /> Şifremi belirle
          </Button>
          <button className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground" onClick={() => { logout(); navigate('/giris') }}>
            Çıkış yap ve giriş ekranına dön
          </button>
        </div>
      </div>
    </div>
  )
}
