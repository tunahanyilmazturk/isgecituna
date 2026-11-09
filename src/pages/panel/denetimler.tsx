import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  AlarmClockCheckIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileBarChartIcon,
  FileWarningIcon,
  ListTodoIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CipGrup, FiltrePopover, GorunumSec, ListeFooter, SortBaslik, StatSerit } from '@/components/list-bits'
import { xlsxTekSayfa } from '@/lib/excel'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import { formatKisa, gunFarki } from '@/lib/date'
import {
  DURUMLAR,
  bulguDurumRenk,
  durumRenk,
  maddeIstat,
  onemRenk,
  puanHesapla,
  type Denetim,
  type DenetimDurum,
} from '@/data/denetimler'
import { aksiyonAcik, aksiyonGecikmis } from '@/data/risk'
import { useDenetimlerStore } from '@/stores/denetimler-store'
import { useRiskStore } from '@/stores/risk-store'
import { useIzin } from '@/lib/izin'
import { kapsamdaMi, useKapsam } from '@/lib/kapsam'
import { useOtoBoy } from '@/lib/use-oto-boy'

type Siralama = 'tarih' | 'baslik' | 'firma' | 'puan' | 'uygunsuzluk'
type Gorunum = 'liste' | 'kart'

export default function DenetimlerPage() {
  const { denetimler, bulgular } = useDenetimlerStore()
  const aksiyonlar = useRiskStore((s) => s.aksiyonlar)
  const nav = useNavigate()
  const olusturIzni = useIzin('gorevlendirmeler.olustur')
  const aktarIzni = useIzin('gorevlendirmeler.aktar')
  const kapsam = useKapsam('denetimler')

  const [q, setQ] = useState('')
  const [cip, setCip] = useState<DenetimDurum | 'Tümü'>('Tümü')
  const [firmaF, setFirmaF] = useState('Tümü')
  const [turF, setTurF] = useState('Tümü')
  const [uzmanF, setUzmanF] = useState('Tümü')
  const [bulguF, setBulguF] = useState('Tümü')
  const [tarihMin, setTarihMin] = useState('')
  const [tarihMax, setTarihMax] = useState('')
  const [gorunum, setGorunum] = useState<Gorunum>('liste')
  const [takvim, setTakvim] = useState(false)
  const [sort, setSort] = useState<Siralama>('tarih')
  const [yon, setYon] = useState<1 | -1>(-1)
  const [sayfa, setSayfa] = useState(0)
  const [sayfaBoyu, setSayfaBoyu] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy(gorunum, { satirH: 53, baslikH: 76, kartH: 208, kartW: 330 })

  const gorunen = useMemo(
    () =>
      denetimler.filter(
        (d) => kapsamdaMi(kapsam, d.firmaId) && (!kapsam.sadeceKendi || d.olusturan === kapsam.kullanici || d.uzmanAd === kapsam.kullanici),
      ),
    [denetimler, kapsam],
  )
  const gorunenIds = useMemo(() => new Set(gorunen.map((d) => d.id)), [gorunen])
  const gorunenBulgular = useMemo(() => bulgular.filter((b) => gorunenIds.has(b.denetimId)), [bulgular, gorunenIds])
  const denetimAksiyonlar = useMemo(
    () => aksiyonlar.filter((a) => a.kaynak?.tur === 'denetim' && kapsamdaMi(kapsam, a.firmaId)),
    [aksiyonlar, kapsam],
  )

  /* ------------------------------ İstatistikler ----------------------------- */
  const istat = useMemo(() => {
    const acik = gorunenBulgular.filter((b) => b.durum !== 'Kapatıldı' && b.durum !== 'İptal Edildi').length
    const acikAk = denetimAksiyonlar.filter(aksiyonAcik).length
    const gecikmis = denetimAksiyonlar.filter(aksiyonGecikmis).length
    return {
      toplam: gorunen.length,
      planli: gorunen.filter((d) => d.durum === 'Planlandı').length,
      devam: gorunen.filter((d) => d.durum === 'Devam Ediyor').length,
      tamam: gorunen.filter((d) => d.durum === 'Tamamlandı').length,
      bulgu: acik,
      aksiyon: acikAk,
      gecikmis,
    }
  }, [gorunen, gorunenBulgular, denetimAksiyonlar])

  /* --------------------------------- Liste --------------------------------- */
  const bulguSayi = useMemo(() => {
    const m = new Map<string, number>()
    bulgular.forEach((b) => m.set(b.denetimId, (m.get(b.denetimId) ?? 0) + 1))
    return m
  }, [bulgular])

  const filtreli = useMemo(() => {
    const s = q.trim().toLowerCase()
    const l = gorunen.filter((d) => {
      if (cip !== 'Tümü' && d.durum !== cip) return false
      if (firmaF !== 'Tümü' && d.firmaAd !== firmaF) return false
      if (turF !== 'Tümü' && d.turAd !== turF) return false
      if (uzmanF !== 'Tümü' && d.uzmanAd !== uzmanF) return false
      if (bulguF !== 'Tümü') {
        const n = bulguSayi.get(d.id) ?? 0
        if (bulguF === 'Uygunsuzluk var' && n === 0) return false
        if (bulguF === 'Uygunsuzluk yok' && n > 0) return false
      }
      if (tarihMin && d.planlananTarih < tarihMin) return false
      if (tarihMax && d.planlananTarih > tarihMax) return false
      if (s && ![d.no, d.baslik, d.firmaAd, d.lokasyon, d.uzmanAd, d.turAd].join(' ').toLowerCase().includes(s)) return false
      return true
    })
    const fn: Record<Siralama, (a: Denetim, b: Denetim) => number> = {
      tarih: (a, b) => a.planlananTarih.localeCompare(b.planlananTarih),
      baslik: (a, b) => a.baslik.localeCompare(b.baslik, 'tr'),
      firma: (a, b) => a.firmaAd.localeCompare(b.firmaAd, 'tr'),
      puan: (a, b) => (puanHesapla(a.maddeler) ?? -1) - (puanHesapla(b.maddeler) ?? -1),
      uygunsuzluk: (a, b) => (bulguSayi.get(a.id) ?? 0) - (bulguSayi.get(b.id) ?? 0),
    }
    return l.sort((a, b) => fn[sort](a, b) * yon)
  }, [gorunen, q, cip, firmaF, turF, uzmanF, bulguF, tarihMin, tarihMax, sort, yon, bulguSayi])

  const boy = sayfaBoyu === 'oto' ? otoBoy : sayfaBoyu
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / boy))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const dilim = filtreli.slice(sayfaGuvenli * boy, sayfaGuvenli * boy + boy)
  const bas = filtreli.length === 0 ? 0 : sayfaGuvenli * boy + 1
  const son = Math.min(sayfaGuvenli * boy + boy, filtreli.length)

  const aktifFiltre = [firmaF, turF, uzmanF, bulguF].filter((v) => v !== 'Tümü').length + (tarihMin || tarihMax ? 1 : 0)
  const firmaOpsiyon = ['Tümü', ...new Set(gorunen.map((d) => d.firmaAd))]
  const turOpsiyon = ['Tümü', ...new Set(denetimler.map((d) => d.turAd))]
  const uzmanOpsiyon = ['Tümü', ...new Set(denetimler.map((d) => d.uzmanAd))]

  const sirala = (s: Siralama) => {
    if (sort === s) setYon((y) => (y === 1 ? -1 : 1))
    else {
      setSort(s)
      setYon(-1)
    }
  }

  const excelIndir = () =>
    xlsxTekSayfa('denetimler', {
      ad: 'Denetimler',
      baslik: 'Saha Denetim Listesi',
      altBilgi: `${filtreli.length} kayıt`,
      kolonlar: [
        { label: 'Denetim No', tip: 'metin' }, { label: 'Başlık', tip: 'metin' },
        { label: 'Firma', tip: 'metin' }, { label: 'Lokasyon', tip: 'metin' },
        { label: 'Tür', tip: 'metin' }, { label: 'Uzman', tip: 'metin' },
        { label: 'Planlanan', tip: 'tarih' }, { label: 'Gerçekleşme', tip: 'tarih' },
        { label: 'Uygunsuzluk', tip: 'sayi' }, { label: 'Puan', tip: 'sayi' },
        { label: 'Durum', tip: 'metin' },
      ],
      satirlar: filtreli.map((d) => [
        d.no, d.baslik, d.firmaAd, d.lokasyon, d.turAd, d.uzmanAd,
        d.planlananTarih, d.gerceklesmeBaslangic ?? '', bulguSayi.get(d.id) ?? 0,
        puanHesapla(d.maddeler) ?? '', d.durum,
      ]),
    })

  // Çakışma uyarısı: aynı uzmana aynı gün birden fazla planlı/devam denetimi
  const cakisan = useMemo(() => {
    const m = new Map<string, number>()
    gorunen.forEach((d) => {
      if (d.durum === 'Planlandı' || d.durum === 'Devam Ediyor')
        m.set(`${d.uzmanAd}|${d.planlananTarih}`, (m.get(`${d.uzmanAd}|${d.planlananTarih}`) ?? 0) + 1)
    })
    return new Set(
      gorunen.filter((d) => (m.get(`${d.uzmanAd}|${d.planlananTarih}`) ?? 0) > 1).map((d) => `${d.uzmanAd}|${d.planlananTarih}`),
    )
  }, [gorunen])

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------ Başlık ------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Denetimler</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            İşyerlerindeki İSG uygulamalarını denetleyin, uygunsuzlukları kayıt altına alın ve düzeltici faaliyetleri takip edin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => nav('/panel/denetimler/sablonlar')}>
            <ClipboardCheckIcon /> Şablonları Yönet
          </Button>
          <Button variant="ghost" size="sm" onClick={() => nav('/panel/denetimler/raporlar')}>
            <FileBarChartIcon /> Raporlar
          </Button>
          {aktarIzni && (
            <Button variant="outline" size="sm" onClick={excelIndir}>
              <FileBarChartIcon /> Excel
            </Button>
          )}
          {olusturIzni && (
            <>
              <Button variant="outline" size="sm" onClick={() => nav('/panel/denetimler/yeni?planla=1')}>
                <CalendarCheckIcon /> Denetim Planla
              </Button>
              <Button size="sm" onClick={() => nav('/panel/denetimler/yeni')}>
                <PlusIcon /> Yeni Denetim Oluştur
              </Button>
            </>
          )}
        </div>
      </div>

      {/* --------------------------- İstatistikler --------------------------- */}
      <StatSerit
        ogeler={[
          { label: 'Toplam Denetim', deger: istat.toplam, ikon: ClipboardCheckIcon },
          { label: 'Planlanan', deger: istat.planli, ikon: CalendarCheckIcon },
          { label: 'Devam Eden', deger: istat.devam, ikon: AlarmClockCheckIcon },
          { label: 'Tamamlanan', deger: istat.tamam, ikon: CheckCircle2Icon },
          { label: 'Açık Uygunsuzluk', deger: istat.bulgu, ikon: FileWarningIcon, iyi: istat.bulgu === 0 },
          { label: 'Açık Faaliyet', deger: istat.aksiyon, ikon: ListTodoIcon },
          { label: 'Gecikmiş Faaliyet', deger: istat.gecikmis, delta: istat.gecikmis > 0 ? 'gecikme!' : undefined, iyi: istat.gecikmis === 0, ikon: TriangleAlertIcon },
        ]}
      />

      {/* ------------------------------ Filtreler ----------------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setSayfa(0)
            }}
            placeholder="No, başlık, firma, lokasyon veya uzman ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <CipGrup secenekler={['Tümü', ...DURUMLAR] as const} value={cip} onChange={(v) => { setCip(v); setSayfa(0) }} />
        <div className="ml-auto flex items-center gap-2">
          <FiltrePopover
            aktifSayi={aktifFiltre}
            onTemizle={() => { setFirmaF('Tümü'); setTurF('Tümü'); setUzmanF('Tümü'); setBulguF('Tümü'); setTarihMin(''); setTarihMax('') }}
            sorular={[
              { label: 'Firma', value: firmaF, options: firmaOpsiyon, onChange: setFirmaF },
              { label: 'Denetim türü', value: turF, options: turOpsiyon, onChange: setTurF },
              { label: 'Sorumlu uzman', value: uzmanF, options: uzmanOpsiyon, onChange: setUzmanF },
              { label: 'Uygunsuzluk durumu', value: bulguF, options: ['Tümü', 'Uygunsuzluk var', 'Uygunsuzluk yok'], onChange: setBulguF },
            ]}
          />
          <div className="flex items-center gap-1">
            <input type="date" value={tarihMin} onChange={(e) => { setTarihMin(e.target.value); setSayfa(0) }} aria-label="Başlangıç tarihi" className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30" />
            <span className="text-xs text-muted-foreground">–</span>
            <input type="date" value={tarihMax} onChange={(e) => { setTarihMax(e.target.value); setSayfa(0) }} aria-label="Bitiş tarihi" className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30" />
          </div>
          <GorunumSec value={gorunum} onChange={setGorunum} />
          <button
            type="button"
            onClick={() => setTakvim((t) => !t)}
            className={cn('flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors', takvim ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-muted-foreground hover:text-foreground')}
            title="Takvim görünümü"
          >
            <CalendarCheckIcon className="size-3.5" /> Takvim
          </button>
        </div>
      </div>

      {/* ------------------------------ Takvim ------------------------------- */}
      {takvim && <TakvimGorunum denetimler={filtreli} />}

      {/* ------------------------------- Liste ------------------------------- */}
      <div ref={alanRef} className="relative overflow-hidden rounded-xl border bg-card">
        {gorunum === 'liste' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <SortBaslik label="Denetim" id="baslik" aktif={sort} yon={yon} onClick={sirala} className="py-2.5 pl-4 pr-3" />
                  <SortBaslik label="Firma" id="firma" aktif={sort} yon={yon} onClick={sirala} className="px-3 py-2.5" />
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Lokasyon</th>
                  <th className="hidden px-3 py-2.5 text-xs font-medium text-muted-foreground lg:table-cell">Tür</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Uzman</th>
                  <SortBaslik label="Planlanan" id="tarih" aktif={sort} yon={yon} onClick={sirala} className="px-3 py-2.5 whitespace-nowrap" />
                  <SortBaslik label="Bulgu" id="uygunsuzluk" aktif={sort} yon={yon} onClick={sirala} className="px-3 py-2.5 whitespace-nowrap" />
                  <SortBaslik label="Puan" id="puan" aktif={sort} yon={yon} onClick={sirala} className="px-3 py-2.5" />
                  <th className="py-2.5 pl-3 pr-4 text-xs font-medium text-muted-foreground">Durum</th>
                </tr>
              </thead>
              <tbody>
                {dilim.map((d) => {
                  const n = bulguSayi.get(d.id) ?? 0
                  const puan = puanHesapla(d.maddeler)
                  const ist = maddeIstat(d.maddeler)
                  const cakisma = cakisan.has(`${d.uzmanAd}|${d.planlananTarih}`) && (d.durum === 'Planlandı' || d.durum === 'Devam Ediyor')
                  return (
                    <tr key={d.id} className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40" onClick={() => nav(`/panel/denetimler/${d.id}`)}>
                      <td className="py-2.5 pl-4 pr-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-muted-foreground">{d.no}</span>
                            {cakisma && (
                              <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400" title={`${d.uzmanAd} aynı gün başka denetimde`}>
                                çakışma
                              </span>
                            )}
                          </div>
                          <p className="truncate font-medium">{d.baslik}</p>
                        </div>
                      </td>
                      <td className="max-w-40 truncate px-3 py-2.5">{d.firmaAd}</td>
                      <td className="max-w-32 truncate px-3 py-2.5 text-muted-foreground">{d.lokasyon}</td>
                      <td className="hidden max-w-32 truncate px-3 py-2.5 text-muted-foreground lg:table-cell">{d.turAd}</td>
                      <td className="max-w-32 truncate px-3 py-2.5">{d.uzmanAd}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                        {formatKisa(d.planlananTarih)}{d.planlananSaat ? ` ${d.planlananSaat}` : ''}
                        {d.gerceklesmeBaslangic && <span className="block text-xs text-muted-foreground">→ {formatKisa(d.gerceklesmeBaslangic)}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {n > 0 ? (
                          <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums', onemRenk['Kritik'])}>{n}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {puan !== undefined ? (
                          <span className={cn('font-medium tabular-nums', puan >= 80 ? 'text-emerald-600 dark:text-emerald-400' : puan >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}>
                            %{puan}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {ist.toplam > 0 && d.durum === 'Devam Ediyor' ? `${ist.toplam - ist.cevapsiz}/${ist.toplam}` : '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pl-3 pr-4">
                        <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap', durumRenk[d.durum])}>{d.durum}</span>
                      </td>
                    </tr>
                  )
                })}
                {dilim.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-sm text-muted-foreground">
                      {gorunen.length === 0 ? 'Henüz denetim kaydı yok — ilk denetimi oluşturun.' : 'Filtrelere uyan denetim bulunamadı.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {dilim.map((d) => {
              const n = bulguSayi.get(d.id) ?? 0
              const puan = puanHesapla(d.maddeler)
              const ist = maddeIstat(d.maddeler)
              return (
                <Link
                  key={d.id}
                  to={`/panel/denetimler/${d.id}`}
                  className="rounded-xl border bg-background p-4 transition-colors hover:border-foreground/20 hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-muted-foreground">{d.no}</p>
                      <h3 className="truncate font-medium">{d.baslik}</h3>
                    </div>
                    <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium', durumRenk[d.durum])}>{d.durum}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p className="truncate">{d.firmaAd} · {d.turAd}</p>
                    <p className="flex items-center gap-1"><MapPinIcon className="size-3" /> {d.lokasyon}</p>
                    <p>{d.uzmanAd} · {formatKisa(d.planlananTarih)}{d.planlananSaat ? ` ${d.planlananSaat}` : ''}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
                    <span className="text-muted-foreground">
                      {d.durum === 'Devam Ediyor' ? `${ist.toplam - ist.cevapsiz}/${ist.toplam} madde` : `${ist.toplam} madde`}
                    </span>
                    <div className="flex items-center gap-2">
                      {n > 0 && <span className={cn('rounded px-1.5 py-0.5 font-semibold tabular-nums', onemRenk['Kritik'])}>{n} uygunsuzluk</span>}
                      {puan !== undefined && <span className="font-medium tabular-nums">%{puan}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
            {dilim.length === 0 && (
              <p className="col-span-full py-14 text-center text-sm text-muted-foreground">
                {gorunen.length === 0 ? 'Henüz denetim kaydı yok.' : 'Filtrelere uyan denetim bulunamadı.'}
              </p>
            )}
          </div>
        )}
        <ListeFooter
          bas={bas}
          son={son}
          toplam={filtreli.length}
          sayfaGuvenli={sayfaGuvenli}
          sayfaSayisi={sayfaSayisi}
          sayfaBoyu={sayfaBoyu}
          otoBoy={otoBoy}
          onBoyut={setSayfaBoyu}
          onSayfa={setSayfa}
        />
      </div>

      {/* Açık uygunsuzluk özeti — saha bulguları canlı bağlantı */}
      {gorunenBulgular.filter((b) => b.durum !== 'Kapatıldı' && b.durum !== 'İptal Edildi').length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <h2 className="text-sm font-medium">Açık uygunsuzluklar</h2>
            <span className="text-xs text-muted-foreground">denetim bulguları → düzeltici faaliyetler</span>
          </div>
          <div className="divide-y">
            {gorunenBulgular
              .filter((b) => b.durum !== 'Kapatıldı' && b.durum !== 'İptal Edildi')
              .slice(0, 6)
              .map((b) => {
                const d = denetimler.find((x) => x.id === b.denetimId)
                const gecikti = b.hedefTarih && b.hedefTarih < TODAY
                return (
                  <button key={b.id} type="button" onClick={() => d && nav(`/panel/denetimler/${d.id}?sekme=uygunsuzluk`)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40">
                    <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium', onemRenk[b.onem])}>{b.onem}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.baslik}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d?.no} · {d?.firmaAd}{b.bolum ? ` · ${b.bolum}` : ''}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium', bulguDurumRenk[b.durum])}>{b.durum}</span>
                    {b.hedefTarih && (
                      <span className={cn('shrink-0 text-xs tabular-nums', gecikti ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                        {formatKisa(b.hedefTarih)}{gecikti ? ` (${gunFarki(b.hedefTarih, TODAY)}g gecikti)` : ''}
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ Takvim görünümü ---------------------------- */

function TakvimGorunum({ denetimler }: { denetimler: Denetim[] }) {
  const [ayOfset, setAyOfset] = useState(0)
  const taban = useMemo(() => {
    const [y, m] = TODAY.split('-').map(Number)
    return new Date(y, m - 1 + ayOfset, 1)
  }, [ayOfset])
  const yil = taban.getFullYear()
  const ay = taban.getMonth()
  const ilk = new Date(yil, ay, 1)
  const gunSayi = new Date(yil, ay + 1, 0).getDate()
  const ofset = (ilk.getDay() + 6) % 7 // Pzt=0
  const ayAd = taban.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  const gunlere = useMemo(() => {
    const m = new Map<string, Denetim[]>()
    denetimler.forEach((d) => {
      if (d.durum === 'İptal Edildi' || d.durum === 'Taslak') return
      const arr = m.get(d.planlananTarih) ?? []
      arr.push(d)
      m.set(d.planlananTarih, arr)
    })
    return m
  }, [denetimler])

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-sm font-medium capitalize">{ayAd}</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setAyOfset((o) => o - 1)} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted" aria-label="Önceki ay">‹</button>
          <Button variant="ghost" size="xs" onClick={() => setAyOfset(0)}>Bugün</Button>
          <button type="button" onClick={() => setAyOfset((o) => o + 1)} className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted" aria-label="Sonraki ay">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b text-center text-[11px] font-medium text-muted-foreground">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((g) => (
          <div key={g} className="border-r py-1.5 last:border-0">{g}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {[...Array(ofset + gunSayi)].map((_, i) => {
          const gun = i - ofset + 1
          const ds = `${yil}-${String(ay + 1).padStart(2, '0')}-${String(gun).padStart(2, '0')}`
          const liste = i >= ofset ? (gunlere.get(ds) ?? []) : []
          const bugun = ds === TODAY
          return (
            <div key={i} className={cn('min-h-20 border-r border-b p-1.5 text-xs', i >= ofset && liste.length === 0 && 'bg-background/50', i < ofset && 'bg-muted/20')}>
              {i >= ofset && (
                <>
                  <span className={cn('inline-flex size-5 items-center justify-center rounded-full tabular-nums', bugun && 'bg-amber-400 font-semibold text-zinc-950')}>{gun}</span>
                  <div className="mt-1 space-y-0.5">
                    {liste.slice(0, 2).map((d) => (
                      <Link
                        key={d.id}
                        to={`/panel/denetimler/${d.id}`}
                        className="block truncate rounded px-1 py-0.5 text-[11px] font-medium transition-colors hover:bg-muted"
                        title={`${d.no} — ${d.baslik} · ${d.uzmanAd}`}
                      >
                        <span className={cn('mr-1 inline-block size-1.5 rounded-full align-middle', d.durum === 'Devam Ediyor' ? 'bg-violet-500' : d.durum === 'Tamamlandı' ? 'bg-emerald-500' : d.durum === 'Rapor Bekliyor' ? 'bg-orange-500' : d.durum === 'Planlandı' ? 'bg-amber-500' : 'bg-zinc-400')} />
                        {d.baslik}
                      </Link>
                    ))}
                    {liste.length > 2 && <span className="px-1 text-[10px] text-muted-foreground">+{liste.length - 2} denetim</span>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
