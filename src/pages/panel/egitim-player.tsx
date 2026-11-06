import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeftIcon,
  AwardIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FileTextIcon,
  FileVideoIcon,
  ImageIcon,
  ListIcon,
  Maximize2Icon,
  Minimize2Icon,
  PauseIcon,
  PlayIcon,
  PresentationIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  type EgitimSurum,
  type Icerik,
  type IcerikIlerleme,
  type IcerikTur,
  type Sinav,
} from '@/data/egitimler'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { OnSinavEkrani } from '@/components/egitim/on-sinav'
import { usePersonelStore } from '@/stores/personeller-store'
import { useIzin } from '@/lib/izin'
import { useEgitimDosyaUrl } from '@/lib/egitim-assets'
import { atlamaSiniri, enIleriGuncelle, izlenenYuzde } from '@/lib/izleme'
import { hariciVideoKaynakCoz } from '@/lib/egitim-video'

const turIkon: Record<IcerikTur, typeof FileVideoIcon> = {
  video: FileVideoIcon,
  'harici-video': PlayIcon,
  pdf: FileTextIcon,
  slayt: PresentationIcon,
  gorsel: ImageIcon,
  metin: FileTextIcon,
}

type Adim = { tip: 'icerik'; ic: Icerik; bolum: string } | { tip: 'sinav' }
type SunumSlayti = { adimIx: number; ic: Icerik; slaytIx: number; slayt: NonNullable<Icerik['slaytlar']>[number] }

const fmtSn = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const karistir = <T,>(liste: T[]): T[] => {
  const sonuc = [...liste]
  for (let i = sonuc.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[sonuc[i], sonuc[j]] = [sonuc[j], sonuc[i]]
  }
  return sonuc
}

export default function EgitimPlayerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const atamaId = params.get('atama') ?? undefined
  const user = useAuthStore((s) => s.user)
  const onizleIzni = useIzin('egitimler.onizle')
  const atama = usePersonelStore((s) => s.atamalar.find((a) => a.id === atamaId))
  const { egitimler, ilerlemeler, ilerlemeGetir, icerikIlerlemeKaydet, denemeEkle, onSinavKaydet } =
    useEgitimlerStore()
  const egitim = egitimler.find((e) => e.id === id)
  const atamaGecerli = !atamaId || (!!atama && atama.egitimId === id && (user?.tip !== 'portal' || atama.personelIds.includes(user.personelId ?? '')))
  const surumId = atamaId ? (atamaGecerli ? atama?.surumId : undefined) : egitim?.aktifSurumId
  const surum = egitim && surumId ? egitim.surumler.find((sv) => sv.id === surumId) : undefined
  // Portal kullanıcısında ilerleme personel kimliğine bağlanır — hesap sonradan açılsa da kayıt korunur
  const hesapId = user?.tip === 'portal' ? (user.personelId ?? 'anon') : (user?.username ?? 'anon')
  const [tocAcik, setTocAcik] = useState(false)
  // Ön sınav akışı: kayıt sonrası sonuç ekranı gösterilir, "Eğitime başla" ile devam edilir.
  const [onSinavBitirildi, setOnSinavBitirildi] = useState(false)
  const [onSinavDevam, setOnSinavDevam] = useState(false)

  const ilerleme = ilerlemeler.find(
    (i) =>
      i.hesapId === hesapId &&
      i.egitimId === id &&
      i.surumId === surumId &&
      i.atamaId === atamaId,
  )

  const adimlar: Adim[] = useMemo(() => {
    if (!surum) return []
    const l: Adim[] = surum.bolumler.flatMap((b) =>
      b.icerikler.map((ic) => ({ tip: 'icerik' as const, ic, bolum: b.baslik })),
    )
    if (surum.sinav && surum.tamamlama.sinavZorunlu) l.push({ tip: 'sinav' })
    return l
  }, [surum])

  const sunumSlaytlari: SunumSlayti[] = useMemo(
    () => adimlar.flatMap((adim, adimIx) =>
      adim.tip === 'icerik' && adim.ic.tur === 'slayt'
        ? (adim.ic.slaytlar ?? []).map((slayt, slaytIx) => ({ adimIx, ic: adim.ic, slaytIx, slayt }))
        : [],
    ),
    [adimlar],
  )

  // Kaldığı yerden devam: ilk tamamlanmamış adım
  const [adimIx, setAdimIx] = useState(0)
  const [sunumAktif, setSunumAktif] = useState(false)
  const [sunumIx, setSunumIx] = useState(0)
  const ilerlemeBaslangicId = useRef<string | null>(null)

  useEffect(() => {
    if (egitim && surum && !ilerleme) ilerlemeGetir(hesapId, egitim.id, atamaId, surum.id)
  }, [egitim, surum, ilerleme, hesapId, atamaId, ilerlemeGetir])

  useEffect(() => {
    if (!ilerleme || ilerlemeBaslangicId.current === ilerleme.id) return
    ilerlemeBaslangicId.current = ilerleme.id
    const ix = adimlar.findIndex((a) => a.tip === 'icerik' && a.ic.zorunlu && !ilerleme.icerikler[a.ic.id]?.tamamlandi)
    setAdimIx(ix >= 0 ? ix : 0)
  }, [ilerleme, adimlar])

  if (!egitim || !surum || !atamaGecerli || (user?.tip === 'admin' && !onizleIzni)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{!atamaGecerli ? 'Bu eğitim ataması bulunamadı veya hesabınıza ait değil.' : user?.tip === 'admin' && !onizleIzni ? 'Eğitim önizleme izniniz yok.' : 'Eğitim bulunamadı'}</p>
        <Button variant="outline" onClick={() => navigate('/panel/egitimler')}>
          <ArrowLeftIcon /> Eğitimlere dön
        </Button>
      </div>
    )
  }

  // Portal katılımcısı, eğitimden önce ön sınav almadıysa önce sınava girer.
  const onSinavGerekli = user?.tip === 'portal' && !!surum.onSinav && !onSinavDevam && (!ilerleme?.onSinav || onSinavBitirildi)
  if (onSinavGerekli && surum.onSinav) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 border-b px-4 py-2.5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/egitimler')}>
            <ArrowLeftIcon />
          </Button>
          <h1 className="truncate text-sm font-semibold">{egitim.baslik}</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <OnSinavEkrani
            egitimBaslik={egitim.baslik}
            sinav={surum.onSinav}
            onKaydet={(kayit) => {
              onSinavKaydet(hesapId, egitim.id, kayit, atamaId, surum.id)
              setOnSinavBitirildi(true)
            }}
            onDevam={() => setOnSinavDevam(true)}
          />
        </div>
      </div>
    )
  }

  const adim = adimlar[adimIx]
  const slaytIcerigi = adim?.tip === 'icerik' && adim.ic.tur === 'slayt'
  const zorunlular = adimlar.filter((a) => a.tip === 'icerik' && a.ic.zorunlu) as Extract<Adim, { tip: 'icerik' }>[]
  const tamamSayisi = zorunlular.filter((a) => ilerleme?.icerikler[a.ic.id]?.tamamlandi).length
  const genelYuzde = zorunlular.length ? Math.round((tamamSayisi / zorunlular.length) * 100) : 100

  const icerikTamam = (ic: Icerik) => !!ilerleme?.icerikler[ic.id]?.tamamlandi

  const kaydet = (icerikId: string, patch: Parameters<typeof icerikIlerlemeKaydet>[3]) =>
    icerikIlerlemeKaydet(hesapId, egitim.id, icerikId, patch, atamaId, surum.id)

  const adimaGit = (hedefIx: number) => {
    const ilkEksik = adimlar.findIndex((a) => a.tip === 'icerik' && a.ic.zorunlu && !ilerleme?.icerikler[a.ic.id]?.tamamlandi)
    const sinavaGeciyor = adimlar[hedefIx]?.tip === 'sinav'
    // Katılımcılar dersleri inceleme amacıyla ileri alabilir; yalnızca sınav,
    // zorunlu içeriklerin tamamlanmasına kadar kilitli kalır. Yönetici önizlemesi serbesttir.
    if (user?.tip === 'portal' && sinavaGeciyor && ilkEksik >= 0) {
      toast.error('Sınava geçmeden önce zorunlu içerikleri tamamlayın')
      setAdimIx(ilkEksik)
      return
    }
    setAdimIx(hedefIx)
  }
  const ileri = () => adimaGit(Math.min(adimlar.length - 1, adimIx + 1))
  const geri = () => setAdimIx((i) => Math.max(0, i - 1))

  const tamamlaVeIlerle = (ic: Icerik) => {
    kaydet(ic.id, { tamamlandi: true, tamamlanmaTarihi: new Date().toISOString() })
    toast.success(`"${ic.baslik}" tamamlandı`)
    setAdimIx((ix) => Math.min(adimlar.length - 1, ix + 1))
  }

  const sunumuBaslat = (baslangicAdimi: number) => {
    const ilk = sunumSlaytlari.findIndex((s) => s.adimIx === baslangicAdimi)
    setSunumIx(ilk >= 0 ? ilk : 0)
    setSunumAktif(true)
  }

  return (
    <div className={cn(
      'fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-background md:relative md:inset-auto md:z-auto md:min-h-0',
      slaytIcerigi
        ? user?.tip === 'portal'
          ? 'md:h-[calc(100dvh-9.5rem)] md:flex-none lg:h-[calc(100dvh-3.5rem)]'
          : 'md:h-[calc(100dvh-10.75rem)] md:flex-none lg:h-[calc(100dvh-6rem)]'
        : 'md:h-auto md:flex-1',
      sunumAktif && 'md:h-[calc(100dvh-3.5rem)] md:flex-none md:-mx-5 md:-mt-5 md:-mb-24 lg:-mb-5',
    )}>
      {/* Üst bar */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center gap-2 border-b border-border/70 bg-background/80 px-2.5 pt-[calc(.5rem+env(safe-area-inset-top))] pb-2 shadow-sm backdrop-blur-xl sm:gap-3 sm:px-4 md:relative md:inset-auto md:z-auto md:border-border md:bg-background md:py-2.5 md:shadow-none md:backdrop-blur-none">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-full md:size-8 md:rounded-md"
          aria-label="Eğitimden çık"
          onClick={() => navigate(user?.tip === 'portal' ? '/portal/egitimler' : '/panel/egitimler')}
        >
          <XIcon className="size-5 md:hidden" />
          <ArrowLeftIcon className="hidden md:block" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold">{egitim.baslik}</h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              v{surum.no}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-muted sm:w-40">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${genelYuzde}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums sm:text-[11px]">
              %{genelYuzde} · {tamamSayisi}/{zorunlular.length} içerik
            </span>
          </div>
        </div>
        {ilerleme && (
          <span
            className={cn(
              'hidden rounded-full px-2.5 py-1 text-xs font-medium sm:block',
              ilerleme.durum === 'Tamamlandı'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {ilerleme.durum}
          </span>
        )}
        <Button variant="outline" size="icon" className={cn('size-9 shrink-0 rounded-full bg-background/60 lg:hidden md:size-8 md:rounded-md', sunumAktif && 'hidden')} aria-label="Eğitim içeriğini aç" onClick={() => setTocAcik((t) => !t)}>
          <ListIcon />
        </Button>
      </div>

      <div className={cn('flex min-h-0 flex-1 pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0', sunumAktif ? 'pb-0' : 'pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0')}>
        {/* İçerik alanı */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className={cn('min-h-0 flex-1', sunumAktif || slaytIcerigi ? 'overflow-hidden' : 'overflow-y-auto')}>
            {sunumAktif ? (
              <KursSlaytSunumu
                key={`${egitim.id}-${surum.id}-${sunumIx}`}
                slaytlar={sunumSlaytlari}
                baslangicIx={sunumIx}
                onCikis={(hedefAdim) => {
                  setAdimIx(hedefAdim)
                  setSunumAktif(false)
                }}
                onSlaytTamamla={(s) => {
                  const icIlerleme = ilerleme?.icerikler[s.ic.id]
                  const gorulen = new Set(icIlerleme?.gorulenSayfalar ?? [])
                  gorulen.add(s.slaytIx)
                  const tumuGoruldu = gorulen.size >= (s.ic.slaytlar?.length ?? 0)
                  kaydet(s.ic.id, {
                    sonSayfa: s.slaytIx,
                    gorulenSayfalar: [...gorulen],
                    tamamlandi: tumuGoruldu,
                    ...(tumuGoruldu ? { tamamlanmaTarihi: new Date().toISOString() } : {}),
                  })
                }}
                onTamamlandi={() => {
                  const sonSlaytAdimi = sunumSlaytlari[sunumSlaytlari.length - 1]?.adimIx ?? adimIx
                  setSunumAktif(false)
                  setAdimIx(Math.min(adimlar.length - 1, sonSlaytAdimi + 1))
                }}
              />
            ) : adim?.tip === 'icerik' ? (
              <IcerikOynatici
                key={adim.ic.id}
                ic={adim.ic}
                surum={surum}
                ilerleme={ilerleme?.icerikler[adim.ic.id]}
                kaydet={kaydet}
                tamamlaVeIlerle={tamamlaVeIlerle}
                sunumBaslat={egitim.id === 'EGT-YUK' && sunumSlaytlari.length > 1 ? () => sunumuBaslat(adimIx) : undefined}
              />
            ) : (
              <SinavEkran key={surum.sinav!.id} sinav={surum.sinav!} egitim={egitim.id} hesapId={hesapId} denemeEkle={(h, e, d) => denemeEkle(h, e, d, atamaId, surum.id)} ilerleme={ilerleme} />
            )}
          </div>
          {/* Alt kontroller */}
          {!sunumAktif && <div className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2 border-t border-border/70 bg-background/80 px-2.5 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgba(0,0,0,.45)] backdrop-blur-xl sm:px-4 md:relative md:inset-auto md:z-auto md:border-border md:bg-background md:py-2.5 md:shadow-none md:backdrop-blur-none">
            <Button variant="outline" size="sm" className="shrink-0 px-2.5 sm:px-3" disabled={adimIx === 0} onClick={geri}>
              <ChevronLeftIcon className="size-4" /><span>Önceki</span>
            </Button>
            <p className="hidden min-w-0 truncate text-xs text-muted-foreground sm:block">
              {adim?.tip === 'icerik' ? `${adim.bolum} · ${adim.ic.baslik}` : 'Sınav'}
            </p>
            <Button variant="outline" size="sm" className="shrink-0 px-2.5 sm:px-3" disabled={adimIx >= adimlar.length - 1} onClick={ileri}>
              <span>Sonraki</span><ChevronRightIcon className="size-4" />
            </Button>
          </div>}
        </div>

        {/* TOC */}
        <aside
          className={cn(
            'order-first w-72 shrink-0 overflow-y-auto border-r bg-card/50 xl:w-80',
            sunumAktif ? 'hidden' : tocAcik ? 'absolute inset-y-0 left-0 z-30 block w-[min(88vw,22rem)] border-r shadow-2xl' : 'hidden lg:block',
          )}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Eğitim içeriği</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Dersler ve sınav</p>
            </div>
            <button type="button" aria-label="Kapat" onClick={() => setTocAcik(false)} className="lg:hidden text-muted-foreground">
              ✕
            </button>
          </div>
          <div className="border-b px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="font-medium">Genel ilerleme</span>
              <span className="tabular-nums text-muted-foreground">{tamamSayisi}/{zorunlular.length}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${genelYuzde}%` }} />
            </div>
          </div>
          {surum.bolumler.map((b) => (
            <div key={b.id}>
              <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-1.5">
                <p className="min-w-0 truncate border-l-2 border-amber-500 pl-2 text-[11px] font-semibold text-foreground/80">{b.baslik}</p>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{b.icerikler.filter(icerikTamam).length}/{b.icerikler.length}</span>
              </div>
              {b.icerikler.map((ic) => {
                const ix = adimlar.findIndex((a) => a.tip === 'icerik' && a.ic.id === ic.id)
                const aktif = adim?.tip === 'icerik' && adim.ic.id === ic.id
                const I = turIkon[ic.tur]
                return (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => {
                      adimaGit(ix)
                      setTocAcik(false)
                    }}
                    className={cn(
                      'mx-2 my-0.5 flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-lg border-l-2 px-2.5 py-2 text-left text-sm transition-colors',
                      aktif ? 'border-amber-500 bg-amber-500/10 text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/60',
                    )}
                  >
                    {icerikTamam(ic) ? (
                      <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <I className="size-4 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{ic.baslik}</span>
                    <span className="shrink-0 rounded-md bg-muted/70 px-1.5 py-0.5 text-[10px] tabular-nums">{ic.sureDakika}dk</span>
                  </button>
                )
              })}
            </div>
          ))}
          {surum.sinav && surum.tamamlama.sinavZorunlu && (
            <button
              type="button"
              onClick={() => adimaGit(adimlar.length - 1)}
              className={cn(
                'flex w-full items-center gap-2.5 border-t px-4 py-3 text-left text-sm transition-colors',
                adim?.tip === 'sinav' ? 'bg-amber-500/10' : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              {ilerleme?.denemeler.some((d) => d.gecti) ? (
                <CheckCircle2Icon className="size-4 text-emerald-500" />
              ) : (
                <ClipboardListIcon className="size-4" />
              )}
              <span className="flex-1">{surum.sinav.baslik}</span>
              <span className="text-[10px]">{surum.sinav.sorular.length} soru</span>
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}

/* =========================== İçerik oynatıcı =========================== */

function IcerikOynatici({
  ic,
  surum,
  ilerleme,
  kaydet,
  tamamlaVeIlerle,
  sunumBaslat,
}: {
  ic: Icerik
  surum: EgitimSurum
  ilerleme?: IcerikIlerleme
  kaydet: (id: string, p: Record<string, unknown>) => void
  tamamlaVeIlerle: (ic: Icerik) => void
  sunumBaslat?: () => void
}) {
  const hariciKaynak = ic.tur === 'harici-video' ? hariciVideoKaynakCoz(ic.url ?? '') : null
  if (hariciKaynak?.tur === 'yerlesik')
    return <HariciVideoOynatici ic={ic} kaynak={hariciKaynak} ilerleme={ilerleme} tamamlaVeIlerle={tamamlaVeIlerle} />
  if (ic.tur === 'video' || ic.tur === 'harici-video')
    return <VideoOynatici ic={ic} hariciKaynak={hariciKaynak?.tur === 'dosya' ? hariciKaynak.url : undefined} minYuzde={surum.tamamlama.videoMinYuzde} ilerleme={ilerleme} kaydet={kaydet} tamamlaVeIlerle={tamamlaVeIlerle} />
  if (ic.tur === 'pdf') return <SayfaOynatici ic={ic} mod="pdf" ilerleme={ilerleme} kaydet={kaydet} tamamlaVeIlerle={tamamlaVeIlerle} />
  if (ic.tur === 'slayt') return <SayfaOynatici ic={ic} mod="slayt" ilerleme={ilerleme} kaydet={kaydet} tamamlaVeIlerle={tamamlaVeIlerle} sunumBaslat={sunumBaslat} />
  if (ic.tur === 'gorsel') return <GorselOynatici ic={ic} tamamlaVeIlerle={tamamlaVeIlerle} />
  return <MetinOynatici ic={ic} tamamlaVeIlerle={tamamlaVeIlerle} />
}

/* --------------------------------- Video -------------------------------- */

/**
 * Oynatıcıda sekmenin görünür olduğu süreyi (sn) sayar. Sekme arka plandayken sayılmaz.
 * Kendi kendine tamamlanan (harici video, metin) içeriklerde asgari bekleme süresi için kullanılır.
 */
function useIzlemeSayaci(gerekliSn: number) {
  const [sure, setSure] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setSure((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [])
  return { sure, yeterli: sure >= gerekliSn }
}

function HariciVideoOynatici({
  ic,
  kaynak,
  ilerleme,
  tamamlaVeIlerle,
}: {
  ic: Icerik
  kaynak: Extract<NonNullable<ReturnType<typeof hariciVideoKaynakCoz>>, { tur: 'yerlesik' }>
  ilerleme?: IcerikIlerleme
  tamamlaVeIlerle: (ic: Icerik) => void
}) {
  const tamamlandi = !!ilerleme?.tamamlandi
  // Harici oynatıcıda izleme ölçülemez: içeriğin süresinin en az %80'i sayfada geçmeden tamamlanamaz
  const gerekliSn = Math.round(ic.sureDakika * 60 * 0.8)
  const { sure, yeterli } = useIzlemeSayaci(gerekliSn)
  const kutuRef = useRef<HTMLDivElement>(null)
  const [tamEkran, setTamEkran] = useState(false)

  const tamEkranToggle = async () => {
    if (!document.fullscreenElement) await kutuRef.current?.requestFullscreen().catch(() => {})
    else await document.exitFullscreen().catch(() => {})
  }

  useEffect(() => {
    const guncelle = () => setTamEkran(document.fullscreenElement === kutuRef.current)
    document.addEventListener('fullscreenchange', guncelle)
    return () => document.removeEventListener('fullscreenchange', guncelle)
  }, [])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col p-3 sm:p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500"><PlayIcon className="size-5" /></div>
          <div className="min-w-0"><h2 className="truncate text-sm font-semibold sm:text-base">{ic.baslik}</h2><p className="text-xs text-muted-foreground">{kaynak.saglayici} video · Harici oynatıcı</p></div>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', tamamlandi ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
          {tamamlandi ? 'Tamamlandı' : 'İzlenmedi'}
        </span>
      </div>

      <div ref={kutuRef} className={cn('relative aspect-video min-h-[220px] w-full max-h-[58vh] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-xl shadow-black/20', tamEkran && 'aspect-auto h-dvh max-h-none w-screen rounded-none border-0')}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.11),transparent_38%)]" />
        <iframe
          src={kaynak.url}
          title={`${ic.baslik} — ${kaynak.saglayici}`}
          className="absolute inset-0 h-full w-full"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <button
          type="button"
          aria-label={tamEkran ? 'Tam ekrandan çık' : 'Videoyu tam ekranda izle'}
          title={tamEkran ? 'Tam ekrandan çık' : 'Tam ekranda izle'}
          onClick={() => void tamEkranToggle()}
          className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-amber-500 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {tamEkran ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Ders ilerlemesi</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ic.aciklama || 'Videoyu harici oynatıcıdan izleyin. İzlemeyi bitirdiğinizde tamamlandı olarak işaretleyin.'}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">Harici oynatıcı izleme oranını paylaşmadığı için tamamlanma, sayfada geçen süreye göre sizin onayınızla kaydedilir.</p>
        </div>
        {tamamlandi ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2Icon className="size-4" /> Tamamlandı</span>
        ) : (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Button size="sm" disabled={!yeterli} onClick={() => tamamlaVeIlerle(ic)}><CheckCircle2Icon /> İzledim ve tamamla</Button>
            {!yeterli && <span className="text-[11px] text-muted-foreground tabular-nums">Tamamlamak için {Math.ceil((gerekliSn - sure) / 60)} dk daha izleyin</span>}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground/60">Bu içerik {kaynak.saglayici} üzerinden güvenli gömülü oynatıcıda açılır.</p>
    </div>
  )
}

function VideoOynatici({
  ic,
  hariciKaynak,
  minYuzde,
  ilerleme: il,
  kaydet,
  tamamlaVeIlerle,
}: {
  ic: Icerik
  hariciKaynak?: string
  minYuzde: number
  ilerleme?: IcerikIlerleme
  kaydet: (id: string, p: Record<string, unknown>) => void
  tamamlaVeIlerle: (ic: Icerik) => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const kutuRef = useRef<HTMLDivElement>(null)
  const [oynuyor, setOynuyor] = useState(false)
  const [sn, setSn] = useState(il?.izlenenSn ?? 0)
  const [toplam, setToplam] = useState(il?.toplamSn ?? 0)
  const [hiz, setHiz] = useState(1)
  const [sessiz, setSessiz] = useState(false)
  const [tamEkran, setTamEkran] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(false)
  const sonKayit = useRef(0)
  // Yüzde ve tamamlanma yalnızca en uzak izlenen nokta ile hesaplanır; atlama bunu ilerletmez
  const enIleriRef = useRef(il?.izlenenSn ?? 0)
  const [enIleri, setEnIleri] = useState(il?.izlenenSn ?? 0)
  const sonZaman = useRef(0)

  const kaynak = ic.dosya?.url ?? hariciKaynak ?? (ic.tur === 'harici-video' ? undefined : ic.url)
  const src = useEgitimDosyaUrl(kaynak)
  const yuzde = izlenenYuzde(enIleri, toplam)
  const tamam = il?.tamamlandi || yuzde >= minYuzde

  const zamanGuncelle = () => {
    const v = ref.current
    if (!v) return
    setSn(v.currentTime)
    setToplam(v.duration || 0)
    const onceki = sonZaman.current
    sonZaman.current = v.currentTime
    const yeni = enIleriGuncelle(enIleriRef.current, onceki, v.currentTime, v.seeking)
    if (yeni !== enIleriRef.current) {
      enIleriRef.current = yeni
      setEnIleri(yeni)
    }
    // İlerleme ~4 saniyede bir kaydedilir — backend'de periyodik sync
    if (Math.abs(enIleriRef.current - sonKayit.current) > 4) {
      sonKayit.current = enIleriRef.current
      const sure = v.duration || 0
      kaydet(ic.id, {
        izlenenSn: Math.floor(enIleriRef.current),
        toplamSn: Math.floor(sure),
        tamamlandi: !!il?.tamamlandi || izlenenYuzde(enIleriRef.current, sure) >= minYuzde,
      })
    }
  }

  // Konum, izlenen en uzak noktanın ötesine atlanamaz (kaydırıcı, ok tuşları, sar düğmeleri, native kontrol)
  const atlamayiSinirla = (v: HTMLVideoElement) => {
    const sinir = atlamaSiniri(v.currentTime, enIleriRef.current)
    if (sinir !== v.currentTime) v.currentTime = sinir
    sonZaman.current = v.currentTime
  }

  const sar = (d: number) => {
    if (ref.current) ref.current.currentTime = Math.max(0, ref.current.currentTime + d)
  }

  const oynatDuraklat = () => {
    const video = ref.current
    if (!video) return
    if (video.paused) void video.play().catch(() => setHata(true))
    else video.pause()
  }

  const tamEkranToggle = async () => {
    if (!document.fullscreenElement) await kutuRef.current?.requestFullscreen().catch(() => {})
    else await document.exitFullscreen()
  }

  useEffect(() => {
    const f = () => setTamEkran(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])

  useEffect(() => {
    const tus = (event: KeyboardEvent) => {
      const hedef = event.target
      if (hedef instanceof HTMLElement && (hedef.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(hedef.tagName))) return
      if (event.code === 'Space') { event.preventDefault(); oynatDuraklat() }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); sar(-10) }
      else if (event.key === 'ArrowRight') { event.preventDefault(); sar(10) }
      else if (event.key.toLowerCase() === 'm') { setSessiz((onceki) => { if (ref.current) ref.current.muted = !onceki; return !onceki }) }
      else if (event.key.toLowerCase() === 'f') void tamEkranToggle()
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  })

  if (!src) {
    return <Merkez icon={FileVideoIcon} mesaj={kaynak ? 'Video kaynağı açılıyor…' : 'Video kaynağı tanımlı değil — editörden dosya veya bağlantı ekleyin'} />
  }

  return (
    <div ref={kutuRef} className={cn('mx-auto flex min-h-full w-full max-w-6xl flex-col p-3 sm:p-4', tamEkran && 'max-w-none bg-background')}>
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500"><FileVideoIcon className="size-5" /></div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold sm:text-base">{ic.baslik}</h2>
            <p className="text-xs text-muted-foreground">Video dersi · {fmtSn(toplam || ic.sureDakika * 60)}</p>
          </div>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', tamam ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
          {tamam ? 'Tamamlandı' : `%${yuzde} izlendi`}
        </span>
      </div>

      <div className="relative aspect-video min-h-[220px] w-full max-h-[58vh] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-xl shadow-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.11),transparent_38%)]" />
        {hata ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400"><FileVideoIcon className="size-6" /></div>
            <div><p className="text-sm font-medium">Video açılamadı</p><p className="mt-1 text-xs text-white/60">Bağlantıyı kontrol edip yeniden deneyin.</p></div>
            <Button variant="outline" size="sm" onClick={() => { setHata(false); setYukleniyor(true); ref.current?.load() }}>
              <RotateCwIcon /> Yeniden dene
            </Button>
          </div>
        ) : (
          <video
            ref={ref}
            src={src}
            className="absolute inset-0 h-full w-full object-contain"
            onTimeUpdate={zamanGuncelle}
            onPlay={() => setOynuyor(true)}
            onPause={() => setOynuyor(false)}
            onLoadedMetadata={(e) => {
              setToplam(e.currentTarget.duration)
              setYukleniyor(false)
              // Kaldığı yerden devam (en uzak izlenen noktadan)
              if (il?.izlenenSn && il.izlenenSn < e.currentTarget.duration - 5) {
                e.currentTarget.currentTime = il.izlenenSn
                sonZaman.current = il.izlenenSn
              }
            }}
            onSeeking={(e) => atlamayiSinirla(e.currentTarget)}
            onLoadedData={() => setYukleniyor(false)}
            onEnded={() => {
              const sure = ref.current?.duration ?? 0
              enIleriRef.current = sure
              setEnIleri(sure)
              kaydet(ic.id, { izlenenSn: Math.floor(sure), tamamlandi: true, tamamlanmaTarihi: new Date().toISOString() })
              setOynuyor(false)
            }}
            onError={() => { setYukleniyor(false); setHata(true) }}
            onClick={oynatDuraklat}
          />
        )}
        {yukleniyor && !hata && <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-xs text-white/70"><span className="mr-2 size-4 animate-spin rounded-full border-2 border-white/25 border-t-amber-400" /> Video hazırlanıyor…</div>}
        {!hata && !yukleniyor && !oynuyor && <button type="button" onClick={oynatDuraklat} aria-label="Videoyu oynat" className="absolute top-1/2 left-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-amber-500 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"><PlayIcon className="ml-1 size-7 fill-current" /></button>}
        {!hata && <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/90 to-transparent px-3 pt-12 pb-3 sm:px-5 sm:pb-4">
          <input type="range" min={0} max={Math.max(enIleri, 0.1)} step={0.1} value={sn} onChange={(e) => { const value = atlamaSiniri(Number(e.target.value), enIleriRef.current); if (ref.current) ref.current.currentTime = value; setSn(value) }} className="mb-3 h-1.5 w-full cursor-pointer accent-amber-400" aria-label="Video konumu" aria-valuetext={`${fmtSn(sn)} / ${fmtSn(toplam)} · izlenen ${fmtSn(enIleri)}`} />
          <div className="flex items-center gap-1.5 text-white sm:gap-2">
            <button type="button" aria-label="10 saniye geri sar" onClick={() => sar(-10)} className="flex size-9 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400"><RotateCcwIcon className="size-4" /><span className="sr-only">10 saniye geri</span></button>
            <button type="button" aria-label={oynuyor ? 'Videoyu duraklat' : 'Videoyu oynat'} onClick={oynatDuraklat} className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-zinc-950 transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{oynuyor ? <PauseIcon className="size-5 fill-current" /> : <PlayIcon className="ml-0.5 size-5 fill-current" />}</button>
            <button type="button" aria-label="10 saniye ileri sar" onClick={() => sar(10)} className="flex size-9 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400"><RotateCwIcon className="size-4" /><span className="sr-only">10 saniye ileri</span></button>
            <span className="ml-1 min-w-[88px] text-xs tabular-nums text-white/85">{fmtSn(sn)} <span className="text-white/40">/</span> {fmtSn(toplam)}</span>
            <span className="hidden text-[11px] text-white/55 sm:inline">· %{yuzde} izlendi</span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <label className="hidden items-center gap-1.5 text-[11px] text-white/60 sm:flex"><span>Hız</span><select value={hiz} onChange={(e) => { const h = Number(e.target.value); setHiz(h); if (ref.current) ref.current.playbackRate = h }} className="h-8 rounded-lg border border-white/15 bg-zinc-900 px-2 text-xs text-white outline-none focus-visible:border-amber-400" aria-label="Oynatma hızı">{[0.5, 0.75, 1, 1.25, 1.5, 2].map((h) => <option key={h} value={h}>{h}×</option>)}</select></label>
              <button type="button" aria-label={sessiz ? 'Sesi aç' : 'Sesi kapat'} onClick={() => setSessiz((s) => { if (ref.current) ref.current.muted = !s; return !s })} className="flex size-9 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400">{sessiz ? <VolumeXIcon className="size-4" /> : <Volume2Icon className="size-4" />}</button>
              <button type="button" aria-label={tamEkran ? 'Tam ekrandan çık' : 'Tam ekrana geç'} onClick={() => void tamEkranToggle()} className="flex size-9 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400">{tamEkran ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}</button>
            </div>
          </div>
        </div>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h3 className="truncate text-sm font-semibold">Ders ilerlemesi</h3><span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">En az %{minYuzde} izleme</span></div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ic.aciklama || 'Videoyu izleyin; tamamlanma ölçütüne ulaştığınızda sonraki içeriğe geçebilirsiniz.'}</p>
        </div>
        {tamam ? (
          <Button size="sm" className="shrink-0" onClick={() => tamamlaVeIlerle(ic)}>
            <CheckCircle2Icon /> Tamamla ve ilerle
          </Button>
        ) : (
          <span className="shrink-0 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground tabular-nums">
            %{yuzde} / %{minYuzde} gerekli
          </span>
        )}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground/60">Kısayollar: Space oynat/duraklat · ←/→ 10 sn · M ses · F tam ekran</p>
    </div>
  )
}

/* ------------------------------ Sayfa oynatıcı ---------------------------- */

function SayfaOynatici({
  ic,
  mod,
  ilerleme: il,
  kaydet,
  tamamlaVeIlerle,
  sunumBaslat,
}: {
  ic: Icerik
  mod: 'pdf' | 'slayt'
  ilerleme?: IcerikIlerleme
  kaydet: (id: string, p: Record<string, unknown>) => void
  tamamlaVeIlerle: (ic: Icerik) => void
  sunumBaslat?: () => void
}) {
  const kutuRef = useRef<HTMLDivElement>(null)

  const sayfalar = mod === 'pdf' ? ic.sayfalar ?? [] : []
  const slaytlar = mod === 'slayt' ? ic.slaytlar ?? [] : []
  const toplam = mod === 'pdf' ? sayfalar.length : slaytlar.length

  const [sayfa, setSayfa] = useState(() => Math.min(il?.sonSayfa ?? 0, Math.max(0, toplam - 1)))
  const [zoom, setZoom] = useState(1)
  const [tamEkran, setTamEkran] = useState(false)
  const [gorulen, setGorulen] = useState<Set<number>>(
    () => new Set(il?.gorulenSayfalar ?? [0]),
  )

  // Kayıtlı ilerleme değişince yerel sayfa durumu render sırasında yeniden eşitlenir (effect'siz).
  const [onceki, setOnceki] = useState({ sonSayfa: il?.sonSayfa, gorulenSayfalar: il?.gorulenSayfalar, toplam })
  if (onceki.sonSayfa !== il?.sonSayfa || onceki.gorulenSayfalar !== il?.gorulenSayfalar || onceki.toplam !== toplam) {
    setOnceki({ sonSayfa: il?.sonSayfa, gorulenSayfalar: il?.gorulenSayfalar, toplam })
    setSayfa(Math.min(il?.sonSayfa ?? 0, Math.max(0, toplam - 1)))
    setGorulen(new Set(il?.gorulenSayfalar ?? [0]))
  }

  const git = (s: number) => {
    const y = Math.max(0, Math.min(toplam - 1, s))
    setSayfa(y)
    setGorulen((g) => {
      const yeni = new Set(g).add(y)
      kaydet(ic.id, {
        sonSayfa: y,
        gorulenSayfalar: [...yeni],
        tamamlandi: yeni.size >= toplam,
        ...(yeni.size >= toplam ? { tamamlanmaTarihi: new Date().toISOString() } : {}),
      })
      return yeni
    })
  }

  // Gerçek dosya (kullanıcı yüklemesi) varsa native gösterici kullanılır
  const gercekDosya = !!ic.dosya?.url && !sayfalar.length && !slaytlar.length
  const dosyaUrl = useEgitimDosyaUrl(ic.dosya?.url)

  const tamEkranToggle = async () => {
    if (!document.fullscreenElement) await kutuRef.current?.requestFullscreen().catch(() => {})
    else await document.exitFullscreen()
  }
  useEffect(() => {
    const f = () => setTamEkran(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])

  if (gercekDosya) {
    return (
      <div className="mx-auto flex h-full max-w-5xl flex-col p-4 sm:p-6">
        <div ref={kutuRef} className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-muted/30">
          {mod === 'pdf' ? (
            dosyaUrl ? <iframe src={dosyaUrl} title={ic.baslik} className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Dosya açılıyor…</div>
          ) : (
            <Merkez icon={PresentationIcon} mesaj="Yüklenen sunumun slayt önizlemesi sunucuda oluşturulacak — dosya güvenli biçimde saklandı" />
          )}
        </div>
        <SayfaAlt ic={ic} tamam={il?.tamamlandi} tamamlaVeIlerle={tamamlaVeIlerle} notUst={`${mod === 'pdf' ? 'PDF görüntüleyici' : 'Sunum'} · tamamlandı olarak işaretleyin`} />
      </div>
    )
  }

  if (toplam === 0) return <Merkez icon={FileTextIcon} mesaj="İçerik sayfası bulunamadı" />

  const aktif = mod === 'pdf' ? sayfalar[sayfa] : slaytlar[sayfa]
  const notlar = mod === 'slayt' ? (aktif as { notlar: string[] }).notlar : []
  const notKarakterSayisi = notlar.reduce((toplam, not) => toplam + not.length, 0)
  const mobilNotBoyutu = notKarakterSayisi > 760 ? 'text-[0.68em]' : notKarakterSayisi > 560 ? 'text-[0.74em]' : 'text-[0.82em]'

  return (
    <div className={cn('mx-auto flex h-full w-full max-w-none flex-col p-2.5 sm:p-4 lg:p-6', mod === 'slayt' && 'min-h-0 overflow-hidden')}>
      <div ref={kutuRef} className="flex min-h-0 flex-1">
        {/* Sayfa */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-2.5 py-2 sm:px-3.5">
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Önceki sayfa" disabled={sayfa === 0} onClick={() => git(sayfa - 1)} className="flex size-7 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"><ChevronLeftIcon className="size-4" /></button>
              {mod === 'pdf' && <span className="text-xs tabular-nums text-muted-foreground">Sayfa {sayfa + 1} / {toplam}</span>}
              <button type="button" aria-label="Sonraki sayfa" disabled={sayfa >= toplam - 1} onClick={() => git(sayfa + 1)} className="flex size-7 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"><ChevronRightIcon className="size-4" /></button>
            </div>
            <div className="flex items-center gap-1">
              {sunumBaslat && <button type="button" onClick={sunumBaslat} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-400 sm:px-3"><PlayIcon className="size-3.5 fill-current" /><span>Sunumu oynat</span></button>}
              <div className="hidden items-center gap-1 sm:flex">
              <button type="button" aria-label="Uzaklaştır" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} className="flex size-7 items-center justify-center rounded-md hover:bg-muted"><ZoomOutIcon className="size-4" /></button>
              <span className="w-10 text-center text-[11px] tabular-nums text-muted-foreground">%{Math.round(zoom * 100)}</span>
              <button type="button" aria-label="Yakınlaştır" onClick={() => setZoom((z) => Math.min(2, z + 0.15))} className="flex size-7 items-center justify-center rounded-md hover:bg-muted"><ZoomInIcon className="size-4" /></button>
              <button type="button" aria-label="Tam ekran" onClick={tamEkranToggle} className="flex size-7 items-center justify-center rounded-md hover:bg-muted">
                {tamEkran ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}
              </button>
              </div>
            </div>
          </div>
          <div className={cn('min-h-0 flex-1 p-2.5 sm:p-4 lg:p-6', mod === 'slayt' ? 'overflow-hidden' : 'overflow-auto')} style={{ fontSize: `${zoom}rem` }}>
            {mod === 'pdf' ? (
              <div className="mx-auto max-w-2xl rounded-lg border bg-background p-8 shadow-sm">
                <h3 className="text-lg font-semibold">{(aktif as { baslik: string }).baslik}</h3>
                <p className="mt-4 leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {(aktif as { metin: string }).metin}
                </p>
                <p className="mt-8 border-t pt-3 text-center text-[11px] text-muted-foreground">
                  {ic.dosya?.ad} · Sayfa {sayfa + 1}/{toplam}
                </p>
              </div>
            ) : (
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-zinc-950 text-white md:justify-center">
                {(aktif as { gorsel?: string }).gorsel && <img
                  src={(aktif as { gorsel?: string }).gorsel}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />}
                {(aktif as { gorsel?: string }).gorsel && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/75 to-zinc-950 md:bg-gradient-to-r md:from-[#08090B]/95 md:via-[#08090B]/85 md:to-[#08090B]/10" />}
                {!(aktif as { gorsel?: string }).gorsel && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />}
                <div className="relative z-10 flex min-h-0 flex-1 w-full flex-col justify-center px-3 py-2.5 sm:px-6 sm:py-5 md:w-[58%] md:px-10 md:py-7 lg:px-12">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-amber-300/90 uppercase">{ic.baslik}</p>
                  <h3 className="mt-1.5 text-lg leading-tight font-semibold sm:mt-2 sm:text-2xl md:text-3xl">{(aktif as { baslik: string }).baslik}</h3>
                  <SlaytNotlari notlar={(aktif as { notlar: string[] }).notlar} kompakt={notKarakterSayisi > 700 || notlar.length > 6} className={cn('mt-2.5 sm:mt-5', mobilNotBoyutu)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {mod === 'pdf' && (
        <SayfaAlt
          ic={ic}
          tamam={il?.tamamlandi}
          tamamlaVeIlerle={tamamlaVeIlerle}
          notUst={`${gorulen.size}/${toplam} sayfa görüntülendi`}
        />
      )}
    </div>
  )
}

const SUNUM_SLAYT_SURE_MS = 12000

function KursSlaytSunumu({
  slaytlar,
  baslangicIx,
  onCikis,
  onSlaytTamamla,
  onTamamlandi,
}: {
  slaytlar: SunumSlayti[]
  baslangicIx: number
  onCikis: (adimIx: number) => void
  onSlaytTamamla: (slayt: SunumSlayti) => void
  onTamamlandi: () => void
}) {
  const [aktifIx, setAktifIx] = useState(baslangicIx)
  const [oynatiyor, setOynatiyor] = useState(true)
  const [gecenMs, setGecenMs] = useState(0)
  const gecenMsRef = useRef(0)
  const tamamlaRef = useRef(onSlaytTamamla)
  const tamamlandiRef = useRef(onTamamlandi)
  const slayt = slaytlar[aktifIx]

  useEffect(() => { tamamlaRef.current = onSlaytTamamla }, [onSlaytTamamla])
  useEffect(() => { tamamlandiRef.current = onTamamlandi }, [onTamamlandi])

  useEffect(() => {
    if (!oynatiyor || !slayt) return
    const timer = window.setInterval(() => {
      const yeni = gecenMsRef.current + 250
      if (yeni >= SUNUM_SLAYT_SURE_MS) {
        gecenMsRef.current = 0
        setGecenMs(0)
        tamamlaRef.current(slayt)
        if (aktifIx < slaytlar.length - 1) setAktifIx((ix) => ix + 1)
        else {
          setOynatiyor(false)
          tamamlandiRef.current()
        }
      } else {
        gecenMsRef.current = yeni
        setGecenMs(yeni)
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [oynatiyor, aktifIx, slayt, slaytlar.length])

  const git = (hedefIx: number) => {
    const hedef = Math.max(0, Math.min(slaytlar.length - 1, hedefIx))
    if (hedef > aktifIx) {
      for (let i = aktifIx; i < hedef; i++) tamamlaRef.current(slaytlar[i])
    }
    gecenMsRef.current = 0
    setGecenMs(0)
    setAktifIx(hedef)
  }

  if (!slayt) return <Merkez icon={PresentationIcon} mesaj="Sunum slaytları bulunamadı." />

  const notlar = slayt.slayt.notlar.filter((n) => !n.startsWith('Anlatıcı notu'))
  const metinUzunlugu = notlar.reduce((toplam, n) => toplam + n.length, 0)
  const notBoyutu = metinUzunlugu > 760 ? 'text-[0.66em]' : metinUzunlugu > 560 ? 'text-[0.72em]' : 'text-[0.82em]'
  const genelYuzde = ((aktifIx + gecenMs / SUNUM_SLAYT_SURE_MS) / slaytlar.length) * 100

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950 text-white">
      {slayt.slayt.gorsel && <>
        <img src={slayt.slayt.gorsel} alt="" aria-hidden="true" className="relative h-[17vh] min-h-20 w-full shrink-0 object-cover object-center md:absolute md:inset-0 md:h-full" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[17vh] min-h-20 bg-gradient-to-t from-zinc-950 via-zinc-950/15 to-transparent md:absolute md:inset-0 md:h-auto md:bg-gradient-to-r md:from-[#08090B]/95 md:via-[#08090B]/85 md:to-[#08090B]/10" />
      </>}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-5 md:justify-center md:px-10 md:py-8 lg:px-14">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.18em] text-amber-300 uppercase sm:text-[10px]">Yüksekte Güvenli Çalışma · Sunum</p>
            <p className="mt-1 truncate text-xs font-medium text-white/75 sm:text-sm">{slayt.ic.baslik}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 text-[11px] text-white hover:bg-white/10 hover:text-white sm:px-3" onClick={() => { setOynatiyor(false); onCikis(slayt.adimIx) }}>
            <XIcon className="size-3.5" /> İçeriğe dön
          </Button>
        </header>

        <main className="flex min-h-0 flex-1 flex-col justify-center py-3 md:w-full md:max-w-6xl md:py-6 lg:py-8">
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-[0.18em] text-amber-300/90 uppercase sm:text-[10px]">
            <span className="truncate text-white/55">{oynatiyor ? 'Oynatılıyor' : 'Duraklatıldı'}</span>
          </div>
          <h1 className="mt-2 text-xl leading-tight font-semibold sm:text-2xl md:text-4xl">{slayt.slayt.baslik}</h1>
          <SlaytNotlari notlar={notlar} kompakt={metinUzunlugu > 700 || notlar.length > 6} className={cn('mt-3 sm:mt-5', notBoyutu)} />
        </main>

        <footer className="mx-auto w-full max-w-6xl rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3">
          <div className="h-1 overflow-hidden rounded-full bg-white/15" aria-label="Sunum ilerlemesi">
            <div className="h-full rounded-full bg-amber-400 transition-[width] duration-200" style={{ width: `${genelYuzde}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <Button variant="ghost" size="icon" aria-label="Önceki slayt" className="size-8 shrink-0 rounded-full text-white hover:bg-white/10 hover:text-white" disabled={aktifIx === 0} onClick={() => git(aktifIx - 1)}>
              <ChevronLeftIcon className="size-5" />
            </Button>
            <Button size="icon" aria-label={oynatiyor ? 'Sunumu duraklat' : 'Sunumu başlat'} className="size-10 shrink-0 rounded-full bg-amber-500 text-zinc-950 hover:bg-amber-400" onClick={() => setOynatiyor((o) => !o)}>
              {oynatiyor ? <PauseIcon className="size-4 fill-current" /> : <PlayIcon className="size-4 fill-current" />}
            </Button>
            <span className="min-w-0 flex-1 text-center text-[10px] text-white/60 sm:text-xs">{oynatiyor ? 'Sıradaki slayt otomatik açılır' : 'Devam etmek için oynatın'}</span>
            {aktifIx < slaytlar.length - 1 ? (
              <Button variant="ghost" size="icon" aria-label="Sonraki slayt" className="size-8 shrink-0 rounded-full text-white hover:bg-white/10 hover:text-white" onClick={() => git(aktifIx + 1)}>
                <ChevronRightIcon className="size-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-[10px] text-amber-300 hover:bg-white/10 hover:text-amber-200 sm:text-xs" onClick={() => { tamamlaRef.current(slayt); tamamlandiRef.current() }}>
                Kapanışa geç <ChevronRightIcon className="size-4" />
              </Button>
            )}
          </div>
        </footer>
      </div>
    </section>
  )
}

function SlaytNotlari({ notlar, kompakt, className }: { notlar: string[]; kompakt: boolean; className?: string }) {
  return (
    <ul className={cn('min-h-0 space-y-2 leading-[1.4] sm:space-y-2.5 sm:leading-[1.45]', kompakt && 'space-y-1.5 sm:space-y-1.5', className)}>
      {notlar.map((not, i) => {
        const anlatim = not.startsWith('Anlatıcı notu')
        return (
          <li key={i} className={cn(
            'flex items-start gap-2.5 rounded-xl border backdrop-blur-sm sm:gap-3',
            kompakt ? 'px-2.5 py-2 sm:px-3' : 'px-3 py-2.5 sm:px-3.5 sm:py-3',
            anlatim ? 'border-white/10 bg-black/25 text-white/65 italic' : 'border-white/10 bg-white/[0.055] text-white/95',
          )}>
            {!anlatim && (
              <span className={cn('mt-0.5 grid shrink-0 place-items-center rounded-lg bg-amber-400/10 text-amber-300', kompakt ? 'size-6' : 'size-7')}>
                <CheckCircle2Icon className={kompakt ? 'size-3.5' : 'size-4'} />
              </span>
            )}
            <span className="min-w-0 flex-1">{not}</span>
          </li>
        )
      })}
    </ul>
  )
}

function SayfaAlt({ ic, tamam, tamamlaVeIlerle, notUst }: { ic: Icerik; tamam?: boolean; tamamlaVeIlerle: (i: Icerik) => void; notUst: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold">{ic.baslik}</h2>
        <p className="text-xs text-muted-foreground">{notUst}</p>
      </div>
      {tamam && (
        <Button onClick={() => tamamlaVeIlerle(ic)}>
          <CheckCircle2Icon /> Tamamla ve ilerle
        </Button>
      )}
    </div>
  )
}

function GorselOynatici({ ic, tamamlaVeIlerle }: { ic: Icerik; tamamlaVeIlerle: (i: Icerik) => void }) {
  const dosyaUrl = useEgitimDosyaUrl(ic.dosya?.url)
  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col p-3 sm:p-4 lg:p-6">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border bg-zinc-950 shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_38%)]" />
        {dosyaUrl ? (
          <img src={dosyaUrl} alt={ic.baslik} className="relative z-10 max-h-full max-w-full object-contain" />
        ) : ic.dosya?.url ? (
          <p className="relative z-10 text-sm text-white/65">Görsel açılıyor…</p>
        ) : (
          <Merkez icon={ImageIcon} mesaj="Görsel bulunamadı" />
        )}
        {dosyaUrl && <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-medium text-white/85 backdrop-blur sm:top-4 sm:left-4"><ImageIcon className="size-4 text-amber-300" /> Eğitim görseli</div>}
      </div>
      <SayfaAlt ic={ic} tamam tamamlaVeIlerle={tamamlaVeIlerle} notUst={ic.aciklama} />
    </div>
  )
}

function MetinOynatici({ ic, tamamlaVeIlerle }: { ic: Icerik; tamamlaVeIlerle: (i: Icerik) => void }) {
  // Tamamlama: metnin sonuna gelinmeli ve içeriğin süresinin yarısı sayfada geçmiş olmalı
  const gerekliSn = Math.round(ic.sureDakika * 60 * 0.5)
  const { sure, yeterli: sureYeterli } = useIzlemeSayaci(gerekliSn)
  const [sonaGeldi, setSonaGeldi] = useState(false)
  const metinYeterli = sonaGeldi && sureYeterli
  const notUst = metinYeterli
    ? 'Okuduktan sonra tamamlayın'
    : !sonaGeldi
      ? 'Metnin sonuna kadar kaydırın'
      : `Tamamlamak için ${Math.ceil((gerekliSn - sure) / 60)} dk daha okuyun`
  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col p-3 sm:p-4 lg:p-6">
      <article
        ref={(el) => {
          // Kaydırma gerektirmeyen kısa metinler de sona gelinmiş sayılır
          if (el && el.scrollHeight <= el.clientHeight + 4) setSonaGeldi(true)
        }}
        onScroll={(e) => {
          const el = e.currentTarget
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) setSonaGeldi(true)
        }}
        className="min-h-0 flex-1 overflow-y-auto rounded-2xl border bg-card shadow-sm"
      >
        {ic.id === 'YUK-IC17' ? (
          <div className="p-3 sm:p-5 lg:p-6"><YuksekteKapanis /></div>
        ) : (
          <>
            <header className="flex items-start gap-3 border-b bg-gradient-to-r from-amber-500/[0.08] via-transparent to-transparent px-4 py-4 sm:px-6 sm:py-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"><FileTextIcon className="size-5" /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Okuma içeriği · {ic.sureDakika} dk</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">{ic.baslik}</h2>
                {ic.aciklama && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{ic.aciklama}</p>}
              </div>
            </header>
            <div className="mx-auto max-w-3xl px-4 py-5 sm:px-8 sm:py-7">
              {(ic.metinIcerik || 'İçerik metni eklenmemiş.').split(/\n\s*\n/).filter(Boolean).map((paragraf, i) => (
                <p key={i} className="border-l-2 border-amber-500/35 py-1 pl-4 text-sm leading-7 whitespace-pre-wrap text-foreground/90 sm:text-[15px]">
                  {paragraf}
                </p>
              ))}
            </div>
          </>
        )}
      </article>
      <SayfaAlt ic={ic} tamam={metinYeterli} tamamlaVeIlerle={tamamlaVeIlerle} notUst={notUst} />
    </div>
  )
}

function YuksekteKapanis() {
  const hatirlanacaklar = [
    ['01', 'Önce planla', 'İşe başlamadan düşme riskini değerlendir; mümkünse yüksekte çalışma ihtiyacını ortadan kaldır.'],
    ['02', 'Toplu korumayı seç', 'Korkuluk ve güvenli platform gibi toplu koruma önlemlerine öncelik ver.'],
    ['03', 'Doğru erişim ekipmanı', 'Merdiveni her iş için kullanma; ekipmanın işe uygunluğunu ve durumunu kontrol et.'],
    ['04', 'Sistemi birlikte değerlendir', 'Emniyet kemeri, bağlantı elemanı ve doğrulanmış ankrajı uyumlu bir sistem olarak kullan.'],
    ['05', 'Koşullar değişirse dur', 'Hava, zemin veya görüş güvenli çalışmayı engelliyorsa işi durdurup yeniden değerlendir.'],
    ['06', 'Kurtarmaya hazır ol', 'Düşüş durdurma sistemine güvenmeden önce kurtarma planını, ekibi ve ekipmanı hazırla.'],
    ['07', 'Güvensizi bildir', 'Hasarlı ekipmanı kullanımdan çıkar; eksik korumayı ve tehlikeyi yetkiliye bildir.'],
  ]

  return (
    <div className="space-y-5">
      <section className="relative isolate flex min-h-56 overflow-hidden rounded-2xl bg-zinc-950 text-white sm:min-h-64">
        <img
          src="/images/yuksekte-egitimi-kapanis.png"
          alt="Güvenli korkuluklar ve uygun düşüş durdurma sistemiyle çalışan iş güvenliği uzmanı"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/10" />
        <div className="flex max-w-lg flex-col justify-center px-6 py-7 sm:px-8">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-amber-300 uppercase">Kapanış · Sahada hatırla</span>
          <h2 className="mt-3 text-2xl leading-tight font-semibold sm:text-3xl">Güvenlik tesadüfe bırakılmaz.</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
            Her işe planla başla. Doğru korumayı kur. Güvenli değilse dur.
          </p>
        </div>
        <div className="absolute right-4 bottom-4 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] font-medium tracking-wide text-white/75 backdrop-blur">
          YÜKSEKTE GÜVENLİ ÇALIŞMA
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-600 uppercase dark:text-amber-400">Cep rehberi</p>
            <h3 className="mt-1 text-base font-semibold">Eğitim sonunda hatırlanacaklar</h3>
          </div>
          <span className="text-xs text-muted-foreground">7 temel kural</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {hatirlanacaklar.map(([no, baslik, aciklama]) => (
            <article key={no} className="flex gap-3 rounded-xl border bg-background/70 p-3.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">{no}</span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">{baslik}</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{aciklama}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Kapsam notu: </span>
        Bu çevrim içi içerik teorik farkındalık sağlar; işe özgü uygulamalı ekipman eğitiminin, yetkinlik değerlendirmesinin veya çalışma yetkisinin yerine geçmez. İşyerindeki uygulamalar yürürlükteki mevzuata ve işyeri prosedürlerine göre planlanmalıdır.
      </p>
    </div>
  )
}

function Merkez({ icon: Icon, mesaj }: { icon: typeof FileTextIcon; mesaj: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
      <Icon className="size-10 text-muted-foreground/30" />
      <p className="max-w-sm text-center text-sm text-muted-foreground">{mesaj}</p>
    </div>
  )
}

/* ================================ Sınav ekranı ============================= */

function SinavEkran({
  sinav,
  egitim,
  hesapId,
  denemeEkle,
  ilerleme,
}: {
  sinav: Sinav
  egitim: string
  hesapId: string
  denemeEkle: (h: string, e: string, d: { puan: number; gecti: boolean; sureSn: number; tarih: string; dogruSayisi: number }) => boolean
  ilerleme?: { denemeler: { puan: number; gecti: boolean; no: number }[] }
}) {
  const sorular = useMemo(() => {
    const s = [...sinav.sorular]
    return sinav.ayarlar.soruKaristir ? karistir(s) : s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinav.sorular, sinav.ayarlar.soruKaristir])
  const secenekSirasi = useMemo(
    () => Object.fromEntries(sorular.map((s) => [s.id, sinav.ayarlar.sikKaristir ? karistir(s.secenekler.map((_, i) => i)) : s.secenekler.map((_, i) => i)])),
    [sorular, sinav.ayarlar.sikKaristir],
  )
  const [cevaplar, setCevaplar] = useState<Record<string, number[]>>({})
  const [sonuc, setSonuc] = useState<{ puan: number; gecti: boolean; dogru: Record<string, boolean> } | null>(null)
  const [soruIx, setSoruIx] = useState(0)
  const [baslangic, setBaslangic] = useState(Date.now())
  const [kalanSn, setKalanSn] = useState(sinav.ayarlar.sureDakika > 0 ? sinav.ayarlar.sureDakika * 60 : 0)
  const [sureDoldu, setSureDoldu] = useState(false)

  const denemeSayisi = ilerleme?.denemeler.length ?? 0
  const hakKaldi = sinav.ayarlar.denemeHakki === 0 || denemeSayisi < sinav.ayarlar.denemeHakki
  const sonDeneme = ilerleme?.denemeler[denemeSayisi - 1]
  const cevaplanan = sorular.filter((s) => (cevaplar[s.id]?.length ?? 0) > 0).length
  const aktifSoru = sorular[soruIx]
  const tamamlanmaYuzdesi = sorular.length ? Math.round((cevaplanan / sorular.length) * 100) : 0

  const sec = (soruId: string, ix: number, coklu: boolean) => {
    setCevaplar((c) => {
      const mevcut = c[soruId] ?? []
      if (coklu) return { ...c, [soruId]: mevcut.includes(ix) ? mevcut.filter((x) => x !== ix) : [...mevcut, ix] }
      return { ...c, [soruId]: [ix] }
    })
  }

  const bitir = (sureBitti = false) => {
    if (!sureBitti && sorular.some((s) => !(cevaplar[s.id]?.length))) {
      toast.error('Tüm soruları cevaplayın')
      const eksikIx = sorular.findIndex((s) => !(cevaplar[s.id]?.length))
      if (eksikIx >= 0) setSoruIx(eksikIx)
      return
    }
    // NOT: Üretimde puanlama backend'de yapılır — doğru cevaplar frontend'e gönderilmez
    let alinan = 0
    let toplam = 0
    const dogruMap: Record<string, boolean> = {}
    for (const s of sorular) {
      toplam += s.puan
      const c = [...(cevaplar[s.id] ?? [])].sort()
      const d = [...s.dogru].sort()
      const ok = c.length === d.length && c.every((x, i) => x === d[i])
      dogruMap[s.id] = ok
      if (ok) alinan += s.puan
    }
    const puan = toplam ? Math.round((alinan / toplam) * 100) : 0
    const gecti = puan >= sinav.ayarlar.gecmePuani
    const kaydedildi = denemeEkle(hesapId, egitim, {
      puan,
      gecti,
      sureSn: Math.floor((Date.now() - baslangic) / 1000),
      tarih: new Date().toISOString(),
      dogruSayisi: Object.values(dogruMap).filter(Boolean).length,
    })
    if (!kaydedildi) {
      toast.error('Deneme hakkınız dolmuş. Sonuç kaydedilmedi.')
      return
    }
    setSonuc({ puan, gecti, dogru: dogruMap })
  }

  useEffect(() => {
    if (!sinav.ayarlar.sureDakika || !hakKaldi || sonuc || sureDoldu) return
    const timer = window.setInterval(() => {
      setKalanSn((kalan) => {
        if (kalan <= 1) {
          window.clearInterval(timer)
          setSureDoldu(true)
          return 0
        }
        return kalan - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [sinav.ayarlar.sureDakika, hakKaldi, sonuc, sureDoldu])

  useEffect(() => {
    if (sureDoldu && !sonuc) bitir(true)
    // Süre dolduğunda son cevap durumuyla tek deneme kaydedilir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sureDoldu, sonuc])

  if (sonuc) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
        <section className={cn('relative overflow-hidden rounded-2xl border p-6 sm:p-8', sonuc.gecti ? 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card' : 'border-red-500/25 bg-gradient-to-br from-red-500/10 via-card to-card')}>
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className={cn('flex size-16 shrink-0 items-center justify-center rounded-2xl', sonuc.gecti ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>
              <AwardIcon className="size-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Sınav sonucu</p>
              <h2 className={cn('mt-1 text-xl font-semibold sm:text-2xl', sonuc.gecti ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                {sonuc.gecti ? 'Tebrikler, sınavı başarıyla geçtiniz' : 'Bu denemede geçme puanına ulaşamadınız'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Yanıtlarınız ve konu açıklamaları aşağıda. Eksik kalan konuları gözden geçirip tekrar deneyebilirsiniz.</p>
            </div>
            <div className="rounded-2xl border bg-background/70 px-6 py-3 text-center">
              <p className="text-3xl font-bold tabular-nums">{sonuc.puan}<span className="ml-0.5 text-base font-medium text-muted-foreground">/100</span></p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Geçme notu {sinav.ayarlar.gecmePuani}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border bg-background/70 px-3 py-1.5">Doğru yanıt <b className="ml-1 tabular-nums">{Object.values(sonuc.dogru).filter(Boolean).length}/{sorular.length}</b></span>
            <span className="rounded-full border bg-background/70 px-3 py-1.5">Deneme <b className="ml-1 tabular-nums">{denemeSayisi}/{sinav.ayarlar.denemeHakki || '∞'}</b></span>
            <span className="rounded-full border bg-background/70 px-3 py-1.5">Durum <b className={cn('ml-1', sonuc.gecti ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>{sonuc.gecti ? 'Başarılı' : 'Geliştirilmeli'}</b></span>
          </div>
          {!sonuc.gecti && hakKaldi && (
            <Button className="mt-5" onClick={() => {
              setCevaplar({})
              setSoruIx(0)
              setKalanSn(sinav.ayarlar.sureDakika > 0 ? sinav.ayarlar.sureDakika * 60 : 0)
              setSureDoldu(false)
              setBaslangic(Date.now())
              setSonuc(null)
            }}>
              <RotateCwIcon /> Yeni deneme başlat
            </Button>
          )}
          {!sonuc.gecti && !hakKaldi && (
            <p className="mt-4 text-sm text-muted-foreground">Deneme hakkınız doldu. Yeni hak için eğitim yöneticinize başvurun.</p>
          )}
        </section>
        {sinav.ayarlar.cevaplariGoster && (
          <section>
            <div className="mb-3">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-600 uppercase dark:text-amber-400">Yanıt incelemesi</p>
              <h3 className="mt-1 text-base font-semibold">Sorular ve açıklamalar</h3>
            </div>
            <div className="space-y-3">
              {sorular.map((s, i) => {
              const ok = sonuc.dogru[s.id]
              const secilenler = cevaplar[s.id] ?? []
              return (
                <article key={s.id} className={cn('rounded-xl border bg-card p-4 sm:p-5', ok ? 'border-emerald-500/20' : 'border-red-500/20')}>
                  <div className="flex items-start gap-3">
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold', ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500')}>{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold leading-relaxed">{s.soru}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500')}>{ok ? 'Doğru' : 'Yanlış'}</span>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {s.secenekler.map((o, oi) => {
                          const dogruSecenek = s.dogru.includes(oi)
                          const kullaniciSecimi = secilenler.includes(oi)
                          return (
                            <div key={oi} className={cn('flex items-start gap-2 rounded-lg px-3 py-2 text-xs', dogruSecenek ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : kullaniciSecimi ? 'bg-red-500/10 text-red-600 dark:text-red-300' : 'bg-muted/50 text-muted-foreground')}>
                              <span className="mt-0.5 shrink-0 font-bold">{dogruSecenek ? '✓' : kullaniciSecimi ? '×' : '·'}</span>
                              <span className="flex-1">{o}</span>
                              {kullaniciSecimi && <span className="shrink-0 text-[10px] font-medium">Yanıtınız</span>}
                              {dogruSecenek && <span className="shrink-0 text-[10px] font-medium">Doğru yanıt</span>}
                            </div>
                          )
                        })}
                      </div>
                      {sinav.ayarlar.aciklamalariGoster && s.aciklama && (
                        <p className="mt-3 rounded-lg border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground"><b className="text-foreground">Açıklama: </b>{s.aciklama}</p>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
            </div>
          </section>
        )}
      </div>
    )
  }

  if (!hakKaldi) {
    return (
      <div className="mx-auto max-w-3xl p-5 sm:p-8">
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <ClipboardListIcon className="mx-auto size-9 text-muted-foreground/50" />
          <h2 className="mt-3 font-semibold">Deneme hakkı doldu</h2>
          <p className="mt-1 text-sm text-muted-foreground">Yeni hak için eğitim yöneticinize başvurun.</p>
          {sonDeneme && <p className="mt-3 text-xs text-muted-foreground">Son deneme: {sonDeneme.puan} puan · {sonDeneme.gecti ? 'başarılı' : 'başarısız'}</p>}
        </div>
      </div>
    )
  }

  if (!aktifSoru) return <Merkez icon={ClipboardListIcon} mesaj="Bu sınavda henüz soru bulunmuyor." />

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-amber-500/12 via-card to-card px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-amber-600 uppercase dark:text-amber-400">Eğitim sonu değerlendirmesi</p>
            <h2 className="mt-1 text-lg font-semibold sm:text-xl">{sinav.baslik}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">{sinav.aciklama}</p>
          </div>
            <div className={cn('shrink-0 rounded-xl border bg-background/75 px-3 py-2 text-center', kalanSn > 0 && kalanSn <= 60 && 'border-red-500/40 text-red-500')}>
              <p className="text-[10px] text-muted-foreground">Kalan süre</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{sinav.ayarlar.sureDakika ? fmtSn(kalanSn) : '—'}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border bg-background/70 px-3 py-1.5">{sorular.length} soru</span>
            <span className="rounded-full border bg-background/70 px-3 py-1.5">Geçme notu {sinav.ayarlar.gecmePuani}</span>
            <span className="rounded-full border bg-background/70 px-3 py-1.5">Deneme {denemeSayisi + 1}/{sinav.ayarlar.denemeHakki || '∞'}</span>
          </div>
          {sonDeneme && <p className="mt-2 text-[11px] text-muted-foreground">Önceki deneme: {sonDeneme.puan} puan · {sonDeneme.gecti ? 'başarılı' : 'başarısız'}</p>}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 p-4 sm:p-6">
            <div className="mb-5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium">İlerleme</span>
                <span className="tabular-nums text-muted-foreground">{cevaplanan}/{sorular.length} yanıtlandı · %{tamamlanmaYuzdesi}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${tamamlanmaYuzdesi}%` }} />
              </div>
            </div>

            <article className="rounded-2xl border bg-background p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Soru {String(soruIx + 1).padStart(2, '0')} / {String(sorular.length).padStart(2, '0')}</span>
                <span className="text-[11px] text-muted-foreground">{aktifSoru.puan} puan{aktifSoru.tur === 'coklu' ? ' · birden fazla yanıt' : ''}</span>
              </div>
              <h3 className="mt-5 text-base leading-relaxed font-semibold sm:text-lg">{aktifSoru.soru}</h3>
              <div className="mt-5 space-y-2">
                {secenekSirasi[aktifSoru.id].map((oi, sIx) => {
                  const secenek = aktifSoru.secenekler[oi]
                  const secili = (cevaplar[aktifSoru.id] ?? []).includes(oi)
                  return (
                    <button
                      key={oi}
                      type="button"
                      aria-pressed={secili}
                      onClick={() => sec(aktifSoru.id, oi, aktifSoru.tur === 'coklu')}
                      className={cn(
                        'group flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors sm:px-4',
                        secili ? 'border-amber-500/60 bg-amber-500/10' : 'hover:border-amber-500/40 hover:bg-muted/50',
                      )}
                    >
                      <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold', secili ? 'border-amber-500 bg-amber-500 text-zinc-950' : 'bg-muted/60 text-muted-foreground group-hover:border-amber-500/40')}>
                        {String.fromCharCode(65 + sIx)}
                      </span>
                      <span className="flex-1 leading-relaxed">{secenek}</span>
                      {secili && <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />}
                    </button>
                  )
                })}
              </div>
            </article>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Button variant="outline" disabled={soruIx === 0} onClick={() => setSoruIx((i) => Math.max(0, i - 1))}>
                <ChevronLeftIcon /> Önceki
              </Button>
              {soruIx < sorular.length - 1 ? (
                <Button onClick={() => setSoruIx((i) => Math.min(sorular.length - 1, i + 1))}>
                  Sonraki soru <ChevronRightIcon />
                </Button>
              ) : (
                <Button onClick={() => bitir()}>
                  <CheckCircle2Icon /> Sınavı tamamla
                </Button>
              )}
            </div>
          </div>

          <aside className="border-t bg-muted/20 p-4 lg:border-t-0 lg:border-l lg:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold">Soru listesi</h3>
              <span className="text-[10px] text-muted-foreground">Seçip geçebilirsiniz</span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-4">
              {sorular.map((s, i) => {
                const yanitlandi = (cevaplar[s.id]?.length ?? 0) > 0
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Soru ${i + 1}${yanitlandi ? ', yanıtlandı' : ', yanıtlanmadı'}`}
                    aria-current={i === soruIx ? 'step' : undefined}
                    onClick={() => setSoruIx(i)}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold tabular-nums transition-colors',
                      i === soruIx ? 'border-amber-500 bg-amber-500 text-zinc-950' : yanitlandi ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-background text-muted-foreground hover:border-amber-500/40',
                    )}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 space-y-2 border-t pt-3 text-[11px] text-muted-foreground">
              <p className="flex items-center gap-2"><span className="size-2 rounded-sm bg-amber-500" /> Şu an açık</p>
              <p className="flex items-center gap-2"><span className="size-2 rounded-sm bg-emerald-500" /> Yanıtlandı</p>
              <p className="flex items-center gap-2"><span className="size-2 rounded-sm border bg-background" /> Yanıt bekliyor</p>
            </div>
            <p className="mt-4 rounded-lg bg-amber-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground">Tüm soruları yanıtladıktan sonra sınavı tamamlayın. Yanıtlarınızı göndermeden önce soru listesinden tekrar kontrol edebilirsiniz.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}
