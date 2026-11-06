import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CheckCircle2Icon,
  CircleIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  PlayIcon,
  SparklesIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { OnSinavKayit, Sinav } from '@/data/egitimler'

const karistir = <T,>(liste: T[]): T[] => {
  const k = [...liste]
  for (let i = k.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[k[i], k[j]] = [k[j], k[i]]
  }
  return k
}

/** Ön sınav: düşük baskılı, puanı eğitime devamı etkilemeyen başlangıç değerlendirmesi. */
export function OnSinavEkrani({
  egitimBaslik,
  sinav,
  onKaydet,
  onDevam,
}: {
  egitimBaslik: string
  sinav: Sinav
  onKaydet: (kayit: OnSinavKayit) => void
  onDevam: () => void
}) {
  const [basladi, setBasladi] = useState(false)
  const [aktifSoru, setAktifSoru] = useState(0)
  const [cevaplar, setCevaplar] = useState<Record<string, number[]>>({})
  const [sonuc, setSonuc] = useState<OnSinavKayit | null>(null)
  const sorular = useMemo(() => (sinav.ayarlar.soruKaristir ? karistir(sinav.sorular) : sinav.sorular), [sinav])
  const secenekSirasi = useMemo(
    () => Object.fromEntries(
      sorular.map((s) => [s.id, sinav.ayarlar.sikKaristir ? karistir(s.secenekler.map((_, i) => i)) : s.secenekler.map((_, i) => i)]),
    ),
    [sorular, sinav.ayarlar.sikKaristir],
  )
  const cevaplanan = sorular.filter((s) => !!cevaplar[s.id]?.length).length
  const aktif = sorular[aktifSoru]

  const sec = (soruId: string, ix: number, coklu: boolean) =>
    setCevaplar((c) => {
      const mevcut = c[soruId] ?? []
      if (coklu) return { ...c, [soruId]: mevcut.includes(ix) ? mevcut.filter((x) => x !== ix) : [...mevcut, ix] }
      return { ...c, [soruId]: [ix] }
    })

  const bitir = () => {
    const ilkEksik = sorular.findIndex((s) => !cevaplar[s.id]?.length)
    if (ilkEksik >= 0) {
      setAktifSoru(ilkEksik)
      toast.error(`${ilkEksik + 1}. soru henüz yanıtlanmadı`)
      return
    }
    let alinan = 0
    let toplam = 0
    const soruSonuc: Record<string, boolean> = {}
    for (const s of sorular) {
      toplam += s.puan
      const c = [...(cevaplar[s.id] ?? [])].sort()
      const d = [...s.dogru].sort()
      const ok = c.length === d.length && c.every((x, i) => x === d[i])
      soruSonuc[s.id] = ok
      if (ok) alinan += s.puan
    }
    const kayit: OnSinavKayit = {
      tarih: new Date().toISOString(),
      toplam: sorular.length,
      dogruSayisi: Object.values(soruSonuc).filter(Boolean).length,
      puan: toplam ? Math.round((alinan / toplam) * 100) : 0,
      soruSonuc,
      cevaplar,
    }
    setSonuc(kayit)
    onKaydet(kayit)
  }

  if (sonuc) {
    const yuzde = sonuc.toplam ? Math.round((sonuc.dogruSayisi / sonuc.toplam) * 100) : 0
    return (
      <div className="mx-auto flex min-h-full w-full max-w-5xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-zinc-950 p-6 text-white sm:p-8 lg:min-h-[420px] lg:p-10">
            <div className="absolute -right-16 -bottom-24 size-80 rounded-full border border-amber-400/20" />
            <div className="absolute -right-5 -bottom-14 size-56 rounded-full border border-amber-400/25" />
            <div className="relative flex items-center gap-2 text-xs font-medium text-amber-300"><CheckCircle2Icon className="size-4" /> Başlangıç değerlendirmesi tamamlandı</div>
            <div className="relative mt-8 lg:mt-auto">
              <p className="text-xs text-white/55">İlk ölçümün</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{sonuc.dogruSayisi}<span className="text-white/45"> / {sonuc.toplam}</span></p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">Bu sonuç başlangıç seviyeni gösterir. Eğitime devam etmeni veya tamamlamanı etkilemez.</p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-4">
              <div className="relative grid size-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#f59e0b ${yuzde}%, rgb(161 161 170 / .18) 0)` }}>
                <div className="grid size-[4.25rem] place-items-center rounded-full bg-card text-lg font-semibold tabular-nums">%{yuzde}</div>
              </div>
              <div><p className="text-lg font-semibold">Öğrenme yolculuğun hazır</p><p className="mt-1 text-sm text-muted-foreground">Yanıtların kaydedildi. Şimdi konu anlatımlarına geçebilirsin.</p></div>
            </div>
            <div className="mt-7 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-start gap-3"><SparklesIcon className="mt-0.5 size-4 shrink-0 text-amber-500" /><p className="text-sm leading-relaxed text-muted-foreground">Doğru yanıtlar bu aşamada gösterilmez. Eğitim sonunda öğrendiklerini yeniden değerlendirebilirsin.</p></div>
            </div>
            <Button className="mt-6 h-11 w-full sm:w-auto" onClick={onDevam}><PlayIcon /> İlk derse geç</Button>
          </div>
        </section>
      </div>
    )
  }

  if (!basladi) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-6xl items-center px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-56 flex-col justify-between overflow-hidden bg-zinc-950 p-5 text-white sm:min-h-72 sm:p-8 lg:min-h-[460px] lg:p-10">
            <div className="absolute -right-14 -bottom-20 size-64 rounded-full border border-amber-400/20 sm:size-80" />
            <div className="absolute -right-2 -bottom-12 size-48 rounded-full border border-amber-400/25 sm:size-60" />
            <div className="relative flex items-center gap-2 text-xs font-medium text-amber-300"><ClipboardListIcon className="size-4" /> Kısa başlangıç kontrolü</div>
            <div className="relative mt-7 max-w-lg lg:mt-auto">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Önce bildiklerini görelim.</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65 sm:text-base">Bu kısa değerlendirme nereden başlayacağımızı anlamamıza yardımcı olur. Bilmiyorsan tahmin edebilir, soruları boş bırakmadan ilerleyebilirsin.</p>
            </div>
            <div className="relative mt-6 flex items-center gap-3 border-t border-white/10 pt-4 text-xs text-white/55 lg:mt-10">
              <GraduationCapIcon className="size-4 text-amber-300" />
              <span className="line-clamp-1">{egitimBaslik}</span>
            </div>
          </div>
          <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
            <p className="text-sm font-semibold">Başlamadan önce</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{sinav.aciklama || 'Eğitim öncesi kısa bir bilgi değerlendirmesi.'}</p>
            <div className="mt-6 divide-y rounded-2xl border">
              <div className="flex items-center gap-3 p-3.5 sm:p-4"><span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><ClipboardCheckIcon className="size-4" /></span><div><p className="text-sm font-medium">{sorular.length} kısa soru</p><p className="mt-0.5 text-xs text-muted-foreground">Tek tek ilerle, istediğinde önceki sorulara dön.</p></div></div>
              <div className="flex items-center gap-3 p-3.5 sm:p-4"><span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground"><SparklesIcon className="size-4" /></span><div><p className="text-sm font-medium">Süre sınırı yok</p><p className="mt-0.5 text-xs text-muted-foreground">Kendi hızında ilerleyebilirsin.</p></div></div>
              <div className="flex items-center gap-3 p-3.5 sm:p-4"><span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckIcon className="size-4" /></span><div><p className="text-sm font-medium">Puan baskısı yok</p><p className="mt-0.5 text-xs text-muted-foreground">Sonuç eğitime erişimini etkilemez.</p></div></div>
            </div>
            <Button className="mt-6 h-11 w-full" onClick={() => setBasladi(true)}>Değerlendirmeye başla <ArrowRightIcon /></Button>
          </div>
        </section>
      </div>
    )
  }

  if (!aktif) return null

  const seciliCevaplar = cevaplar[aktif.id] ?? []
  const soruTamam = !!seciliCevaplar.length
  const ilkEksik = sorular.findIndex((s) => !cevaplar[s.id]?.length)
  const bitisHazir = cevaplanan === sorular.length
  const sonraki = () => setAktifSoru((ix) => Math.min(sorular.length - 1, ix + 1))
  const onceki = () => setAktifSoru((ix) => Math.max(0, ix - 1))

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-3 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-5 lg:px-8">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
        <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{egitimBaslik}</p><h2 className="mt-0.5 truncate text-base font-semibold sm:text-lg">Başlangıç değerlendirmesi</h2></div>
        <div className="shrink-0 text-right"><p className="text-xs text-muted-foreground">Yanıtlandı</p><p className="text-sm font-semibold tabular-nums">{cevaplanan} <span className="font-normal text-muted-foreground">/ {sorular.length}</span></p></div>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted sm:mb-6"><div className="h-full rounded-full bg-amber-500 transition-[width] duration-200" style={{ width: `${sorular.length ? (cevaplanan / sorular.length) * 100 : 0}%` }} /></div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-6">
        <nav aria-label="Soru seçimi" className="order-1 rounded-2xl border bg-card p-3 lg:p-4">
          <div className="mb-3 hidden items-center justify-between lg:flex"><p className="text-sm font-semibold">Sorular</p><span className="text-[11px] text-muted-foreground">İstediğine geç</span></div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
            {sorular.map((s, i) => {
              const yanitlandi = !!cevaplar[s.id]?.length
              return <button key={s.id} type="button" aria-label={`Soru ${i + 1}${yanitlandi ? ', yanıtlandı' : ', yanıtlanmadı'}`} aria-current={i === aktifSoru ? 'step' : undefined} onClick={() => setAktifSoru(i)} className={cn('grid size-9 shrink-0 place-items-center rounded-xl border text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500', i === aktifSoru ? 'border-amber-500 bg-amber-500 text-zinc-950' : yanitlandi ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-background text-muted-foreground hover:border-foreground/25')}>
                {yanitlandi && i !== aktifSoru ? <CheckIcon className="size-4" /> : i + 1}
              </button>
            })}
          </div>
          <div className="mt-4 hidden border-t pt-3 text-xs leading-relaxed text-muted-foreground lg:block">Yanıtını değiştirmek için istediğin soruyu seçebilirsin.</div>
        </nav>

        <section className="order-2 flex min-w-0 flex-col rounded-2xl border bg-card p-4 sm:p-6 lg:p-8" aria-labelledby="on-sinav-soru">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2"><span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">Soru {aktifSoru + 1}</span>{aktif.tur === 'coklu' && <span className="pt-0.5 text-xs text-muted-foreground">Birden fazla seç</span>}</div>
            <span className="text-xs text-muted-foreground">{sorular.length} sorudan {aktifSoru + 1}. soru</span>
          </div>
          <h3 id="on-sinav-soru" className="mt-4 text-lg leading-snug font-semibold sm:mt-6 sm:text-xl lg:text-2xl">{aktif.soru}</h3>
          <div className="mt-5 grid gap-2 sm:mt-7 sm:grid-cols-2 sm:gap-3">
            {secenekSirasi[aktif.id].map((oi, optionIx) => {
              const secili = seciliCevaplar.includes(oi)
              const coklu = aktif.tur === 'coklu'
              return <button key={oi} type="button" role={coklu ? 'checkbox' : 'radio'} aria-checked={secili} onClick={() => sec(aktif.id, oi, coklu)} className={cn('group flex min-h-14 items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:min-h-16 sm:px-4', secili ? 'border-amber-500/70 bg-amber-500/10' : 'hover:border-foreground/25 hover:bg-muted/30')}>
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg border text-[11px] font-semibold', secili ? 'border-amber-500 bg-amber-500 text-zinc-950' : 'border-border bg-background text-muted-foreground group-hover:border-foreground/30')}>{String.fromCharCode(65 + optionIx)}</span>
                <span className="min-w-0 flex-1 leading-relaxed">{aktif.secenekler[oi]}</span>
                {secili ? <CheckCircle2Icon className="size-[18px] shrink-0 text-amber-600 dark:text-amber-400" /> : <CircleIcon className="size-[18px] shrink-0 text-muted-foreground/35" />}
              </button>
            })}
          </div>
          <div className="mt-auto pt-5 sm:pt-7">
            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <Button variant="outline" size="sm" onClick={onceki} disabled={aktifSoru === 0}><ArrowLeftIcon /> <span className="hidden sm:inline">Önceki</span></Button>
              <p className="hidden text-xs text-muted-foreground sm:block">Yanıtın otomatik kaydedilir</p>
              {aktifSoru < sorular.length - 1 ? <Button size="sm" onClick={sonraki}>{soruTamam ? 'Sonraki soru' : 'Atla'} <ArrowRightIcon /></Button> : bitisHazir ? <Button size="sm" onClick={bitir}><CheckIcon /> Değerlendirmeyi bitir</Button> : <Button size="sm" variant="outline" onClick={() => setAktifSoru(ilkEksik)}>{ilkEksik + 1}. soruya git <ArrowRightIcon /></Button>}
            </div>
            {!bitisHazir && aktifSoru === sorular.length - 1 && <p className="mt-2 text-right text-xs text-muted-foreground">Bitirmek için tüm soruları yanıtla · {sorular.length - cevaplanan} kaldı</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
