import { useState } from 'react'
import { useTheme } from 'next-themes'
import { CheckIcon, InfoIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sec, Alan } from '@/components/form-bits'
import { AyarBaslik, AyarBolum, Satir } from '@/components/ayarlar/settings-bits'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { cn } from '@/lib/utils'

export default function GenelAyarlarPage() {
  const { genel, genelKaydet } = useAyarlarStore()
  const { setTheme } = useTheme()
  const [form, setForm] = useState(genel)
  const degisti = JSON.stringify(form) !== JSON.stringify(genel)
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const kaydet = () => {
    genelKaydet(form)
    setTheme(form.tema === 'Koyu' ? 'dark' : form.tema === 'Açık' ? 'light' : 'system')
    toast.success('Genel tercihler kaydedildi')
  }

  return (
    <div className="pb-2">
      <AyarBaslik
        baslik="Genel Ayarlar"
        aciklama="Çalışma alanının bölgesel tercihlerini ve görünümünü düzenleyin."
        aksiyon={(
          <div className="flex items-center gap-2">
            {degisti && (
              <Button size="sm" variant="outline" onClick={() => setForm(genel)}>
                Sıfırla
              </Button>
            )}
            <Button
              size="sm"
              disabled={!degisti}
              onClick={kaydet}
              className={cn(degisti && 'bg-amber-500 text-zinc-950 hover:bg-amber-400')}
            >
              <CheckIcon /> Kaydet
            </Button>
          </div>
        )}
      />

      <AyarBolum
        baslik="Bölgesel tercihler"
        aciklama="Tarih, saat ve tutar gösteriminde kullanılacak varsayılan biçimler."
      >
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
          <Alan label="Dil" aciklama="Arayüzde kullanılacak dil.">
            <Sec value={form.dil} onChange={(v) => set('dil', v)} options={['Türkçe', 'English']} />
          </Alan>
          <Alan label="Saat dilimi" aciklama="Kayıt ve planlama saatlerinin gösterimi.">
            <Sec
              value={form.saatDilimi}
              onChange={(v) => set('saatDilimi', v)}
              options={['Europe/Istanbul (UTC+3)', 'Europe/London (UTC+0)', 'Europe/Berlin (UTC+1)']}
            />
          </Alan>
          <Alan label="Tarih biçimi" aciklama="Listelerde ve kayıt ayrıntılarında kullanılır.">
            <Sec
              value={form.tarihFormati}
              onChange={(v) => set('tarihFormati', v)}
              options={['GG.AA.YYYY', 'AA/GG/YYYY', 'YYYY-AA-GG']}
            />
          </Alan>
          <Alan label="Para birimi" aciklama="Tutar alanlarında kullanılacak varsayılan para birimi.">
            <Sec
              value={form.paraBirimi}
              onChange={(v) => set('paraBirimi', v)}
              options={['Türk Lirası (₺)', 'Euro (€)', 'Dolar ($)']}
            />
          </Alan>
        </div>
      </AyarBolum>

      <AyarBolum
        baslik="Görünüm ve kullanım"
        aciklama="Arayüzün görünümünü ve liste varsayılanlarını belirleyin."
      >
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
          <Alan label="Tema" aciklama="Sistem tercihini izleyebilir veya görünümü sabitleyebilirsiniz.">
            <Sec value={form.tema} onChange={(v) => set('tema', v)} options={['Sistem', 'Açık', 'Koyu']} />
          </Alan>
          <Alan label="Varsayılan sayfa boyutu" aciklama="Tablo listelerinde ilk açılışta gösterilecek kayıt sayısı.">
            <Sec value={form.sayfaBoyu} onChange={(v) => set('sayfaBoyu', v)} options={['Otomatik', '8', '15', '25']} />
          </Alan>
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/[.045] p-3.5">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Tema tercihi kaydedildiğinde uygulamanın tamamına uygulanır. Diğer tercihler bu çalışma alanı için saklanır.
          </p>
        </div>
      </AyarBolum>

      <AyarBolum baslik="Tercih durumu" aciklama="Değişiklikler kaydedildiğinde çalışma alanına uygulanır.">
        <Satir
          label={degisti ? 'Kaydedilmemiş değişiklikler' : 'Tüm tercihler güncel'}
          aciklama={degisti ? 'Seçimleriniz henüz kaydedilmedi.' : 'Bu sayfada bekleyen değişiklik bulunmuyor.'}
        >
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            degisti
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
          )}>
            {degisti ? <InfoIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
            {degisti ? 'Bekliyor' : 'Güncel'}
          </span>
        </Satir>
      </AyarBolum>
    </div>
  )
}
