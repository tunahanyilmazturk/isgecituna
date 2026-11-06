import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useIzin } from '@/lib/izin'
import { cn } from '@/lib/utils'
import { personelAd, usePersonelStore } from '@/stores/personeller-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEgitimlerStore, aktifSurum } from '@/stores/egitimler-store'
import { surumIstatistik } from '@/data/egitimler'
import { TODAY } from '@/data/dashboard'
import { useAuthStore } from '@/stores/auth-store'

const ADIMLAR = ['Eğitimler ve firmalar', 'Katılımcılar', 'Eğitim grupları', 'Takvim ve kurallar', 'Son kontrol']
const ADIM_ACIKLAMALARI = [
  'Eğitim seçin ve atama yapılacak firmaları işaretleyin.',
  'Seçili firmalardaki atanacak çalışanları belirleyin.',
  'Her eğitim için farklı katılımcı grubu seçin.',
  'Son tarihi ve ortak tamamlama kurallarını düzenleyin.',
  'Firma başına oluşacak kayıtları kontrol edin.',
]

// Her liste ekrana sığsın diye sayfalanır; sayfa boyutları görünür alana göre sabitlendi.
const SAYFA_BOYUTU = { egitim: 4, firma: 6, katilimci: 8, grup: 8, ozet: 3 } as const
type SayfaAnahtari = keyof typeof SAYFA_BOYUTU

const sayfaSayisi = (adet: number, boyut: number) => Math.max(1, Math.ceil(adet / boyut))
const sayfala = <T,>(liste: T[], sayfa: number, boyut: number) => {
  const toplam = sayfaSayisi(liste.length, boyut)
  const s = Math.min(sayfa, toplam - 1)
  return { toplam, ogeler: liste.slice(s * boyut, s * boyut + boyut) }
}

const gunDurumu = (tarih: string) => {
  if (!tarih) return ''
  const fark = Math.round((new Date(`${tarih}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86_400_000)
  if (!Number.isFinite(fark)) return ''
  if (fark < 0) return `${Math.abs(fark)} gün geçti`
  if (fark === 0) return 'Bugün son gün'
  if (fark === 1) return 'Yarın son gün'
  return `${fark} gün kaldı`
}

const son7GundeOlusturuldu = (tarih: string) => {
  const gun = Math.floor((new Date(`${TODAY}T00:00:00`).getTime() - new Date(`${tarih.slice(0, 10)}T00:00:00`).getTime()) / 86_400_000)
  return Number.isFinite(gun) && gun >= 0 && gun <= 7
}

function Sayfalama({ sayfa, toplam, onChange }: { sayfa: number; toplam: number; onChange: (sayfa: number) => void }) {
  if (toplam <= 1) return null
  return (
    <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
      <button type="button" aria-label="Önceki sayfa" disabled={sayfa === 0} onClick={() => onChange(sayfa - 1)} className="flex size-6 items-center justify-center rounded-md border hover:border-amber-500/40 disabled:opacity-40"><ChevronLeftIcon className="size-3.5" /></button>
      <span className="min-w-10 text-center tabular-nums">{sayfa + 1} / {toplam}</span>
      <button type="button" aria-label="Sonraki sayfa" disabled={sayfa >= toplam - 1} onClick={() => onChange(sayfa + 1)} className="flex size-6 items-center justify-center rounded-md border hover:border-amber-500/40 disabled:opacity-40"><ChevronRightIcon className="size-3.5" /></button>
    </div>
  )
}

export default function EgitimAtamaYeniPage() {
  const navigate = useNavigate()
  const ataIzni = useIzin('egitimler.ata')
  const personeller = usePersonelStore((s) => s.personeller)
  const topluAtamaEkle = usePersonelStore((s) => s.topluAtamaEkle)
  const atamalar = usePersonelStore((s) => s.atamalar)
  const hesaplar = usePersonelStore((s) => s.hesaplar)
  const user = useAuthStore((s) => s.user)
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const [adim, setAdim] = useState(0)
  const [egitimIds, setEgitimIds] = useState<string[]>([])
  const [firmaIds, setFirmaIds] = useState<string[]>([])
  const [personelIds, setPersonelIds] = useState<string[]>([])
  const [egitimKatilimcilari, setEgitimKatilimcilari] = useState<Record<string, string[]>>({})
  const [bilinenPersonelIds, setBilinenPersonelIds] = useState<string[]>([])
  const [grupEgitimId, setGrupEgitimId] = useState('')
  const [sayfalar, setSayfalar] = useState<Record<SayfaAnahtari, number>>({ egitim: 0, firma: 0, katilimci: 0, grup: 0, ozet: 0 })
  const sayfaDegistir = (anahtar: SayfaAnahtari) => (sayfa: number) => setSayfalar((m) => ({ ...m, [anahtar]: sayfa }))
  const [personelSirasi, setPersonelSirasi] = useState<'yeni' | 'eski' | 'az' | 'za'>('yeni')
  const [egitimAra, setEgitimAra] = useState('')
  const [firmaAra, setFirmaAra] = useState('')
  const [personelAra, setPersonelAra] = useState('')
  const [personelFiltresi, setPersonelFiltresi] = useState<'tumu' | 'yeni' | 'hesapli' | 'hesapsiz' | 'atanmis' | 'atanmamis'>('tumu')
  const [atamaTarihi, setAtamaTarihi] = useState(TODAY)
  const [sonTarih, setSonTarih] = useState('')
  const [hatirlatmaMetin, setHatirlatmaMetin] = useState('3')
  const hatirlatmaGun = Math.max(0, Math.min(30, Number(hatirlatmaMetin) || 0))
  const [zorunlu, setZorunlu] = useState(true)
  const [firmaEkleyebilir, setFirmaEkleyebilir] = useState(false)

  const yayindakiler = useMemo(() => egitimler.filter((e) => e.durum === 'Yayında'), [egitimler])
  const egitimlerFiltreli = yayindakiler.filter((e) => [e.baslik, e.aciklama, e.kategori].join(' ').toLocaleLowerCase('tr').includes(egitimAra.trim().toLocaleLowerCase('tr')))
  const seciliEgitimler = egitimIds.map((id) => egitimler.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e)
  const adayFirmalar = firmalar.filter((f) => f.unvan.toLocaleLowerCase('tr').includes(firmaAra.trim().toLocaleLowerCase('tr')))
  const adaylar = personeller
    .filter((p) => firmaIds.includes(p.firmaId) && (p.durum === 'Aktif' || p.durum === 'İzinli'))
    .sort((a, b) => personelSirasi === 'yeni' ? b.olusturma.localeCompare(a.olusturma) : personelSirasi === 'eski' ? a.olusturma.localeCompare(b.olusturma) : personelSirasi === 'az' ? personelAd(a).localeCompare(personelAd(b), 'tr') : personelAd(b).localeCompare(personelAd(a), 'tr'))
  const gorunenAdaylar = adaylar.filter((p) => {
    const metin = [personelAd(p), p.eposta, p.departman, p.gorev, firmalar.find((f) => f.id === p.firmaId)?.unvan ?? ''].join(' ').toLocaleLowerCase('tr')
    const hesapli = hesaplar.some((h) => h.personelId === p.id && h.durum === 'Aktif')
    const atanmis = atamalar.some((a) => a.personelIds.includes(p.id))
    const aramaUygun = metin.includes(personelAra.trim().toLocaleLowerCase('tr'))
    const filtreUygun = personelFiltresi === 'tumu' || (personelFiltresi === 'yeni' && son7GundeOlusturuldu(p.olusturma)) || (personelFiltresi === 'hesapli' && hesapli) || (personelFiltresi === 'hesapsiz' && !hesapli) || (personelFiltresi === 'atanmis' && atanmis) || (personelFiltresi === 'atanmamis' && !atanmis)
    return aramaUygun && filtreUygun
  })
  const kursDagilimlari = seciliEgitimler.map((egitim) => {
    const secilenler = egitimKatilimcilari[egitim.id] ?? personelIds
    const dahaOnceAtali = (pid: string) => atamalar.some((a) => a.egitimId === egitim.id && a.surumId === egitim.aktifSurumId && a.durum !== 'İptal' && a.personelIds.includes(pid))
    const dagilim = firmaIds.map((firmaId) => ({
      firmaId,
      firma: firmalar.find((f) => f.id === firmaId),
      kisiler: secilenler.filter((pid) => personeller.find((p) => p.id === pid)?.firmaId === firmaId && !dahaOnceAtali(pid)),
    })).filter((x) => x.kisiler.length > 0)
    return { egitim, dagilim, tekrar: secilenler.filter(dahaOnceAtali).length, katilim: dagilim.reduce((n, f) => n + f.kisiler.length, 0) }
  })
  const firmaKaydiSayisi = kursDagilimlari.reduce((n, x) => n + x.dagilim.length, 0)
  const katilimciSayisi = kursDagilimlari.reduce((n, x) => n + x.katilim, 0)
  const atlananTekrar = kursDagilimlari.reduce((n, x) => n + x.tekrar, 0)
  const atamaKaydiSayisi = firmaKaydiSayisi
  const gorunenlerSecili = gorunenAdaylar.length > 0 && gorunenAdaylar.every((p) => personelIds.includes(p.id))
  const yeniPersonelIds = adaylar.filter((p) => son7GundeOlusturuldu(p.olusturma)).map((p) => p.id)

  const egitimSeciminiDegistir = (id: string) => setEgitimIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
  const firmaSeciminiDegistir = (id: string) => {
    if (firmaIds.includes(id)) {
      setFirmaIds((ids) => ids.filter((x) => x !== id))
      setPersonelIds((ids) => ids.filter((pid) => personeller.find((p) => p.id === pid)?.firmaId !== id))
    } else setFirmaIds((ids) => [...ids, id])
  }
  const gorunenSeciminiDegistir = () => {
    const gorunenIds = gorunenAdaylar.map((p) => p.id)
    setPersonelIds((ids) => gorunenlerSecili ? ids.filter((id) => !gorunenIds.includes(id)) : [...new Set([...ids, ...gorunenIds])])
  }

  const grupEgitim = seciliEgitimler.find((e) => e.id === grupEgitimId) ?? seciliEgitimler[0]
  const grupSecimi = grupEgitim ? (egitimKatilimcilari[grupEgitim.id] ?? personelIds) : []
  const grupKisileri = sayfala(adaylar, sayfalar.grup, SAYFA_BOYUTU.grup)
  const grupTumuSecili = adaylar.length > 0 && grupSecimi.length === adaylar.length
  const grupTogglePersonel = (pid: string, secili: boolean) => {
    if (!grupEgitim) return
    setEgitimKatilimcilari((m) => ({ ...m, [grupEgitim.id]: secili ? [...new Set([...(m[grupEgitim.id] ?? personelIds), pid])] : (m[grupEgitim.id] ?? personelIds).filter((id) => id !== pid) }))
  }

  const sonraki = () => {
    if (adim === 0 && seciliEgitimler.length === 0) return toast.error('En az bir eğitim seçin')
    if (adim === 0 && firmaIds.length === 0) return toast.error('En az bir firma seçin')
    if (adim === 1 && firmaIds.length === 0) return toast.error('En az bir firma seçin')
    if (adim === 1 && personelIds.length === 0) return toast.error('En az bir çalışan seçin')
    if (adim === 1) {
      // Adım 1'de sonradan eklenen kişiler her eğitim grubuna girer; mevcut grup düzenlemeleri korunur.
      const yeniKisiler = personelIds.filter((pid) => !bilinenPersonelIds.includes(pid))
      setEgitimKatilimcilari((mevcut) => Object.fromEntries(seciliEgitimler.map((e) => [e.id, mevcut[e.id] ? [...new Set([...mevcut[e.id].filter((pid) => personelIds.includes(pid)), ...yeniKisiler])] : [...personelIds]])))
      setBilinenPersonelIds(personelIds)
    }
    if (adim === 2) {
      const bos = seciliEgitimler.find((e) => (egitimKatilimcilari[e.id] ?? personelIds).length === 0)
      if (bos) return toast.error(`${bos.baslik} için en az bir katılımcı seçin`)
    }
    if (adim === 3 && !atamaTarihi) return toast.error('Atama tarihi zorunlu')
    if (adim === 3 && !sonTarih) return toast.error('Son tamamlama tarihi zorunlu')
    if (adim === 3 && sonTarih < atamaTarihi) return toast.error('Son tarih atama tarihinden önce olamaz')
    setAdim((ix) => Math.min(4, ix + 1))
  }

  const ata = () => {
    if (!firmaKaydiSayisi) return toast.error('Oluşturulacak yeni atama yok; seçilen kişiler bu eğitimlere zaten atanmış')
    const olusturan = user?.name ?? user?.username ?? 'Bilinmeyen kullanıcı'
    const kayitlar = kursDagilimlari.flatMap(({ egitim, dagilim }) => dagilim.map(({ firmaId, kisiler }) => ({
      egitimId: egitim.id,
      surumId: egitim.aktifSurumId,
      firmaId,
      personelIds: kisiler,
      atamaTarihi,
      sonTarih,
      zorunlu,
      hatirlatmaGun,
      firmaEkleyebilir,
      olusturan,
    })))
    const kayit = topluAtamaEkle(kayitlar)
    toast.success(`${kayit} atama oluşturuldu · ${katilimciSayisi} yeni katılımcı${atlananTekrar ? ` · ${atlananTekrar} zaten atanmış kişi atlandı` : ''}`)
    navigate('/panel/egitim-atamalari')
  }

  if (!ataIzni) return <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">Eğitim atama izniniz yok.</div>

  const egitimSayfasi = sayfala(egitimlerFiltreli, sayfalar.egitim, SAYFA_BOYUTU.egitim)
  const firmaSayfasi = sayfala(adayFirmalar, sayfalar.firma, SAYFA_BOYUTU.firma)
  const katilimciSayfasi = sayfala(gorunenAdaylar, sayfalar.katilimci, SAYFA_BOYUTU.katilimci)
  const ozetSayfasi = sayfala(kursDagilimlari, sayfalar.ozet, SAYFA_BOYUTU.ozet)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 gap-4 px-6 pt-5 pb-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="relative hidden min-h-0 overflow-hidden rounded-2xl bg-zinc-950 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.2),transparent_48%)]" />
          <div className="relative flex h-full flex-col p-5">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300"><ClipboardCheckIcon className="size-5" /></span><div><p className="text-sm font-semibold">Atama yönetimi</p><p className="text-[11px] text-white/45">Toplu işlem planı</p></div></div>
            <div className="mt-7 space-y-1">{ADIMLAR.map((ad, i) => <div key={ad} className={cn('relative flex gap-3 rounded-xl px-2.5 py-3', adim === i && 'bg-white/[0.08]')}>
              {i < ADIMLAR.length - 1 && <span className="absolute top-11 left-[22px] h-5 w-px bg-white/10" />}
              <span className={cn('relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold', i < adim ? 'border-emerald-400 bg-emerald-500 text-white' : i === adim ? 'border-amber-300 bg-amber-400 text-zinc-950' : 'border-white/15 bg-white/5 text-white/40')}>{i < adim ? <CheckCircle2Icon className="size-3.5" /> : i + 1}</span>
              <div><p className={cn('text-xs font-medium', i === adim ? 'text-white' : i < adim ? 'text-white/70' : 'text-white/40')}>{ad}</p><p className="mt-1 text-[10px] leading-4 text-white/35">{ADIM_ACIKLAMALARI[i]}</p></div>
            </div>)}</div>
            <div className="mt-auto space-y-2.5 pt-5">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><p className="text-[10px] text-white/45">Seçim özeti</p><div className="mt-2 grid grid-cols-3 gap-2 text-center"><div><p className="text-lg font-semibold tabular-nums">{seciliEgitimler.length}</p><p className="text-[9px] text-white/40">eğitim</p></div><div><p className="text-lg font-semibold tabular-nums">{firmaIds.length}</p><p className="text-[9px] text-white/40">firma</p></div><div><p className="text-lg font-semibold tabular-nums">{personelIds.length}</p><p className="text-[9px] text-white/40">kişi</p></div></div><div className="mt-3 border-t border-white/10 pt-2"><p className="text-[10px] text-white/45">Oluşacak firma ataması</p><p className="mt-0.5 text-sm font-semibold text-amber-300">{atamaKaydiSayisi} kayıt</p></div></div>
              {seciliEgitimler.length > 0 && <div className="space-y-1.5">{seciliEgitimler.slice(0, 3).map((e) => <div key={e.id} className="flex items-center gap-2 rounded-lg px-1 py-1"><span className={cn('flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br text-white', e.kapakTon)}>{e.kapakGorsel ? <img src={e.kapakGorsel} alt="" className="size-full object-cover" /> : <GraduationCapIcon className="size-3.5" />}</span><p className="truncate text-[10px] text-white/65">{e.baslik}</p></div>)}{seciliEgitimler.length > 3 && <p className="pl-1 text-[10px] text-white/40">+{seciliEgitimler.length - 3} eğitim daha</p>}</div>}
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3 sm:px-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.15em] text-amber-600 uppercase dark:text-amber-400">Adım {adim + 1} / 5</p><h2 className="mt-0.5 text-base font-semibold">{ADIMLAR[adim]}</h2></div><span className="hidden rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground sm:inline-flex">{ADIM_ACIKLAMALARI[adim]}</span></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-muted lg:hidden"><div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${((adim + 1) / 5) * 100}%` }} /></div></div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-5">
            {adim === 0 && <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-52 flex-1"><SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" /><input aria-label="Eğitim ara" value={egitimAra} onChange={(e) => { setEgitimAra(e.target.value); sayfaDegistir('egitim')(0) }} placeholder="Eğitim veya kategori ara…" className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-xs outline-none focus-visible:border-ring dark:bg-input/30" /></div>
                <Sayfalama sayfa={egitimSayfasi.toplam > 0 ? Math.min(sayfalar.egitim, egitimSayfasi.toplam - 1) : 0} toplam={egitimSayfasi.toplam} onChange={sayfaDegistir('egitim')} />
              </div>
              <div className="grid min-h-0 gap-2 sm:grid-cols-2">{egitimSayfasi.ogeler.map((e) => {
                const secili = egitimIds.includes(e.id)
                const sv = aktifSurum(e)
                const ist = surumIstatistik(sv)
                return <button key={e.id} type="button" aria-pressed={secili} onClick={() => egitimSeciminiDegistir(e.id)} className={cn('flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500', secili ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/25' : 'hover:border-amber-500/35')}>
                  <span className={cn('flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-white', e.kapakTon)}>{e.kapakGorsel ? <img src={e.kapakGorsel} alt="" className="size-full object-cover" /> : <GraduationCapIcon className="size-4" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs leading-5 font-semibold">{e.baslik}</span><span className="block truncate text-[11px] text-muted-foreground">{e.aciklama}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">v{sv.no} · {ist.bolumSayisi} bölüm · {ist.soruSayisi} soru · {e.sureDakika} dk</span></span>
                  <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border', secili ? 'border-amber-500 bg-amber-500 text-zinc-950' : 'border-border')}>{secili && <CheckCircle2Icon className="size-3.5" />}</span>
                </button>
              })}{egitimlerFiltreli.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground sm:col-span-2">Eşleşen yayınlanmış eğitim bulunamadı.</p>}</div>

              <section className="flex min-h-0 flex-1 flex-col">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div><h3 className="text-xs font-semibold">Firmalar</h3><p className="text-[10px] text-muted-foreground">Atama oluşturulacak şirketleri seçin.</p></div>
                  <div className="flex items-center gap-2"><span className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">{firmaIds.length} seçili</span><Sayfalama sayfa={firmaSayfasi.toplam > 0 ? Math.min(sayfalar.firma, firmaSayfasi.toplam - 1) : 0} toplam={firmaSayfasi.toplam} onChange={sayfaDegistir('firma')} /></div>
                </div>
                <div className="relative mb-2"><SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" /><input aria-label="Firma ara" value={firmaAra} onChange={(e) => { setFirmaAra(e.target.value); sayfaDegistir('firma')(0) }} placeholder="Firma ara…" className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-xs outline-none focus-visible:border-ring dark:bg-input/30" /></div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{firmaSayfasi.ogeler.map((f) => { const secili = firmaIds.includes(f.id); const adet = personeller.filter((p) => p.firmaId === f.id && (p.durum === 'Aktif' || p.durum === 'İzinli')).length; return <button key={f.id} type="button" aria-pressed={secili} onClick={() => firmaSeciminiDegistir(f.id)} className={cn('flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500', secili ? 'border-amber-500/60 bg-amber-500/5' : 'hover:border-foreground/25')}><span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', secili ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground')}><Building2Icon className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{f.unvan}</span><span className="block text-[10px] text-muted-foreground">{adet} uygun çalışan</span></span><span aria-hidden="true" className={cn('flex size-4 shrink-0 items-center justify-center rounded-full border', secili ? 'border-amber-500 bg-amber-500 text-zinc-950' : 'border-border')}>{secili && <CheckCircle2Icon className="size-3" />}</span></button>})}</div>
                {firmalar.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">Önce firma kaydı ekleyin.</p>}
              </section>
            </>}

            {adim === 1 && <>
              {firmaIds.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">Önce bir önceki adımda firma seçin.</p> : <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><h3 className="text-xs font-semibold">Katılımcılar</h3><p className="text-[10px] text-muted-foreground">{personelIds.length} / {adaylar.length} seçili · Hesabı olmayanlar da seçilebilir.</p></div>
                  <button type="button" className="text-[11px] font-medium text-amber-700 hover:underline dark:text-amber-400" onClick={gorunenSeciminiDegistir}>{gorunenlerSecili ? 'Görünen seçimleri kaldır' : 'Görünenleri seç'}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-48 flex-1"><SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" /><input aria-label="Katılımcı ara" value={personelAra} onChange={(e) => { setPersonelAra(e.target.value); sayfaDegistir('katilimci')(0) }} placeholder="Ad, görev, departman veya firma ara…" className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-xs outline-none focus-visible:border-ring dark:bg-input/30" /></div>
                  <select aria-label="Personel filtresi" value={personelFiltresi} onChange={(e) => { setPersonelFiltresi(e.target.value as typeof personelFiltresi); sayfaDegistir('katilimci')(0) }} className="h-8 rounded-lg border bg-background px-2 text-xs"><option value="tumu">Tüm uygun personel</option><option value="yeni">Son 7 günde eklenenler</option><option value="hesapli">Aktif hesabı olanlar</option><option value="hesapsiz">Hesabı olmayanlar</option><option value="atanmis">Daha önce atanmışlar</option><option value="atanmamis">Daha önce atanmamışlar</option></select>
                  <select aria-label="Personel sıralaması" value={personelSirasi} onChange={(e) => setPersonelSirasi(e.target.value as typeof personelSirasi)} className="h-8 rounded-lg border bg-background px-2 text-xs"><option value="yeni">En son eklenen</option><option value="eski">En eski eklenen</option><option value="az">A–Z</option><option value="za">Z–A</option></select>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">{[10, 25, 50].map((adet) => <button key={adet} type="button" disabled={!adaylar.length} onClick={() => setPersonelIds((ids) => [...new Set([...ids, ...adaylar.slice(0, adet).map((p) => p.id)])])} className="rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:border-amber-500/40 hover:text-foreground disabled:opacity-40">İlk {adet} kişiyi ekle</button>)}<button type="button" disabled={!yeniPersonelIds.length} onClick={() => setPersonelIds((ids) => [...new Set([...ids, ...yeniPersonelIds])])} className="rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:border-amber-500/40 hover:text-foreground disabled:opacity-40">Yeni personelleri ekle</button></div>
                <div className="grid min-h-0 flex-1 content-start gap-1 sm:grid-cols-2">{katilimciSayfasi.ogeler.map((p) => { const secili = personelIds.includes(p.id); const hesap = hesaplar.find((h) => h.personelId === p.id && h.durum === 'Aktif'); const yeni = son7GundeOlusturuldu(p.olusturma); const onceAtali = atamalar.some((a) => a.personelIds.includes(p.id)); return <label key={p.id} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors', secili ? 'border-amber-500/40 bg-amber-500/10' : 'hover:bg-muted/60')}><Checkbox checked={secili} onCheckedChange={(v) => setPersonelIds((ids) => v ? [...ids, p.id] : ids.filter((id) => id !== p.id))} /><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[9px] font-semibold text-white">{p.ad[0]}{p.soyad[0]}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 truncate text-xs font-medium">{personelAd(p)}{yeni && <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-700 dark:text-emerald-400">Yeni</span>}</span><span className="block truncate text-[10px] text-muted-foreground">{p.gorev || p.departman || 'Görev belirtilmemiş'} · {firmalar.find((f) => f.id === p.firmaId)?.unvan}</span></span><span className="hidden shrink-0 text-[10px] text-muted-foreground lg:inline">{hesap ? 'Hesabı var' : 'Hesapsız'} · {onceAtali ? 'Atanmış' : 'Atanmamış'}</span></label>})}{adaylar.length === 0 && <p className="col-span-full rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">Bu firmalarda uygun çalışan bulunmuyor.</p>}{adaylar.length > 0 && gorunenAdaylar.length === 0 && <p className="col-span-full rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">Filtrelerle eşleşen çalışan bulunamadı.</p>}</div>
                <div className="flex items-center justify-between gap-2"><p className="text-[10px] text-muted-foreground">{gorunenAdaylar.length} kişi listeleniyor</p><Sayfalama sayfa={katilimciSayfasi.toplam > 0 ? Math.min(sayfalar.katilimci, katilimciSayfasi.toplam - 1) : 0} toplam={katilimciSayfasi.toplam} onChange={sayfaDegistir('katilimci')} /></div>
              </>}
            </>}

            {adim === 2 && <>
              {seciliEgitimler.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">Önce eğitim seçin.</p> : <>
                <div className="flex flex-wrap gap-1.5">{seciliEgitimler.map((e) => { const aktif = grupEgitim?.id === e.id; const adet = (egitimKatilimcilari[e.id] ?? personelIds).length; return <button key={e.id} type="button" aria-pressed={aktif} onClick={() => { setGrupEgitimId(e.id); sayfaDegistir('grup')(0) }} className={cn('flex max-w-56 items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors', aktif ? 'border-amber-500/60 bg-amber-500/10' : 'hover:border-amber-500/35')}><span className={cn('flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br text-white', e.kapakTon)}>{e.kapakGorsel ? <img src={e.kapakGorsel} alt="" className="size-full object-cover" /> : <GraduationCapIcon className="size-3" />}</span><span className="min-w-0"><span className="block truncate text-[11px] font-medium">{e.baslik}</span><span className="block text-[9px] text-muted-foreground">{adet} katılımcı</span></span></button>})}</div>
                {grupEgitim && <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><h3 className="text-xs font-semibold">{grupEgitim.baslik}</h3><p className="text-[10px] text-muted-foreground">Başlangıçta seçtiğiniz çalışanlar her eğitime eklenir; bu grubu ayrıca düzenleyebilirsiniz.</p></div>
                    <button type="button" className="text-[11px] font-medium text-amber-700 hover:underline dark:text-amber-400" onClick={() => setEgitimKatilimcilari((m) => ({ ...m, [grupEgitim.id]: grupTumuSecili ? [] : adaylar.map((p) => p.id) }))}>{grupTumuSecili ? 'Grubu temizle' : 'Tüm uygun çalışanları seç'}</button>
                  </div>
                  <div className="grid min-h-0 flex-1 content-start gap-1 sm:grid-cols-2">{grupKisileri.ogeler.map((p) => <label key={p.id} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors', grupSecimi.includes(p.id) ? 'border-amber-500/40 bg-amber-500/10' : 'hover:bg-muted/60')}><Checkbox checked={grupSecimi.includes(p.id)} onCheckedChange={(v) => grupTogglePersonel(p.id, !!v)} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{personelAd(p)}</span><span className="block truncate text-[10px] text-muted-foreground">{firmalar.find((f) => f.id === p.firmaId)?.unvan} · {p.departman || p.gorev || 'Görev belirtilmemiş'}</span></span></label>)}{adaylar.length === 0 && <p className="col-span-full rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">Katılımcı bulunmuyor. Önceki adımda çalışan seçin.</p>}</div>
                  <div className="flex items-center justify-between gap-2"><p className="text-[10px] text-muted-foreground">{grupSecimi.length} / {adaylar.length} katılımcı seçili</p><Sayfalama sayfa={grupKisileri.toplam > 0 ? Math.min(sayfalar.grup, grupKisileri.toplam - 1) : 0} toplam={grupKisileri.toplam} onChange={sayfaDegistir('grup')} /></div>
                </>}
              </>}
            </>}

            {adim === 3 && <div className="max-w-3xl space-y-4"><section><h3 className="text-xs font-semibold">Ortak takvim</h3><p className="mt-0.5 text-[10px] text-muted-foreground">Bu tarihler seçtiğiniz tüm eğitim ve firma atamalarında kullanılır.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="space-y-1.5"><span className="text-xs font-medium">Atama tarihi</span><input type="date" value={atamaTarihi} onChange={(e) => setAtamaTarihi(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /><span className="block text-[10px] text-muted-foreground">Eğitimlerin çalışan listesinde görüneceği gün.</span></label><label className="space-y-1.5"><span className="text-xs font-medium">Son tamamlama tarihi</span><input type="date" min={atamaTarihi} value={sonTarih} onChange={(e) => setSonTarih(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /><span className="block text-[10px] text-muted-foreground">Sonrasında tamamlanmayan katılımlar gecikir.</span></label></div></section>
              <section className="border-t pt-4"><h3 className="text-xs font-semibold">Tamamlama kuralları</h3><div className="mt-2 grid gap-2 sm:grid-cols-2"><label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3', zorunlu ? 'border-amber-500/40 bg-amber-500/5' : 'bg-card')}><Checkbox checked={zorunlu} onCheckedChange={(v) => setZorunlu(!!v)} className="mt-0.5" /><span><span className="block text-xs font-medium">Zorunlu eğitim</span><span className="mt-1 block text-[10px] leading-4 text-muted-foreground">Seçilen tüm eğitimleri zorunlu olarak işaretle.</span></span></label><label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3', firmaEkleyebilir ? 'border-amber-500/40 bg-amber-500/5' : 'bg-card')}><Checkbox checked={firmaEkleyebilir} onCheckedChange={(v) => setFirmaEkleyebilir(!!v)} className="mt-0.5" /><span><span className="block text-xs font-medium">Firma çalışan ekleyebilsin</span><span className="mt-1 block text-[10px] leading-4 text-muted-foreground">Firma yetkilisi kendi çalışanlarını atamaya dahil edebilir.</span></span></label></div><div className="mt-3 max-w-xs"><label className="space-y-1.5"><span className="text-xs font-medium">Son tarihten önce hatırlatma</span><span className="flex items-center gap-2"><input type="number" min={0} max={30} value={hatirlatmaMetin} onBlur={() => setHatirlatmaMetin(String(hatirlatmaGun))} onChange={(e) => setHatirlatmaMetin(e.target.value)} className="h-9 w-24 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /><span className="text-xs text-muted-foreground">gün önce · 0 = kapalı</span></span></label></div></section>
            </div>}

            {adim === 4 && <>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2"><div className="rounded-xl border bg-background p-2.5"><p className="text-[10px] text-muted-foreground">Eğitim</p><p className="mt-0.5 text-base font-semibold tabular-nums">{seciliEgitimler.length}</p></div><div className="rounded-xl border bg-background p-2.5"><p className="text-[10px] text-muted-foreground">Firma ataması</p><p className="mt-0.5 text-base font-semibold tabular-nums">{atamaKaydiSayisi}</p></div><div className="rounded-xl border bg-background p-2.5"><p className="text-[10px] text-muted-foreground">Yeni katılım</p><p className="mt-0.5 text-base font-semibold tabular-nums">{katilimciSayisi}</p></div><div className="rounded-xl border bg-background p-2.5"><p className="text-[10px] text-muted-foreground">Tekrar atlama</p><p className="mt-0.5 text-base font-semibold tabular-nums">{atlananTekrar}</p></div></div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
                <div className="flex items-center gap-3 border-b px-3.5 py-2.5"><CalendarIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" /><div className="min-w-0 flex-1"><p className="text-xs font-medium">{atamaTarihi} → {sonTarih}</p><p className="text-[10px] text-muted-foreground">{gunDurumu(sonTarih)} · {zorunlu ? 'Zorunlu' : 'İsteğe bağlı'} · Hatırlatma {hatirlatmaGun > 0 ? `${hatirlatmaGun} gün önce` : 'kapalı'}</p></div><Sayfalama sayfa={ozetSayfasi.toplam > 0 ? Math.min(sayfalar.ozet, ozetSayfasi.toplam - 1) : 0} toplam={ozetSayfasi.toplam} onChange={sayfaDegistir('ozet')} /></div>
                <div className="divide-y">{ozetSayfasi.ogeler.map(({ egitim: e, dagilim, tekrar, katilim }) => <div key={e.id} className="flex items-center gap-2.5 px-3.5 py-2"><span className={cn('flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br text-white', e.kapakTon)}>{e.kapakGorsel ? <img src={e.kapakGorsel} alt="" className="size-full object-cover" /> : <GraduationCapIcon className="size-3.5" />}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{e.baslik}</p><p className="text-[10px] text-muted-foreground">v{aktifSurum(e).no} · {katilim} yeni katılım{tekrar ? ` · ${tekrar} atlanacak` : ''}</p><div className="mt-1 flex flex-wrap gap-1">{dagilim.map((d) => <span key={d.firmaId} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">{d.firma?.unvan ?? d.firmaId} · {d.kisiler.length} kişi</span>)}</div></div>{katilim > 0 ? <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" /> : <span className="shrink-0 text-[10px] font-medium text-amber-700 dark:text-amber-400">Yeni kayıt yok</span>}</div>)}{kursDagilimlari.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">Eğitim seçilmedi.</p>}</div>
              </div>
              <p className="text-[10px] text-muted-foreground">Firma çalışan eklemesi: {firmaEkleyebilir ? 'Açık' : 'Kapalı'} · Atama tarihleri tüm seçili eğitimlerde aynıdır.</p>
            </>}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 sm:px-5"><Button variant="ghost" size="sm" onClick={() => adim === 0 ? navigate('/panel/egitim-atamalari') : setAdim((ix) => ix - 1)}>{adim === 0 ? 'Atamalara dön' : <><ArrowLeftIcon /> Geri</>}</Button><div className="flex items-center gap-2"><span className="hidden text-[10px] text-muted-foreground sm:block">{atamaKaydiSayisi} yeni firma ataması oluşacak</span><Button variant="ghost" size="sm" onClick={() => navigate('/panel/egitim-atamalari')}>Vazgeç</Button>{adim < 4 ? <Button size="sm" onClick={sonraki}>Devam et <ArrowRightIcon /></Button> : <Button size="sm" disabled={!atamaKaydiSayisi} onClick={ata}><CheckCircle2Icon /> Atamaları oluştur</Button>}</div></footer>
        </main>
      </div>
    </div>
  )
}
