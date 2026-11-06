import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useFirmaPortalStore } from '@/stores/firma-portal-store'

export function RequireAuth() {
  const user = useAuthStore((s) => s.user)
  const { pathname } = useLocation()
  // Portal onboarding durumu — hesap ve KVKK teyidi store'dan reaktif okunur
  const portalHesap = usePersonelStore((s) =>
    s.hesaplar.find((h) => h.personelId === user?.personelId && h.durum !== 'Pasif'),
  )
  const kvkkBekliyor = usePersonelStore((s) =>
    portalHesap ? s.kvkkBekliyor(portalHesap.id) : false,
  )
  // Firma yetkilisi hesabı — durum değişikliği anında yansır
  const yetkili = useFirmaPortalStore((s) =>
    user?.tip === 'firma' ? s.yetkililer.find((y) => y.id === user.yetkiliId) : undefined,
  )

  if (!user) return <Navigate to="/giris" replace />

  if (user.tip === 'firma') {
    // Hesap kaldırılmış/askıya alınmış → oturum açık kalmış olsa bile erişim yok.
    // Üretimde aynı kontrol her API isteğinde sunucuda tekrarlanır.
    if (!yetkili || yetkili.durum !== 'Aktif') {
      useAuthStore.getState().logout()
      return <Navigate to="/giris" replace />
    }
    if (yetkili.sifreDegisimZorunlu && pathname !== '/ilk-giris/firma-sifre')
      return <Navigate to="/ilk-giris/firma-sifre" replace />
    if (!yetkili.sifreDegisimZorunlu && pathname === '/ilk-giris/firma-sifre')
      return <Navigate to="/firma" replace />
    // Firma yetkilisi yalnız firma portalını görür — yönetim paneli ve çalışan portalı kapalı
    if (!pathname.startsWith('/firma') && pathname !== '/ilk-giris/firma-sifre')
      return <Navigate to="/firma" replace />
    return <Outlet />
  }

  if (user.tip === 'portal') {
    const onboardingMi = pathname.startsWith('/ilk-giris')
    const sifreZorunlu = !!portalHesap?.sifreDegisimZorunlu

    // Askıya alınmış hesap → erişim yok (oturum açık kalmışsa bile)
    if (!portalHesap || portalHesap.durum === 'Askıda') {
      useAuthStore.getState().logout()
      return <Navigate to="/giris" replace />
    }
    // Şifre değişimi ve KVKK teyidi tamamlanmadan portal/eğitim erişimi yok.
    // Üretimde aynı kontroller backend'de her istekte tekrarlanmalıdır.
    if (sifreZorunlu && pathname !== '/ilk-giris/sifre')
      return <Navigate to="/ilk-giris/sifre" replace />
    if (!sifreZorunlu && kvkkBekliyor && pathname !== '/ilk-giris/kvkk')
      return <Navigate to="/ilk-giris/kvkk" replace />
    // Onboarding tamamlandıysa onboarding sayfalarına dönme
    if (onboardingMi && !sifreZorunlu && !kvkkBekliyor)
      return <Navigate to="/portal" replace />
    // Yönetim paneli — yalnız eğitim oynatıcı rotası açık
    const oynaticiMi = /^\/panel\/egitimler\/[^/]+\/oynat/.test(pathname)
    if (!pathname.startsWith('/portal') && !pathname.startsWith('/ilk-giris') && !oynaticiMi)
      return <Navigate to="/portal" replace />
    return <Outlet />
  }

  // Yönetim hesapları portal/onboarding alanlarına giremez
  if (pathname.startsWith('/portal') || pathname.startsWith('/ilk-giris') || pathname.startsWith('/firma'))
    return <Navigate to="/panel" replace />
  return <Outlet />
}
