/* Dashboard hero — karşılama, tarih, rol bilgisi ve hızlı işlemler */
import {
  BellIcon, Building2Icon, GraduationCapIcon, PlusIcon, ShieldCheckIcon,
  TriangleAlertIcon, UserPlusIcon, ClipboardListIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { TODAY } from '@/data/dashboard'
import { hesapGorunenAd } from '@/data/ekip'
import { formatUzun } from '@/lib/date'
import { useIzin } from '@/lib/izin'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useOsgb } from '@/lib/osgb'
import { usePersonelStore } from '@/stores/personeller-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { useOlaylarStore } from '@/stores/olaylar-store'
import { sertifikaGuncelDurum } from '@/data/sertifikalar'

const gunFarki = (tarih: string) =>
  Math.round((new Date(`${tarih}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86_400_000)

const selamla = () => {
  const saat = new Date().getHours()
  if (saat < 6) return 'İyi geceler'
  if (saat < 12) return 'Günaydın'
  if (saat < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

export function DashboardHero({ okunmamis }: { okunmamis: number }) {
  const user = useAuthStore((s) => s.user)
  const { uyeler, hesaplar } = useEkipStore()
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const ad = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.name ?? '')
  const rol = user?.unvan || hesap?.rol || ''
  const osgb = useOsgb().kisaAd || 'OSGB'

  // Hook'lar sabit sırada — izinler tek tek değerlendirilir
  const iFirma = useIzin('firmalar.olustur')
  const iPersonel = useIzin('personeller.olustur')
  const iEgitim = useIzin('egitimler.olustur')
  const iRisk = useIzin('risk.olustur')
  const iOlay = useIzin('olaylar.olustur')
  const iAtama = useIzin('egitimler.ata')
  const iSertifika = useIzin('sertifikalar.goruntule')

  // Bugün dikkat gerektiren canlı sayılar
  const atamalar = usePersonelStore((s) => s.atamalar)
  const sertifikalar = useSertifikaStore((s) => s.sertifikalar)
  const olaylar = useOlaylarStore((s) => s.olaylar)
  const gecikenAtama = atamalar.filter((a) => a.durum === 'Aktif' && a.sonTarih < TODAY).length
  const yakinSertifika = sertifikalar.filter((s) => {
    const g = s.gecerlilikTarihi ? gunFarki(s.gecerlilikTarihi) : null
    return sertifikaGuncelDurum(s) === 'Aktif' && g !== null && g >= 0 && g <= 30
  }).length
  const acikOlay = olaylar.filter((o) => o.durum !== 'Kapatıldı').length
  const dikkat = [
    iAtama && { label: 'Son tarihi geçen atama', deger: gecikenAtama, to: '/panel/egitim-atamalari' },
    iSertifika && { label: '30 gün içinde dolacak sertifika', deger: yakinSertifika, to: '/panel/sertifikalar' },
    { label: 'Açık olay', deger: acikOlay, to: '/panel/olaylar' },
  ].filter(Boolean) as { label: string; deger: number; to: string }[]

  const hizli = [
    iFirma && { label: 'Yeni Firma', to: '/panel/firmalar', Icon: Building2Icon },
    iPersonel && { label: 'Personel Ekle', to: '/panel/personeller', Icon: UserPlusIcon },
    iOlay && { label: 'Olay Bildir', to: '/panel/olaylar/yeni', Icon: TriangleAlertIcon },
    iRisk && { label: 'Risk Değerlendirmesi', to: '/panel/risk/yeni', Icon: ShieldCheckIcon },
    iEgitim && { label: 'Yeni Eğitim', to: '/panel/egitimler/yeni', Icon: GraduationCapIcon },
    iAtama && { label: 'Eğitim Ataması', to: '/panel/egitim-atamalari', Icon: ClipboardListIcon },
  ].filter(Boolean) as { label: string; to: string; Icon: typeof PlusIcon }[]

  return (
    <div className="relative isolate min-h-[250px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_20px_60px_-36px_rgba(245,158,11,.35)]">
      <img
        src="/images/isghub-dashboard-hero.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover object-[72%_center] sm:object-[center_48%]"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,9,11,.99)_0%,rgba(9,9,11,.92)_40%,rgba(9,9,11,.58)_68%,rgba(9,9,11,.16)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(9,9,11,.58),transparent_48%)]" />
      <div className="relative flex flex-col gap-5 p-5 sm:p-7">
        <div className="max-w-[90%] sm:max-w-[76%]">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-zinc-950/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-300 shadow-sm backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,.9)]" />
            {formatUzun(TODAY)}
          </p>
          <h1 className="mt-3 text-[25px] font-semibold tracking-tight text-white sm:text-[30px]">
            {selamla()}, {ad}
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
            {osgb} çalışma alanındasınız{rol ? ` — ${rol}` : ''}. Firmaların operasyonlarını, eğitim
            süreçlerini ve iş güvenliği akışlarını tek panelden takip edebilirsiniz.
          </p>
        </div>
        {dikkat.length > 0 && (
          <div className={cn('grid max-w-3xl gap-2', dikkat.length === 3 ? 'grid-cols-3' : dikkat.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
            {dikkat.map(({ label, deger, to }) => (
              <Link
                key={label}
                to={to}
                className="group rounded-xl border border-white/10 bg-zinc-950/55 px-3.5 py-2.5 backdrop-blur-md transition-colors hover:border-amber-400/40"
              >
                <p className={cn('text-xl font-semibold tabular-nums', deger > 0 ? 'text-amber-300' : 'text-emerald-300')}>{deger}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-zinc-400 group-hover:text-zinc-200">{label}</p>
              </Link>
            ))}
          </div>
        )}
        <div className="flex max-w-4xl flex-wrap items-center gap-2">
          {hizli.map(({ label, to, Icon }) => (
            <Link
              key={label}
              to={to}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/55 px-3.5 py-1.5 text-xs font-medium text-zinc-100 shadow-sm backdrop-blur-md transition-colors',
                'hover:border-amber-400/40 hover:bg-amber-400/15 hover:text-amber-200',
              )}
            >
              <Icon className="size-3.5" /> {label}
            </Link>
          ))}
          {okunmamis > 0 && (
            <a
              href="#bildirimler"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-400/15 px-3.5 py-1.5 text-xs font-semibold text-amber-200 shadow-sm backdrop-blur-md transition-colors hover:bg-amber-400/25"
            >
              <BellIcon className="size-3.5" /> {okunmamis} bildirim
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
