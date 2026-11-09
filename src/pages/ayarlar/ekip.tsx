import { Link } from 'react-router'
import { ArrowUpRightIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AyarBaslik, AyarBolum } from '@/components/ayarlar/settings-bits'
import { adSoyad } from '@/data/ekip'
import { useEkipStore } from '@/stores/ekip-store'

/** Personel kayıtları — asıl yönetim Ekip modülündedir; bu sayfa hızlı erişim ve hesap ilişkisi içindir. */
export default function EkipAyarlarPage() {
  const { uyeler, hesaplar, gorevlendirmeler } = useEkipStore()

  return (
    <div>
      <AyarBaslik
        baslik="Ekip ve Personel"
        aciklama="Personel kayıtları Ekip modülünde merkezi olarak yönetilir. Buradan personel–hesap ilişkilerini izleyebilirsiniz."
        aksiyon={
          <Button size="sm" variant="outline" render={<Link to="/panel/ekip" />}>
            Ekip modülüne git <ArrowUpRightIcon className="size-3.5" />
          </Button>
        }
      />
      <AyarBolum baslik={`Personel Kayıtları (${uyeler.length})`}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b text-left text-[11px] text-muted-foreground">
              {['Personel', 'Görev', 'Durum', 'Kullanıcı hesabı', 'Aktif görevlendirme'].map((h) => (
                <th key={h} className="px-1 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uyeler.map((u) => {
              const hesap = hesaplar.find((h) => h.personelId === u.id)
              const grv = gorevlendirmeler.filter((g) => g.personelId === u.id && g.durum === 'Aktif').length
              return (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="py-2 pr-2">
                    <Link to={`/panel/ekip/${u.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                      {adSoyad(u)}
                    </Link>
                  </td>
                  <td className="py-2 pr-2 text-muted-foreground">{u.gorev}</td>
                  <td className="py-2 pr-2">
                    <Badge variant="secondary" className="text-[10.5px]">{u.durum}</Badge>
                  </td>
                  <td className="py-2 pr-2 text-[11.5px]">
                    {hesap ? (
                      <span className="text-muted-foreground">@{hesap.kullaniciAdi} · {hesap.durum}</span>
                    ) : (
                      <span className="text-muted-foreground">Hesap yok</span>
                    )}
                  </td>
                  <td className="py-2 text-[11.5px] text-muted-foreground">{grv} firma</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </AyarBolum>
    </div>
  )
}
