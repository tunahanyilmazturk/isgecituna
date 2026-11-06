import { useState } from 'react'
import { useNavigate } from 'react-router'
import { KeyRoundIcon, LogOutIcon, MailIcon, PhoneIcon, ShieldCheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { sifreHashle } from '@/lib/sifre'
import { formatUzun } from '@/lib/date'
import { useAuthStore } from '@/stores/auth-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useBen } from '@/pages/portal/portal-ortak'

const girdi = 'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

/** Katılımcının kişisel bilgileri, iletişim tercihi, KVKK onayı ve hesap güvenliği */
export default function PortalProfil() {
  const { user, p } = useBen()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const hesaplar = usePersonelStore((s) => s.hesaplar)
  const kvkkTeyitler = usePersonelStore((s) => s.kvkkTeyitler)
  const hesapGuncelle = usePersonelStore((s) => s.hesapGuncelle)
  const personelGuncelle = usePersonelStore((s) => s.personelGuncelle)
  const epostaAlinmi = usePersonelStore((s) => s.epostaAlinmi)

  const hesap = hesaplar.find((h) => h.personelId === p?.id && h.durum !== 'Pasif')
  const teyit = kvkkTeyitler.find((t) => t.hesapId === hesap?.id)
  const firma = firmalar.find((f) => f.id === p?.firmaId)

  const [sifreForm, setSifreForm] = useState(false)
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')
  const [iletisimForm, setIletisimForm] = useState(false)
  const [eposta, setEposta] = useState('')
  const [telefon, setTelefon] = useState('')

  const iletisimAc = () => {
    setEposta(p?.eposta ?? '')
    setTelefon(p?.telefon ?? '')
    setIletisimForm(true)
  }

  const iletisimKaydet = () => {
    if (!p) return
    const yeniEposta = eposta.trim()
    const yeniTelefon = telefon.trim()
    if (yeniEposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(yeniEposta)) return toast.error('Geçerli bir e-posta adresi girin')
    if (yeniEposta && epostaAlinmi(yeniEposta, p.id)) return toast.error('Bu e-posta başka bir kayıtta kullanılıyor')
    if (yeniTelefon && yeniTelefon.replace(/\D/g, '').length < 10) return toast.error('Telefon numarası en az 10 haneli olmalı')
    personelGuncelle(p.id, { eposta: yeniEposta, telefon: yeniTelefon })
    toast.success('İletişim bilgileriniz güncellendi')
    setIletisimForm(false)
  }

  const sifreKaydet = async () => {
    if (s1.length < 6) return toast.error('Şifre en az 6 karakter olmalı')
    if (s1 !== s2) return toast.error('Şifreler eşleşmiyor')
    if (hesap) {
      hesapGuncelle(hesap.id, { sifreHash: await sifreHashle(s1), sifreDegisimTarihi: new Date().toISOString(), sifreDegisimZorunlu: false })
      toast.success('Şifreniz güncellendi')
    }
    setSifreForm(false)
    setS1('')
    setS2('')
  }

  const satir = (l: string, v: string) => (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{l}</span>
      <span className="text-right text-sm font-medium">{v || '—'}</span>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Profilim</h1>
      <p className="mt-1 text-sm text-muted-foreground">Kişisel bilgileriniz, iletişim tercihleriniz ve hesap güvenliğiniz</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-semibold text-white">
                {user?.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{user?.name}</p>
                <p className="truncate text-sm text-muted-foreground">{p?.gorev || '—'}</p>
                <p className="truncate text-xs text-muted-foreground">{firma?.unvan ?? 'Firma bilgisi yok'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheckIcon className="size-4 text-emerald-500" /> Gizlilik ve onay
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {teyit
                ? `KVKK aydınlatma metnini ${formatUzun(teyit.teyitZamani)} tarihinde onayladınız.`
                : 'KVKK aydınlatma metni onayınız henüz kaydedilmedi.'}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Kişisel verileriniz yalnızca eğitim, sertifika ve İSG yükümlülükleri için kullanılır.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <KeyRoundIcon className="size-4" /> Şifre
              </p>
              {!sifreForm && (
                <Button size="sm" variant="outline" onClick={() => setSifreForm(true)}>
                  Şifre değiştir
                </Button>
              )}
            </div>
            {sifreForm ? (
              <div className="mt-3 space-y-2">
                <input type="password" value={s1} onChange={(e) => setS1(e.target.value)} placeholder="Yeni şifre" className={girdi} />
                <input type="password" value={s2} onChange={(e) => setS2(e.target.value)} placeholder="Yeni şifre (tekrar)" className={girdi} />
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={sifreKaydet}>
                    Kaydet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSifreForm(false)}>
                    Vazgeç
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">En az 6 karakterli, size özel bir şifre kullanın.</p>
            )}
          </section>

          <Button variant="outline" className="w-full" onClick={() => { logout(); navigate('/giris') }}>
            <LogOutIcon /> Oturumu kapat
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-3.5">
              <h2 className="text-sm font-semibold">Çalışma bilgileri</h2>
            </div>
            {satir('Firma', firma?.unvan ?? '')}
            {satir('Departman', p?.departman ?? '')}
            {satir('Görev', p?.gorev ?? '')}
            {satir('Sicil no', p?.sicilNo ?? '')}
            {satir('Kullanıcı adı', user?.username ?? '')}
            <p className="border-t px-5 py-3 text-xs text-muted-foreground">
              Firma, görev ve sicil bilgileri işvereniniz tarafından yönetilir; değişiklik için İSG ekibinize başvurun.
            </p>
          </section>

          <section className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <h2 className="text-sm font-semibold">İletişim</h2>
              {!iletisimForm && (
                <Button size="sm" variant="outline" onClick={iletisimAc}>
                  Düzenle
                </Button>
              )}
            </div>
            {iletisimForm ? (
              <div className="space-y-2 p-5">
                <label className="block text-xs text-muted-foreground" htmlFor="profil-eposta">E-posta</label>
                <input id="profil-eposta" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} placeholder="ornek@firma.com" className={girdi} />
                <label className="block text-xs text-muted-foreground" htmlFor="profil-telefon">Telefon</label>
                <input id="profil-telefon" type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="05xx xxx xx xx" className={girdi} />
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={iletisimKaydet}>
                    Kaydet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIletisimForm(false)}>
                    Vazgeç
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="divide-y">
                <li className="flex items-center gap-3 px-5 py-3.5">
                  <MailIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p?.eposta || 'E-posta eklenmedi'}</span>
                </li>
                <li className="flex items-center gap-3 px-5 py-3.5">
                  <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p?.telefon || 'Telefon eklenmedi'}</span>
                </li>
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
