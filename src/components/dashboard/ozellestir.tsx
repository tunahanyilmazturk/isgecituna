/* Dashboard özelleştirme — widget göster/gizle ve sıralama; tercihler persist edilir */
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon, RotateCcwIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ANA_WIDGETLAR, useDashboardStore, YAN_WIDGETLAR, type WidgetId } from '@/stores/dashboard-store'
import { cn } from '@/lib/utils'

function Grup({ baslik, grup, liste }: { baslik: string; grup: 'ana' | 'yan'; liste: readonly { id: string; ad: string }[] }) {
  const { gizli, anaSira, yanSira, widgetGoster, widgetTasi } = useDashboardStore()
  const sira = grup === 'ana' ? anaSira : yanSira
  const sirali = sira.map((id) => liste.find((l) => l.id === id)).filter(Boolean) as { id: string; ad: string }[]

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{baslik}</p>
      <div className="space-y-1">
        {sirali.map((w, i) => {
          const gizliMi = gizli.includes(w.id as WidgetId)
          return (
            <div key={w.id} className={cn('flex items-center gap-1 rounded-xl border px-3 py-2', gizliMi && 'opacity-55')}>
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{w.ad}</p>
              <button
                onClick={() => widgetTasi(grup, w.id, -1)}
                disabled={i === 0}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                title="Yukarı taşı"
              >
                <ArrowUpIcon className="size-3.5" />
              </button>
              <button
                onClick={() => widgetTasi(grup, w.id, 1)}
                disabled={i === sirali.length - 1}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                title="Aşağı taşı"
              >
                <ArrowDownIcon className="size-3.5" />
              </button>
              <button
                onClick={() => widgetGoster(w.id as WidgetId, gizliMi)}
                className={cn('rounded-md p-1.5 transition-colors', gizliMi ? 'text-muted-foreground hover:bg-muted' : 'text-amber-500 hover:bg-amber-500/10')}
                title={gizliMi ? 'Göster' : 'Gizle'}
              >
                {gizliMi ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function OzellestirDrawer({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const varsayilan = useDashboardStore((s) => s.varsayilan)
  return (
    <Sheet open={acik} onOpenChange={(v) => !v && kapat()}>
      <SheetContent className="w-[340px] gap-0 p-0">
        <SheetHeader className="border-b p-5 pb-4">
          <SheetTitle>Dashboard'u özelleştir</SheetTitle>
          <SheetDescription>
            Widget'ları gizleyebilir veya sıralarını değiştirebilirsiniz. Tercihleriniz bu cihazda saklanır.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <Grup baslik="Ana alan" grup="ana" liste={ANA_WIDGETLAR} />
          <Grup baslik="Yan panel" grup="yan" liste={YAN_WIDGETLAR} />
        </div>
        <div className="border-t p-4">
          <button
            onClick={varsayilan}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcwIcon className="size-3.5" /> Varsayılan düzene dön
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
