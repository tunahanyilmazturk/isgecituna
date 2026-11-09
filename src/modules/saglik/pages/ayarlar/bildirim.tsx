import { AyarBaslik, AyarBolum } from '@saglik/components/ayarlar/settings-bits'
import { Toggle } from '@saglik/components/ayarlar/settings-bits'
import { useAyarlarStore } from '@saglik/stores/ayarlar-store'

export default function BildirimPage() {
  const { bildirimler, bildirimAyarla } = useAyarlarStore()

  return (
    <div className="max-w-3xl">
      <AyarBaslik
        baslik="Bildirim Ayarları"
        aciklama="Bildirim türlerini ve kanallarını ayrı ayrı yönetin. E-posta/SMS kanalları Entegrasyonlar sayfasında yapılandırılır."
      />
      <AyarBolum baslik="Bildirim Türleri" aciklama="Her bildirim türü için uygulama içi, e-posta ve SMS kanallarını seçin.">
        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-[1fr_88px_88px_88px] items-center gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground">
            <span>Bildirim türü</span>
            <span className="text-center">Uygulama</span>
            <span className="text-center">E-posta</span>
            <span className="text-center">SMS</span>
          </div>
          {bildirimler.map((b) => (
            <div key={b.tur} className="grid grid-cols-[1fr_88px_88px_88px] items-center gap-2 border-b border-border/50 px-4 py-2.5 last:border-0">
              <span className="text-[12.5px] font-medium">{b.tur}</span>
              {(['uygulama', 'eposta', 'sms'] as const).map((kanal) => (
                <span key={kanal} className="flex justify-center">
                  <Toggle checked={b[kanal]} onChange={(v) => bildirimAyarla(b.tur, kanal, v)} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </AyarBolum>
    </div>
  )
}
