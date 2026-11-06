import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  Building2Icon,
  ChevronDownIcon,
  CircleCheckIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserXIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { CipGrup, FiltrePopover, ListeFooter, SkeletonTablo, SortBaslik } from '@/components/list-bits'
import {
  EksikGorev,
  KatipDurumBadge,
  KalanGunBadge,
  TehlikeBadge,
} from '@/components/firmalar/badges'
import { KatipDetailDrawer } from '@/components/firmalar/katip-detail-drawer'
import { KatipFormDrawer } from '@/components/firmalar/katip-form-drawer'
import { formatKisa } from '@/lib/date'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { cn } from '@/lib/utils'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { TEHLIKE_SINIFLARI } from '@/data/firmalar'
import { eksikGorevlendirme, KATIP_DURUMLAR, kalanGun, SOZLESME_TURLERI } from '@/data/isgkatip'
import type { Firma } from '@/data/firmalar'
import type { KatipKayit } from '@/data/isgkatip'
import { useOtoBoy } from '@/lib/use-oto-boy'

const GUNCELLEME_SAATI = new Date().toLocaleTimeString('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
})

const LISTE_SATIR_H = 46
const LISTE_BASLIK_H = 40

type Siralama = 'firma' | 'baslangic' | 'bitis' | 'durum'
type Hizli =
  | 'Tümü'
  | 'Aktif'
  | 'Süresi Yaklaşan'
  | 'Süresi Dolmuş'
  | 'Eksik Görevlendirme'
  | 'Kontrol Bekliyor'

interface Filtreler {
  q: string
  hizli: Hizli
  firma: string
  personel: string
  sozlesmeTuru: string
  durum: string
  tehlike: string
}

const bosFiltre: Filtreler = {
  q: '',
  hizli: 'Tümü',
  firma: 'Tümü',
  personel: 'Tümü',
  sozlesmeTuru: 'Tümü',
  durum: 'Tümü',
  tehlike: 'Tümü',
}

export default function IsgKatipPage() {
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const katip = useFirmalarStore((s) => s.katip)
  const katipDurumGuncelle = useFirmalarStore((s) => s.katipDurumGuncelle)
  const [params] = useSearchParams()

  const [asama, setAsama] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor')
  const [filtre, setFiltre] = useState<Filtreler>(bosFiltre)
  const [siralama, setSiralama] = useState<Siralama>('bitis')
  const [yon, setYon] = useState<1 | -1>(1)
  const [sayfa, setSayfa] = useState(0)
  const [secili, setSecili] = useState<KatipKayit | null>(null)
  const [duzenle, setDuzenle] = useState<KatipKayit | null>(null)
  const [yeni, setYeni] = useState(false)
  const [sayfaBoyu, setSayfaBoyu] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy('liste', {
    satirH: LISTE_SATIR_H,
    baslikH: LISTE_BASLIK_H,
    kartH: 0,
    kartW: 0,
  })

  useEffect(() => {
    const t = setTimeout(() => setAsama(params.has('hata') ? 'hata' : 'hazir'), 400)
    return () => clearTimeout(t)
  }, [params])

  const firmaById = useMemo(() => new Map(firmalar.map((f) => [f.id, f])), [firmalar])

  const personeller = useMemo(
    () =>
      [...new Set(katip.flatMap((k) => [k.uzman, k.hekim, k.dsp]).filter(Boolean))] as string[],
    [katip],
  )

  const filtreli = useMemo(() => {
    const q = filtre.q.toLocaleLowerCase('tr').trim()
    return katip.filter((k) => {
      const f = firmaById.get(k.firmaId)
      switch (filtre.hizli) {
        case 'Aktif':
          if (k.durum !== 'Aktif') return false
          break
        case 'Süresi Yaklaşan': {
          const g = kalanGun(k.sozlesmeBitis)
          if (k.durum === 'Süresi Dolmuş' || g < 0 || g > 30) return false
          break
        }
        case 'Süresi Dolmuş':
          if (kalanGun(k.sozlesmeBitis) >= 0 && k.durum !== 'Süresi Dolmuş') return false
          break
        case 'Eksik Görevlendirme':
          if (eksikGorevlendirme(k).length === 0) return false
          break
        case 'Kontrol Bekliyor':
          if (k.durum !== 'Kontrol Bekliyor') return false
          break
      }
      if (filtre.firma !== 'Tümü' && k.firmaId !== filtre.firma) return false
      if (filtre.personel !== 'Tümü' && ![k.uzman, k.hekim, k.dsp].includes(filtre.personel))
        return false
      if (filtre.sozlesmeTuru !== 'Tümü' && k.sozlesmeTuru !== filtre.sozlesmeTuru) return false
      if (filtre.durum !== 'Tümü' && k.durum !== filtre.durum) return false
      if (filtre.tehlike !== 'Tümü' && f?.tehlikeSinifi !== filtre.tehlike) return false
      if (
        q &&
        ![k.id, k.sozlesmeNo, f?.unvan, k.uzman, k.hekim, k.dsp]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('tr')
          .includes(q)
      )
        return false
      return true
    })
  }, [katip, firmaById, filtre])

  const sirali = useMemo(() => {
    const arr = [...filtreli]
    arr.sort((a, b) => {
      let k = 0
      if (siralama === 'firma')
        k = (firmaById.get(a.firmaId)?.unvan ?? '').localeCompare(
          firmaById.get(b.firmaId)?.unvan ?? '',
          'tr',
        )
      else if (siralama === 'baslangic') k = a.sozlesmeBaslangic.localeCompare(b.sozlesmeBaslangic)
      else if (siralama === 'bitis') k = a.sozlesmeBitis.localeCompare(b.sozlesmeBitis)
      else k = KATIP_DURUMLAR.indexOf(a.durum) - KATIP_DURUMLAR.indexOf(b.durum)
      return k * yon
    })
    return arr
  }, [filtreli, siralama, yon, firmaById])

  const etkiliBoy = sayfaBoyu === 'oto' ? Math.max(1, otoBoy) : sayfaBoyu
  const sayfaSayisi = Math.max(1, Math.ceil(sirali.length / etkiliBoy))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const sayfaSatirlar = sirali.slice(sayfaGuvenli * etkiliBoy, (sayfaGuvenli + 1) * etkiliBoy)

  const ist = useMemo(() => {
    const aktif = katip.filter((k) => k.durum === 'Aktif')
    return [
      { label: 'Toplam Firma', deger: new Set(katip.map((k) => k.firmaId)).size, ikon: Building2Icon },
      { label: 'Aktif Sözleşme', deger: aktif.length, ikon: ShieldCheckIcon },
      {
        label: 'Süresi Yaklaşan',
        deger: katip.filter((k) => {
          const g = kalanGun(k.sozlesmeBitis)
          return g >= 0 && g <= 30 && k.durum !== 'İptal Edildi' && k.durum !== 'Taslak'
        }).length,
        ikon: ClockIcon,
      },
      {
        label: 'Süresi Dolmuş',
        deger: katip.filter((k) => k.durum === 'Süresi Dolmuş' || kalanGun(k.sozlesmeBitis) < 0).length,
        ikon: AlertTriangleIcon,
      },
      {
        label: 'Eksik Görevlendirme',
        deger: katip.filter((k) => eksikGorevlendirme(k).length > 0).length,
        ikon: UserXIcon,
      },
      {
        label: 'Kontrol Bekleyen',
        deger: katip.filter((k) => k.durum === 'Kontrol Bekliyor').length,
        ikon: EyeIcon,
      },
    ]
  }, [katip])

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

  const excelleAktar = () => {
    xlsxIndir(xlsxDosyaAdi('ISG_KATIP_Kayitlari'), [
      {
        ad: 'İSG-KATİP',
        baslik: 'İSG-KATİP Görevlendirme Kayıtları',
        altBilgi: 'İSG-KATİP modülü',
        kolonlar: [
          { label: 'Kayıt No', minGenislik: 11 },
          { label: 'Firma', minGenislik: 24, wrap: true },
          { label: 'Vergi No', minGenislik: 14 },
          { label: 'Tehlike', minGenislik: 12 },
          { label: 'Uzman', minGenislik: 18 },
          { label: 'Hekim', minGenislik: 18 },
          { label: 'DSP', minGenislik: 18 },
          { label: 'Başlangıç', tip: 'tarih' },
          { label: 'Bitiş', tip: 'tarih' },
          { label: 'Kalan Gün', tip: 'sayi', minGenislik: 11 },
          { label: 'Durum', minGenislik: 12 },
        ],
        satirlar: sirali.map((k) => {
          const f = firmaById.get(k.firmaId)
          return [
            k.id,
            f?.unvan ?? '?',
            f?.vergiNo ?? '',
            f?.tehlikeSinifi ?? '',
            k.uzman ?? '—',
            k.hekim ?? '—',
            k.dsp ?? '—',
            k.sozlesmeBaslangic,
            k.sozlesmeBitis,
            kalanGun(k.sozlesmeBitis),
            k.durum,
          ]
        }),
        ozet: [
          ['Toplam', sirali.length],
          ['Aktif', sirali.filter((k) => k.durum === 'Aktif').length],
          ['Süresi dolmak üzere (90 gün)', sirali.filter((k) => kalanGun(k.sozlesmeBitis) <= 90 && k.durum === 'Aktif').length],
        ],
      },
    ])
    toast.success(`${sirali.length} kayıt Excel'e aktarıldı`)
  }

  const islemMenu = (k: KatipKayit) => (
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
        <DropdownMenuItem onClick={() => setSecili(k)}>
          <EyeIcon /> Detayı görüntüle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDuzenle(k)}>
          <PencilIcon /> Düzenle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {k.durum !== 'Aktif' && k.durum !== 'İptal Edildi' && (
          <DropdownMenuItem
            onClick={() => {
              katipDurumGuncelle(k.id, 'Aktif', 'Kayıt aktifleştirildi')
              toast.success(`${k.id} aktif edildi`)
            }}
          >
            <CircleCheckIcon /> Aktifleştir
          </DropdownMenuItem>
        )}
        {k.durum !== 'İptal Edildi' && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              katipDurumGuncelle(k.id, 'İptal Edildi', 'Sözleşme iptal edildi')
              toast.success(`${k.id} iptal edildi`)
            }}
          >
            <Trash2Icon /> İptal et
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">İSG-KATİP</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Firma sözleşmeleri ve İSG personel görevlendirmelerini takip edin
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
              <DropdownMenuItem
                onClick={() => {
                  xlsxIndir(xlsxDosyaAdi('ISG_KATIP_Sozlesme_Sure'), [
                    {
                      ad: 'Sözleşme Süreleri',
                      baslik: 'Sözleşme Süre Raporu',
                      altBilgi: 'İSG-KATİP raporları',
                      kolonlar: [
                        { label: 'Firma', minGenislik: 26, wrap: true },
                        { label: 'Sözleşme No', minGenislik: 15 },
                        { label: 'Bitiş', tip: 'tarih' },
                        { label: 'Kalan Gün', tip: 'sayi', minGenislik: 11 },
                        { label: 'Durum', minGenislik: 12 },
                      ],
                      satirlar: katip.map((k) => [
                        firmaById.get(k.firmaId)?.unvan ?? '?',
                        k.sozlesmeNo,
                        k.sozlesmeBitis,
                        kalanGun(k.sozlesmeBitis),
                        k.durum,
                      ]),
                    },
                  ])
                  toast.success('Rapor indirildi')
                }}
              >
                Sözleşme süre raporu (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  xlsxIndir(xlsxDosyaAdi('ISG_KATIP_Eksik_Gorevlendirme'), [
                    {
                      ad: 'Eksik Görevlendirme',
                      baslik: 'Eksik Görevlendirme Raporu',
                      altBilgi: 'İSG-KATİP raporları',
                      kolonlar: [
                        { label: 'Firma', minGenislik: 28, wrap: true },
                        { label: 'Eksik Görevlendirme', minGenislik: 30, wrap: true },
                      ],
                      satirlar: katip
                        .map((k) => [
                          firmaById.get(k.firmaId)?.unvan ?? '?',
                          eksikGorevlendirme(k).join(', '),
                        ])
                        .filter((r) => r[1]),
                    },
                  ])
                  toast.success('Rapor indirildi')
                }}
              >
                Eksik görevlendirme raporu (XLSX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setYeni(true)}>
            <PlusIcon /> Yeni Kayıt Ekle
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
            placeholder="Ara: firma, sözleşme no, personel…"
            className="h-8 pl-8 text-[13px]"
          />
        </div>
        <CipGrup
          secenekler={
            ['Tümü', 'Aktif', 'Süresi Yaklaşan', 'Süresi Dolmuş', 'Eksik Görevlendirme', 'Kontrol Bekliyor'] as const
          }
          value={filtre.hizli}
          onChange={(h) => filtreDegis({ ...filtre, hizli: h })}
        />
        <div className="ml-auto flex items-center gap-2">
          {(filtre.q || JSON.stringify(filtre) !== JSON.stringify({ ...bosFiltre, q: filtre.q })) && (
            <button
              type="button"
              onClick={() => filtreDegis(bosFiltre)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              × Temizle
            </button>
          )}
          <FiltrePopover
            aktifSayi={
              [filtre.firma, filtre.personel, filtre.sozlesmeTuru, filtre.durum, filtre.tehlike].filter(
                (v) => v !== 'Tümü',
              ).length
            }
            onTemizle={() => filtreDegis({ ...bosFiltre, q: filtre.q, hizli: filtre.hizli })}
            sorular={[
              {
                label: 'Firma',
                value: firmaById.get(filtre.firma)?.unvan ?? filtre.firma,
                options: ['Tümü', ...firmalar.map((f) => f.unvan)],
                onChange: (v) =>
                  setFiltre((f) => ({
                    ...f,
                    firma: v === 'Tümü' ? 'Tümü' : (firmalar.find((x) => x.unvan === v)?.id ?? 'Tümü'),
                  })),
              },
              {
                label: 'Personel',
                value: filtre.personel,
                options: ['Tümü', ...personeller],
                onChange: (v) => setFiltre((f) => ({ ...f, personel: v })),
              },
              {
                label: 'Sözleşme türü',
                value: filtre.sozlesmeTuru,
                options: ['Tümü', ...SOZLESME_TURLERI],
                onChange: (v) => setFiltre((f) => ({ ...f, sozlesmeTuru: v })),
              },
              {
                label: 'Kayıt durumu',
                value: filtre.durum,
                options: ['Tümü', ...KATIP_DURUMLAR],
                onChange: (v) => setFiltre((f) => ({ ...f, durum: v })),
              },
              {
                label: 'Tehlike sınıfı',
                value: filtre.tehlike,
                options: ['Tümü', ...TEHLIKE_SINIFLARI],
                onChange: (v) => setFiltre((f) => ({ ...f, tehlike: v })),
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
            <Button variant="outline" size="sm" className="mt-2" onClick={() => filtreDegis(bosFiltre)}>
              Filtreleri temizle
            </Button>
          </div>
        ) : (
          <>
            <div ref={alanRef} className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[1150px] text-left text-[13px]">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b">
                    <SortBaslik label="Firma" id="firma" aktif={siralama} yon={yon} onClick={siralaClick} className="py-2 pr-3 pl-3" />
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Vergi / SGK</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Tehlike</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Uzman</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Hekim</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">DSP</th>
                    <SortBaslik label="Başlangıç" id="baslangic" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                    <SortBaslik label="Bitiş" id="bitis" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                    <SortBaslik label="KATİP Durumu" id="durum" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                    <th className="w-10 pr-3" />
                  </tr>
                </thead>
                <tbody>
                  {sayfaSatirlar.map((k) => {
                    const f: Firma | undefined = firmaById.get(k.firmaId)
                    return (
                      <tr
                        key={k.id}
                        onClick={() => setSecili(k)}
                        className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/50"
                      >
                        <td className="max-w-52 py-2 pr-3 pl-3">
                          <p className="truncate font-medium">{f?.unvan ?? '—'}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">{k.id}</p>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-muted-foreground">
                          <p>{f?.vergiNo || '—'}</p>
                          <p className="text-[11px]">{f?.sgkSicil || 'SGK yok'}</p>
                        </td>
                        <td className="px-3 py-2">
                          <TehlikeBadge sinif={f?.tehlikeSinifi ?? ''} />
                        </td>
                        <td className="max-w-36 truncate px-3 py-2">
                          {k.uzman ? (
                            <>
                              {k.uzman}
                              {k.uzmanSinifi && (
                                <span className="ml-1 text-xs text-muted-foreground">({k.uzmanSinifi})</span>
                              )}
                            </>
                          ) : (
                            <EksikGorev rol="Uzman" />
                          )}
                        </td>
                        <td className="max-w-36 truncate px-3 py-2">
                          {k.hekim || <EksikGorev rol="Hekim" />}
                        </td>
                        <td className="max-w-32 truncate px-3 py-2 text-muted-foreground">
                          {k.dsp || '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                          {formatKisa(k.sozlesmeBaslangic)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="mr-1.5 tabular-nums">{formatKisa(k.sozlesmeBitis)}</span>
                          <KalanGunBadge bitis={k.sozlesmeBitis} />
                        </td>
                        <td className="px-3 py-2">
                          <KatipDurumBadge durum={k.durum} />
                        </td>
                        <td className="py-2 pr-3">{islemMenu(k)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

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

      <KatipDetailDrawer
        kayit={secili ? (katip.find((k) => k.id === secili.id) ?? secili) : null}
        onKapat={() => setSecili(null)}
        onDuzenle={(k) => {
          setSecili(null)
          setDuzenle(k)
        }}
      />
      {duzenle && <KatipFormDrawer kayit={duzenle} onKapat={() => setDuzenle(null)} />}
      {yeni && <KatipFormDrawer kayit={null} onKapat={() => setYeni(false)} />}
    </div>
  )
}
