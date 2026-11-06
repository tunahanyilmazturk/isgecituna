import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeftIcon, ArrowRightIcon, Building2Icon, CheckIcon, PaperclipIcon, PlusIcon, ShieldCheckIcon, StarIcon, Trash2Icon, UploadIcon, XIcon } from 'lucide-react'
import { Dialog as Modal } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Alan, Bolum, EkIkon, Sec } from '@/components/form-bits'
import { eklereCevir, textareaCls } from '@/components/olaylar/olay-form-utils'
import { useFirmalarStore } from '@/stores/firmalar-store'
import {
  BUGUN,
  HIZMET_TURLERI,
  ILLER,
  TEHLIKE_SINIFLARI,
} from '@/data/firmalar'
import { DSPLER, HEKIMLER, UZMAN_SINIFLARI, UZMANLAR } from '@/data/isgkatip'
import type { Firma, FirmaKisi, TehlikeSinifi } from '@/data/firmalar'
import type { OlayEk } from '@/data/olaylar'
import { FirmaAvatar } from '@/components/firmalar/firma-avatar'

interface KisiForm {
  ad: string
  gorev: string
  telefon: string
  eposta: string
  birincil: boolean
}

interface FirmaFormState {
  unvan: string
  kisaAd: string
  logo?: string
  vergiDairesi: string
  vergiNo: string
  sgkSicil: string
  mersis: string
  tehlikeSinifi: TehlikeSinifi | ''
  nace: string
  faaliyet: string
  calisanSayisi: string
  il: string
  ilce: string
  adres: string
  telefon: string
  eposta: string
  yetkili: string
  kisiler: KisiForm[]
  hizmetTuru: string
  uzman: string
  uzmanSinifi: string
  hekim: string
  dsp: string
  hizmetBaslangic: string
  hizmetBitis: string
  aylikSure: string
  notlar: string
  ekler: OlayEk[]
  durum: 'Aktif' | 'Pasif'
}

const bosForm: FirmaFormState = {
  unvan: '',
  kisaAd: '',
  logo: undefined,
  vergiDairesi: '',
  vergiNo: '',
  sgkSicil: '',
  mersis: '',
  tehlikeSinifi: '',
  nace: '',
  faaliyet: '',
  calisanSayisi: '',
  il: 'Kocaeli',
  ilce: '',
  adres: '',
  telefon: '',
  eposta: '',
  yetkili: '',
  kisiler: [],
  hizmetTuru: HIZMET_TURLERI[0],
  uzman: UZMANLAR[0],
  uzmanSinifi: 'B',
  hekim: HEKIMLER[0],
  dsp: '',
  hizmetBaslangic: BUGUN,
  hizmetBitis: '',
  aylikSure: '',
  notlar: '',
  ekler: [],
  durum: 'Aktif',
}

const firmadanForm = (f: Firma): FirmaFormState => ({
  unvan: f.unvan,
  kisaAd: f.kisaAd,
  logo: f.logo,
  vergiDairesi: f.vergiDairesi,
  vergiNo: f.vergiNo,
  sgkSicil: f.sgkSicil,
  mersis: f.mersis ?? '',
  tehlikeSinifi: f.tehlikeSinifi,
  nace: f.nace,
  faaliyet: f.faaliyet,
  calisanSayisi: String(f.calisanSayisi),
  il: f.il,
  ilce: f.ilce,
  adres: f.adres,
  telefon: f.telefon,
  eposta: f.eposta,
  yetkili: f.yetkili,
  kisiler: f.kisiler.map((k) => ({
    ad: k.ad,
    gorev: k.gorev,
    telefon: k.telefon,
    eposta: k.eposta,
    birincil: k.birincil,
  })),
  hizmetTuru: f.hizmetTuru,
  uzman: f.uzman ?? UZMANLAR[0],
  uzmanSinifi: f.uzmanSinifi ?? 'B',
  hekim: f.hekim ?? HEKIMLER[0],
  dsp: f.dsp ?? '',
  hizmetBaslangic: f.hizmetBaslangic,
  hizmetBitis: f.hizmetBitis,
  aylikSure: f.aylikSure ?? '',
  notlar: f.notlar ?? '',
  ekler: f.ekler,
  durum: f.durum,
})

export function FirmaFormDrawer({
  firma,
  onKapat,
}: {
  firma: Firma | 'yeni' | null
  onKapat: () => void
}) {
  const firmaEkle = useFirmalarStore((s) => s.firmaEkle)
  const firmaGuncelle = useFirmalarStore((s) => s.firmaGuncelle)
  const dosyaRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const duzenle = firma && firma !== 'yeni' ? firma : null

  const [form, setForm] = useState<FirmaFormState>(() =>
    duzenle ? firmadanForm(duzenle) : bosForm,
  )
  const [hata, setHata] = useState<string | null>(null)
  const [adim, setAdim] = useState(0)

  // Seçili firma değişince form render sırasında sıfırlanır (effect'siz).
  const [oncekiFirma, setOncekiFirma] = useState(firma)
  if (oncekiFirma !== firma) {
    setOncekiFirma(firma)
    setForm(duzenle ? firmadanForm(duzenle) : bosForm)
    setHata(null)
    setAdim(0)
  }

  const set = <K extends keyof FirmaFormState>(k: K, v: FirmaFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const logoSec = (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Logo PNG, JPG veya WebP biçiminde olmalı.')
      return
    }
    if (file.size > 512 * 1024) {
      toast.error('Logo dosyası en fazla 512 KB olabilir.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') set('logo', reader.result)
      else toast.error('Logo dosyası okunamadı.')
    }
    reader.onerror = () => toast.error('Logo dosyası okunamadı.')
    reader.readAsDataURL(file)
  }

  const kisiSet = (i: number, k: keyof KisiForm, v: string | boolean) =>
    setForm((f) => ({
      ...f,
      kisiler: f.kisiler.map((p, j) => (j === i ? { ...p, [k]: v } : p)),
    }))

  const adimlar = [
    { baslik: 'Firma', aciklama: 'Kimlik ve resmi bilgiler', Icon: Building2Icon },
    { baslik: 'İşyeri', aciklama: 'Adres ve iletişim', Icon: Building2Icon },
    { baslik: 'İSG hizmeti', aciklama: 'Görevlendirme ve sözleşme', Icon: ShieldCheckIcon },
    { baslik: 'Tamamla', aciklama: 'Dosyalar ve notlar', Icon: CheckIcon },
  ]

  const sonrakiAdim = () => {
    const eksikler: string[] = []
    if (adim === 0) {
      if (!form.unvan.trim()) eksikler.push('firma unvanı')
      if (!form.vergiNo.trim()) eksikler.push('vergi numarası')
      if (!form.tehlikeSinifi) eksikler.push('tehlike sınıfı')
    }
    if (adim === 1 && !form.ilce.trim()) eksikler.push('ilçe')
    if (eksikler.length) {
      setHata(`Devam etmek için ${eksikler.join(', ')} alanını doldurun.`)
      return
    }
    setHata(null)
    setAdim((s) => Math.min(s + 1, adimlar.length - 1))
  }

  const kaydet = () => {
    const eksikler: string[] = []
    if (!form.unvan.trim()) eksikler.push('firma unvanı')
    if (!form.vergiNo.trim()) eksikler.push('vergi numarası')
    if (!form.tehlikeSinifi) eksikler.push('tehlike sınıfı')
    if (!form.ilce.trim()) eksikler.push('ilçe')
    if (eksikler.length) {
      setHata(`Zorunlu alanlar eksik: ${eksikler.join(', ')}`)
      toast.error('Zorunlu alanları doldurun')
      return
    }

    const kisiler: FirmaKisi[] = form.kisiler
      .filter((k) => k.ad.trim())
      .map((k, i) => ({ ...k, ad: k.ad.trim(), id: `FK-Y${i}` }))

    const ortak = {
      unvan: form.unvan.trim(),
      kisaAd: form.kisaAd.trim() || form.unvan.trim(),
      logo: form.logo || undefined,
      vergiDairesi: form.vergiDairesi.trim(),
      vergiNo: form.vergiNo.trim(),
      sgkSicil: form.sgkSicil.trim(),
      mersis: form.mersis.trim() || undefined,
      tehlikeSinifi: form.tehlikeSinifi,
      nace: form.nace.trim(),
      faaliyet: form.faaliyet.trim(),
      calisanSayisi: Number(form.calisanSayisi) || 0,
      il: form.il,
      ilce: form.ilce.trim(),
      adres: form.adres.trim(),
      telefon: form.telefon.trim(),
      eposta: form.eposta.trim(),
      yetkili: form.yetkili.trim(),
      kisiler,
      hizmetTuru: form.hizmetTuru,
      uzman: form.uzman || undefined,
      uzmanSinifi: (form.uzmanSinifi || undefined) as Firma['uzmanSinifi'],
      hekim: form.hekim || undefined,
      dsp: form.dsp || undefined,
      hizmetBaslangic: form.hizmetBaslangic,
      hizmetBitis: form.hizmetBitis,
      aylikSure: form.aylikSure.trim() || undefined,
      notlar: form.notlar.trim() || undefined,
      ekler: form.ekler,
      durum: form.durum,
    }

    if (duzenle) {
      firmaGuncelle(duzenle.id, ortak)
      toast.success(`${duzenle.kod} güncellendi`)
    } else {
      const yeni = firmaEkle(ortak)
      toast.success(`${yeni.kod} — ${yeni.unvan} oluşturuldu`)
    }
    onKapat()
  }

  return (
    <Modal.Root open={!!firma} onOpenChange={(a) => !a && onKapat()}>
      <Modal.Portal>
        <Modal.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Modal.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[min(1080px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-row overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl outline-none transition duration-200 data-ending-style:scale-[.98] data-ending-style:opacity-0 data-starting-style:scale-[.98] data-starting-style:opacity-0 max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:max-h-[94dvh] max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:flex-col max-md:rounded-b-none">
        <aside className="relative hidden w-[270px] shrink-0 flex-col overflow-hidden bg-[#111214] px-6 py-6 text-white md:flex" style={{ backgroundImage: "url('/images/firma-wizard-sidebar.png')", backgroundSize: 'cover', backgroundPosition: '64% center' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#101113]/95 via-[#111214]/72 to-[#111214]/95" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-400"><ShieldCheckIcon className="size-5" /></span>
              <span><span className="block text-sm font-semibold tracking-tight">isghub</span><span className="block text-[10px] text-white/55">Firma yönetimi</span></span>
            </div>
            <div className="mt-10">
              <p className="max-w-[190px] text-2xl leading-[1.15] font-semibold tracking-tight">İş ortaklığını güvenle başlatın.</p>
              <p className="mt-2 max-w-[190px] text-xs leading-relaxed text-white/65">Firma bilgilerini tamamlayın, İSG hizmetlerini aynı kayıtta yönetin.</p>
            </div>
            <nav aria-label="Firma oluşturma adımları" className="mt-9 space-y-1">
              {adimlar.map(({ baslik, aciklama, Icon }, i) => {
                const tamamlandi = i < adim
                const seciliAdim = i === adim
                return <button key={baslik} type="button" onClick={() => i <= adim && setAdim(i)} aria-current={seciliAdim ? 'step' : undefined} className={cn('relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors', seciliAdim ? 'bg-white/10' : 'hover:bg-white/5', i > adim && 'cursor-default opacity-50')}>
                  <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full border', tamamlandi ? 'border-amber-400 bg-amber-400 text-black' : seciliAdim ? 'border-amber-400 text-amber-300' : 'border-white/20 text-white/50')}>
                    {tamamlandi ? <CheckIcon className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <span className="min-w-0 pt-0.5"><span className={cn('block text-xs font-medium', seciliAdim ? 'text-white' : 'text-white/80')}>{baslik}</span><span className="mt-0.5 block text-[10px] text-white/50">{aciklama}</span></span>
                </button>
              })}
            </nav>
            <div className="mt-auto rounded-xl border border-white/10 bg-black/25 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-medium text-amber-300">KAYIT ÖNİZLEMESİ</p>
              <p className="mt-1 truncate text-xs font-medium text-white">{form.kisaAd || form.unvan || 'Firma adı burada görünecek'}</p>
              <p className="mt-0.5 truncate text-[10px] text-white/55">{form.tehlikeSinifi || 'Tehlike sınıfı seçilmedi'}{form.ilce ? ` · ${form.ilce}, ${form.il}` : ''}</p>
            </div>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b bg-muted/20 px-5 pt-5 pb-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Modal.Title className="text-lg font-semibold tracking-tight">
                {duzenle ? `${duzenle.kod} · Firmayı düzenle` : 'Yeni firma oluştur'}
              </Modal.Title>
              <Modal.Description className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Firma kaydını dört kısa adımda tamamlayın. Bilgiler görevlendirme ve raporlarda kullanılır.
              </Modal.Description>
            </div>
            <Modal.Close
              render={<button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" aria-label="Pencereyi kapat" />}
            ><XIcon className="size-4" /></Modal.Close>
          </div>
          <div className="mt-4 flex items-center gap-2 md:hidden">
            <span className="grid size-7 place-items-center rounded-full bg-amber-500/10 text-amber-700"><span className="text-xs font-semibold">{adim + 1}</span></span>
            <span className="text-xs font-medium">{adimlar[adim].baslik}</span><span className="text-[11px] text-muted-foreground">/ {adimlar.length}</span>
            <span className="ml-auto flex gap-1">{adimlar.map((x, i) => <span key={x.baslik} className={cn('h-1 w-5 rounded-full', i <= adim ? 'bg-amber-500' : 'bg-border')} />)}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
          {hata && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
              {hata}
            </p>
          )}

          {adim === 0 && <Bolum harf="A" baslik="Firma bilgileri">
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
              <FirmaAvatar ad={form.kisaAd || form.unvan || 'Firma'} logo={form.logo} className="size-14 rounded-2xl text-base" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">Firma logosu</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Eklenmezse firma baş harfleri gösterilir.</p>
                <p className="mt-1 text-[10px] text-muted-foreground">PNG, JPG veya WebP · en fazla 512 KB</p>
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  logoSec(e.target.files?.[0])
                  e.currentTarget.value = ''
                }}
              />
              <div className="flex gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                  <UploadIcon /> {form.logo ? 'Değiştir' : 'Logo ekle'}
                </Button>
                {form.logo && (
                  <Button type="button" variant="ghost" size="icon" aria-label="Logoyu kaldır" onClick={() => set('logo', undefined)}>
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Alan label="Firma unvanı *" className="col-span-2">
                <Input
                  value={form.unvan}
                  onChange={(e) => set('unvan', e.target.value)}
                  placeholder="Örn: Nova Gıda San. Tic. A.Ş."
                />
              </Alan>
              <Alan label="Kısa ad">
                <Input
                  value={form.kisaAd}
                  onChange={(e) => set('kisaAd', e.target.value)}
                  placeholder="Nova Gıda"
                />
              </Alan>
              <Alan label="Vergi dairesi">
                <Input
                  value={form.vergiDairesi}
                  onChange={(e) => set('vergiDairesi', e.target.value)}
                  placeholder="Gebze"
                />
              </Alan>
              <Alan label="Vergi numarası *">
                <Input
                  value={form.vergiNo}
                  onChange={(e) => set('vergiNo', e.target.value)}
                  placeholder="10 haneli"
                  maxLength={10}
                  inputMode="numeric"
                />
              </Alan>
              <Alan label="SGK sicil no">
                <Input
                  value={form.sgkSicil}
                  onChange={(e) => set('sgkSicil', e.target.value)}
                  placeholder="3-4107-XXXX-00-000"
                />
              </Alan>
              <Alan label="MERSİS (opsiyonel)">
                <Input
                  value={form.mersis}
                  onChange={(e) => set('mersis', e.target.value)}
                  placeholder="16 haneli"
                  maxLength={16}
                  inputMode="numeric"
                />
              </Alan>
              <Alan label="Tehlike sınıfı *">
                <Sec
                  value={form.tehlikeSinifi || 'Seçiniz'}
                  onChange={(v) => set('tehlikeSinifi', v as TehlikeSinifi)}
                  options={['Seçiniz', ...TEHLIKE_SINIFLARI]}
                />
              </Alan>
              <Alan label="NACE kodu">
                <Input
                  value={form.nace}
                  onChange={(e) => set('nace', e.target.value)}
                  placeholder="Örn: 25.50.02"
                />
              </Alan>
              <Alan label="Çalışan sayısı">
                <Input
                  type="number"
                  min={0}
                  value={form.calisanSayisi}
                  onChange={(e) => set('calisanSayisi', e.target.value)}
                />
              </Alan>
            </div>
            <Alan label="Faaliyet konusu">
              <Input
                value={form.faaliyet}
                onChange={(e) => set('faaliyet', e.target.value)}
                placeholder="Örn: Metal eşya dövme ve presleme"
              />
            </Alan>
          </Bolum>}

          {adim === 1 && <>
          <Bolum harf="B" baslik="İşyeri bilgileri">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Alan label="İl *">
                <Sec value={form.il} onChange={(v) => set('il', v)} options={ILLER} />
              </Alan>
              <Alan label="İlçe *">
                <Input
                  value={form.ilce}
                  onChange={(e) => set('ilce', e.target.value)}
                  placeholder="Gebze"
                />
              </Alan>
              <Alan label="Telefon">
                <Input
                  value={form.telefon}
                  onChange={(e) => set('telefon', e.target.value)}
                  placeholder="0262 000 00 00"
                />
              </Alan>
              <Alan label="E-posta">
                <Input
                  type="email"
                  value={form.eposta}
                  onChange={(e) => set('eposta', e.target.value)}
                  placeholder="info@firma.com"
                />
              </Alan>
              <Alan label="İşyeri yetkilisi" className="col-span-2">
                <Input
                  value={form.yetkili}
                  onChange={(e) => set('yetkili', e.target.value)}
                  placeholder="Ad soyad"
                />
              </Alan>
            </div>
            <Alan label="Açık adres">
              <Input
                value={form.adres}
                onChange={(e) => set('adres', e.target.value)}
                placeholder="Mahalle, cadde, no…"
              />
            </Alan>
          </Bolum>

          <Bolum harf="C" baslik="İletişim kişileri">
            <div className="space-y-2.5">
              {form.kisiler.map((k, i) => (
                <div key={i} className="grid grid-cols-1 items-end gap-2 rounded-xl border p-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
                  <Alan label={i === 0 ? 'Ad soyad' : ''}>
                    <Input
                      value={k.ad}
                      onChange={(e) => kisiSet(i, 'ad', e.target.value)}
                      placeholder="Ad soyad"
                    />
                  </Alan>
                  <Alan label={i === 0 ? 'Görev' : ''}>
                    <Input
                      value={k.gorev}
                      onChange={(e) => kisiSet(i, 'gorev', e.target.value)}
                      placeholder="Görev"
                    />
                  </Alan>
                  <Alan label={i === 0 ? 'Telefon' : ''}>
                    <Input
                      value={k.telefon}
                      onChange={(e) => kisiSet(i, 'telefon', e.target.value)}
                      placeholder="05xx"
                    />
                  </Alan>
                  <Alan label={i === 0 ? 'E-posta' : ''}>
                    <Input
                      value={k.eposta}
                      onChange={(e) => kisiSet(i, 'eposta', e.target.value)}
                      placeholder="e-posta"
                    />
                  </Alan>
                  <button
                    type="button"
                    title="Birincil iletişim kişisi"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        kisiler: f.kisiler.map((p, j) => ({ ...p, birincil: j === i })),
                      }))
                    }
                    className={cn(
                      'mb-0.5 flex size-8 items-center justify-center rounded-lg transition-colors',
                      k.birincil
                        ? 'text-amber-500'
                        : 'text-muted-foreground/50 hover:text-amber-500',
                    )}
                  >
                    <StarIcon className={cn('size-4', k.birincil && 'fill-amber-400')} />
                  </button>
                  <button
                    type="button"
                    title="Kişiyi kaldır"
                    onClick={() =>
                      setForm((f) => ({ ...f, kisiler: f.kisiler.filter((_, j) => j !== i) }))
                    }
                    className="mb-0.5 flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-destructive"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  kisiler: [
                    ...f.kisiler,
                    { ad: '', gorev: '', telefon: '', eposta: '', birincil: f.kisiler.length === 0 },
                  ],
                }))
              }
            >
              <PlusIcon /> Kişi ekle
            </Button>
          </Bolum>
          </>}

          {adim === 2 && <Bolum harf="D" baslik="İSG hizmet bilgileri">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Alan label="Hizmet türü" className="col-span-2 sm:col-span-3">
                <Sec value={form.hizmetTuru} onChange={(v) => set('hizmetTuru', v)} options={HIZMET_TURLERI} />
              </Alan>
              <Alan label="İş güvenliği uzmanı">
                <Sec value={form.uzman || '— Yok —'} onChange={(v) => set('uzman', v === '— Yok —' ? '' : v)} options={['— Yok —', ...UZMANLAR]} />
              </Alan>
              <Alan label="Uzman sınıfı">
                <Sec value={form.uzmanSinifi} onChange={(v) => set('uzmanSinifi', v)} options={UZMAN_SINIFLARI} />
              </Alan>
              <Alan label="İşyeri hekimi">
                <Sec value={form.hekim || '— Yok —'} onChange={(v) => set('hekim', v === '— Yok —' ? '' : v)} options={['— Yok —', ...HEKIMLER]} />
              </Alan>
              <Alan label="Diğer sağlık personeli">
                <Sec value={form.dsp || '— Yok —'} onChange={(v) => set('dsp', v === '— Yok —' ? '' : v)} options={['— Yok —', ...DSPLER]} />
              </Alan>
              <Alan label="Hizmet başlangıcı">
                <Input
                  type="date"
                  value={form.hizmetBaslangic}
                  onChange={(e) => set('hizmetBaslangic', e.target.value)}
                />
              </Alan>
              <Alan label="Hizmet bitişi">
                <Input
                  type="date"
                  value={form.hizmetBitis}
                  onChange={(e) => set('hizmetBitis', e.target.value)}
                />
              </Alan>
              <Alan label="Aylık hizmet süresi" className="col-span-2 sm:col-span-3">
                <Input
                  value={form.aylikSure}
                  onChange={(e) => set('aylikSure', e.target.value)}
                  placeholder="Örn: Uzman 8 saat/ay · Hekim 4 saat/ay"
                />
              </Alan>
              <Alan label="Firma durumu">
                <Sec
                  value={form.durum}
                  onChange={(v) => set('durum', v as 'Aktif' | 'Pasif')}
                  options={['Aktif', 'Pasif']}
                />
              </Alan>
            </div>
          </Bolum>}

          {adim === 3 && <Bolum harf="E" baslik="Ek bilgiler">
            <input
              ref={dosyaRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                set('ekler', [...form.ekler, ...eklereCevir(e.target.files)])
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => dosyaRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <PaperclipIcon className="size-4" />
              Sözleşme belgesi veya dosya eklemek için tıklayın
            </button>
            {form.ekler.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {form.ekler.map((e, i) => (
                  <li
                    key={`${e.ad}-${i}`}
                    className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
                  >
                    <EkIkon tur={e.tur} />
                    <span className="font-medium">{e.ad}</span>
                    <span className="text-muted-foreground">{e.boyut}</span>
                    <button
                      type="button"
                      aria-label="Eki kaldır"
                      onClick={() => set('ekler', form.ekler.filter((_, j) => j !== i))}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Alan label="Firma notları">
              <textarea
                value={form.notlar}
                onChange={(e) => set('notlar', e.target.value)}
                rows={2}
                placeholder="Örn: Vardiya sistemi, ziyaret günleri…"
                className={textareaCls}
              />
            </Alan>
          </Bolum>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/15 px-5 py-3 sm:px-7">
          <span className="text-xs text-muted-foreground">Adım {adim + 1} / {adimlar.length}</span>
          <div className="flex items-center gap-2">
            {adim > 0 ? (
              <Button variant="outline" onClick={() => { setHata(null); setAdim((s) => s - 1) }}>
                <ArrowLeftIcon /> Geri
              </Button>
            ) : (
              <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
            )}
            {adim < adimlar.length - 1 ? (
              <Button onClick={sonrakiAdim}>Devam et <ArrowRightIcon /></Button>
            ) : (
              <Button onClick={kaydet}><CheckIcon /> {duzenle ? 'Değişiklikleri kaydet' : 'Firmayı oluştur'}</Button>
            )}
          </div>
        </div>
        </div>
        </Modal.Popup>
      </Modal.Portal>
    </Modal.Root>
  )
}
