import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@saglik/components/ui/button'
import { Input } from '@saglik/components/ui/input'
import { Alan, Sec } from '@saglik/components/form-bits'
import { AyarBaslik, AyarBolum, Satir, Toggle, FormGrid } from '@saglik/components/ayarlar/settings-bits'
import { useAyarlarStore } from '@saglik/stores/ayarlar-store'
import { useAuthStore } from '@saglik/stores/auth-store'

export default function BelgelerPage() {
  const { belge, belgeKaydet, logEkle } = useAyarlarStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState(belge)
  const degisti = JSON.stringify(form) !== JSON.stringify(belge)

  return (
    <div className="max-w-3xl">
      <AyarBaslik
        baslik="Belge ve PDF Ayarları"
        aciklama="Raporlarda ve oluşturulan belgelerde kullanılan marka, üstbilgi/altbilgi ve sayfa ayarları."
        aksiyon={
          <Button
            size="sm"
            disabled={!degisti}
            onClick={() => {
              belgeKaydet(form)
              logEkle({ tarih: new Date().toISOString(), kullanici: user?.username ?? 'sistem', islem: 'Belge ayarları güncellendi', kayit: 'Belge şablonu' })
              toast.success('Belge ayarları kaydedildi')
            }}
          >
            Kaydet
          </Button>
        }
      />
      <AyarBolum baslik="Marka" aciklama="Belgelerde görünen logo, imza ve kaşe görsel ayarları.">
        <FormGrid>
          <Alan label="Logo dosyası">
            <Input value={form.logoNotu} onChange={(e) => setForm({ ...form, logoNotu: e.target.value })} />
          </Alan>
          <Alan label="Belge numara öneki" aciklama="Yeni belge numaralarının başına eklenir (örn. TKL-2026-000001).">
            <Input value={form.sertifikaOnEk} onChange={(e) => setForm({ ...form, sertifikaOnEk: e.target.value })} />
          </Alan>
        </FormGrid>
        <div className="mt-2 divide-y divide-border/50">
          <Satir label="İmza göster" aciklama="Oluşturulan belgelerde yetkili imza alanı bulunsun.">
            <Toggle checked={form.imzaGoster} onChange={(v) => setForm({ ...form, imzaGoster: v })} />
          </Satir>
          <Satir label="Kaşe göster" aciklama="Belge altına kurum kaşesi yerleştir.">
            <Toggle checked={form.kaseGoster} onChange={(v) => setForm({ ...form, kaseGoster: v })} />
          </Satir>
        </div>
      </AyarBolum>
      <AyarBolum baslik="Sayfa Düzeni">
        <FormGrid>
          <Alan label="Sayfa boyutu">
            <Sec value={form.sayfaBoyutu} onChange={(v) => setForm({ ...form, sayfaBoyutu: v })} options={['A4', 'A5', 'Letter']} />
          </Alan>
          <Alan label="Yazı tipi">
            <Sec value={form.font} onChange={(v) => setForm({ ...form, font: v })} options={['Geist', 'Inter', 'Arial']} />
          </Alan>
        </FormGrid>
        <div className="mt-3 space-y-3">
          <Alan label="Üstbilgi metni">
            <Input value={form.ustbilgi} onChange={(e) => setForm({ ...form, ustbilgi: e.target.value })} />
          </Alan>
          <Alan label="Altbilgi metni">
            <Input value={form.altbilgi} onChange={(e) => setForm({ ...form, altbilgi: e.target.value })} />
          </Alan>
        </div>
        <div className="mt-2">
          <Satir label="Türkçe karakter desteği" aciklama="PDF oluştururken UTF-8/Türkçe karakter setini kullan.">
            <Toggle checked={form.trKarakter} onChange={(v) => setForm({ ...form, trKarakter: v })} />
          </Satir>
        </div>
      </AyarBolum>
    </div>
  )
}
