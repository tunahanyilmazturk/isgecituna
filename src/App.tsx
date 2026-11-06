import { Suspense, lazy, type ReactNode } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/app-layout'
import { RequireAuth } from '@/components/require-auth'
import FirmaLayout from '@/pages/firma/firma-layout'
import AyarlarLayout from '@/pages/ayarlar/ayarlar-layout'
import PortalLayout from '@/pages/portal/portal-layout'

/* Sayfa bileşenleri route bazlı yüklenir — ilk açılış yalnızca giriş + layout öder */
const DavetPage = lazy(() => import('@/pages/davet'))
const LoginPage = lazy(() => import('@/pages/login'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))
const DogrulaPage = lazy(() => import('@/pages/dogrula'))
const DashboardPage = lazy(() => import('@/pages/panel/dashboard'))
const RiskPage = lazy(() => import('@/pages/panel/risk'))
const RiskYeniPage = lazy(() => import('@/pages/panel/risk-yeni'))
const RiskDetayPage = lazy(() => import('@/pages/panel/risk-detay'))
const AksiyonlarPage = lazy(() => import('@/pages/panel/aksiyonlar'))
const OlaylarPage = lazy(() => import('@/pages/panel/olaylar'))
const OlayYeniPage = lazy(() => import('@/pages/panel/olay-yeni'))
const DenetimlerPage = lazy(() => import('@/pages/panel/denetimler'))
const DenetimYeniPage = lazy(() => import('@/pages/panel/denetim-yeni'))
const DenetimDetayPage = lazy(() => import('@/pages/panel/denetim-detay'))
const DenetimSahaPage = lazy(() => import('@/pages/panel/denetim-saha'))
const DenetimSablonlarPage = lazy(() => import('@/pages/panel/denetim-sablonlar'))
const DenetimRaporlarPage = lazy(() => import('@/pages/panel/denetim-raporlar'))
const EgitimlerPage = lazy(() => import('@/pages/panel/egitimler'))
const EgitimRaporPage = lazy(() => import('@/pages/panel/egitim-rapor'))
const EgitimEditorPage = lazy(() => import('@/pages/panel/egitim-editor'))
const EgitimPlayerPage = lazy(() => import('@/pages/panel/egitim-player'))
const EgitimAtamalariPage = lazy(() => import('@/pages/panel/egitim-atamalari'))
const EgitimAtamaYeniPage = lazy(() => import('@/pages/panel/egitim-atama-yeni'))
const SertifikalarPage = lazy(() => import('@/pages/panel/sertifikalar'))
const SertifikaDetayPage = lazy(() => import('@/pages/panel/sertifika-detay'))
const SertifikaTasarimlarPage = lazy(() => import('@/pages/panel/sertifika-tasarimlar'))
const SertifikaEditorPage = lazy(() => import('@/pages/panel/sertifika-editor'))
const SertifikaOnayPage = lazy(() => import('@/pages/panel/sertifika-onay'))
const FirmalarPage = lazy(() => import('@/pages/panel/firmalar'))
const FirmaDetayPage = lazy(() => import('@/pages/panel/firma-detay'))
const IsgKatipPage = lazy(() => import('@/pages/panel/isg-katip'))
const EkipPage = lazy(() => import('@/pages/panel/ekip'))
const EkipDetayPage = lazy(() => import('@/pages/panel/ekip-detay'))
const PersonellerPage = lazy(() => import('@/pages/panel/personeller'))
const PersonelTopluPage = lazy(() => import('@/pages/panel/personel-toplu'))
const PersonelDetayPage = lazy(() => import('@/pages/panel/personel-detay'))
const ProfilPage = lazy(() => import('@/pages/panel/profil'))
const RehberPage = lazy(() => import('@/pages/panel/rehber'))
const RehberYonetimPage = lazy(() => import('@/pages/panel/rehber-yonetim'))
const IlkSifrePage = lazy(() => import('@/pages/portal/ilk-giris').then((m) => ({ default: m.IlkSifrePage })))
const KvkkOnayPage = lazy(() => import('@/pages/portal/ilk-giris').then((m) => ({ default: m.KvkkOnayPage })))
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
const FirmaDashboard = lazy(() => import('@/pages/firma/dashboard'))
const FirmaCalisanlarPage = lazy(() => import('@/pages/firma/calisanlar'))
const FirmaCalisanDetay = lazy(() => import('@/pages/firma/calisanlar').then((m) => ({ default: m.FirmaCalisanDetay })))
const FirmaEgitimlerPage = lazy(() => import('@/pages/firma/egitimler'))
const FirmaTakipPage = lazy(() => import('@/pages/firma/takip'))
const FirmaSertifikalarPage = lazy(() => import('@/pages/firma/sertifikalar'))
const FirmaEvraklarPage = lazy(() => import('@/pages/firma/evraklar'))
const FirmaProfilPage = lazy(() => import('@/pages/firma/profil'))
const FirmaHesapPage = lazy(() => import('@/pages/firma/hesap'))
const FirmaSifrePage = lazy(() => import('@/pages/firma/firma-sifre'))
const FirmaRehberPage = lazy(() => import('@/pages/firma/rehber'))
const PortalDashboard = lazy(() => import('@/pages/portal/portal-pages').then((m) => ({ default: m.PortalDashboard })))
const PortalEgitimler = lazy(() => import('@/pages/portal/portal-pages').then((m) => ({ default: m.PortalEgitimler })))
const PortalProfil = lazy(() => import('@/pages/portal/portal-pages').then((m) => ({ default: m.PortalProfil })))
const PortalSertifikalar = lazy(() => import('@/pages/portal/portal-pages').then((m) => ({ default: m.PortalSertifikalar })))
const PortalRehberPage = lazy(() => import('@/pages/portal/rehber'))

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
      <Route path="/davet/:token" element={lz(<DavetPage />)} />
      <Route path="/sifre-sifirla/:token" element={lz(<DavetPage />)} />
      <Route path="/dogrula/:kod" element={lz(<DogrulaPage />)} />
      <Route element={<RequireAuth />}>
        <Route path="/ilk-giris/sifre" element={lz(<IlkSifrePage />)} />
        <Route path="/ilk-giris/kvkk" element={lz(<KvkkOnayPage />)} />
        <Route path="/ilk-giris/firma-sifre" element={lz(<FirmaSifrePage />)} />
        <Route path="/panel" element={<AppLayout />}>
          <Route index element={lz(<DashboardPage />)} />
          <Route path="risk" element={lz(<RiskPage />)} />
          <Route path="risk/yeni" element={lz(<RiskYeniPage />)} />
          <Route path="risk/:id" element={lz(<RiskDetayPage />)} />
          <Route path="aksiyonlar" element={lz(<AksiyonlarPage />)} />
          <Route path="olaylar" element={lz(<OlaylarPage />)} />
          <Route path="olaylar/yeni" element={lz(<OlayYeniPage />)} />
          <Route path="denetimler" element={lz(<DenetimlerPage />)} />
          <Route path="denetimler/yeni" element={lz(<DenetimYeniPage />)} />
          <Route path="denetimler/sablonlar" element={lz(<DenetimSablonlarPage />)} />
          <Route path="denetimler/raporlar" element={lz(<DenetimRaporlarPage />)} />
          <Route path="denetimler/:id" element={lz(<DenetimDetayPage />)} />
          <Route path="denetimler/:id/saha" element={lz(<DenetimSahaPage />)} />
          <Route path="egitimler" element={lz(<EgitimlerPage />)} />
          <Route path="egitimler/yeni" element={lz(<EgitimEditorPage />)} />
          <Route path="egitimler/:id" element={lz(<EgitimPlayerPage />)} />
          <Route path="egitimler/:id/duzenle" element={lz(<EgitimEditorPage />)} />
          <Route path="egitimler/:id/rapor" element={lz(<EgitimRaporPage />)} />
          <Route path="egitimler/:id/oynat" element={lz(<EgitimPlayerPage />)} />
          <Route path="egitim-atamalari/yeni" element={lz(<EgitimAtamaYeniPage />)} />
          <Route path="egitim-atamalari" element={lz(<EgitimAtamalariPage />)} />
          <Route path="sertifikalar" element={lz(<SertifikalarPage />)} />
          <Route path="sertifikalar/:id" element={lz(<SertifikaDetayPage />)} />
          <Route path="sertifika-tasarimlari" element={lz(<SertifikaTasarimlarPage />)} />
          <Route path="sertifika-editor/:id" element={lz(<SertifikaEditorPage />)} />
          <Route path="sertifika-onay" element={lz(<SertifikaOnayPage />)} />
          <Route path="firmalar" element={lz(<FirmalarPage />)} />
          <Route path="firmalar/:id" element={lz(<FirmaDetayPage />)} />
          <Route path="isg-katip" element={lz(<IsgKatipPage />)} />
          <Route path="ekip" element={lz(<EkipPage />)} />
          <Route path="ekip/:id" element={lz(<EkipDetayPage />)} />
          <Route path="personeller" element={lz(<PersonellerPage />)} />
          <Route path="personeller/toplu" element={lz(<PersonelTopluPage />)} />
          <Route path="personeller/:id" element={lz(<PersonelDetayPage />)} />
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
          <Route path="rehber" element={lz(<RehberPage />)} />
          <Route path="rehber/yonetim" element={lz(<RehberYonetimPage />)} />
          <Route path="rehber/:modulId" element={lz(<RehberPage />)} />
          <Route path="rehber/:modulId/:rehberId" element={lz(<RehberPage />)} />
          <Route path="profil" element={lz(<ProfilPage />)} />
        </Route>
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={lz(<PortalDashboard />)} />
          <Route path="egitimler" element={lz(<PortalEgitimler />)} />
          <Route path="sertifikalar" element={lz(<PortalSertifikalar />)} />
          <Route path="egitimler/:id/oynat" element={lz(<EgitimPlayerPage />)} />
          <Route path="profil" element={lz(<PortalProfil />)} />
          <Route path="rehber" element={lz(<PortalRehberPage />)} />
          <Route path="rehber/:modulId" element={lz(<PortalRehberPage />)} />
          <Route path="rehber/:modulId/:rehberId" element={lz(<PortalRehberPage />)} />
        </Route>
        <Route path="/firma" element={<FirmaLayout />}>
          <Route index element={lz(<FirmaDashboard />)} />
          <Route path="calisanlar" element={lz(<FirmaCalisanlarPage />)} />
          <Route path="calisanlar/:id" element={lz(<FirmaCalisanDetay />)} />
          <Route path="egitimler" element={lz(<FirmaEgitimlerPage />)} />
          <Route path="takip" element={lz(<FirmaTakipPage />)} />
          <Route path="sertifikalar" element={lz(<FirmaSertifikalarPage />)} />
          <Route path="evraklar" element={lz(<FirmaEvraklarPage />)} />
          <Route path="profil" element={lz(<FirmaProfilPage />)} />
          <Route path="hesap" element={lz(<FirmaHesapPage />)} />
          <Route path="rehber" element={lz(<FirmaRehberPage />)} />
          <Route path="rehber/:modulId" element={lz(<FirmaRehberPage />)} />
          <Route path="rehber/:modulId/:rehberId" element={lz(<FirmaRehberPage />)} />
        </Route>
      </Route>
      <Route path="*" element={lz(<NotFoundPage />)} />
    </Routes>
  )
}
