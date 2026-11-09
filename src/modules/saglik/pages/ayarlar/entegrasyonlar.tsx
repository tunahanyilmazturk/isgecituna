import { AlertTriangleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@saglik/components/ui/badge'
import { Button } from '@saglik/components/ui/button'
import { AyarBaslik, AyarBolum } from '@saglik/components/ayarlar/settings-bits'
import type { Entegrasyon } from '@saglik/data/ayarlar'
import { useAyarlarStore } from '@saglik/stores/ayarlar-store'
import { useAuthStore } from '@saglik/stores/auth-store'
import { cn } from '@saglik/lib/utils'

const DURUM_RENK: Record<Entegrasyon['durum'], string> = {
  'Bağlı Değil': 'bg-zinc-500/10 text-zinc-500',
  'Test Modu': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Yapılandırma Bekliyor': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
}

export default function EntegrasyonlarPage() {
  const { entegrasyonlar, entegrasyonDurum, logEkle } = useAyarlarStore()
  const { user } = useAuthStore()

  return (
    <div className="max-w-3xl">
      <AyarBaslik
        baslik="Entegrasyonlar"
        aciklama="Dış sistem bağlantıları. Resmî API yetkilendirmesi olmadan gerçek bağlantı sağlanmaz — test modu ayrı tutulur."
      />
      <AyarBolum baslik="Bağlantılar">
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-[12px] text-amber-700 dark:text-amber-400">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          e-Nabız için resmî yetkilendirme henüz sağlanmadı. Kayıtlar manuel/doğrulanmış
          dosya bazlı tutulur; "Bağlı" gösterimi yalnızca gerçek API doğrulaması sonrası açılır.
        </div>
        <div className="space-y-3">
          {entegrasyonlar.map((e) => (
            <div key={e.key} className="rounded-lg border px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold">{e.ad}</span>
                    <Badge variant="secondary" className={cn('text-[10.5px]', DURUM_RENK[e.durum])}>
                      {e.durum}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">{e.aciklama}</div>
                </div>
                {e.durum === 'Bağlı Değil' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      entegrasyonDurum(e.key, 'Test Modu')
                      logEkle({ tarih: new Date().toISOString(), kullanici: user?.username ?? 'sistem', islem: 'Entegrasyon test moduna alındı', kayit: e.ad })
                      toast.info(`${e.ad} test moduna alındı — gerçek bağlantı yetkilendirme gerektirir`)
                    }}
                  >
                    Test moduna al
                  </Button>
                ) : e.durum === 'Test Modu' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      entegrasyonDurum(e.key, 'Bağlı Değil')
                      toast.info(`${e.ad} test modu kapatıldı`)
                    }}
                  >
                    Test modunu kapat
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => toast.info('Yapılandırma sihirbazı yakında — SMTP kimlik bilgileri gerekiyor.')}>
                    Yapılandır
                  </Button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {e.alanlar.map((a) => (
                  <div key={a.k} className="rounded-md bg-muted/40 px-2.5 py-1.5">
                    <div className="text-[10px] text-muted-foreground">{a.k}</div>
                    <div className="text-[11.5px] font-medium">{a.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AyarBolum>
    </div>
  )
}
