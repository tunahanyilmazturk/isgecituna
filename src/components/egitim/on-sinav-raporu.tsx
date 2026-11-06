import { useMemo } from 'react'
import { useEgitimlerStore, aktifSurum } from '@/stores/egitimler-store'
import type { Egitim } from '@/data/egitimler'
import { cn } from '@/lib/utils'

const ortalama = (liste: number[]) => (liste.length ? Math.round(liste.reduce((t, x) => t + x, 0) / liste.length) : null)

/**
 * Eğitim için ön sınav raporu: katılımcıların başlangıç seviyesi, eğitim sonu sınavıyla karşılaştırma
 * ve her sorunun doğru yanıt oranı (en çok eksik konular en üstte).
 */
export function OnSinavRaporu({ egitim }: { egitim: Egitim }) {
  const ilerlemeler = useEgitimlerStore((s) => s.ilerlemeler)
  const surum = aktifSurum(egitim)
  const onSinav = surum.onSinav

  const rapor = useMemo(() => {
    const kayitlar = ilerlemeler.filter((i) => i.egitimId === egitim.id && i.surumId === surum.id && i.onSinav)
    const onPuanlar = kayitlar.map((k) => k.onSinav!.puan)
    const sonPuanlar = kayitlar
      .map((k) => k.denemeler.slice(-1)[0]?.puan)
      .filter((p): p is number => typeof p === 'number')
    const sorular = (onSinav?.sorular ?? []).map((s) => {
      const dogru = kayitlar.filter((k) => k.onSinav?.soruSonuc[s.id]).length
      return {
        id: s.id,
        soru: s.soru,
        oran: kayitlar.length ? Math.round((dogru / kayitlar.length) * 100) : null,
      }
    })
    return {
      katilimci: kayitlar.length,
      onOrtalama: ortalama(onPuanlar),
      sonOrtalama: ortalama(sonPuanlar),
      sonSayi: sonPuanlar.length,
      sorular: [...sorular].sort((a, b) => (a.oran ?? 101) - (b.oran ?? 101)),
    }
  }, [ilerlemeler, egitim.id, surum.id, onSinav])

  if (!onSinav) {
    return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Bu eğitimde ön sınav tanımlı değil.</p>
  }

  const fark = rapor.onOrtalama !== null && rapor.sonOrtalama !== null ? rapor.sonOrtalama - rapor.onOrtalama : null

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Ön sınava giren', deger: rapor.katilimci, ek: 'katılımcı' },
          { label: 'Ön sınav ortalaması', deger: rapor.onOrtalama !== null ? `%${rapor.onOrtalama}` : '—', ek: 'başlangıç düzeyi' },
          { label: 'Eğitim sonu ortalaması', deger: rapor.sonOrtalama !== null ? `%${rapor.sonOrtalama}` : '—', ek: `${rapor.sonSayi} sınav` },
          { label: 'Gelişim', deger: fark !== null ? `${fark > 0 ? '+' : ''}${fark} puan` : '—', ek: 'son − ön' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <p className="text-[11px] text-muted-foreground">{k.label}</p>
            <p className={cn('mt-1 text-xl font-semibold tabular-nums', k.label === 'Gelişim' && fark !== null && fark < 0 && 'text-red-500', k.label === 'Gelişim' && fark !== null && fark > 0 && 'text-emerald-600 dark:text-emerald-400')}>{k.deger}</p>
            <p className="text-[11px] text-muted-foreground">{k.ek}</p>
          </div>
        ))}
      </div>

      {rapor.katilimci === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Henüz kimse ön sınava girmedi. Sonuçlar, katılımcılar eğitimi açtıkça burada görünür.
        </p>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Soru bazında doğru yanıt oranı (ön sınav)</h3>
            <p className="text-[11px] text-muted-foreground">En düşük oranlı sorular en üstte: katılımcıların en çok eksik olduğu konular.</p>
          </div>
          <ol className="divide-y">
            {rapor.sorular.map((s, i) => (
              <li key={s.id} className="flex items-start gap-3 px-4 py-2.5">
                <span className="mt-0.5 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-5">{s.soru}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', (s.oran ?? 0) < 50 ? 'bg-red-500' : (s.oran ?? 0) < 75 ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${s.oran ?? 0}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{s.oran !== null ? `%${s.oran}` : '—'}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
