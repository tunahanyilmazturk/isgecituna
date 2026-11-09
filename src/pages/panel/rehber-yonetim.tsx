import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MODULLER, type Modul, type Rehber, type RehberAdim, type RehberDurum } from '@/data/rehber'
import {
  gorselAnahtar,
  rehberDurum,
  tumRehberler,
  useRehberStore,
} from '@/stores/rehber-store'
import { useIzin } from '@/lib/izin'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useAuthStore } from '@/stores/auth-store'
import { DurumRozeti } from '@/components/rehber/rehber-bits'

const DURUMLAR: RehberDurum[] = ['Yayında', 'Taslak', 'Arşiv']
const inp =
  'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring dark:bg-input/30'

interface Editor {
  modulId: string
  rehberId?: string // tanımsız = yeni
  baslik: string
  aciklama: string
  sure: number
  rota: string
  adimlar: RehberAdim[]
}

const bosEditor = (modulId: string): Editor => ({
  modulId,
  baslik: '',
  aciklama: '',
  sure: 3,
  rota: '',
  adimlar: [{ baslik: '', aciklama: '' }],
})

export default function RehberYonetimPage() {
  const izin = useIzin('ayarlar.tanim-yonet')
  const store = useRehberStore()
  const kullanici = useAuthStore((s) => s.user?.username ?? '—')
  const logEkle = useAyarlarStore((s) => s.logEkle)
  const [ara, setAra] = useState('')
  const [durumF, setDurumF] = useState<RehberDurum | ''>('')
  const [ed, setEd] = useState<Editor | null>(null)
  const fileRef = useRef<{ rid: string; idx: number } | null>(null)

  const liste = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase('tr')
    return tumRehberler(store).filter(({ modul, rehber }) => {
      if (durumF && rehberDurum(store.durumlar, rehber.id) !== durumF) return false
      if (q && !`${modul.ad} ${rehber.baslik} ${rehber.aciklama}`.toLocaleLowerCase('tr').includes(q))
        return false
      return true
    })
  }, [store, ara, durumF])

  const acDuzenle = (modul: Modul, rehber?: Rehber) =>
    setEd(
      rehber
        ? {
            modulId: modul.id,
            rehberId: rehber.id,
            baslik: rehber.baslik,
            aciklama: rehber.aciklama,
            sure: rehber.sure,
            rota: rehber.rota ?? '',
            adimlar: rehber.adimlar.map((a) => ({ ...a })),
          }
        : bosEditor(modul.id),
    )

  const kaydet = () => {
    if (!ed) return
    const temiz = ed.adimlar.filter((a) => a.baslik.trim() || a.aciklama.trim())
    if (!ed.baslik.trim()) return toast.error('Rehber başlığı zorunlu')
    const rehber: Rehber = {
      id: ed.rehberId ?? `ozel-${Date.now().toString(36)}`,
      baslik: ed.baslik.trim(),
      aciklama: ed.aciklama.trim(),
      sure: ed.sure,
      rota: ed.rota.trim() || undefined,
      adimlar: temiz,
    }
    if (ed.rehberId) store.duzenle(rehber)
    else store.ekle(ed.modulId, rehber)
    logEkle({
      tarih: new Date().toISOString(),
      islem: ed.rehberId ? 'Rehber düzenlendi' : 'Rehber oluşturuldu',
      kayit: `${rehber.id} — ${rehber.baslik}`,
      kullanici,
      ip: '—',
      eski: '',
      yeni: `${rehber.adimlar.length} adım`,
    })
    toast.success('Rehber kaydedildi')
    setEd(null)
  }

  const gorselYukle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    const ref = fileRef.current
    if (!f || !ref) return
    const rd = new FileReader()
    rd.onload = () => {
      if (typeof rd.result === 'string') {
        store.gorselKaydet(ref.rid, ref.idx, rd.result)
        toast.success('Görsel eklendi')
      }
    }
    rd.readAsDataURL(f)
    e.target.value = ''
  }

  const adimTasi = (i: number, yon: -1 | 1) =>
    setEd((s) => {
      if (!s) return s
      const a = [...s.adimlar]
      const j = i + yon
      if (j < 0 || j >= a.length) return s
      ;[a[i], a[j]] = [a[j], a[i]]
      return { ...s, adimlar: a }
    })

  if (!izin) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-lg font-medium">Yetki gerekli</p>
        <p className="mt-1 text-sm text-muted-foreground">
          İçerik yönetimi için <code>ayarlar.tanim-yonet</code> izni gerekir.
        </p>
        <Link to="/panel/rehber" className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-600 hover:underline dark:text-amber-400">
          <ArrowLeftIcon className="size-3.5" /> Kullanım Merkezi
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link to="/panel/rehber" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" /> Kullanım Merkezi
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rehber İçerik Yönetimi</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Rehberleri düzenleyin, yenilerini ekleyin, yayın durumunu yönetin.
          </p>
        </div>
        <Button onClick={() => acDuzenle(MODULLER[0])}>
          <PlusIcon className="size-4" /> Yeni Rehber
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Rehber veya modül ara…"
            className={cn(inp, 'pl-9')}
          />
        </div>
        <div className="flex gap-1">
          {(['', ...DURUMLAR] as const).map((d) => (
            <button
              key={d || 'tumu'}
              onClick={() => setDurumF(d)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                durumF === d ? 'bg-amber-400 text-zinc-950' : 'bg-muted/60 text-muted-foreground hover:bg-muted',
              )}
            >
              {d || 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Rehber</th>
              <th className="px-4 py-2.5 font-medium">Modül</th>
              <th className="px-4 py-2.5 text-center font-medium">Adım</th>
              <th className="px-4 py-2.5 font-medium">Durum</th>
              <th className="px-4 py-2.5 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {liste.map(({ modul, rehber, ozel }) => {
              const durum = rehberDurum(store.durumlar, rehber.id)
              return (
                <tr key={rehber.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {rehber.baslik}
                      {ozel && (
                        <span className="ml-2 rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                          Özel
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                      {rehber.aciklama}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{modul.ad}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{rehber.adimlar.length}</td>
                  <td className="px-4 py-3">
                    <select
                      value={durum}
                      onChange={(e) => {
                        store.durumAyarla(rehber.id, e.target.value as RehberDurum)
                        logEkle({
                          tarih: new Date().toISOString(),
                          islem: 'Rehber durumu değişti',
                          kayit: rehber.id,
                          kullanici,
                          ip: '—',
                          eski: durum,
                          yeni: e.target.value,
                        })
                      }}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none dark:bg-input/30"
                    >
                      {DURUMLAR.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <DurumRozeti durum={durum} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => acDuzenle(modul, rehber)}>
                        Düzenle
                      </Button>
                      {!ozel && store.duzenlemeler[rehber.id] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Tohum içeriğine dön"
                          onClick={() => {
                            store.sifirla(rehber.id)
                            toast.success('Rehber tohum içeriğine döndürüldü')
                          }}
                        >
                          <RotateCcwIcon className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {liste.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Kriterlere uyan rehber yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------ Editör ------------------------------ */}
      <Sheet open={!!ed} onOpenChange={(o) => !o && setEd(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{ed?.rehberId ? 'Rehberi Düzenle' : 'Yeni Rehber'}</SheetTitle>
          </SheetHeader>
          {ed && (
            <div className="mt-4 space-y-4 px-1 pb-10">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Modül</span>
                  <select
                    value={ed.modulId}
                    disabled={!!ed.rehberId}
                    onChange={(e) => setEd({ ...ed, modulId: e.target.value })}
                    className={inp}
                  >
                    {MODULLER.filter((m) => m.id !== 'yakinda').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.ad}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Okuma süresi (dk)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={ed.sure}
                    onChange={(e) => setEd({ ...ed, sure: +e.target.value || 1 })}
                    className={inp}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Başlık</span>
                <input
                  value={ed.baslik}
                  onChange={(e) => setEd({ ...ed, baslik: e.target.value })}
                  className={inp}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Açıklama</span>
                <textarea
                  value={ed.aciklama}
                  rows={2}
                  onChange={(e) => setEd({ ...ed, aciklama: e.target.value })}
                  className={cn(inp, 'h-auto py-2')}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  "Modüle git" rotası (opsiyonel)
                </span>
                <input
                  value={ed.rota}
                  onChange={(e) => setEd({ ...ed, rota: e.target.value })}
                  placeholder="/panel/…"
                  className={inp}
                />
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Adımlar ({ed.adimlar.length})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEd({ ...ed, adimlar: [...ed.adimlar, { baslik: '', aciklama: '' }] })
                    }
                  >
                    <PlusIcon className="size-3.5" /> Adım ekle
                  </Button>
                </div>
                <div className="space-y-3">
                  {ed.adimlar.map((a, i) => (
                    <div key={i} className="rounded-xl border p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-zinc-950">
                          {i + 1}
                        </span>
                        <input
                          value={a.baslik}
                          onChange={(e) => {
                            const ad = [...ed.adimlar]
                            ad[i] = { ...a, baslik: e.target.value }
                            setEd({ ...ed, adimlar: ad })
                          }}
                          placeholder="Adım başlığı"
                          className={cn(inp, 'h-8')}
                        />
                        <div className="flex shrink-0 gap-0.5">
                          <button
                            type="button"
                            aria-label="Yukarı"
                            disabled={i === 0}
                            onClick={() => adimTasi(i, -1)}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                          >
                            <ArrowUpIcon className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Aşağı"
                            disabled={i === ed.adimlar.length - 1}
                            onClick={() => adimTasi(i, 1)}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                          >
                            <ArrowDownIcon className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Adımı sil"
                            onClick={() =>
                              setEd({ ...ed, adimlar: ed.adimlar.filter((_, x) => x !== i) })
                            }
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2Icon className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={a.aciklama}
                        rows={2}
                        onChange={(e) => {
                          const ad = [...ed.adimlar]
                          ad[i] = { ...a, aciklama: e.target.value }
                          setEd({ ...ed, adimlar: ad })
                        }}
                        placeholder="Adım açıklaması"
                        className={cn(inp, 'mt-2 h-auto py-2')}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        {ed.rehberId ? (
                          <>
                            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                              <UploadIcon className="size-3.5" /> Görsel yükle
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  fileRef.current = { rid: ed.rehberId!, idx: i }
                                  gorselYukle(e)
                                }}
                              />
                            </label>
                            {(store.gorseller[gorselAnahtar(ed.rehberId, i)] || a.gorsel) && (
                              <img
                                src={
                                  store.gorseller[gorselAnahtar(ed.rehberId, i)] ??
                                  `/rehber/${a.gorsel}`
                                }
                                alt=""
                                className="h-8 rounded border object-cover"
                              />
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Görsel yükleme kayıt sonrası düzenlemede açılır
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="ghost" onClick={() => setEd(null)}>
                  Vazgeç
                </Button>
                <Button onClick={kaydet}>Kaydet</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
