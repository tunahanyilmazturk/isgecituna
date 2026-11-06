import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CheckCircle2Icon, KeyRoundIcon, ScrollTextIcon, ShieldCheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { sifreHashle } from '@/lib/sifre'
import { usePersonelStore } from '@/stores/personeller-store'

const inp =
  'h-11 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

/** İlk-giriş akışlarının ortak kabuğu — panel/portal dışı, sade merkez kart */
function Kabuk({ children, adim }: { children: React.ReactNode; adim: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-sm font-bold text-zinc-950">
              iH
            </div>
            <div>
              <p className="text-sm font-semibold">isghub Eğitim Portalı</p>
              <p className="text-xs text-muted-foreground">{adim}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              useAuthStore.getState().logout()
            }}
          >
            Çıkış
          </Button>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-xl sm:p-8">{children}</div>
      </div>
    </div>
  )
}

/** Adım 1 — geçici şifrenin yenisiyle değiştirilmesi */
export function IlkSifrePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const hesap = usePersonelStore((s) =>
    s.hesaplar.find((h) => h.personelId === user?.personelId && h.durum !== 'Pasif'),
  )
  const sifreDegistir = usePersonelStore((s) => s.sifreDegistir)
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')

  const kaydet = async () => {
    if (s1.length < 6) return toast.error('Şifre en az 6 karakter olmalı')
    if (s1 !== s2) return toast.error('Şifreler eşleşmiyor')
    if (!hesap) return
    sifreDegistir(hesap.id, await sifreHashle(s1))
    toast.success('Şifreniz güncellendi')
    navigate('/portal', { replace: true })
  }

  return (
    <Kabuk adim="İlk Giriş — 1/3">
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-amber-500/10">
        <KeyRoundIcon className="size-6 text-amber-500" />
      </div>
      <h1 className="text-xl font-semibold">Yeni şifrenizi belirleyin</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Hesabınız size geçici bir şifreyle tanımlandı. Devam etmeden önce güvenli bir şifre belirlemeniz gerekiyor.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Yeni şifre</label>
          <input
            type="password"
            autoFocus
            value={s1}
            onChange={(e) => setS1(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && kaydet()}
            className={inp}
            placeholder="En az 6 karakter"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Yeni şifre (tekrar)</label>
          <input
            type="password"
            value={s2}
            onChange={(e) => setS2(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && kaydet()}
            className={inp}
          />
        </div>
        <Button className="h-11 w-full" disabled={s1.length < 6 || s1 !== s2} onClick={kaydet}>
          <ShieldCheckIcon /> Şifremi Belirle
        </Button>
      </div>
    </Kabuk>
  )
}

/** Adım 3 — iletişim telefonu: katılımcı kaydında opsiyonel, uygulamaya ilk girişte zorunlu */
export function TelefonPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const personel = usePersonelStore((s) => s.personeller.find((p) => p.id === user?.personelId))
  const personelGuncelle = usePersonelStore((s) => s.personelGuncelle)
  const [telefon, setTelefon] = useState('')
  const gecerli = telefon.replace(/\D/g, '').length >= 10

  const kaydet = () => {
    if (!personel || !gecerli) return
    personelGuncelle(personel.id, { telefon: telefon.trim() })
    toast.success('Telefon numaranız kaydedildi')
    navigate('/portal', { replace: true })
  }

  return (
    <Kabuk adim="İlk Giriş — 3/3">
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-amber-500/10">
        <ShieldCheckIcon className="size-6 text-amber-500" />
      </div>
      <h1 className="text-xl font-semibold">İletişim telefonunuzu kaydedin</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Eğitim ve sertifika bildirimleri için telefon numaranız gereklidir. Kaydetmeden portalı kullanamazsınız.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="ilk-telefon">Telefon</label>
          <input
            id="ilk-telefon"
            type="tel"
            autoFocus
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && kaydet()}
            className={inp}
            placeholder="05xx xxx xx xx"
          />
          {telefon && !gecerli && <p className="mt-1.5 text-xs text-red-500">Telefon numarası en az 10 haneli olmalı.</p>}
        </div>
        <Button className="h-11 w-full" disabled={!gecerli || !personel} onClick={kaydet}>
          <CheckCircle2Icon /> Kaydet ve devam et
        </Button>
      </div>
    </Kabuk>
  )
}

/** Adım 2 — KVKK aydınlatma metni teyidi (aydınlatma ≠ açık rıza) */
export function KvkkOnayPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const hesap = usePersonelStore((s) =>
    s.hesaplar.find((h) => h.personelId === user?.personelId && h.durum !== 'Pasif'),
  )
  const metin = usePersonelStore((s) => s.kvkkMetinler.find((m) => m.aktif))
  const kvkkTeyitEt = usePersonelStore((s) => s.kvkkTeyitEt)
  const [sonaGeldi, setSonaGeldi] = useState(false)
  const [okudum, setOkudum] = useState(false)

  if (!metin) {
    navigate('/portal', { replace: true })
    return null
  }

  const onayla = () => {
    if (!hesap || !okudum) return
    kvkkTeyitEt(hesap.id)
    toast.success('Bilgilendirme teyidi kaydedildi')
    navigate('/portal', { replace: true })
  }

  return (
    <Kabuk adim="İlk Giriş — 2/3">
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-amber-500/10">
        <ScrollTextIcon className="size-6 text-amber-500" />
      </div>
      <h1 className="text-xl font-semibold">Kişisel Verilerin Korunması</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Devam etmeden önce aşağıdaki aydınlatma metnini okumanız gerekiyor.
      </p>

      <div className="mt-5 rounded-xl border">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2.5 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{metin.baslik}</span>
          <span>Veri sorumlusu: {metin.veriSorumlusu}</span>
          <span>v{metin.surum} · {metin.yayinTarihi}</span>
        </div>
        <div
          onScroll={(e) => {
            const el = e.currentTarget
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setSonaGeldi(true)
          }}
          className="max-h-72 overflow-y-auto px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/90"
        >
          {metin.icerik}
        </div>
        {!sonaGeldi && (
          <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">
            Onay kutusunu etkinleştirmek için metni sonuna kadar kaydırın.
          </p>
        )}
      </div>

      <label
        className={cn(
          'mt-4 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
          sonaGeldi ? 'hover:border-amber-500/50' : 'opacity-50',
          okudum && 'border-amber-500/50 bg-amber-500/5',
        )}
      >
        <Checkbox
          checked={okudum}
          disabled={!sonaGeldi}
          onCheckedChange={(c) => setOkudum(c === true)}
          className="mt-0.5"
        />
        <span className="text-sm">
          Aydınlatma metnini <strong>okudum ve bilgilendirildim</strong>.
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Bu teyit aydınlatmanın tebliğ edildiğini belgelemektedir; açık rıza beyanı değildir.
          </span>
        </span>
      </label>

      <Button className="mt-5 h-11 w-full" disabled={!okudum} onClick={onayla}>
        <CheckCircle2Icon /> Devam Et
      </Button>
    </Kabuk>
  )
}
