import { Badge } from '@/components/ui/badge'
import { AyarBaslik, AyarBolum, Toggle } from '@/components/ayarlar/settings-bits'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useAuthStore } from '@/stores/auth-store'

export default function IsAkisiPage() {
  const { otomasyonlar, otomasyonToggle, logEkle } = useAyarlarStore()
  const { user } = useAuthStore()

  return (
    <div className="max-w-3xl">
      <AyarBaslik
        baslik="İş Akışı ve Otomasyon"
        aciklama="Tarih ve olay bazlı otomatik işlemler. Kapalı kurallar çalışmaz; kayıt geçmişi korunur."
      />
      <AyarBolum baslik="Otomasyon Kuralları">
        <div className="space-y-2">
          {otomasyonlar.map((o) => (
            <div key={o.id} className="flex items-center gap-4 rounded-lg border px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{o.ad}</span>
                  <Badge variant="secondary" className="text-[10px]">{o.tetikleyici}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{o.islem}</Badge>
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{o.aciklama}</div>
              </div>
              <Toggle
                checked={o.aktif}
                onChange={() => {
                  otomasyonToggle(o.id)
                  logEkle({
                    tarih: new Date().toISOString(),
                    kullanici: user?.username ?? 'sistem',
                    islem: 'Otomasyon kuralı güncellendi',
                    kayit: o.ad,
                    eski: o.aktif ? 'Aktif' : 'Kapalı',
                    yeni: o.aktif ? 'Kapalı' : 'Aktif',
                  })
                }}
              />
            </div>
          ))}
        </div>
      </AyarBolum>
    </div>
  )
}
