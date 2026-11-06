import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  Building2Icon,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleOffIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FileWarningIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  UsersIcon,
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
import {
  FirmaDurumBadge,
  KatipDurumBadge,
  KalanGunBadge,
  SozlesmeBadge,
  TehlikeBadge,
} from '@/components/firmalar/badges'
import { FirmaFormDrawer } from '@/components/firmalar/firma-form-drawer'
import { FirmaAvatar } from '@/components/firmalar/firma-avatar'
import { Pill } from '@/components/pill'
import { formatKisa } from '@/lib/date'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { useOsgb } from '@/lib/osgb'
import { cn } from '@/lib/utils'
import { useFirmalarStore } from '@/stores/firmalar-store'
import {
  eksikAlanlar,
  HIZMET_TURLERI,
  ILLER,
  sozlesmeDurumu,
  TEHLIKE_SINIFLARI,
} from '@/data/firmalar'
import type { Firma } from '@/data/firmalar'
import { useOtoBoy } from '@/lib/use-oto-boy'

const GUNCELLEME_SAATI = new Date().toLocaleTimeString('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
})

const LISTE_SATIR_H = 46
const LISTE_BASLIK_H = 40
const KART_H = 190
const KART_W = 280

type Siralama = 'kod' | 'ad' | 'tehlike' | 'calisan' | 'bitis' | 'durum'
type Hizli = 'Tümü' | 'Aktif' | 'Pasif' | 'Sözleşmesi Aktif' | 'Sözleşmesi Yaklaşan' | 'Eksik Bilgili'

interface Filtreler {
  q: string
  hizli: Hizli
  durum: string
  sozlesme: string
  tehlike: string
  il: string
  hizmet: string
}

const bosFiltre: Filtreler = {
  q: '',
  hizli: 'Tümü',
  durum: 'Tümü',
  sozlesme: 'Tümü',
  tehlike: 'Tümü',
  il: 'Tümü',
  hizmet: 'Tümü',
}

export default function FirmalarPage() {
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const katip = useFirmalarStore((s) => s.katip)
  const firmaDurumAyarla = useFirmalarStore((s) => s.firmaDurumAyarla)
  const kurum = useOsgb()
  const osgbAdi = kurum.kisaAd || kurum.unvan
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [asama, setAsama] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor')
  const [filtre, setFiltre] = useState<Filtreler>(bosFiltre)
  const [siralama, setSiralama] = useState<Siralama>('kod')
  const [yon, setYon] = useState<1 | -1>(1)
  const [sayfa, setSayfa] = useState(0)
  const [duzenle, setDuzenle] = useState<Firma | 'yeni' | null>(null)
  const [gorunum, setGorunum] = useState<'liste' | 'kart'>('liste')
  const [sayfaBoyu, setSayfaBoyu] = useState<'oto' | number>('oto')
  const [seciliIds, setSeciliIds] = useState<Set<string>>(new Set())
  const { alanRef, otoBoy } = useOtoBoy(gorunum, {
    satirH: LISTE_SATIR_H,
    baslikH: LISTE_BASLIK_H,
    kartH: KART_H,
    kartW: KART_W,
  })

  useEffect(() => {
    const t = setTimeout(() => setAsama(params.has('hata') ? 'hata' : 'hazir'), 400)
    return () => clearTimeout(t)
  }, [params])

  // Firmanın en güncel İSG-KATİP kaydı (son sözleşme)
  const katipMap = useMemo(() => {
    const m = new Map<string, (typeof katip)[number]>()
    for (const k of katip) {
      const mevcut = m.get(k.firmaId)
      if (!mevcut || k.sozlesmeBitis > mevcut.sozlesmeBitis) m.set(k.firmaId, k)
    }
    return m
  }, [katip])

  const filtreli = useMemo(() => {
    const q = filtre.q.toLocaleLowerCase('tr').trim()
    return firmalar.filter((f) => {
      const sd = sozlesmeDurumu(f)
      const eksik = eksikAlanlar(f).length > 0
      switch (filtre.hizli) {
        case 'Aktif':
          if (f.durum !== 'Aktif') return false
          break
        case 'Pasif':
          if (f.durum !== 'Pasif') return false
          break
        case 'Sözleşmesi Aktif':
          if (sd !== 'Aktif') return false
          break
        case 'Sözleşmesi Yaklaşan':
          if (sd !== 'Yaklaşıyor') return false
          break
        case 'Eksik Bilgili':
          if (!eksik) return false
          break
      }
      if (filtre.durum !== 'Tümü' && f.durum !== filtre.durum) return false
      if (filtre.sozlesme !== 'Tümü' && sd !== filtre.sozlesme) return false
      if (filtre.tehlike !== 'Tümü' && f.tehlikeSinifi !== filtre.tehlike) return false
      if (filtre.il !== 'Tümü' && f.il !== filtre.il) return false
      if (filtre.hizmet !== 'Tümü' && f.hizmetTuru !== filtre.hizmet) return false
      if (
        q &&
        ![f.kod, f.unvan, f.kisaAd, f.vergiNo, f.yetkili, f.il, f.faaliyet]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('tr')
          .includes(q)
      )
        return false
      return true
    })
  }, [firmalar, filtre])

  const sirali = useMemo(() => {
    const arr = [...filtreli]
    arr.sort((a, b) => {
      let k = 0
      if (siralama === 'kod') k = a.kod.localeCompare(b.kod)
      else if (siralama === 'ad') k = a.unvan.localeCompare(b.unvan, 'tr')
      else if (siralama === 'tehlike')
        k = TEHLIKE_SINIFLARI.indexOf(a.tehlikeSinifi as never) - TEHLIKE_SINIFLARI.indexOf(b.tehlikeSinifi as never)
      else if (siralama === 'calisan') k = a.calisanSayisi - b.calisanSayisi
      else if (siralama === 'bitis') k = a.hizmetBitis.localeCompare(b.hizmetBitis)
      else k = a.durum.localeCompare(b.durum, 'tr')
      return k * yon
    })
    return arr
  }, [filtreli, siralama, yon])

  const etkiliBoy = sayfaBoyu === 'oto' ? Math.max(1, otoBoy) : sayfaBoyu
  const sayfaSayisi = Math.max(1, Math.ceil(sirali.length / etkiliBoy))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const sayfaSatirlar = sirali.slice(sayfaGuvenli * etkiliBoy, (sayfaGuvenli + 1) * etkiliBoy)

  const ist = useMemo(() => {
    const aktif = firmalar.filter((f) => f.durum === 'Aktif')
    return [
      { label: 'Toplam Firma', deger: firmalar.length, ikon: Building2Icon },
      { label: 'Aktif', deger: aktif.length, ikon: CircleCheckIcon },
      {
        label: 'Pasif',
        deger: firmalar.length - aktif.length,
        ikon: CircleOffIcon,
      },
      {
        label: 'Sözleşme Aktif',
        deger: firmalar.filter((f) => sozlesmeDurumu(f) === 'Aktif').length,
        ikon: FileTextIcon,
      },
      {
        label: 'Süresi Yaklaşan',
        deger: firmalar.filter((f) => sozlesmeDurumu(f) === 'Yaklaşıyor').length,
        ikon: AlertTriangleIcon,
      },
      {
        label: 'Eksik Bilgili',
        deger: firmalar.filter((f) => eksikAlanlar(f).length > 0).length,
        ikon: FileWarningIcon,
      },
    ]
  }, [firmalar])

  const siralaClick = (s: Siralama) => {
    if (siralama === s) setYon((y) => (y === 1 ? -1 : 1))
    else {
      setSiralama(s)
      setYon(1)
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

  const sayfaTumuSecili = sayfaSatirlar.length > 0 && sayfaSatirlar.every((f) => seciliIds.has(f.id))
  const sayfaBazisiSecili = sayfaSatirlar.some((f) => seciliIds.has(f.id))

  const sayfaTumuToggle = () =>
    setSeciliIds((s) => {
      const n = new Set(s)
      for (const f of sayfaSatirlar) {
        if (sayfaTumuSecili) n.delete(f.id)
        else n.add(f.id)
      }
      return n
    })

  const pasifeAlSecilenler = () => {
    const adet = seciliIds.size
    for (const id of seciliIds) firmaDurumAyarla(id, 'Pasif', 'Toplu işlem')
    setSeciliIds(new Set())
    toast.success(`${adet} firma pasife alındı`)
  }

  const excelleAktar = (liste: Firma[] = sirali) => {
    xlsxIndir(xlsxDosyaAdi('Firma_Listesi'), [
      {
        ad: 'Firma Listesi',
        baslik: 'Müşteri Firma Listesi',
        altBilgi: 'Firmalar modülü',
        kolonlar: [
          { label: 'Kod', minGenislik: 10 },
          { label: 'Firma', minGenislik: 26, wrap: true },
          { label: 'Vergi No', minGenislik: 14 },
          { label: 'Tehlike Sınıfı', minGenislik: 14 },
          { label: 'Çalışan', tip: 'sayi', minGenislik: 11 },
          { label: 'Hizmet', minGenislik: 14 },
          { label: 'Sözleşme Bitiş', tip: 'tarih', minGenislik: 14 },
          { label: 'Durum', minGenislik: 12 },
        ],
        satirlar: liste.map((f) => [
          f.kod,
          f.unvan,
          f.vergiNo,
          f.tehlikeSinifi,
          f.calisanSayisi,
          f.hizmetTuru,
          f.hizmetBitis,
          f.durum,
        ]),
        ozet: [
          ['Toplam', liste.length],
          ['Aktif', liste.filter((f) => f.durum === 'Aktif').length],
          ['Pasif', liste.filter((f) => f.durum === 'Pasif').length],
        ],
      },
    ])
    toast.success(`${liste.length} kayıt Excel'e aktarıldı`)
  }

  const islemMenu = (f: Firma) => (
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
        <DropdownMenuItem onClick={() => navigate(`/panel/firmalar/${f.id}`)}>
          <EyeIcon /> Detayı görüntüle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDuzenle(f)}>
          <PencilIcon /> Düzenle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {f.durum === 'Aktif' ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              firmaDurumAyarla(f.id, 'Pasif', 'Liste işlemi')
              toast.success(`${f.kisaAd} pasife alındı — İSG-KATİP kayıtları korunuyor`)
            }}
          >
            <CircleOffIcon /> Pasife al
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              firmaDurumAyarla(f.id, 'Aktif', 'Liste işlemi')
              toast.success(`${f.kisaAd} aktifleştirildi`)
            }}
          >
            <CircleCheckIcon /> Aktifleştir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Firmalar</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Müşteri firmalarını ve İSG hizmet ilişkilerini yönetin
            <span className="ml-2 text-xs">· Son güncelleme: bugün {GUNCELLEME_SAATI}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => excelleAktar()}>
            <DownloadIcon /> Excel'e aktar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <FileTextIcon /> Raporlar <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  xlsxIndir(xlsxDosyaAdi('Firma_Durum_Ozeti'), [
                    {
                      ad: 'Firma Durumu',
                      baslik: 'Firma Durum Özeti',
                      altBilgi: 'Firmalar raporları',
                      kolonlar: [
                        { label: 'Durum', minGenislik: 20 },
                        { label: 'Adet', tip: 'sayi' },
                      ],
                      satirlar: [
                        ['Aktif', firmalar.filter((f) => f.durum === 'Aktif').length],
                        ['Pasif', firmalar.filter((f) => f.durum === 'Pasif').length],
                      ],
                    },
                    {
                      ad: 'Sözleşme Durumu',
                      baslik: 'Sözleşme Durum Özeti',
                      altBilgi: 'Firmalar raporları',
                      kolonlar: [
                        { label: 'Sözleşme', minGenislik: 20 },
                        { label: 'Adet', tip: 'sayi' },
                      ],
                      satirlar: [
                        ['Aktif', firmalar.filter((f) => sozlesmeDurumu(f) === 'Aktif').length],
                        ['Yaklaşıyor', firmalar.filter((f) => sozlesmeDurumu(f) === 'Yaklaşıyor').length],
                        ['Doldu', firmalar.filter((f) => sozlesmeDurumu(f) === 'Doldu').length],
                      ],
                    },
                  ])
                  toast.success('Rapor indirildi')
                }}
              >
                Firma durum özeti (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  xlsxIndir(xlsxDosyaAdi('Firma_Eksik_Bilgi'), [
                    {
                      ad: 'Eksik Bilgiler',
                      baslik: 'Eksik Bilgi Raporu',
                      altBilgi: 'Firmalar raporları',
                      kolonlar: [
                        { label: 'Kod', minGenislik: 10 },
                        { label: 'Firma', minGenislik: 26, wrap: true },
                        { label: 'Eksik Alanlar', minGenislik: 34, wrap: true },
                      ],
                      satirlar: firmalar
                        .map((f) => [f.kod, f.unvan, eksikAlanlar(f).join(', ')])
                        .filter((r) => r[2]),
                    },
                  ])
                  toast.success('Rapor indirildi')
                }}
              >
                Eksik bilgi raporu (XLSX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setDuzenle('yeni')}>
            <PlusIcon /> Yeni Firma Ekle
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
            <p className="mt-0.5 text-xl leading-none font-medium tabular-nums">{s.deger}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-52 min-w-0">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtre.q}
            onChange={(e) => filtreDegis({ ...filtre, q: e.target.value })}
            placeholder="Ara: firma adı, vergi no…"
            className="h-8 pl-8 text-[13px]"
          />
        </div>
        <CipGrup
          secenekler={['Tümü', 'Aktif', 'Pasif', 'Sözleşmesi Aktif', 'Sözleşmesi Yaklaşan', 'Eksik Bilgili'] as const}
          value={filtre.hizli}
          onChange={(h) => filtreDegis({ ...filtre, hizli: h })}
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
              × Temizle
            </button>
          )}
          <FiltrePopover
            aktifSayi={
              [filtre.durum, filtre.sozlesme, filtre.tehlike, filtre.il, filtre.hizmet].filter(
                (v) => v !== 'Tümü',
              ).length
            }
            onTemizle={() => filtreDegis({ ...bosFiltre, q: filtre.q, hizli: filtre.hizli })}
            sorular={[
              {
                label: 'Firma durumu',
                value: filtre.durum,
                options: ['Tümü', 'Aktif', 'Pasif'],
                onChange: (v) => setFiltre((f) => ({ ...f, durum: v })),
              },
              {
                label: 'Sözleşme durumu',
                value: filtre.sozlesme,
                options: ['Tümü', 'Aktif', 'Yaklaşıyor', 'Doldu', 'Yok'],
                onChange: (v) => setFiltre((f) => ({ ...f, sozlesme: v })),
              },
              {
                label: 'Tehlike sınıfı',
                value: filtre.tehlike,
                options: ['Tümü', ...TEHLIKE_SINIFLARI],
                onChange: (v) => setFiltre((f) => ({ ...f, tehlike: v })),
              },
              {
                label: 'İşyeri ili',
                value: filtre.il,
                options: ['Tümü', ...ILLER],
                onChange: (v) => setFiltre((f) => ({ ...f, il: v })),
              },
              {
                label: 'İSG hizmet türü',
                value: filtre.hizmet,
                options: ['Tümü', ...HIZMET_TURLERI],
                onChange: (v) => setFiltre((f) => ({ ...f, hizmet: v })),
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
              Arama veya filtre kriterlerinize uyan firma yok.
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
                silLabel="Pasife al"
                onAktar={() => excelleAktar(sirali.filter((f) => seciliIds.has(f.id)))}
                onSil={pasifeAlSecilenler}
                onKapat={() => setSeciliIds(new Set())}
              />
            )}

            {gorunum === 'liste' ? (
              <div ref={alanRef} className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[1150px] text-left text-[13px]">
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
                      <SortBaslik label="Kod" id="kod" aktif={siralama} yon={yon} onClick={siralaClick} className="py-2 pr-3 pl-1" />
                      <SortBaslik label="Firma Adı" id="ad" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Vergi No</th>
                      <SortBaslik label="Tehlike" id="tehlike" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <SortBaslik label="Çalışan" id="calisan" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <th className="px-3 py-2 text-xs font-medium text-muted-foreground">İSG Hizmet</th>
                      <th className="px-3 py-2 text-xs font-medium text-muted-foreground">İSG-KATİP</th>
                      <SortBaslik label="Sözleşme Bitiş" id="bitis" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <SortBaslik label="Durum" id="durum" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                      <th className="w-10 pr-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sayfaSatirlar.map((f) => {
                      const k = katipMap.get(f.id)
                      const eksik = eksikAlanlar(f).length
                      return (
                        <tr
                          key={f.id}
                          onClick={() => navigate(`/panel/firmalar/${f.id}`)}
                          className={cn(
                            'cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/50',
                            seciliIds.has(f.id) && 'bg-amber-500/5 hover:bg-amber-500/10',
                            f.durum === 'Pasif' && 'opacity-60',
                          )}
                        >
                          <td className="py-2 pr-1 pl-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={seciliIds.has(f.id)}
                              onCheckedChange={() => secToggle(f.id)}
                              aria-label={`${f.kod} seç`}
                            />
                          </td>
                          <td className="py-2 pr-3 pl-1 font-mono text-xs font-medium whitespace-nowrap">
                            {f.kod}
                          </td>
                          <td className="max-w-52 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <FirmaAvatar ad={f.kisaAd || f.unvan} logo={f.logo} className="size-8 rounded-lg text-[10px]" />
                              <div className="min-w-0">
                                <p className="truncate font-medium">{f.unvan}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {osgbAdi} · {f.il} / {f.ilce}
                                  {eksik > 0 && <span className="text-amber-600 dark:text-amber-400"> · {eksik} eksik alan</span>}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-muted-foreground">
                            {f.vergiNo || '—'}
                          </td>
                          <td className="px-3 py-2">
                            <TehlikeBadge sinif={f.tehlikeSinifi} />
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <UsersIcon className="size-3 text-muted-foreground" />
                              {f.calisanSayisi}
                            </span>
                          </td>
                          <td className="max-w-40 truncate px-3 py-2">
                            <Pill tone="sky">{f.hizmetTuru.replace('OSGB ', 'OSGB · ')}</Pill>
                          </td>
                          <td className="px-3 py-2">
                            {k ? <KatipDurumBadge durum={k.durum} /> : <Pill tone="zinc">Kayıt yok</Pill>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {f.hizmetBitis ? (
                              <>
                                <span className="tabular-nums">{formatKisa(f.hizmetBitis)}</span>
                                <SozlesmeBadge firma={f} />
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <FirmaDurumBadge durum={f.durum} />
                          </td>
                          <td className="py-2 pr-3">{islemMenu(f)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div ref={alanRef} className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-2.5">
                  {sayfaSatirlar.map((f) => {
                    const k = katipMap.get(f.id)
                    return (
                      <div
                        key={f.id}
                        onClick={() => navigate(`/panel/firmalar/${f.id}`)}
                        className={cn(
                          'cursor-pointer rounded-xl border p-3 transition-colors hover:border-foreground/30 hover:bg-muted/40',
                          seciliIds.has(f.id) && 'border-amber-500/50 bg-amber-500/5',
                          f.durum === 'Pasif' && 'opacity-60',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={seciliIds.has(f.id)}
                                onCheckedChange={() => secToggle(f.id)}
                                aria-label={`${f.kod} seç`}
                              />
                            </span>
                            <span className="font-mono text-xs font-medium">{f.kod}</span>
                          </div>
                          {islemMenu(f)}
                        </div>
                        <div className="mt-2 flex min-w-0 items-center gap-2.5">
                          <FirmaAvatar ad={f.kisaAd || f.unvan} logo={f.logo} className="size-10 rounded-xl text-xs" />
                          <p className="line-clamp-2 min-w-0 text-sm leading-snug font-medium">{f.unvan}</p>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {osgbAdi} · {f.il} / {f.ilce} · {f.calisanSayisi} çalışan
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          <TehlikeBadge sinif={f.tehlikeSinifi} />
                          <FirmaDurumBadge durum={f.durum} />
                          {k && <KatipDurumBadge durum={k.durum} />}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {f.hizmetBitis ? `Bitiş: ${formatKisa(f.hizmetBitis)}` : 'Sözleşme yok'}
                          </span>
                          {f.hizmetBitis && <KalanGunBadge bitis={f.hizmetBitis} />}
                        </div>
                      </div>
                    )
                  })}
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

      {duzenle && <FirmaFormDrawer firma={duzenle} onKapat={() => setDuzenle(null)} />}
    </div>
  )
}
