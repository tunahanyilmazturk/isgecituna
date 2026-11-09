import { Suspense, lazy, type ReactNode } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/app-layout'
import { RequireAuth } from '@/components/require-auth'
import AyarlarLayout from '@/pages/ayarlar/ayarlar-layout'

/* Sayfa bileşenleri route bazlı yüklenir — ilk açılış yalnızca giriş + layout öder */
const LoginPage = lazy(() => import('@/pages/login'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))
const DashboardPage = lazy(() => import('@/pages/panel/dashboard'))
const IstatistiklerPage = lazy(() => import('@/pages/panel/istatistikler'))
const TakvimPage = lazy(() => import('@/pages/panel/takvim'))
const TaramalarPage = lazy(() => import('@/pages/panel/taramalar'))
const TaramaYeniPage = lazy(() => import('@/pages/panel/tarama-yeni'))
const TaramaDetayPage = lazy(() => import('@/pages/panel/tarama-detay'))
const TeklifPage = lazy(() => import('@/pages/panel/teklifler'))
const TeklifYeniPage = lazy(() => import('@/pages/panel/teklif-yeni'))
const TeklifDetayPage = lazy(() => import('@/pages/panel/teklif-detay'))
const TestlerPage = lazy(() => import('@/pages/panel/testler'))
const TestPaketleriPage = lazy(() => import('@/pages/panel/test-paketleri'))
const EkipmanlarPage = lazy(() => import('@/pages/panel/ekipmanlar'))
const FirmalarPage = lazy(() => import('@/pages/panel/firmalar'))
const FirmaDetayPage = lazy(() => import('@/pages/panel/firma-detay'))
const EkipPage = lazy(() => import('@/pages/panel/ekip'))
const PersonellerPage = lazy(() => import('@/pages/panel/personeller'))
const ProfilPage = lazy(() => import('@/pages/panel/profil'))
const GenelAyarlarPage = lazy(() => import('@/pages/ayarlar/genel'))
const KurumAyarlarPage = lazy(() => import('@/pages/ayarlar/kurum'))
const KullanicilarPage = lazy(() => import('@/pages/ayarlar/kullanicilar'))
const IzinlerPage = lazy(() => import('@/pages/ayarlar/izinler'))
const EkipAyarlarPage = lazy(() => import('@/pages/ayarlar/ekip'))
const BildirimPage = lazy(() => import('@/pages/ayarlar/bildirim'))
const GuvenlikPage = lazy(() => import('@/pages/ayarlar/guvenlik'))
const BelgelerPage = lazy(() => import('@/pages/ayarlar/belgeler'))
const TanimlarPage = lazy(() => import('@/pages/ayarlar/tanimlar'))
const IsAkisiPage = lazy(() => import('@/pages/ayarlar/is-akisi'))
const EntegrasyonlarPage = lazy(() => import('@/pages/ayarlar/entegrasyonlar'))
const VeriPage = lazy(() => import('@/pages/ayarlar/veri'))
const GecmisPage = lazy(() => import('@/pages/ayarlar/gecmis'))

function SayfaYukleniyor() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2Icon className="size-6 animate-spin text-amber-500" />
    </div>
  )
}

/** Suspense sınırı element seviyesinde — layout monteli kalır, yalnızca içerik bekler */
const lz = (el: ReactNode) => <Suspense fallback={<SayfaYukleniyor />}>{el}</Suspense>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/panel" replace />} />
      <Route path="/giris" element={lz(<LoginPage />)} />
      <Route element={<RequireAuth />}>
        <Route path="/panel" element={<AppLayout />}>
          <Route index element={lz(<DashboardPage />)} />
          <Route path="istatistikler" element={lz(<IstatistiklerPage />)} />
          <Route path="takvim" element={lz(<TakvimPage />)} />
          <Route path="taramalar" element={lz(<TaramalarPage />)} />
          <Route path="taramalar/yeni" element={lz(<TaramaYeniPage />)} />
          <Route path="taramalar/:id" element={lz(<TaramaDetayPage />)} />
          <Route path="teklifler" element={lz(<TeklifPage />)} />
          <Route path="teklifler/yeni" element={lz(<TeklifYeniPage />)} />
          <Route path="teklifler/:id" element={lz(<TeklifDetayPage />)} />
          <Route path="testler" element={lz(<TestlerPage />)} />
          <Route path="test-paketleri" element={lz(<TestPaketleriPage />)} />
          <Route path="ekipmanlar" element={lz(<EkipmanlarPage />)} />
          <Route path="firmalar" element={lz(<FirmalarPage />)} />
          <Route path="firmalar/:id" element={lz(<FirmaDetayPage />)} />
          <Route path="ekip" element={lz(<EkipPage />)} />
          <Route path="personeller" element={lz(<PersonellerPage />)} />
          <Route path="ayarlar" element={<AyarlarLayout />}>
            <Route index element={<Navigate to="genel" replace />} />
            <Route path="genel" element={lz(<GenelAyarlarPage />)} />
            <Route path="kurum" element={lz(<KurumAyarlarPage />)} />
            <Route path="kullanicilar" element={lz(<KullanicilarPage />)} />
            <Route path="izinler" element={lz(<IzinlerPage />)} />
            <Route path="ekip" element={lz(<EkipAyarlarPage />)} />
            <Route path="bildirim" element={lz(<BildirimPage />)} />
            <Route path="guvenlik" element={lz(<GuvenlikPage />)} />
            <Route path="belgeler" element={lz(<BelgelerPage />)} />
            <Route path="tanimlar" element={lz(<TanimlarPage />)} />
            <Route path="is-akisi" element={lz(<IsAkisiPage />)} />
            <Route path="entegrasyonlar" element={lz(<EntegrasyonlarPage />)} />
            <Route path="veri" element={lz(<VeriPage />)} />
            <Route path="gecmis" element={lz(<GecmisPage />)} />
          </Route>
          <Route path="profil" element={lz(<ProfilPage />)} />
        </Route>
      </Route>
      <Route path="*" element={lz(<NotFoundPage />)} />
    </Routes>
  )
}
