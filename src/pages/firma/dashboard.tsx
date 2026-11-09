import { Link } from 'react-router'
import {
  AwardIcon,
  CalendarClockIcon,
  GraduationCapIcon,
  HistoryIcon,
  TrendingUpIcon,
  UsersIcon,
  UserPlusIcon,
} from 'lucide-react'
import { StatSerit } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'

import { useEgitimlerStore } from '@/stores/egitimler-store'
import { personelAd } from '@/stores/personeller-store'
import { useFirmaKapsam, takipSatirlari, useYetkili } from './bits'

/** Firma aktivite akışı — çalışan geçmişi + atama olayları + sertifika geçmişi */
function aktiviteler(k: ReturnType<typeof useFirmaKapsam>) {
  const girdi: { tarih: string; metin: string }[] = []
  for (const p of k.calisanlar)
    for (const g of p.islemGecmisi)
      girdi.push({ tarih: g.tarih, metin: `${personelAd(p)} — ${g.islem}` })
  for (const a of k.atamalarim)
    for (const o of a.olaylar)
      girdi.push({ tarih: o.tarih, metin: `Atama ${a.id} — ${o.islem}` })
  for (const s of k.sertifikalarim)
    for (const o of s.gecmis)
      girdi.push({ tarih: o.tarih, metin: `${s.sertifikaNo} — ${o.islem}` })
  return girdi
    .sort((x, y) => y.tarih.localeCompare(x.tarih))
    .slice(0, 8)
}

export default function FirmaDashboard() {
  const yetkili = useYetkili()
  const kapsam = useFirmaKapsam()
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const { firma, calisanlar, atamalarim, sertifikalarim } = kapsam
  const satirlar = takipSatirlari(kapsam)

  const aktif = calisanlar.filter((p) => p.durum === 'Aktif').length
  const devamEden = satirlar.filter((s) =>
    ['Devam Ediyor', 'İçerikler Tamamlandı', 'Sınav Bekleniyor', 'Sınav Başarılı'].includes(s.durum),
  ).length
  // Tamamlanan yalnızca İSG onayı verilmiş kayıtlardır; onay bekleyenler ayrıca sayılır
  const tamamlanan = satirlar.filter((s) => s.durum === 'Tamamlandı').length
  const onayBekleyen = satirlar.filter((s) => s.durum === 'Onay Bekliyor').length
  const baslamayan = satirlar.filter((s) => !s.sonErisim).length
  const basarisiz = satirlar.filter((s) => s.durum === 'Sınav Başarısız').length

  const yakin = atamalarim
    .filter((a) => a.sonTarih >= TODAY && a.durum === 'Aktif')
    .sort((a, b) => a.sonTarih.localeCompare(b.sonTarih))
    .slice(0, 5)

  const ozet = [
    { label: 'Tamamlayan', deger: tamamlanan, renk: 'text-emerald-500' },
    { label: 'Devam eden', deger: devamEden, renk: 'text-amber-500' },
    { label: 'Başlamayan', deger: baslamayan, renk: 'text-zinc-400' },
    { label: 'Başarısız', deger: basarisiz, renk: 'text-red-500' },
  ]
  const toplamKisi = satirlar.length || 1

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{firma?.unvan ?? 'Firma'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hoş geldiniz, {yetkili?.ad} {yetkili?.soyad} · Son güncelleme {TODAY}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/firma/calisanlar"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            <UserPlusIcon className="size-4" /> Çalışan ekle
          </Link>
          <Link
            to="/firma/takip"
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-300"
          >
            <TrendingUpIcon className="size-4" /> Eğitim takibi
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <StatSerit
          ogeler={[
            { label: 'Toplam Çalışan', deger: calisanlar.length, ikon: UsersIcon },
            { label: 'Aktif Çalışan', deger: aktif, ikon: UsersIcon },
            { label: 'Atanmış Eğitim', deger: atamalarim.length, ikon: GraduationCapIcon },
            { label: 'Devam Eden Kayıt', deger: devamEden, ikon: TrendingUpIcon },
            { label: 'Sertifika', deger: sertifikalarim.length, ikon: AwardIcon },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Eğitim durumu özeti */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCapIcon className="size-4 text-amber-500" /> Eğitim durumu özeti
          </h2>
          {satirlar.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Firmaya atanmış eğitim kaydı yok.</p>
          ) : (
            <>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
                {ozet.map((o) => (
                  <div
                    key={o.label}
                    className={cn('h-full', o.renk.replace('text-', 'bg-'))}
                    style={{ width: `${(o.deger / toplamKisi) * 100}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {ozet.map((o) => (
                  <div key={o.label}>
                    <p className={cn('text-lg font-bold tabular-nums', o.renk)}>{o.deger}</p>
                    <p className="text-[11px] text-muted-foreground">{o.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {satirlar.length} eğitim kaydı · {atamalarim.length} atama üzerinden
                {onayBekleyen > 0 && <> · {onayBekleyen} İSG onayı bekliyor</>}
              </p>
            </>
          )}
        </section>

        {/* Yaklaşan son tarihler */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClockIcon className="size-4 text-amber-500" /> Yaklaşan son tarihler
          </h2>
          {yakin.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Yaklaşan son tarih yok.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border/60">
              {yakin.map((a) => {
                const e = egitimler.find((x) => x.id === a.egitimId)
                const kalan = Math.round(
                  (new Date(`${a.sonTarih}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86400000,
                )
                const kisiSayi = a.personelIds.filter((pid) => kapsam.pidSet.has(pid)).length
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e?.baslik ?? a.egitimId}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {kisiSayi} çalışan · son {a.sonTarih}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        kalan <= 7 ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                      )}
                    >
                      {kalan} gün
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Son aktiviteler */}
      <section className="mt-4 rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <HistoryIcon className="size-4 text-muted-foreground" /> Son aktiviteler
        </h2>
        <ul className="mt-2 divide-y divide-border/60">
          {aktiviteler(kapsam).map((a, i) => (
            <li key={i} className="flex gap-3 py-2.5">
              <span className="w-36 shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {a.tarih.slice(0, 16).replace('T', ' ')}
              </span>
              <span className="min-w-0 text-[13px]">{a.metin}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

