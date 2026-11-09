import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { SearchIcon } from 'lucide-react'
import { navSections } from '@saglik/components/nav-items'
import { useEkipmanStore, useTaramaStore, useTeklifStore, useTestStore } from '@saglik/stores/saglik-stores'
import { formatKisa } from '@saglik/lib/date'
import { cn } from '@saglik/lib/utils'

type Item = { label: string; hint?: string; to: string; group: string }

export function TopbarSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)
  const teklifler = useTeklifStore((s) => s.kayitlar)
  const taramalar = useTaramaStore((s) => s.kayitlar)
  const ekipmanlar = useEkipmanStore((s) => s.kayitlar)
  const testler = useTestStore((s) => s.kayitlar)

  const items: Item[] = useMemo(
    () => [
      ...navSections.flatMap((s) => s.items).map((i) => ({ label: i.label, to: i.to, group: 'Sayfalar' })),
      ...teklifler.map((t) => ({ label: `${t.no} — ${t.firma}`, hint: `${t.hizmet} · ${t.durum}`, to: '/panel/teklifler', group: 'Teklifler' })),
      ...taramalar.map((t) => ({ label: `${t.firma}`, hint: `${formatKisa(t.tarih)} · ${t.hizmet} · ${t.durum}`, to: '/panel/taramalar', group: 'Taramalar' })),
      ...ekipmanlar.map((e) => ({ label: e.ad, hint: `${e.seriNo} · ${e.durum}`, to: '/panel/ekipmanlar', group: 'Ekipmanlar' })),
      ...testler.map((t) => ({ label: t.ad, hint: `${t.kategori} · ${t.fiyat.toLocaleString('tr-TR')} ₺`, to: '/panel/testler', group: 'Testler' })),
    ],
    [teklifler, taramalar, ekipmanlar, testler],
  )

  const openPalette = () => {
    setQ('')
    setSel(0)
    setOpen(true)
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => {
          if (!o) {
            setQ('')
            setSel(0)
          }
          return !o
        })
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const results = useMemo(() => {
    const t = q.toLocaleLowerCase('tr').trim()
    const filtered = t
      ? items.filter((i) => `${i.label} ${i.hint ?? ''}`.toLocaleLowerCase('tr').includes(t))
      : items.filter((i) => i.group === 'Sayfalar')
    return filtered.slice(0, 9)
  }, [q, items])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[sel]) {
      go(results[sel].to)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Ara"
        onClick={openPalette}
        className="hidden h-8 w-56 items-center gap-2 rounded-lg border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <SearchIcon className="size-3.5" />
        <span className="flex-1 text-left">Ara…</span>
        <kbd className="rounded border bg-background px-1 text-[10px] font-medium">⌘K</kbd>
      </button>
      <button
        type="button"
        aria-label="Ara"
        onClick={openPalette}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
      >
        <SearchIcon className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative mx-auto mt-[14vh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-xl border bg-popover shadow-2xl">
            <div className="flex items-center gap-2.5 border-b px-4">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setSel(0)
                }}
                onKeyDown={onKey}
                placeholder="Sayfa, teklif veya tarama ara…"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
            <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
              {results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  "{q}" için sonuç bulunamadı
                </p>
              )}
              {results.map((r, i) => {
                const showGroup = i === 0 || results[i - 1].group !== r.group
                return (
                  <div key={`${r.group}-${r.label}-${i}`}>
                    {showGroup && (
                      <p className="px-2.5 pt-2 pb-1 text-xs font-medium text-muted-foreground first:pt-1">
                        {r.group}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => go(r.to)}
                      onMouseEnter={() => setSel(i)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm',
                        i === sel ? 'bg-accent' : '',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{r.label}</span>
                      {r.hint && (
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {r.hint}
                        </span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
