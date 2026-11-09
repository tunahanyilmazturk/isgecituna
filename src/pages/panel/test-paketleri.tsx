import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PackageIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Alan, Sec } from '@/components/form-bits'
import { Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { xlsxTekSayfa } from '@/lib/excel'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ListeFooter, SecimBar } from '@/components/list-bits'
import { useTestPaketiStore, useTestStore } from '@/stores/saglik-stores'
import { HIZMET_TURLERI, type Test, type TestPaketi } from '@/data/saglik'
import { cn } from '@/lib/utils'
import { useOtomatikSatir } from '@/lib/otomatik-sayfa'

interface Form {
  ad: string
  hizmet: string
  aciklama: string
  testIdleri: string[]
}

const bosForm: Form = { ad: '', hizmet: HIZMET_TURLERI[0], aciklama: '', testIdleri: [] }

/** Seçilen testlerin aktif olanlarına göre toplam fiyat ve süre */
const ozetle = (testler: Test[], ids: string[]) => {
  const secilen = ids
    .map((id) => testler.find((t) => t.id === id))
    .filter((t): t is Test => !!t)
  const aktif = secilen.filter((t) => t.durum === 'Aktif')
  return {
    secilen,
    aktif,
    pasifSayi: secilen.length - aktif.length,
    fiyat: aktif.reduce((t, x) => t + x.fiyat, 0),
  }
}

export default function TestPaketleriPage() {
  const paketler = useTestPaketiStore((s) => s.kayitlar)
  const ekle = useTestPaketiStore((s) => s.ekle)
  const guncelle = useTestPaketiStore((s) => s.guncelle)
  const sil = useTestPaketiStore((s) => s.sil)
  const testler = useTestStore((s) => s.kayitlar)

  /** null: kapalı · 'yeni': yeni paket · paket: düzenleme */
  const [duzenle, setDuzenle] = useState<TestPaketi | 'yeni' | null>(null)
  const [form, setForm] = useState<Form>(bosForm)
  const [hata, setHata] = useState<string | null>(null)
  const [aramaTest, setAramaTest] = useState('')

  /* Liste: arama, sayfalama, toplu seçme / silme / Excel */
  const [aramaP, setAramaP] = useState('')
  const [secili, setSecili] = useState<string[]>([])
  const [sayfa, setSayfa] = useState(0)
  const [boyut, setBoyut] = useState<'oto' | number>('oto')
  const gridRef = useRef<HTMLDivElement>(null)
  const filtreli = useMemo(() => {
    const q = aramaP.toLocaleLowerCase('tr').trim()
    return paketler.filter((p) => !q || `${p.ad} ${p.hizmet}`.toLocaleLowerCase('tr').includes(q))
  }, [paketler, aramaP])
  /* Otomatik: ekrana sığacak kadar paket; sayfada kaydırma olmadan tek ekran */
  const otoSatir = useOtomatikSatir(gridRef, 'kart', [filtreli.length, secili.length])
  const boy = boyut === 'oto' ? otoSatir : boyut
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / boy))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const gosterilen = filtreli.slice(sayfaGuvenli * boy, sayfaGuvenli * boy + boy)
  const sayfaHepsiSecili = gosterilen.length > 0 && gosterilen.every((p) => secili.includes(p.id))
  const sayfayiSec = () =>
    setSecili((s) =>
      sayfaHepsiSecili ? s.filter((id) => !gosterilen.some((p) => p.id === id)) : Array.from(new Set([...s, ...gosterilen.map((p) => p.id)])),
    )
  const secimDegistir = (id: string) => setSecili((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const topluSil = () => {
    if (!window.confirm(`${secili.length} paket silinsin mi? Bu işlem geri alınamaz.`)) return
    secili.forEach((id) => sil(id))
    toast.success(`${secili.length} paket silindi`)
    setSecili([])
  }
  const excelAktar = () => {
    const satirlar = paketler
      .filter((p) => secili.includes(p.id))
      .map((p) => {
        const o = ozetle(testler, p.testIdleri)
        return [p.ad, p.hizmet, o.aktif.length, o.fiyat, p.aciklama]
      })
    void xlsxTekSayfa("Test paketleri", {
      ad: "Test paketleri",
      baslik: "Test paketleri",
      altBilgi: `${satirlar.length} paket`,
      kolonlar: [
        { label: "Paket", minGenislik: 24, wrap: true },
        { label: "Hizmet", minGenislik: 20 },
        { label: "Aktif test", tip: "sayi", minGenislik: 12 },
        { label: "Fiyat", tip: "para", minGenislik: 14 },
        { label: "Açıklama", minGenislik: 36, wrap: true },
      ],
      satirlar,
    })
  }

  const ac =(p: TestPaketi | 'yeni') => {
    setHata(null)
    setAramaTest('')
    setDuzenle(p)
    setForm(p === 'yeni' ? bosForm : { ad: p.ad, hizmet: p.hizmet, aciklama: p.aciklama, testIdleri: p.testIdleri })
  }
  const kapat = () => setDuzenle(null)

  const testTogle = (id: string) =>
    setForm((f) => ({
      ...f,
      testIdleri: f.testIdleri.includes(id) ? f.testIdleri.filter((x) => x !== id) : [...f.testIdleri, id],
    }))

  const kaydet = () => {
    if (!form.ad.trim()) return setHata('Paket adı zorunlu.')
    if (form.testIdleri.length === 0) return setHata('En az bir test seçin.')
    const veri = { ad: form.ad.trim(), hizmet: form.hizmet, aciklama: form.aciklama.trim(), testIdleri: form.testIdleri }
    if (duzenle === 'yeni') {
      ekle(veri)
      toast.success('Paket eklendi')
    } else if (duzenle) {
      guncelle(duzenle.id, veri)
      toast.success('Paket güncellendi')
    }
    kapat()
  }

  const paketSil = () => {
    if (duzenle && duzenle !== 'yeni') {
      if (!window.confirm('Bu paket silinsin mi? Bu işlem geri alınamaz.')) return
      sil(duzenle.id)
      toast.success('Paket silindi')
    }
    kapat()
  }

  const ozet = useMemo(() => (duzenle ? ozetle(testler, form.testIdleri) : null), [duzenle, testler, form.testIdleri])
  const aramaSonucu = useMemo(() => {
    const q = aramaTest.toLocaleLowerCase('tr').trim()
    return testler.filter((t) => !q || `${t.ad} ${t.kategori}`.toLocaleLowerCase('tr').includes(q))
  }, [testler, aramaTest])

  const duzenlenen = duzenle && duzenle !== 'yeni' ? duzenle : null

  return (
    <div className="relative space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <PackageIcon className="size-5 text-amber-500" aria-hidden />
            Test Paketleri
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hizmet türlerine göre test setleri. Fiyat ve süre, paketteki aktif testlerden hesaplanır.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={aramaP}
            onChange={(e) => {
              setAramaP(e.target.value)
              setSayfa(0)
            }}
            placeholder="Paket veya hizmet ara"
            aria-label="Paket ara"
            className="h-8 w-56"
          />
          <Button onClick={() => ac('yeni')}>
            <PlusIcon /> Yeni paket
          </Button>
        </div>
      </div>

      {paketler.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={sayfaHepsiSecili} onChange={sayfayiSec} disabled={gosterilen.length === 0} className="size-3.5 accent-amber-500" />
            Bu sayfayı seç
          </label>
          {secili.length > 0 && <span className="tabular-nums">{secili.length} paket seçili</span>}
        </div>
      )}

      {paketler.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-12 text-center">
          <PackageIcon className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">Henüz test paketi yok</p>
          <Button size="sm" onClick={() => ac('yeni')}>
            <PlusIcon /> Yeni paket
          </Button>
        </div>
      )}

      {paketler.length > 0 && filtreli.length === 0 && (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Aramanızla eşleşen paket yok.</p>
      )}

      <div ref={gridRef} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {gosterilen.map((p) => {
          const o = ozetle(testler, p.testIdleri)
          return (
            <article key={p.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{p.ad}</h2>
                  <Pill tone="amber" className="mt-1">
                    {p.hizmet}
                  </Pill>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <input
                    type="checkbox"
                    checked={secili.includes(p.id)}
                    onChange={() => secimDegistir(p.id)}
                    aria-label={`${p.ad} seç`}
                    className="size-3.5 accent-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => ac(p)}
                    aria-label={`${p.ad} düzenle`}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <PencilIcon className="size-3.5" />
                </button>
                </div>
              </div>
              {p.aciklama && <p className="text-xs text-muted-foreground">{p.aciklama}</p>}
              <div className="flex items-baseline justify-between gap-2 tabular-nums">
                <span className="text-xs text-muted-foreground">
                  {o.aktif.length} aktif test
                </span>
                <span className="text-base font-semibold">{o.fiyat.toLocaleString('tr-TR')} ₺</span>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {o.secilen.map((t) => (
                  <li key={t.id}>
                    <Pill tone={t.durum === 'Aktif' ? 'zinc' : 'red'} className={t.durum === 'Aktif' ? undefined : 'line-through'}>
                      {t.ad}
                    </Pill>
                  </li>
                ))}
              </ul>
              {o.pasifSayi > 0 && (
                <p className="text-[11px] text-red-600 dark:text-red-400">{o.pasifSayi} pasif test fiyata dahil edilmedi.</p>
              )}
            </article>
          )
        })}
      </div>

      {filtreli.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ListeFooter
            bas={sayfaGuvenli * boy + 1}
            son={sayfaGuvenli * boy + gosterilen.length}
            toplam={filtreli.length}
            sayfaGuvenli={sayfaGuvenli}
            sayfaSayisi={sayfaSayisi}
            sayfaBoyu={boyut}
            otoBoy={otoSatir}
            onBoyut={setBoyut}
            onSayfa={setSayfa}
          />
        </div>
      )}

      {secili.length > 0 && <SecimBar adet={secili.length} onAktar={excelAktar} onSil={topluSil} onKapat={() => setSecili([])} />}

      <Sheet open={duzenle !== null} onOpenChange={(o) => !o && kapat()}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="text-base">{duzenle === 'yeni' ? 'Yeni test paketi' : 'Paketi düzenle'}</SheetTitle>
            {duzenlenen && <p className="text-xs text-muted-foreground tabular-nums">{duzenlenen.id}</p>}
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Alan label="Paket adı *" className="col-span-2">
                <Input value={form.ad} onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))} className="h-8" />
              </Alan>
              <Alan label="Hizmet türü" className="col-span-2">
                <Sec value={form.hizmet} onChange={(v) => setForm((f) => ({ ...f, hizmet: v }))} options={HIZMET_TURLERI} />
              </Alan>
              <Alan label="Açıklama" className="col-span-2">
                <Input value={form.aciklama} onChange={(e) => setForm((f) => ({ ...f, aciklama: e.target.value }))} className="h-8" placeholder="İsteğe bağlı" />
              </Alan>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Testler ({form.testIdleri.length} seçili)</p>
                {ozet && (
                  <p className="text-xs tabular-nums">
                    <span className="font-semibold">{ozet.fiyat.toLocaleString("tr-TR")} ₺</span>
                  </p>
                )}
              </div>
              <Input value={aramaTest} onChange={(e) => setAramaTest(e.target.value)} placeholder="Test ara" className="h-8" aria-label="Test ara" />
              <ul className="divide-y overflow-hidden rounded-lg border">
                {aramaSonucu.map((t) => {
                  const secili = form.testIdleri.includes(t.id)
                  return (
                    <li key={t.id}>
                      <label className={cn('flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50', secili && 'bg-amber-400/10')}>
                        <input type="checkbox" checked={secili} onChange={() => testTogle(t.id)} className="size-4 accent-amber-500" />
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate text-sm font-medium', t.durum === 'Pasif' && 'text-muted-foreground line-through')}>
                            {t.ad}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {t.kategori}
                            {t.durum === 'Pasif' && ' · pasif'}
                          </span>
                        </span>
                        <span className="text-xs font-medium tabular-nums">{t.fiyat.toLocaleString('tr-TR')} ₺</span>
                      </label>
                    </li>
                  )
                })}
                {aramaSonucu.length === 0 && <li className="px-3 py-4 text-center text-xs text-muted-foreground">Eşleşen test yok.</li>}
              </ul>
              {ozet && ozet.pasifSayi > 0 && (
                <p className="text-[11px] text-red-600 dark:text-red-400">{ozet.pasifSayi} pasif test fiyata dahil edilmez.</p>
              )}
            </div>

            {hata && (
              <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {hata}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t px-5 py-3">
            {duzenlenen && (
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-600" onClick={paketSil}>
                <Trash2Icon /> Sil
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={kapat}>
                Vazgeç
              </Button>
              <Button size="sm" onClick={kaydet}>
                Kaydet
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
