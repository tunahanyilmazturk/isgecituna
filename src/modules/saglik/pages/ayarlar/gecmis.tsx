import { useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Input } from '@saglik/components/ui/input'
import { AyarBaslik } from '@saglik/components/ayarlar/settings-bits'
import { useAyarlarStore } from '@saglik/stores/ayarlar-store'

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })

export default function GecmisPage() {
  const { loglar } = useAyarlarStore()
  const [ara, setAra] = useState('')

  const liste = useMemo(
    () =>
      loglar.filter((l) => {
        const q = ara.toLowerCase()
        return !q || l.islem.toLowerCase().includes(q) || l.kayit.toLowerCase().includes(q) || l.kullanici.toLowerCase().includes(q)
      }),
    [loglar, ara],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AyarBaslik
        baslik="İşlem Geçmişi"
        aciklama="Sistemdeki önemli işlemlerin denetim kaydı. Loglar yetkisiz kullanıcılar tarafından değiştirilemez."
      />
      <div className="flex items-center gap-2 border-t px-6 py-3">
        <div className="relative w-72">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="İşlem, kayıt veya kullanıcı ara…" className="h-8 pl-8" />
        </div>
        <span className="ml-auto text-[11px] text-muted-foreground">{liste.length} kayıt</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto border-t">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b text-left text-[11px] text-muted-foreground">
              {['Tarih', 'Kullanıcı', 'İşlem', 'Kayıt', 'Değişiklik', 'IP'].map((h) => (
                <th key={h} className="px-4 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liste.map((l) => (
              <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{fmt(l.tarih)}</td>
                <td className="px-4 py-2 font-medium">@{l.kullanici}</td>
                <td className="px-4 py-2">{l.islem}</td>
                <td className="px-4 py-2 text-muted-foreground">{l.kayit}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {l.eski && l.yeni ? `${l.eski} → ${l.yeni}` : '—'}
                </td>
                <td className="px-4 py-2 font-mono text-[10.5px] text-muted-foreground">{l.ip ?? '—'}</td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Kayıt bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
