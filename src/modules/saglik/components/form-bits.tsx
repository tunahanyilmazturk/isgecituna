import {
  ChevronDownIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
} from 'lucide-react'
import { Checkbox } from '@saglik/components/ui/checkbox'
export const selectCls = 'h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

export function Alan({
  label,
  children,
  className,
  aciklama,
}: {
  label: string
  children: React.ReactNode
  className?: string
  aciklama?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {aciklama && <p className="mt-1 text-xs text-muted-foreground/80">{aciklama}</p>}
    </div>
  )
}

export function Sec({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function Bolum({
  harf,
  baslik,
  children,
}: {
  harf: string
  baslik: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <span className="flex size-5 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-foreground">
          {harf}
        </span>
        {baslik}
      </h3>
      {children}
    </section>
  )
}

export function EkIkon({ tur }: { tur: string }) {
  if (tur === 'Fotoğraf') return <ImageIcon className="size-3.5" />
  if (tur === 'Video') return <VideoIcon className="size-3.5" />
  return <FileIcon className="size-3.5" />
}

export function CheckAlan({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors has-[[data-checked]]:border-amber-500/50 has-[[data-checked]]:bg-amber-500/5">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      {label}
    </label>
  )
}
