import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeftIcon, ArrowRightIcon, Building2Icon, CheckIcon, PaperclipIcon, ShieldCheckIcon, XIcon } from 'lucide-react'
import { Dialog as Modal } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Alan, Bolum, EkIkon, Sec } from '@/components/form-bits'
import { eklereCevir, textareaCls } from '@/components/olaylar/olay-form-utils'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEkipStore } from '@/stores/ekip-store'
import { BUGUN } from '@/data/firmalar'
import { adSoyad } from '@/data/ekip'
import {
  KATIP_DURUMLAR,
  SOZLESME_TURLERI,
  UZMAN_SINIFLARI,
} from '@/data/isgkatip'
import type { KatipDurum, KatipKayit } from '@/data/isgkatip'
import type { OlayEk } from '@/data/olaylar'

interface KatipFormState {
  firmaId: string
  uzman: string
  uzmanSinifi: string
  hekim: string
  dsp: string
  gorevBaslangic: string
  gorevBitis: string
  sozlesmeNo: string
  sozlesmeTuru: string
  sozlesmeBaslangic: string
  sozlesmeBitis: string
  aciklama: string
  belgeler: OlayEk[]
  durum: KatipDurum
}

const bosForm = (firmaId: string, uzman = '', hekim = '', sinif = 'B'): KatipFormState => ({
  firmaId,
  uzman,
  uzmanSinifi: sinif,
  hekim,
  dsp: '',
  gorevBaslangic: BUGUN,
  gorevBitis: '',
  sozlesmeNo: `SZL-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
  sozlesmeTuru: SOZLESME_TURLERI[0],
  sozlesmeBaslangic: BUGUN,
  sozlesmeBitis: '',
  aciklama: '',
  belgeler: [],
  durum: 'Kontrol Bekliyor',
})

const kayittanForm = (k: KatipKayit): KatipFormState => ({
  firmaId: k.firmaId,
  uzman: k.uzman ?? '',
  uzmanSinifi: k.uzmanSinifi ?? 'B',
  hekim: k.hekim ?? '',
  dsp: k.dsp ?? '',
  gorevBaslangic: k.gorevBaslangic,
  gorevBitis: k.gorevBitis,
  sozlesmeNo: k.sozlesmeNo,
  sozlesmeTuru: k.sozlesmeTuru,
  sozlesmeBaslangic: k.sozlesmeBaslangic,
  sozlesmeBitis: k.sozlesmeBitis,
  aciklama: k.aciklama ?? '',
  belgeler: k.belgeler,
  durum: k.durum,
})

export function KatipFormDrawer({
  kayit,
  firmaId,
  onKapat,
}: {
  /** Var olan kayıt düzenleniyorsa kayıt; yoksa null */
  kayit: KatipKayit | null
  /** Yeni kayıt için ön-seçili firma (firma detayından gelir) */
  firmaId?: string
  onKapat: () => void
}) {
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const katipEkle = useFirmalarStore((s) => s.katipEkle)
  const katipGuncelle = useFirmalarStore((s) => s.katipGuncelle)
  const uyeler = useEkipStore((s) => s.uyeler)
  const dosyaRef = useRef<HTMLInputElement>(null)

  // Personel seçenekleri merkezi ekip kaydından gelir — görev türüne göre filtrelenir
  const aktifler = uyeler.filter((u) => u.durum === 'Aktif')
  const uzmanlar = aktifler.filter((u) => u.gorev === 'İş Güvenliği Uzmanı')
  const hekimler = aktifler.filter((u) => u.gorev === 'İşyeri Hekimi')
  const dspler = aktifler.filter(
    (u) => u.gorev === 'Diğer Sağlık Personeli' || u.gorev === 'Hemşire',
  )

  const ilkFirma = kayit?.firmaId ?? firmaId ?? firmalar[0]?.id ?? ''
  const [form, setForm] = useState<KatipFormState>(() =>
    kayit
      ? kayittanForm(kayit)
      : bosForm(
          ilkFirma,
          uzmanlar[0] ? adSoyad(uzmanlar[0]) : '',
          hekimler[0] ? adSoyad(hekimler[0]) : '',
          uzmanlar[0]?.uzmanSinifi ?? 'B',
        ),
  )
  const [adim, setAdim] = useState(0)
  const adimlar = [
    { baslik: 'Firma', detay: 'İşyeri kaydını seçin', Icon: Building2Icon },
    { baslik: 'Görevlendirme', detay: 'İSG ekibini belirleyin', Icon: ShieldCheckIcon },
    { baslik: 'Sözleşme', detay: 'Tarih ve belgeleri ekleyin', Icon: PaperclipIcon },
  ]

  const set = <K extends keyof KatipFormState>(k: K, v: KatipFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const seciliFirma = firmalar.find((f) => f.id === form.firmaId)

  const kaydet = () => {
    if (!form.firmaId) {
      toast.error('Firma seçin')
      return
    }
    if (!form.sozlesmeBitis) {
      toast.error('Sözleşme bitiş tarihi gerekli')
      return
    }
    const ortak = {
      firmaId: form.firmaId,
      uzman: form.uzman || undefined,
      uzmanSinifi: (form.uzmanSinifi || undefined) as KatipKayit['uzmanSinifi'],
      hekim: form.hekim || undefined,
      dsp: form.dsp || undefined,
      gorevBaslangic: form.gorevBaslangic,
      gorevBitis: form.gorevBitis,
      sozlesmeNo: form.sozlesmeNo.trim(),
      sozlesmeTuru: form.sozlesmeTuru,
      sozlesmeBaslangic: form.sozlesmeBaslangic,
      sozlesmeBitis: form.sozlesmeBitis,
      belgeler: form.belgeler,
      aciklama: form.aciklama.trim() || undefined,
      durum: form.durum,
    }
    if (kayit) {
      katipGuncelle(kayit.id, ortak, 'Kayıt güncellendi')
      toast.success(`${kayit.id} güncellendi`)
    } else {
      const yeni = katipEkle(ortak, `Sözleşme oluşturuldu — ${form.sozlesmeNo}`)
      toast.success(`${yeni.id} oluşturuldu — ${seciliFirma?.unvan ?? ''}`)
    }
    onKapat()
  }

  return (
    <Modal.Root open onOpenChange={(a) => !a && onKapat()}>
      <Modal.Portal>
        <Modal.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Modal.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[min(1000px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl outline-none max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:max-h-[94dvh] max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:flex-col max-md:rounded-b-none">
          <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden bg-[#111214] bg-cover bg-[center_68%] text-white md:flex" style={{ backgroundImage: "url('/images/firma-wizard-sidebar.png')" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-[#101113]/95 via-[#111214]/80 to-[#111214]/95" />
            <div className="relative z-10 flex h-full flex-col p-4">
              <div className="border-b border-white/10 px-2 pb-4"><div className="text-sm font-semibold">İSG-KATİP kaydı</div><p className="mt-1 text-[11px] leading-relaxed text-white/55">Firma, görevlendirme ve sözleşme bilgilerini tamamlayın.</p></div>
              <nav className="mt-3 space-y-1" aria-label="İSG-KATİP kayıt adımları">
                {adimlar.map(({ baslik, detay, Icon }, i) => <button key={baslik} type="button" disabled={i > adim} onClick={() => i < adim && setAdim(i)} className={cn('flex w-full items-start gap-3 rounded-xl px-2.5 py-3 text-left transition-colors', i === adim ? 'bg-white/10' : i < adim ? 'hover:bg-white/5' : 'cursor-default opacity-45')}><span className={cn('grid size-7 shrink-0 place-items-center rounded-full border', i < adim ? 'border-emerald-500 bg-emerald-500 text-white' : i === adim ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-white/20 text-white/50')}>{i < adim ? <CheckIcon className="size-3.5" /> : <Icon className="size-3.5" />}</span><span><span className="block text-xs font-medium">{baslik}</span><span className="mt-1 block text-[10px] text-white/50">{detay}</span></span></button>)}
              </nav>
              <div className="mt-auto rounded-xl border border-white/10 bg-black/25 p-3 backdrop-blur-sm"><span className="text-[10px] text-amber-300">SEÇİLİ FİRMA</span><p className="mt-1 truncate text-xs font-medium">{seciliFirma?.kisaAd || 'Firma seçilmedi'}</p><p className="mt-0.5 truncate text-[10px] text-white/55">{form.sozlesmeNo}</p></div>
            </div>
          </aside>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b px-5 py-4">
          <Modal.Title className="text-lg font-semibold">
            {kayit ? `${kayit.id} — Kaydı Düzenle` : 'Yeni İSG-KATİP Kaydı'}
          </Modal.Title>
          <Modal.Description className="mt-0.5 text-sm text-muted-foreground">
            Mevcut bir firma için sözleşme ve personel görevlendirmesi oluşturun. Kayıtlar manuel
            doğrulanmış dosya bazlıdır; resmî entegrasyon sonraki fazda eklenecek.
          </Modal.Description>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted md:hidden"><div className="h-full rounded-full bg-amber-400" style={{ width: `${((adim + 1) / adimlar.length) * 100}%` }} /></div>
        </div>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
          {adim === 0 && <Bolum harf="A" baslik="Firma bilgileri">
            <Alan label="Firma *">
              <Sec
                value={seciliFirma?.unvan ?? 'Seçiniz'}
                onChange={(v) => set('firmaId', firmalar.find((f) => f.unvan === v)?.id ?? '')}
                options={firmalar.map((f) => f.unvan)}
              />
            </Alan>
            {seciliFirma && (
              <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-3.5 py-3">
                <Building2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground">Vergi No</dt>
                    <dd className="font-mono font-medium">{seciliFirma.vergiNo || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">SGK Sicil</dt>
                    <dd className="font-mono font-medium">{seciliFirma.sgkSicil || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tehlike Sınıfı</dt>
                    <dd className="font-medium">{seciliFirma.tehlikeSinifi || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Çalışan</dt>
                    <dd className="font-medium tabular-nums">{seciliFirma.calisanSayisi}</dd>
                  </div>
                </dl>
              </div>
            )}
          </Bolum>}

          {adim === 1 && <Bolum harf="B" baslik="Görevlendirme bilgileri">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Alan label="İş güvenliği uzmanı">
                <Sec
                  value={form.uzman || '— Yok —'}
                  onChange={(v) => {
                    const ad = v === '— Yok —' ? '' : v
                    setForm((f) => {
                      const u = uzmanlar.find((x) => adSoyad(x) === ad)
                      return { ...f, uzman: ad, uzmanSinifi: u?.uzmanSinifi ?? f.uzmanSinifi }
                    })
                  }}
                  options={['— Yok —', ...uzmanlar.map((u) => adSoyad(u))]}
                />
              </Alan>
              <Alan label="Uzman sınıfı">
                <Sec
                  value={form.uzmanSinifi}
                  onChange={(v) => set('uzmanSinifi', v)}
                  options={UZMAN_SINIFLARI}
                />
              </Alan>
              <Alan label="İşyeri hekimi">
                <Sec
                  value={form.hekim || '— Yok —'}
                  onChange={(v) => set('hekim', v === '— Yok —' ? '' : v)}
                  options={['— Yok —', ...hekimler.map((u) => adSoyad(u))]}
                />
              </Alan>
              <Alan label="Diğer sağlık personeli">
                <Sec
                  value={form.dsp || '— Yok —'}
                  onChange={(v) => set('dsp', v === '— Yok —' ? '' : v)}
                  options={['— Yok —', ...dspler.map((u) => adSoyad(u))]}
                />
              </Alan>
              <Alan label="Görevlendirme başlangıcı">
                <Input
                  type="date"
                  value={form.gorevBaslangic}
                  onChange={(e) => set('gorevBaslangic', e.target.value)}
                />
              </Alan>
              <Alan label="Görevlendirme bitişi">
                <Input
                  type="date"
                  value={form.gorevBitis}
                  onChange={(e) => set('gorevBitis', e.target.value)}
                />
              </Alan>
            </div>
          </Bolum>}

          {adim === 2 && <>
          <Bolum harf="C" baslik="Sözleşme bilgileri">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Alan label="Sözleşme numarası">
                <Input
                  value={form.sozlesmeNo}
                  onChange={(e) => set('sozlesmeNo', e.target.value)}
                  placeholder="SZL-2026-XXX"
                />
              </Alan>
              <Alan label="Sözleşme türü" className="col-span-1 sm:col-span-2">
                <Sec
                  value={form.sozlesmeTuru}
                  onChange={(v) => set('sozlesmeTuru', v)}
                  options={SOZLESME_TURLERI}
                />
              </Alan>
              <Alan label="Başlangıç tarihi">
                <Input
                  type="date"
                  value={form.sozlesmeBaslangic}
                  onChange={(e) => set('sozlesmeBaslangic', e.target.value)}
                />
              </Alan>
              <Alan label="Bitiş tarihi *">
                <Input
                  type="date"
                  value={form.sozlesmeBitis}
                  onChange={(e) => set('sozlesmeBitis', e.target.value)}
                />
              </Alan>
            </div>
            <input
              ref={dosyaRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                set('belgeler', [...form.belgeler, ...eklereCevir(e.target.files)])
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => dosyaRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <PaperclipIcon className="size-4" />
              Sözleşme belgesi eklemek için tıklayın
            </button>
            {form.belgeler.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {form.belgeler.map((e, i) => (
                  <li
                    key={`${e.ad}-${i}`}
                    className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
                  >
                    <EkIkon tur={e.tur} />
                    <span className="font-medium">{e.ad}</span>
                    <span className="text-muted-foreground">{e.boyut}</span>
                    <button
                      type="button"
                      aria-label="Belgeyi kaldır"
                      onClick={() => set('belgeler', form.belgeler.filter((_, j) => j !== i))}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Alan label="Açıklama / Not">
              <textarea
                value={form.aciklama}
                onChange={(e) => set('aciklama', e.target.value)}
                rows={2}
                placeholder="Sözleşme veya görevlendirme hakkında not…"
                className={textareaCls}
              />
            </Alan>
          </Bolum>

          <Bolum harf="D" baslik="Kayıt durumu">
            <Alan label="Durum">
              <Sec
                value={form.durum}
                onChange={(v) => set('durum', v as KatipDurum)}
                options={KATIP_DURUMLAR}
              />
            </Alan>
          </Bolum>
          </>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
          <span className="text-xs text-muted-foreground">Adım {adim + 1} / {adimlar.length}</span>
          <div className="flex items-center gap-2">
            {adim === 0 ? <Button variant="ghost" onClick={onKapat}>Vazgeç</Button> : <Button variant="outline" onClick={() => setAdim((s) => s - 1)}><ArrowLeftIcon /> Geri</Button>}
            {adim < adimlar.length - 1 ? <Button onClick={() => { if (!form.firmaId) return toast.error('Devam etmek için firma seçin'); setAdim((s) => s + 1) }}>Devam et <ArrowRightIcon /></Button> : <Button onClick={kaydet}><CheckIcon /> {kayit ? 'Değişiklikleri kaydet' : 'Kaydı oluştur'}</Button>}
          </div>
        </div>
        </div>
        </Modal.Popup>
      </Modal.Portal>
    </Modal.Root>
  )
}
