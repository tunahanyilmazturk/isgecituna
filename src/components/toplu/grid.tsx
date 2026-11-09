import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { metinAyristir, TOPLU_KOLONLAR, type TopluKol, type TopluSatir } from '@/lib/toplu'

export interface Secim {
  r1: number
  c1: number
  r2: number
  c2: number
}
export interface HucreKonum {
  r: number
  c: number
}

export interface SatirBilgi {
  hatalar: Partial<Record<TopluKol, string>>
  durum: { label: string; cls: string }
}

interface GridProps {
  satirlar: TopluSatir[]
  secim: Secim | null
  onSecim: (s: Secim | null) => void
  aktif: HucreKonum | null
  onAktif: (a: HucreKonum | null) => void
  degerYaz: (r: number, c: number, v: string) => void
  matrisYaz: (r: number, c: number, matris: string[][]) => void
  /** Tam satır seçiminde satırları siler, aksi hâlde hücre içeriklerini temizler */
  hucreTemizle: (s: Secim) => void
  satirBilgi: (s: TopluSatir) => SatirBilgi
  geriAl: () => void
  yinele: () => void
  /** Firma sütunu dropdown seçenekleri */
  firmalar: { id: string; unvan: string }[]
  /** Hücredeki metni/id'yi firma id'sine çözer; çözülemezse null */
  firmaIdBul: (txt: string) => string | null
}

const normSecim = (a: HucreKonum, b: HucreKonum): Secim => ({
  r1: Math.min(a.r, b.r),
  c1: Math.min(a.c, b.c),
  r2: Math.max(a.r, b.r),
  c2: Math.max(a.c, b.c),
})

/* ---------- Satır (memo — yalnız ilgili satır yeniden çizilir) ---------- */

interface SatirProps {
  r: number
  satir: TopluSatir
  bilgi: SatirBilgi
  kolW: number[]
  aktifC: number // bu satırdaki aktif kolon, yoksa -1
  secimSatirda: boolean
  secimC1: number
  secimC2: number
  satirSecili: boolean // tüm satır seçili
  onHucreDown: (r: number, c: number, e: React.MouseEvent) => void
  onHucreEnter: (r: number, c: number) => void
  onBaslikDown: (r: number, e: React.MouseEvent) => void
  degerYaz: (r: number, c: number, v: string) => void
  tklHareket: (r: number, c: number, e: React.KeyboardEvent) => void
  inputRef: (el: HTMLInputElement | null) => void
  firmalar: { id: string; unvan: string }[]
  firmaIdBul: (txt: string) => string | null
}

const Satir = memo(function Satir({
  r,
  satir,
  bilgi,
  kolW,
  aktifC,
  secimSatirda,
  secimC1,
  secimC2,
  satirSecili,
  onHucreDown,
  onHucreEnter,
  onBaslikDown,
  degerYaz,
  tklHareket,
  inputRef,
  firmalar,
  firmaIdBul,
}: SatirProps) {
  return (
    <tr className="group">
      <th
        onMouseDown={(e) => onBaslikDown(r, e)}
        className={cn(
          'sticky left-0 z-10 w-11 cursor-pointer select-none border-r border-b bg-muted/60 px-1 text-center text-[11px] font-normal tabular-nums text-muted-foreground',
          satirSecili && 'bg-primary/15 text-primary',
        )}
      >
        {r + 1}
      </th>
      {TOPLU_KOLONLAR.map((kol, c) => {
        const deger = satir.hucre[kol.key]
        const hata = bilgi.hatalar[kol.key]
        const secili = (secimSatirda && c >= secimC1 && c <= secimC2) || satirSecili
        const aktifMi = c === aktifC
        return (
          <td
            key={kol.key}
            style={{ width: kolW[c], minWidth: 64 }}
            onMouseDown={(e) => onHucreDown(r, c, e)}
            onMouseEnter={() => onHucreEnter(r, c)}
            className={cn(
              'relative border-r border-b p-0 text-[13px] last:border-r-0',
              secili && !aktifMi && 'bg-primary/10',
              hata && 'bg-red-500/10',
            )}
            title={hata ?? undefined}
          >
            {kol.key === 'firma' ? (
              <div className="relative">
                <select
                  value={firmaIdBul(deger) ?? deger}
                  onChange={(e) => degerYaz(r, c, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={cn(
                    'h-8 w-full cursor-pointer appearance-none truncate bg-transparent px-2 pr-6 text-[13px] outline-none',
                    secili && 'ring-1 ring-inset ring-primary/40',
                    !deger && 'text-muted-foreground/50',
                    hata && 'text-red-600 dark:text-red-400',
                  )}
                >
                  <option value="">Firma seç…</option>
                  {deger && !firmaIdBul(deger) && (
                    <option value={deger}>{deger} (bulunamadı)</option>
                  )}
                  {firmalar.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.unvan}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-1.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
              </div>
            ) : aktifMi ? (
              <input
                ref={inputRef}
                value={deger}
                onChange={(e) => degerYaz(r, c, e.target.value)}
                onKeyDown={(e) => tklHareket(r, c, e)}
                className={cn(
                  'h-8 w-full bg-transparent px-2 text-[13px] outline-none ring-2 ring-inset ring-primary',
                  hata && 'text-red-600 dark:text-red-400',
                )}
              />
            ) : (
              <div
                className={cn(
                  'flex h-8 items-center truncate px-2',
                  secili && 'ring-1 ring-inset ring-primary/40',
                  !deger && 'text-muted-foreground/30',
                  hata && 'text-red-600 dark:text-red-400',
                )}
              >
                {deger || ''}
              </div>
            )}
          </td>
        )
      })}
      <td className="w-36 border-b px-2 align-middle">
        <span
          className={cn(
            'inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
            bilgi.durum.cls,
          )}
        >
          {bilgi.durum.label}
        </span>
      </td>
    </tr>
  )
})

/* ============================ Ana Grid ============================ */

export function TopluGrid({
  satirlar,
  secim,
  onSecim,
  aktif,
  onAktif,
  degerYaz,
  matrisYaz,
  hucreTemizle,
  satirBilgi,
  geriAl,
  yinele,
  firmalar,
  firmaIdBul,
}: GridProps) {
  const [kolW, setKolW] = useState<number[]>(TOPLU_KOLONLAR.map((k) => k.genislik))
  const surukle = useRef<{ c: number; x: number; w: number } | null>(null)
  const fareBasili = useRef(false)
  const capaRef = useRef<HucreKonum>({ r: 0, c: 0 })
  const inputEl = useRef<HTMLInputElement | null>(null)

  const sonC = TOPLU_KOLONLAR.length - 1

  const odaklan = useCallback(() => {
    requestAnimationFrame(() => {
      inputEl.current?.focus()
      inputEl.current?.select()
    })
  }, [])

  const git = useCallback(
    (r: number, c: number, genislet: boolean) => {
      const rr = Math.max(0, Math.min(satirlar.length - 1, r))
      const cc = Math.max(0, Math.min(sonC, c))
      if (genislet) {
        onSecim(normSecim(capaRef.current, { r: rr, c: cc }))
      } else {
        capaRef.current = { r: rr, c: cc }
        onSecim(null)
      }
      onAktif({ r: rr, c: cc })
      odaklan()
    },
    [satirlar.length, sonC, onSecim, onAktif, odaklan],
  )

  const hucreDown = useCallback(
    (r: number, c: number, e: React.MouseEvent) => {
      e.preventDefault()
      if (e.shiftKey && aktif) {
        onSecim(normSecim(capaRef.current, { r, c }))
        onAktif({ r, c })
      } else {
        fareBasili.current = true
        capaRef.current = { r, c }
        onAktif({ r, c })
        onSecim(null)
      }
      odaklan()
    },
    [aktif, onSecim, onAktif, odaklan],
  )

  const hucreEnter = useCallback(
    (r: number, c: number) => {
      if (fareBasili.current) {
        onAktif({ r, c })
        onSecim(normSecim(capaRef.current, { r, c }))
      }
    },
    [onAktif, onSecim],
  )

  const baslikDown = useCallback(
    (r: number, e: React.MouseEvent) => {
      e.preventDefault()
      const capa = e.shiftKey ? capaRef.current : { r, c: 0 }
      capaRef.current = capa
      onSecim({ r1: Math.min(capa.r, r), c1: 0, r2: Math.max(capa.r, r), c2: sonC })
      onAktif({ r, c: 0 })
    },
    [sonC, onSecim, onAktif],
  )

  /** Aktif hücre input'undaki klavye gezinmesi */
  const tklHareket = useCallback(
    (r: number, c: number, e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        git(r + (e.shiftKey ? -1 : 1), c, false)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        git(r, c + (e.shiftKey ? -1 : 1), false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        git(r + 1, c, e.shiftKey)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        git(r - 1, c, e.shiftKey)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        git(r, c + 1, e.shiftKey)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        git(r, c - 1, e.shiftKey)
      } else if (e.key === 'Escape') {
        onAktif(null)
      }
    },
    [git, onAktif],
  )

  /** Grid seviyesi tuşlar: silme, undo/redo */
  const tklGrid = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) yinele()
        else geriAl()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        yinele()
        return
      }
      // Input odaklıyken silme tuşlarını yutma — input kendi işlesin
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        if (secim) hucreTemizle(secim)
        else if (aktif) hucreTemizle(normSecim(aktif, aktif))
      }
    },
    [secim, aktif, hucreTemizle, geriAl, yinele],
  )

  const kopyala = useCallback(
    (e: React.ClipboardEvent) => {
      const s = secim ?? (aktif ? normSecim(aktif, aktif) : null)
      if (!s) return
      const satirMetni: string[] = []
      for (let r = s.r1; r <= s.r2; r++) {
        const hucreler: string[] = []
        for (let c = s.c1; c <= s.c2; c++) {
          hucreler.push(satirlar[r]?.hucre[TOPLU_KOLONLAR[c].key] ?? '')
        }
        satirMetni.push(hucreler.join('\t'))
      }
      e.clipboardData.setData('text/plain', satirMetni.join('\n'))
      e.preventDefault()
    },
    [secim, aktif, satirlar],
  )

  const yapistir = useCallback(
    (e: React.ClipboardEvent) => {
      const metin = e.clipboardData.getData('text')
      if (!metin || (!metin.includes('\t') && !metin.includes('\n') && !metin.includes(';'))) return
      const matris = metinAyristir(metin)
      if (matris.length === 0) return
      e.preventDefault()
      const r = aktif?.r ?? satirlar.length
      const c = aktif?.c ?? 0
      matrisYaz(r, c, matris)
      // Yapıştırılan alanı seçili bırak
      onSecim({ r1: r, c1: c, r2: r + matris.length - 1, c2: Math.min(sonC, c + Math.max(...matris.map((m) => m.length)) - 1) })
    },
    [aktif, satirlar.length, matrisYaz, onSecim, sonC],
  )

  /* Sütun genişliği sürükleme */
  const resizeDown = (c: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    surukle.current = { c, x: e.clientX, w: kolW[c] }
    const move = (ev: MouseEvent) => {
      if (!surukle.current) return
      const { c: i, x, w } = surukle.current
      setKolW((k) => k.map((v, j) => (j === i ? Math.max(64, w + ev.clientX - x) : v)))
    }
    const up = () => {
      surukle.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const fareUp = useCallback(() => (fareBasili.current = false), [])

  const bilgiler = useMemo(() => satirlar.map(satirBilgi), [satirlar, satirBilgi])

  return (
    <div
      className="outline-none"
      tabIndex={-1}
      onKeyDown={tklGrid}
      onCopy={kopyala}
      onPaste={yapistir}
      onMouseUp={fareUp}
      onMouseLeave={fareUp}
    >
      <div className="overflow-auto rounded-xl border bg-card">
        <table className="w-max border-collapse">
          <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur">
            <tr>
              <th className="sticky left-0 z-30 w-11 border-r border-b bg-muted/80" />
              {TOPLU_KOLONLAR.map((kol, c) => (
                <th
                  key={kol.key}
                  style={{ width: kolW[c], minWidth: 64 }}
                  className="relative border-r border-b px-2 py-1.5 text-left text-[11px] font-medium text-muted-foreground last:border-r-0"
                >
                  {kol.label}
                  <span
                    onMouseDown={resizeDown(c)}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40"
                  />
                </th>
              ))}
              <th className="w-36 border-b px-2 py-1.5 text-left text-[11px] font-medium text-muted-foreground">
                Durum
              </th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s, r) => {
              const secili = secim && r >= secim.r1 && r <= secim.r2
              const satirSecili = !!secili && secim!.c1 === 0 && secim!.c2 === sonC
              return (
                <Satir
                  key={s.id}
                  r={r}
                  satir={s}
                  bilgi={bilgiler[r]}
                  kolW={kolW}
                  aktifC={aktif && aktif.r === r ? aktif.c : -1}
                  secimSatirda={!!secili && !satirSecili}
                  secimC1={secim?.c1 ?? 0}
                  secimC2={secim?.c2 ?? 0}
                  satirSecili={satirSecili}
                  onHucreDown={hucreDown}
                  onHucreEnter={hucreEnter}
                  onBaslikDown={baslikDown}
                  degerYaz={degerYaz}
                  tklHareket={tklHareket}
                  inputRef={(el) => {
                    inputEl.current = el
                  }}
                  firmalar={firmalar}
                  firmaIdBul={firmaIdBul}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
