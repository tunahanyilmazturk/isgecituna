/*
 * Sertifika Tasarım Editörü — üç panelli çalışma alanı.
 * Sol: eleman listesi + ekleme · Orta: A4 canlı önizleme (sürükle-bırak)
 * Sağ: seçili eleman özellikleri · Üst: kaydet/yön/zoom/geri-al.
 */
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeftIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
  Redo2Icon,
  SaveIcon,
  SquareIcon,
  TypeIcon,
  Undo2Icon,
  VariableIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SertifikaOnizleme } from '@/components/sertifika/onizleme'
import { Alan, Sec } from '@/components/form-bits'
import {
  ALANLAR,
  FONTLAR,
  ORNEK_VERI,
  elemanlariCoz,
  sablonDuzen,
  YON_MM,
  type AlanAnahtar,
  type ElemanTur,
  type TasarimEleman,
  type Yon,
} from '@/data/sertifika-tasarim'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const TUR_AD: Record<ElemanTur, string> = {
  metin: 'Metin', alan: 'Dinamik alan', qr: 'QR kod', cizgi: 'Çizgi', kutu: 'Kutu/Çerçeve',
  daire: 'Daire', logo: 'Logo', imza: 'İmza', filigran: 'Filigran', rozet: 'Rozet', konuTablosu: 'Eğitim konu tablosu',
}
const EKLENEBILIR: ElemanTur[] = ['metin', 'alan', 'konuTablosu', 'qr', 'cizgi', 'kutu', 'daire', 'logo', 'imza']
const yeniEleman = (tur: ElemanTur, w: number, h: number): TasarimEleman => ({
  id: `e${Math.random().toString(36).slice(2, 8)}`,
  tur, x: Math.round(w * 0.3), y: Math.round(h * 0.3),
  w: tur === 'konuTablosu' ? Math.min(200, w - 20) : tur === 'qr' ? 30 : tur === 'logo' ? 14 : tur === 'cizgi' ? 60 : 80,
  h: tur === 'konuTablosu' ? Math.min(130, h - 24) : tur === 'qr' ? 30 : tur === 'logo' ? 14 : tur === 'cizgi' ? 0.5 : tur === 'imza' ? 16 : 8,
  metin: tur === 'metin' ? 'Yeni metin' : tur === 'logo' ? 'HT' : undefined,
  alan: tur === 'alan' ? 'employee_name' : undefined,
  boyut: 3.5, kalin: 400, renk: '#0F172A', hiza: 'orta', gizleBos: tur === 'alan',
  imzaUnvan: tur === 'imza' ? 'Yetkili' : undefined,
  imzaAlan: tur === 'imza' ? 'approver_name' : undefined,
  doldur: tur === 'cizgi' ? '#0F172A' : tur === 'kutu' || tur === 'daire' ? 'transparent' : undefined,
  kenar: tur === 'kutu' || tur === 'daire' ? { renk: '#0F172A', kalinlik: 0.4 } : undefined,
})

function N({ l, v, onC, adim = 0.1, min, max }: { l: string; v: number; onC: (n: number) => void; adim?: number; min?: number; max?: number }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{l}</span>
      <input
        type="number"
        value={v}
        step={adim}
        min={min}
        max={max}
        onChange={(e) => onC(parseFloat(e.target.value) || 0)}
        className="h-7 w-20 rounded-md border border-input bg-transparent px-2 text-right text-xs outline-none focus-visible:border-ring dark:bg-input/30"
      />
    </label>
  )
}

export default function SertifikaEditorPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const kullanici = useAuthStore((s) => s.user)?.name ?? 'Sistem'
  const { tasarimlar, tasarimKaydet, tasarimEkle } = useSertifikaStore()
  const mevcut = tasarimlar.find((t) => t.id === id)

  const yeniMi = !mevcut
  const baz = mevcut ?? tasarimlar.find((t) => t.varsayilan) ?? tasarimlar[0]
  const [ad, setAd] = useState(yeniMi ? 'Yeni Tasarım' : mevcut!.ad)
  const [yon, setYon] = useState<Yon>(yeniMi ? 'yatay' : mevcut!.yon)
  const [yuz, setYuz] = useState<'on' | 'arka'>('on')
  const [duzenler, setDuzenler] = useState<{ yatay: TasarimEleman[]; dikey: TasarimEleman[]; arkaYatay: TasarimEleman[]; arkaDikey: TasarimEleman[] }>(() =>
    yeniMi
      ? {
          yatay: sablonDuzen(baz, 'yatay').map((e) => ({ ...e })),
          dikey: sablonDuzen(baz, 'dikey').map((e) => ({ ...e })),
          arkaYatay: sablonDuzen(baz, 'yatay', 'arka').map((e) => ({ ...e })),
          arkaDikey: sablonDuzen(baz, 'dikey', 'arka').map((e) => ({ ...e })),
        }
      : {
          yatay: elemanlariCoz(mevcut!.duzenYatay), dikey: elemanlariCoz(mevcut!.duzenDikey),
          arkaYatay: sablonDuzen(mevcut!, 'yatay', 'arka'), arkaDikey: sablonDuzen(mevcut!, 'dikey', 'arka'),
        },
  )
  const [font, setFont] = useState(yeniMi ? 'Inter' : mevcut!.font)
  const [zemin, setZemin] = useState(yeniMi ? '#FFFFFF' : mevcut!.zemin)
  const [secili, setSecili] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.62)
  const gecmis = useRef<typeof duzenler[]>([])
  const ileri = useRef<typeof gecmis.current>([])
  const [geriN, setGeriN] = useState(0)
  const [ileriN, setIleriN] = useState(0)

  const anahtar = (yuz === 'on' ? yon : `arka${yon[0].toLocaleUpperCase('tr')}${yon.slice(1)}`) as keyof typeof duzenler
  const elemanlar = duzenler[anahtar]
  const seciliEl = elemanlar.find((e) => e.id === secili) ?? null
  const sayfa = YON_MM[yon]

  const uygula = (fn: (l: TasarimEleman[]) => TasarimEleman[]) => {
    gecmis.current.push(duzenler)
    ileri.current = []
    setGeriN(gecmis.current.length)
    setIleriN(0)
    setDuzenler((d) => ({ ...d, [anahtar]: fn(d[anahtar]) }))
  }
  const tasi = (eid: string, x: number, y: number) =>
    setDuzenler((d) => ({ ...d, [anahtar]: d[anahtar].map((e) => (e.id === eid ? { ...e, x, y } : e)) }))
  const guncelle = (patch: Partial<TasarimEleman>) =>
    secili && uygula((l) => l.map((e) => (e.id === secili ? { ...e, ...patch } : e)))
  const geri = () => {
    const onceki = gecmis.current.pop()
    if (!onceki) return
    ileri.current.push(duzenler)
    setGeriN(gecmis.current.length)
    setIleriN(ileri.current.length)
    setDuzenler(onceki)
  }
  const ileriAl = () => {
    const sonraki = ileri.current.pop()
    if (!sonraki) return
    gecmis.current.push(duzenler)
    setGeriN(gecmis.current.length)
    setIleriN(ileri.current.length)
    setDuzenler(sonraki)
  }

  const kaydet = () => {
    if (!ad.trim()) return toast.error('Şablon adı gerekli')
    if (mevcut) {
      tasarimKaydet(mevcut.id, { ad: ad.trim(), yon, font, zemin, duzenYatay: duzenler.yatay, duzenDikey: duzenler.dikey, duzenArkaYatay: duzenler.arkaYatay, duzenArkaDikey: duzenler.arkaDikey }, kullanici)
      toast.success('Şablon kaydedildi — yeni sürüm oluştu, verilmiş sertifikalar etkilenmez')
    } else {
      const t = tasarimEkle({
        ad: ad.trim(), aciklama: 'Özel tasarım', kategori: 'Özel', belgeTuru: 'katilim',
        font, yon, zemin, duzenYatay: duzenler.yatay, duzenDikey: duzenler.dikey, duzenArkaYatay: duzenler.arkaYatay, duzenArkaDikey: duzenler.arkaDikey,
        aktif: true, arsiv: false, varsayilan: false,
      })
      toast.success('Yeni şablon oluşturuldu')
      nav(`/panel/sertifika-editor/${t.id}`, { replace: true })
      return
    }
  }

  const hazir = useMemo(() => true, [])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Üst araç çubuğu */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-card px-4 py-2.5">
        <Button variant="ghost" size="sm" onClick={() => nav('/panel/sertifika-tasarimlari')}>
          <ArrowLeftIcon /> Tasarımlar
        </Button>
        <input
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          className="h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium outline-none focus-visible:border-ring dark:bg-input/30"
        />
        <div className="ml-2 flex items-center rounded-lg border">
          {(['yatay', 'dikey'] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYon(y)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors', yon === y ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-muted-foreground')}
            >
              <span className={cn('inline-block border border-current', y === 'yatay' ? 'h-2.5 w-3.5' : 'h-3.5 w-2.5')} />
              {y === 'yatay' ? 'Yatay' : 'Dikey'}
            </button>
          ))}
        </div>
        <div className="ml-1 flex items-center rounded-lg border p-0.5">
          {(['on', 'arka'] as const).map((y) => (
            <button key={y} onClick={() => { setYuz(y); setSecili(null) }} className={cn('rounded-md px-2.5 py-1.5 text-xs font-medium', yuz === y ? 'bg-amber-500 text-zinc-950' : 'text-muted-foreground hover:bg-muted')}>
              {y === 'on' ? 'Ön yüz' : 'Arka yüz'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button title="Geri al" onClick={geri} disabled={!geriN} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30">
            <Undo2Icon className="size-4" />
          </button>
          <button title="Yinele" onClick={ileriAl} disabled={!ileriN} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30">
            <Redo2Icon className="size-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button title="Uzaklaştır" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <MinusIcon className="size-4" />
          </button>
          <span className="w-12 text-center text-xs font-medium tabular-nums">{Math.round(zoom * 100)}%</span>
          <button title="Yakınlaştır" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <PlusIcon className="size-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button size="sm" onClick={kaydet}>
            <SaveIcon /> Kaydet
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sol panel — elemanlar */}
        <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
          <p className="border-b px-3 py-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Elemanlar</p>
          {yuz === 'arka' && <p className="border-b bg-amber-500/5 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">Konu tablosu, seçilen eğitim sürümünün içerik ve sürelerinden otomatik doldurulur.</p>}
          <div className="grid grid-cols-2 gap-1.5 border-b p-2.5">
            {EKLENEBILIR.map((t) => (
              <button
                key={t}
                onClick={() => {
                  uygula((l) => [...l, yeniEleman(t, sayfa.w, sayfa.h)])
                }}
                className="flex items-center gap-1.5 rounded-md border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-amber-500 hover:text-amber-700"
                title={`${TUR_AD[t]} ekle`}
              >
                {t === 'metin' ? <TypeIcon className="size-3.5" /> : t === 'alan' ? <VariableIcon className="size-3.5" /> : <SquareIcon className="size-3.5" />}
                {TUR_AD[t]}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {elemanlar.map((el) => (
              <button
                key={el.id}
                onClick={() => setSecili(el.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                  secili === el.id ? 'bg-sky-500/10 font-medium text-sky-600 dark:text-sky-400' : 'hover:bg-muted',
                )}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" />
                <span className="min-w-0 flex-1 truncate">
                  {TUR_AD[el.tur]}
                  {el.alan ? ` — {{${el.alan}}}` : el.metin ? ` — ${el.metin.slice(0, 14)}` : ''}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {Math.round(el.x)},{Math.round(el.y)}
                </span>
              </button>
            ))}
            {elemanlar.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">Eleman yok — yukarıdan ekleyin</p>}
          </div>
          <div className="border-t p-2.5">
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">Belge fontu</p>
            <Sec value={font} onChange={setFont} options={FONTLAR.map((f) => f.key)} />
            <Alan label="Zemin rengi" className="mt-2">
              <input type="color" value={zemin} onChange={(e) => setZemin(e.target.value)} className="h-8 w-full cursor-pointer rounded-md border" />
            </Alan>
          </div>
        </aside>

        {/* Orta — canvas */}
        <main className="flex min-w-0 flex-1 items-start justify-center overflow-auto bg-zinc-200/60 p-8 dark:bg-zinc-950/60">
          <div className="rounded-sm shadow-2xl">
            {hazir && (
              <SertifikaOnizleme
                elemanlar={elemanlar}
                yon={yon}
                zemin={zemin}
                veri={ORNEK_VERI}
                olcek={zoom}
                seciliId={secili}
                onSec={setSecili}
                onTasi={tasi}
              />
            )}
          </div>
        </main>

        {/* Sağ — özellikler */}
        <aside className="w-64 shrink-0 overflow-y-auto border-l bg-card">
          <p className="border-b px-3 py-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Özellikler</p>
          {!seciliEl ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              <EyeIcon className="mx-auto mb-2 size-5 opacity-40" />
              Bir eleman seçin veya sürükleyin
            </p>
          ) : (
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">{TUR_AD[seciliEl.tur]}</span>
                <button
                  onClick={() => {
                    uygula((l) => l.filter((e) => e.id !== secili))
                    setSecili(null)
                  }}
                  className="text-[11px] text-red-500 hover:underline"
                >
                  Sil
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <N l="X (mm)" v={seciliEl.x} onC={(n) => guncelle({ x: n })} />
                <N l="Y (mm)" v={seciliEl.y} onC={(n) => guncelle({ y: n })} />
                <N l="Genişlik" v={seciliEl.w} onC={(n) => guncelle({ w: Math.max(1, n) })} min={1} />
                <N l="Yükseklik" v={seciliEl.h} onC={(n) => guncelle({ h: Math.max(0.3, n) })} min={0.3} />
              </div>
              {seciliEl.tur === 'alan' && (
                <div>
                  <p className="mb-1 text-[11px] font-medium text-muted-foreground">Dinamik alan</p>
                  <Sec
                    value={seciliEl.alan ?? 'employee_name'}
                    onChange={(v) => guncelle({ alan: v as AlanAnahtar })}
                    options={Object.keys(ALANLAR)}
                  />
                </div>
              )}
              {(seciliEl.tur === 'metin' || seciliEl.tur === 'rozet' || (seciliEl.tur === 'imza' && seciliEl.imzaAlan !== 'approver_name')) && (
                <Alan label="Metin">
                  <input
                    value={seciliEl.metin ?? ''}
                    onChange={(e) => guncelle({ metin: e.target.value })}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  />
                </Alan>
              )}
              {seciliEl.tur === 'imza' && (
                <Alan label="Unvan">
                  <input
                    value={seciliEl.imzaUnvan ?? ''}
                    onChange={(e) => guncelle({ imzaUnvan: e.target.value })}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  />
                </Alan>
              )}
              {['metin', 'alan', 'rozet', 'filigran', 'imza', 'logo'].includes(seciliEl.tur) && (
                <>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">Yazı tipi</p>
                    <Sec value={seciliEl.font ?? font} onChange={(v) => guncelle({ font: v })} options={FONTLAR.map((f) => f.key)} />
                  </div>
                  <N l="Boyut (mm)" v={seciliEl.boyut ?? 3.5} onC={(n) => guncelle({ boyut: Math.max(1, n) })} min={1} />
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">Kalınlık</p>
                    <Sec
                      value={String(seciliEl.kalin ?? 400)}
                      onChange={(v) => guncelle({ kalin: +v })}
                      options={['300', '400', '500', '600', '700', '800']}
                    />
                  </div>
                  <Alan label="Renk">
                    <input type="color" value={seciliEl.renk ?? '#0F172A'} onChange={(e) => guncelle({ renk: e.target.value })} className="h-8 w-full cursor-pointer rounded-md border" />
                  </Alan>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">Hizalama</p>
                    <Sec value={seciliEl.hiza ?? 'orta'} onChange={(v) => guncelle({ hiza: v as TasarimEleman['hiza'] })} options={['sol', 'orta', 'sag']} />
                  </div>
                </>
              )}
              {['kutu', 'daire', 'cizgi', 'qr', 'logo'].includes(seciliEl.tur) && (
                <Alan label="Dolgu rengi">
                  <input type="color" value={seciliEl.doldur?.startsWith('#') ? seciliEl.doldur : '#0F172A'} onChange={(e) => guncelle({ doldur: e.target.value })} className="h-8 w-full cursor-pointer rounded-md border" />
                </Alan>
              )}
              {(seciliEl.tur === 'kutu' || seciliEl.tur === 'daire') && (
                <div className="grid grid-cols-2 gap-2">
                  <N l="Kenar" v={seciliEl.kenar?.kalinlik ?? 0} onC={(n) => guncelle({ kenar: { renk: seciliEl.kenar?.renk ?? '#0F172A', kalinlik: n, yaricap: seciliEl.kenar?.yaricap } })} />
                  <N l="Köşe" v={seciliEl.kenar?.yaricap ?? 0} onC={(n) => guncelle({ kenar: { renk: seciliEl.kenar?.renk ?? '#0F172A', kalinlik: seciliEl.kenar?.kalinlik ?? 0.4, yaricap: n } })} />
                </div>
              )}
              <N l="Saydamlık" v={seciliEl.opaklik ?? 1} adim={0.05} min={0} max={1} onC={(n) => guncelle({ opaklik: Math.max(0, Math.min(1, n)) })} />
              <N l="Döndürme°" v={seciliEl.dondurme ?? 0} adim={1} onC={(n) => guncelle({ dondurme: n })} />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
