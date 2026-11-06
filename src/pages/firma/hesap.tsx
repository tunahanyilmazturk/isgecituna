import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { KeyRoundIcon, LogOutIcon, MonitorIcon, ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alan } from '@/components/form-bits'
import { sifreHashle } from '@/data/ekip'
import { yetkiliDurumRenk } from '@/data/firma-portal'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useFirmaPortalStore } from '@/stores/firma-portal-store'
import { useYetkili, useFirmaKapsam, useFIzin } from './bits'

/** Hesap Ayarları — yetkili kendi bilgilerini görür, şifresini değiştirir, oturumlarını izler */
export default function FirmaHesapPage() {
  const yetkili = useYetkili()
  const k = useFirmaKapsam()
  const digerler = useFIzin('firma.yetkililer')
  const { sifreDegistir } = useFirmaPortalStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [s, setS] = useState({ eski: '', yeni: '', tekrar: '' })

  if (!yetkili) return null
  const mesaiArkadaslari = digerler
    ? useFirmaPortalStore.getState().yetkililer.filter((y) => y.firmaId === k.firmaId && y.id !== yetkili.id)
    : []

  const degistir = () => {
    if (sifreHashle(s.eski) !== yetkili.sifreHash) return toast.error('Mevcut şifre hatalı')
    if (s.yeni.length < 6) return toast.error('Yeni şifre en az 6 karakter olmalı')
    if (s.yeni !== s.tekrar) return toast.error('Yeni şifreler eşleşmiyor')
    sifreDegistir(yetkili.id, s.yeni)
    toast.success('Şifreniz güncellendi')
    setS({ eski: '', yeni: '', tekrar: '' })
  }

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Hesap Ayarları</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">{k.firma?.unvan}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheckIcon className="size-4 text-amber-500" /> Hesap bilgileri
          </h2>
          <div className="mt-4 space-y-3 text-[13px]">
            {[
              ['Ad Soyad', `${yetkili.ad} ${yetkili.soyad}`],
              ['Kullanıcı adı', `@${yetkili.kullaniciAdi}`],
              ['Görev / Ünvan', yetkili.gorev],
              ['E-posta', yetkili.eposta],
              ['Telefon', yetkili.telefon],
              ['Son giriş', yetkili.sonGiris?.slice(0, 16).replace('T', ' ') ?? '—'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Hesap durumu</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', yetkiliDurumRenk[yetkili.durum])}>
                {yetkili.durum}
              </span>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <MonitorIcon className="size-3.5" /> Aktif oturumlar ({yetkili.oturumlar.length})
            </p>
            {yetkili.oturumlar.length === 0 ? (
              <p className="text-xs text-muted-foreground">Kayıtlı oturum yok.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {yetkili.oturumlar.map((o) => (
                  <li key={o.id} className="flex justify-between gap-3 rounded-lg bg-muted/50 px-2.5 py-1.5">
                    <span>{o.cihaz}</span>
                    <span className="text-muted-foreground tabular-nums">{o.tarih.slice(0, 16).replace('T', ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <KeyRoundIcon className="size-4 text-amber-500" /> Şifre değiştir
            </h2>
            <div className="mt-4 space-y-3">
              <Alan label="Mevcut şifre">
                <input type="password" value={s.eski} onChange={(e) => setS({ ...s, eski: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <Alan label="Yeni şifre">
                <input type="password" value={s.yeni} onChange={(e) => setS({ ...s, yeni: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <Alan label="Yeni şifre (tekrar)">
                <input type="password" value={s.tekrar} onChange={(e) => setS({ ...s, tekrar: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <div className="flex justify-end">
                <Button size="sm" onClick={degistir}>Şifreyi güncelle</Button>
              </div>
            </div>
          </section>

          {digerler && (
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Diğer firma yetkilileri</h2>
              <ul className="mt-3 space-y-2">
                {mesaiArkadaslari.length === 0 && (
                  <p className="text-xs text-muted-foreground">Bu firmada başka yetkili yok.</p>
                )}
                {mesaiArkadaslari.map((y) => (
                  <li key={y.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{y.ad} {y.soyad}</p>
                      <p className="text-[11px] text-muted-foreground">{y.gorev} · @{y.kullaniciAdi}</p>
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', yetkiliDurumRenk[y.durum])}>
                      {y.durum}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              logout()
              navigate('/giris')
            }}
          >
            <LogOutIcon /> Oturumu kapat
          </Button>
        </div>
      </div>
    </div>
  )
}
