import { Link } from 'react-router'
import { Button } from '@saglik/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-bold tracking-tight">404</p>
      <p className="text-muted-foreground">Aradığın sayfa bulunamadı.</p>
      <Link to="/panel">
        <Button variant="outline">Panele dön</Button>
      </Link>
    </div>
  )
}
