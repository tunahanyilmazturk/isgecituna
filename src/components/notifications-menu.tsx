import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertTriangleIcon,
  BellIcon,
  CalendarCheckIcon,
  FileWarningIcon,
  ShieldCheckIcon,
  SirenIcon,
  UserXIcon,
} from 'lucide-react'
import { olaylar, suresiGecmis } from '@/data/dashboard'
import { TODAY } from '@/data/dashboard'
import { adSoyad, BUGUN as EKIP_BUGUN } from '@/data/ekip'
import { eksikAlanlar } from '@/data/firmalar'
import { eksikGorevlendirme, kalanGun } from '@/data/isgkatip'
import { formatKisa, gunFarki } from '@/lib/date'
import { aksiyonGecikmis } from '@/data/risk'
import { cn } from '@/lib/utils'
import { useEkipStore } from '@/stores/ekip-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useDenetimlerStore } from '@/stores/denetimler-store'
import { useRiskStore } from '@/stores/risk-store'
import { useBildirimStore } from '@/stores/bildirim-store'
import { bildirimGorunumu } from '@/lib/bildirim-view'

const tones = {
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
} as const

export function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [okundu, setOkundu] = useState(false)
  const navigate = useNavigate()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const katip = useFirmalarStore((s) => s.katip)
  const uyeler = useEkipStore((s) => s.uyeler)
  const hesaplar = useEkipStore((s) => s.hesaplar)
  const denetimler = useDenetimlerStore((s) => s.denetimler)
  const bulgular = useDenetimlerStore((s) => s.bulgular)
  const aksiyonlar = useRiskStore((s) => s.aksiyonlar)
  const uygulamaBildirimleri = useBildirimStore((s) => s.bildirimler)

  // İSG uzmanına giden uygulama bildirimleri (firma işlemleri, başvurular, atamalar)
  const osgbBildirimleri = useMemo(
    () =>
      uygulamaBildirimleri
        .filter((b) => b.hedef === 'osgb')
        .map((b) => ({ ...bildirimGorunumu(b), tone: b.ton })),
    [uygulamaBildirimleri],
  )

  // Denetim kaynaklı bildirimler — gerçek kayıtlardan
  const denetimBildirimler = useMemo(
    () => [
      ...denetimler
        .filter((d) => d.durum === 'Planlandı' && gunFarki(TODAY, d.planlananTarih) >= 0 && gunFarki(TODAY, d.planlananTarih) <= 7)
        .map((d) => ({
          ikon: CalendarCheckIcon,
          tone: 'amber' as const,
          baslik: gunFarki(TODAY, d.planlananTarih) === 0 ? 'Denetim bugün' : `Denetim yaklaşıyor (${gunFarki(TODAY, d.planlananTarih)} gün)`,
          detay: `${d.no} · ${d.baslik} · ${d.uzmanAd}`,
          to: `/panel/denetimler/${d.id}`,
        })),
      ...bulgular
        .filter((b) => b.onem === 'Kritik' && b.durum !== 'Kapatıldı' && b.durum !== 'İptal Edildi')
        .map((b) => {
          const d = denetimler.find((x) => x.id === b.denetimId)
          return {
            ikon: AlertTriangleIcon,
            tone: 'red' as const,
            baslik: 'Kritik uygunsuzluk',
            detay: `${b.baslik} · ${d?.no ?? b.denetimId}`,
            to: `/panel/denetimler/${b.denetimId}?sekme=uygunsuzluk`,
          }
        }),
      ...aksiyonlar
        .filter((a) => a.kaynak?.tur === 'denetim' && a.durum === 'Kontrol Bekliyor')
        .map((a) => ({
          ikon: FileWarningIcon,
          tone: 'amber' as const,
          baslik: 'Düzeltici faaliyet kontrol bekliyor',
          detay: `${a.id} · ${a.baslik} · ${a.firmaAd}`,
          to: `/panel/denetimler/${a.kaynak!.denetimId}?sekme=aksiyonlar`,
        })),
      ...aksiyonlar
        .filter((a) => a.kaynak?.tur === 'denetim' && aksiyonGecikmis(a))
        .map((a) => ({
          ikon: AlertTriangleIcon,
          tone: 'red' as const,
          baslik: 'Denetim aksiyonu gecikti',
          detay: `${a.id} · ${a.baslik} · ${a.sorumluAd}`,
          to: `/panel/denetimler/${a.kaynak!.denetimId}?sekme=aksiyonlar`,
        })),
    ],
    [denetimler, bulgular, aksiyonlar],
  )

  // Veriden türetilen uyarılar — her kayıt için tek bildirim (tekrarsız)
  const bildirimler = useMemo(
    () => [
      ...katip
        .filter((k) => {
          const g = kalanGun(k.sozlesmeBitis)
          return g < 0 && k.durum !== 'Süresi Dolmuş' && k.durum !== 'İptal Edildi'
        })
        .map((k) => ({
          ikon: AlertTriangleIcon,
          tone: 'red' as const,
          baslik: 'Sözleşme süresi doldu',
          detay: `${k.sozlesmeNo} · ${firmalar.find((f) => f.id === k.firmaId)?.unvan ?? k.firmaId}`,
          to: '/panel/isg-katip',
        })),
      ...katip
        .filter((k) => {
          const g = kalanGun(k.sozlesmeBitis)
          return g >= 0 && g <= 7
        })
        .map((k) => ({
          ikon: AlertTriangleIcon,
          tone: 'red' as const,
          baslik: `Sözleşme bitimine ${kalanGun(k.sozlesmeBitis)} gün kaldı`,
          detay: `${k.sozlesmeNo} · ${firmalar.find((f) => f.id === k.firmaId)?.unvan ?? k.firmaId}`,
          to: '/panel/isg-katip',
        })),
      ...katip
        .filter((k) => {
          const g = kalanGun(k.sozlesmeBitis)
          return g > 7 && g <= 15
        })
        .map((k) => ({
          ikon: ShieldCheckIcon,
          tone: 'amber' as const,
          baslik: `Sözleşme bitimine ${kalanGun(k.sozlesmeBitis)} gün kaldı`,
          detay: `${k.sozlesmeNo} · ${firmalar.find((f) => f.id === k.firmaId)?.unvan ?? k.firmaId}`,
          to: '/panel/isg-katip',
        })),
      ...katip
        .filter((k) => {
          const g = kalanGun(k.sozlesmeBitis)
          return g > 15 && g <= 30
        })
        .map((k) => ({
          ikon: ShieldCheckIcon,
          tone: 'amber' as const,
          baslik: `Sözleşme bitimine ${kalanGun(k.sozlesmeBitis)} gün kaldı`,
          detay: `${k.sozlesmeNo} · ${firmalar.find((f) => f.id === k.firmaId)?.unvan ?? k.firmaId}`,
          to: '/panel/isg-katip',
        })),
      ...katip
        .filter((k) => eksikGorevlendirme(k).length > 0)
        .map((k) => ({
          ikon: UserXIcon,
          tone: 'amber' as const,
          baslik: 'Eksik görevlendirme',
          detay: `${firmalar.find((f) => f.id === k.firmaId)?.unvan ?? k.firmaId} — ${eksikGorevlendirme(k).join(', ')} ataması yok`,
          to: '/panel/isg-katip',
        })),
      ...firmalar
        .filter((f) => f.durum === 'Aktif' && eksikAlanlar(f).length > 0)
        .map((f) => ({
          ikon: FileWarningIcon,
          tone: 'amber' as const,
          baslik: 'Firma bilgileri eksik',
          detay: `${f.unvan} — ${eksikAlanlar(f).length} zorunlu alan`,
          to: `/panel/firmalar/${f.id}`,
        })),
      ...uyeler
        .filter((u) => {
          if (!u.belgeGecerlilik || u.durum !== 'Aktif') return false
          const g = gunFarki(EKIP_BUGUN, u.belgeGecerlilik)
          return g >= 0 && g <= 30
        })
        .map((u) => ({
          ikon: FileWarningIcon,
          tone: 'amber' as const,
          baslik: 'Mesleki belge süresi yaklaşıyor',
          detay: `${adSoyad(u)} — ${gunFarki(EKIP_BUGUN, u.belgeGecerlilik!)} gün kaldı`,
          to: `/panel/ekip/${u.id}`,
        })),
      ...uyeler
        .filter((u) => u.belgeGecerlilik && u.durum === 'Aktif' && gunFarki(EKIP_BUGUN, u.belgeGecerlilik) < 0)
        .map((u) => ({
          ikon: AlertTriangleIcon,
          tone: 'red' as const,
          baslik: 'Mesleki belge süresi doldu',
          detay: `${adSoyad(u)} — belge yenileme gerekli`,
          to: `/panel/ekip/${u.id}`,
        })),
      ...hesaplar
        .filter((h) => h.durum === 'Davet Bekliyor')
        .map((h) => ({
          ikon: UserXIcon,
          tone: 'amber' as const,
          baslik: 'Davet yanıt bekliyor',
          detay: `@${h.kullaniciAdi} — ${h.davetTarihi ? formatKisa(h.davetTarihi) : ''}`,
          to: `/panel/ekip/${h.personelId}`,
        })),
      ...suresiGecmis.map((a) => ({
        ikon: AlertTriangleIcon,
        tone: 'red' as const,
        baslik: `${a.id} termin süresi geçti`,
        detay: `${a.baslik} · ${a.alan}`,
        to: '/panel/aksiyonlar',
      })),
      ...olaylar
        .filter((o) => o.durum === 'İncelemede')
        .map((o) => ({
          ikon: SirenIcon,
          tone: 'amber' as const,
          baslik: `${o.id} inceleme bekliyor`,
          detay: `${o.baslik} · ${o.alan}`,
          to: '/panel/olaylar',
        })),
      ...denetimBildirimler,
    ],
    [firmalar, katip, uyeler, hesaplar, denetimBildirimler],
  )

  const tumBildirimler = [...osgbBildirimleri, ...bildirimler]
  const okunmamis = okundu ? 0 : tumBildirimler.length

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Bildirimler${okunmamis > 0 ? ` (${okunmamis})` : ''}`}
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <BellIcon className="size-4" />
        {okunmamis > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-zinc-950 ring-2 ring-background tabular-nums">
            {okunmamis}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-popover shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <p className="text-sm font-medium">Bildirimler</p>
              {okunmamis > 0 && (
                <button
                  type="button"
                  onClick={() => setOkundu(true)}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Tümünü okundu say
                </button>
              )}
            </div>
            {tumBildirimler.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Yeni bildirim yok — her şey yolunda.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto p-1.5">
                {tumBildirimler.map((b, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        navigate(b.to)
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-lg',
                          tones[b.tone],
                        )}
                      >
                        <b.ikon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{b.baslik}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {b.detay}
                        </span>
                      </span>
                      {i < okunmamis && (
                        <span className="size-1.5 shrink-0 rounded-full bg-amber-400" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
