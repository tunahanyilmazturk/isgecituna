import { Link } from 'react-router'
import { useFirmaStore } from '@saglik/stores/saglik-stores'
import { cn } from '@saglik/lib/utils'

/** Firma unvanını, kayıtlı firmanın detay sayfasına giden bağlantı olarak gösterir (satır tıklamasını engeller). */
export function FirmaBaglantisi({ unvan, className }: { unvan: string; className?: string }) {
  const firma = useFirmaStore((s) => s.kayitlar.find((f) => f.unvan === unvan))
  if (!firma) return <span className={className}>{unvan}</span>
  return (
    <Link
      to={`/panel/firmalar/${firma.id}`}
      onClick={(e) => e.stopPropagation()}
      className={cn('hover:text-amber-700 hover:underline dark:hover:text-amber-400', className)}
    >
      {unvan}
    </Link>
  )
}
