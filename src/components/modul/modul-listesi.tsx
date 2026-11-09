import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
  Trash2Icon,
  UserRoundIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fotoKucult } from '@/lib/foto'
import { Alan, Sec } from '@/components/form-bits'
import { CipGrup, GorunumSec, StatSerit, type StatOge } from '@/components/list-bits'
import { Button } from '@/components/ui/button'
import { xlsxTekSayfa, type ExcelHucre, type ExcelTip } from '@/lib/excel'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useOtomatikSatir } from '@/lib/otomatik-sayfa'

export type AlanTipi = 'metin' | 'sayi' | 'tarih' | 'secim' | 'uzun' | 'foto'

/** Fotoğraf alanı: dosya seçilir, kare kırpılıp küçültülür; data URL olarak saklanır. */
function FotoAlani({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hata, setHata] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <UserRoundIcon className="size-6 text-muted-foreground/60" />
        )}
      </span>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-7 cursor-pointer items-center rounded-lg border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const dosya = e.target.files?.[0]
                e.target.value = ''
                if (!dosya) return
                try {
                  onChange(await fotoKucult(dosya))
                  setHata(null)
                } catch (err) {
                  setHata(err instanceof Error ? err.message : 'Fotoğraf yüklenemedi.')
                }
              }}
            />
            Fotoğraf yükle
          </label>
          {value && (
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange('')}>
              Kaldır
            </Button>
          )}
        </div>
        <p className={cn('text-[11px]', hata ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
          {hata ?? 'Otomatik kare kırpılır. Fotoğraf yoksa cinsiyete göre avatar gösterilir.'}
        </p>
      </div>
    </div>
  )
}

export interface FormAlan<T> {
  key: keyof T & string
  label: string
  tip: AlanTipi
  secenekler?: readonly string[]
  zorunlu?: boolean
  /** Formda iki sütun kaplasın */
  genis?: boolean
  placeholder?: string
}

export interface Kolon<T> {
  baslik: string
  hucre: (k: T) => ReactNode
  sinif?: string
  /** Verilirse sütun başlığına tıklayınca bu değere göre sıralanır */
  siralama?: (k: T) => string | number
}

interface ModulListesiProps<T extends { id: string }> {
  baslik: string
  aciklama: string
  ikon: LucideIcon
  /** Tekil kayıt adı: "teklif", "test" … (form ve bildirim metinlerinde) */
  kayitAdi: string
  yeniEtiket: string
  /** Verilirse "yeni" düğmesi panel yerine bu rotaya gider (ör. adım adım sihirbaz) */
  yeniHref?: string
  kayitlar: T[]
  alanlar: FormAlan<T>[]
  kolonlar: Kolon<T>[]
  /** Arama kutusunun baktığı metin */
  aramaMetni: (k: T) => string
  /** Hızlı durum filtresi (opsiyonel) */
  durum?: { alan: keyof T & string; secenekler: readonly string[] }
  /** Ek açılır-liste filtreleri (ör. kategori) */
  ekFiltreler?: { alan: keyof T & string; etiket: string; secenekler: readonly string[] }[]
  istatistik: (kayitlar: T[]) => StatOge[]
  /** İstatistik şeridinin altına, liste üstüne eklenen özel içerik (opsiyonel) */
  ustBolum?: ReactNode
  yeniVarsayilan: () => Omit<T, 'id'>
  onEkle: (k: Omit<T, 'id'>) => void
  onGuncelle: (id: string, patch: Partial<T>) => void
  onSil: (id: string) => void
  /** Sayfa ilk açıldığında arama kutusuna yazılacak metin (ör. URL'den gelen firma adı) */
  ilkArama?: string
  /** Verilirse sayfa açılışında bu değerlerle "yeni kayıt" paneli açılır */
  ilkYeni?: Partial<Omit<T, "id">>
  /** Verilirse satıra tıklanınca düzenleme penceresi yerine bu adrese gidilir */
  satirHref?: (k: T) => string
  /** Seçili kayıtlar üzerinde uygulanan ek toplu işlemler */
  topluEylemler?: { etiket: string; onUygula: (ids: string[]) => void }[]
}

type FormDeger = Record<string, string>
type Gorunum = 'liste' | 'kart'

const SAYFA_BOYLARI = [10, 20, 50] as const

const formaCevir = <T extends { id: string }>(alanlar: FormAlan<T>[], k: Partial<T>): FormDeger =>
  Object.fromEntries(alanlar.map((a) => [a.key, k[a.key] == null ? '' : String(k[a.key])]))

/** Seçili kayıtları alan sırasına göre Excel (.xlsx) dosyası olarak indirir; sayı ve tarihler doğru türde yazılır. */
const excelIndir = <T extends { id: string }>(baslik: string, alanlar: FormAlan<T>[], satirlar: T[]) => {
  const tipCevir = (a: FormAlan<T>): ExcelTip => (a.tip === 'sayi' ? 'sayi' : a.tip === 'tarih' ? 'tarih' : 'metin')
  return xlsxTekSayfa(baslik, {
    ad: baslik.slice(0, 28),
    baslik,
    altBilgi: `${satirlar.length} kayıt`,
    kolonlar: alanlar.map((a) => ({ label: a.label, tip: tipCevir(a), minGenislik: 12, maxGenislik: 40, wrap: a.tip === 'uzun' })),
    satirlar: satirlar.map((k) => alanlar.map((a) => (k[a.key] ?? null) as ExcelHucre)),
  })
}

export function ModulListesi<T extends { id: string }>({
  baslik,
  aciklama,
  ikon: Ikon,
  kayitAdi,
  yeniEtiket,
  yeniHref,
  kayitlar,
  alanlar,
  kolonlar,
  aramaMetni,
  durum,
  ekFiltreler = [],
  istatistik,
  ustBolum,
  yeniVarsayilan,
  onEkle,
  onGuncelle,
  onSil,
  ilkArama = '',
  ilkYeni,
  satirHref,
  topluEylemler,
}: ModulListesiProps<T>) {
  const navigate = useNavigate()
  const [q, setQ] = useState(ilkArama)
  const [durumSec, setDurumSec] = useState<string>('Tümü')
  const [ekSecim, setEkSecim] = useState<Record<string, string>>({})
  /** null: kapalı · 'yeni': yeni kayıt · T: düzenleme */
  const [duzenle, setDuzenle] = useState<T | 'yeni' | null>(ilkYeni ? 'yeni' : null)
  const [form, setForm] = useState<FormDeger>(() =>
    ilkYeni ? formaCevir(alanlar, { ...yeniVarsayilan(), ...ilkYeni } as Partial<T>) : {},
  )
  const [hata, setHata] = useState<string | null>(null)

  const [gorunum, setGorunum] = useState<Gorunum>('liste')
  const [sayfaBoyu, setSayfaBoyu] = useState<number | 'oto'>('oto')
  const listeRef = useRef<HTMLDivElement>(null)
  const [sayfa, setSayfa] = useState(0)
  const [siralama, setSiralama] = useState<{ kolon: number; yon: 1 | -1 } | null>(null)
  const [secili, setSecili] = useState<Set<string>>(new Set())

  const filtreli = useMemo(() => {
    const arama = q.toLocaleLowerCase('tr').trim()
    const liste = kayitlar.filter((k) => {
      if (durum && durumSec !== 'Tümü' && String(k[durum.alan]) !== durumSec) return false
      for (const f of ekFiltreler) {
        const s = ekSecim[f.alan]
        if (s && s !== 'Tümü' && String(k[f.alan]) !== s) return false
      }
      return !arama || aramaMetni(k).toLocaleLowerCase('tr').includes(arama)
    })
    if (!siralama) return liste
    const kol = kolonlar[siralama.kolon]
    if (!kol?.siralama) return liste
    const deger = kol.siralama
    return [...liste].sort((a, b) => {
      const x = deger(a)
      const y = deger(b)
      return (x > y ? 1 : x < y ? -1 : 0) * siralama.yon
    })
  }, [kayitlar, q, durumSec, durum, ekFiltreler, ekSecim, aramaMetni, siralama, kolonlar])

  /* Otomatik: ekrana sığacak kadar kayıt; sayfada kaydırma olmadan tek ekran */
  const otoSatir = useOtomatikSatir(listeRef, gorunum === 'liste' ? 'liste' : 'kart', [gorunum, filtreli.length, secili.size, kayitlar.length])
  const boy = sayfaBoyu === 'oto' ? otoSatir : sayfaBoyu
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / boy))
  const aktifSayfa = Math.min(sayfa, sayfaSayisi - 1)
  const gorunen = filtreli.slice(aktifSayfa * boy, aktifSayfa * boy + boy)

  // Filtre değişince ilk sayfaya dön ve seçimi temizle
  useEffect(() => {
    setSayfa(0)
    setSecili(new Set())
  }, [q, durumSec, ekSecim, siralama?.kolon, siralama?.yon, sayfaBoyu])

  const filtreAktif = q.trim() !== '' || durumSec !== 'Tümü' || Object.values(ekSecim).some((v) => v && v !== 'Tümü')

  const tumuSecili = gorunen.length > 0 && gorunen.every((k) => secili.has(k.id))
  const secimDegistir = (id: string) =>
    setSecili((s) => {
      const yeni = new Set(s)
      if (yeni.has(id)) yeni.delete(id)
      else yeni.add(id)
      return yeni
    })
  const sayfayiSec = () =>
    setSecili((s) => {
      const yeni = new Set(s)
      if (tumuSecili) gorunen.forEach((k) => yeni.delete(k.id))
      else gorunen.forEach((k) => yeni.add(k.id))
      return yeni
    })

  const siralaTikla = (i: number) =>
    setSiralama((s) => (s?.kolon === i ? (s.yon === 1 ? { kolon: i, yon: -1 } : null) : { kolon: i, yon: 1 }))

  const ac = (k: T | 'yeni') => {
    setHata(null)
    setDuzenle(k)
    setForm(k === 'yeni' ? formaCevir(alanlar, yeniVarsayilan() as Partial<T>) : formaCevir(alanlar, k))
  }

  const kapat = () => setDuzenle(null)
  const satirAc = (k: T) => (satirHref ? navigate(satirHref(k)) : ac(k))

  const kaydet = () => {
    for (const a of alanlar) {
      const v = (form[a.key] ?? '').trim()
      if (a.zorunlu && !v) {
        setHata(`"${a.label}" alanı zorunlu.`)
        return
      }
      if (a.tip === 'sayi' && v && Number.isNaN(Number(v))) {
        setHata(`"${a.label}" alanına sayı girin.`)
        return
      }
    }
    const veri = Object.fromEntries(
      alanlar.map((a) => {
        const v = (form[a.key] ?? '').trim()
        return [a.key, a.tip === 'sayi' ? Number(v || 0) : v]
      }),
    ) as Partial<T>

    if (duzenle === 'yeni') {
      onEkle({ ...yeniVarsayilan(), ...veri } as Omit<T, 'id'>)
      toast.success(`${kayitAdi[0].toLocaleUpperCase('tr') + kayitAdi.slice(1)} eklendi`)
    } else if (duzenle) {
      onGuncelle(duzenle.id, veri)
      toast.success('Kayıt güncellendi')
    }
    kapat()
  }

  const sil = () => {
    if (duzenle && duzenle !== 'yeni') {
      if (!window.confirm('Bu kayıt silinsin mi? Bu işlem geri alınamaz.')) return
      onSil(duzenle.id)
      toast.success('Kayıt silindi')
    }
    kapat()
  }

  const topluSil = () => {
    const ids = [...secili]
    if (ids.length === 0) return
    if (!window.confirm(`${ids.length} kayıt silinsin mi? Bu işlem geri alınamaz.`)) return
    ids.forEach((id) => onSil(id))
    setSecili(new Set())
    toast.success(`${ids.length} kayıt silindi`)
  }

  const topluAktar = () => {
    const satirlar = kayitlar.filter((k) => secili.has(k.id))
    void excelIndir(`${baslik} · seçili`, alanlar, satirlar)
  }

  const duzenlenen = duzenle && duzenle !== 'yeni' ? duzenle : null
  const [ilkKolon, ...digerKolonlar] = kolonlar

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Ikon className="size-5 text-amber-500" aria-hidden />
            {baslik}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{aciklama}</p>
        </div>
        <Button
          onClick={() => (yeniHref ? navigate(yeniHref) : ac("yeni"))}
          className={yeniHref ? "bg-amber-400 text-zinc-950 hover:bg-amber-300" : undefined}
        >
          <PlusIcon /> {yeniEtiket}
        </Button>
      </div>

      <StatSerit ogeler={istatistik(kayitlar)} />

      {ustBolum}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`${baslik} içinde ara`}
            aria-label={`${baslik} içinde ara`}
            className="h-8 pl-8"
          />
        </div>
        {durum && <CipGrup secenekler={['Tümü', ...durum.secenekler]} value={durumSec} onChange={setDurumSec} />}
        {ekFiltreler.map((f) => (
          <label key={f.alan} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="sr-only sm:not-sr-only">{f.etiket}</span>
            <select
              value={ekSecim[f.alan] ?? 'Tümü'}
              onChange={(e) => setEkSecim((s) => ({ ...s, [f.alan]: e.target.value }))}
              aria-label={f.etiket}
              className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:border-ring dark:bg-input/30"
            >
              {['Tümü', ...f.secenekler].map((o) => (
                <option key={o} value={o} className="bg-background">
                  {o}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtreli.length} / {kayitlar.length} kayıt
          </span>
          <GorunumSec value={gorunum} onChange={setGorunum} />
        </div>
      </div>

      {secili.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/5 px-3 py-2">
          <span className="text-sm font-medium tabular-nums">{secili.size} kayıt seçili</span>
          <div className="ml-auto flex items-center gap-2">
            {topluEylemler?.map((e) => (
              <Button
                key={e.etiket}
                variant="outline"
                size="xs"
                onClick={() => {
                  e.onUygula([...secili])
                  setSecili(new Set())
                }}
              >
                {e.etiket}
              </Button>
            ))}
            <Button variant="outline" size="xs" onClick={topluAktar}>
              <DownloadIcon /> Excel indir
            </Button>
            <Button variant="destructive" size="xs" onClick={topluSil}>
              <Trash2Icon /> Seçilenleri sil
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setSecili(new Set())}>
              Seçimi temizle
            </Button>
          </div>
        </div>
      )}

      <div ref={listeRef}>
      {gorunum === 'liste' ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Bu sayfadaki kayıtları seç"
                      checked={tumuSecili}
                      disabled={gorunen.length === 0}
                      onChange={sayfayiSec}
                      className="size-4 accent-amber-500"
                    />
                  </th>
                  {kolonlar.map((k, i) => (
                    <th key={k.baslik} className={cn('px-3 py-2 font-medium whitespace-nowrap', k.sinif)}>
                      {k.siralama ? (
                        <button
                          type="button"
                          onClick={() => siralaTikla(i)}
                          className={cn(
                            'inline-flex items-center gap-1 transition-colors hover:text-foreground',
                            siralama?.kolon === i && 'text-foreground',
                          )}
                        >
                          {k.baslik}
                          {siralama?.kolon === i ? (
                            siralama.yon === 1 ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />
                          ) : (
                            <ArrowUpDownIcon className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        k.baslik
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gorunen.map((k) => (
                  <tr
                    key={k.id}
                    onClick={() => satirAc(k)}
                    className={cn(
                      'cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50',
                      secili.has(k.id) && 'bg-amber-400/5',
                    )}
                  >
                    <td className="w-10 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Kaydı seç"
                        checked={secili.has(k.id)}
                        onChange={() => secimDegistir(k.id)}
                        className="size-4 accent-amber-500"
                      />
                    </td>
                    {kolonlar.map((c) => (
                      <td key={c.baslik} className={cn('px-3 py-2.5 align-middle', c.sinif)}>
                        {c.hucre(k)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {gorunen.map((k) => (
            <li
              key={k.id}
              onClick={() => satirAc(k)}
              className={cn(
                'relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40',
                secili.has(k.id) && 'ring-1 ring-amber-400/70',
              )}
            >
              <div className="flex items-start gap-3 pr-6">
                <div className="min-w-0 flex-1">{ilkKolon?.hucre(k)}</div>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {digerKolonlar.map((c) => (
                  <div key={c.baslik} className="min-w-0">
                    <dt className="text-muted-foreground">{c.baslik}</dt>
                    <dd className="truncate">{c.hucre(k)}</dd>
                  </div>
                ))}
              </dl>
              <input
                type="checkbox"
                aria-label="Kaydı seç"
                checked={secili.has(k.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => secimDegistir(k.id)}
                className="absolute top-3 right-3 size-4 accent-amber-500"
              />
            </li>
          ))}
        </ul>
      )}
      </div>

      {filtreli.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-10 text-center">
          <SearchXIcon className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">{kayitlar.length === 0 ? `Henüz ${kayitAdi} yok` : 'Eşleşen kayıt bulunamadı'}</p>
          {filtreAktif ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ('')
                setDurumSec('Tümü')
                setEkSecim({})
              }}
            >
              Filtreleri temizle
            </Button>
          ) : (
            <Button size="sm" onClick={() => (yeniHref ? navigate(yeniHref) : ac('yeni'))}>
              <PlusIcon /> {yeniEtiket}
            </Button>
          )}
        </div>
      )}

      {filtreli.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {aktifSayfa * boy + 1}–{Math.min(filtreli.length, (aktifSayfa + 1) * boy)} / {filtreli.length}
            </span>
            <select
              value={sayfaBoyu}
              onChange={(e) => setSayfaBoyu(e.target.value === 'oto' ? 'oto' : Number(e.target.value))}
              aria-label="Sayfa başına kayıt"
              className="h-6 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
            >
              <option value="oto" className="bg-background">
                Otomatik ({otoSatir})
              </option>
              {SAYFA_BOYLARI.map((n) => (
                <option key={n} value={n} className="bg-background">
                  {n} / sayfa
                </option>
              ))}
            </select>
          </div>
          <nav aria-label="Sayfalama" className="flex items-center gap-1">
            <button
              type="button"
              disabled={aktifSayfa === 0}
              onClick={() => setSayfa(aktifSayfa - 1)}
              aria-label="Önceki sayfa"
              className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            {Array.from({ length: sayfaSayisi }, (_, i) => i)
              .filter((i) => i === 0 || i === sayfaSayisi - 1 || Math.abs(i - aktifSayfa) <= 1)
              .reduce<(number | '…')[]>((acc, i, idx, arr) => {
                if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(i)
                return acc
              }, [])
              .map((i, idx) =>
                i === '…' ? (
                  <span key={`e${idx}`} className="px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSayfa(i)}
                    aria-current={i === aktifSayfa ? 'page' : undefined}
                    className={cn(
                      'flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 tabular-nums transition-colors',
                      i === aktifSayfa ? 'bg-amber-400 font-semibold text-zinc-950' : 'hover:bg-muted',
                    )}
                  >
                    {i + 1}
                  </button>
                ),
              )}
            <button
              type="button"
              disabled={aktifSayfa >= sayfaSayisi - 1}
              onClick={() => setSayfa(aktifSayfa + 1)}
              aria-label="Sonraki sayfa"
              className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </nav>
        </div>
      )}

      <Sheet open={duzenle !== null} onOpenChange={(o) => !o && kapat()}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="text-base">
              {duzenle === 'yeni' ? `Yeni ${kayitAdi}` : `${kayitAdi[0].toLocaleUpperCase('tr') + kayitAdi.slice(1)} düzenle`}
            </SheetTitle>
            {duzenlenen && <p className="text-xs text-muted-foreground tabular-nums">{duzenlenen.id}</p>}
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              {alanlar.map((a) => (
                <Alan key={a.key} label={a.label + (a.zorunlu ? ' *' : '')} className={a.genis ? 'col-span-2' : undefined}>
                  {a.tip === 'secim' ? (
                    <Sec
                      value={form[a.key] ?? ''}
                      onChange={(v) => setForm((f) => ({ ...f, [a.key]: v }))}
                      options={a.secenekler ?? []}
                    />
                  ) : a.tip === 'foto' ? (
                    <FotoAlani value={form[a.key] ?? ''} onChange={(v) => setForm((f) => ({ ...f, [a.key]: v }))} />
                  ) : a.tip === 'uzun' ? (
                    <textarea
                      value={form[a.key] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [a.key]: e.target.value }))}
                      placeholder={a.placeholder}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                    />
                  ) : (
                    <Input
                      type={a.tip === 'sayi' ? 'number' : a.tip === 'tarih' ? 'date' : 'text'}
                      value={form[a.key] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [a.key]: e.target.value }))}
                      placeholder={a.placeholder}
                      className="h-8"
                    />
                  )}
                </Alan>
              ))}
            </div>
            {hata && (
              <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {hata}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t px-5 py-3">
            {duzenlenen && (
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-600" onClick={sil}>
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
