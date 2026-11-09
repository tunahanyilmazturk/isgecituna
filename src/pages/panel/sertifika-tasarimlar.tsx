/*
 * Sertifika Tasarım Merkezi — şablon galerisi.
 * Hazır tasarımlar kart düzeninde canlı önizlemeyle gösterilir; düzenleme,
 * kopyalama, varsayılan ve arşiv işlemleri buradan yönetilir.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BadgeCheckIcon,
  CopyIcon,
  ExpandIcon,
  LayoutTemplateIcon,
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SertifikaOnizleme } from '@/components/sertifika/onizleme'
import { ORNEK_VERI, sablonDuzen, type TasarimSablon, type Yon } from '@/data/sertifika-tasarim'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { useIzin } from '@/lib/izin'
import { cn } from '@/lib/utils'

const KATEGORILER = ['Tümü', 'Kurumsal', 'Klasik', 'Minimal'] as const

export default function SertifikaTasarimlarPage() {
  const { tasarimlar, tasarimKopyala, tasarimVarsayilan, tasarimArsivle, sertifikalar } = useSertifikaStore()
  const duzenleIzni = useIzin('sertifikalar.sablon')
  const nav = useNavigate()
  const [kat, setKat] = useState<(typeof KATEGORILER)[number]>('Tümü')
  const [arsivGoster, setArsivGoster] = useState(false)
  const [ara, setAra] = useState('')
  const [onizle, setOnizle] = useState<TasarimSablon | null>(null)
  const [onizleYon, setOnizleYon] = useState<Yon>('yatay')
  const [onizleYuzu, setOnizleYuzu] = useState<'on' | 'arka'>('on')

  const liste = useMemo(
    () => tasarimlar.filter((t) => (kat === 'Tümü' || t.kategori === kat) && (arsivGoster ? true : !t.arsiv) && `${t.ad} ${t.aciklama}`.toLocaleLowerCase('tr').includes(ara.toLocaleLowerCase('tr'))),
    [tasarimlar, kat, arsivGoster, ara],
  )
  const kullanim = (id: string) => sertifikalar.filter((s) => s.tasarim?.sablonId === id).length
  const aktifSayi = tasarimlar.filter((t) => !t.arsiv && t.aktif).length
  const varsayilan = tasarimlar.find((t) => t.varsayilan && !t.arsiv)
  const toplamKullanim = tasarimlar.reduce((n, t) => n + kullanim(t.id), 0)

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-5 pb-4">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500/10 via-card to-card px-5 py-4 shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-24 size-64 rounded-full border border-amber-500/10" />
          <div className="pointer-events-none absolute -right-1 -top-16 size-44 rounded-full border border-amber-500/15" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-64">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                <PaletteIcon className="size-4" /> Belge Stüdyosu
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Sertifika Tasarımları</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">Eğitim belgelerinizi kurumsal kimliğinize uygun şablonlarla hazırlayın. Önizlemeler örnek bilgilerle gösterilir.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setArsivGoster((v) => !v)}>
                <ArchiveIcon /> {arsivGoster ? 'Arşivi gizle' : 'Arşiv'}
              </Button>
              {duzenleIzni && <Button onClick={() => nav('/panel/sertifika-editor/yeni')}><PlusIcon /> Yeni Tasarım</Button>}
            </div>
          </div>
          <div className="relative mt-4 grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border bg-background/75 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Hazır tasarım</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{aktifSayi}</p>
            </div>
            <div className="rounded-xl border bg-background/75 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Varsayılan</p>
              <p className="mt-0.5 truncate text-sm font-semibold">{varsayilan?.ad ?? 'Belirlenmedi'}</p>
            </div>
            <div className="rounded-xl border bg-background/75 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Düzen</p>
              <p className="mt-0.5 text-sm font-semibold">Yatay ve dikey A4</p>
            </div>
            <div className="rounded-xl border bg-background/75 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Kullanım</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{toplamKullanim}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
        {KATEGORILER.map((k) => (
          <button
            key={k}
            onClick={() => setKat(k)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              kat === k ? 'border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {k}
          </button>
        ))}
        </div>
        <label className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Tasarım ara..." className="h-9 pl-9" />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {liste.map((t) => {
            const sayi = kullanim(t.id)
            return (
              <div
                key={t.id}
                className={cn(
                  'group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg',
                  t.arsiv && 'opacity-60',
                )}
              >
                <button
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-br from-muted/70 to-muted p-5 dark:from-zinc-900 dark:to-zinc-950"
                  onClick={() => {
                    setOnizle(t)
                    setOnizleYon(t.yon)
                    setOnizleYuzu('on')
                  }}
                  title="Önizle"
                >
                  <div className="pointer-events-none overflow-hidden rounded-sm shadow-[0_12px_35px_-15px_rgba(0,0,0,.5)] ring-1 ring-black/10">
                    <SertifikaOnizleme elemanlar={sablonDuzen(t)} yon={t.yon} zemin={t.zemin} veri={ORNEK_VERI} olcek={t.yon === 'yatay' ? 0.29 : 0.23} />
                  </div>
                </button>
                <div className="border-t px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium">
                        <span className="truncate">{t.ad}</span>
                        {t.varsayilan && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <StarIcon className="size-2.5 fill-current" /> Varsayılan
                          </span>
                        )}
                        {t.arsiv && <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-500">Arşiv</span>}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.aciklama}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-md bg-muted px-1.5 py-0.5">{t.kategori}</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 capitalize">{t.yon === 'yatay' ? 'Yatay' : 'Dikey'} · 2 yüz</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5">v{t.surum}</span>
                    {sayi > 0 && (
                      <span className="ml-auto flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <BadgeCheckIcon className="size-3" /> {sayi} sertifikada
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setOnizle(t)
                        setOnizleYon(t.yon)
                        setOnizleYuzu('on')
                      }}
                    >
                      <ExpandIcon /> Önizle
                    </Button>
                    {duzenleIzni && !t.arsiv && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => nav(`/panel/sertifika-editor/${t.id}`)}>
                          <PencilIcon /> Düzenle
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            tasarimKopyala(t.id)
                            toast.success(`${t.ad} kopyalandı`)
                          }}
                        >
                          <CopyIcon /> Kopyala
                        </Button>
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      {duzenleIzni && !t.varsayilan && !t.arsiv && (
                        <button
                          title="Varsayılan yap"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-amber-500"
                          onClick={() => {
                            tasarimVarsayilan(t.id)
                            toast.success(`${t.ad} varsayılan yapıldı`)
                          }}
                        >
                          <StarIcon className="size-4" />
                        </button>
                      )}
                      {duzenleIzni && (
                        <button
                          title={t.arsiv ? 'Arşivden çıkar' : sayi > 0 ? 'Kullanımda — silinemez, arşivlenir' : 'Arşivle'}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                          onClick={() => {
                            tasarimArsivle(t.id, !t.arsiv)
                            toast.success(t.arsiv ? 'Arşivden çıkarıldı' : 'Şablon arşivlendi — verilmiş sertifikalar etkilenmez')
                          }}
                        >
                          {t.arsiv ? <ArchiveRestoreIcon className="size-4" /> : <ArchiveIcon className="size-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {liste.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
            <LayoutTemplateIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Bu kategoride tasarım yok</p>
          </div>
        )}
      </div>

      {/* Büyük önizleme */}
      {onizle && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-auto bg-black/75 p-6 backdrop-blur-sm"
          onClick={() => setOnizle(null)}
        >
          <div className="flex flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-medium text-white">{onizle.ad}</span>
            {(['on', 'arka'] as const).map((y) => (
              <button key={y} onClick={() => setOnizleYuzu(y)} className={cn('rounded-lg px-3 py-1 text-xs font-medium transition-colors', onizleYuzu === y ? 'bg-amber-500 text-zinc-950' : 'bg-white/10 text-white/70 hover:bg-white/20')}>
                {y === 'on' ? 'Ön yüz' : 'Arka yüz'}
              </button>
            ))}
            {(['yatay', 'dikey'] as const).map((y) => (
              <button
                key={y}
                onClick={() => setOnizleYon(y)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                  onizleYon === y ? 'bg-white text-zinc-900' : 'bg-white/10 text-white/70 hover:bg-white/20',
                )}
              >
                {y === 'yatay' ? '⬜ Yatay' : '⬛ Dikey'}
              </button>
            ))}
            {duzenleIzni && !onizle.arsiv && (
              <Button size="sm" variant="secondary" onClick={() => nav(`/panel/sertifika-editor/${onizle.id}`)}>
                <PencilIcon /> Düzenle
              </Button>
            )}
          </div>
          <div className="overflow-auto rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <SertifikaOnizleme
              elemanlar={sablonDuzen(onizle, onizleYon, onizleYuzu)}
              yon={onizleYon}
              zemin={onizle.zemin}
              veri={ORNEK_VERI}
              olcek={onizleYon === 'yatay' ? 0.62 : 0.58}
            />
          </div>
        </div>
      )}
    </div>
  )
}
