import { toast } from 'sonner'
import {
  Building2Icon,
  ChevronDownIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  PencilIcon,
  UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { EkIkon } from '@/components/form-bits'
import { FirmaDurumBadge, KatipDurumBadge, KalanGunBadge, TehlikeBadge } from './badges'
import { formatKisa } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { KATIP_DURUMLAR } from '@/data/isgkatip'
import type { KatipKayit } from '@/data/isgkatip'

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

function Bilgi({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] font-medium">{children ?? '—'}</dd>
    </div>
  )
}

/** Yatay zaman çizelgesi: sözleşme/görevlendirme işlemleri kronolojik sırayla */
function ZamanCizgisi({ kayit }: { kayit: KatipKayit }) {
  const olaylar = [...kayit.zamanCizgisi].sort((a, b) => a.tarih.localeCompare(b.tarih))
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-start">
        {olaylar.map((z, i) => {
          const son = i === olaylar.length - 1
          return (
            <div key={i} className="flex min-w-0 items-start">
              <div className="flex w-28 shrink-0 flex-col items-center gap-1 text-center">
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold',
                    son
                      ? 'border-amber-500 bg-amber-400 text-zinc-950 ring-4 ring-amber-400/20'
                      : 'border-emerald-500 bg-emerald-500 text-white',
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-[10px] leading-tight font-medium">{z.islem}</span>
                <span className="text-[9.5px] text-muted-foreground tabular-nums">
                  {formatKisa(z.tarih)}
                </span>
              </div>
              {!son && <div className="mt-2.5 h-px w-8 shrink-0 bg-border" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function KatipDetailDrawer({
  kayit,
  onKapat,
  onDuzenle,
}: {
  kayit: KatipKayit | null
  onKapat: () => void
  onDuzenle: (k: KatipKayit) => void
}) {
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const katipDurumGuncelle = useFirmalarStore((s) => s.katipDurumGuncelle)
  const firma = kayit ? firmalar.find((f) => f.id === kayit.firmaId) : undefined

  return (
    <Sheet open={!!kayit} onOpenChange={(a) => !a && onKapat()}>
      <SheetContent className="w-full max-w-xl gap-0 p-0" aria-describedby={undefined}>
        {kayit && (
          <>
            <div className="border-b px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg">
                    {firma?.unvan ?? 'Firma bulunamadı'}
                  </SheetTitle>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {kayit.id} · {kayit.sozlesmeNo}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <KatipDurumBadge durum={kayit.durum} />
                  <Button variant="outline" size="icon" className="size-8" onClick={() => onDuzenle(kayit)} aria-label="Düzenle">
                    <PencilIcon />
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <Bolum baslik="Süreç zaman çizelgesi">
                <ZamanCizgisi kayit={kayit} />
              </Bolum>

              {firma && (
                <Bolum baslik="Firma bilgileri">
                  <div className="flex items-start gap-3 rounded-xl border px-3.5 py-3">
                    <Building2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                      <Bilgi label="Vergi No">{firma.vergiNo || '—'}</Bilgi>
                      <Bilgi label="SGK Sicil">{firma.sgkSicil || '—'}</Bilgi>
                      <Bilgi label="Çalışan">{firma.calisanSayisi}</Bilgi>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Tehlike Sınıfı</dt>
                        <dd className="mt-0.5">
                          <TehlikeBadge sinif={firma.tehlikeSinifi} />
                        </dd>
                      </div>
                      <Bilgi label="Konum">
                        {firma.il} / {firma.ilce}
                      </Bilgi>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Firma Durumu</dt>
                        <dd className="mt-0.5">
                          <FirmaDurumBadge durum={firma.durum} />
                        </dd>
                      </div>
                    </dl>
                  </div>
                </Bolum>
              )}

              <Bolum baslik="Görevlendirilmiş personel">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { rol: 'İş Güvenliği Uzmanı', kisi: kayit.uzman, ek: kayit.uzmanSinifi ? `${kayit.uzmanSinifi} sınıfı` : '' },
                    { rol: 'İşyeri Hekimi', kisi: kayit.hekim, ek: '' },
                    { rol: 'Diğer Sağlık Personeli', kisi: kayit.dsp, ek: '' },
                  ].map((p) => (
                    <div key={p.rol} className="rounded-xl border px-3 py-2.5">
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <UserIcon className="size-3" /> {p.rol}
                      </p>
                      <p className={cn('mt-1 text-[13px] font-medium', !p.kisi && 'text-red-600 dark:text-red-400')}>
                        {p.kisi || 'Görevlendirilmedi'}
                      </p>
                      {p.ek && <p className="text-xs text-muted-foreground">{p.ek}</p>}
                    </div>
                  ))}
                </div>
              </Bolum>

              <Bolum baslik="Sözleşme detayları">
                <div className="rounded-xl border px-3.5 py-3">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                    <Bilgi label="Sözleşme No">{kayit.sozlesmeNo}</Bilgi>
                    <Bilgi label="Tür">{kayit.sozlesmeTuru}</Bilgi>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">Kalan Süre</dt>
                      <dd className="mt-0.5">
                        <KalanGunBadge bitis={kayit.sozlesmeBitis} />
                      </dd>
                    </div>
                    <Bilgi label="Başlangıç">{formatKisa(kayit.sozlesmeBaslangic)}</Bilgi>
                    <Bilgi label="Bitiş">{formatKisa(kayit.sozlesmeBitis)}</Bilgi>
                    <Bilgi label="Görevlendirme">
                      {formatKisa(kayit.gorevBaslangic)} → {kayit.gorevBitis ? formatKisa(kayit.gorevBitis) : 'açık'}
                    </Bilgi>
                  </dl>
                  {kayit.aciklama && (
                    <p className="mt-2 border-t pt-2 text-xs leading-relaxed text-muted-foreground">
                      {kayit.aciklama}
                    </p>
                  )}
                </div>
              </Bolum>

              {kayit.belgeler.length > 0 && (
                <Bolum baslik="Belge ekleri">
                  <ul className="flex flex-wrap gap-2">
                    {kayit.belgeler.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
                      >
                        <EkIkon tur={b.tur} />
                        <span className="font-medium">{b.ad}</span>
                        <span className="text-muted-foreground">{b.boyut}</span>
                      </li>
                    ))}
                  </ul>
                </Bolum>
              )}

              <Bolum baslik="Kayıt / değişiklik geçmişi">
                <ul className="space-y-0">
                  {[...kayit.zamanCizgisi]
                    .sort((a, b) => b.tarih.localeCompare(a.tarih))
                    .map((z, i) => (
                      <li key={i} className="flex gap-2.5 border-l pl-3 pb-3 last:pb-0">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-[13px] font-medium">
                            <ClipboardListIcon className="size-3 shrink-0 text-muted-foreground" />
                            {z.islem}
                            <span className="text-xs font-normal text-muted-foreground tabular-nums">
                              {formatKisa(z.tarih)}
                            </span>
                          </p>
                          {z.not && <p className="mt-0.5 text-xs text-muted-foreground">{z.not}</p>}
                        </div>
                      </li>
                    ))}
                </ul>
              </Bolum>
            </div>

            <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileTextIcon className="size-3.5" />
                Kayıt durumu
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                  <KatipDurumBadge durum={kayit.durum} /> <ChevronDownIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {KATIP_DURUMLAR.filter((d) => d !== kayit.durum).map((d) => (
                    <DropdownMenuItem
                      key={d}
                      onClick={() => {
                        katipDurumGuncelle(kayit.id, d)
                        toast.success(`${kayit.id} → ${d}`)
                      }}
                    >
                      <CircleCheckIcon /> {d}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
