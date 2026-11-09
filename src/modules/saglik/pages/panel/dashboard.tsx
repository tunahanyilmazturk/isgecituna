import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  HeartPulseIcon,
  PlusIcon,
  ReceiptTextIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react'
import { Button } from '@saglik/components/ui/button'
import { Pill, type PillTone } from '@saglik/components/pill'
import { useEkipmanStore, useTaramaStore, useTeklifStore } from '@saglik/stores/saglik-stores'
import { BUGUN, teklifTutari, type Tarama, type TaramaDurum, type TeklifDurum } from '@saglik/data/saglik'
import { formatKisa, formatUzun, gunFarki } from '@saglik/lib/date'
import { cn } from '@saglik/lib/utils'
import { saatAraligi, tarihAraligi } from '@saglik/lib/tarama'

const TARAMA_TON: Record<TaramaDurum, PillTone> = {
  Planlandı: 'violet',
  'Devam ediyor': 'amber',
  Tamamlandı: 'green',
  İptal: 'zinc',
}

const TEKLIF_TON: Record<TeklifDurum, PillTone> = {
  Taslak: 'zinc',
  Gönderildi: 'amber',
  Onaylandı: 'green',
  Reddedildi: 'red',
}

const kart = 'rounded-xl border bg-card'

const hizliErisim = [
  { to: '/panel/taramalar', label: 'Taramalar', ikon: HeartPulseIcon, aciklama: 'Saha planı ve ilerleme' },
  { to: '/panel/teklifler', label: 'Teklifler', ikon: ReceiptTextIcon, aciklama: 'Firma teklifleri' },
  { to: '/panel/firmalar', label: 'Firmalar', ikon: UsersIcon, aciklama: 'Müşteri kayıtları' },
  { to: '/panel/ekipmanlar', label: 'Ekipmanlar', ikon: WrenchIcon, aciklama: 'Cihaz ve kalibrasyon' },
  { to: '/panel/takvim', label: 'Takvim', ikon: CalendarDaysIcon, aciklama: 'Aylık plan' },
]

export default function DashboardPage() {
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const ekipmanlar = useEkipmanStore((s) => s.kayitlar)

  const ozet = useMemo(() => {
    const bugunku = taramalar.filter((t) => t.tarih === BUGUN && t.durum !== 'İptal')
    const haftalik = taramalar.filter((t) => {
      const f = gunFarki(BUGUN, t.tarih)
      return f >= 0 && f <= 7 && t.durum !== 'İptal'
    })
    const planlananKisi = haftalik.reduce((t, x) => t + x.kisiSayisi, 0)
    const acikTeklif = teklifler.filter((t) => t.durum === 'Gönderildi')
    const hazirEkipman = ekipmanlar.filter((e) => e.durum === 'Hazır' || e.durum === 'Sahada').length
    return { bugunku, haftalik, planlananKisi, acikTeklif, hazirEkipman }
  }, [taramalar, teklifler, ekipmanlar])

  /** Dikkat gerektirenler: kalibrasyonu dolan / yaklaşan, bakımda-arızalı cihazlar, geçerliliği bitmek üzere teklifler */
  const uyarilar = useMemo(() => {
    const liste: { id: string; metin: string; detay: string; ton: PillTone; to: string }[] = []
    for (const e of ekipmanlar) {
      const kalan = gunFarki(BUGUN, e.kalibrasyonBitis)
      if (kalan < 0) liste.push({ id: e.id, metin: `${e.ad} kalibrasyonu doldu`, detay: e.konum, ton: 'red', to: '/panel/ekipmanlar' })
      else if (kalan <= 30) liste.push({ id: e.id, metin: `${e.ad} kalibrasyonu ${kalan} gün içinde doluyor`, detay: e.konum, ton: 'orange', to: '/panel/ekipmanlar' })
      if (e.durum === 'Arızalı' || e.durum === 'Bakımda') liste.push({ id: `${e.id}-d`, metin: `${e.ad}: ${e.durum}`, detay: e.konum, ton: 'red', to: '/panel/ekipmanlar' })
    }
    for (const t of teklifler) {
      const kalan = gunFarki(BUGUN, t.gecerlilik)
      if (t.durum === 'Gönderildi' && kalan >= 0 && kalan <= 7)
        liste.push({ id: t.id, metin: `${t.firma} teklifi ${kalan} gün sonra geçersiz`, detay: t.no, ton: 'amber', to: '/panel/teklifler' })
    }
    return liste
  }, [ekipmanlar, teklifler])

  const yaklasan: Tarama[] = useMemo(
    () =>
      taramalar
        .filter((t) => gunFarki(BUGUN, t.tarih) >= 0 && t.durum !== 'İptal')
        .sort((a, b) => (a.tarih === b.tarih ? a.saat.localeCompare(b.saat) : a.tarih.localeCompare(b.tarih)))
        .slice(0, 6),
    [taramalar],
  )

  const sonTeklifler = useMemo(() => [...teklifler].sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 5), [teklifler])

  return (
    <div className="space-y-4">
      {/* Üst başlık: görsel yoksa amber-zinc gradyan görünür */}
      <header className="relative isolate overflow-hidden rounded-xl border bg-zinc-950 text-white">
        {/* Yedek zemin (görsel yoksa) → görsel → okunurluk için yarı saydam koyu katman */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.35),transparent_55%),linear-gradient(120deg,#18181b,#09090b)]" />
        <img
          src="/images/osgbhub-dashboard-banner.jpg"
          alt=""
          aria-hidden="true"
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/75 to-zinc-950/25" />
        <div className="relative flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium tracking-wider text-amber-400 uppercase">{formatUzun(BUGUN)}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Genel Bakış</h1>
            <p className="mt-1 max-w-md text-sm text-zinc-300">
              Bugünkü taramalar, bekleyen teklifler ve ekipman durumu tek ekranda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/panel/teklifler">
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <ReceiptTextIcon /> Teklifler
              </Button>
            </Link>
            <Link to="/panel/taramalar">
              <Button className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
                <PlusIcon /> Yeni tarama
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/panel/taramalar" className={cn(kart, 'p-4 transition-colors hover:bg-muted/50')}>
          <p className="text-xs text-muted-foreground">Bugünkü taramalar</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{ozet.bugunku.length}</p>
        </Link>
        <Link to="/panel/taramalar" className={cn(kart, 'p-4 transition-colors hover:bg-muted/50')}>
          <p className="text-xs text-muted-foreground">Önümüzdeki 7 gün · kişi</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{ozet.planlananKisi}</p>
        </Link>
        <Link to="/panel/teklifler" className={cn(kart, 'p-4 transition-colors hover:bg-muted/50')}>
          <p className="text-xs text-muted-foreground">Onay bekleyen teklif</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{ozet.acikTeklif.length}</p>
        </Link>
        <Link to="/panel/ekipmanlar" className={cn(kart, 'p-4 transition-colors hover:bg-muted/50')}>
          <p className="text-xs text-muted-foreground">Hazır / sahada ekipman</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {ozet.hazirEkipman}
            <span className="text-sm text-muted-foreground">/{ekipmanlar.length}</span>
          </p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={cn(kart, 'lg:col-span-2')}>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Yaklaşan taramalar</h2>
            <Link to="/panel/taramalar" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Tümü <ArrowRightIcon className="size-3" />
            </Link>
          </div>
          <ul className="divide-y">
            {yaklasan.map((t) => (
              <li key={t.id}>
                <Link to="/panel/taramalar" className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                  <div className="w-16 shrink-0 tabular-nums">
                    <p className="text-sm font-medium">{tarihAraligi(t)}</p>
                    <p className="text-xs text-muted-foreground">{saatAraligi(t)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.firma}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.hizmet} · {t.lokasyon} · {t.ekip}
                    </p>
                  </div>
                  <Pill tone={TARAMA_TON[t.durum]}>{t.durum}</Pill>
                </Link>
              </li>
            ))}
            {yaklasan.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Yaklaşan tarama yok.</li>}
          </ul>
        </section>

        <section className={kart}>
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <AlertTriangleIcon className="size-4 text-orange-500" />
            <h2 className="text-sm font-semibold">Dikkat gerektirenler</h2>
          </div>
          <ul className="divide-y">
            {uyarilar.map((u) => (
              <li key={u.id}>
                <Link to={u.to} className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                  <Pill tone={u.ton} className="mt-0.5">!</Pill>
                  <div className="min-w-0">
                    <p className="text-sm">{u.metin}</p>
                    <p className="text-xs text-muted-foreground">{u.detay}</p>
                  </div>
                </Link>
              </li>
            ))}
            {uyarilar.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Uyarı yok, her şey yolunda.</li>}
          </ul>
        </section>

        <section className={cn(kart, 'lg:col-span-2')}>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Son teklifler</h2>
            <Link to="/panel/teklifler" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Tümü <ArrowRightIcon className="size-3" />
            </Link>
          </div>
          <ul className="divide-y">
            {sonTeklifler.map((t) => (
              <li key={t.id}>
                <Link to="/panel/teklifler" className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.firma}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t.no} · {formatKisa(t.tarih)}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{teklifTutari(t).toLocaleString('tr-TR')} ₺</span>
                  <Pill tone={TEKLIF_TON[t.durum]}>{t.durum}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={kart}>
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Hızlı erişim</h2>
          </div>
          <ul className="p-2">
            {hizliErisim.map((h) => (
              <li key={h.to}>
                <Link to={h.to} className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/50">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400">
                    <h.ikon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{h.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{h.aciklama}</span>
                  </span>
                  <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
