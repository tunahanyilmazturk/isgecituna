import { useState } from 'react'
import { toast } from 'sonner'
import { MonitorIcon, ShieldAlertIcon, SmartphoneIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alan, Sec } from '@/components/form-bits'
import { AyarBaslik, AyarBolum, Satir, Toggle } from '@/components/ayarlar/settings-bits'
import { hesapGorunenAd } from '@/data/ekip'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export default function GuvenlikPage() {
  const { guvenlik, guvenlikKaydet, oturumlar, oturumSonlandir, basarisizlar, logEkle } = useAyarlarStore()
  const { uyeler, hesaplar } = useEkipStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState(guvenlik)
  const degisti = JSON.stringify(form) !== JSON.stringify(guvenlik)

  const aktifOturumlar = oturumlar.filter((o) => o.aktif)

  return (
    <div className="max-w-3xl">
      <AyarBaslik
        baslik="Güvenlik ve Oturumlar"
        aciklama="Şifre politikası, oturum süreleri ve aktif cihaz yönetimi."
        aksiyon={
          <Button
            size="sm"
            disabled={!degisti}
            onClick={() => {
              guvenlikKaydet(form)
              logEkle({ tarih: new Date().toISOString(), kullanici: user?.username ?? 'sistem', islem: 'Güvenlik ayarları güncellendi', kayit: 'Güvenlik politikası' })
              toast.success('Güvenlik ayarları kaydedildi')
            }}
          >
            Kaydet
          </Button>
        }
      />

      <AyarBolum baslik="Şifre Politikası">
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          <Alan label="Minimum uzunluk">
            <Input
              type="number"
              min={6}
              value={form.minSifre}
              onChange={(e) => setForm({ ...form, minSifre: Number(e.target.value) })}
            />
          </Alan>
          <Alan label="Oturum süresi">
            <Sec value={form.oturumSuresi} onChange={(v) => setForm({ ...form, oturumSuresi: v })} options={['1 saat', '4 saat', '8 saat', '24 saat']} />
          </Alan>
          <Alan label="Başarısız giriş limiti">
            <Input
              type="number"
              min={3}
              value={form.basarisizLimit}
              onChange={(e) => setForm({ ...form, basarisizLimit: Number(e.target.value) })}
            />
          </Alan>
        </div>
        <div className="mt-3 divide-y divide-border/50">
          <Satir label="Karmaşık şifre zorunluluğu" aciklama="Büyük/küçük harf, rakam ve özel karakter gerektir.">
            <Toggle checked={form.karmasikSifre} onChange={(v) => setForm({ ...form, karmasikSifre: v })} />
          </Satir>
          <Satir label="İki adımlı doğrulama (2FA)" aciklama="Girişte SMS/e-posta doğrulama kodu iste. E-posta entegrasyonu gerektirir.">
            <Toggle checked={form.ikiAdim} onChange={(v) => setForm({ ...form, ikiAdim: v })} />
          </Satir>
        </div>
      </AyarBolum>

      <AyarBolum baslik={`Aktif Oturumlar (${aktifOturumlar.length})`} aciklama="Kurumdaki tüm kullanıcıların aktif oturumları. Şüpheli oturumları sonlandırabilirsiniz.">
        <div className="space-y-2">
          {aktifOturumlar.map((o) => {
            const h = hesaplar.find((x) => x.id === o.hesapId)
            return (
              <div key={o.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                {o.cihaz.includes('iPhone') || o.cihaz.includes('Android') ? (
                  <SmartphoneIcon className="size-4 text-muted-foreground" />
                ) : (
                  <MonitorIcon className="size-4 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium">
                    {h ? hesapGorunenAd(h, uyeler) : o.hesapId} · {o.cihaz}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {o.tarayici} · {o.ip} · {o.konum} · son aktiflik {fmt(o.sonAktiflik)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive"
                  onClick={() => {
                    oturumSonlandir(o.id)
                    logEkle({ tarih: new Date().toISOString(), kullanici: user?.username ?? 'sistem', islem: 'Oturum sonlandırıldı', kayit: h?.kullaniciAdi ?? o.hesapId, ip: o.ip })
                    toast.success('Oturum sonlandırıldı')
                  }}
                >
                  Sonlandır
                </Button>
              </div>
            )
          })}
          {aktifOturumlar.length === 0 && <div className="text-[12.5px] text-muted-foreground">Aktif oturum yok.</div>}
        </div>
      </AyarBolum>

      <AyarBolum baslik={`Başarısız Giriş Denemeleri (${basarisizlar.length})`}>
        <div className="space-y-1.5">
          {basarisizlar.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2">
              <ShieldAlertIcon className="size-4 shrink-0 text-red-500" />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium">@{b.kullaniciAdi}</div>
                <div className="text-[11px] text-muted-foreground">{b.neden} · {b.ip}</div>
              </div>
              <Badge variant="secondary" className="text-[10px]">{fmt(b.tarih)}</Badge>
            </div>
          ))}
        </div>
      </AyarBolum>
    </div>
  )
}
