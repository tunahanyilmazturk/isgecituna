import { useMemo, useState } from 'react'
import { DownloadIcon, SearchIcon, TrendingUpIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CipGrup, FiltrePopover, ListeFooter } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { kisiDurumRenk } from '@/data/personeller'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { personelAd } from '@/stores/personeller-store'
import { useFirmaKapsam, useFIzin, takipSatirlari } from './bits'
import { useOtoBoy } from '@/lib/use-oto-boy'

const DURUMLAR = [
  'Tümü',
  'Atanmış',
  'Devam Ediyor',
  'İçerikler Tamamlandı',
  'Sınav Bekleniyor',
  'Sınav Başarılı',
  'Sınav Başarısız',
  'Onay Bekliyor',
  'Tamamlandı',
] as const

/** Eğitim Takibi — (atama × çalışan) kesişiminde ilerleme satırları, yalnız firma kapsamı */
export default function FirmaTakipPage() {
  const k = useFirmaKapsam()
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const ilerlemeIzni = useFIzin('egitim.ilerleme')
  const raporIzni = useFIzin('egitim.rapor')
  const [ara, setAra] = useState('')
  const [egitimId, setEgitimId] = useState('Tümü')
  const [dep, setDep] = useState('Tümü')
  const [durum, setDurum] = useState<(typeof DURUMLAR)[number]>('Tümü')
  const [sayfa, setSayfa] = useState(0)
  const [boyut, setBoyut] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy('liste', { satirH: 53, baslikH: 40, kartH: 0, kartW: 0 })

  const tumSatirlar = useMemo(() => takipSatirlari(k), [k])
  const depList = useMemo(
    () => [...new Set(k.calisanlar.map((p) => p.departman).filter(Boolean))],
    [k.calisanlar],
  )

  const filtreli = tumSatirlar.filter((s) => {
    const p = k.calisanlar.find((x) => x.id === s.personelId)
    if (!p) return false
    if (egitimId !== 'Tümü' && s.egitimId !== egitimId) return false
    if (dep !== 'Tümü' && p.departman !== dep) return false
    if (durum !== 'Tümü' && s.durum !== durum) return false
    if (ara.trim() && !personelAd(p).toLowerCase().includes(ara.trim().toLowerCase())) return false
    return true
  })

  const sayfaBoyu = boyut === 'oto' ? otoBoy : boyut
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / sayfaBoyu))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const liste = filtreli.slice(sayfaGuvenli * sayfaBoyu, sayfaGuvenli * sayfaBoyu + sayfaBoyu)

  const excelleAktar = () => {
    xlsxIndir(xlsxDosyaAdi(`${k.firma?.kisaAd ?? 'Firma'}_Egitim_Takibi`), [
      {
        ad: 'Eğitim Takibi',
        baslik: `${k.firma?.unvan ?? ''} — Eğitim İlerleme Raporu`,
        altBilgi: 'Firma portalı dışa aktarımı',
        kolonlar: [
          { label: 'Çalışan', minGenislik: 20 },
          { label: 'Eğitim', minGenislik: 26 },
          { label: 'Atanma', tip: 'tarih', minGenislik: 12 },
          { label: 'Son Tarih', tip: 'tarih', minGenislik: 12 },
          { label: 'İçerik %', tip: 'sayi', minGenislik: 10 },
          { label: 'Sınav Puanı', tip: 'sayi', minGenislik: 11 },
          { label: 'Deneme', tip: 'sayi', minGenislik: 9 },
          { label: 'Durum', minGenislik: 16 },
        ],
        satirlar: filtreli.map((s) => {
          const p = k.calisanlar.find((x) => x.id === s.personelId)
          const e = egitimler.find((x) => x.id === s.egitimId)
          return [
            personelAd(p!),
            e?.baslik ?? s.egitimId,
            s.atamaTarihi,
            s.sonTarih,
            Math.round(s.icerikOran * 100),
            s.sinavPuan ?? null,
            s.denemeSayisi,
            s.durum,
          ]
        }),
        ozet: [['Toplam kayıt', filtreli.length]],
      },
    ])
    toast.success(`${filtreli.length} kayıt Excel'e aktarıldı`)
  }

  if (!ilerlemeIzni)
    return (
      <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
        Eğitim ilerlemesini görüntüleme yetkiniz yok.
      </div>
    )

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Eğitim Takibi</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {k.firma?.unvan} · {tumSatirlar.length} eğitim kaydı
          </p>
        </div>
        {raporIzni && (
          <Button variant="outline" onClick={excelleAktar}>
            <DownloadIcon /> Rapor indir
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <CipGrup secenekler={DURUMLAR} value={durum} onChange={setDurum} />
        <div className="relative ml-auto min-w-48 flex-1 sm:max-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Çalışan ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <FiltrePopover
          aktifSayi={(egitimId === 'Tümü' ? 0 : 1) + (dep === 'Tümü' ? 0 : 1)}
          onTemizle={() => {
            setEgitimId('Tümü')
            setDep('Tümü')
          }}
          sorular={[
            {
              label: 'Eğitim',
              value: egitimId,
              options: ['Tümü', ...k.atamalarim.map((a) => a.egitimId)],
              onChange: setEgitimId,
            },
            { label: 'Departman', value: dep, options: ['Tümü', ...depList], onChange: setDep },
          ]}
        />
      </div>

      <div ref={alanRef} className="min-h-0 flex-1 overflow-auto px-6 pb-4">
        {filtreli.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
            <TrendingUpIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Kayıt bulunamadı</p>
          </div>
        ) : (
          <table className="w-full min-w-[980px] text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-2.5">Çalışan</th>
                <th className="px-3 py-2.5">Eğitim</th>
                <th className="px-3 py-2.5">Atanma</th>
                <th className="px-3 py-2.5">Son Tarih</th>
                <th className="px-3 py-2.5">İçerik</th>
                <th className="px-3 py-2.5">Sınav</th>
                <th className="px-3 py-2.5">Deneme</th>
                <th className="px-3 py-2.5">Son İşlem</th>
                <th className="px-3 py-2.5">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {liste.map((s) => {
                const p = k.calisanlar.find((x) => x.id === s.personelId)
                const e = egitimler.find((x) => x.id === s.egitimId)
                return (
                  <tr key={`${s.atamaId}-${s.personelId}`} className="hover:bg-muted/40">
                    <td className="px-3 py-3 font-medium">{p ? personelAd(p) : s.personelId}</td>
                    <td className="max-w-56 truncate px-3 py-3 text-muted-foreground">{e?.baslik ?? s.egitimId}</td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{s.atamaTarihi}</td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{s.sonTarih}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-amber-500" style={{ width: `${s.icerikOran * 100}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          %{Math.round(s.icerikOran * 100)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {s.sinavPuan !== undefined ? (
                        <span className={s.sinavGecti ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                          {s.sinavPuan}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{s.denemeSayisi || '—'}</td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">
                      {s.sonErisim?.slice(0, 16).replace('T', ' ') ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', kisiDurumRenk[s.durum as keyof typeof kisiDurumRenk] ?? 'bg-zinc-500/10 text-zinc-500')}>
                        {s.durum}
                      </span>
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
