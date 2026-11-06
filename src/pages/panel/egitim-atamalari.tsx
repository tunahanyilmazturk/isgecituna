import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertTriangleIcon,
  BanIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DownloadIcon,
  GraduationCapIcon,
  MoreHorizontalIcon,
  PlayIcon,
  PlusIcon,
  RotateCwIcon,
  SearchIcon,
  SendIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { FiltrePopover } from '@/components/list-bits'
import { Alan } from '@/components/form-bits'
import {
  ilerlemedenKisi,
  kisiDurumRenk,
  type EgitimAtama,
  type KisiDurum,
} from '@/data/personeller'
import { cn } from '@/lib/utils'
import { personelAd, usePersonelStore } from '@/stores/personeller-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { TODAY } from '@/data/dashboard'
import { useIzin } from '@/lib/izin'

const sonTarihDurumu = (tarih: string) => {
  const fark = Math.round((new Date(`${tarih}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86_400_000)
  if (!Number.isFinite(fark)) return ''
  if (fark < 0) return `${Math.abs(fark)} gün geçti`
  if (fark === 0) return 'Bugün son gün'
  if (fark === 1) return 'Yarın son gün'
  return `${fark} gün kaldı`
}

export default function EgitimAtamalariPage() {
  const navigate = useNavigate()
  const sonucGorIzni = useIzin('egitimler.sonuc-gor')
  const ataIzni = useIzin('egitimler.ata')
  const aktarIzni = useIzin('egitimler.aktar')
  const goruntuleIzni = sonucGorIzni || ataIzni
  const { atamalar, personeller, atamaDurum, sonTarihGuncelle, hatirlatmaGonder } = usePersonelStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const { egitimler, ilerlemeler } = useEgitimlerStore()
  const [cip, setCip] = useState<'Tümü' | 'Aktif' | 'Devam Eden' | 'Tamamlandı' | 'Bekleyen' | 'Geciken' | 'İptal'>('Tümü')
  const [ara, setAra] = useState('')
  const [firmaF, setFirmaF] = useState('Tümü')
  const [egitimF, setEgitimF] = useState('Tümü')
  const [ilerlemeF, setIlerlemeF] = useState<'Tümü' | KisiDurum>('Tümü')
  const [detay, setDetay] = useState<EgitimAtama | null>(null)
  const [sonTarihD, setSonTarihD] = useState<string | null>(null)

  const firmaAd = (id: string) => firmalar.find((f) => f.id === id)?.unvan ?? id
  const kisiDurumu = (a: EgitimAtama, pid: string): KisiDurum =>
    ilerlemedenKisi(ilerlemeler.find((i) => i.hesapId === pid && i.atamaId === a.id)?.durum, a.sonTarih)

  const ozet = (a: EgitimAtama) => {
    const d = a.personelIds.map((p) => kisiDurumu(a, p))
    return {
      toplam: d.length,
      tamam: d.filter((x) => x === 'Tamamlandı').length,
      devam: d.filter((x) => x === 'Devam Ediyor').length,
      baslamadi: d.filter((x) => x === 'Bekliyor').length,
      bekleyen: d.filter((x) => x === 'Bekliyor' || x === 'Gecikti').length,
      gecikti: d.filter((x) => x === 'Gecikti').length,
      basarisiz: d.filter((x) => x === 'Başarısız').length,
      onay: d.filter((x) => x === 'Onay Bekliyor').length,
    }
  }

  const filtreli = useMemo(() => {
    const q = ara.trim().toLowerCase()
    return atamalar.filter((a) => {
      const o = ozet(a)
      if (cip === 'Geciken') {
        if (a.durum !== 'Aktif' || o.gecikti === 0) return false
      } else if (cip === 'Devam Eden') {
        if (a.durum !== 'Aktif' || o.devam === 0) return false
      } else if (cip === 'Bekleyen') {
        if (a.durum !== 'Aktif' || o.baslamadi === 0) return false
      } else if (cip === 'Tamamlandı') {
        if (!(a.durum === 'Tamamlandı' || (o.toplam > 0 && o.tamam === o.toplam))) return false
      } else if (cip !== 'Tümü' && a.durum !== cip) return false
      if (firmaF !== 'Tümü' && firmaAd(a.firmaId) !== firmaF) return false
      const eg = egitimler.find((e) => e.id === a.egitimId)
      if (egitimF !== 'Tümü' && (eg?.baslik ?? 'Silinmiş eğitim') !== egitimF) return false
      if (ilerlemeF !== 'Tümü' && !a.personelIds.some((pid) => kisiDurumu(a, pid) === ilerlemeF)) return false
      const kisiler = a.personelIds.map((pid) => personeller.find((p) => p.id === pid)).filter(Boolean).map((p) => personelAd(p!))
      if (q && ![eg?.baslik ?? '', firmaAd(a.firmaId), ...kisiler].join(' ').toLowerCase().includes(q)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atamalar, cip, ara, firmaF, egitimF, ilerlemeF, personeller, egitimler])

  const kisiToplam = (d: KisiDurum) =>
    atamalar.reduce((toplam, a) => toplam + (a.durum === 'İptal' && d !== 'Tamamlandı' ? 0 : a.personelIds.filter((pid) => kisiDurumu(a, pid) === d).length), 0)
  const metrikler = [
    { label: 'Atanan katılımcı', deger: atamalar.reduce((n, a) => n + a.personelIds.length, 0), filtre: 'Tümü' as const, aciklama: 'Kişi-eğitim kaydı' },
    { label: 'Aktif atama', deger: atamalar.filter((a) => a.durum === 'Aktif').length, filtre: 'Aktif' as const, aciklama: 'Firma ve eğitim kaydı' },
    { label: 'Tamamlanan', deger: kisiToplam('Tamamlandı'), filtre: 'Tamamlandı' as const, aciklama: 'Katılımcı' },
    { label: 'Devam eden', deger: kisiToplam('Devam Ediyor'), filtre: 'Devam Eden' as const, aciklama: 'Katılımcı' },
    { label: 'Başlamayan', deger: kisiToplam('Bekliyor'), filtre: 'Bekleyen' as const, aciklama: 'Katılımcı' },
    { label: 'Süresi geçen', deger: kisiToplam('Gecikti'), filtre: 'Geciken' as const, aciklama: 'Katılımcı' },
  ]
  const sekmeler: (typeof cip)[] = ['Tümü', 'Aktif', 'Devam Eden', 'Tamamlandı', 'Bekleyen', 'Geciken', 'İptal']
  const sekmeSayisi = (filtre: typeof cip) => atamalar.filter((a) => {
    const o = ozet(a)
    if (filtre === 'Tümü') return true
    if (filtre === 'Aktif' || filtre === 'İptal') return a.durum === filtre
    if (filtre === 'Devam Eden') return a.durum === 'Aktif' && o.devam > 0
    if (filtre === 'Bekleyen') return a.durum === 'Aktif' && o.baslamadi > 0
    if (filtre === 'Geciken') return a.durum === 'Aktif' && o.gecikti > 0
    return a.durum === 'Tamamlandı' || (o.toplam > 0 && o.tamam === o.toplam)
  }).length

  // Ekrandaki filtre sonucu `filtreli` üzerinden aktarır
  const excelleAktar = () => {
    const egitimBaslik = (a: EgitimAtama) => egitimler.find((e) => e.id === a.egitimId)?.baslik ?? 'Silinmiş eğitim'
    const surumNo = (a: EgitimAtama) =>
      egitimler.find((e) => e.id === a.egitimId)?.surumler.find((s) => s.id === a.surumId)?.no ?? '?'
    xlsxIndir(xlsxDosyaAdi('Egitim_Atamalari'), [
      {
        ad: 'Atamalar',
        baslik: 'Eğitim Atamaları',
        altBilgi: `Eğitim atamaları modülü${firmaF !== 'Tümü' ? ` · Filtre: ${firmaF}` : ''}${cip !== 'Tümü' ? ` · ${cip}` : ''}`,
        kolonlar: [
          { label: 'Atama No', minGenislik: 11 },
          { label: 'Eğitim', minGenislik: 30, wrap: true },
          { label: 'Sürüm', minGenislik: 8 },
          { label: 'Firma', minGenislik: 26, wrap: true },
          { label: 'Kişi', tip: 'sayi', minGenislik: 9 },
          { label: 'Atama', tip: 'tarih' },
          { label: 'Son Tarih', tip: 'tarih' },
          { label: 'Zorunlu', minGenislik: 10 },
          { label: 'Tamam', tip: 'sayi', minGenislik: 9 },
          { label: 'Devam', tip: 'sayi', minGenislik: 9 },
          { label: 'Bekleyen', tip: 'sayi', minGenislik: 10 },
          { label: 'Başarısız', tip: 'sayi', minGenislik: 10 },
          { label: 'Durum', minGenislik: 12 },
        ],
        satirlar: filtreli.map((a) => {
          const o = ozet(a)
          return [
            a.id,
            egitimBaslik(a),
            `v${surumNo(a)}`,
            firmaAd(a.firmaId),
            o.toplam,
            a.atamaTarihi,
            a.sonTarih,
            a.zorunlu ? 'Evet' : 'Hayır',
            o.tamam,
            o.devam,
            o.bekleyen,
            o.basarisiz,
            a.durum,
          ]
        }),
        ozet: [
          ['Toplam atama', filtreli.length],
          ['Aktif', filtreli.filter((a) => a.durum === 'Aktif').length],
          ['Tamamlanan', filtreli.filter((a) => a.durum === 'Tamamlandı').length],
        ],
      },
      {
        ad: 'Kişi İlerleme',
        baslik: 'Kişi Bazlı Eğitim İlerlemesi',
        altBilgi: 'Eğitim atamaları modülü',
        kolonlar: [
          { label: 'Atama No', minGenislik: 11 },
          { label: 'Eğitim', minGenislik: 30, wrap: true },
          { label: 'Firma', minGenislik: 24, wrap: true },
          { label: 'Personel', minGenislik: 22 },
          { label: 'İlerleme', minGenislik: 16 },
          { label: 'Son Tarih', tip: 'tarih' },
        ],
        satirlar: filtreli.flatMap((a) =>
          a.personelIds.map((pid) => [
            a.id,
            egitimBaslik(a),
            firmaAd(a.firmaId),
            personeller.find((p) => p.id === pid) ? personelAd(personeller.find((p) => p.id === pid)!) : pid,
            kisiDurumu(a, pid),
            a.sonTarih,
          ]),
        ),
      },
    ])
    toast.success(`${filtreli.length} atama Excel'e aktarıldı`)
  }

  if (!goruntuleIzni) return <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">Eğitim atamalarını ve sonuçlarını görüntüleme izniniz yok.</div>

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Eğitim Atamaları</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">Firmalarınızın çalışanlarına eğitim atayın, katılım süreçlerini yönetin ve eğitim ilerlemelerini tek merkezden takip edin.</p>
        </div>
        <div className="flex items-center gap-2">
          {aktarIzni && <Button variant="outline" onClick={excelleAktar}><DownloadIcon /> Atama raporu</Button>}
          {ataIzni && <Button onClick={() => navigate('/panel/egitim-atamalari/yeni')}><PlusIcon /> Yeni Eğitim Ataması</Button>}
          {ataIzni && <Button variant="secondary" onClick={() => navigate('/panel/egitim-atamalari/yeni')}>Toplu Atama</Button>}
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{metrikler.map((m, i) => <button key={m.label} type="button" onClick={() => setCip(m.filtre)} className={cn('rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:border-amber-500/40', cip === m.filtre && 'border-amber-500/50 bg-amber-500/[0.04]')}><div className="flex items-center justify-between gap-2"><span className="truncate text-[11px] text-muted-foreground">{m.label}</span>{i === 0 ? <ClipboardListIcon className="size-3.5 text-muted-foreground/60" /> : i === 2 ? <CheckCircle2Icon className="size-3.5 text-emerald-600" /> : i === 3 ? <PlayIcon className="size-3.5 text-amber-600" /> : i === 5 ? <AlertTriangleIcon className="size-3.5 text-red-500" /> : <GraduationCapIcon className="size-3.5 text-muted-foreground/60" />}</div><p className="mt-1 text-xl leading-none font-semibold tabular-nums">{m.deger}</p><p className="mt-1 text-[10px] text-muted-foreground">{m.aciklama} · listeyi aç</p></button>)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">{sekmeler.map((s) => <button key={s} type="button" onClick={() => setCip(s)} className={cn('shrink-0 rounded-md px-2.5 py-1.5 text-[11px] transition-colors', cip === s ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{s}<span className="ml-1.5 tabular-nums text-muted-foreground">{sekmeSayisi(s)}</span></button>)}</div>
        <div className="relative ml-auto min-w-48 flex-1 sm:max-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input aria-label="Eğitim, firma veya personel ara" value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Eğitim, firma veya kişi ara…" className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
        </div>
        <FiltrePopover
          aktifSayi={[firmaF !== 'Tümü', egitimF !== 'Tümü', ilerlemeF !== 'Tümü'].filter(Boolean).length}
          onTemizle={() => { setFirmaF('Tümü'); setEgitimF('Tümü'); setIlerlemeF('Tümü') }}
          sorular={[
            { label: 'Firma', value: firmaF, options: ['Tümü', ...firmalar.map((f) => f.unvan)], onChange: setFirmaF },
            { label: 'Eğitim', value: egitimF, options: ['Tümü', ...egitimler.map((e) => e.baslik)], onChange: setEgitimF },
            { label: 'Katılımcı durumu', value: ilerlemeF, options: ['Tümü', 'Bekliyor', 'Devam Ediyor', 'Tamamlandı', 'Başarısız', 'Onay Bekliyor', 'Gecikti'], onChange: (v) => setIlerlemeF(v as typeof ilerlemeF) },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 px-6 pb-6">
        {filtreli.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
            <ClipboardListIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Atama bulunamadı</p>
            {ataIzni && <Button size="sm" variant="outline" onClick={() => navigate('/panel/egitim-atamalari/yeni')}><PlusIcon /> İlk atamayı oluştur</Button>}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtreli.map((a) => {
              const eg = egitimler.find((e) => e.id === a.egitimId)
              const sv = eg?.surumler.find((s) => s.id === a.surumId)
              const o = ozet(a)
              const yuzde = o.toplam ? Math.round((o.tamam / o.toplam) * 100) : 0
              const sonTarihEtiketi = sonTarihDurumu(a.sonTarih)
              const gecikmis = a.durum === 'Aktif' && o.gecikti > 0
              return (
                <article key={a.id} className={cn('grid grid-cols-[44px_minmax(0,1fr)_32px] items-center gap-x-3 gap-y-2 rounded-xl border bg-card p-3 transition-colors hover:border-amber-500/35 sm:grid-cols-[56px_minmax(0,1fr)_190px_32px] sm:gap-x-4 sm:p-3.5', a.durum === 'İptal' && 'opacity-60')}>
                  <div className={cn('relative col-start-1 row-span-2 row-start-1 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-white sm:size-14', eg?.kapakTon ?? 'from-zinc-500 to-zinc-700')} aria-hidden="true">
                    {eg?.kapakGorsel ? <img src={eg.kapakGorsel} alt="" className="size-full object-cover" /> : <GraduationCapIcon className="size-5" />}
                  </div>
                  <div className="col-start-2 row-start-1 min-w-0 self-center sm:row-span-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <button type="button" className="max-w-full truncate text-left text-sm font-semibold tracking-tight hover:text-amber-600 focus-visible:outline-none focus-visible:underline dark:hover:text-amber-400" onClick={() => setDetay(a)}>
                        {eg?.baslik ?? 'Silinmiş eğitim'}
                      </button>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', a.durum === 'Aktif' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : a.durum === 'Tamamlandı' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500')}>
                        {a.durum}
                      </span>
                      {gecikmis && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400"><AlertTriangleIcon className="size-3" /> {o.gecikti} gecikmiş</span>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {firmaAd(a.firmaId)} <span className="mx-1 text-border">·</span> v{sv?.no ?? '?'} <span className="mx-1 text-border">·</span> {a.zorunlu ? 'Zorunlu eğitim' : 'İsteğe bağlı'}
                    </p>
                  </div>
                  <div className="col-start-2 row-start-2 min-w-0 self-center sm:col-start-3 sm:row-start-1">
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 min-w-14 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Tamamlanan kişi oranı" aria-valuemin={0} aria-valuemax={100} aria-valuenow={yuzde}>
                        <div className={cn('h-full rounded-full transition-[width]', yuzde === 100 ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${yuzde}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-medium tabular-nums">{yuzde}%</span>
                    </div>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {o.tamam}/{o.toplam} tamamlandı{o.devam > 0 ? ` · ${o.devam} devam` : ''}{o.bekleyen > 0 ? ` · ${o.bekleyen} bekliyor` : ''}
                    </p>
                  </div>
                  <div className="col-start-2 row-start-3 flex min-w-0 items-center justify-between gap-2 border-t pt-2 text-[10px] text-muted-foreground sm:col-start-3 sm:row-start-2 sm:block sm:border-t-0 sm:border-l sm:py-1 sm:pl-4 sm:text-right">
                    <span className="inline-flex items-center gap-1"><CalendarIcon className="size-3" /> Son tarih {a.sonTarih}</span>
                    <span className={cn('inline-flex items-center gap-1 font-medium', gecikmis ? 'text-red-600 dark:text-red-400' : sonTarihEtiketi === 'Bugün son gün' || sonTarihEtiketi === 'Yarın son gün' ? 'text-amber-600 dark:text-amber-400' : '')}>
                      {gecikmis ? <AlertTriangleIcon className="size-3" /> : <CalendarIcon className="size-3" />}
                      {gecikmis ? `${o.gecikti} kişi gecikti` : a.durum === 'Tamamlandı' ? 'Tamamlandı' : sonTarihEtiketi}
                    </span>
                  </div>
                  {ataIzni && <div className="col-start-3 row-span-3 row-start-1 self-start sm:col-start-4 sm:row-span-2 sm:self-center"><DropdownMenu>
                    <DropdownMenuTrigger render={<button className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" />}>
                      <MoreHorizontalIcon className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => setDetay(a)}>Detay</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSonTarihD(a.id) }}>Son tarih güncelle</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { hatirlatmaGonder(a.id); toast.success('Hatırlatma gönderildi (kayıtlara işlendi)') }}>
                        <SendIcon /> Hatırlatma gönder
                      </DropdownMenuItem>
                      {a.durum === 'Aktif' ? (
                        <DropdownMenuItem onClick={() => { atamaDurum(a.id, 'İptal'); toast('Atama iptal edildi — kayıtlar korunur') }}>
                          <BanIcon /> İptal et
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => { atamaDurum(a.id, 'Aktif'); toast.success('Atama yeniden açıldı') }}>
                          <RotateCwIcon /> Yeniden aç
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu></div>}
                </article>
              )
            })}
          </div>
        )}
      </div>

      {detay && goruntuleIzni && <AtamaDetay atama={detay} onKapat={() => setDetay(null)} />}
      {sonTarihD && ataIzni && (
        <Sheet open onOpenChange={(o) => !o && setSonTarihD(null)}>
          <SheetContent className="w-full sm:max-w-sm">
            <SheetTitle className="text-base">Son Tarih Güncelle</SheetTitle>
            <div className="mt-5 space-y-3">
              <Alan label="Yeni son tarih">
                <input type="date" defaultValue={atamalar.find((a) => a.id === sonTarihD)?.sonTarih} id="sonTarihInput" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSonTarihD(null)}>Vazgeç</Button>
                <Button onClick={() => {
                  const v = (document.getElementById('sonTarihInput') as HTMLInputElement)?.value
                  if (!v) return toast.error('Tarih seçin')
                  sonTarihGuncelle(sonTarihD, v)
                  toast.success('Son tarih güncellendi')
                  setSonTarihD(null)
                }}>Kaydet</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

/* ============================= Atama detayı ============================= */

function AtamaDetay({ atama, onKapat }: { atama: EgitimAtama; onKapat: () => void }) {
  const { personeller, hesaplar } = usePersonelStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const { egitimler, ilerlemeler } = useEgitimlerStore()
  const eg = egitimler.find((e) => e.id === atama.egitimId)
  const sv = eg?.surumler.find((s) => s.id === atama.surumId)
  const zorunlular = sv?.bolumler.flatMap((b) => b.icerikler).filter((i) => i.zorunlu) ?? []

  const satirlar = atama.personelIds.map((pid) => {
    const p = personeller.find((x) => x.id === pid)
    const il = ilerlemeler.find((i) => i.hesapId === pid && i.atamaId === atama.id)
    const kd = ilerlemedenKisi(il?.durum, atama.sonTarih)
    const tam = zorunlular.filter((i) => il?.icerikler[i.id]?.tamamlandi).length
    return { p, il, kd, yuzde: zorunlular.length ? Math.round((tam / zorunlular.length) * 100) : 0, sonDeneme: il?.denemeler[il.denemeler.length - 1] }
  })
  const tamam = satirlar.filter((s) => s.kd === 'Tamamlandı').length

  return (
    <Sheet open onOpenChange={(o) => !o && onKapat()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetTitle className="text-base">{eg?.baslik}</SheetTitle>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>v{sv?.no} · {firmalar.find((f) => f.id === atama.firmaId)?.unvan}</span>
          <span>· Atama {atama.atamaTarihi} → Son {atama.sonTarih}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', atama.durum === 'Aktif' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500')}>{atama.durum}</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            [`${tamam}/${satirlar.length}`, 'Tamamlanan'],
            [satirlar.filter((s) => s.kd === 'Devam Ediyor').length, 'Devam'],
            [satirlar.filter((s) => s.kd === 'Bekliyor' || s.kd === 'Gecikti').length, 'Bekleyen'],
            [satirlar.filter((s) => s.kd === 'Başarısız').length, 'Başarısız'],
          ].map(([v, l]) => (
            <div key={l as string} className="rounded-lg border bg-card py-3">
              <p className="text-lg font-semibold tabular-nums">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Personel ilerlemesi</p>
          {satirlar.map(({ p, il, kd, yuzde, sonDeneme }) => (
            <div key={p?.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold text-white">
                {p?.ad[0]}{p?.soyad[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p ? personelAd(p) : '—'}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${yuzde}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    %{yuzde}{sonDeneme ? ` · Son sınav: ${sonDeneme.puan}` : ''}{il?.denemeler.length ? ` · ${il.denemeler.length} deneme` : ''}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', kisiDurumRenk[kd])}>{kd}</span>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {hesaplar.some((h) => h.personelId === p?.id && h.durum === 'Aktif') ? 'hesap aktif' : 'hesap yok'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {atama.olaylar.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Atama olayları</p>
            <div className="mt-2 space-y-1">
              {atama.olaylar.map((o, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  <span className="tabular-nums">{new Date(o.tarih).toLocaleDateString('tr-TR')}</span> — {o.islem}
                </p>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
