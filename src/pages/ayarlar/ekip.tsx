import { Link } from 'react-router'
import { ArrowUpRightIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AyarBaslik, AyarBolum } from '@/components/ayarlar/settings-bits'
import { adSoyad } from '@/data/ekip'
import { useEkipStore } from '@/stores/ekip-store'

/** Ekip kayıtları — asıl yönetim Ekip sayfasındadır; bu sayfa personel–hesap ilişkisini izler. */
export default function EkipAyarlarPage() {
  const uyeler = useEkipStore((s) => s.uyeler)
  const hesaplar = useEkipStore((s) => s.hesaplar)

  return (
    <div>
      <AyarBaslik
        baslik="Ekip ve Personel"
        aciklama="Ekip kayıtları Ekip sayfasında yönetilir. Buradan ekip üyeleri ile kullanıcı hesapları arasındaki ilişkiyi izleyebilirsiniz."
        aksiyon={
          <Button size="sm" variant="outline" render={<Link to="/panel/ekip" />}>
            Ekip sayfasına git <ArrowUpRightIcon className="size-3.5" />
          </Button>
        }
      />
      <AyarBolum baslik={`Ekip Kayıtları (${uyeler.length})`}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b text-left text-[11px] text-muted-foreground">
              {['Ekip üyesi', 'Görev', 'Durum', 'Kullanıcı hesabı'].map((h) => (
                <th key={h} className="px-1 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uyeler.map((u) => {
              const hesap = hesaplar.find((h) => h.personelId === u.id)
              return (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="py-2 pr-2 font-medium">{adSoyad(u)}</td>
                  <td className="py-2 pr-2">{u.gorev}</td>
                  <td className="py-2 pr-2">
                    <Badge variant="outline">{u.durum}</Badge>
                  </td>
                  <td className="py-2 pr-2">
                    {hesap ? <span className="tabular-nums">{hesap.kullaniciAdi}</span> : <span className="text-muted-foreground">Hesap yok</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </AyarBolum>
    </div>
  )
}
