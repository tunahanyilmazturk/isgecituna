import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AwardIcon,
  BadgeCheckIcon,
  BanIcon,
  CalendarIcon,
  ChevronLeftIcon,
  DownloadIcon,
  FileBadgeIcon,
  HistoryIcon,
  PaletteIcon,
  SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CipGrup, FiltrePopover, GorunumSec, ListeFooter, StatSerit } from '@/components/list-bits'
import { SertifikaOnizleme } from '@/components/sertifika/onizleme'
import { cn } from '@/lib/utils'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { sertifikaPdfIndirV2 } from '@/lib/sertifika-render'
import { durumRenkSertifika, sertifikaGuncelDurum } from '@/data/sertifikalar'
import { veriGetir } from '@/data/sertifika-tasarim'
import { TODAY } from '@/data/dashboard'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useIzin } from '@/lib/izin'
import { useOtoBoy } from '@/lib/use-oto-boy'

const CIPLER = ['Tümü', 'Aktif', 'Süresi Doldu', 'İptal Edildi'] as const
type Cip = (typeof CIPLER)[number]

/** Küçük şablon önizlemesi — v2 tasarım varsa canlı render, yoksa renk rozeti */
function SablonThumb({ s }: { s: import('@/data/sertifikalar').Sertifika }) {
  if (s.tasarim)
    return (
      <span className="pointer-events-none block overflow-hidden rounded border shadow-sm">
        <SertifikaOnizleme elemanlar={s.tasarim.elemanlar} yon={s.tasarim.yon} zemin={s.tasarim.zemin} veri={veriGetir(s)} olcek={s.tasarim.yon === 'yatay' ? 0.04 : 0.056} />
      </span>
    )
  return (
    <span
      className="flex size-9 items-center justify-center rounded-lg text-white"
      style={{ background: `linear-gradient(135deg, ${s.sablonSnap.anaRenk}, ${s.sablonSnap.vurguRenk})` }}
    >
      <AwardIcon className="size-4.5" />
    </span>
  )
}

export default function SertifikalarPage() {
  const { sertifikalar, tasarimlar } = useSertifikaStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const sablonIzni = useIzin('sertifikalar.sablon')
  const nav = useNavigate()

  const [cip, setCip] = useState<Cip>('Tümü')
  const [ara, setAra] = useState('')
  const [firmaF, setFirmaF] = useState('Tümü')
  const [egitimF, setEgitimF] = useState('Tümü')
  const [sablonF, setSablonF] = useState('Tümü')
  const [yonF, setYonF] = useState('Tümü')
  const [gorunum, setGorunum] = useState<'liste' | 'kart'>('liste')
  const [sayfa, setSayfa] = useState(0)
  const [boyut, setBoyut] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy('liste', { satirH: 57, baslikH: 40, kartH: 340, kartW: 300 })

  const filtreli = useMemo(() => {
    const q = ara.trim().toLowerCase()
    return sertifikalar.filter((s) => {
      if (cip !== 'Tümü' && sertifikaGuncelDurum(s) !== cip) return false
      if (firmaF !== 'Tümü' && s.firmaAd !== firmaF) return false
      if (egitimF !== 'Tümü' && s.egitimAd !== egitimF) return false
      if (sablonF !== 'Tümü' && (s.tasarim?.sablonAd ?? 'Klasik') !== sablonF) return false
      if (yonF !== 'Tümü' && (s.tasarim?.yon === 'dikey' ? 'Dikey' : 'Yatay') !== yonF) return false
      if (q && ![s.sertifikaNo, s.personelAd, s.firmaAd, s.egitimAd].join(' ').toLowerCase().includes(q))
        return false
      return true
    })
  }, [sertifikalar, cip, ara, firmaF, egitimF, sablonF, yonF])

  const sayfaBoyu = boyut === 'oto' ? otoBoy : boyut
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / sayfaBoyu))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const liste = filtreli.slice(sayfaGuvenli * sayfaBoyu, sayfaGuvenli * sayfaBoyu + sayfaBoyu)

  const sayDurum = (d2: string) => sertifikalar.filter((s) => sertifikaGuncelDurum(s) === d2).length
  const buAy = sertifikalar.filter((s) => s.duzenlenmeTarihi.slice(0, 7) === TODAY.slice(0, 7)).length

  const pdfIndir = async (s: (typeof sertifikalar)[number]) => {
    try {
      await sertifikaPdfIndirV2(s)
      toast.success(`${s.sertifikaNo} PDF olarak indirildi`)
    } catch (error) {
      console.error('Sertifika PDF indirilemedi', error)
      toast.error('PDF hazırlanamadı. Lütfen tekrar deneyin.')
    }
  }

  const excelleAktar = () => {
    xlsxIndir(xlsxDosyaAdi('Sertifikalar'), [
      {
        ad: 'Sertifikalar',
        baslik: 'Yayımlanmış Sertifikalar',
        altBilgi: 'Sertifika yönetimi',
        kolonlar: [
          { label: 'Sertifika No', minGenislik: 16 },
          { label: 'Personel', minGenislik: 22 },
          { label: 'Firma', minGenislik: 26, wrap: true },
          { label: 'Eğitim', minGenislik: 32, wrap: true },
          { label: 'Şablon', minGenislik: 18 },
          { label: 'Yön', minGenislik: 8 },
          { label: 'Süre (dk)', tip: 'sayi', minGenislik: 10 },
          { label: 'Tamamlanma', tip: 'tarih' },
          { label: 'Düzenlenme', tip: 'tarih' },
          { label: 'Geçerlilik', tip: 'tarih' },
          { label: 'Onaylayan', minGenislik: 18 },
          { label: 'Durum', minGenislik: 13 },
        ],
        satirlar: filtreli.map((s) => [
          s.sertifikaNo,
          s.personelAd,
          s.firmaAd,
          s.egitimAd,
          s.tasarim?.sablonAd ?? 'Klasik',
          s.tasarim?.yon === 'dikey' ? 'Dikey' : 'Yatay',
          s.egitimSure,
          s.tamamlanmaTarihi,
          s.duzenlenmeTarihi,
          s.gecerlilikTarihi ?? 'Süresiz',
          s.onaylayan,
          sertifikaGuncelDurum(s),
        ]),
        ozet: [
          ['Toplam', sertifikalar.length],
          ['Aktif', sayDurum('Aktif')],
          ['Süresi dolan', sayDurum('Süresi Doldu')],
          ['İptal', sayDurum('İptal Edildi')],
        ],
      },
    ])
    toast.success(`${filtreli.length} sertifika Excel'e aktarıldı`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sertifikalar</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Onaylanmış ve yayımlanmış sertifika belgeleri · {sertifikalar.length} belge
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sablonIzni && (
            <Button variant="outline" onClick={() => nav('/panel/sertifika-tasarimlari')}>
              <PaletteIcon /> Tasarım Merkezi
            </Button>
          )}
          <Button variant="outline" onClick={excelleAktar}>
            <DownloadIcon /> Excel'e aktar
          </Button>
        </div>
      </div>

      <div className="px-6 pb-4">
        <StatSerit
          ogeler={[
            { label: 'Toplam Sertifika', deger: sertifikalar.length, ikon: AwardIcon },
            { label: 'Aktif', deger: sayDurum('Aktif'), ikon: BadgeCheckIcon },
            { label: 'Bu Ay Düzenlenen', deger: buAy, ikon: CalendarIcon },
            { label: 'Süresi Dolan', deger: sayDurum('Süresi Doldu'), ikon: HistoryIcon },
            { label: 'İptal Edilen', deger: sayDurum('İptal Edildi'), ikon: BanIcon },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <CipGrup secenekler={CIPLER} value={cip} onChange={setCip} />
        <div className="relative min-w-48 flex-1 sm:max-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="No, personel, firma veya eğitim ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <FiltrePopover
          aktifSayi={[firmaF, egitimF, sablonF, yonF].filter((f) => f !== 'Tümü').length}
          onTemizle={() => {
            setFirmaF('Tümü')
            setEgitimF('Tümü')
            setSablonF('Tümü')
            setYonF('Tümü')
          }}
          sorular={[
            { label: 'Firma', value: firmaF, options: ['Tümü', ...firmalar.map((f) => f.unvan)], onChange: setFirmaF },
            { label: 'Eğitim', value: egitimF, options: ['Tümü', ...egitimler.map((e) => e.baslik)], onChange: setEgitimF },
            { label: 'Şablon', value: sablonF, options: ['Tümü', 'Klasik', ...tasarimlar.map((t) => t.ad)], onChange: setSablonF },
            { label: 'Yön', value: yonF, options: ['Tümü', 'Yatay', 'Dikey'], onChange: setYonF },
          ]}
        />
        <GorunumSec value={gorunum} onChange={setGorunum} />
      </div>

      <div ref={alanRef} className="min-h-0 flex-1 overflow-auto px-6 pb-4">
        {filtreli.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
            <FileBadgeIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Sertifika bulunamadı</p>
            <p className="text-xs text-muted-foreground">Onaylanan başvurular burada belge olarak yayımlanır</p>
          </div>
        ) : gorunum === 'kart' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {liste.map((s) => {
              const d = sertifikaGuncelDurum(s)
              return (
                <button
                  key={s.id}
                  onClick={() => nav(`/panel/sertifikalar/${s.id}`)}
                  className="overflow-hidden rounded-2xl border bg-card text-left transition-shadow hover:shadow-lg"
                >
                  <div className="flex h-44 items-center justify-center overflow-hidden bg-zinc-100 p-3 dark:bg-zinc-900">
                    {s.tasarim ? (
                      <span className="pointer-events-none block overflow-hidden rounded-sm shadow">
                        <SertifikaOnizleme elemanlar={s.tasarim.elemanlar} yon={s.tasarim.yon} zemin={s.tasarim.zemin} veri={veriGetir(s)} iptal={s.durum === 'İptal Edildi'} olcek={s.tasarim.yon === 'yatay' ? 0.2 : 0.15} />
                      </span>
                    ) : (
                      <span className="flex size-12 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${s.sablonSnap.anaRenk}, ${s.sablonSnap.vurguRenk})` }}>
                        <AwardIcon className="size-6" />
                      </span>
                    )}
                  </div>
                  <div className="border-t p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-medium tabular-nums">{s.sertifikaNo}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', durumRenkSertifika[d])}>{d}</span>
                    </div>
                    <p className="mt-1 truncate text-sm">{s.personelAd}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.egitimAd}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="rounded-md bg-muted px-1.5 py-0.5">{s.tasarim?.sablonAd ?? 'Klasik'}</span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5">{s.tasarim?.yon === 'dikey' ? 'Dikey' : 'Yatay'}</span>
                      <span className="ml-auto tabular-nums">{s.duzenlenmeTarihi}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <table className="w-full min-w-[1240px] text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-2.5">Şablon</th>
                <th className="px-3 py-2.5">Sertifika No</th>
                <th className="px-3 py-2.5">Personel</th>
                <th className="px-3 py-2.5">Firma</th>
                <th className="px-3 py-2.5">Eğitim</th>
                <th className="px-3 py-2.5">Yön</th>
                <th className="px-3 py-2.5">Düzenlenme</th>
                <th className="px-3 py-2.5">Geçerlilik</th>
                <th className="px-3 py-2.5">Durum</th>
                <th className="px-3 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {liste.map((s) => {
                const d = sertifikaGuncelDurum(s)
                return (
                  <tr
                    key={s.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => nav(`/panel/sertifikalar/${s.id}`)}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <SablonThumb s={s} />
                        <span className="max-w-28 truncate text-[11px] text-muted-foreground">{s.tasarim?.sablonAd ?? 'Klasik'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium tabular-nums">{s.sertifikaNo}</td>
                    <td className="px-3 py-3">{s.personelAd}</td>
                    <td className="max-w-44 truncate px-3 py-3 text-muted-foreground">{s.firmaAd}</td>
                    <td className="max-w-64 px-3 py-3">
                      <p className="truncate">{s.egitimAd}</p>
                      <p className="text-[11px] text-muted-foreground">
                        v{s.egitimSurumNo} · {s.egitimSure} dk
                      </p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{s.tasarim?.yon === 'dikey' ? 'Dikey' : 'Yatay'}</td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{s.duzenlenmeTarihi}</td>
                    <td className="px-3 py-3 text-muted-foreground">{s.gecerlilikTarihi ?? 'Süresiz'}</td>
                    <td className="px-3 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenkSertifika[d])}>
                        {d}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          aria-label="PDF indir"
                          title="PDF indir"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => void pdfIndir(s)}
                        >
                          <DownloadIcon className="size-4" />
                        </button>
                        <button
                          aria-label="Detay"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                          onClick={() => nav(`/panel/sertifikalar/${s.id}`)}
                        >
                          <ChevronLeftIcon className="size-4 rotate-180" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ListeFooter
        bas={filtreli.length === 0 ? 0 : sayfaGuvenli * sayfaBoyu + 1}
        son={Math.min(filtreli.length, (sayfaGuvenli + 1) * sayfaBoyu)}
        toplam={filtreli.length}
        sayfaGuvenli={sayfaGuvenli}
        sayfaSayisi={sayfaSayisi}
        sayfaBoyu={boyut}
        otoBoy={otoBoy}
        onSayfa={setSayfa}
        onBoyut={(b) => {
          setBoyut(b)
          setSayfa(0)
        }}
      />
    </div>
  )
}
