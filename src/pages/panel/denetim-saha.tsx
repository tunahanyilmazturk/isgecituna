import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Dialog } from '@base-ui/react/dialog'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CameraIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileWarningIcon,
  ImageIcon,
  MapPinIcon,
  MinusIcon,
  PencilIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { maddeIstat, onemRenk, type DenetimMadde, type MaddeSonuc } from '@/data/denetimler'
import { useDenetimlerStore } from '@/stores/denetimler-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { hesapGorunenAd } from '@/data/ekip'
import { kapsamdaMi, useKapsam } from '@/lib/kapsam'

const SONUCLAR: { id: MaddeSonuc; ikon: typeof CheckIcon; aktif: string; pasif: string }[] = [
  { id: 'Uygun', ikon: CheckIcon, aktif: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', pasif: 'border-emerald-500/30 text-emerald-700/70 dark:text-emerald-400/70' },
  { id: 'Uygunsuz', ikon: XIcon, aktif: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400', pasif: 'border-red-500/30 text-red-700/70 dark:text-red-400/70' },
  { id: 'Uygulanamaz', ikon: MinusIcon, aktif: 'border-zinc-400 bg-muted text-muted-foreground', pasif: 'border-border text-muted-foreground' },
  { id: 'Gözlem', ikon: PencilIcon, aktif: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400', pasif: 'border-amber-500/30 text-amber-700/70 dark:text-amber-400/70' },
]

const fotoIndir = (file: File): Promise<{ ad: string; dataUrl: string; boyut: number }> =>
  new Promise((coz, hata) => {
    const okur = new FileReader()
    okur.onerror = hata
    okur.onload = () => {
      const img = new Image()
      img.onerror = hata
      img.onload = () => {
        const olcek = Math.min(1, 960 / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * olcek)
        c.height = Math.round(img.height * olcek)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        coz({ ad: file.name, dataUrl: c.toDataURL('image/jpeg', 0.72), boyut: file.size })
      }
      img.src = String(okur.result)
    }
    okur.readAsDataURL(file)
  })

export default function DenetimSahaPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const st = useDenetimlerStore()
  const { uyeler, hesaplar } = useEkipStore()
  const user = useAuthStore((s) => s.user)
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.name ?? 'Kullanıcı')
  const kapsam = useKapsam('denetimler')

  const denetim = st.denetimler.find((d) => d.id === id)
  const kategoriler = useMemo(() => (denetim ? [...new Set(denetim.maddeler.map((m) => m.kategoriAd))] : []), [denetim])
  const [katIdx, setKatIdx] = useState(0)
  const [maddeIdx, setMaddeIdx] = useState(0)
  const [notAcik, setNotAcik] = useState(false)
  const [bitirAcik, setBitirAcik] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!denetim)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6">
        <p className="text-sm text-muted-foreground">Denetim bulunamadı.</p>
        <Button variant="outline" size="sm" onClick={() => nav('/panel/denetimler')}>Listeye dön</Button>
      </div>
    )
  if (!kapsamdaMi(kapsam, denetim.firmaId))
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6">
        <p className="text-sm text-muted-foreground">Bu denetime erişim yetkiniz yok.</p>
        <Button variant="outline" size="sm" onClick={() => nav('/panel/denetimler')}>Listeye dön</Button>
      </div>
    )

  const kategori = kategoriler[katIdx] ?? kategoriler[0]
  const maddeler = denetim.maddeler.filter((m) => m.kategoriAd === kategori)
  const madde = maddeler[Math.min(maddeIdx, maddeler.length - 1)] as DenetimMadde | undefined
  const ist = maddeIstat(denetim.maddeler)
  const tamamlandi = ist.cevapsiz === 0

  const sonraki = () => {
    if (maddeIdx < maddeler.length - 1) setMaddeIdx(maddeIdx + 1)
    else if (katIdx < kategoriler.length - 1) { setKatIdx(katIdx + 1); setMaddeIdx(0) }
  }
  const onceki = () => {
    if (maddeIdx > 0) setMaddeIdx(maddeIdx - 1)
    else if (katIdx > 0) { setKatIdx(katIdx - 1); setMaddeIdx(denetim.maddeler.filter((m) => m.kategoriAd === kategoriler[katIdx - 1]).length - 1) }
  }

  const yanitla = (sonuc: MaddeSonuc) => {
    if (!madde) return
    st.maddeYanitla(denetim.id, madde.id, { sonuc: madde.sonuc === sonuc ? undefined : sonuc })
    if (sonuc === 'Uygunsuz' && madde.sonuc !== 'Uygunsuz' && madde.aksiyonKurali) {
      toast.warning('Uygunsuzluk tespit edildi', {
        description: 'Detay sayfasında bulgu ve düzeltici faaliyet oluşturabilirsiniz.',
      })
    }
    if (madde.sonuc !== sonuc) setTimeout(sonraki, 280)
  }

  const bitir = () => {
    const eksik = st.denetimRaporaAl(denetim.id, kullanici)
    setBitirAcik(false)
    if (eksik > 0) toast.error(`${eksik} zorunlu madde cevapsız`, { description: 'Eksik maddeleri tamamlamadan rapor aşamasına geçilemez.' })
    else {
      toast.success('Saha kontrolleri tamamlandı', { description: 'Denetim rapor aşamasına geçti.' })
      nav(`/panel/denetimler/${denetim.id}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sabit üst: ilerleme */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
          <button type="button" onClick={() => nav(`/panel/denetimler/${denetim.id}`)} aria-label="Detaya dön" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeftIcon className="size-4.5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{denetim.baslik}</p>
            <p className="truncate text-[11px] text-muted-foreground">{denetim.no} · {denetim.firmaAd} · otomatik kaydediliyor</p>
          </div>
          {tamamlandi && (
            <Button size="xs" onClick={() => setBitirAcik(true)}><CheckCircle2Icon /> Bitir</Button>
          )}
        </div>
        <div className="px-3 pb-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${ist.toplam ? ((ist.toplam - ist.cevapsiz) / ist.toplam) * 100 : 0}%` }} />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums">
            <div className="flex items-center gap-2.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{ist.uygun} uygun</span>
              <span className="font-medium text-red-600 dark:text-red-400">{ist.uygunsuz} uygunsuz</span>
              <span className="text-muted-foreground">{ist.uygulanamaz} u.d.</span>
              {ist.gozlem > 0 && <span className="text-amber-600 dark:text-amber-400">{ist.gozlem} gözlem</span>}
            </div>
            <span className="text-muted-foreground">{ist.toplam - ist.cevapsiz}/{ist.toplam}{ist.eksikZorunlu > 0 ? ` · ${ist.eksikZorunlu} zorunlu eksik` : ''}</span>
          </div>
        </div>
        {/* Kategori çipleri */}
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {kategoriler.map((k, i) => {
            const km = denetim.maddeler.filter((m) => m.kategoriAd === k)
            const bitti = km.filter((m) => m.sonuc).length
            return (
              <button
                key={k}
                type="button"
                onClick={() => { setKatIdx(i); setMaddeIdx(0) }}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                  i === katIdx ? 'border-transparent bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-muted-foreground',
                )}
              >
                {k} <span className={cn('tabular-nums', i === katIdx ? 'opacity-70' : 'opacity-50')}>{bitti}/{km.length}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Madde kartı */}
      <div className="flex-1 px-4 py-5">
        {madde ? (
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{kategori}</span>
              <span className="tabular-nums">{maddeIdx + 1}/{maddeler.length}</span>
            </div>
            <div className="mt-2 rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base leading-snug font-semibold">
                  {madde.soru}
                  {madde.zorunlu && <span className="ml-1.5 text-red-500" title="Zorunlu">*</span>}
                </h2>
                <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium', onemRenk[madde.onem])}>{madde.onem}</span>
              </div>
              {madde.aciklama && <p className="mt-1.5 text-sm text-muted-foreground">{madde.aciklama}</p>}
              {madde.mevzuatRef && <p className="mt-1.5 text-xs text-muted-foreground/80">Ref: {madde.mevzuatRef}</p>}

              {/* Büyük dokunma alanları */}
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {SONUCLAR.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => yanitla(s.id)}
                    className={cn(
                      'flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.97]',
                      madde.sonuc === s.id ? s.aktif + ' shadow-sm' : s.pasif,
                    )}
                  >
                    <s.ikon className="size-4.5" /> {s.id}
                  </button>
                ))}
              </div>

              {/* Konum + not */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-input px-3 dark:bg-input/30">
                  <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    value={madde.bolum ?? ''}
                    onChange={(e) => st.maddeYanitla(denetim.id, madde.id, { bolum: e.target.value || undefined })}
                    placeholder="Konum / bölüm (ör. Depo A)"
                    className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setNotAcik((a) => !a)}
                  className="flex w-full items-center gap-2 rounded-lg border border-input px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                >
                  <PencilIcon className="size-4 shrink-0" />
                  {madde.not ? <span className="truncate text-foreground">{madde.not}</span> : 'Not ekle…'}
                </button>
                {notAcik && (
                  <textarea
                    autoFocus
                    value={madde.not ?? ''}
                    onChange={(e) => st.maddeYanitla(denetim.id, madde.id, { not: e.target.value || undefined })}
                    rows={2}
                    placeholder="Gözlem, açıklama…"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  />
                )}
              </div>

              {/* Fotoğraflar */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Fotoğraflar {madde.fotografGerekli && <span className="text-amber-600 dark:text-amber-400">(zorunlu)</span>}
                  </p>
                  {madde.fotografGerekli && madde.fotograflar.length === 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400"><AlertTriangleIcon className="size-3" /> bekleniyor</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {madde.fotograflar.map((f) =>
                    f.dataUrl ? (
                      <button key={f.id} type="button" onClick={() => setLightbox(f.dataUrl!)} className="size-20 overflow-hidden rounded-xl border transition-transform active:scale-95">
                        <img src={f.dataUrl} alt={f.ad} className="size-full object-cover" />
                      </button>
                    ) : (
                      <span key={f.id} className="flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs text-muted-foreground"><ImageIcon className="size-4" />{f.ad}</span>
                    ),
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <CameraIcon className="size-5" />
                    <span className="text-[10px]">Çek / Ekle</span>
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const foto = await fotoIndir(f)
                    st.maddeFotoEkle(denetim.id, madde.id, { ...foto, tur: 'fotograf', ekleyen: kullanici })
                    toast.success('Fotoğraf eklendi')
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">Bu kategoride madde yok.</p>
        )}
      </div>

      {/* Alt gezinme */}
      <div className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
          <Button variant="outline" className="flex-1" onClick={onceki} disabled={katIdx === 0 && maddeIdx === 0}>
            <ChevronLeftIcon /> Önceki
          </Button>
          {(katIdx === kategoriler.length - 1 && maddeIdx === maddeler.length - 1) ? (
            <Button className="flex-1" onClick={() => (tamamlandi ? setBitirAcik(true) : setBitirAcik(true))}>
              <CheckCircle2Icon /> Bitir
            </Button>
          ) : (
            <Button className="flex-1" onClick={sonraki}>
              Sonraki <ChevronRightIcon />
            </Button>
          )}
        </div>
      </div>

      {/* Bitir onayı */}
      {bitirAcik && (
        <Dialog.Root open onOpenChange={(a) => !a && setBitirAcik(false)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-popover p-5 shadow-2xl">
              <Dialog.Title className="text-base font-semibold">Saha kontrollerini bitir</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {ist.eksikZorunlu > 0
                  ? `${ist.eksikZorunlu} zorunlu madde cevapsız — tamamlanmadan rapor aşamasına geçilemez.`
                  : ist.cevapsiz > 0
                    ? `${ist.cevapsiz} opsiyonel madde cevapsız kalacak. Devam edilsin mi?`
                    : 'Tüm kontrol maddeleri değerlendirildi. Denetim rapor aşamasına geçecek.'}
              </Dialog.Description>
              {ist.uygunsuz > 0 && (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                  <FileWarningIcon className="size-3.5" /> {ist.uygunsuz} uygunsuz sonuç — detay sayfasında bulgu ve aksiyon oluşturmayı unutmayın.
                </p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setBitirAcik(false)}>Devam et</Button>
                <Button size="sm" disabled={ist.eksikZorunlu > 0} onClick={bitir}>
                  {ist.cevapsiz > 0 ? 'Yine de bitir' : 'Bitir'}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-6" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Kontrol fotoğrafı" className="max-h-[82vh] max-w-full rounded-xl object-contain" />
          <button type="button" aria-label="Kapat" className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white"><XIcon className="size-5" /></button>
        </div>
      )}
    </div>
  )
}
