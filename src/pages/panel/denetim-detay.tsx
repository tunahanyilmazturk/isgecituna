import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Dialog } from '@base-ui/react/dialog'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BanIcon,
  CameraIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileDownIcon,
  FileWarningIcon,
  HistoryIcon,
  ImageIcon,
  Link2Icon,
  MapPinIcon,
  PaperclipIcon,
  PlayIcon,
  PlusIcon,
  SendIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CipGrup } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import { formatKisa, formatUzun, gunFarki } from '@/lib/date'
import {
  ONEMLER,
  bulguDurumRenk,
  durumRenk,
  maddeIstat,
  onemRenk,
  puanHesapla,
  sonucRenk,
  type DenetimBulgu,
  type DenetimMadde,
  type MaddeSonuc,
  type Onem,
} from '@/data/denetimler'
import { aksiyonAcik, aksiyonDurumRenk, aksiyonGecikmis, oncelikRenk } from '@/data/risk'
import { denetimPdfIndir } from '@/lib/denetim-pdf'
import { useDenetimlerStore } from '@/stores/denetimler-store'
import { useRiskStore } from '@/stores/risk-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { hesapGorunenAd } from '@/data/ekip'
import { useIzin } from '@/lib/izin'
import { kapsamdaMi, useKapsam } from '@/lib/kapsam'

const SEKMELER = ['genel', 'kontrol', 'uygunsuzluk', 'aksiyonlar', 'dokumanlar', 'gecmis'] as const
type Sekme = (typeof SEKMELER)[number]
const sekmeAd: Record<Sekme, string> = {
  genel: 'Genel Bakış',
  kontrol: 'Kontrol Listesi',
  uygunsuzluk: 'Uygunsuzluklar',
  aksiyonlar: 'Aksiyonlar',
  dokumanlar: 'Dokümanlar',
  gecmis: 'Geçmiş',
}

/** Fotoğrafı ~960px'e küçültüp dataURL üretir — localStorage dostu */
const fotoIndir = (file: File): Promise<{ ad: string; dataUrl: string; boyut: number }> =>
  new Promise((coz, hata) => {
    const okur = new FileReader()
    okur.onerror = hata
    okur.onload = () => {
      const img = new Image()
      img.onerror = hata
      img.onload = () => {
        const olcek = Math.min(1, 960 / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * olcek)
        c.height = Math.round(img.height * olcek)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        coz({ ad: file.name, dataUrl: c.toDataURL('image/jpeg', 0.72), boyut: file.size })
      }
      img.src = String(okur.result)
    }
    okur.readAsDataURL(file)
  })

export default function DenetimDetayPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const st = useDenetimlerStore()
  const aksiyonlar = useRiskStore((s) => s.aksiyonlar)
  const tehlikeler = useRiskStore((s) => s.tehlikeler)
  const personeller = usePersonelStore((s) => s.personeller)
  const { uyeler, hesaplar } = useEkipStore()
  const user = useAuthStore((s) => s.user)
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.name ?? 'Kullanıcı')
  const duzenleIzni = useIzin('gorevlendirmeler.duzenle')
  const aktarIzni = useIzin('gorevlendirmeler.aktar')
  const kapsam = useKapsam('denetimler')

  const denetim = st.denetimler.find((d) => d.id === id)
  const bulgular = st.bulgular.filter((b) => b.denetimId === id)
  const denAksiyonlar = aksiyonlar.filter((a) => a.kaynak?.tur === 'denetim' && a.kaynak.denetimId === id)

  const [sekme, setSekme] = useState<Sekme>((params.get('sekme') as Sekme) || 'genel')
  const [bulguForm, setBulguForm] = useState<{ maddeId?: string } | null>(null)
  const [kapatForm, setKapatForm] = useState<DenetimBulgu | null>(null)
  const [kapatNotu, setKapatNotu] = useState('')
  const [iptalAcik, setIptalAcik] = useState(false)
  const [lightbox, setLightbox] = useState<{ url: string; ad: string } | null>(null)
  const [pdfCalisiyor, setPdfCalisiyor] = useState(false)
  const [aksiyonForm, setAksiyonForm] = useState<DenetimBulgu | null>(null)
  const [aksSorumlu, setAksSorumlu] = useState('')
  const [aksHedef, setAksHedef] = useState('')
  const [aksOncelik, setAksOncelik] = useState<Onem>('Orta')

  // Sorumlu adayları: firma personeli + ekip uzmanları
  const sorumluAday = useMemo(() => {
    const liste: { id: string; ad: string; etiket: string }[] = [
      ...personeller.filter((p) => p.firmaId === denetim?.firmaId && p.durum === 'Aktif').map((p) => ({ id: p.id, ad: `${p.ad} ${p.soyad}`, etiket: 'firma personeli' })),
      ...uyeler.filter((u) => u.durum === 'Aktif').map((u) => ({ id: u.id, ad: `${u.ad} ${u.soyad}`, etiket: u.gorev ?? 'OSGB' })),
    ]
    return liste
  }, [personeller, uyeler, denetim?.firmaId])

  if (!denetim)
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-muted-foreground">Denetim bulunamadı.</p>
        <Button variant="outline" size="sm" onClick={() => nav('/panel/denetimler')}><ArrowLeftIcon /> Listeye dön</Button>
      </div>
    )
  if (!kapsamdaMi(kapsam, denetim.firmaId) || (kapsam.sadeceKendi && denetim.olusturan !== kapsam.kullanici && denetim.uzmanAd !== kapsam.kullanici))
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-muted-foreground">Bu denetimi görüntüleme yetkiniz yok.</p>
        <Button variant="outline" size="sm" onClick={() => nav('/panel/denetimler')}><ArrowLeftIcon /> Listeye dön</Button>
      </div>
    )

  const ist = maddeIstat(denetim.maddeler)
  const puan = puanHesapla(denetim.maddeler)
  const acikBulgu = bulgular.filter((b) => b.durum !== 'Kapatıldı' && b.durum !== 'İptal Edildi')
  const saha = denetim.durum === 'Devam Ediyor'
  const gecmis = [...denetim.gecmis].reverse()

  const baslat = () => {
    st.denetimBaslat(denetim.id, kullanici)
    toast.success('Denetim başlatıldı', { description: `${denetim.no} saha ekranına yönlendiriliyorsunuz.` })
    nav(`/panel/denetimler/${denetim.id}/saha`)
  }
  const raporaAl = () => {
    const eksik = st.denetimRaporaAl(denetim.id, kullanici)
    if (eksik > 0) toast.error(`${eksik} zorunlu madde değerlendirilmedi`, { description: 'Kontrol listesi sekmesinde eksik maddeleri tamamlayın.' })
    else toast.success('Saha kontrolleri tamamlandı', { description: 'Denetim rapor aşamasına geçti.' })
  }
  const tamamla = () => {
    st.denetimTamamla(denetim.id, kullanici)
    toast.success('Denetim tamamlandı')
  }
  const pdf = async () => {
    setPdfCalisiyor(true)
    try {
      await denetimPdfIndir(denetim, bulgular, denAksiyonlar)
      st.belgeEkle(denetim.id, { ad: `${denetim.no} Denetim Raporu`, tur: 'rapor', surum: (denetim.belgeler.filter((b) => b.tur === 'rapor').length + 1), olusturma: TODAY, olusturan: kullanici })
      toast.success('PDF raporu oluşturuldu ve dokümanlara kaydedildi')
    } catch {
      toast.error('PDF oluşturulamadı')
    } finally {
      setPdfCalisiyor(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------- Başlık ------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => nav('/panel/denetimler')} aria-label="Geri" className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <ArrowLeftIcon className="size-4" />
            </button>
            <span className="font-mono text-xs text-muted-foreground">{denetim.no}</span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', durumRenk[denetim.durum])}>{denetim.durum}</span>
            {puan !== undefined && (
              <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums', puan >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : puan >= 50 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-red-500/10 text-red-600 dark:text-red-400')}>
                Puan %{puan}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{denetim.baslik}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {denetim.firmaAd} · {denetim.lokasyon} · {formatKisa(denetim.planlananTarih)}{denetim.planlananSaat ? ` ${denetim.planlananSaat}` : ''} · {denetim.uzmanAd}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(denetim.durum === 'Taslak' || denetim.durum === 'Planlandı') && duzenleIzni && (
            <Button size="sm" onClick={baslat}><PlayIcon /> Denetime Başla</Button>
          )}
          {saha && (
            <>
              <Button size="sm" onClick={() => nav(`/panel/denetimler/${denetim.id}/saha`)}><ClipboardCheckIcon /> Sahada Devam Et</Button>
              {duzenleIzni && <Button variant="outline" size="sm" onClick={raporaAl}><SendIcon /> Kontrolleri Bitir</Button>}
            </>
          )}
          {denetim.durum === 'Rapor Bekliyor' && duzenleIzni && (
            <Button size="sm" onClick={tamamla}><CheckCircle2Icon /> Denetimi Tamamla</Button>
          )}
          {aktarIzni && (
            <Button variant="outline" size="sm" onClick={pdf} disabled={pdfCalisiyor}>
              <FileDownIcon /> {pdfCalisiyor ? 'Hazırlanıyor…' : 'PDF Raporu'}
            </Button>
          )}
          {duzenleIzni && denetim.durum !== 'Tamamlandı' && denetim.durum !== 'İptal Edildi' && (
            <Button variant="ghost" size="sm" onClick={() => setIptalAcik(true)}><BanIcon /> İptal Et</Button>
          )}
        </div>
      </div>

      {/* ------------------------------- Sekmeler ----------------------------- */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {SEKMELER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSekme(s)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              sekme === s ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {sekmeAd[s]}
            {s === 'uygunsuzluk' && bulgular.length > 0 && <span className="ml-1.5 rounded-full bg-red-500/10 px-1.5 text-xs font-semibold text-red-600 dark:text-red-400">{bulgular.length}</span>}
            {s === 'kontrol' && <span className="ml-1.5 text-xs text-muted-foreground">{ist.toplam - ist.cevapsiz}/{ist.toplam}</span>}
          </button>
        ))}
      </div>

      {/* ------------------------------ Genel Bakış ---------------------------- */}
      {sekme === 'genel' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">Denetim ilerlemesi</h2>
                <span className="text-xs text-muted-foreground tabular-nums">{ist.toplam - ist.cevapsiz}/{ist.toplam} madde</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="flex h-full transition-all"
                  style={{ width: `${ist.toplam ? ((ist.toplam - ist.cevapsiz) / ist.toplam) * 100 : 0}%` }}
                >
                  <div className="h-full bg-emerald-500" style={{ width: `${ist.toplam - ist.cevapsiz ? (ist.uygun / (ist.toplam - ist.cevapsiz || 1)) * 100 : 0}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${ist.toplam - ist.cevapsiz ? (ist.uygunsuz / (ist.toplam - ist.cevapsiz || 1)) * 100 : 0}%` }} />
                  <div className="h-full bg-zinc-400" style={{ width: `${ist.toplam - ist.cevapsiz ? (ist.uygulanamaz / (ist.toplam - ist.cevapsiz || 1)) * 100 : 0}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${ist.toplam - ist.cevapsiz ? (ist.gozlem / (ist.toplam - ist.cevapsiz || 1)) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(
                  [
                    ['Uygun', ist.uygun, 'text-emerald-600 dark:text-emerald-400'],
                    ['Uygunsuz', ist.uygunsuz, 'text-red-600 dark:text-red-400'],
                    ['Uygulanamaz', ist.uygulanamaz, 'text-muted-foreground'],
                    ['Gözlem', ist.gozlem, 'text-amber-600 dark:text-amber-400'],
                    ['Cevapsız', ist.cevapsiz, 'text-muted-foreground'],
                  ] as const
                ).map(([l, v, c]) => (
                  <div key={l} className="rounded-lg border bg-background px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">{l}</p>
                    <p className={cn('text-lg leading-none font-semibold tabular-nums', c)}>{v}</p>
                  </div>
                ))}
              </div>
              {ist.eksikZorunlu > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangleIcon className="size-3.5" /> {ist.eksikZorunlu} zorunlu madde değerlendirilmedi
                </p>
              )}
            </div>

            {/* Özet istatistikler */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ['Uygunsuzluk', bulgular.length, `${acikBulgu.length} açık`],
                  ['Aksiyon', denAksiyonlar.length, `${denAksiyonlar.filter(aksiyonAcik).length} açık`],
                  ['Gecikmiş faaliyet', denAksiyonlar.filter(aksiyonGecikmis).length, ''],
                  ['Kontrol madde', ist.toplam, `${ist.eksikZorunlu} eksik zorunlu`],
                ] as const
              ).map(([l, v, alt]) => (
                <div key={l} className="rounded-xl border bg-card px-3.5 py-3">
                  <p className="text-xs text-muted-foreground">{l}</p>
                  <p className="mt-1 text-2xl leading-none font-semibold tabular-nums">{v}</p>
                  {alt && <p className="mt-1 text-[11px] text-muted-foreground">{alt}</p>}
                </div>
              ))}
            </div>

            {/* Şablon sürüm bilgisi */}
            <div className="rounded-xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-medium">Kullanılan kontrol listeleri</h2>
              <div className="space-y-1.5">
                {denetim.sablonlar.map((s) => {
                  const sab = st.sablonlar.find((x) => x.id === s.sablonId)
                  return (
                    <div key={s.sablonId} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                      <span className="font-medium">{sab?.ad ?? s.sablonId}</span>
                      <span className="text-xs text-muted-foreground">
                        v{s.surum} sürümü snapshot'landı{sab && sab.surum !== s.surum ? ` — güncel v${sab.surum}` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sağ panel — meta */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 text-sm">
              <h2 className="mb-3 text-sm font-medium">Denetim bilgileri</h2>
              <dl className="space-y-2.5">
                <Satir t="Denetim türü" v={denetim.turAd} />
                <Satir t="Planlanan" v={`${formatUzun(denetim.planlananTarih)}${denetim.planlananSaat ? ` · ${denetim.planlananSaat}` : ''}`} />
                {denetim.gerceklesmeBaslangic && <Satir t="Başlangıç" v={formatUzun(denetim.gerceklesmeBaslangic)} />}
                {denetim.gerceklesmeBitis && <Satir t="Bitiş" v={formatUzun(denetim.gerceklesmeBitis)} />}
                {denetim.kapsam && <Satir t="Kapsam" v={denetim.kapsam} />}
                {denetim.aciklama && <Satir t="Açıklama" v={denetim.aciklama} />}
                {denetim.hazirlikNotlari && <Satir t="Hazırlık notları" v={denetim.hazirlikNotlari} />}
              </dl>
            </div>
            <div className="rounded-xl border bg-card p-4 text-sm">
              <h2 className="mb-3 text-sm font-medium">Denetim ekibi</h2>
              <div className="space-y-2">
                {denetim.katilimcilar.map((k, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium">{k.ad}</span>
                    <span className="text-xs text-muted-foreground">{k.rol}</span>
                  </div>
                ))}
              </div>
            </div>
            {acikBulgu.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-red-700 dark:text-red-400">
                  <FileWarningIcon className="size-4" /> Açık uygunsuzluklar
                </h2>
                <div className="space-y-2">
                  {acikBulgu.slice(0, 4).map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">{b.baslik}</span>
                      <span className={cn('shrink-0 rounded px-1.5 text-xs font-medium', onemRenk[b.onem])}>{b.onem}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="xs" className="mt-3 w-full" onClick={() => setSekme('uygunsuzluk')}>Tümünü gör</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------- Kontrol listesi ------------------------- */}
      {sekme === 'kontrol' && (
        <KontrolSekmesi denetim={denetim} saltOku={!duzenleIzni || denetim.durum === 'Tamamlandı' || denetim.durum === 'İptal Edildi'} onLightbox={setLightbox} onBulgu={(maddeId) => setBulguForm({ maddeId })} st={st} kullanici={kullanici} />
      )}

      {/* ----------------------------- Uygunsuzluklar --------------------------- */}
      {sekme === 'uygunsuzluk' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{bulgular.length} uygunsuzluk · {acikBulgu.length} açık</p>
            {duzenleIzni && denetim.durum !== 'İptal Edildi' && (
              <Button size="sm" onClick={() => setBulguForm({})}><PlusIcon /> Uygunsuzluk Ekle</Button>
            )}
          </div>
          {bulgular.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-14">
              <CheckCircle2Icon className="size-8 text-emerald-500/60" />
              <p className="text-sm text-muted-foreground">Bu denetimde uygunsuzluk kaydedilmedi.</p>
            </div>
          )}
          {bulgular.map((b) => {
            const madde = denetim.maddeler.find((m) => m.id === b.maddeId)
            const aksiyon = b.aksiyonId ? aksiyonlar.find((a) => a.id === b.aksiyonId) : undefined
            const gecikti = b.hedefTarih && b.hedefTarih < TODAY && b.durum !== 'Kapatıldı' && b.durum !== 'İptal Edildi'
            return (
              <div key={b.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', onemRenk[b.onem])}>{b.onem}</span>
                      <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', bulguDurumRenk[b.durum])}>{b.durum}</span>
                      {gecikti && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">{gunFarki(b.hedefTarih!, TODAY)} gün gecikti</span>}
                    </div>
                    <h3 className="mt-1.5 font-medium">{b.baslik}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{b.aciklama}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {b.bolum && <span className="flex items-center gap-1"><MapPinIcon className="size-3" /> {b.bolum}</span>}
                      <span>Tespit: {formatKisa(b.tespitTarihi)}</span>
                      {b.sorumluAd && <span>Sorumlu: {b.sorumluAd}</span>}
                      {b.hedefTarih && <span>Hedef: {formatKisa(b.hedefTarih)}</span>}
                      {madde && <span className="truncate">Madde: {madde.soru}</span>}
                    </div>
                    {b.onerilenFaaliyet && <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">Önerilen faaliyet: </span>{b.onerilenFaaliyet}</p>}
                    {b.kapatmaNotu && <p className="mt-2 rounded-lg bg-emerald-500/5 px-3 py-2 text-xs"><span className="font-medium">Kapatma notu: </span>{b.kapatmaNotu} <span className="text-muted-foreground">— {b.kapatan}, {b.kapatmaTarihi ? formatKisa(b.kapatmaTarihi) : ''}</span></p>}
                    {b.ekler.filter((e) => e.tur === 'fotograf' && e.dataUrl).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {b.ekler.filter((e) => e.tur === 'fotograf' && e.dataUrl).map((e) => (
                          <button key={e.id} type="button" onClick={() => setLightbox({ url: e.dataUrl!, ad: e.ad })} className="size-16 overflow-hidden rounded-lg border transition-transform hover:scale-[1.03]">
                            <img src={e.dataUrl} alt={e.ad} className="size-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {aksiyon ? (
                      <Link to="/panel/aksiyonlar" className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
                        <Link2Icon className="size-3.5" /> {aksiyon.id}
                        <span className={cn('rounded px-1.5 py-0.5 text-[11px]', aksiyonDurumRenk[aksiyon.durum])}>{aksiyon.durum}</span>
                      </Link>
                    ) : b.durum === 'Açık' || b.durum === 'Kontrol Bekliyor' ? (
                      duzenleIzni && <Button variant="outline" size="xs" onClick={() => aksiyonDialogAc(b)}>Aksiyona Dönüştür</Button>
                    ) : null}
                    {(b.durum === 'Aksiyonda' || b.durum === 'Kontrol Bekliyor') && duzenleIzni && (
                      <Button variant="outline" size="xs" onClick={() => setKapatForm(b)}>Bulguyu Kapat</Button>
                    )}
                    {b.durum === 'Kapatıldı' && duzenleIzni && (
                      <Button variant="ghost" size="xs" onClick={() => { st.bulguYenidenAc(b.id, kullanici); toast.info('Bulgu yeniden açıldı') }}>Yeniden Aç</Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ------------------------------ Aksiyonlar ----------------------------- */}
      {sekme === 'aksiyonlar' && (
        <div className="space-y-2">
          {denAksiyonlar.length === 0 && <p className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">Bu denetimden aksiyon oluşturulmadı — uygunsuzluklar sekmesinden dönüştürebilirsiniz.</p>}
          {denAksiyonlar.map((a) => {
            const bulgu = bulgular.find((b) => b.aksiyonId === a.id)
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3">
                <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', oncelikRenk[a.oncelik])}>{a.oncelik}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.baslik}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.id} · {a.sorumluAd} · hedef {formatKisa(a.hedefTarih)}
                    {bulgu ? ` · bulgu: ${bulgu.baslik}` : ''}
                  </p>
                </div>
                <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', aksiyonDurumRenk[a.durum])}>{a.durum}</span>
                {aksiyonGecikmis(a) && <span className="text-xs font-medium text-red-600 dark:text-red-400">{gunFarki(a.hedefTarih, TODAY)}g gecikti</span>}
              </div>
            )
          })}
          {denAksiyonlar.length > 0 && (
            <p className="pt-1 text-center text-xs text-muted-foreground">Aksiyonlar merkezi modülde yönetilir — <Link to="/panel/aksiyonlar" className="font-medium text-amber-600 hover:underline dark:text-amber-400">Aksiyonlar'a git →</Link></p>
          )}
        </div>
      )}

      {/* ------------------------------ Dokümanlar ----------------------------- */}
      {sekme === 'dokumanlar' && (
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <h2 className="text-sm font-medium">Denetim dokümanları</h2>
            {aktarIzni && <Button variant="outline" size="xs" onClick={pdf} disabled={pdfCalisiyor}><FileDownIcon /> Yeni rapor üret</Button>}
          </div>
          {denetim.belgeler.length === 0 && denetim.maddeler.every((m) => m.fotograflar.length === 0) && (
            <p className="py-12 text-center text-sm text-muted-foreground">Henüz doküman yok. PDF raporu üretildiğinde burada listelenir.</p>
          )}
          <div className="divide-y">
            {denetim.belgeler.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <FileDownIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.ad}</p>
                  <p className="text-xs text-muted-foreground">{b.tur === 'rapor' ? 'Denetim raporu' : b.tur} · v{b.surum} · {formatKisa(b.olusturma)} · {b.olusturan}</p>
                </div>
                {b.tur === 'rapor' && (
                  <Button variant="outline" size="xs" onClick={pdf} disabled={pdfCalisiyor} title="Raporu mevcut denetim verisiyle yeniden üretip indirir">
                    <FileDownIcon /> İndir
                  </Button>
                )}
              </div>
            ))}
            {denetim.maddeler.flatMap((m) => m.fotograflar).map((e) => (
              <button key={e.id} type="button" onClick={() => e.dataUrl && setLightbox({ url: e.dataUrl, ad: e.ad })} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
                <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.ad}</p>
                  <p className="text-xs text-muted-foreground">Fotoğraf · {Math.round(e.boyut / 1024)} KB · {formatKisa(e.tarih)} · {e.ekleyen}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------- Geçmiş ------------------------------ */}
      {sekme === 'gecmis' && (
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-2.5">
            <HistoryIcon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">İşlem geçmişi</h2>
          </div>
          <div className="divide-y">
            {gecmis.map((g, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{g.islem}{g.not ? <span className="text-muted-foreground"> — {g.not}</span> : null}</p>
                  <p className="text-xs text-muted-foreground">{g.kullanici} · {formatUzun(g.tarih)}</p>
                </div>
              </div>
            ))}
            {gecmis.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Kayıtlı işlem yok.</p>}
          </div>
        </div>
      )}

      {/* --------------------------- Bulgu oluşturma --------------------------- */}
      {bulguForm && (
        <BulguDialog
          madde={denetim.maddeler.find((m) => m.id === bulguForm.maddeId)}
          sorumluAday={sorumluAday}
          tehlikeler={tehlikeler.filter((t) => !t.silindi)}
          onKapat={() => setBulguForm(null)}
          onKaydet={(g) => {
            const yeni = st.bulguEkle({ ...g, denetimId: denetim.id, firmaId: denetim.firmaId, tespitTarihi: TODAY })
            setBulguForm(null)
            toast.success('Uygunsuzluk kaydedildi', { description: `${yeni.baslik} — ${yeni.onem}` })
          }}
        />
      )}

      {/* --------------------------- Bulgu kapatma ----------------------------- */}
      {kapatForm && (
        <Dialog.Root open onOpenChange={(a) => !a && setKapatForm(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-popover p-5 shadow-2xl">
              <Dialog.Title className="text-base font-semibold">Bulguyu kapat</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                “{kapatForm.baslik}” kapatma notu ve kontrol bilgisi girin.
              </Dialog.Description>
              <textarea
                value={kapatNotu}
                onChange={(e) => setKapatNotu(e.target.value)}
                placeholder="Kontrol sonucu / kanıt açıklaması…"
                rows={3}
                autoFocus
                className="mt-3 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setKapatForm(null)}>Vazgeç</Button>
                <Button
                  size="sm"
                  disabled={!kapatNotu.trim()}
                  onClick={() => {
                    st.bulguKapat(kapatForm.id, kapatNotu.trim(), kullanici)
                    toast.success('Uygunsuzluk kapatıldı')
                    setKapatForm(null)
                    setKapatNotu('')
                  }}
                >
                  <CheckCircle2Icon /> Kapat
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* ------------------------- Bulgu → aksiyon ---------------------------- */}
      {aksiyonForm && (
        <Dialog.Root open onOpenChange={(a) => !a && setAksiyonForm(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-popover p-5 shadow-2xl">
              <Dialog.Title className="text-base font-semibold">Düzeltici faaliyet oluştur</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Bulgu merkezi Aksiyonlar modülüne bağlanır; denetim ve bulgu referansı otomatik eklenir.
              </Dialog.Description>
              <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                <p className="text-sm font-medium">{aksiyonForm.baslik}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{aksiyonForm.aciklama}</p>
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Sorumlu kişi</label>
                  <select
                    value={aksSorumlu}
                    onChange={(e) => setAksSorumlu(e.target.value)}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  >
                    <option value="">Sorumlu uzman ({denetim.uzmanAd})</option>
                    {sorumluAday.map((s) => (
                      <option key={s.id} value={s.id}>{s.ad} — {s.etiket}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Termin tarihi</label>
                    <input
                      type="date"
                      value={aksHedef}
                      onChange={(e) => setAksHedef(e.target.value)}
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Öncelik</label>
                    <select
                      value={aksOncelik}
                      onChange={(e) => setAksOncelik(e.target.value as Onem)}
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                    >
                      {ONEMLER.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAksiyonForm(null)}>Vazgeç</Button>
                <Button size="sm" disabled={!aksHedef} onClick={aksiyonaCevir}>
                  <CheckCircle2Icon /> Aksiyonu Oluştur
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* ------------------------------ İptal --------------------------------- */}
      {iptalAcik && (
        <Dialog.Root open onOpenChange={(a) => !a && setIptalAcik(false)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-popover p-5 shadow-2xl">
              <Dialog.Title className="text-base font-semibold">Denetimi iptal et</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Denetim kaydı silinmez; geçmişiyle birlikte “İptal Edildi” olarak arşivlenir.
              </Dialog.Description>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIptalAcik(false)}>Vazgeç</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    st.denetimIptal(denetim.id, kullanici)
                    toast.info('Denetim iptal edildi')
                    setIptalAcik(false)
                  }}
                >
                  <BanIcon /> İptal Et
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* ------------------------------ Lightbox ------------------------------ */}
      {lightbox && (
        <Dialog.Root open onOpenChange={(a) => !a && setLightbox(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/85" />
            <Dialog.Popup className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6" onClick={() => setLightbox(null)}>
              <img src={lightbox.url} alt={lightbox.ad} className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
              <p className="mt-3 text-sm text-zinc-300">{lightbox.ad}</p>
              <Dialog.Close className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Kapat">
                <XIcon className="size-5" />
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  )

  function aksiyonDialogAc(b: DenetimBulgu) {
    setAksiyonForm(b)
    setAksSorumlu(b.sorumluId ?? '')
    setAksHedef(b.hedefTarih ?? TODAY)
    setAksOncelik(b.onem)
  }

  function aksiyonaCevir() {
    const b = aksiyonForm!
    const d = denetim!
    const sorumlu = sorumluAday.find((s) => s.id === aksSorumlu)
    const aks = useRiskStore.getState().aksiyonEkle(
      {
        kaynak: { tur: 'denetim', denetimId: d.id, denetimNo: d.no, bulguId: b.id },
        tehlikeId: b.riskTehlikeId,
        firmaId: d.firmaId,
        firmaAd: d.firmaAd,
        baslik: b.baslik,
        aciklama: `${b.aciklama}${b.onerilenFaaliyet ? `\n\nÖnerilen faaliyet: ${b.onerilenFaaliyet}` : ''}\n\nKaynak: ${d.no} denetim bulgusu (${d.baslik})`,
        sorumluId: sorumlu?.id ?? '',
        sorumluAd: sorumlu?.ad ?? d.uzmanAd,
        oncelik: aksOncelik,
        baslangicTarihi: TODAY,
        hedefTarih: aksHedef,
        olusturan: kullanici,
      },
      kullanici,
    )
    st.bulguAksiyonBagla(b.id, aks.id, kullanici)
    setAksiyonForm(null)
    toast.success(`Aksiyon oluşturuldu: ${aks.id}`, { description: 'Merkezi Aksiyonlar modülünde takip edilir.' })
  }
}

/* ----------------------------- Yardımcı parçalar ---------------------------- */

function Satir({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted-foreground">{t}</dt>
      <dd className="min-w-0 text-right text-sm">{v}</dd>
    </div>
  )
}

function KontrolSekmesi({
  denetim,
  saltOku,
  onLightbox,
  onBulgu,
  st,
  kullanici,
}: {
  denetim: ReturnType<typeof useDenetimlerStore.getState>['denetimler'][number]
  saltOku: boolean
  onLightbox: (v: { url: string; ad: string }) => void
  onBulgu: (maddeId: string) => void
  st: ReturnType<typeof useDenetimlerStore.getState>
  kullanici: string
}) {
  const kategoriler = [...new Set(denetim.maddeler.map((m) => m.kategoriAd))]
  const [kat, setKat] = useState<string>('Tümü')
  const fileRef = useRef<HTMLInputElement>(null)
  const [fotoMadde, setFotoMadde] = useState<string | null>(null)
  const nav = useNavigate()

  const yanitla = (m: DenetimMadde, sonuc: MaddeSonuc) => {
    st.maddeYanitla(denetim.id, m.id, { sonuc: m.sonuc === sonuc ? undefined : sonuc })
    if (sonuc === 'Uygunsuz' && m.aksiyonKurali && m.sonuc !== 'Uygunsuz') onBulgu(m.id)
  }
  const liste = denetim.maddeler.filter((m) => kat === 'Tümü' || m.kategoriAd === kat)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CipGrup secenekler={['Tümü', ...kategoriler] as const} value={kat} onChange={setKat} />
        {!saltOku && denetim.durum === 'Devam Ediyor' && (
          <Button size="sm" onClick={() => nav(`/panel/denetimler/${denetim.id}/saha`)}><ClipboardCheckIcon /> Saha ekranına geç</Button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f || !fotoMadde) return
          const foto = await fotoIndir(f)
          st.maddeFotoEkle(denetim.id, fotoMadde, { ...foto, tur: 'fotograf', ekleyen: kullanici })
          toast.success('Fotoğraf eklendi')
          e.target.value = ''
        }}
      />
      {kategoriler.filter((k) => kat === 'Tümü' || k === kat).map((k) => (
        <div key={k} className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <h2 className="text-sm font-medium">{k}</h2>
            <span className="text-xs text-muted-foreground">
              {liste.filter((m) => m.kategoriAd === k && m.sonuc).length}/{liste.filter((m) => m.kategoriAd === k).length}
            </span>
          </div>
          <div className="divide-y">
            {liste.filter((m) => m.kategoriAd === k).map((m) => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {m.soru}
                      {m.zorunlu && <span className="ml-1.5 text-red-500" title="Zorunlu madde">*</span>}
                    </p>
                    {m.aciklama && <p className="mt-0.5 text-xs text-muted-foreground">{m.aciklama}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className={cn('rounded px-1.5 py-0.5 font-medium', onemRenk[m.onem])}>{m.onem}</span>
                      {m.mevzuatRef && <span>{m.mevzuatRef}</span>}
                      {m.fotografGerekli && <span className="flex items-center gap-0.5"><CameraIcon className="size-3" /> fotoğraf gerekli</span>}
                      {m.bolum && <span className="flex items-center gap-0.5"><MapPinIcon className="size-3" /> {m.bolum}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex gap-1">
                      {(['Uygun', 'Uygunsuz', 'Uygulanamaz'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={saltOku}
                          onClick={() => yanitla(m, s)}
                          className={cn(
                            'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                            m.sonuc === s ? 'border-transparent ' + sonucRenk[s] : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                            saltOku && 'cursor-default opacity-70',
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {!saltOku && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setFotoMadde(m.id); fileRef.current?.click() }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <CameraIcon className="size-3.5" /> Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const not = prompt('Not / gözlem', m.not ?? '')
                            if (not !== null) st.maddeYanitla(denetim.id, m.id, { not: not || undefined })
                          }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <PaperclipIcon className="size-3.5" /> Not
                        </button>
                        {m.sonuc === 'Uygunsuz' && (
                          <button type="button" onClick={() => onBulgu(m.id)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400">
                            <FileWarningIcon className="size-3.5" /> Bulgu
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {m.not && <p className="mt-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">{m.not}</p>}
                {m.fotograflar.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.fotograflar.map((f) =>
                      f.dataUrl ? (
                        <button key={f.id} type="button" onClick={() => onLightbox({ url: f.dataUrl!, ad: f.ad })} className="size-16 overflow-hidden rounded-lg border transition-transform hover:scale-[1.03]">
                          <img src={f.dataUrl} alt={f.ad} className="size-full object-cover" />
                        </button>
                      ) : (
                        <span key={f.id} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-muted-foreground"><ImageIcon className="size-3.5" /> {f.ad}</span>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ----------------------------- Bulgu diyaloğu ------------------------------ */

function BulguDialog({
  madde,
  sorumluAday,
  tehlikeler,
  onKapat,
  onKaydet,
}: {
  madde?: DenetimMadde
  sorumluAday: { id: string; ad: string; etiket: string }[]
  tehlikeler: { id: string; kaynak: string; bolum: string; seviye: string }[]
  onKapat: () => void
  onKaydet: (g: Omit<DenetimBulgu, 'id' | 'denetimId' | 'firmaId' | 'durum' | 'ekler' | 'tespitTarihi'>) => void
}) {
  const [baslik, setBaslik] = useState(madde ? madde.soru.replace(/ mü\??$/, '').replace(/ mi\??$/, '') + ' sağlanmıyor' : '')
  const [aciklama, setAciklama] = useState(madde?.not ?? '')
  const [onem, setOnem] = useState<Onem>(madde?.onem ?? 'Orta')
  const [bolum, setBolum] = useState(madde?.bolum ?? '')
  const [oneri, setOneri] = useState('')
  const [sorumluId, setSorumluId] = useState('')
  const [hedef, setHedef] = useState('')
  const [riskId, setRiskId] = useState('')

  const sorAd = sorumluAday.find((s) => s.id === sorumluId)?.ad

  return (
    <Dialog.Root open onOpenChange={(a) => !a && onKapat()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-popover shadow-2xl">
          <div className="border-b px-5 py-4">
            <Dialog.Title className="text-base font-semibold">Uygunsuzluk kaydı</Dialog.Title>
            <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
              {madde ? `Madde: ${madde.soru}` : 'Denetime bağlı yeni uygunsuzluk kaydı'}
            </Dialog.Description>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Başlık *</label>
              <input value={baslik} onChange={(e) => setBaslik(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Açıklama *</label>
              <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Önem derecesi</label>
                <select value={onem} onChange={(e) => setOnem(e.target.value as Onem)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30">
                  {ONEMLER.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Hedef tarih</label>
                <input type="date" value={hedef} onChange={(e) => setHedef(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Bölüm / konum</label>
                <input value={bolum} onChange={(e) => setBolum(e.target.value)} placeholder="ör. Depo A koridor" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Sorumlu kişi</label>
                <select value={sorumluId} onChange={(e) => setSorumluId(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30">
                  <option value="">Seçin…</option>
                  {sorumluAday.map((s) => <option key={s.id} value={s.id}>{s.ad} ({s.etiket})</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Önerilen düzeltici faaliyet</label>
              <textarea value={oneri} onChange={(e) => setOneri(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">İlişkili risk kaydı (isteğe bağlı)</label>
              <select value={riskId} onChange={(e) => setRiskId(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30">
                <option value="">Yok</option>
                {tehlikeler.map((t) => <option key={t.id} value={t.id}>{t.id} — {t.kaynak} ({t.bolum})</option>)}
              </select>
              <p className="mt-1 text-[11px] text-muted-foreground">Risk yoksa yetkili kullanıcı Risk Değerlendirme modülünden yeni kayıt açabilir; kayıtlar otomatik çoğaltılmaz.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t px-5 py-3.5">
            <Button variant="ghost" size="sm" onClick={onKapat}>Vazgeç</Button>
            <Button
              size="sm"
              disabled={!baslik.trim() || !aciklama.trim()}
              onClick={() =>
                onKaydet({
                  baslik: baslik.trim(),
                  aciklama: aciklama.trim(),
                  onem,
                  bolum: bolum.trim() || undefined,
                  onerilenFaaliyet: oneri.trim() || undefined,
                  sorumluId: sorumluId || undefined,
                  sorumluAd: sorAd,
                  hedefTarih: hedef || undefined,
                  maddeId: madde?.id,
                  riskTehlikeId: riskId || undefined,
                })
              }
            >
              Kaydet
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
