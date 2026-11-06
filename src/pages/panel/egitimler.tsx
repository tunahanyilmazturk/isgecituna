import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  BarChart3Icon,
  EyeIcon,
  FileTextIcon,
  FileVideoIcon,
  GraduationCapIcon,
  ImageIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  PresentationIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CipGrup, FiltrePopover, GorunumSec, ListeFooter, SortBaslik, StatSerit } from '@/components/list-bits'
import {
  surumIstatistik,
  turLabel,
  type Egitim,
  type EgitimDurum,
  type IcerikTur,
} from '@/data/egitimler'
import { cn } from '@/lib/utils'
import { useIzin } from '@/lib/izin'
import { aktifSurum, useEgitimlerStore } from '@/stores/egitimler-store'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { useOtoBoy } from '@/lib/use-oto-boy'

const DURUMLAR = ['Tümü', 'Yayında', 'Taslak', 'Arşiv'] as const
type Cip = (typeof DURUMLAR)[number]

const durumTon: Record<EgitimDurum, string> = {
  'Yayında': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Taslak': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Arşiv': 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
}

const turIkon: Record<IcerikTur, typeof FileVideoIcon> = {
  video: FileVideoIcon,
  'harici-video': PlayIcon,
  pdf: FileTextIcon,
  slayt: PresentationIcon,
  gorsel: ImageIcon,
  metin: BookOpenIcon,
}

type Siralama = 'guncelleme' | 'baslik' | 'sure'

export default function EgitimlerPage() {
  const navigate = useNavigate()
  const { egitimler, egitimCogalt, egitimSil, yayinla, arsivle } = useEgitimlerStore()
  const goruntuleIzni = useIzin('egitimler.goruntule')
  const onizleIzni = useIzin('egitimler.onizle')
  const olusturIzni = useIzin('egitimler.olustur')
  const duzenleIzni = useIzin('egitimler.duzenle')
  const yayinlaIzni = useIzin('egitimler.yayinla')
  const arsivleIzni = useIzin('egitimler.arsivle')
  const silIzni = useIzin('egitimler.sil')
  const aktarIzni = useIzin('egitimler.aktar')
  const [ara, setAra] = useState('')
  const [cip, setCip] = useState<Cip>('Tümü')
  const [kategori, setKategori] = useState('Tümü')
  const [gorunum, setGorunum] = useState<'liste' | 'kart'>('kart')
  const [sort, setSort] = useState<Siralama>('guncelleme')
  const [yon, setYon] = useState<1 | -1>(-1)
  const [sayfa, setSayfa] = useState(0)
  const [boyut, setBoyut] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy(gorunum, { satirH: 57, baslikH: 45, kartH: 252, kartW: 315 })

  const kategoriler = useMemo(
    () => ['Tümü', ...new Set(egitimler.map((e) => e.kategori))],
    [egitimler],
  )

  const filtreli = useMemo(() => {
    const q = ara.trim().toLowerCase()
    const liste = egitimler.filter((e) => {
      if (cip !== 'Tümü' && e.durum !== cip) return false
      if (kategori !== 'Tümü' && e.kategori !== kategori) return false
      if (q && ![e.baslik, e.aciklama, e.kategori, ...e.etiketler].join(' ').toLowerCase().includes(q))
        return false
      return true
    })
    liste.sort((a, b) => {
      const v =
        sort === 'baslik'
          ? a.baslik.localeCompare(b.baslik, 'tr')
          : sort === 'sure'
            ? a.sureDakika - b.sureDakika
            : a.guncelleme.localeCompare(b.guncelleme)
      return v * yon
    })
    return liste
  }, [egitimler, ara, cip, kategori, sort, yon])

  const sayfaBoyu = boyut === 'oto' ? otoBoy : boyut
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / sayfaBoyu))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const sayfaListe = filtreli.slice(sayfaGuvenli * sayfaBoyu, sayfaGuvenli * sayfaBoyu + sayfaBoyu)

  const say = (d: EgitimDurum) => egitimler.filter((e) => e.durum === d).length

  // Ekrandaki filtre sonucu `filtreli` üzerinden aktarır
  const excelleAktar = () => {
    xlsxIndir(xlsxDosyaAdi('Egitim_Katalogu'), [
      {
        ad: 'Eğitim Kataloğu',
        baslik: 'Eğitim Kataloğu',
        altBilgi: 'Eğitimler modülü',
        kolonlar: [
          { label: 'Kod', minGenislik: 9 },
          { label: 'Eğitim', minGenislik: 34, wrap: true },
          { label: 'Kategori', minGenislik: 18 },
          { label: 'Süre (dk)', tip: 'sayi', minGenislik: 10 },
          { label: 'Bölüm', tip: 'sayi', minGenislik: 9 },
          { label: 'İçerik', tip: 'sayi', minGenislik: 9 },
          { label: 'Soru', tip: 'sayi', minGenislik: 9 },
          { label: 'Sürüm', minGenislik: 9 },
          { label: 'Dil', minGenislik: 8 },
          { label: 'Durum', minGenislik: 11 },
          { label: 'Güncelleme', tip: 'tarih', minGenislik: 13 },
        ],
        satirlar: filtreli.map((e) => {
          const sv = aktifSurum(e)
          const ist = surumIstatistik(sv)
          return [
            e.id,
            e.baslik,
            e.kategori,
            e.sureDakika,
            ist.bolumSayisi,
            ist.icerikSayisi,
            ist.soruSayisi,
            `v${sv?.no ?? '?'}`,
            e.dil,
            e.durum,
            e.guncelleme,
          ]
        }),
        ozet: [
          ['Toplam (filtreli)', filtreli.length],
          ['Yayında', filtreli.filter((e) => e.durum === 'Yayında').length],
          ['Taslak', filtreli.filter((e) => e.durum === 'Taslak').length],
          ['Arşiv', filtreli.filter((e) => e.durum === 'Arşiv').length],
        ],
      },
    ])
    toast.success(`${filtreli.length} eğitim Excel'e aktarıldı`)
  }
  const filtreAktif = (kategori !== 'Tümü' ? 1 : 0)

  const sirala = (s: Siralama) => {
    if (sort === s) setYon((y) => (y === 1 ? -1 : 1) as 1 | -1)
    else {
      setSort(s)
      setYon(s === 'baslik' ? 1 : -1)
    }
  }

  const aksiyonlar = (e: Egitim) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
        }
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onizleIzni && <DropdownMenuItem onClick={() => navigate(`/panel/egitimler/${e.id}/oynat`)}>
          <EyeIcon className="size-4" /> Önizle / Oynat
        </DropdownMenuItem>}
        {onizleIzni && <DropdownMenuItem onClick={() => navigate(`/panel/egitimler/${e.id}/rapor`)}>
          <BarChart3Icon className="size-4" /> Ön sınav raporu
        </DropdownMenuItem>}
        {duzenleIzni && <DropdownMenuItem onClick={() => navigate(`/panel/egitimler/${e.id}/duzenle`)}>
          <PencilIcon className="size-4" /> Düzenle
        </DropdownMenuItem>}
        {olusturIzni && <DropdownMenuItem
          onClick={() => {
            egitimCogalt(e.id)
            toast.success('Eğitim çoğaltıldı — taslak olarak oluşturuldu')
          }}
        >
          <CopyIcon className="size-4" /> Çoğalt
        </DropdownMenuItem>}
        <DropdownMenuSeparator />
        {yayinlaIzni && e.durum !== 'Yayında' && (
          <DropdownMenuItem
            onClick={() => {
              yayinla(e.id)
              toast.success('Eğitim yayına alındı')
            }}
          >
            <CheckCircle2Icon className="size-4" /> Yayınla
          </DropdownMenuItem>
        )}
        {arsivleIzni && <DropdownMenuItem
          onClick={() => {
            arsivle(e.id)
            toast(e.durum === 'Arşiv' ? 'Eğitim arşivden çıkarıldı' : 'Eğitim arşivlendi — geçmiş kayıtlar korunur')
          }}
        >
          {e.durum === 'Arşiv' ? (
            <ArchiveRestoreIcon className="size-4" />
          ) : (
            <ArchiveIcon className="size-4" />
          )}
          {e.durum === 'Arşiv' ? 'Arşivden çıkar' : 'Arşivle'}
        </DropdownMenuItem>}
        <DropdownMenuSeparator />
        {silIzni && <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            egitimSil(e.id)
            toast.error('Eğitim silindi')
          }}
        >
          <Trash2Icon className="size-4" /> Sil
        </DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (!goruntuleIzni) return <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">Eğitim kataloğunu görüntüleme izniniz yok.</div>

  return (
    <div className="flex h-full flex-col">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Eğitimler</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Eğitim katalogu, içerikler, sınavlar ve sürüm yönetimi · {egitimler.length} eğitim
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aktarIzni && <Button variant="outline" onClick={excelleAktar}>
            <DownloadIcon /> Excel'e aktar
          </Button>}
          {olusturIzni && <Button onClick={() => navigate('/panel/egitimler/yeni')}>
            <GraduationCapIcon /> Yeni Eğitim
          </Button>}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="px-6 pb-4">
        <StatSerit
          ogeler={[
            { label: 'Toplam Eğitim', deger: egitimler.length, ikon: GraduationCapIcon },
            { label: 'Yayındaki', deger: say('Yayında'), ikon: CheckCircle2Icon },
            { label: 'Taslak', deger: say('Taslak'), ikon: PencilIcon },
            { label: 'Arşivlenmiş', deger: say('Arşiv'), ikon: ArchiveIcon },
            {
              label: 'Toplam İçerik',
              deger: egitimler.reduce((a, e) => a + surumIstatistik(aktifSurum(e)).icerikSayisi, 0),
              ikon: LayersIcon,
            },
            {
              label: 'Sınav Sorusu',
              deger: egitimler.reduce((a, e) => a + surumIstatistik(aktifSurum(e)).soruSayisi, 0),
              ikon: ClipboardListIcon,
            },
          ]}
        />
      </div>

      {/* Araç çubuğu */}
      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <CipGrup
          secenekler={DURUMLAR}
          value={cip}
          onChange={(v) => {
            setCip(v)
            setSayfa(0)
          }}
        />
        <div className="relative ml-auto min-w-48 flex-1 sm:max-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => {
              setAra(e.target.value)
              setSayfa(0)
            }}
            placeholder="Eğitim ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <FiltrePopover
          aktifSayi={filtreAktif}
          onTemizle={() => setKategori('Tümü')}
          sorular={[{ label: 'Kategori', value: kategori, options: kategoriler, onChange: setKategori }]}
        />
        <GorunumSec value={gorunum} onChange={setGorunum} />
      </div>

      {/* Liste / kart alanı */}
      <div ref={alanRef} className="min-h-0 flex-1 overflow-hidden px-6 pb-2">
        {sayfaListe.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
            <GraduationCapIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Eğitim bulunamadı</p>
            <p className="text-xs text-muted-foreground">Arama veya filtre kriterlerini değiştirin</p>
          </div>
        ) : gorunum === 'kart' ? (
          <div className="grid h-full auto-rows-[252px] grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3 overflow-y-auto pb-2">
            {sayfaListe.map((e) => {
              const sv = aktifSurum(e)
              const ist = surumIstatistik(sv)
              return (
                <div
                  key={e.id}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow] hover:border-amber-500/40 hover:shadow-md"
                >
                  {/* Kapak */}
                  <div className={cn('relative h-24 shrink-0 bg-gradient-to-br', e.kapakTon)}>
                    {e.kapakGorsel && <img src={e.kapakGorsel} alt="" className="absolute inset-0 size-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/25" />
                    {!e.kapakGorsel && <GraduationCapIcon className="absolute right-4 bottom-1 size-16 text-white/15" strokeWidth={1.2} />}
                    <div className="absolute inset-x-3 top-2.5 flex items-center justify-end">
                      <div className="rounded-md bg-black/35 text-white backdrop-blur-sm [&_button]:text-white [&_button]:hover:bg-white/15">
                        {aksiyonlar(e)}
                      </div>
                    </div>
                    <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
                      <Badge className="max-w-[75%] truncate border-white/20 bg-black/35 text-white backdrop-blur-sm">
                        {e.kategori}
                      </Badge>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm',
                          e.durum === 'Yayında'
                            ? 'bg-emerald-500/85 text-white'
                            : e.durum === 'Taslak'
                              ? 'bg-amber-400/90 text-zinc-900'
                              : 'bg-zinc-800/70 text-zinc-200',
                        )}
                      >
                        {e.durum}
                      </span>
                    </div>
                  </div>
                  {/* Gövde */}
                  <div className="flex min-h-0 flex-1 flex-col p-3">
                    {onizleIzni ? (
                      <Link to={`/panel/egitimler/${e.id}`} className="line-clamp-2 text-sm leading-5 font-semibold tracking-tight hover:text-amber-600 dark:hover:text-amber-400">{e.baslik}</Link>
                    ) : (
                      <span className="line-clamp-2 text-sm leading-5 font-semibold tracking-tight">{e.baslik}</span>
                    )}
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{e.aciklama}</p>
                    <div className="mt-auto grid grid-cols-3 divide-x rounded-lg border bg-muted/25 py-1.5">
                      <div className="px-2 text-center">
                        <span className="block text-sm leading-4 font-semibold tabular-nums">{ist.bolumSayisi}</span>
                        <span className="text-[10px] text-muted-foreground">bölüm</span>
                      </div>
                      <div className="px-2 text-center">
                        <span className="block text-sm leading-4 font-semibold tabular-nums">{ist.icerikSayisi}</span>
                        <span className="text-[10px] text-muted-foreground">içerik</span>
                      </div>
                      <div className="px-2 text-center">
                        <span className="block text-sm leading-4 font-semibold tabular-nums">{ist.soruSayisi}</span>
                        <span className="text-[10px] text-muted-foreground">soru</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><ClockIcon className="size-3" /> {e.sureDakika} dk <span className="mx-0.5 text-border">/</span> v{sv.no}</span>
                      <span>Güncelleme {e.guncelleme}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-full overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b bg-card">
                <tr className="text-left">
                  <SortBaslik label="Eğitim" id="baslik" aktif={sort} yon={yon} onClick={sirala} className="px-4 py-2.5" />
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">İçerik</th>
                  <SortBaslik label="Süre" id="sure" aktif={sort} yon={yon} onClick={sirala} className="px-3 py-2.5" />
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Sürüm</th>
                  <SortBaslik label="Güncelleme" id="guncelleme" aktif={sort} yon={yon} onClick={sirala} className="px-3 py-2.5" />
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Durum</th>
                  <th className="w-10 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {sayfaListe.map((e) => {
                  const sv = aktifSurum(e)
                  const ist = surumIstatistik(sv)
                  return (
                    <tr
                      key={e.id}
                      className={cn('transition-colors hover:bg-muted/40', onizleIzni && 'cursor-pointer')}
                      onClick={() => onizleIzni && navigate(`/panel/egitimler/${e.id}`)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', e.kapakTon)}>
                            <GraduationCapIcon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{e.baslik}</p>
                            <p className="truncate text-xs text-muted-foreground">{e.kategori}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {ist.turler.slice(0, 4).map((t) => {
                            const I = turIkon[t]
                            return (
                              <span key={t} title={turLabel[t]} className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5">
                                <I className="size-3" />
                              </span>
                            )
                          })}
                          <span>{ist.icerikSayisi} içerik · {ist.soruSayisi} soru</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">{e.sureDakika} dk</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">v{sv.no}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{e.guncelleme}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumTon[e.durum])}>
                          {e.durum}
                        </span>
                      </td>
                      <td className="px-3 py-2.5" onClick={(ev) => ev.stopPropagation()}>
                        {aksiyonlar(e)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="px-6">
        <ListeFooter
          bas={filtreli.length === 0 ? 0 : sayfaGuvenli * sayfaBoyu + 1}
          son={Math.min(filtreli.length, (sayfaGuvenli + 1) * sayfaBoyu)}
          toplam={filtreli.length}
          sayfaGuvenli={sayfaGuvenli}
          sayfaSayisi={sayfaSayisi}
          sayfaBoyu={boyut}
          otoBoy={otoBoy}
          onBoyut={setBoyut}
          onSayfa={setSayfa}
        />
      </div>
    </div>
  )
}
