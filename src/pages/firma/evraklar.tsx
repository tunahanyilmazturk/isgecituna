import { useMemo, useState } from 'react'
import { DownloadIcon, EyeIcon, FileTextIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CipGrup, StatSerit } from '@/components/list-bits'
import { EvrakOnizleme } from '@/components/evrak/evrak-onizleme'
import { useOsgb } from '@/lib/osgb'
import {
  EVRAK_KATEGORILERI,
  boyutMetni,
  dosyaIndir,
  onizlenebilir,
  uzanti,
  useEvrakStore,
  type Evrak,
} from '@/stores/evraklar-store'
import { useFirmaKapsam } from './bits'

const CIPLER = ['Tümü', ...EVRAK_KATEGORILERI] as const

/** Firma evrakları — İSG uzmanının firmaya yüklediği belgeler; yalnızca görüntüleme ve indirme. */
export default function FirmaEvraklarPage() {
  const k = useFirmaKapsam()
  const osgb = useOsgb().kisaAd || 'OSGB'
  const evraklar = useEvrakStore((s) => s.evraklar)
  const [cip, setCip] = useState<(typeof CIPLER)[number]>('Tümü')
  const [ara, setAra] = useState('')
  const [onizle, setOnizle] = useState<Evrak | null>(null)

  const benim = useMemo(
    () => evraklar.filter((e) => e.firmaId === k.firmaId).sort((a, b) => b.tarih.localeCompare(a.tarih)),
    [evraklar, k.firmaId],
  )
  const liste = benim.filter((e) => {
    if (cip !== 'Tümü' && e.kategori !== cip) return false
    if (ara.trim() && ![e.ad, e.dosyaAdi, e.kategori].join(' ').toLowerCase().includes(ara.trim().toLowerCase())) return false
    return true
  })

  const sonYukleme = benim[0]?.tarih.slice(0, 10)
  // Yükleme anları gerçek zamandan alındığı için karşılaştırma da gerçek zamana göre yapılır.
  // Zaman bileşen ilk açılışta bir kez okunur; render sırasında saat okunmaz.
  const [simdi] = useState(() => Date.now())
  const son30 = benim.filter((e) => {
    const fark = (simdi - new Date(e.tarih).getTime()) / 86_400_000
    return fark >= 0 && fark <= 30
  }).length

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-semibold tracking-tight">Evraklar</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {k.firma?.unvan} · {osgb} tarafından firmanıza yüklenen belgeler
        </p>
      </div>

      <div className="px-6 pb-4">
        <StatSerit
          ogeler={[
            { label: 'Toplam evrak', deger: benim.length, ikon: FileTextIcon },
            { label: 'Son 30 gün', deger: son30 },
            { label: 'Son yükleme', deger: sonYukleme ? new Date(sonYukleme).toLocaleDateString('tr-TR') : '—' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <CipGrup secenekler={CIPLER} value={cip} onChange={setCip} />
        <div className="relative ml-auto min-w-48 flex-1 sm:max-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Evrak adı ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        {benim.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
            <FileTextIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Henüz evrak yok</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {osgb} uzmanınız firmanıza belge yüklediğinde PDF, Word, Excel ve görsel dosyalar burada görünür.
            </p>
          </div>
        ) : liste.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-center">
            <p className="text-sm font-medium">Bu filtreye uyan evrak yok</p>
            <p className="text-xs text-muted-foreground">Farklı bir kategori seçin ya da aramayı temizleyin.</p>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border">
            {liste.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  {uzanti(e.dosyaAdi).slice(0, 4)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.ad}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.kategori} · {e.dosyaAdi} · {boyutMetni(e.boyut)}
                  </p>
                </div>
                <div className="hidden text-right text-xs text-muted-foreground md:block">
                  <p>{new Date(e.tarih).toLocaleDateString('tr-TR')}</p>
                  <p className="truncate">{e.yukleyen}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {onizlenebilir(e.mime) && (
                    <Button size="sm" variant="outline" aria-label={`${e.ad} önizle`} onClick={() => setOnizle(e)}>
                      <EyeIcon /> <span className="hidden sm:inline">Önizle</span>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" aria-label={`${e.ad} indir`} onClick={() => dosyaIndir(e)}>
                    <DownloadIcon /> <span className="hidden sm:inline">İndir</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EvrakOnizleme evrak={onizle} onKapat={() => setOnizle(null)} />
    </div>
  )
}
