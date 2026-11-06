import { useState } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AyarBaslik } from '@/components/ayarlar/settings-bits'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

export default function TanimlarPage() {
  const { tanimlar, tanimEkle, tanimSil, logEkle } = useAyarlarStore()
  const { user } = useAuthStore()
  const [secili, setSecili] = useState(tanimlar[0]?.key ?? '')
  const [yeni, setYeni] = useState('')
  const grup = tanimlar.find((t) => t.key === secili)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AyarBaslik
        baslik="Tanımlar ve Kataloglar"
        aciklama="Formlardaki seçenek listeleri. Değişiklikler yeni kayıtlara uygulanır; geçmiş kayıtlar etkilenmez."
      />
      <div className="flex min-h-0 flex-1 border-t">
        {/* Katalog grupları */}
        <div className="w-56 shrink-0 overflow-y-auto border-r p-2">
          {tanimlar.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSecili(t.key)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12.5px] font-medium transition-colors',
                secili === t.key ? 'bg-zinc-100 dark:bg-zinc-800' : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              <span className="truncate">{t.label}</span>
              <span className="text-[10.5px] text-muted-foreground">{t.degerler.length}</span>
            </button>
          ))}
        </div>

        {/* Seçili katalog */}
        <div className="min-w-0 flex-1 overflow-y-auto p-5">
          {grup ? (
            <>
              <div className="mb-4">
                <h2 className="text-[14px] font-semibold">{grup.label}</h2>
                <p className="text-[11.5px] text-muted-foreground">{grup.aciklama}</p>
              </div>
              <div className="mb-4 flex gap-2">
                <Input
                  value={yeni}
                  onChange={(e) => setYeni(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && yeni.trim()) {
                      tanimEkle(grup.key, yeni.trim())
                      setYeni('')
                    }
                  }}
                  placeholder="Yeni değer ekle…"
                  className="h-8 w-72"
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    if (!yeni.trim()) return
                    tanimEkle(grup.key, yeni.trim())
                    setYeni('')
                  }}
                >
                  <PlusIcon className="size-3.5" /> Ekle
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grup.degerler.map((d) => (
                  <Badge key={d} variant="secondary" className="gap-1.5 py-1 text-[12px]">
                    {d}
                    <button
                      type="button"
                      aria-label={`${d} kaldır`}
                      onClick={() => {
                        tanimSil(grup.key, d)
                        logEkle({ tarih: new Date().toISOString(), kullanici: user?.username ?? 'sistem', islem: 'Katalog değeri kaldırıldı', kayit: `${grup.label} · ${d}` })
                        toast.info(`"${d}" kaldırıldı — geçmiş kayıtlar etkilenmez`)
                      }}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2Icon className="size-3" />
                    </button>
                  </Badge>
                ))}
                {grup.degerler.length === 0 && <span className="text-[12px] text-muted-foreground">Bu katalogda değer yok.</span>}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Katalog seçin.</div>
          )}
        </div>
      </div>
    </div>
  )
}
