import { DownloadIcon, FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { boyutMetni, dosyaIndir, onizlenebilir, uzanti, type Evrak } from '@/stores/evraklar-store'

/** Evrak önizleme paneli — PDF ve görseller doğrudan gösterilir; diğer türler indirilir. */
export function EvrakOnizleme({ evrak, onKapat }: { evrak: Evrak | null; onKapat: () => void }) {
  return (
    <Sheet open={!!evrak} onOpenChange={(o) => !o && onKapat()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        {evrak && (
          <>
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle className="truncate text-base">{evrak.ad}</SheetTitle>
              <p className="text-xs text-muted-foreground">
                {evrak.kategori} · {uzanti(evrak.dosyaAdi)} · {boyutMetni(evrak.boyut)}
              </p>
            </SheetHeader>
            <div className="min-h-0 flex-1 bg-muted/30">
              {onizlenebilir(evrak.mime) ? (
                evrak.mime === 'application/pdf' ? (
                  <iframe title={evrak.ad} src={evrak.icerik} className="size-full border-0" />
                ) : (
                  <div className="flex size-full items-center justify-center overflow-auto p-4">
                    <img src={evrak.icerik} alt={evrak.ad} className="max-h-full max-w-full rounded-lg object-contain" />
                  </div>
                )
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <FileTextIcon className="size-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Bu dosya türü tarayıcıda önizlenemiyor</p>
                  <p className="max-w-xs text-xs text-muted-foreground">Dosyayı indirip kendi uygulamanızda açabilirsiniz.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end border-t px-5 py-3">
              <Button size="sm" onClick={() => dosyaIndir(evrak)}>
                <DownloadIcon /> İndir
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
