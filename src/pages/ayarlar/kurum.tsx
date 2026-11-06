import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Building2Icon, ImageIcon, PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alan } from '@/components/form-bits'
import { AyarBaslik, AyarBolum, FormGrid } from '@/components/ayarlar/settings-bits'
import { useAyarlarStore } from '@/stores/ayarlar-store'

export default function KurumAyarlarPage() {
  const { kurum, kurumKaydet, logEkle } = useAyarlarStore()
  const [form, setForm] = useState(kurum)
  const logoInput = useRef<HTMLInputElement>(null)
  const degisti = JSON.stringify(form) !== JSON.stringify(kurum)

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
      if (typeof reader.result === 'string') setForm((f) => ({ ...f, logo: reader.result as string }))
      else toast.error('Logo dosyası okunamadı.')
    }
    reader.onerror = () => toast.error('Logo dosyası okunamadı.')
    reader.readAsDataURL(file)
  }

  const setSube = (i: number, k: keyof (typeof form.subeler)[number], v: string) =>
    setForm((f) => ({ ...f, subeler: f.subeler.map((s, x) => (x === i ? { ...s, [k]: v } : s)) }))

  return (
    <div className="max-w-5xl pb-2">
      <AyarBaslik
        baslik="Kurum Bilgileri"
        aciklama="OSGB kurumunuzun ticari ve iletişim bilgileri. Belgelerde ve raporlarda kullanılır."
        aksiyon={
          <Button
            size="sm"
            disabled={!degisti}
            onClick={() => {
              kurumKaydet(form)
              logEkle({ tarih: new Date().toISOString(), kullanici: 'yilmazturk', islem: 'Kurum bilgileri güncellendi', kayit: kurum.unvan })
              toast.success('Kurum bilgileri kaydedildi')
            }}
          >
            Kaydet
          </Button>
        }
      />
      <AyarBolum
        baslik="Kurum logosu"
        aciklama="OSGB logonuzu ekleyin; rapor ve sertifika üstbilgilerinde kurum baş harfleri yerine kullanılsın."
      >
        <div className="grid gap-5 sm:grid-cols-[156px_minmax(0,1fr)] sm:items-center">
          <div className="flex aspect-square max-h-36 items-center justify-center overflow-hidden rounded-2xl border bg-muted/30 p-4">
            {form.logo ? (
              <img src={form.logo} alt={`${form.kisaAd || form.unvan} logosu`} className="size-full object-contain" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card text-muted-foreground">
                {form.kisaAd || form.unvan ? (
                  <span className="flex size-12 items-center justify-center rounded-xl bg-amber-400 text-sm font-bold text-zinc-950">
                    {(form.kisaAd || form.unvan).split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr')}
                  </span>
                ) : <Building2Icon className="size-7" />}
                <span className="text-[10px]">Logo önizlemesi</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-4 text-amber-500" />
              <h3 className="text-sm font-semibold">Marka görseli</h3>
            </div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Şeffaf arka planlı kare logolar en iyi sonucu verir. Yüklediğiniz görsel bu cihazda saklanır ve kurum belgelerinde kullanılır.
            </p>
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                logoSec(e.target.files?.[0])
                e.currentTarget.value = ''
              }}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => logoInput.current?.click()}>
                <UploadIcon /> {form.logo ? 'Logoyu değiştir' : 'Logo yükle'}
              </Button>
              {form.logo && (
                <Button type="button" size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setForm((f) => ({ ...f, logo: undefined }))}>
                  <Trash2Icon /> Logoyu kaldır
                </Button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">PNG, JPG veya WebP · en fazla 512 KB</p>
          </div>
        </div>
      </AyarBolum>
      <AyarBolum baslik="Ticari Bilgiler">
        <FormGrid>
          <Alan label="Ticari unvan" className="sm:col-span-2">
            <Input value={form.unvan} onChange={(e) => setForm({ ...form, unvan: e.target.value })} />
          </Alan>
          <Alan
            label="Görünen ad (kısa)"
            className="sm:col-span-2"
            aciklama="Menülerde, belge üstbilgilerinde ve firma/katılımcı portallarında OSGB'nizi temsil eder."
          >
            <Input value={form.kisaAd} onChange={(e) => setForm({ ...form, kisaAd: e.target.value })} placeholder="Örn. Vega OSGB" />
          </Alan>
          <Alan label="Vergi dairesi">
            <Input value={form.vergiDairesi} onChange={(e) => setForm({ ...form, vergiDairesi: e.target.value })} />
          </Alan>
          <Alan label="Vergi numarası">
            <Input value={form.vergiNo} onChange={(e) => setForm({ ...form, vergiNo: e.target.value })} />
          </Alan>
          <Alan label="MERSİS">
            <Input value={form.mersis} onChange={(e) => setForm({ ...form, mersis: e.target.value })} />
          </Alan>
          <Alan label="SGK sicil numarası">
            <Input value={form.sgkSicil} onChange={(e) => setForm({ ...form, sgkSicil: e.target.value })} />
          </Alan>
        </FormGrid>
      </AyarBolum>
      <AyarBolum baslik="İletişim">
        <FormGrid>
          <Alan label="Adres" className="sm:col-span-2">
            <Input value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} />
          </Alan>
          <Alan label="Telefon">
            <Input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
          </Alan>
          <Alan label="E-posta">
            <Input value={form.eposta} onChange={(e) => setForm({ ...form, eposta: e.target.value })} />
          </Alan>
          <Alan label="Web sitesi">
            <Input value={form.web} onChange={(e) => setForm({ ...form, web: e.target.value })} />
          </Alan>
        </FormGrid>
      </AyarBolum>
      <AyarBolum baslik="Yetkili">
        <FormGrid>
          <Alan label="Yetkili kişi">
            <Input value={form.yetkili} onChange={(e) => setForm({ ...form, yetkili: e.target.value })} />
          </Alan>
          <Alan label="Ünvanı">
            <Input value={form.yetkiliUnvan} onChange={(e) => setForm({ ...form, yetkiliUnvan: e.target.value })} />
          </Alan>
        </FormGrid>
      </AyarBolum>
      <AyarBolum
        baslik="Şubeler"
        aciklama="Kurumunuzun birden fazla şubesi varsa buradan yönetin."
      >
        <div className="space-y-2">
          {form.subeler.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={s.ad} onChange={(e) => setSube(i, 'ad', e.target.value)} placeholder="Şube adı" className="h-8 flex-1" />
              <Input value={s.il} onChange={(e) => setSube(i, 'il', e.target.value)} placeholder="İl" className="h-8 w-28" />
              <Input value={s.telefon} onChange={(e) => setSube(i, 'telefon', e.target.value)} placeholder="Telefon" className="h-8 w-36" />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => setForm((f) => ({ ...f, subeler: f.subeler.filter((_, x) => x !== i) }))}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={() => setForm((f) => ({ ...f, subeler: [...f.subeler, { ad: '', il: '', telefon: '' }] }))}
          >
            <PlusIcon className="size-3.5" /> Şube ekle
          </Button>
        </div>
      </AyarBolum>
    </div>
  )
}
