import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  FileIcon,
  ImageIcon,
  PaperclipIcon,
  PencilIcon,
  PlusIcon,
  VideoIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { DurumBadge, RiskBadge, TurBadge } from '@/components/olaylar/badges'
import { PersonelChip } from '@/components/ekip/badges'
import { formatKisa, gunFarki } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useEkipStore } from '@/stores/ekip-store'
import { useOlaylarStore } from '@/stores/olaylar-store'
import { adSoyad } from '@/data/ekip'
import { BUGUN, DURUMLAR, SORUMLULAR } from '@/data/olaylar'
import type { Olay, OlayAksiyon } from '@/data/olaylar'

const durumSira = (o: Olay) => DURUMLAR.indexOf(o.durum)

function Timeline({ olay }: { olay: Olay }) {
  const aktif = durumSira(olay)
  return (
    <div className="flex items-start">
      {DURUMLAR.map((d, i) => {
        const tamam = i < aktif
        const simdiki = i === aktif
        return (
          <div key={d} className="flex min-w-0 flex-1 items-start last:flex-none">
            <div className="flex w-14 shrink-0 flex-col items-center gap-1 text-center">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold',
                  tamam && 'border-emerald-500 bg-emerald-500 text-white',
                  simdiki &&
                    'border-amber-500 bg-amber-400 text-zinc-950 ring-4 ring-amber-400/20',
                  !tamam && !simdiki && 'border-border text-muted-foreground',
                )}
              >
                {tamam ? <CheckIcon className="size-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-[9.5px] leading-tight',
                  simdiki ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {d}
              </span>
            </div>
            {i < DURUMLAR.length - 1 && (
              <div
                className={cn('mt-2.5 h-px min-w-2 flex-1', tamam ? 'bg-emerald-500' : 'bg-border')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {baslik}
      </h3>
      {children}
    </section>
  )
}

function Satir({ k, v }: { k: string; v?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium">{v ?? '—'}</dd>
    </div>
  )
}

/** Sorumlu personel — ekip kaydından avatar + görev gösterimi */
function SorumluSatir({ ad }: { ad?: string }) {
  const uye = useEkipStore((s) => s.uyeler.find((u) => adSoyad(u) === ad))
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">Sorumlu</dt>
      <dd className="mt-0.5">
        {uye ? <PersonelChip uye={uye} satir="cift" /> : <span className="text-sm font-medium">{ad ?? '—'}</span>}
      </dd>
    </div>
  )
}

function EvetHayir({ deger, etiket }: { deger: boolean; etiket: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        deger
          ? 'bg-red-500/10 text-red-700 dark:bg-red-400/15 dark:text-red-400'
          : 'bg-zinc-500/10 text-zinc-600 dark:bg-zinc-400/10 dark:text-zinc-400',
      )}
    >
      {etiket}: {deger ? 'Var' : 'Yok'}
    </span>
  )
}

function EkIkonu({ tur }: { tur: string }) {
  if (tur === 'Fotoğraf') return <ImageIcon className="size-3.5" />
  if (tur === 'Video') return <VideoIcon className="size-3.5" />
  return <FileIcon className="size-3.5" />
}

function AksiyonSatir({ olayId, a }: { olayId: string; a: OlayAksiyon }) {
  const aksiyonTamamla = useOlaylarStore((s) => s.aksiyonTamamla)
  const gecikme = !a.tamamlandi ? gunFarki(a.hedefBitis, BUGUN) : 0
  return (
    <li
      className={cn(
        'rounded-lg border px-3 py-2.5',
        gecikme > 0 && 'border-red-500/40 bg-red-500/5',
        a.tamamlandi && 'opacity-75',
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          disabled={a.tamamlandi}
          onClick={() => {
            aksiyonTamamla(olayId, a.id)
            toast.success('Aksiyon tamamlandı')
          }}
          aria-label={a.tamamlandi ? 'Tamamlandı' : 'Tamamla'}
          className={cn(
            'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors',
            a.tamamlandi
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-muted-foreground/40 hover:border-emerald-500 hover:text-emerald-500',
          )}
        >
          {a.tamamlandi && <CheckIcon className="size-3" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm', a.tamamlandi && 'text-muted-foreground line-through')}>
            {a.aciklama}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{a.sorumlu}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {formatKisa(a.baslangic)} → {formatKisa(a.hedefBitis)}
            </span>
            {gecikme > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
                <AlertTriangleIcon className="size-3" />
                {gecikme} gün gecikti
              </span>
            )}
          </p>
          {a.tamamlanmaNotu && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              {a.tamamlanmaNotu}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

function AksiyonFormu({ olayId, kapat }: { olayId: string; kapat: () => void }) {
  const aksiyonEkle = useOlaylarStore((s) => s.aksiyonEkle)
  const [aciklama, setAciklama] = useState('')
  const [sorumlu, setSorumlu] = useState<string>(SORUMLULAR[0])
  const [hedefBitis, setHedefBitis] = useState('')

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <Input
        value={aciklama}
        onChange={(e) => setAciklama(e.target.value)}
        placeholder="Aksiyon açıklaması"
      />
      <div className="flex gap-2">
        <select
          value={sorumlu}
          onChange={(e) => setSorumlu(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
        >
          {SORUMLULAR.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <Input
          type="date"
          value={hedefBitis}
          onChange={(e) => setHedefBitis(e.target.value)}
          className="w-36"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={kapat}>
          Vazgeç
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (!aciklama.trim() || !hedefBitis) {
              toast.error('Açıklama ve hedef tarih gerekli')
              return
            }
            aksiyonEkle(olayId, { aciklama: aciklama.trim(), sorumlu, baslangic: BUGUN, hedefBitis })
            toast.success('Aksiyon eklendi')
            kapat()
          }}
        >
          Ekle
        </Button>
      </div>
    </div>
  )
}

export function OlayDetailDrawer({
  olay,
  onKapat,
  onDuzenle,
}: {
  olay: Olay | null
  onKapat: () => void
  onDuzenle: (o: Olay) => void
}) {
  const durumGuncelle = useOlaylarStore((s) => s.durumGuncelle)
  const [aksiyonForm, setAksiyonForm] = useState(false)

  return (
    <Sheet open={!!olay} onOpenChange={(a) => !a && onKapat()}>
      <SheetContent className="w-full max-w-xl gap-0 p-0" aria-describedby={undefined}>
        {olay && (
          <>
            <div className="border-b px-5 py-4">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono font-medium">{olay.id}</span>
                    <span aria-hidden>·</span>
                    <CalendarIcon className="size-3" />
                    <span className="tabular-nums">
                      {formatKisa(olay.tarih)} {olay.saat}
                    </span>
                  </div>
                  <SheetTitle className="mt-1 text-lg leading-snug">{olay.baslik}</SheetTitle>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <TurBadge tur={olay.tur} />
                    <RiskBadge risk={olay.risk} />
                    <DurumBadge durum={olay.durum} />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
              <Timeline olay={olay} />

              <Bolum baslik="Temel bilgiler">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <Satir k="Firma" v={olay.firma} />
                  <Satir k="İşyeri" v={olay.isyeri} />
                  <Satir k="Bölüm" v={olay.bolum} />
                  <Satir k="Bildiren" v={olay.bildiren} />
                  <SorumluSatir ad={olay.sorumlu} />
                  <Satir k="Tanıklar" v={olay.taniklar} />
                </dl>
              </Bolum>

              <Bolum baslik="Olay açıklaması">
                <p className="text-sm leading-relaxed">{olay.aciklama}</p>
              </Bolum>

              <Bolum baslik="Sınıflandırma">
                <div className="flex flex-wrap gap-1.5">
                  <EvetHayir deger={olay.yaralanma} etiket="Yaralanma" />
                  <EvetHayir deger={olay.maddiHasar} etiket="Maddi hasar" />
                  <EvetHayir deger={olay.isKaybi} etiket="İş kaybı" />
                </div>
                {olay.yaralanma && (
                  <dl className="mt-3 grid grid-cols-3 gap-x-4 rounded-lg bg-muted/50 p-3">
                    <Satir k="Yaralanma türü" v={olay.yaralanmaTuru} />
                    <Satir k="Vücut bölgesi" v={olay.vucutBolgesi} />
                    <Satir k="Sonuç" v={olay.sonuc} />
                  </dl>
                )}
              </Bolum>

              {(olay.calisan || olay.tc) && (
                <Bolum baslik="İlgili kişiler">
                  <dl className="grid grid-cols-3 gap-x-4">
                    <Satir k="Etkilenen çalışan" v={olay.calisan} />
                    <Satir k="TC Kimlik" v={olay.tc} />
                    <Satir k="Görevi" v={olay.gorev} />
                  </dl>
                </Bolum>
              )}

              {olay.ekler.length > 0 && (
                <Bolum baslik={`Ekler (${olay.ekler.length})`}>
                  <ul className="flex flex-wrap gap-2">
                    {olay.ekler.map((e) => (
                      <li key={e.ad}>
                        <button
                          type="button"
                          onClick={() => toast.info(`${e.ad} — önizleme (demo)`)}
                          className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                        >
                          <EkIkonu tur={e.tur} />
                          <span className="font-medium">{e.ad}</span>
                          <span className="text-muted-foreground">{e.boyut}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Bolum>
              )}

              <Bolum baslik={`Düzeltici & önleyici faaliyetler (${olay.aksiyonlar.length})`}>
                {olay.duzelticiFaaliyet && (
                  <p className="mb-2 text-sm text-muted-foreground">{olay.duzelticiFaaliyet}</p>
                )}
                <ul className="space-y-2">
                  {olay.aksiyonlar.map((a) => (
                    <AksiyonSatir key={a.id} olayId={olay.id} a={a} />
                  ))}
                </ul>
                {aksiyonForm ? (
                  <div className="mt-2">
                    <AksiyonFormu olayId={olay.id} kapat={() => setAksiyonForm(false)} />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setAksiyonForm(true)}
                  >
                    <PlusIcon /> Aksiyon ekle
                  </Button>
                )}
              </Bolum>

              {olay.ilkOnlemler && (
                <Bolum baslik="İlk müdahale">
                  <p className="text-sm leading-relaxed">{olay.ilkOnlemler}</p>
                </Bolum>
              )}

              {olay.notlar && (
                <Bolum baslik="İnceleme notları">
                  <p className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{olay.notlar}</p>
                </Bolum>
              )}

              <Bolum baslik="Durum geçmişi">
                <ul className="space-y-0">
                  {olay.gecmis.map((g, i) => (
                    <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < olay.gecmis.length - 1 && (
                        <span className="absolute top-4 left-[5px] h-full w-px bg-border" />
                      )}
                      <span className="mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-muted-foreground/40 bg-background" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {g.durum}
                          <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                            {formatKisa(g.tarih)}
                          </span>
                        </p>
                        {g.not && <p className="mt-0.5 text-xs text-muted-foreground">{g.not}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Bolum>
            </div>

            <div className="flex items-center gap-2 border-t px-5 py-3">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                >
                  Durumu güncelle <ChevronDownIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {DURUMLAR.map((d) => (
                    <DropdownMenuItem
                      key={d}
                      disabled={d === olay.durum}
                      onClick={() => {
                        durumGuncelle(olay.id, d)
                        toast.success(`Durum güncellendi: ${d}`)
                      }}
                    >
                      <span className={cn(d === olay.durum && 'font-medium')}>{d}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => onDuzenle(olay)}>
                <PencilIcon /> Düzenle
              </Button>
              <div className="ml-auto text-xs text-muted-foreground">
                <PaperclipIcon className="mr-1 inline size-3" />
                {olay.ekler.length} ek · {olay.aksiyonlar.length} aksiyon
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
