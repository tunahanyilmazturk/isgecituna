import { useState } from 'react'
import { DownloadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@saglik/components/ui/button'
import { Alan, Sec } from '@saglik/components/form-bits'
import { AyarBaslik, AyarBolum, Satir, Toggle } from '@saglik/components/ayarlar/settings-bits'
import { useAyarlarStore } from '@saglik/stores/ayarlar-store'
import { useEkipStore } from '@saglik/stores/ekip-store'
import { useFirmaStore } from '@saglik/stores/saglik-stores'
import { useTaramaStore, useTeklifStore } from '@saglik/stores/saglik-stores'
import { teklifTutari } from '@saglik/data/saglik'
import { useAuthStore } from '@saglik/stores/auth-store'
import { xlsxDosyaAdi, xlsxIndir, type ExcelSayfaDef } from '@saglik/lib/excel'

export default function VeriPage() {
  const { uyeler, hesaplar } = useEkipStore()
  const firmalar = useFirmaStore((s) => s.kayitlar)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const { loglar, logEkle } = useAyarlarStore()
  const { user } = useAuthStore()
  const [saklama, setSaklama] = useState('5 yıl')
  const [yedek, setYedek] = useState(true)

  const aktar = (tur: 'firmalar' | 'ekip' | 'teklifler' | 'taramalar' | 'loglar') => {
    let parca: string = tur
    let sayfa: ExcelSayfaDef | undefined
    if (tur === 'firmalar') {
      parca = 'Firma_Kayitlari'
      sayfa = {
        ad: 'Firmalar',
        baslik: 'Firma Kayıtları',
        altBilgi: 'Ayarlar · veri dışa aktarımı',
        kolonlar: [
          { label: 'Kod', minGenislik: 10 },
          { label: 'Unvan', minGenislik: 28, wrap: true },
          { label: 'Vergi No', minGenislik: 14 },
          { label: 'İl', minGenislik: 12 },
          { label: 'Durum', minGenislik: 12 },
        ],
        satirlar: firmalar.map((f) => [f.id, f.unvan, f.vergiNo, f.il, f.durum]),
      }
    }
    if (tur === 'ekip') {
      parca = 'Ekip_Kayitlari'
      sayfa = {
        ad: 'Ekip',
        baslik: 'Personel Kayıtları',
        altBilgi: 'Ayarlar · veri dışa aktarımı',
        kolonlar: [
          { label: 'ID', minGenislik: 10 },
          { label: 'Ad Soyad', minGenislik: 24 },
          { label: 'Görev', minGenislik: 24 },
          { label: 'Durum', minGenislik: 12 },
        ],
        satirlar: uyeler.map((u) => [u.id, `${u.ad} ${u.soyad}`, u.gorev, u.durum]),
      }
    }
    if (tur === 'teklifler') {
      parca = 'Teklif_Kayitlari'
      sayfa = {
        ad: 'Teklifler',
        baslik: 'Teklif Kayıtları',
        altBilgi: 'Ayarlar · veri dışa aktarımı',
        kolonlar: [
          { label: 'Teklif no', minGenislik: 16 },
          { label: 'Firma', minGenislik: 28, wrap: true },
          { label: 'Hizmet', minGenislik: 22 },
          { label: 'Kişi', minGenislik: 8 },
          { label: 'Toplam (₺)', minGenislik: 14 },
          { label: 'Tarih', tip: 'tarih' },
          { label: 'Durum', minGenislik: 12 },
        ],
        satirlar: teklifler.map((t) => [t.no, t.firma, t.hizmet, t.kisiSayisi, teklifTutari(t), t.tarih, t.durum]),
      }
    }
    if (tur === 'taramalar') {
      parca = 'Tarama_Kayitlari'
      sayfa = {
        ad: 'Taramalar',
        baslik: 'Tarama Kayıtları',
        altBilgi: 'Ayarlar · veri dışa aktarımı',
        kolonlar: [
          { label: 'Tarih', tip: 'tarih' },
          { label: 'Saat', minGenislik: 8 },
          { label: 'Firma', minGenislik: 28, wrap: true },
          { label: 'Hizmet', minGenislik: 22 },
          { label: 'Lokasyon', minGenislik: 22, wrap: true },
          { label: 'Planlanan', minGenislik: 10 },
          { label: 'Tamamlanan', minGenislik: 12 },
          { label: 'Durum', minGenislik: 12 },
        ],
        satirlar: taramalar.map((t) => [t.tarih, t.saat, t.firma, t.hizmet, t.lokasyon, t.kisiSayisi, t.tamamlanan, t.durum]),
      }
    }
    if (tur === 'loglar') {
      parca = 'Islem_Gecmisi'
      sayfa = {
        ad: 'İşlem Geçmişi',
        baslik: 'İşlem Geçmişi',
        altBilgi: 'Ayarlar · veri dışa aktarımı',
        kolonlar: [
          { label: 'ID', minGenislik: 10 },
          { label: 'Tarih', minGenislik: 20 },
          { label: 'Kullanıcı', minGenislik: 18 },
          { label: 'İşlem', minGenislik: 22, wrap: true },
          { label: 'Kayıt', minGenislik: 28, wrap: true },
        ],
        satirlar: loglar.map((l) => [l.id, l.tarih, l.kullanici, l.islem, l.kayit]),
      }
    }
    if (!sayfa) return
    const ad = xlsxDosyaAdi(parca)
    xlsxIndir(ad, [sayfa])
    logEkle({ tarih: new Date().toISOString(), kullanici: user?.username ?? 'sistem', islem: 'Dışa aktarım', kayit: ad })
    toast.success(`${ad} indirildi`)
  }

  return (
    <div className="max-w-3xl">
      <AyarBaslik
        baslik="Veri ve Dışa Aktarım"
        aciklama="Yetkiye bağlı veri dışa aktarımı, saklama politikaları ve yedekleme."
      />
      <AyarBolum baslik="Dışa Aktarım" aciklama="Modül verilerini Excel (.xlsx) olarak indirin. Hassas alanlar (TC, sağlık) yalnızca ilgili izne sahip kullanıcıların export'una dahil edilmelidir — backend denetimi gerektirir.">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['firmalar', `Firma kayıtları (${firmalar.length})`],
            ['ekip', `Personel kayıtları (${uyeler.length})`],
            ['teklifler', `Teklif kayıtları (${teklifler.length})`],
            ['taramalar', `Tarama kayıtları (${taramalar.length})`],
            ['loglar', `İşlem geçmişi (${loglar.length})`],
          ].map(([k, label]) => (
            <Button key={k} variant="outline" className="justify-start" onClick={() => aktar(k as 'firmalar')}>
              <DownloadIcon className="size-4" /> {label}
            </Button>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">{hesaplar.length} kullanıcı hesabı · export işlemleri işlem geçmişine yazılır.</div>
      </AyarBolum>
      <AyarBolum baslik="Saklama ve Yedekleme">
        <Alan label="Veri saklama süresi">
          <div className="w-56">
            <Sec value={saklama} onChange={setSaklama} options={['1 yıl', '3 yıl', '5 yıl', '10 yıl (yasal asgari)']} />
          </div>
        </Alan>
        <div className="mt-1 divide-y divide-border/50">
          <Satir label="Otomatik yedekleme" aciklama="Kayıtlar günlük olarak yedeklenir (backend servisi gerektirir).">
            <Toggle checked={yedek} onChange={setYedek} />
          </Satir>
          <Satir
            label="KVKK anonimleştirme"
            aciklama="Saklama süresi dolan kişisel veriler anonimleştirilir. Backend politikası gerektirir."
          >
            <Toggle checked={false} onChange={() => toast.info('Backend politikası gerektirir — henüz aktif değil.')} />
          </Satir>
        </div>
      </AyarBolum>
    </div>
  )
}
