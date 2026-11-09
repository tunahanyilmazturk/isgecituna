import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleOffIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserCheckIcon,
  UserXIcon,
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
import { CipGrup, FiltrePopover, ListeFooter, SecimBar, SkeletonTablo, SortBaslik } from '@/components/list-bits'
import {
  Avatar,
  GorevBadge,
  HesapBadge,
  PersonelDurumBadge,
  SinifBadge,
} from '@/components/ekip/badges'
import { EkipFormDrawer } from '@/components/ekip/ekip-form-drawer'
import { Pill } from '@/components/pill'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { osgbAd } from '@/lib/osgb'
import { cn } from '@/lib/utils'
import { useEkipStore } from '@/stores/ekip-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import {
  adSoyad,
  BUGUN,
  GOREV_TURLERI,
  PERSONEL_DURUMLARI,
  type EkipUye,
} from '@/data/ekip'
import { useOtoBoy } from '@/lib/use-oto-boy'

const GUNCELLEME_SAATI = new Date().toLocaleTimeString('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
})

const LISTE_SATIR_H = 46
const LISTE_BASLIK_H = 40
const KART_H = 150
const KART_W = 300

type Siralama = 'ad' | 'gorev' | 'firma' | 'durum'
type Hizli =
  | 'Tümü'
  | 'İSG Uzmanları'
  | 'İşyeri Hekimleri'
  | 'DSP / Hemşire'
  | 'Yöneticiler'
  | 'İdari Personel'
  | 'Hesabı Olmayanlar'

interface Filtreler {
  q: string
  hizli: Hizli
  gorev: string
  sinif: string
  hesap: string
  durum: string
  firma: string
}

const bosFiltre: Filtreler = {
  q: '',
  hizli: 'Tümü',
  gorev: 'Tümü',
  sinif: 'Tümü',
  hesap: 'Tümü',
  durum: 'Tümü',
  firma: 'Tümü',
}

const hesapEtiket = (hesap?: { durum: string }) =>
  !hesap ? 'Hesap Yok' : hesap.durum === 'Pasif' ? 'Pasif' : hesap.durum

export default function EkipPage() {
  const uyeler = useEkipStore((s) => s.uyeler)
  const hesaplar = useEkipStore((s) => s.hesaplar)
  const gorevlendirmeler = useEkipStore((s) => s.gorevlendirmeler)
  const uyeDurum = useEkipStore((s) => s.uyeDurum)
  const hesapDurum = useEkipStore((s) => s.hesapDurum)
  const hesaplarOlustur = useEkipStore((s) => s.hesapOlustur)
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [asama, setAsama] = useState<'yukleniyor' | 'hazir' | 'hata'>('yukleniyor')
  const [filtre, setFiltre] = useState<Filtreler>(bosFiltre)
  const [siralama, setSiralama] = useState<Siralama>('ad')
  const [yon, setYon] = useState<1 | -1>(1)
  const [sayfa, setSayfa] = useState(0)
  const [duzenle, setDuzenle] = useState<EkipUye | 'yeni' | null>(null)
  const [sayfaBoyu, setSayfaBoyu] = useState<'oto' | number>('oto')
  const [seciliIds, setSeciliIds] = useState<Set<string>>(new Set())
  const { alanRef, otoBoy } = useOtoBoy('liste', {
    satirH: LISTE_SATIR_H,
    baslikH: LISTE_BASLIK_H,
    kartH: KART_H,
    kartW: KART_W,
  })

  useEffect(() => {
    const t = setTimeout(() => setAsama(params.has('hata') ? 'hata' : 'hazir'), 400)
    return () => clearTimeout(t)
  }, [params])

  const hesapMap = useMemo(() => new Map(hesaplar.map((h) => [h.personelId, h])), [hesaplar])
  const firmaSayisi = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of gorevlendirmeler) {
      if (g.durum === 'Aktif') m.set(g.personelId, (m.get(g.personelId) ?? 0) + 1)
    }
    return m
  }, [gorevlendirmeler])

  const dspHemsireMi = (g: string) =>
    g === 'Diğer Sağlık Personeli' || g === 'Hemşire'

  const filtreli = useMemo(() => {
    const q = filtre.q.toLocaleLowerCase('tr').trim()
    return uyeler.filter((u) => {
      const hesap = hesapMap.get(u.id)
      const hDurum = hesapEtiket(hesap)
      switch (filtre.hizli) {
        case 'İSG Uzmanları':
          if (u.gorev !== 'İş Güvenliği Uzmanı') return false
          break
        case 'İşyeri Hekimleri':
          if (u.gorev !== 'İşyeri Hekimi') return false
          break
        case 'DSP / Hemşire':
          if (!dspHemsireMi(u.gorev)) return false
          break
        case 'Yöneticiler':
          if (u.gorev !== 'Kurum Müdürü' && u.gorev !== 'Operasyon Sorumlusu') return false
          break
        case 'İdari Personel':
          if (u.gorev !== 'İdari Personel') return false
          break
        case 'Hesabı Olmayanlar':
          if (hDurum !== 'Hesap Yok') return false
          break
      }
      if (filtre.gorev !== 'Tümü' && u.gorev !== filtre.gorev) return false
      if (filtre.sinif !== 'Tümü' && u.uzmanSinifi !== filtre.sinif) return false
      if (filtre.hesap !== 'Tümü' && hDurum !== filtre.hesap) return false
      if (filtre.durum !== 'Tümü' && u.durum !== filtre.durum) return false
      if (
        filtre.firma !== 'Tümü' &&
        !gorevlendirmeler.some(
          (g) => g.personelId === u.id && g.firmaId === filtre.firma && g.durum === 'Aktif',
        )
      )
        return false
      if (
        q &&
        ![adSoyad(u), u.gorev, u.telefon, u.eposta, u.departman, hesap?.kullaniciAdi]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('tr')
          .includes(q)
      )
        return false
      return true
    })
  }, [uyeler, filtre, hesapMap, gorevlendirmeler])

  const sirali = useMemo(() => {
    const arr = [...filtreli]
    arr.sort((a, b) => {
      let k = 0
      if (siralama === 'ad') k = adSoyad(a).localeCompare(adSoyad(b), 'tr')
      else if (siralama === 'gorev') k = a.gorev.localeCompare(b.gorev, 'tr')
      else if (siralama === 'firma')
        k = (firmaSayisi.get(a.id) ?? 0) - (firmaSayisi.get(b.id) ?? 0)
      else k = a.durum.localeCompare(b.durum, 'tr')
      return k * yon
    })
    return arr
  }, [filtreli, siralama, yon, firmaSayisi])

  const etkiliBoy = sayfaBoyu === 'oto' ? Math.max(1, otoBoy) : sayfaBoyu
  const sayfaSayisi = Math.max(1, Math.ceil(sirali.length / etkiliBoy))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const sayfaSatirlar = sirali.slice(sayfaGuvenli * etkiliBoy, (sayfaGuvenli + 1) * etkiliBoy)

  const ist = useMemo(
    () => [
      { label: 'Toplam Ekip Üyesi', deger: uyeler.length, ikon: UsersIcon },
      {
        label: 'İSG Uzmanı',
        deger: uyeler.filter((u) => u.gorev === 'İş Güvenliği Uzmanı').length,
        ikon: ShieldCheckIcon,
      },
      {
        label: 'İşyeri Hekimi',
        deger: uyeler.filter((u) => u.gorev === 'İşyeri Hekimi').length,
        ikon: StethoscopeIcon,
      },
      {
        label: 'DSP / Hemşire',
        deger: uyeler.filter((u) => dspHemsireMi(u.gorev)).length,
        ikon: UserCheckIcon,
      },
      {
        label: 'Aktif Kullanıcı',
        deger: hesaplar.filter((h) => h.durum === 'Aktif').length,
        ikon: KeyRoundIcon,
      },
      {
        label: 'Hesabı Olmayan',
        deger: uyeler.filter((u) => !hesapMap.has(u.id)).length,
        ikon: UserXIcon,
      },
    ],
    [uyeler, hesaplar, hesapMap],
  )

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

  const sayfaTumuSecili =
    sayfaSatirlar.length > 0 && sayfaSatirlar.every((u) => seciliIds.has(u.id))
  const sayfaBazisiSecili = sayfaSatirlar.some((u) => seciliIds.has(u.id))
  const sayfaTumuToggle = () =>
    setSeciliIds((s) => {
      const n = new Set(s)
      for (const u of sayfaSatirlar) {
        if (sayfaTumuSecili) n.delete(u.id)
        else n.add(u.id)
      }
      return n
    })

  const pasifeAlSecilenler = () => {
    const adet = seciliIds.size
    for (const id of seciliIds) uyeDurum(id, 'Pasif')
    setSeciliIds(new Set())
    toast.success(`${adet} personel pasife alındı — geçmiş kayıtlar korunuyor`)
  }

  const excelleAktar = (liste: EkipUye[] = sirali) => {
    xlsxIndir(xlsxDosyaAdi('Ekip_Listesi'), [
      {
        ad: 'Ekip Listesi',
        baslik: `${osgbAd()} Personeli`,
        altBilgi: 'Ekip modülü',
        kolonlar: [
          { label: 'Kod', minGenislik: 9 },
          { label: 'Ad Soyad', minGenislik: 22 },
          { label: 'Görev', minGenislik: 20 },
          { label: 'Uzmanlık/Branş', minGenislik: 16 },
          { label: 'Telefon', minGenislik: 15 },
          { label: 'E-posta', maxGenislik: 36, wrap: true },
          { label: 'Firma Sayısı', tip: 'sayi', minGenislik: 12 },
          { label: 'Hesap', minGenislik: 13 },
          { label: 'Durum', minGenislik: 12 },
        ],
        satirlar: liste.map((u) => [
          u.id,
          adSoyad(u),
          u.gorev,
          u.uzmanSinifi ? `${u.uzmanSinifi} Sınıfı` : (u.brans ?? u.meslekTuru ?? '—'),
          u.telefon,
          u.eposta,
          firmaSayisi.get(u.id) ?? 0,
          hesapEtiket(hesapMap.get(u.id)),
          u.durum,
        ]),
        ozet: [
          ['Toplam', liste.length],
          ['Aktif', liste.filter((u) => u.durum === 'Aktif').length],
          ['Hesabı olan', liste.filter((u) => hesapMap.has(u.id)).length],
        ],
      },
    ])
    toast.success(`${liste.length} kayıt Excel'e aktarıldı`)
  }

  const hesapYonet = (u: EkipUye) => {
    const hesap = hesapMap.get(u.id)
    if (!hesap) {
      hesaplarOlustur({
        personelId: u.id,
        kullaniciAdi: `${u.ad[0] ?? ''}${u.soyad}`
          .toLocaleLowerCase('tr')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ''),
        eposta: u.eposta,
        rol: 'İdari Personel',
        durum: 'Davet Bekliyor',
        davetTarihi: BUGUN,
      })
      toast.success(`${adSoyad(u)} için davet bağlantısı oluşturuldu`)
      return
    }
    if (hesap.durum === 'Davet Bekliyor') {
      hesapDurum(u.id, 'Davet Bekliyor', 'Davet bağlantısı yeniden gönderildi')
      toast.success(`Davet bağlantısı yeniden gönderildi: ${hesap.eposta}`)
      return
    }
    if (hesap.durum === 'Aktif') {
      hesapDurum(u.id, 'Pasif', 'Yönetici tarafından devre dışı bırakıldı')
      toast.success(`@${hesap.kullaniciAdi} hesabı devre dışı bırakıldı`)
      return
    }
    hesapDurum(u.id, 'Aktif', 'Yönetici tarafından aktifleştirildi')
    toast.success(`@${hesap.kullaniciAdi} hesabı aktifleştirildi`)
  }

  const hesapMenuEtiket = (u: EkipUye) => {
    const h = hesapMap.get(u.id)
    if (!h) return 'Hesap oluştur'
    if (h.durum === 'Davet Bekliyor') return 'Daveti yeniden gönder'
    if (h.durum === 'Aktif') return 'Hesabı devre dışı bırak'
    return 'Hesabı aktifleştir'
  }

  const islemMenu = (u: EkipUye) => (
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
        <DropdownMenuItem onClick={() => navigate(`/panel/ekip/${u.id}`)}>
          <EyeIcon /> Detayı görüntüle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDuzenle(u)}>
          <PencilIcon /> Düzenle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => hesapYonet(u)}>
          <KeyRoundIcon /> {hesapMenuEtiket(u)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {u.durum === 'Aktif' || u.durum === 'İzinli' ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              uyeDurum(u.id, 'Pasif')
              toast.success(`${adSoyad(u)} pasife alındı — geçmiş kayıtlar korunuyor`)
            }}
          >
            <CircleOffIcon /> Pasife al
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              uyeDurum(u.id, 'Aktif')
              toast.success(`${adSoyad(u)} aktifleştirildi`)
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
          <h1 className="text-xl font-semibold tracking-tight">Ekip Yönetimi</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Kurum çalışanlarını, mesleki yetkinlikleri ve kullanıcı hesaplarını yönetin
            <span className="ml-2 text-xs">· Son güncelleme: bugün {GUNCELLEME_SAATI}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => excelleAktar()}>
            <DownloadIcon /> Excel'e aktar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <FileTextIcon /> Ekip Raporları <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  xlsxIndir(xlsxDosyaAdi('Ekip_Gorev_Dagilimi'), [
                    {
                      ad: 'Görev Dağılımı',
                      baslik: 'Ekip Görev Dağılımı',
                      altBilgi: 'Ekip raporları',
                      kolonlar: [
                        { label: 'Görev', minGenislik: 24 },
                        { label: 'Adet', tip: 'sayi' },
                      ],
                      satirlar: GOREV_TURLERI.map((g) => [
                        g,
                        uyeler.filter((u) => u.gorev === g).length,
                      ]).filter((r) => Number(r[1]) > 0),
                    },
                  ])
                  toast.success('Rapor indirildi')
                }}
              >
                Görev dağılımı (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  xlsxIndir(xlsxDosyaAdi('Ekip_Hesap_Ozeti'), [
                    {
                      ad: 'Kullanıcı Hesapları',
                      baslik: 'Ekip Kullanıcı Hesapları',
                      altBilgi: 'Ekip raporları',
                      kolonlar: [
                        { label: 'Ad Soyad', minGenislik: 22 },
                        { label: 'Kullanıcı Adı', minGenislik: 18 },
                        { label: 'Rol', minGenislik: 14 },
                        { label: 'Hesap Durumu', minGenislik: 14 },
                        { label: 'Son Giriş', tip: 'tarih', minGenislik: 15 },
                      ],
                      satirlar: hesaplar.map((h) => {
                        const p = uyeler.find((u) => u.id === h.personelId)
                        return [p ? adSoyad(p) : h.personelId, h.kullaniciAdi, h.rol, h.durum, h.sonGiris ?? '—']
                      }),
                    },
                  ])
                  toast.success('Rapor indirildi')
                }}
              >
                Kullanıcı hesapları (XLSX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setDuzenle('yeni')}>
            <PlusIcon /> Yeni Ekip Üyesi
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
            placeholder="Ara: isim, görev, telefon…"
            className="h-8 pl-8 text-[13px]"
          />
        </div>
        <CipGrup
          secenekler={
            [
              'Tümü',
              'İSG Uzmanları',
              'İşyeri Hekimleri',
              'DSP / Hemşire',
              'Yöneticiler',
              'İdari Personel',
              'Hesabı Olmayanlar',
            ] as const
          }
          value={filtre.hizli}
          onChange={(h) => filtreDegis({ ...filtre, hizli: h })}
        />
        <div className="ml-auto flex items-center gap-2">
          {(JSON.stringify({ ...filtre, q: '' }) !== JSON.stringify({ ...bosFiltre, q: '' }) || filtre.q) && (
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
              [filtre.gorev, filtre.sinif, filtre.hesap, filtre.durum, filtre.firma].filter(
                (v) => v !== 'Tümü',
              ).length
            }
            onTemizle={() => filtreDegis({ ...bosFiltre, q: filtre.q, hizli: filtre.hizli })}
            sorular={[
              {
                label: 'Görev / Meslek',
                value: filtre.gorev,
                options: ['Tümü', ...GOREV_TURLERI],
                onChange: (v) => setFiltre((f) => ({ ...f, gorev: v })),
              },
              {
                label: 'Uzmanlık sınıfı',
                value: filtre.sinif,
                options: ['Tümü', 'A', 'B', 'C'],
                onChange: (v) => setFiltre((f) => ({ ...f, sinif: v })),
              },
              {
                label: 'Hesap durumu',
                value: filtre.hesap,
                options: ['Tümü', 'Aktif', 'Davet Bekliyor', 'Hesap Yok', 'Pasif'],
                onChange: (v) => setFiltre((f) => ({ ...f, hesap: v })),
              },
              {
                label: 'Personel durumu',
                value: filtre.durum,
                options: ['Tümü', ...PERSONEL_DURUMLARI],
                onChange: (v) => setFiltre((f) => ({ ...f, durum: v })),
              },
              {
                label: 'Firma görevlendirmesi',
                value: filtre.firma,
                options: ['Tümü', ...firmalar.map((f) => f.id)],
                onChange: (v) => setFiltre((f) => ({ ...f, firma: v })),
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
              Arama veya filtre kriterlerinize uyan ekip üyesi yok.
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
                onAktar={() => excelleAktar(sirali.filter((u) => seciliIds.has(u.id)))}
                onSil={pasifeAlSecilenler}
                onKapat={() => setSeciliIds(new Set())}
              />
            )}

            <div ref={alanRef} className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[1050px] text-left text-[13px]">
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
                    <SortBaslik label="Personel" id="ad" aktif={siralama} yon={yon} onClick={siralaClick} className="py-2 pr-3 pl-1" />
                    <SortBaslik label="Görevi" id="gorev" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Uzmanlık / Branş</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Telefon</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">E-posta</th>
                    <SortBaslik label="Sorumlu Firma" id="firma" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Kullanıcı Hesabı</th>
                    <SortBaslik label="Durum" id="durum" aktif={siralama} yon={yon} onClick={siralaClick} className="px-3 py-2" />
                    <th className="w-10 pr-3" />
                  </tr>
                </thead>
                <tbody>
                  {sayfaSatirlar.map((u) => {
                    const hesap = hesapMap.get(u.id)
                    const firmaSayi = firmaSayisi.get(u.id) ?? 0
                    return (
                      <tr
                        key={u.id}
                        onClick={() => navigate(`/panel/ekip/${u.id}`)}
                        className={cn(
                          'cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/50',
                          seciliIds.has(u.id) && 'bg-amber-500/5 hover:bg-amber-500/10',
                          u.durum !== 'Aktif' && 'opacity-60',
                        )}
                      >
                        <td className="py-2 pr-1 pl-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={seciliIds.has(u.id)}
                            onCheckedChange={() => secToggle(u.id)}
                            aria-label={`${adSoyad(u)} seç`}
                          />
                        </td>
                        <td className="py-2 pr-3 pl-1">
                          <div className="flex items-center gap-2.5">
                            <Avatar uye={u} boyut="md" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{adSoyad(u)}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <GorevBadge gorev={u.gorev} />
                        </td>
                        <td className="px-3 py-2">
                          {u.uzmanSinifi ? (
                            <SinifBadge sinif={u.uzmanSinifi} />
                          ) : u.brans || u.meslekTuru ? (
                            <Pill tone="sky">{u.brans || u.meslekTuru}</Pill>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{u.telefon}</td>
                        <td className="max-w-52 truncate px-3 py-2 text-muted-foreground">{u.eposta}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <UsersIcon className="size-3 text-muted-foreground" />
                            {firmaSayi}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <HesapBadge
                            hesap={hesap ? (hesap.durum as 'Aktif' | 'Davet Bekliyor' | 'Pasif') : 'Hesap Yok'}
                            kullaniciAdi={hesap?.kullaniciAdi}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <PersonelDurumBadge durum={u.durum} />
                        </td>
                        <td className="pr-3" onClick={(e) => e.stopPropagation()}>
                          {islemMenu(u)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ListeFooter
              bas={sayfaGuvenli * etkiliBoy + 1}
              son={Math.min(sirali.length, (sayfaGuvenli + 1) * etkiliBoy)}
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

      <EkipFormDrawer uye={duzenle === 'yeni' ? 'yeni' : duzenle} onKapat={() => setDuzenle(null)} />
    </div>
  )
}
