import { cn } from '@/lib/utils'

const band = (score: number) =>
  score >= 15
    ? 'bg-red-500/80'
    : score >= 10
      ? 'bg-amber-500/70'
      : score >= 5
        ? 'bg-yellow-500/40'
        : 'bg-emerald-500/40'

/** 5×5 İSG risk matrisi — satır şiddet 5→1, sütun olasılık 1→5; matrix[i][j] o hücredeki risk sayısı */
export function RiskMatrix({
  matrix,
  cellClassName = 'h-5',
  showCounts = false,
}: {
  matrix: number[][]
  cellClassName?: string
  showCounts?: boolean
}) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {matrix.flatMap((row, s) =>
        row.map((count, o) => {
          const score = (5 - s) * (o + 1)
          return (
            <span
              key={`${s}-${o}`}
              title={`Şiddet ${5 - s} × Olasılık ${o + 1} = ${score} · ${count} risk`}
              className={cn(
                'flex items-center justify-center rounded-[3px] text-[11px] font-semibold',
                score >= 15 ? 'text-white' : 'text-zinc-950/80 dark:text-white/85',
                band(score),
                cellClassName,
              )}
            >
              {showCounts && count > 0 ? count : null}
            </span>
          )
        }),
      )}
    </div>
  )
}
