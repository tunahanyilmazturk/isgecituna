import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardListIcon,
  FileTextIcon,
  FileVideoIcon,
  ImageIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  PresentationIcon,
  Settings2Icon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Alan, Sec } from '@/components/form-bits'
import { TODAY } from '@/data/dashboard'
import {
  soruBankasiSeed,
  turLabel,
  varsayilanSinavAyarlari,
  varsayilanTamamlama,
  type Bolum,
  type Egitim,
  type Icerik,
  type IcerikTur,
  type Sinav,
  type SinavSoru,
  type SinavSoruTur,
  type TamamlamaAyarlari,
} from '@/data/egitimler'
import { cn } from '@/lib/utils'
import { useIzin } from '@/lib/izin'
import { useAuthStore } from '@/stores/auth-store'
import { egitimDosyasiKaydet } from '@/lib/egitim-assets'
import { hariciVideoKaynakCoz } from '@/lib/egitim-video'
import { aktifSurum, useEgitimlerStore } from '@/stores/egitimler-store'

const TURLER: { id: IcerikTur; ikon: typeof FileVideoIcon }[] = [
  { id: 'video', ikon: FileVideoIcon },
  { id: 'harici-video', ikon: LinkIcon },
  { id: 'pdf', ikon: FileTextIcon },
  { id: 'slayt', ikon: PresentationIcon },
  { id: 'gorsel', ikon: ImageIcon },
  { id: 'metin', ikon: BookOpenIcon },
]

const KABUL: Record<IcerikTur, string> = {
  video: '.mp4,.webm,.mov',
  'harici-video': '',
  pdf: '.pdf',
  slayt: '.ppt,.pptx,.pdf',
  gorsel: '.png,.jpg,.jpeg,.webp',
  metin: '',
}

const turIkon = (t: IcerikTur) => TURLER.find((x) => x.id === t)?.ikon ?? FileTextIcon

let idSeq = 0
const nid = (p: string) => `${p}-${Date.now().toString(36)}${(idSeq++).toString(36)}`

type Sekme = 'bilgiler' | 'icerikler' | 'onSinav' | 'sinav' | 'tamamlama'

interface Yukleme {
  id: string
  ad: string
  boyut: string
  yuzde: number
  durum: 'yukleniyor' | 'tamam' | 'hata'
  url?: string
  kalici?: boolean
}

export default function EgitimEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const olusturIzni = useIzin('egitimler.olustur')
  const duzenleIzni = useIzin('egitimler.duzenle')
  const yayinlaIzni = useIzin('egitimler.yayinla')
  const icerikIzni = useIzin('egitimler.icerik-yonet')
  const sinavIzni = useIzin('egitimler.sinav-yonet')
  const { egitimler, egitimEkle, egitimGuncelle, surumKaydet, yeniSurum, yayinla } =
    useEgitimlerStore()
  const mevcut = id ? egitimler.find((e) => e.id === id) : undefined
  const mevcutSurum = mevcut ? aktifSurum(mevcut) : undefined

  const [sekme, setSekme] = useState<Sekme>('bilgiler')
  const [baslik, setBaslik] = useState(mevcut?.baslik ?? '')
  const [aciklama, setAciklama] = useState(mevcut?.aciklama ?? '')
  const [kategori, setKategori] = useState(mevcut?.kategori ?? 'Temel İSG')
  const [dil, setDil] = useState(mevcut?.dil ?? 'Türkçe')
  const [sure, setSure] = useState(mevcut?.sureDakika ?? 60)
  const [hedefler, setHedefler] = useState((mevcut?.hedefler ?? []).join('\n'))
  const [etiketler, setEtiketler] = useState((mevcut?.etiketler ?? []).join(', '))
  const [kapakTon, setKapakTon] = useState(mevcut?.kapakTon ?? 'from-amber-500 to-orange-600')
  const [bolumler, setBolumler] = useState<Bolum[]>(
    () => mevcutSurum?.bolumler.map((b) => ({ ...b, icerikler: b.icerikler.map((i) => ({ ...i })) })) ?? [
      { id: nid('B'), baslik: 'Bölüm 1', icerikler: [] },
    ],
  )
  const [sinav, setSinav] = useState<Sinav | undefined>(() =>
    mevcutSurum?.sinav
      ? { ...mevcutSurum.sinav, sorular: mevcutSurum.sinav.sorular.map((s) => ({ ...s })), ayarlar: { ...mevcutSurum.sinav.ayarlar } }
      : undefined,
  )
  const [onSinav, setOnSinav] = useState<Sinav | undefined>(() =>
    mevcutSurum?.onSinav
      ? { ...mevcutSurum.onSinav, sorular: mevcutSurum.onSinav.sorular.map((s) => ({ ...s })), ayarlar: { ...mevcutSurum.onSinav.ayarlar } }
      : undefined,
  )
  const [tamamlama, setTamamlama] = useState<TamamlamaAyarlari>(
    () => ({ ...(mevcutSurum?.tamamlama ?? varsayilanTamamlama()) }),
  )
  const [icerikDrawer, setIcerikDrawer] = useState<{
    bolumId: string
    duzenle?: Icerik
  } | null>(null)
  const [bolumAcik, setBolumAcik] = useState<Record<string, boolean>>({})

  const yayindaMi = mevcut?.durum === 'Yayında'
  const toplamIcerik = bolumler.reduce((toplam, bolum) => toplam + bolum.icerikler.length, 0)
  const toplamSoru = sinav?.sorular.length ?? 0
  const toplamOnSoru = onSinav?.sorular.length ?? 0
  const sinavSorunlu = tamamlama.sinavZorunlu && toplamSoru === 0

  /* ------------------------------ Bölüm işlemleri ----------------------------- */

  const bolumGuncelle = (bid: string, patch: Partial<Bolum>) =>
    setBolumler((bs) => bs.map((b) => (b.id === bid ? { ...b, ...patch } : b)))

  const bolumTasi = (ix: number, dir: -1 | 1) =>
    setBolumler((bs) => {
      const j = ix + dir
      if (j < 0 || j >= bs.length) return bs
      const c = [...bs]
      ;[c[ix], c[j]] = [c[j], c[ix]]
      return c
    })

  const icerikKaydet = (bolumId: string, ic: Icerik) =>
    setBolumler((bs) =>
      bs.map((b) =>
        b.id !== bolumId
          ? b
          : {
              ...b,
              icerikler: b.icerikler.some((i) => i.id === ic.id)
                ? b.icerikler.map((i) => (i.id === ic.id ? ic : i))
                : [...b.icerikler, ic],
            },
      ),
    )

  const icerikSil = (bolumId: string, icId: string) =>
    setBolumler((bs) =>
      bs.map((b) =>
        b.id === bolumId ? { ...b, icerikler: b.icerikler.filter((i) => i.id !== icId) } : b,
      ),
    )

  const icerikTasi = (bolumId: string, ix: number, dir: -1 | 1) =>
    setBolumler((bs) =>
      bs.map((b) => {
        if (b.id !== bolumId) return b
        const j = ix + dir
        if (j < 0 || j >= b.icerikler.length) return b
        const c = [...b.icerikler]
        ;[c[ix], c[j]] = [c[j], c[ix]]
        return { ...b, icerikler: c }
      }),
    )

  /* --------------------------------- Kaydet --------------------------------- */

  const kaydet = (yayinlaSonra: boolean) => {
    if (!baslik.trim()) {
      toast.error('Eğitim başlığı zorunlu')
      setSekme('bilgiler')
      return
    }
    if (bolumler.length === 0 || bolumler.every((b) => b.icerikler.length === 0)) {
      toast.error('En az bir bölüm ve içerik ekleyin')
      setSekme('icerikler')
      return
    }
    if (yayinlaSonra && tamamlama.sinavZorunlu && !sinav?.sorular.length) {
      toast.error('Yayınlamak için zorunlu sınava en az bir soru ekleyin')
      setSekme('sinav')
      return
    }
    const meta = {
      baslik: baslik.trim(),
      aciklama: aciklama.trim(),
      kategori,
      dil,
      sureDakika: Number(sure) || 0,
      hedefler: hedefler.split('\n').map((h) => h.trim()).filter(Boolean),
      etiketler: etiketler.split(',').map((t) => t.trim()).filter(Boolean),
      kapakTon,
      guncelleme: TODAY,
    }

    if (!mevcut) {
      const yeniEgitim: Egitim = {
        id: nid('EGT'),
        ...meta,
        durum: yayinlaSonra ? 'Yayında' : 'Taslak',
        aktifSurumId: 'ES-YENI',
        surumler: [
          {
            id: 'ES-YENI',
            no: 1,
            bolumler,
            sinav,
            onSinav,
            tamamlama,
            durum: yayinlaSonra ? 'aktif' : 'taslak',
            not: 'İlk sürüm',
            tarih: TODAY,
          },
        ],
        olusturan: user?.name ?? user?.username ?? 'Bilinmeyen kullanıcı',
      }
      egitimEkle(yeniEgitim)
      toast.success(yayinlaSonra ? 'Eğitim yayınlandı' : 'Eğitim taslağı kaydedildi')
      navigate('/panel/egitimler')
      return
    }

    egitimGuncelle(mevcut.id, meta)
    const surumVerisi = {
      bolumler,
      sinav,
      onSinav,
      tamamlama,
      tarih: TODAY,
      not: yayindaMi ? 'Yeni sürüm — yayın öncesi değişiklik' : 'Taslak güncelleme',
    }
    if (yayindaMi) {
      yeniSurum(mevcut.id)
      const taze = useEgitimlerStore.getState().egitimler.find((e) => e.id === mevcut.id)
      const tazeSurum = taze && aktifSurum(taze)
      if (tazeSurum) surumKaydet(mevcut.id, { ...tazeSurum, ...surumVerisi })
      toast.success(`Değişiklikler yeni sürüme kaydedildi (v${(tazeSurum?.no ?? 1)})`)
    } else {
      surumKaydet(mevcut.id, { ...aktifSurum(mevcut), ...surumVerisi })
      toast.success('Eğitim güncellendi')
    }
    if (yayinlaSonra) {
      yayinla(mevcut.id)
      toast.success('Eğitim yayına alındı')
    }
    navigate('/panel/egitimler')
  }

  /* ---------------------------------- UI ----------------------------------- */

  const sekmeler: { id: Sekme; label: string; ikon: typeof PencilIcon }[] = [
    { id: 'bilgiler', label: 'Eğitim Bilgileri', ikon: PencilIcon },
    ...(icerikIzni ? [{ id: 'icerikler' as const, label: 'İçerikler', ikon: BookOpenIcon }] : []),
    ...(sinavIzni ? [{ id: 'onSinav' as const, label: 'Ön Sınav', ikon: ClipboardListIcon }] : []),
    ...(sinavIzni ? [{ id: 'sinav' as const, label: 'Sınav', ikon: ClipboardListIcon }] : []),
    { id: 'tamamlama', label: 'Tamamlama', ikon: Settings2Icon },
  ]

  if (mevcut ? !duzenleIzni : !olusturIzni) return <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">Bu eğitim işlemine yetkiniz yok.</div>

  return (
    <div className="flex h-full flex-col">
      {/* Üst bar */}
      <div className="sticky top-0 z-30 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/panel/egitimler')}>
            <ArrowLeftIcon /> <span className="hidden sm:inline">Eğitimler</span>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-semibold sm:text-base">
                {mevcut ? mevcut.baslik : 'Yeni Eğitim'}
              </h1>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', yayindaMi ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                {mevcut ? mevcut.durum : 'Yeni taslak'}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {mevcut ? `Sürüm v${mevcutSurum?.no ?? 1} · ${toplamIcerik} içerik · ${toplamOnSoru} ön sınav · ${toplamSoru} sınav sorusu` : 'Eğitimin bilgilerini, içeriklerini ve sınavını düzenleyin'}
            </p>
          </div>
          {yayindaMi && <span className="hidden rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 lg:inline-flex dark:text-amber-400">Kaydedilen değişiklikler yeni sürüm oluşturur</span>}
          <Button variant="outline" size="sm" onClick={() => kaydet(false)} className="h-9">Taslağı kaydet</Button>
          {yayinlaIzni && <Button size="sm" onClick={() => kaydet(true)} className="h-9"><CheckCircle2Icon /> Yayınla</Button>}
        </div>

        {/* Sekmeler */}
        <div className="flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {sekmeler.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSekme(s.id)}
              aria-current={sekme === s.id ? 'step' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                sekme === s.id ? 'bg-amber-500/12 text-amber-800 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <s.ikon className="size-4" /> {s.label}
              {s.id === 'icerikler' && <span className="rounded-full bg-background/70 px-1.5 text-[10px] tabular-nums">{toplamIcerik}</span>}
              {s.id === 'onSinav' && <span className="rounded-full bg-background/70 px-1.5 text-[10px] tabular-nums">{toplamOnSoru}</span>}
              {s.id === 'sinav' && <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', sinavSorunlu ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-background/70')}>{toplamSoru}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto max-w-6xl">
          {sekme === 'bilgiler' && (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-5 rounded-xl border bg-card p-4 sm:p-5">
              <div>
                <h2 className="text-sm font-semibold">Eğitimin temel bilgileri</h2>
                <p className="mt-1 text-xs text-muted-foreground">Katılımcıların eğitim kataloğunda göreceği bilgileri girin.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Alan label="Eğitim başlığı">
                  <input
                    value={baslik}
                    onChange={(e) => setBaslik(e.target.value)}
                    placeholder="örn. Temel İş Sağlığı ve Güvenliği Eğitimi"
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  />
                </Alan>
                <Alan label="Kategori">
                  <input
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    list="ktg"
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  />
                  <datalist id="ktg">
                    {['Temel İSG', 'Yangın', 'Yüksekte Çalışma', 'Kimyasal Güvenlik', 'İlk Yardım', 'Ergonomi'].map((k) => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                </Alan>
                <Alan label="Eğitim dili">
                  <Sec
                    value={dil}
                    onChange={setDil}
                    options={['Türkçe', 'İngilizce', 'Almanca']}
                  />
                </Alan>
                <Alan label="Tahmini süre (dakika)">
                  <input
                    type="number"
                    min={0}
                    value={sure}
                    onChange={(e) => setSure(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  />
                </Alan>
              </div>
              <Alan label="Kısa açıklama">
                <textarea
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  rows={3}
                  placeholder="Bu eğitim hangi konuları kapsıyor? Katılımcıya kısa bir özet verin."
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                />
              </Alan>
              <Alan label="Öğrenme hedefleri">
                <textarea
                  value={hedefler}
                  onChange={(e) => setHedefler(e.target.value)}
                  rows={3}
                  placeholder="Her satıra bir hedef yazın. Örn. Riskleri tanımlar."
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                />
              </Alan>
              <div className="grid gap-4 sm:grid-cols-2">
                <Alan label="Etiketler (virgülle ayırın)" className="sm:col-span-2">
                  <input
                    value={etiketler}
                    onChange={(e) => setEtiketler(e.target.value)}
                    placeholder="zorunlu, temel"
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  />
                </Alan>
              </div>
            </div>
            <aside className="space-y-4 xl:sticky xl:top-36">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className={cn('relative flex min-h-40 flex-col justify-end overflow-hidden bg-gradient-to-br p-4 text-white', kapakTon)}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="relative">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-200 uppercase">{kategori || 'Eğitim kategorisi'}</p>
                    <p className="mt-2 line-clamp-2 text-lg leading-tight font-semibold">{baslik || 'Eğitim başlığı'}</p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Katalog önizlemesi</span>
                    <span className="rounded-full bg-muted px-2 py-0.5">{dil}</span>
                  </div>
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{aciklama || 'Açıklama eklediğinizde burada katılımcıların göreceği kısa özet yer alır.'}</p>
                  <div className="flex items-center justify-between border-t pt-3 text-xs">
                    <span className="text-muted-foreground">Tahmini süre</span>
                    <span className="font-medium tabular-nums">{Number(sure) || 0} dk</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Kapak rengi</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Katalog kartında kullanılacak vurgu.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ['from-amber-500 to-orange-600', 'Amber'],
                    ['from-red-500 to-rose-600', 'Kırmızı'],
                    ['from-emerald-500 to-green-700', 'Yeşil'],
                    ['from-violet-500 to-purple-700', 'Mor'],
                    ['from-zinc-600 to-zinc-900', 'Antrasit'],
                  ].map(([ton, ad]) => (
                    <button
                      key={ton}
                      type="button"
                      title={ad}
                      aria-label={`${ad} kapak rengi`}
                      aria-pressed={kapakTon === ton}
                      onClick={() => setKapakTon(ton)}
                      className={cn('size-8 rounded-lg bg-gradient-to-br transition-all hover:scale-105', ton, kapakTon === ton && 'ring-2 ring-foreground ring-offset-2 ring-offset-background')}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Yayın kontrolü</h3>
                <ul className="mt-3 space-y-2.5 text-xs">
                  <li className="flex items-center gap-2"><CheckCircle2Icon className={cn('size-4', baslik.trim() ? 'text-emerald-500' : 'text-muted-foreground/40')} /><span className={baslik.trim() ? '' : 'text-muted-foreground'}>Eğitim başlığı</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2Icon className={cn('size-4', toplamIcerik ? 'text-emerald-500' : 'text-muted-foreground/40')} /><span className={toplamIcerik ? '' : 'text-muted-foreground'}>{toplamIcerik ? `${toplamIcerik} içerik eklendi` : 'Henüz içerik yok'}</span></li>
                  {onSinav && <li className="flex items-center gap-2"><CheckCircle2Icon className="size-4 text-emerald-500" /><span>{toplamOnSoru} ön sınav sorusu eklendi</span></li>}
                  {tamamlama.sinavZorunlu && <li className="flex items-center gap-2"><CheckCircle2Icon className={cn('size-4', toplamSoru ? 'text-emerald-500' : 'text-amber-500')} /><span className={toplamSoru ? '' : 'text-amber-700 dark:text-amber-300'}>{toplamSoru ? `${toplamSoru} sınav sorusu` : 'Zorunlu sınava soru ekleyin'}</span></li>}
                </ul>
              </div>
            </aside>
            </div>
          )}

          {sekme === 'icerikler' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Bölümleri ve içerikleri yönetin. Sıralamayı yukarı/aşağı düğmeleriyle değiştirin.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setBolumler((bs) => [...bs, { id: nid('B'), baslik: `Bölüm ${bs.length + 1}`, icerikler: [] }])
                  }
                >
                  <PlusIcon /> Bölüm ekle
                </Button>
              </div>
              {bolumler.map((b, bx) => (
                <div key={b.id} className="rounded-xl border bg-card">
                  <div className="flex items-center gap-2 border-b px-3.5 py-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-[10px] font-semibold tabular-nums text-amber-700 dark:text-amber-300">{String(bx + 1).padStart(2, '0')}</span>
                    <button type="button" aria-label={bolumAcik[b.id] === false ? 'Bölümü genişlet' : 'Bölümü daralt'} aria-expanded={bolumAcik[b.id] !== false} onClick={() => setBolumAcik((acik) => ({ ...acik, [b.id]: acik[b.id] === false }))} className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                      <ChevronDownIcon className={cn('size-4 transition-transform', bolumAcik[b.id] === false && '-rotate-90')} />
                    </button>
                    <input
                      value={b.baslik}
                      onChange={(e) => bolumGuncelle(b.id, { baslik: e.target.value })}
                      className="h-7 flex-1 rounded-md bg-transparent px-1.5 text-sm font-medium outline-none focus-visible:bg-muted/60"
                    />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {b.icerikler.length} içerik
                    </span>
                    <button type="button" aria-label="Yukarı" disabled={bx === 0} onClick={() => bolumTasi(bx, -1)} className="flex size-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30">
                      <ChevronUpIcon className="size-4" />
                    </button>
                    <button type="button" aria-label="Aşağı" disabled={bx === bolumler.length - 1} onClick={() => bolumTasi(bx, 1)} className="flex size-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30">
                      <ChevronDownIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Bölümü sil"
                      onClick={() => {
                        if (bolumler.length === 1) return toast.error('En az bir bölüm gerekli')
                        setBolumler((bs) => bs.filter((x) => x.id !== b.id))
                      }}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                  {bolumAcik[b.id] !== false && <div className="space-y-1.5 p-2.5">
                    {b.icerikler.map((ic, ix) => {
                      const I = turIkon(ic.tur)
                      return (
                        <div
                          key={ic.id}
                          className="flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/40 sm:px-2.5"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <I className="size-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ic.baslik || '(Adsız içerik)'}</p>
                            <p className="text-xs text-muted-foreground">
                              {turLabel[ic.tur]} · {ic.sureDakika} dk
                              {ic.dosya ? ` · ${ic.dosya.ad}` : ''}
                              {ic.zorunlu ? ' · zorunlu' : ' · isteğe bağlı'}
                            </p>
                          </div>
                          <button type="button" aria-label="Yukarı" disabled={ix === 0} onClick={() => icerikTasi(b.id, ix, -1)} className="flex size-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30">
                            <ChevronUpIcon className="size-3.5" />
                          </button>
                          <button type="button" aria-label="Aşağı" disabled={ix === b.icerikler.length - 1} onClick={() => icerikTasi(b.id, ix, 1)} className="flex size-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30">
                            <ChevronDownIcon className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => setIcerikDrawer({ bolumId: b.id, duzenle: ic })} className="flex size-6 items-center justify-center rounded-md hover:bg-muted" aria-label="Düzenle">
                            <PencilIcon className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => icerikSil(b.id, ic.id)} className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive" aria-label="Sil">
                            <Trash2Icon className="size-3.5" />
                          </button>
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => setIcerikDrawer({ bolumId: b.id })}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      <PlusIcon className="size-3.5" /> İçerik ekle
                    </button>
                  </div>}
                </div>
              ))}
            </div>
          )}

          {sekme === 'onSinav' && <SinavEditor sinav={onSinav} onChange={setOnSinav} tur="on" />}

          {sekme === 'sinav' && <SinavEditor sinav={sinav} onChange={setSinav} tur="son" />}

          {sekme === 'tamamlama' && (
            <div className="max-w-xl space-y-5">
              <div>
                <h3 className="text-sm font-semibold">Tamamlama Koşulları</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Katılımcının eğitimi tamamlanmış sayılması için gereken koşullar.
                </p>
              </div>
              <Alan label={`Video içeriklerinde minimum izleme: %${tamamlama.videoMinYuzde}`}>
                <input
                  type="range" min={50} max={100} step={5}
                  value={tamamlama.videoMinYuzde}
                  onChange={(e) => setTamamlama((t) => ({ ...t, videoMinYuzde: Number(e.target.value) }))}
                  className="w-full accent-amber-500"
                />
              </Alan>
              {(
                [
                  ['zorunluBolumlerTumu', 'Tüm zorunlu içerikler tamamlanmalı', 'Zorunlu işaretli her içerik bitirilmeden eğitim tamamlanmaz.'],
                  ['sinavZorunlu', 'Sınav zorunlu', 'Eğitim sonunda sınavı geçmek gerekir.'],
                  ['manuelOnay', 'Manuel onay gerekli', 'İçerik + sınav tamamlansa bile yönetici onayı beklenir.'],
                ] as const
              ).map(([k, t, d]) => (
                <label key={k} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors hover:bg-muted/40">
                  <Checkbox
                    checked={tamamlama[k]}
                    onCheckedChange={(v) => setTamamlama((x) => ({ ...x, [k]: !!v }))}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{t}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{d}</span>
                  </span>
                </label>
              ))}
              <div className="rounded-xl border border-dashed p-3.5 text-xs leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">Durum akışı</p>
                Başlamadı → Devam Ediyor → İçerikler Tamamlandı →
                {tamamlama.sinavZorunlu ? ' Sınav Bekleniyor → Sınav Başarılı →' : ''}
                {tamamlama.manuelOnay ? ' Onay Bekliyor →' : ''} Tamamlandı
              </div>
            </div>
          )}
        </div>
      </div>

      {/* İçerik drawer */}
      {icerikDrawer && (
        <IcerikDrawer
          duzenle={icerikDrawer.duzenle}
          onKapat={() => setIcerikDrawer(null)}
          onKaydet={(ic) => {
            icerikKaydet(icerikDrawer.bolumId, ic)
            setIcerikDrawer(null)
            toast.success(icerikDrawer.duzenle ? 'İçerik güncellendi' : 'İçerik eklendi')
          }}
        />
      )}
    </div>
  )
}

/* ============================ İçerik drawer ============================ */

function IcerikDrawer({
  duzenle,
  onKapat,
  onKaydet,
}: {
  duzenle?: Icerik
  onKapat: () => void
  onKaydet: (ic: Icerik) => void
}) {
  const [tur, setTur] = useState<IcerikTur>(duzenle?.tur ?? 'video')
  const [baslik, setBaslik] = useState(duzenle?.baslik ?? '')
  const [aciklama, setAciklama] = useState(duzenle?.aciklama ?? '')
  const [zorunlu, setZorunlu] = useState(duzenle?.zorunlu ?? true)
  const [sure, setSure] = useState(duzenle?.sureDakika ?? 8)
  const [url, setUrl] = useState(duzenle?.url ?? '')
  const [metin, setMetin] = useState(duzenle?.metinIcerik ?? '')
  const [yukleme, setYukleme] = useState<Yukleme | null>(
    duzenle?.dosya
      ? { id: 'm', ad: duzenle.dosya.ad, boyut: duzenle.dosya.boyut, yuzde: 100, durum: 'tamam', url: duzenle.dosya.url }
      : null,
  )
  const [surukle, setSurukle] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const dosyaGerekli = !['metin', 'harici-video'].includes(tur)

  const dosyaSec = (f: File) => {
    if (timer.current) clearInterval(timer.current)
    const boyut = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.ceil(f.size / 1024)} KB`
    const id = nid('Y')
    const y: Yukleme = { id, ad: f.name, boyut, yuzde: 0, durum: 'yukleniyor' }
    setYukleme(y)
    void egitimDosyasiKaydet(f).then((url) => {
      setYukleme((c) => c?.id !== id ? c : { ...c, url, kalici: true, durum: c.yuzde >= 100 ? 'tamam' : 'yukleniyor' })
    }).catch(() => {
      setYukleme((c) => c?.id !== id ? c : { ...c, durum: 'hata' })
      toast.error('Dosya kalıcı olarak kaydedilemedi')
    })
    // Gerçek upload backend'de; frontend'de yükleme akışını simüle eder (hata/tekrar durumları dahil)
    timer.current = setInterval(() => {
      setYukleme((c) => {
        if (!c || c.durum !== 'yukleniyor') return c
        const yuzde = Math.min(100, c.yuzde + 8 + Math.floor(Math.random() * 10))
        if (yuzde >= 100) {
          if (timer.current) clearInterval(timer.current)
          return { ...c, yuzde: 100, durum: c.kalici ? 'tamam' : 'yukleniyor' }
        }
        return { ...c, yuzde }
      })
    }, 120)
  }

  const kaydet = () => {
    if (!baslik.trim()) return toast.error('İçerik başlığı zorunlu')
    if (dosyaGerekli && yukleme?.durum !== 'tamam') return toast.error('Dosya yüklenmeli')
    if (tur === 'harici-video' && !hariciVideoKaynakCoz(url)) return toast.error('YouTube, Vimeo veya MP4/WebM/HLS video bağlantısı girin')
    if (tur === 'metin' && !metin.trim()) return toast.error('Metin içeriği zorunlu')

    const ic: Icerik = {
      id: duzenle?.id ?? nid('IC'),
      tur,
      baslik: baslik.trim(),
      aciklama: aciklama.trim(),
      zorunlu,
      sureDakika: Number(sure) || 0,
      url: tur === 'harici-video' ? url.trim() : undefined,
      metinIcerik: tur === 'metin' ? metin : undefined,
    }
    if (yukleme?.durum === 'tamam') {
      ic.dosya = { ad: yukleme.ad, boyut: yukleme.boyut, url: yukleme.url }
      // pdf/slayt için gerçek sayfa ayrıştırma backend'de; demo'da sanal sayfalar üretilir
      if (tur === 'pdf') {
        const n = 4
        ic.dosya.sayfaSayisi = n
        ic.sayfalar = Array.from({ length: n }, (_, i) => ({
          baslik: `${ic.baslik} — Sayfa ${i + 1}`,
          metin: `${yukleme.ad} dosyasının ${i + 1}. sayfası. Üretimde PDF sayfaları sunucuda görüntüye dönüştürülüp burada gösterilir.`,
        }))
      }
      if (tur === 'slayt') {
        const n = 4
        ic.dosya.sayfaSayisi = n
        ic.slaytlar = Array.from({ length: n }, (_, i) => ({
          baslik: `${ic.baslik} — Slayt ${i + 1}`,
          notlar: [`${yukleme.ad} dosyasından üretilen önizleme slaytı`, 'Üretimde slayt görselleri sunucuda oluşturulur.'],
        }))
      }
    }
    onKaydet(ic)
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onKapat()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetTitle className="text-base">
          {duzenle ? 'İçeriği Düzenle' : 'İçerik Ekle'}
        </SheetTitle>

        <div className="mt-5 space-y-4">
          <Alan label="İçerik türü">
            <div className="grid grid-cols-3 gap-1.5">
              {TURLER.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTur(t.id)
                    setYukleme(null)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs transition-colors',
                    tur === t.id
                      ? 'border-amber-500/60 bg-amber-500/10 font-medium'
                      : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  <t.ikon className="size-4" />
                  {turLabel[t.id]}
                </button>
              ))}
            </div>
          </Alan>

          <Alan label="Başlık">
            <input value={baslik} onChange={(e) => setBaslik(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
          </Alan>
          <Alan label="Açıklama">
            <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
          </Alan>

          {tur === 'harici-video' && (
            <Alan label="Video bağlantısı">
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube, Vimeo veya MP4/WebM/HLS bağlantısı" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              <p className="mt-1 text-xs text-muted-foreground">YouTube ve Vimeo videoları oynatıcı içinde açılır; MP4/WebM doğrudan oynatılır. HLS bağlantıları tarayıcı destekliyorsa çalışır.</p>
            </Alan>
          )}

          {tur === 'metin' && (
            <Alan label="Metin içeriği">
              <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={8} placeholder="Eğitim metni…" className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </Alan>
          )}

          {dosyaGerekli && (
            <div>
              <label className="mb-1 block text-xs font-medium">
                Dosya {tur === 'video' ? '(MP4/WebM)' : tur === 'pdf' ? '(PDF)' : tur === 'slayt' ? '(PPT/PPTX)' : '(PNG/JPG)'} <span className="text-destructive">*</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setSurukle(true)
                }}
                onDragLeave={() => setSurukle(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setSurukle(false)
                  const f = e.dataTransfer.files[0]
                  if (f) dosyaSec(f)
                }}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors',
                  surukle ? 'border-amber-500 bg-amber-500/10' : 'hover:border-foreground/40',
                )}
              >
                <UploadCloudIcon className="size-7 text-muted-foreground/60" />
                <p className="text-sm font-medium">Dosyayı buraya sürükleyin veya seçin</p>
                <p className="text-xs text-muted-foreground">{KABUL[tur] || 'Tüm dosyalar'}</p>
              </div>
              <input ref={fileRef} type="file" accept={KABUL[tur]} className="hidden" onChange={(e) => e.target.files?.[0] && dosyaSec(e.target.files[0])} />

              {yukleme && (
                <div className="mt-2.5 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs font-medium">{yukleme.ad}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{yukleme.boyut}</span>
                      {yukleme.durum === 'tamam' && <CheckCircle2Icon className="size-3.5 text-emerald-500" />}
                      {yukleme.durum === 'hata' && (
                        <button type="button" className="text-amber-600 underline" onClick={() => setYukleme((y) => y && { ...y, durum: 'yukleniyor', yuzde: 0 })}>
                          Tekrar dene
                        </button>
                      )}
                      <button type="button" aria-label="Kaldır" onClick={() => setYukleme(null)} className="text-muted-foreground hover:text-foreground">
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        yukleme.durum === 'tamam' ? 'bg-emerald-500' : yukleme.durum === 'hata' ? 'bg-red-500' : 'bg-amber-500',
                      )}
                      style={{ width: `${yukleme.yuzde}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {yukleme.durum === 'yukleniyor' ? `Yükleniyor… %${yukleme.yuzde}` : yukleme.durum === 'tamam' ? 'Yükleme tamamlandı' : 'Yükleme hatası'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Alan label="Tahmini süre (dk)">
              <input type="number" min={0} value={sure} onChange={(e) => setSure(Number(e.target.value))} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </Alan>
            <Alan label="Tamamlama">
              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3">
                <Checkbox checked={zorunlu} onCheckedChange={(v) => setZorunlu(!!v)} />
                <span className="text-sm">Zorunlu içerik</span>
              </label>
            </Alan>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
            <Button onClick={kaydet}>{duzenle ? 'Güncelle' : 'İçeriği Ekle'}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ============================== Sınav editörü ============================= */

function SinavEditor({ sinav, onChange, tur }: { sinav?: Sinav; onChange: (s?: Sinav) => void; tur: 'on' | 'son' }) {
  const [soruForm, setSoruForm] = useState(false)
  const [duzenleId, setDuzenleId] = useState<string | null>(null)
  const [bankaSec, setBankaSec] = useState('')
  const onSinavMi = tur === 'on'

  if (!sinav) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-dashed bg-card/50 p-6 sm:p-10">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><ClipboardListIcon className="size-6" /></span>
          <p className="mt-4 text-base font-semibold">{onSinavMi ? 'Ön sınav henüz eklenmedi' : 'Eğitim sonu sınavı henüz eklenmedi'}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {onSinavMi
              ? 'Katılımcıların eğitime başlamadan önceki bilgi düzeyini ölçün. Sonuç başlangıç değerlendirmesi olarak kaydedilir ve eğitime devamı engellemez.'
              : 'Eğitim sonunda katılımcıların öğrendiklerini ölçün. Geçme notu, süre ve deneme hakkını düzenleyebilirsiniz.'}
          </p>
          <Button className="mt-5" onClick={() => {
            const ayarlar = varsayilanSinavAyarlari()
            onChange({
              id: nid('SNV'),
              baslik: onSinavMi ? 'Eğitim Ön Sınavı' : 'Eğitim Sonu Sınavı',
              aciklama: onSinavMi ? 'Eğitim öncesi mevcut bilgi düzeyini ölçer; sonuç eğitime devamı engellemez.' : '',
              sorular: [],
              ayarlar: onSinavMi ? { ...ayarlar, gecmePuani: 0, sureDakika: 0, denemeHakki: 0, cevaplariGoster: false, aciklamalariGoster: false } : ayarlar,
            })
          }}>
            <PlusIcon /> {onSinavMi ? 'Ön sınav oluştur' : 'Sınav oluştur'}
          </Button>
        </div>
      </div>
    )
  }

  const toplamPuan = sinav.sorular.reduce((a, s) => a + s.puan, 0)

  const soruTasi = (ix: number, dir: -1 | 1) => {
    const j = ix + dir
    if (j < 0 || j >= sinav.sorular.length) return
    const c = [...sinav.sorular]
    ;[c[ix], c[j]] = [c[j], c[ix]]
    onChange({ ...sinav, sorular: c })
  }

  return (
    <div className="space-y-5">
      {onSinavMi && <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-sm">
        <ClipboardListIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div><p className="font-medium">Başlangıç düzeyi değerlendirmesi</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Ön sınav puanı katılımcının eğitime erişimini veya tamamlama durumunu etkilemez. Doğru cevaplar ve açıklamalar katılımcıya gösterilmez.</p></div>
      </div>}
      {/* Meta + ayarlar */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Alan label={onSinavMi ? 'Ön sınav başlığı' : 'Sınav başlığı'}>
          <input value={sinav.baslik} onChange={(e) => onChange({ ...sinav, baslik: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
        </Alan>
        <Alan label={onSinavMi ? 'Katılımcıya gösterilecek açıklama' : 'Açıklama'}>
          <input value={sinav.aciklama} onChange={(e) => onChange({ ...sinav, aciklama: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
        </Alan>
        {!onSinavMi && <Alan label={`Geçme notu: ${sinav.ayarlar.gecmePuani}`}>
          <input type="range" min={0} max={100} step={5} value={sinav.ayarlar.gecmePuani} onChange={(e) => onChange({ ...sinav, ayarlar: { ...sinav.ayarlar, gecmePuani: Number(e.target.value) } })} className="w-full accent-amber-500" />
        </Alan>}
        {!onSinavMi && <div className="grid grid-cols-2 gap-3">
          <Alan label="Süre (dk, 0=sınırsız)">
            <input type="number" min={0} value={sinav.ayarlar.sureDakika} onChange={(e) => onChange({ ...sinav, ayarlar: { ...sinav.ayarlar, sureDakika: Number(e.target.value) } })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
          </Alan>
          <Alan label="Deneme hakkı (0=sınırsız)">
            <input type="number" min={0} value={sinav.ayarlar.denemeHakki} onChange={(e) => onChange({ ...sinav, ayarlar: { ...sinav.ayarlar, denemeHakki: Number(e.target.value) } })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
          </Alan>
        </div>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ['soruKaristir', 'Soruları karıştır'],
            ['sikKaristir', 'Şıkları karıştır'],
            ...(!onSinavMi ? [['cevaplariGoster', 'Sınav sonrası doğru cevapları göster'], ['aciklamalariGoster', 'Yanlış cevap açıklamalarını göster']] as const : []),
          ] as const
        ).map(([k, t]) => (
          <label key={k} className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/40">
            <Checkbox checked={sinav.ayarlar[k]} onCheckedChange={(v) => onChange({ ...sinav, ayarlar: { ...sinav.ayarlar, [k]: !!v } })} />
            {t}
          </label>
        ))}
      </div>

      {/* Sorular */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {onSinavMi ? 'Ön sınav soruları' : 'Sınav soruları'} · {sinav.sorular.length} soru · toplam {toplamPuan} puan
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={bankaSec}
              onChange={(e) => {
                const s = soruBankasiSeed.find((x) => x.id === e.target.value)
                if (s) {
                  const { kullanimSayisi: _k, ...soru } = s
                  onChange({ ...sinav, sorular: [...sinav.sorular, { ...soru, id: nid('S') }] })
                  toast.success('Bankadan soru eklendi')
                }
                setBankaSec('')
              }}
              className="h-8 appearance-none rounded-lg border border-input bg-transparent pr-7 pl-2.5 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
            >
              <option value="">Soru bankasından ekle…</option>
              {soruBankasiSeed.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.soru.slice(0, 48)}…
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button size="sm" variant="outline" onClick={() => { setDuzenleId(null); setSoruForm((f) => !f) }}>
            <PlusIcon /> Yeni soru
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onChange(undefined)}>
            {onSinavMi ? 'Ön sınavı kaldır' : 'Sınavı kaldır'}
          </Button>
        </div>
      </div>

      {soruForm && (
        <SoruForm
          key={duzenleId ?? 'yeni-soru'}
          baslangic={sinav.sorular.find((s) => s.id === duzenleId)}
          onKaydet={(s) => {
            onChange({
              ...sinav,
              sorular: duzenleId
                ? sinav.sorular.map((mevcut) => mevcut.id === duzenleId ? s : mevcut)
                : [...sinav.sorular, s],
            })
            setSoruForm(false)
            setDuzenleId(null)
          }}
          onKapat={() => { setSoruForm(false); setDuzenleId(null) }}
        />
      )}

      <div className="space-y-2">
        {sinav.sorular.map((s, ix) => (
          <div key={s.id} className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums">{ix + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{s.soru}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {s.secenekler.map((o, oi) => (
                  <span key={oi} className={cn('rounded-md px-2 py-0.5 text-xs', s.dogru.includes(oi) ? 'bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                    {o}
                  </span>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {s.tur === 'tek' ? 'Tek seçmeli' : s.tur === 'coklu' ? 'Çoklu seçim' : 'Doğru/Yanlış'} · {s.puan} puan
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-0.5">
              <button type="button" aria-label="Soruyu düzenle" title="Soruyu düzenle" onClick={() => { setDuzenleId(s.id); setSoruForm(true) }} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <PencilIcon className="size-3.5" />
              </button>
              <button type="button" aria-label="Yukarı" disabled={ix === 0} onClick={() => soruTasi(ix, -1)} className="flex size-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30">
                <ChevronUpIcon className="size-3.5" />
              </button>
              <button type="button" aria-label="Aşağı" disabled={ix === sinav.sorular.length - 1} onClick={() => soruTasi(ix, 1)} className="flex size-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30">
                <ChevronDownIcon className="size-3.5" />
              </button>
              <button type="button" aria-label="Sil" onClick={() => onChange({ ...sinav, sorular: sinav.sorular.filter((x) => x.id !== s.id) })} className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive">
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {sinav.sorular.length === 0 && (
          <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            Henüz soru yok — yeni soru ekleyin veya bankadan seçin
          </div>
        )}
      </div>
    </div>
  )
}

function SoruForm({ baslangic, onKaydet, onKapat }: { baslangic?: SinavSoru; onKaydet: (s: SinavSoru) => void; onKapat: () => void }) {
  const [tur, setTur] = useState<SinavSoruTur>(baslangic?.tur ?? 'tek')
  const [soru, setSoru] = useState(baslangic?.soru ?? '')
  const [secenekler, setSecenekler] = useState<string[]>(baslangic?.tur === 'dy' ? ['', ''] : (baslangic?.secenekler ?? ['', '']))
  const [dogru, setDogru] = useState<number[]>(baslangic?.dogru ?? [])
  const [puan, setPuan] = useState(baslangic?.puan ?? 10)
  const [aciklama, setAciklama] = useState(baslangic?.aciklama ?? '')

  const liste = tur === 'dy' ? ['Doğru', 'Yanlış'] : secenekler

  const dogruSec = (i: number) => {
    if (tur === 'coklu') setDogru((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))
    else setDogru([i])
  }

  const ekle = () => {
    if (!soru.trim()) return toast.error('Soru metni zorunlu')
    if (tur !== 'dy' && secenekler.some((s) => !s.trim())) return toast.error('Tüm seçenekleri doldurun')
    if (dogru.length === 0) return toast.error('Doğru cevabı işaretleyin')
    onKaydet({
      id: baslangic?.id ?? nid('S'),
      tur,
      soru: soru.trim(),
      secenekler: liste.map((s) => s.trim()),
      dogru,
      puan: Number(puan) || 10,
      aciklama: aciklama.trim() || undefined,
    })
    toast.success(baslangic ? 'Soru güncellendi' : 'Soru eklendi')
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Alan label="Soru tipi">
          <div className="relative">
            <select
              value={tur}
              onChange={(e) => { setTur(e.target.value as SinavSoruTur); setDogru([]) }}
              className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-7 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            >
              <option value="tek">Tek seçmeli</option>
              <option value="coklu">Çoklu seçim</option>
              <option value="dy">Doğru / Yanlış</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Alan>
        <Alan label="Puan">
          <input type="number" min={1} value={puan} onChange={(e) => setPuan(Number(e.target.value))} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
        </Alan>
      </div>
      <Alan label="Soru metni">
        <input value={soru} onChange={(e) => setSoru(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
      </Alan>
      {tur !== 'dy' && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Seçenekler — doğru cevabı {tur === 'coklu' ? 'işaretleyin (çoklu)' : 'seçin'}</p>
          {secenekler.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {tur === 'coklu' ? (
                <Checkbox checked={dogru.includes(i)} onCheckedChange={() => dogruSec(i)} />
              ) : (
                <input type="radio" name="dogru" checked={dogru.includes(i)} onChange={() => dogruSec(i)} className="accent-amber-500" />
              )}
              <input
                value={s}
                onChange={(e) => setSecenekler((c) => c.map((x, xi) => (xi === i ? e.target.value : x)))}
                placeholder={`Seçenek ${i + 1}`}
                className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
              />
              {secenekler.length > 2 && (
                <button type="button" aria-label="Seçeneği sil" onClick={() => { setSecenekler((c) => c.filter((_, xi) => xi !== i)); setDogru((d) => d.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x))) }} className="text-muted-foreground hover:text-destructive">
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          <Button size="xs" variant="ghost" onClick={() => setSecenekler((c) => [...c, ''])}>
            <PlusIcon /> Seçenek ekle
          </Button>
        </div>
      )}
      {tur === 'dy' && (
        <div className="flex gap-2">
          {['Doğru', 'Yanlış'].map((o, i) => (
            <button key={o} type="button" onClick={() => setDogru([i])} className={cn('flex-1 rounded-lg border py-2 text-sm transition-colors', dogru[0] === i ? 'border-emerald-500/60 bg-emerald-500/10 font-medium' : 'text-muted-foreground hover:border-foreground/30')}>
              {o}
            </button>
          ))}
        </div>
      )}
      <Alan label="Açıklama (yanlış cevapta gösterilir)">
        <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
      </Alan>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onKapat}>Vazgeç</Button>
        <Button size="sm" onClick={ekle}>{baslangic ? 'Değişiklikleri kaydet' : 'Soruyu ekle'}</Button>
      </div>
    </div>
  )
}
