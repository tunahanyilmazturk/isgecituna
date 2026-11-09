import { useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeftIcon, BuildingIcon, ChevronDownIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { Button } from '@saglik/components/ui/button'
import { Input } from '@saglik/components/ui/input'
import { Pill } from '@saglik/components/pill'
import { cn } from '@saglik/lib/utils'
import { FIRMA_ILLERI, type Firma } from '@saglik/data/firmalar'
import { toast } from 'sonner'

/* ----------------------------- Firma seçici ----------------------------- */

type HizliForm = { unvan: string; kisaAd: string; il: string; yetkili: string; telefon: string; eposta: string }
const BOS_FORM: HizliForm = { unvan: '', kisaAd: '', il: FIRMA_ILLERI[0], yetkili: '', telefon: '', eposta: '' }

/**
 * Firma seçici: aranabilir liste. `onHizliEkle` verilirse listenin altında "Yeni firma" açılır;
 * kısa formla firma kaydedilip hemen seçilir. Tam kayıt için firmalar sayfası kullanılır.
 */
export function FirmaSecici({
  firmalar,
  deger,
  onSec,
  onHizliEkle,
}: {
  firmalar: Firma[]
  deger: string
  onSec: (unvan: string) => void
  onHizliEkle?: (firma: Omit<Firma, 'id'>) => string
}) {
  const [acik, setAcik] = useState(false)
  const [ara, setAra] = useState('')
  const [formAcik, setFormAcik] = useState(false)
  const [form, setForm] = useState<HizliForm>(BOS_FORM)
  const [hata, setHata] = useState<string | null>(null)
  const [yer, setYer] = useState<{ top: number; left: number; width: number } | null>(null)
  const butonRef = useRef<HTMLButtonElement>(null)
  const secili = firmalar.find((f) => f.unvan === deger)

  const liste = useMemo(() => {
    const q = ara.toLocaleLowerCase('tr').trim()
    return firmalar.filter((f) => `${f.unvan} ${f.kisaAd} ${f.il} ${f.yetkili}`.toLocaleLowerCase('tr').includes(q))
  }, [firmalar, ara])

  const ac = () => {
    const r = butonRef.current?.getBoundingClientRect()
    if (r) setYer({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 340) })
    setAcik(true)
  }
  const kapat = () => {
    setAcik(false)
    setAra('')
    setFormAcik(false)
    setForm(BOS_FORM)
    setHata(null)
  }

  const hizliKaydet = (e: FormEvent) => {
    e.preventDefault()
    const unvan = form.unvan.trim()
    if (!unvan) return setHata('Firma unvanı gerekli.')
    if (firmalar.some((f) => f.unvan.toLocaleLowerCase('tr') === unvan.toLocaleLowerCase('tr'))) return setHata('Bu unvanla kayıtlı bir firma var.')
    if (!onHizliEkle) return
    onHizliEkle({
      unvan,
      kisaAd: form.kisaAd.trim() || unvan,
      il: form.il,
      adres: '',
      vergiDairesi: '',
      vergiNo: '',
      yetkili: form.yetkili.trim(),
      telefon: form.telefon.trim(),
      eposta: form.eposta.trim(),
      durum: 'Aktif',
    })
    onSec(unvan)
    toast.success(`${unvan} eklendi ve seçildi`)
    kapat()
  }

  return (
    <div className="min-w-0">
      <button
        ref={butonRef}
        type="button"
        onClick={() => (acik ? kapat() : ac())}
        aria-expanded={acik}
        aria-haspopup="listbox"
        className={cn(
          'flex h-11 w-full items-center gap-2.5 rounded-lg border bg-background px-3 text-left text-sm shadow-sm transition-colors hover:bg-muted/40',
          acik && 'border-amber-400 ring-1 ring-amber-400/50',
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-amber-600 dark:text-amber-400">
          <BuildingIcon className="size-3.5" />
        </span>
        <span className={cn('min-w-0 flex-1 truncate font-medium', !secili && 'font-normal text-muted-foreground')}>
          {secili ? secili.unvan : 'Firma seçin veya arayın…'}
        </span>
        <ChevronDownIcon className={cn('size-4 shrink-0 text-muted-foreground transition-transform', acik && 'rotate-180')} />
      </button>
      {acik &&
        yer &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={kapat} />
            <div style={{ top: yer.top, left: yer.left, width: yer.width }} className="fixed z-50 rounded-xl border bg-popover p-2 shadow-xl">
              {!formAcik ? (
                <>
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Firma adı, il veya yetkili ara" aria-label="Firma ara" className="h-8 pl-8" />
                    </div>
                    {onHizliEkle && (
                      <Button size="sm" variant="outline" onClick={() => setFormAcik(true)} aria-label="Yeni firma ekle" title="Yeni firma ekle" className="shrink-0">
                        <PlusIcon /> Yeni
                      </Button>
                    )}
                  </div>
                  <ul role="listbox" className="max-h-72 space-y-0.5 overflow-y-auto">
                    {liste.map((f) => (
                      <li key={f.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={f.unvan === deger}
                          onClick={() => {
                            onSec(f.unvan)
                            kapat()
                          }}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted',
                            f.unvan === deger && 'bg-amber-400/10 font-semibold',
                          )}
                        >
                          <span className="min-w-0 truncate">{f.unvan}</span>
                          <span className="shrink-0 text-muted-foreground">{f.il}</span>
                        </button>
                      </li>
                    ))}
                    {liste.length === 0 && (
                      <li className="px-2.5 py-3 text-center text-xs text-muted-foreground">
                        Eşleşen firma yok.
                        {onHizliEkle && (
                          <button type="button" onClick={() => { setForm({ ...BOS_FORM, unvan: ara.trim() }); setFormAcik(true) }} className="mt-1 block w-full font-medium text-amber-700 hover:underline dark:text-amber-400">
                            “{ara.trim() || 'Yeni firma'}” olarak ekle
                          </button>
                        )}
                      </li>
                    )}
                  </ul>
                </>
              ) : (
                <form onSubmit={hizliKaydet} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Button type="button" size="xs" variant="ghost" onClick={() => { setFormAcik(false); setHata(null) }} aria-label="Listeye dön" className="px-1.5">
                      <ArrowLeftIcon />
                    </Button>
                    <p className="text-xs font-semibold">Hızlı firma ekle</p>
                    <span className="ml-auto text-[10px] text-muted-foreground">Ayrıntıları firmalar sayfasından tamamlayabilirsiniz</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="col-span-2 space-y-1 text-[11px] font-medium text-muted-foreground">
                      Unvan <span className="text-red-600">*</span>
                      <Input autoFocus value={form.unvan} onChange={(e) => setForm({ ...form, unvan: e.target.value })} placeholder="Örn. Örnek Lojistik A.Ş." className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Kısa ad
                      <Input value={form.kisaAd} onChange={(e) => setForm({ ...form, kisaAd: e.target.value })} placeholder="Boşsa unvan kullanılır" className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      İl
                      <select value={form.il} onChange={(e) => setForm({ ...form, il: e.target.value })} className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs font-normal text-foreground outline-none focus-visible:border-ring">
                        {FIRMA_ILLERI.map((il) => (
                          <option key={il} value={il}>
                            {il}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Yetkili
                      <Input value={form.yetkili} onChange={(e) => setForm({ ...form, yetkili: e.target.value })} className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-muted-foreground">
                      Telefon
                      <Input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} placeholder="0 5xx …" className="h-8 text-xs font-normal text-foreground" />
                    </label>
                    <label className="col-span-2 space-y-1 text-[11px] font-medium text-muted-foreground">
                      E-posta
                      <Input type="email" value={form.eposta} onChange={(e) => setForm({ ...form, eposta: e.target.value })} className="h-8 text-xs font-normal text-foreground" />
                    </label>
                  </div>
                  {hata && <p role="alert" className="text-[11px] text-red-600 dark:text-red-400">{hata}</p>}
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => { setFormAcik(false); setHata(null) }}>
                      Vazgeç
                    </Button>
                    <Button type="submit" size="sm" className="bg-amber-400 text-zinc-950 hover:bg-amber-300">
                      Kaydet ve seç
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}

/** Seçili firmanın özet kartı (çalışan sayısı dahil) */
export function FirmaOzet({ firma, calisan }: { firma?: Firma; calisan: number }) {
  if (!firma)
    return (
      <div className="hidden min-h-11 items-center rounded-lg border border-dashed bg-background/60 px-3 text-xs text-muted-foreground sm:flex">
        Seçtiğiniz firmanın özeti burada görünür.
      </div>
    )
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{firma.kisaAd}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums">{calisan} çalışan</span>
          <Pill tone={firma.durum === 'Aktif' ? 'green' : 'zinc'}>{firma.durum}</Pill>
        </div>
      </div>
      <dl className="mt-1 hidden grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] sm:grid">
        <div className="flex gap-1.5"><dt className="text-muted-foreground">Unvan</dt><dd className="truncate font-medium">{firma.unvan}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted-foreground">İl</dt><dd className="font-medium">{firma.il}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted-foreground">Yetkili</dt><dd className="truncate font-medium">{firma.yetkili}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted-foreground">Telefon</dt><dd className="font-medium tabular-nums">{firma.telefon}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted-foreground">Vergi</dt><dd className="truncate font-medium tabular-nums">{firma.vergiDairesi} · {firma.vergiNo}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted-foreground">E-posta</dt><dd className="truncate font-medium">{firma.eposta}</dd></div>
      </dl>
    </div>
  )
}
