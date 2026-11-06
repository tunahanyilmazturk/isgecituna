import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CheckCircle2Icon, ShieldCheckIcon, XCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alan } from '@/components/form-bits'
import { BUGUN, hesapGorunenAd, sifreHashle } from '@/data/ekip'
import { useEkipStore } from '@/stores/ekip-store'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useFirmaPortalStore } from '@/stores/firma-portal-store'

const simdi = () => new Date().toISOString()

/** Davet / şifre sıfırlama kabul sayfası — auth dışı public route, tek kullanımlık + süreli token */
export default function DavetPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { hesaplar, uyeler, davetKabulEt } = useEkipStore()
  const { yetkililer, davetKabul: fyDavetKabul } = useFirmaPortalStore()
  const { logEkle } = useAyarlarStore()
  const [sifre, setSifre] = useState('')
  const [sifre2, setSifre2] = useState('')
  const [hata, setHata] = useState('')
  const [tamam, setTamam] = useState(false)

  const hesap = hesaplar.find((h) => h.davetToken === token)
  const fyHesap = yetkililer.find((y) => y.davetToken === token)
  const gecersiz = !hesap && !fyHesap
  const suresiDolmus =
    (!!hesap && !!hesap.davetBitis && hesap.davetBitis < BUGUN) ||
    (!!fyHesap && !!fyHesap.davetBitis && fyHesap.davetBitis.slice(0, 10) < BUGUN)

  const kabul = () => {
    if (sifre.length < 6) return setHata('Şifre en az 6 karakter olmalı.')
    if (sifre !== sifre2) return setHata('Şifreler eşleşmiyor.')
    // Firma yetkilisi daveti — kendi store'unda tek kullanımlık kabul
    if (!hesap && fyHesap) {
      if (!token || !fyDavetKabul(token, sifre)) return setHata('Bağlantı geçersiz veya süresi dolmuş.')
      setTamam(true)
      toast.success('Hesabınız aktifleştirildi')
      return
    }
    if (!token || !davetKabulEt(token, sifreHashle(sifre))) return setHata('Bağlantı geçersiz veya süresi dolmuş.')
    logEkle({
      tarih: simdi(),
      kullanici: hesap?.kullaniciAdi ?? 'davet',
      islem: 'Kullanıcı daveti kabul edildi',
      kayit: hesap ? `${hesap.kullaniciAdi} · ${hesap.eposta}` : token,
    })
    setTamam(true)
    toast.success('Hesabınız aktifleştirildi')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-[13px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            iH
          </span>
          <div>
            <div className="text-[14px] font-semibold tracking-tight">isghub</div>
            <div className="text-[11px] text-muted-foreground">Hesap Aktivasyonu</div>
          </div>
        </div>

        {tamam ? (
          <div className="space-y-4 text-center">
            <CheckCircle2Icon className="mx-auto size-10 text-emerald-500" />
            <div>
              <div className="text-[14px] font-semibold">Hesabınız hazır</div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Şifreniz belirlendi ve hesabınız aktifleştirildi. Giriş ekranından devam edebilirsiniz.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate('/giris')}>Giriş ekranına git</Button>
          </div>
        ) : gecersiz || suresiDolmus ? (
          <div className="space-y-4 text-center">
            <XCircleIcon className="mx-auto size-10 text-destructive" />
            <div>
              <div className="text-[14px] font-semibold">Bağlantı geçersiz</div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {suresiDolmus
                  ? 'Bu davet bağlantısının süresi dolmuş. Yöneticinizden yeni bir bağlantı isteyin.'
                  : 'Bu bağlantı bulunamadı veya daha önce kullanılmış.'}
              </p>
            </div>
            <Button variant="outline" className="w-full" render={<Link to="/giris" />}>
              Giriş ekranına dön
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p className="text-[12px] text-muted-foreground">
                <b className="text-foreground">
                  {hesap ? hesapGorunenAd(hesap, uyeler) : fyHesap ? `${fyHesap.ad} ${fyHesap.soyad}` : ''}
                </b>{' '}
                için hesap oluşturuluyor. Kullanıcı adınız:{' '}
                <b className="text-foreground">@{(hesap ?? fyHesap)?.kullaniciAdi}</b>
              </p>
            </div>
            <Alan label="Yeni şifre">
              <Input type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder="En az 6 karakter" />
            </Alan>
            <Alan label="Şifre tekrar">
              <Input type="password" value={sifre2} onChange={(e) => setSifre2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && kabul()} />
            </Alan>
            {hata && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{hata}</div>}
            <Button className="w-full" onClick={kabul}>Şifremi Belirle ve Hesabı Aktifleştir</Button>
            <p className="text-center text-[10.5px] text-muted-foreground">
              Bu bağlantı {(hesap ?? fyHesap)?.davetBitis} tarihine kadar tek kullanımlıktır.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
