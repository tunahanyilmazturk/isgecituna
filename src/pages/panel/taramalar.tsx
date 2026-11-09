import { Link, Navigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowRightIcon, CalendarDaysIcon, HeartPulseIcon, Trash2Icon } from 'lucide-react'
import { ModulListesi, type FormAlan, type Kolon } from '@/components/modul/modul-listesi'
import { Pill, type PillTone } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { useTaramaStore } from '@/stores/saglik-stores'
import { BUGUN, HIZMET_TURLERI, TARAMA_DURUMLARI, gunEkle, type Tarama, type TaramaDurum } from '@/data/saglik'
import { gunFarki } from '@/lib/date'
import { cn } from '@/lib/utils'
import { SONRAKI_DURUM, durumPatch, ilerlemeOrani, saatAraligi, taramaEksikleri, tarihAraligi } from '@/lib/tarama'
import { useFirmaStore } from '@/stores/saglik-stores'

const TON: Record<TaramaDurum, PillTone> = {
  Planlandı: 'violet',
  'Devam ediyor': 'amber',
  Tamamlandı: 'green',
  İptal: 'zinc',
}

const tl = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`

/** Yaklaşan taramalar şeridi: en yakın 4 planlı/devam eden tarama ve eksik hazırlıkları */
function YaklasanSerit({ taramalar }: { taramalar: Tarama[] }) {
  const liste = taramalar
    .filter((t) => (t.durum === 'Planlandı' || t.durum === 'Devam ediyor') && t.tarih >= BUGUN)
    .sort((a, b) => `${a.tarih}${a.saat}`.localeCompare(`${b.tarih}${b.saat}`))
    .slice(0, 4)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase">Yaklaşan taramalar</h2>
        <Button variant="outline" size="xs" nativeButton={false} render={<Link to="/panel/takvim" />}>
          <CalendarDaysIcon /> Takvimde aç
        </Button>
      </div>
      {liste.length > 0 && (
    <section aria-label="Yaklaşan taramalar" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {liste.map((t) => {
        const kalan = gunFarki(BUGUN, t.tarih)
        const eksik = taramaEksikleri(t)
        return (
          <Link key={t.id} to={`/panel/taramalar/${t.id}`} className="group min-w-0 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-amber-400/60">
            <div className="flex items-center justify-between gap-2">
              <span className={cn('text-[11px] font-semibold', kalan === 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
                {kalan === 0 ? 'Bugün' : kalan === 1 ? 'Yarın' : `${kalan} gün sonra`}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{saatAraligi(t)}</span>
            </div>
            <p className="mt-1 truncate text-sm font-semibold group-hover:text-amber-700 dark:group-hover:text-amber-400">{t.firma}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t.hizmet} · {t.lokasyon || 'Lokasyon yok'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {eksik.length ? eksik.map((e) => <Pill key={e} tone="amber">{e}</Pill>) : <Pill tone="green">Hazır</Pill>}
            </div>
          </Link>
        )
      })}
    </section>
      )}
    </div>
  )
}

/** Satır işlemleri: sonraki durum ve silme. Satır tıklaması detay sayfasını açar. */
function TaramaIslemleri({ tarama, onGuncelle, onSil }: { tarama: Tarama; onGuncelle: (id: string, p: Partial<Tarama>) => void; onSil: (id: string) => void }) {
  const sonraki = SONRAKI_DURUM[tarama.durum]
  const ilerlet = () => {
    if (!sonraki) return
    onGuncelle(tarama.id, durumPatch(tarama, sonraki))
    toast.success(`${tarama.firma}: “${sonraki}”`)
  }
  const sil = () => {
    if (!window.confirm(`${tarama.firma} taraması silinsin mi? Bu işlem geri alınamaz.`)) return
    onSil(tarama.id)
    toast.success('Tarama silindi')
  }
  return (
    <div className="inline-flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      {sonraki && (
        <Button variant="ghost" size="xs" className="px-1.5" aria-label={`${tarama.firma} sonraki duruma geçir`} title={`Sonraki: ${sonraki}`} onClick={ilerlet}>
          <ArrowRightIcon />
        </Button>
      )}
      <Button variant="ghost" size="xs" className="px-1.5 text-muted-foreground hover:text-red-600" aria-label={`${tarama.firma} taramasını sil`} title="Sil" onClick={sil}>
        <Trash2Icon />
      </Button>
    </div>
  )
}

export default function TaramalarPage() {
  const [params] = useSearchParams()
  const firmaParam = params.get('firma') ?? ''
  const yeniAc = params.get('yeni') === '1'
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const guncelle = useTaramaStore((s) => s.guncelle)
  const sil = useTaramaStore((s) => s.sil)
  const firmalar = useFirmaStore((s) => s.kayitlar)

  /* Yeni tarama her zaman planlama sayfasından oluşturulur */
  if (yeniAc) {
    return <Navigate to={`/panel/taramalar/yeni${firmaParam ? `?firma=${encodeURIComponent(firmaParam)}` : ''}`} replace />
  }

  const firmaSecenekleri = firmalar.map((f) => f.unvan)

  /* Filtre ve Excel için alan tanımları */
  const alanlar: FormAlan<Tarama>[] = [
    { key: 'firma', label: 'Firma', tip: 'secim', secenekler: firmaSecenekleri, zorunlu: true, genis: true },
    { key: 'hizmet', label: 'Hizmet', tip: 'secim', secenekler: HIZMET_TURLERI, zorunlu: true, genis: true },
    { key: 'tarih', label: 'Tarih', tip: 'tarih', zorunlu: true },
    { key: 'saat', label: 'Saat', tip: 'metin', placeholder: '09:00', zorunlu: true },
    { key: 'ekip', label: 'Ekip', tip: 'metin', genis: true, placeholder: 'Ekip üyeleri' },
    { key: 'lokasyon', label: 'Lokasyon', tip: 'metin', genis: true, placeholder: 'Bina, kat veya bölüm' },
    { key: 'kisiSayisi', label: 'Planlanan kişi', tip: 'sayi', zorunlu: true },
    { key: 'tamamlanan', label: 'Tamamlanan kişi', tip: 'sayi' },
    { key: 'durum', label: 'Durum', tip: 'secim', secenekler: TARAMA_DURUMLARI, genis: true },
  ]

  const kolonlar: Kolon<Tarama>[] = [
    {
      baslik: 'Firma / hizmet',
      hucre: (t) => (
        <div className="min-w-0">
          <Link
            to={`/panel/taramalar/${t.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block max-w-72 truncate font-medium hover:text-amber-700 hover:underline dark:hover:text-amber-400"
          >
            {t.firma}
          </Link>
          <p className="max-w-72 truncate text-xs text-muted-foreground">
            {t.hizmet} · {t.lokasyon || 'Lokasyon yok'}
          </p>
        </div>
      ),
      sinif: 'min-w-56',
    },
    {
      baslik: 'Tarih',
      siralama: (t) => `${t.tarih}${t.saat}`,
      hucre: (t) => {
        const kalan = gunFarki(BUGUN, t.tarih)
        const bugunmu = kalan === 0 && t.durum !== 'Tamamlandı' && t.durum !== 'İptal'
        return (
          <div className="tabular-nums">
            <p className="font-medium">{tarihAraligi(t)}</p>
            <p className={bugunmu ? 'text-xs font-medium text-amber-700 dark:text-amber-400' : 'text-xs text-muted-foreground'}>
              {saatAraligi(t)}
              {bugunmu ? ' · bugün' : ''}
            </p>
          </div>
        )
      },
    },
    {
      baslik: 'Ekip',
      hucre: (t) => {
        const uyeler = t.ekip ? t.ekip.split(', ').filter(Boolean) : []
        return uyeler.length ? (
          <span className="text-xs" title={t.ekip}>
            <span className="font-medium tabular-nums">{uyeler.length} üye</span>
            <span className="ml-1 text-muted-foreground">· {uyeler[0]}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Atanmadı</span>
        )
      },
    },
    {
      baslik: 'İlerleme',
      siralama: (t) => ilerlemeOrani(t),
      hucre: (t) => (
        <div className="flex min-w-28 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${ilerlemeOrani(t)}%` }} />
          </div>
          <span className="w-16 text-xs tabular-nums text-muted-foreground">
            {t.tamamlanan}/{t.kisiSayisi}
          </span>
        </div>
      ),
    },
    {
      baslik: 'Hazırlık',
      hucre: (t) => {
        const eksik = taramaEksikleri(t)
        if (t.durum === 'Tamamlandı' || t.durum === 'İptal') return <span className="text-xs text-muted-foreground">—</span>
        return eksik.length ? (
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400" title={eksik.join(' · ')}>
            {eksik.length} eksik
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Hazır</span>
        )
      },
    },
    {
      baslik: 'Tutar',
      siralama: (t) => t.genelToplam ?? 0,
      hucre: (t) =>
        t.genelToplam ? (
          <div className="text-right tabular-nums">
            <p className="font-medium">{tl(t.genelToplam)}</p>
            <p className="text-xs text-muted-foreground">kişi başı {tl(t.genelToplam / Math.max(1, t.kisiSayisi))}</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Fiyatsız</span>
        ),
      sinif: 'text-right',
    },
    { baslik: 'Durum', hucre: (t) => <Pill tone={TON[t.durum]}>{t.durum}</Pill> },
    {
      baslik: 'İşlemler',
      sinif: 'text-right',
      hucre: (t) => <TaramaIslemleri tarama={t} onGuncelle={guncelle} onSil={sil} />,
    },
  ]

  /** Seçili taramaların durumunu toplu değiştirir */
  const topluDurum = (ids: string[], durum: TaramaDurum) => {
    let sayi = 0
    ids.forEach((id) => {
      const t = taramalar.find((x) => x.id === id)
      if (!t || t.durum === durum) return
      guncelle(id, durumPatch(t, durum))
      sayi++
    })
    toast.success(sayi ? `${sayi} tarama “${durum}” olarak güncellendi` : 'Seçili taramalarda değişiklik yok')
  }

  return (
    <ModulListesi<Tarama>
      baslik="Taramalar"
      aciklama="Firma bazlı sağlık taramaları, saha planı ve tamamlanma durumu."
      ikon={HeartPulseIcon}
      kayitAdi="tarama"
      yeniEtiket="Yeni tarama"
      yeniHref="/panel/taramalar/yeni"
      ilkArama={params.get('q') ?? firmaParam}
      satirHref={(t) => `/panel/taramalar/${t.id}`}
      topluEylemler={[
        { etiket: 'Devam ediyor yap', onUygula: (ids) => topluDurum(ids, 'Devam ediyor') },
        { etiket: 'Tamamlandı yap', onUygula: (ids) => topluDurum(ids, 'Tamamlandı') },
        { etiket: 'İptal et', onUygula: (ids) => topluDurum(ids, 'İptal') },
      ]}
      ustBolum={<YaklasanSerit taramalar={taramalar} />}
      kayitlar={taramalar}
      alanlar={alanlar}
      kolonlar={kolonlar}
      aramaMetni={(t) => `${t.firma} ${t.hizmet} ${t.lokasyon} ${t.ekip}`}
      durum={{ alan: 'durum', secenekler: TARAMA_DURUMLARI }}
      istatistik={(liste) => {
        const bitenler = liste.filter((t) => t.durum !== 'İptal')
        const planlanan = bitenler.reduce((t, x) => t + x.kisiSayisi, 0)
        const tamam = bitenler.reduce((t, x) => t + x.tamamlanan, 0)
        const haftalik = liste.filter((t) => {
          const f = gunFarki(BUGUN, t.tarih)
          return f >= 0 && f <= 7 && t.durum !== 'İptal'
        }).length
        return [
          { label: 'Toplam tarama', deger: liste.length },
          { label: 'Önümüzdeki 7 gün', deger: haftalik },
          { label: 'Planlandı', deger: liste.filter((t) => t.durum === 'Planlandı').length },
          { label: 'Tamamlandı', deger: liste.filter((t) => t.durum === 'Tamamlandı').length, iyi: true },
          { label: 'Tamamlanma', deger: planlanan ? `%${Math.round((tamam / planlanan) * 100)}` : '—', iyi: true },
        ]
      }}
      yeniVarsayilan={() => ({
        firma: firmaSecenekleri[0] ?? '',
        hizmet: HIZMET_TURLERI[0],
        tarih: gunEkle(1),
        saat: '09:00',
        lokasyon: '',
        ekip: '',
        kisiSayisi: 10,
        tamamlanan: 0,
        durum: 'Planlandı',
      })}
      onEkle={() => undefined}
      onGuncelle={guncelle}
      onSil={sil}
    />
  )
}
