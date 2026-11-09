import { useState } from 'react'
import { NavLink, useParams } from 'react-router'
import { BookOpenIcon, MenuIcon, Settings2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { KATEGORILER, kategoriModulleri } from '@/data/rehber'
import type { RehberKapsam } from '@/data/rehber'
import { useIzin } from '@/lib/izin'
import { RehberAna } from './rehber-ana'
import { RehberModul } from './rehber-modul'
import { RehberSayfa } from './rehber-sayfa'

function RehberNav({ kapsam, kok, onNavigate }: { kapsam: RehberKapsam; kok: string; onNavigate?: () => void }) {
  const { modulId } = useParams()
  const izin = useIzin('ayarlar.tanim-yonet')
  const yonetimIzni = kapsam === 'panel' && izin
  return (
    <nav className="space-y-4">
      <NavLink
        to={kok}
        end
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
          !modulId ? 'bg-amber-500/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <BookOpenIcon className="size-4" /> Genel Bakış
      </NavLink>
      {KATEGORILER.map((k) => {
        const moduller = kategoriModulleri(k.id, kapsam)
        if (moduller.length === 0) return null
        return (
          <div key={k.id}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {k.ad}
            </p>
            <div className="space-y-0.5">
              {moduller.map((m) => (
                <NavLink
                  key={m.id}
                  to={`${kok}/${m.id}`}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    modulId === m.id
                      ? 'bg-amber-500/10 font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <m.ikon className="size-4 shrink-0" />
                  <span className="truncate">{m.ad}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )
      })}
      {yonetimIzni && (
        <NavLink
          to={`${kok}/yonetim`}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
            modulId === 'yonetim'
              ? 'bg-amber-500/10 font-medium text-foreground'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          <Settings2Icon className="size-4" /> İçerik Yönetimi
        </NavLink>
      )}
    </nav>
  )
}

/**
 * Kullanım Merkezi kabuğu — kapsam ('panel' | 'firma' | 'portal') ile içerik süzülür.
 * kok: '/panel/rehber' | '/firma/rehber' | '/portal/rehber'
 */
export function RehberApp({ kapsam, kok }: { kapsam: RehberKapsam; kok: string }) {
  const { modulId, rehberId } = useParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-w-0 flex-1 gap-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-4">
          <RehberNav kapsam={kapsam} kok={kok} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)}>
            <MenuIcon className="size-4" /> Rehber menüsü
          </Button>
        </div>
        {!modulId && <RehberAna kapsam={kapsam} kok={kok} />}
        {modulId && !rehberId && <RehberModul kapsam={kapsam} kok={kok} modulId={modulId} />}
        {modulId && rehberId && <RehberSayfa kapsam={kapsam} kok={kok} modulId={modulId} rehberId={rehberId} />}
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 overflow-y-auto p-3">
          <SheetHeader className="sr-only">
            <SheetTitle>Kullanım Merkezi menüsü</SheetTitle>
          </SheetHeader>
          <RehberNav kapsam={kapsam} kok={kok} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
