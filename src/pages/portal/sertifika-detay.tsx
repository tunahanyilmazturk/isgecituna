import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeftIcon,
  AwardIcon,
  CopyIcon,
  DownloadIcon,
  ExpandIcon,
  ExternalLinkIcon,
  FileBadgeIcon,
  PrinterIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SertifikaOnizleme } from '@/components/sertifika/onizleme'
import { sertifikaPdfAcV2, sertifikaPdfIndirV2, sertifikaPng, sertifikaYazdirV2 } from '@/lib/sertifika-render'
import { sertifikaGuncelDurum, durumRenkSertifika, dogrulamaUrl, basvuruDurumRenk } from '@/data/sertifikalar'
import { ORNEK_VERI, sablonDuzen, veriGetir } from '@/data/sertifika-tasarim'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useBen } from '@/pages/portal/portal-ortak'
import { cn } from '@/lib/utils'

function Bilgi({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{l}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words tabular-nums">{v || '—'}</dd>
    </div>
  )
}

function Kart({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold">{baslik}</h2>
      {children}
    </section>
  )
}

/** Katılımcının kendi sertifikasını önizleme, tüm bilgileri ve indirme seçenekleriyle gösterir */
export default function PortalSertifikaDetay() {
  const { id } = useParams()
  const { pid, p } = useBen()
  const sertifikalar = useSertifikaStore((s) => s.sertifikalar)
  const tasarimlar = useSertifikaStore((s) => s.tasarimlar)
  const basvurular = useSertifikaStore((s) => s.basvurular)
  const egitimler = useEgitimlerStore((s) => s.egitimler)

  const s = sertifikalar.find((x) => x.id === id && x.personelId === pid)
  const [sekiliYuz, setSekiliYuz] = useState<'on' | 'arka'>('on')
  const [zoom, setZoom] = useState(0.9)
  const [tamEkran, setTamEkran] = useState(false)
  const [eskiPng, setEskiPng] = useState<string | null>(null)

  const veri = useMemo(() => (s ? veriGetir(s) : ORNEK_VERI), [s])
  const basvuru = s ? basvurular.find((b) => b.id === s.basvuruId) : undefined

  if (!s) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <FileBadgeIcon className="size-10 text-muted-foreground/40" />
        <p className="text-sm font-medium">Sertifika bulunamadı</p>
        <p className="text-xs text-muted-foreground">Bu belge hesabınıza ait değil ya da kaldırılmış olabilir.</p>
        <Link to="/portal/sertifikalar" className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400">
          Sertifikalarıma dön
        </Link>
      </div>
    )
  }

  const d = sertifikaGuncelDurum(s)
  const iptal = s.durum === 'İptal Edildi'
  const v2 = !!s.tasarim
  const sablon = s.tasarim ? tasarimlar.find((t) => t.id === s.tasarim!.sablonId) : undefined
  const yedek = sablon ?? tasarimlar.find((t) => t.varsayilan && !t.arsiv) ?? tasarimlar[0]
  const yon = s.tasarim?.yon ?? yedek?.yon ?? 'yatay'
  const onYuz = s.tasarim?.elemanlar?.length ? s.tasarim.elemanlar : yedek ? sablonDuzen(yedek, yon, 'on') : []
  const arkaYuz = s.tasarim?.arkaElemanlar?.length ? s.tasarim.arkaElemanlar : yedek ? sablonDuzen(yedek, yon, 'arka') : []
  const zemin = (yuz: 'on' | 'arka') =>
    yuz === 'arka' ? (s.tasarim?.arkaZemin ?? s.tasarim?.zemin ?? yedek?.zemin ?? '#fff') : (s.tasarim?.zemin ?? yedek?.zemin ?? '#fff')

  const eskiOnizleme = () => {
    if (!v2 && !eskiPng) sertifikaPng(s).then(setEskiPng).catch(() => setEskiPng(null))
    return eskiPng
  }

  const belge = (olcek: number) =>
    v2 ? (
      <SertifikaOnizleme elemanlar={sekiliYuz === 'on' ? onYuz : arkaYuz} yon={yon} zemin={zemin(sekiliYuz)} veri={veri} olcek={olcek} iptal={iptal} />
    ) : sekiliYuz === 'on' ? (
      eskiOnizleme() ? (
        <img src={eskiPng!} alt="Sertifika önizlemesi" className="block max-w-full" />
      ) : (
        <div className="flex h-48 w-full items-center justify-center text-sm text-muted-foreground">Belge hazırlanıyor…</div>
      )
    ) : (
      <SertifikaOnizleme elemanlar={arkaYuz} yon={yon} zemin={yedek?.zemin} veri={veri} olcek={olcek} iptal={iptal} />
    )

  const konular = s.egitimKonulari ?? []
  const egitim = egitimler.find((e) => e.id === s.egitimId)
  const sinavPuani = basvuru?.sinavPuani

  const pdfIndir = () =>
    void sertifikaPdfIndirV2(s)
      .then(() => toast.success('Sertifika PDF’i indirildi'))
      .catch((error) => {
        console.error('Sertifika indirilemedi', error)
        toast.error('PDF hazırlanamadı. Lütfen tekrar deneyin.')
      })

  const pdfAc = () =>
    void sertifikaPdfAcV2(s).catch((error) => {
      console.error('Sertifika açılamadı', error)
      toast.error('PDF açılamadı. Tarayıcı açılır pencereleri engelliyorsa izin verip tekrar deneyin.')
    })

  const yazdir = () =>
    void sertifikaYazdirV2(s).catch((error) => {
      console.error('Sertifika yazdırılamadı', error)
      toast.error('Yazdırma önizlemesi açılamadı. Tarayıcı açılır pencereleri engelliyorsa izin verip tekrar deneyin.')
    })

  const baglantiKopyala = () => {
    void navigator.clipboard.writeText(dogrulamaUrl(s.dogrulamaKodu))
    toast.success('Doğrulama bağlantısı kopyalandı')
  }

  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-8">
      <Link to="/portal/sertifikalar" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" /> Sertifikalarım
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            <span className="truncate">{s.egitimAd}</span>
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="tabular-nums">{s.sertifikaNo}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenkSertifika[d])}>{d}</span>
            {s.belgeTuru === 'resmi' && <span className="rounded-full border px-2 py-0.5 text-[11px]">Resmî belge</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={pdfAc}>
            <ExternalLinkIcon /> PDF’i aç
          </Button>
          <Button variant="outline" size="sm" onClick={yazdir}>
            <PrinterIcon /> Yazdır
          </Button>
          <Button size="sm" onClick={pdfIndir}>
            <DownloadIcon /> PDF indir
          </Button>
        </div>
      </div>

      {iptal && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Bu sertifika iptal edilmiştir. Doğrulama sayfasında “İptal Edildi” olarak görünür.
        </div>
      )}
      {!iptal && d === 'Süresi Doldu' && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Bu sertifikanın geçerlilik süresi dolmuştur ({s.gecerlilikTarihi}).
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Önizleme */}
        <section className="flex flex-col rounded-2xl border bg-zinc-100 p-4 dark:bg-zinc-950">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border bg-card p-1 shadow-sm" role="tablist" aria-label="Sertifika yüzü">
              {(['on', 'arka'] as const).map((yuz) => (
                <button
                  key={yuz}
                  type="button"
                  role="tab"
                  aria-selected={sekiliYuz === yuz}
                  onClick={() => setSekiliYuz(yuz)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    sekiliYuz === yuz ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {yuz === 'on' ? 'Ön yüz' : 'Arka yüz'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.4}
                max={1.4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(+e.target.value)}
                className="w-28"
                disabled={!v2}
                aria-label="Önizleme büyütme"
              />
              <span className="w-10 text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setTamEkran(true)}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                title="Tam ekran"
                aria-label="Tam ekran önizleme"
              >
                <ExpandIcon className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto">
            <div className="overflow-hidden rounded-lg shadow-xl ring-1 ring-black/10 dark:ring-white/10">{belge(zoom)}</div>
          </div>
        </section>

        {/* Bilgiler */}
        <div className="flex flex-col gap-4">
          <Kart baslik="Belge">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Bilgi l="Sertifika no" v={s.sertifikaNo} />
              <Bilgi l="Durum" v={d} />
              <Bilgi l="Tamamlanma" v={s.tamamlanmaTarihi} />
              <Bilgi l="Düzenlenme" v={s.duzenlenmeTarihi} />
              <Bilgi l="Geçerlilik" v={s.gecerlilikTarihi ?? 'Süresiz'} />
              <Bilgi l="Belge türü" v={s.belgeTuru === 'resmi' ? 'Resmî belge' : 'Katılım belgesi'} />
            </dl>
          </Kart>

          <Kart baslik="Katılımcı">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Bilgi l="Ad soyad" v={s.personelAd} />
              <Bilgi l="Görev" v={p?.gorev ?? ''} />
              <Bilgi l="Firma" v={s.firmaAd} />
              <Bilgi l="Departman" v={p?.departman ?? ''} />
            </dl>
          </Kart>

          <Kart baslik="Eğitim">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Bilgi l="Eğitim" v={s.egitimAd} />
              <Bilgi l="Sürüm" v={`v${s.egitimSurumNo}`} />
              <Bilgi l="Süre" v={`${s.egitimSure} dk`} />
              <Bilgi l="Kategori" v={s.egitimKategori} />
              {egitim?.hedefler?.length ? (
                <div className="col-span-2">
                  <dt className="text-[11px] text-muted-foreground">Kazanımlar</dt>
                  <dd className="mt-1.5">
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {egitim.hedefler.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
            {konular.length > 0 && (
              <div className="mt-5 border-t pt-4">
                <p className="mb-2 text-[11px] text-muted-foreground">Eğitim konuları</p>
                <ul className="divide-y text-sm">
                  {konular.map((k, i) => (
                    <li key={`${k.baslik}-${i}`} className="flex items-center gap-3 py-2">
                      <span className="w-5 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{k.baslik}</span>
                        <span className="text-[11px] text-muted-foreground">{k.bolum}</span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">{k.sureDakika} dk</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Kart>

          {(basvuru || s.onaylayan) && (
            <Kart baslik="Değerlendirme ve onay">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Bilgi l="Sınav puanı" v={sinavPuani !== undefined ? `${sinavPuani} puan` : ''} />
                <Bilgi l="Deneme" v={basvuru ? `${basvuru.denemeSayisi} deneme` : ''} />
                <Bilgi l="Onaylayan" v={s.onaylayan} />
                <Bilgi l="Onay tarihi" v={s.onayTarihi} />
              </dl>
              {basvuru && (
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                  <span className="text-muted-foreground">Başvuru {basvuru.basvuruTarihi}</span>
                  <span className={cn('rounded-full px-2 py-0.5 font-medium', basvuruDurumRenk[basvuru.durum])}>{basvuru.durum}</span>
                </div>
              )}
            </Kart>
          )}

          <Kart baslik="Doğrulama">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-4 shrink-0 text-emerald-500" />
              Bu belge herkese açık doğrulama sayfasından kontrol edilebilir.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 p-3">
              <AwardIcon className="size-4 shrink-0 text-muted-foreground" />
              <p className="min-w-0 flex-1 truncate font-mono text-xs">{dogrulamaUrl(s.dogrulamaKodu)}</p>
              <Button size="sm" variant="ghost" className="h-7" onClick={baglantiKopyala}>
                <CopyIcon /> Kopyala
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Doğrulama kodu: {s.dogrulamaKodu}</p>
          </Kart>

          {s.aciklama && (
            <Kart baslik="Açıklama">
              <p className="text-sm leading-relaxed text-muted-foreground">{s.aciklama}</p>
            </Kart>
          )}
        </div>
      </div>

      {tamEkran && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/85 p-6" onClick={() => setTamEkran(false)}>
          {belge(yon === 'yatay' ? 1.15 : 0.95)}
        </div>
      )}
    </div>
  )
}
