import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeftIcon, Building2Icon, HeartPulseIcon, ReceiptTextIcon, UsersIcon } from 'lucide-react'
import { Pill, type PillTone } from '@saglik/components/pill'
import { cn } from '@saglik/lib/utils'
import { formatKisa } from '@saglik/lib/date'
import { saatAraligi, tarihAraligi } from '@saglik/lib/tarama'
import { teklifKdvDahil, type TaramaDurum, type TeklifDurum } from '@saglik/data/saglik'
import { useFirmaStore, usePersonelKayitStore, useTaramaStore, useTeklifStore } from '@saglik/stores/saglik-stores'

type Sekme = 'calisanlar' | 'taramalar' | 'teklifler'

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

export default function FirmaDetayPage() {
  const { id } = useParams()
  const firma = useFirmaStore((s) => s.kayitlar.find((f) => f.id === id))
  const personeller = usePersonelKayitStore((s) => s.kayitlar)
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const [sekme, setSekme] = useState<Sekme>('calisanlar')

  
  const calisanlar = useMemo(
    () => (firma ? personeller.filter((p) => p.firma === firma.unvan) : []),
    [personeller, firma],
  )
  const firmaTaramalari = useMemo(
    () => (firma ? taramalar.filter((t) => t.firma === firma.unvan).sort((a, b) => b.tarih.localeCompare(a.tarih)) : []),
    [taramalar, firma],
  )
  const firmaTeklifleri = useMemo(
    () => (firma ? teklifler.filter((t) => t.firma === firma.unvan) : []),
    [teklifler, firma],
  )

  if (!firma) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Firma bulunamadı.</p>
        <Link to="/panel/firmalar" className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
          Firmalara dön
        </Link>
      </div>
    )
  }

  const sekmeler: { key: Sekme; label: string; sayi: number; ikon: typeof UsersIcon }[] = [
    { key: 'calisanlar', label: 'Çalışanlar', sayi: calisanlar.length, ikon: UsersIcon },
    { key: 'taramalar', label: 'Taramalar', sayi: firmaTaramalari.length, ikon: HeartPulseIcon },
    { key: 'teklifler', label: 'Teklifler', sayi: firmaTeklifleri.length, ikon: ReceiptTextIcon },
  ]

  return (
    <div className="space-y-4">
      <Link to="/panel/firmalar" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" /> Firmalar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
            <Building2Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{firma.unvan}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {firma.il} · {firma.adres}
            </p>
            <div className="mt-2">
              <Pill tone={firma.durum === 'Aktif' ? 'green' : 'zinc'}>{firma.durum}</Pill>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Yetkili</dt>
          <dd className="font-medium">{firma.yetkili}</dd>
          <dt className="text-muted-foreground">Telefon</dt>
          <dd className="tabular-nums">{firma.telefon}</dd>
          <dt className="text-muted-foreground">E-posta</dt>
          <dd className="truncate">{firma.eposta}</dd>
          <dt className="text-muted-foreground">Vergi</dt>
          <dd className="tabular-nums">
            {firma.vergiDairesi} · {firma.vergiNo}
          </dd>
        </dl>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { to: "teklifler/yeni", etiket: "Teklif oluştur", ikon: ReceiptTextIcon },
          { to: 'taramalar', etiket: 'Tarama planla', ikon: HeartPulseIcon },
          { to: 'personeller', etiket: 'Personel ekle', ikon: UsersIcon },
        ].map((a) => (
          <Link
            key={a.to}
            to={`/panel/${a.to}?firma=${encodeURIComponent(firma.unvan)}${a.to.endsWith("yeni") ? "" : "&yeni=1"}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-medium transition-colors hover:border-amber-500/40 hover:bg-amber-500/5"
          >
            <a.ikon className="size-3.5" />
            {a.etiket}
          </Link>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
        {sekmeler.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSekme(s.key)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
              sekme === s.key ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <s.ikon className="size-4" />
            {s.label}
            <span className="rounded-md bg-background px-1.5 text-xs tabular-nums">{s.sayi}</span>
          </button>
        ))}
      </div>

      {sekme === 'calisanlar' && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {calisanlar.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <Link to={`/panel/personeller?q=${encodeURIComponent(`${p.ad} ${p.soyad}`)}`} className="hover:underline">{p.ad} {p.soyad}</Link>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.departman} · {p.pozisyon}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">{p.telefon}</span>
                <Pill tone={p.durum === 'Aktif' ? 'green' : 'zinc'}>{p.durum}</Pill>
              </li>
            ))}
            {calisanlar.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                Bu firmaya kayıtlı çalışan yok.{' '}
                <Link to="/panel/personeller" className="font-medium text-amber-700 hover:underline dark:text-amber-400">
                  Personeller
                </Link>{' '}
                sayfasından ekleyebilirsiniz.
              </li>
            )}
          </ul>
        </div>
      )}

      {sekme === 'taramalar' && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {firmaTaramalari.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-20 shrink-0 tabular-nums">
                  <p className="text-sm font-medium">{tarihAraligi(t)}</p>
                  <p className="text-xs text-muted-foreground">{saatAraligi(t)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.hizmet}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.lokasyon} · {t.ekip}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t.tamamlanan}/{t.kisiSayisi}
                </span>
                <Pill tone={TARAMA_TON[t.durum]}>{t.durum}</Pill>
              </li>
            ))}
            {firmaTaramalari.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">Bu firma için tarama kaydı yok.</li>
            )}
          </ul>
        </div>
      )}

      {sekme === 'teklifler' && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {firmaTeklifleri.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.hizmet}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t.no} · {formatKisa(t.tarih)} · {t.kisiSayisi} kişi
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">{teklifKdvDahil(t).toLocaleString('tr-TR')} ₺</span>
                <Pill tone={TEKLIF_TON[t.durum]}>{t.durum}</Pill>
              </li>
            ))}
            {firmaTeklifleri.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">Bu firma için teklif yok.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
