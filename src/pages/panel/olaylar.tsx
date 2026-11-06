import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  BarChart3Icon,
  ChevronDownIcon,
  CircleCheckIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FlameIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { CipGrup, FiltrePopover, GorunumSec, ListeFooter, SecimBar, SkeletonTablo, SortBaslik } from '@/components/list-bits'
import { DurumBadge, RiskBadge, TurBadge } from '@/components/olaylar/badges'
import { OlayDetailDrawer } from '@/components/olaylar/olay-detail-drawer'
import { OlayFormDrawer } from '@/components/olaylar/olay-form-drawer'
import { formatKisa } from '@/lib/date'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { cn } from '@/lib/utils'
import { useOlaylarStore } from '@/stores/olaylar-store'
import {
  BOLUMLER,
  BUGUN,
  DURUMLAR,
  FIRMALAR,
  RISKLER,
  riskSira,
  TURLER,
} from '@/data/olaylar'
import type { Olay, OlayTuru } from '@/data/olaylar'
import { useOtoBoy } from '@/lib/use-oto-boy'

const GUNCELLEME_SAATI = new Date().toLocaleTimeString('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
})

// Otomatik sayfa boyutu tahminleri: liste satırı ~46px + başlık ~40px; kart ~158px yükseklik / ~262px genişlik
const LISTE_SATIR_H = 46
const LISTE_BASLIK_H = 40
const KART_H = 158
const KART_W = 262

type Siralama = 'tarih' | 'no' | 'firma' | 'risk' | 'durum'

interface Filtreler {
  q: string
  tur: OlayTuru | 'Tümü'
  firma: string
  durum: string
  risk: string
  bolum: string
  donem: string
}

const bosFiltre: Filtreler = {
  q: '',
  tur: 'Tümü',
  firma: 'Tümü',
  durum: 'Tümü',
  risk: 'Tümü',
  bolum: 'Tümü',
  donem: 'Tümü',
}

const DONEMLER = ['Tümü', 'Son 7 gün', 'Son 30 gün', 'Bu yıl']
const donemGun: Record<string, number> = { 'Son 7 gün': 7, 'Son 30 gün': 30, 'Bu yıl': 365 }

export default function OlaylarPage() {
  const olaylar = useOlaylarStore((s) => s.olaylar)
  const durumGuncelle = useOlaylarStore((s) => s.durumGuncelle)
  const sil = useOlaylarStore((s) => s.sil)
  const geriYukle = useOlaylarStore((s) => s.geriYukle)
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [asama, setAsama] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor')
  const [filtre, setFiltre] = useState<Filtreler>(bosFiltre)
  const [siralama, setSiralama] = useState<Siralama>('tarih')
  const [yon, setYon] = useState<1 | -1>(-1)
  const [sayfa, setSayfa] = useState(0)
  const [secili, setSecili] = useState<Olay | null>(null)
  const [duzenle, setDuzenle] = useState<Olay | null>(null)
  const [gorunum, setGorunum] = useState<'liste' | 'kart'>('liste')
  const [sayfaBoyu, setSayfaBoyu] = useState<'oto' | number>('oto')
  const [seciliIds, setSeciliIds] = useState<Set<string>>(new Set())
  // Otomatik mod: görünür alana sığan kadar kayıt göster
  const { alanRef, otoBoy } = useOtoBoy(gorunum, {
    satirH: LISTE_SATIR_H,
    baslikH: LISTE_BASLIK_H,
    kartH: KART_H,
    kartW: KART_W,
  })

  useEffect(() => {
    const t = setTimeout(
      () => setAsama(params.has('hata') ? 'hata' : 'hazir'),
      400,
    )
    return () => clearTimeout(t)
  }, [params])

  const filtreli = useMemo(() => {
    const q = filtre.q.toLocaleLowerCase('tr').trim()
    const gun = donemGun[filtre.donem]
    const sinir = gun ? new Date(`${BUGUN}T00:00:00`).getTime() - gun * 86400000 : 0
    return olaylar.filter((o) => {
      if (filtre.tur !== 'Tümü' && o.tur !== filtre.tur) return false
      if (filtre.firma !== 'Tümü' && o.firma !== filtre.firma) return false
      if (filtre.durum !== 'Tümü' && o.durum !== filtre.durum) return false
      if (filtre.risk !== 'Tümü' && o.risk !== filtre.risk) return false
      if (filtre.bolum !== 'Tümü' && o.bolum !== filtre.bolum) return false
      if (sinir && new Date(`${o.tarih}T00:00:00`).getTime() < sinir) return false
      if (
        q &&
        ![o.id, o.baslik, o.calisan, o.firma, o.bolum, o.sorumlu, o.aciklama]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('tr')
          .includes(q)
      )
        return false
      return true
    })
  }, [olaylar, filtre])

  const sirali = useMemo(() => {
    const arr = [...filtreli]
    arr.sort((a, b) => {
      let k = 0
      if (siralama === 'tarih') k = `${a.tarih}${a.saat}`.localeCompare(`${b.tarih}${b.saat}`)
      else if (siralama === 'no') k = a.id.localeCompare(b.id)
      else if (siralama === 'firma') k = a.firma.localeCompare(b.firma, 'tr')
      else if (siralama === 'risk') k = riskSira[a.risk] - riskSira[b.risk]
      else k = DURUMLAR.indexOf(a.durum) - DURUMLAR.indexOf(b.durum)
      return k * yon
    })
    return arr
  }, [filtreli, siralama, yon])

  const etkiliBoy = sayfaBoyu === 'oto' ? Math.max(1, otoBoy) : sayfaBoyu
  const sayfaSayisi = Math.max(1, Math.ceil(sirali.length / etkiliBoy))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const sayfaSatirlar = sirali.slice(sayfaGuvenli * etkiliBoy, (sayfaGuvenli + 1) * etkiliBoy)

  const ist = useMemo(() => {
    const acik = olaylar.filter((o) => o.durum !== 'Kapatıldı')
    return [
      { label: 'Toplam Olay', deger: olaylar.length, delta: '+3', ikon: BarChart3Icon, iyi: true },
      {
        label: 'İş Kazası',
        deger: olaylar.filter((o) => o.tur === 'İş Kazası').length,
        delta: '+1',
        ikon: AlertTriangleIcon,
        iyi: false,
      },
      {
        label: 'Ramak Kala',
        deger: olaylar.filter((o) => o.tur === 'Ramak Kala').length,
        delta: '+2',
        ikon: FlameIcon,
        iyi: true,
      },
      {
        label: 'Açık Olaylar',
        deger: acik.length,
        delta: '-1',
        ikon: ClockIcon,
        iyi: true,
      },
      {
        label: 'İncelemede',
        deger: olaylar.filter((o) => o.durum === 'İncelemede').length,
        delta: '+2',
        ikon: EyeIcon,
        iyi: true,
      },
      {
        label: 'Kapatılan',
        deger: olaylar.filter((o) => o.durum === 'Kapatıldı').length,
        delta: '+4',
        ikon: CircleCheckIcon,
        iyi: true,
      },
    ]
  }, [olaylar])

  const siralaClick = (s: Siralama) => {
    if (siralama === s) setYon((y) => (y === 1 ? -1 : 1))
    else {
      setSiralama(s)
      setYon(-1)
    }
  }

  const filtreDegis = (f: Filtreler) => {
    setFiltre(f)
    setSayfa(0)
  }

  const secToggle = (id: string) =>
    setSeciliIds((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const sayfaTumuSecili = sayfaSatirlar.length > 0 && sayfaSatirlar.every((o) => seciliIds.has(o.id))
  const sayfaBazisiSecili = sayfaSatirlar.some((o) => seciliIds.has(o.id))

  const sayfaTumuToggle = () =>
    setSeciliIds((s) => {
      const n = new Set(s)
      for (const o of sayfaSatirlar) {
        if (sayfaTumuSecili) n.delete(o.id)
        else n.add(o.id)
      }
      return n
    })

  const silSecilenler = () => {
    const silinen = sil([...seciliIds])
    setSeciliIds(new Set())
    toast(`${silinen.length} kayıt silindi`, {
      action: { label: 'Geri al', onClick: () => geriYukle(silinen) },
    })
  }

  const silTek = (o: Olay) => {
    const silinen = sil([o.id])
    setSeciliIds((s) => {
      const n = new Set(s)
      n.delete(o.id)
      return n
    })
    toast(`${o.id} silindi`, {
      action: { label: 'Geri al', onClick: () => geriYukle(silinen) },
    })
  }

  const excelleAktar = () => {
    xlsxIndir(xlsxDosyaAdi('Olay_Bildirimleri'), [
      {
        ad: 'Olay Listesi',
        baslik: 'Olay Bildirimleri',
        altBilgi: 'Olay modülü',
        kolonlar: [
          { label: 'Olay No', minGenislik: 10 },
          { label: 'Tarih', tip: 'tarih' },
          { label: 'Saat', minGenislik: 8 },
          { label: 'Firma', minGenislik: 22, wrap: true },
          { label: 'İşyeri', minGenislik: 16 },
          { label: 'Bölüm', minGenislik: 14 },
          { label: 'Tür', minGenislik: 14 },
          { label: 'Başlık', minGenislik: 30, wrap: true },
          { label: 'Çalışan', minGenislik: 18 },
          { label: 'Risk', minGenislik: 10 },
          { label: 'Durum', minGenislik: 12 },
          { label: 'Sorumlu', minGenislik: 16 },
        ],
        satirlar: sirali.map((o) => [
          o.id,
          o.tarih,
          o.saat,
          o.firma,
          o.isyeri,
          o.bolum,
          o.tur,
          o.baslik,
          o.calisan ?? '',
          o.risk,
          o.durum,
          o.sorumlu,
        ]),
        ozet: [
          ['Toplam', sirali.length],
          ['Açık', sirali.filter((o) => o.durum !== 'Kapatıldı').length],
          ['Kapatıldı', sirali.filter((o) => o.durum === 'Kapatıldı').length],
        ],
      },
    ])
    toast.success(`${sirali.length} kayıt Excel'e aktarıldı`)
  }

  const islemMenu = (o: Olay) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="İşlemler"
            onClick={(e) => e.stopPropagation()}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          />
        }
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setSecili(o)}>
          <EyeIcon /> Detayı görüntüle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDuzenle(o)}>
          <PencilIcon /> Düzenle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {o.durum !== 'Kapatıldı' ? (
          <DropdownMenuItem
            onClick={() => {
              durumGuncelle(o.id, 'Kapatıldı', 'Kayıt kapatıldı')
              toast.success(`${o.id} kapatıldı`)
            }}
          >
            <CircleCheckIcon /> Kapat
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <CircleCheckIcon /> Kapandı
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onClick={() => silTek(o)}>
          <Trash2Icon /> Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const raporIndir = (tip: 'ozet' | 'firma' | 'dof') => {
    if (tip === 'ozet') {
      xlsxIndir(xlsxDosyaAdi('Olay_Ozeti'), [
        {
          ad: 'Durum Dağılımı',
          baslik: 'Olay Durum Özeti',
          altBilgi: 'Olay raporları',
          kolonlar: [
            { label: 'Durum', minGenislik: 20 },
            { label: 'Adet', tip: 'sayi' },
          ],
          satirlar: DURUMLAR.map((d) => [d, olaylar.filter((o) => o.durum === d).length]).filter(
            (r) => Number(r[1]) > 0,
          ),
        },
        {
          ad: 'Tür Dağılımı',
          baslik: 'Olay Tür Özeti',
          altBilgi: 'Olay raporları',
          kolonlar: [
            { label: 'Tür', minGenislik: 20 },
            { label: 'Adet', tip: 'sayi' },
          ],
          satirlar: TURLER.map((t) => [t, olaylar.filter((o) => o.tur === t).length]).filter(
            (r) => Number(r[1]) > 0,
          ),
        },
      ])
    } else if (tip === 'firma') {
      xlsxIndir(xlsxDosyaAdi('Olay_Firma_Raporu'), [
        {
          ad: 'Firma Dağılımı',
          baslik: 'Firma Bazlı Olay Raporu',
          altBilgi: 'Olay raporları',
          kolonlar: [
            { label: 'Firma', minGenislik: 28, wrap: true },
            { label: 'Toplam', tip: 'sayi' },
            { label: 'İş Kazası', tip: 'sayi', minGenislik: 12 },
            { label: 'Ramak Kala', tip: 'sayi', minGenislik: 12 },
            { label: 'Açık', tip: 'sayi' },
            { label: 'Kapanan', tip: 'sayi' },
          ],
          satirlar: FIRMALAR.map((f) => {
            const l = olaylar.filter((o) => o.firma === f)
            return [
              f,
              l.length,
              l.filter((o) => o.tur === 'İş Kazası').length,
              l.filter((o) => o.tur === 'Ramak Kala').length,
              l.filter((o) => o.durum !== 'Kapatıldı').length,
              l.filter((o) => o.durum === 'Kapatıldı').length,
            ]
          }),
        },
      ])
    } else {
      const rows = olaylar.flatMap((o) =>
        o.aksiyonlar.map((a) => [
          o.id,
          o.baslik,
          a.aciklama,
          a.sorumlu,
          a.baslangic,
          a.hedefBitis,
          a.tamamlandi ? 'Tamamlandı' : 'Açık',
        ]),
      )
      xlsxIndir(xlsxDosyaAdi('Olay_Aksiyon_Raporu'), [
        {
          ad: 'Aksiyonlar',
          baslik: 'Düzeltici Aksiyon Raporu',
          altBilgi: 'Olay raporları',
          kolonlar: [
            { label: 'Olay No', minGenislik: 10 },
            { label: 'Olay', minGenislik: 28, wrap: true },
            { label: 'Aksiyon', minGenislik: 32, wrap: true },
            { label: 'Sorumlu', minGenislik: 18 },
            { label: 'Başlangıç', tip: 'tarih' },
            { label: 'Hedef Bitiş', tip: 'tarih' },
            { label: 'Durum', minGenislik: 14 },
          ],
          satirlar: rows,
        },
      ])
    }
    toast.success('Rapor indirildi')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Olay Bildirimleri</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            İş kazaları, ramak kala olaylar ve tehlikeli durumların yönetimi
            <span className="ml-2 text-xs">· Son güncelleme: bugün {GUNCELLEME_SAATI}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={excelleAktar}>
            <DownloadIcon /> Excel'e aktar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <FileTextIcon /> Raporlar <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => raporIndir('ozet')}>
                Olay özet raporu (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => raporIndir('firma')}>
                Firma bazlı rapor (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => raporIndir('dof')}>
                DÖF durum raporu (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => navigate('/panel/olaylar/yeni')}>
            <PlusIcon /> Yeni Olay Bildir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x rounded-xl border bg-card lg:grid-cols-6">
        {ist.map((s, i) => (
          <div key={s.label} className={cn('px-3.5 py-2.5', i > 2 && 'border-t lg:border-t-0')}>
            <div className="flex items-center justify-between">
              <p className="truncate text-xs text-muted-foreground">{s.label}</p>
              <s.ikon className="size-3.5 shrink-0 text-muted-foreground/60" />
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <p className="text-xl leading-none font-medium tabular-nums">{s.deger}</p>
              <span
                className={cn(
                  'text-[11px] font-medium tabular-nums',
                  s.iyi ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                )}
              >
                {s.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-52 min-w-0">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtre.q}
            onChange={(e) => filtreDegis({ ...filtre, q: e.target.value })}
            placeholder="Ara: no, başlık, çalışan…"
            className="h-8 pl-8 text-[13px]"
          />
        </div>
        <CipGrup
          secenekler={['Tümü', ...TURLER] as const}
          value={filtre.tur}
          onChange={(t) => filtreDegis({ ...filtre, tur: t })}
        />
        <div className="ml-auto flex items-center gap-2">
          <GorunumSec
            value={gorunum}
            onChange={(v) => {
              setGorunum(v)
              setSayfa(0)
            }}
          />
          {(filtre.q || JSON.stringify(filtre) !== JSON.stringify({ ...bosFiltre, q: filtre.q })) && (
            <button
              type="button"
              onClick={() => filtreDegis(bosFiltre)}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <XIcon className="size-3" /> Temizle
            </button>
          )}
          <FiltrePopover
            aktifSayi={
              [filtre.firma, filtre.durum, filtre.risk, filtre.bolum, filtre.donem].filter(
                (v) => v !== 'Tümü',
              ).length
            }
            onTemizle={() => filtreDegis({ ...bosFiltre, q: filtre.q, tur: filtre.tur })}
            sorular={[
              {
                label: 'Firma / İşletme',
                value: filtre.firma,
                options: ['Tümü', ...FIRMALAR],
                onChange: (v) => setFiltre((f) => ({ ...f, firma: v })),
              },
              {
                label: 'Durum',
                value: filtre.durum,
                options: ['Tümü', ...DURUMLAR],
                onChange: (v) => setFiltre((f) => ({ ...f, durum: v })),
              },
              {
                label: 'Risk seviyesi',
                value: filtre.risk,
                options: ['Tümü', ...RISKLER],
                onChange: (v) => setFiltre((f) => ({ ...f, risk: v })),
              },
              {
                label: 'İşyeri / Bölüm',
                value: filtre.bolum,
                options: ['Tümü', ...BOLUMLER],
                onChange: (v) => setFiltre((f) => ({ ...f, bolum: v })),
              },
              {
                label: 'Olay tarihi',
                value: filtre.donem,
                options: DONEMLER,
                onChange: (v) => setFiltre((f) => ({ ...f, donem: v })),
              },
            ]}
          />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col rounded-xl border bg-card">
        {asama === 'yukleniyor' ? (
          <SkeletonTablo />
        ) : asama === 'hata' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <AlertTriangleIcon className="size-8 text-amber-500" />
            <p className="text-sm font-medium">Kayıtlar yüklenemedi</p>
            <p className="text-xs text-muted-foreground">Bağlantı hatası oluştu, tekrar deneyin.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setAsama('yukleniyor')
                setTimeout(() => setAsama('hazir'), 400)
              }}
            >
              <RefreshCwIcon /> Tekrar dene
            </Button>
          </div>
        ) : filtreli.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <SearchXIcon className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Kayıt bulunamadı</p>
            <p className="text-xs text-muted-foreground">
              Arama veya filtre kriterlerinize uyan olay kaydı yok.
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => filtreDegis(bosFiltre)}>
              Filtreleri temizle
            </Button>
          </div>
        ) : (
          <>
            {seciliIds.size > 0 && (
              <SecimBar
                adet={seciliIds.size}
                onAktar={() => {
                  const liste = sirali.filter((o) => seciliIds.has(o.id))
                  xlsxIndir(xlsxDosyaAdi('Olay_Secili_Kayitlar'), [
                    {
                      ad: 'Seçili Olaylar',
                      baslik: 'Seçili Olay Bildirimleri',
                      altBilgi: 'Olay modülü',
                      kolonlar: [
                        { label: 'Olay No', minGenislik: 10 },
                        { label: 'Tarih', tip: 'tarih' },
                        { label: 'Saat', minGenislik: 8 },
                        { label: 'Firma', minGenislik: 22, wrap: true },
                        { label: 'Bölüm', minGenislik: 14 },
                        { label: 'Tür', minGenislik: 14 },
                        { label: 'Başlık', minGenislik: 32, wrap: true },
                        { label: 'Risk', minGenislik: 10 },
                        { label: 'Durum', minGenislik: 12 },
                      ],
                      satirlar: liste.map((o) => [
                        o.id,
                        o.tarih,
                        o.saat,
                        o.firma,
                        o.bolum,
                        o.tur,
                        o.baslik,
                        o.risk,
                        o.durum,
                      ]),
                    },
                  ])
                  toast.success(`${liste.length} kayıt aktarıldı`)
                }}
                onSil={silSecilenler}
                onKapat={() => setSeciliIds(new Set())}
              />
            )}

            {gorunum === 'liste' ? (
              <div ref={alanRef} className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[1100px] text-left text-[13px]">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b">
                      <th className="w-9 py-2 pr-1 pl-3">
                        <span onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={sayfaTumuSecili}
                            indeterminate={!sayfaTumuSecili && sayfaBazisiSecili}
                            onCheckedChange={sayfaTumuToggle}
                            aria-label="Sayfadaki tümünü seç"
                          />
                        </span>
                      </th>
                      <SortBaslik label="Olay No" id="no" aktif={siralama} yon={yon} onClick={siralaClick} className="py-2 pr-3 pl-1" />
                      <SortBaslik label="Tarih / Saat" id="tarih" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <SortBaslik label="Firma" id="firma" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Olay Başlığı</th>
                      <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Tür</th>
                      <th className="px-3 py-2 text-xs font-medium text-muted-foreground">İlgili Çalışan</th>
                      <SortBaslik label="Risk" id="risk" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <SortBaslik label="Durum" id="durum" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Sorumlu</th>
                      <th className="w-10 pr-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sayfaSatirlar.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => setSecili(o)}
                        className={cn(
                          'cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/50',
                          seciliIds.has(o.id) && 'bg-amber-500/5 hover:bg-amber-500/10',
                        )}
                      >
                        <td className="py-2 pr-1 pl-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={seciliIds.has(o.id)}
                            onCheckedChange={() => secToggle(o.id)}
                            aria-label={`${o.id} seç`}
                          />
                        </td>
                        <td className="py-2 pr-3 pl-1 font-mono text-xs font-medium whitespace-nowrap">{o.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="tabular-nums">{formatKisa(o.tarih)}</span>
                          <span className="ml-1 text-xs text-muted-foreground tabular-nums">{o.saat}</span>
                        </td>
                        <td className="max-w-32 truncate px-3 py-2">{o.firma}</td>
                        <td className="max-w-56 px-3 py-2">
                          <p className="truncate font-medium">{o.baslik}</p>
                          <p className="truncate text-xs text-muted-foreground">{o.bolum}</p>
                        </td>
                        <td className="px-3 py-2">
                          <TurBadge tur={o.tur} />
                        </td>
                        <td className="max-w-32 truncate px-3 py-2 text-muted-foreground">
                          {o.calisan ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          <RiskBadge risk={o.risk} />
                        </td>
                        <td className="px-3 py-2">
                          <DurumBadge durum={o.durum} />
                        </td>
                        <td className="max-w-32 truncate px-3 py-2 text-muted-foreground">{o.sorumlu}</td>
                        <td className="py-2 pr-3">{islemMenu(o)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div ref={alanRef} className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2.5">
                  {sayfaSatirlar.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => setSecili(o)}
                      className={cn(
                        'cursor-pointer rounded-xl border p-3 transition-colors hover:border-foreground/30 hover:bg-muted/40',
                        seciliIds.has(o.id) && 'border-amber-500/50 bg-amber-500/5',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={seciliIds.has(o.id)}
                              onCheckedChange={() => secToggle(o.id)}
                              aria-label={`${o.id} seç`}
                            />
                          </span>
                          <span className="font-mono text-xs font-medium">{o.id}</span>
                        </div>
                        {islemMenu(o)}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium">{o.baslik}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {o.firma} · {o.bolum}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        <TurBadge tur={o.tur} />
                        <RiskBadge risk={o.risk} />
                        <DurumBadge durum={o.durum} />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {formatKisa(o.tarih)} {o.saat}
                        </span>
                        <span className="max-w-28 truncate">{o.sorumlu}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ListeFooter
              bas={sayfaGuvenli * etkiliBoy + 1}
              son={Math.min((sayfaGuvenli + 1) * etkiliBoy, sirali.length)}
              toplam={sirali.length}
              sayfaGuvenli={sayfaGuvenli}
              sayfaSayisi={sayfaSayisi}
              sayfaBoyu={sayfaBoyu}
              otoBoy={otoBoy}
              onBoyut={(v) => {
                setSayfaBoyu(v)
                setSayfa(0)
              }}
              onSayfa={setSayfa}
            />
          </>
        )}
      </div>

      <OlayDetailDrawer
        olay={secili ? (olaylar.find((o) => o.id === secili.id) ?? secili) : null}
        onKapat={() => setSecili(null)}
        onDuzenle={(o) => {
          setSecili(null)
          setDuzenle(o)
        }}
      />
      {duzenle && <OlayFormDrawer duzenle={duzenle} open={false} onKapat={() => setDuzenle(null)} />}
    </div>
  )
}
