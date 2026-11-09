import { useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OnSinavRaporu } from '@/components/egitim/on-sinav-raporu'
import { useEgitimlerStore } from '@/stores/egitimler-store'

/** Eğitim ön sınav raporu — yalnızca yönetim görünümü. */
export default function EgitimRaporPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const egitim = useEgitimlerStore((s) => s.egitimler.find((e) => e.id === id))

  if (!egitim) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Eğitim bulunamadı</p>
        <Button variant="outline" onClick={() => navigate('/panel/egitimler')}>
          <ArrowLeftIcon /> Eğitimlere dön
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col overflow-y-auto p-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" onClick={() => navigate('/panel/egitimler')}>
        <ArrowLeftIcon /> Eğitimler
      </Button>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">Ön sınav raporu</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">{egitim.baslik}</p>
      <div className="mt-5">
        <OnSinavRaporu egitim={egitim} />
      </div>
    </div>
  )
}
