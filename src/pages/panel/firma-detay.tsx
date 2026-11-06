import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  Building2Icon,
  CircleCheckIcon,
  CircleOffIcon,
  ClipboardListIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  SirenIcon,
  UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EkIkon } from '@/components/form-bits'
import { PersonelChip } from '@/components/ekip/badges'
import { FirmaAvatar } from '@/components/firmalar/firma-avatar'
import {
  EksikGorev,
  FirmaDurumBadge,
  KatipDurumBadge,
  KalanGunBadge,
  TehlikeBadge,
} from '@/components/firmalar/badges'
import { DurumBadge, RiskBadge, TurBadge } from '@/components/olaylar/badges'
import { OlayDetailDrawer } from '@/components/olaylar/olay-detail-drawer'
import { FirmaFormDrawer } from '@/components/firmalar/firma-form-drawer'
import { FirmaKullanicilariTab } from '@/components/firmalar/firma-kullanicilari'
import { FirmaEvraklarPanel } from '@/components/firmalar/firma-evraklar'
import { KatipFormDrawer } from '@/components/firmalar/katip-form-drawer'
import { KatipDetailDrawer } from '@/components/firmalar/katip-detail-drawer'
import { Pill } from '@/components/pill'
import { formatKisa, gunFarki } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useOsgb } from '@/lib/osgb'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useOlaylarStore } from '@/stores/olaylar-store'
import { adSoyad, gorevlendirmeTone } from '@/data/ekip'
import { eksikAlanlar, sozlesmeDurumu } from '@/data/firmalar'
import type { Olay } from '@/data/olaylar'
import type { KatipKayit } from '@/data/isgkatip'

const SEKMELER = [
  'Genel Bakış',
  'İSG-KATİP',
  'İSG Personeli',
  'Sözleşmeler',
  'Olay Bildirimleri',
  'Firma Kullanıcıları',
  'Belgeler',
  'İşlem Geçmişi',
] as const

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{baslik}</h3>
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

export default function FirmaDetayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const katip = useFirmalarStore((s) => s.katip)
  const firmaDurumAyarla = useFirmalarStore((s) => s.firmaDurumAyarla)
  const olaylar = useOlaylarStore((s) => s.olaylar)
  const ekipUyeler = useEkipStore((s) => s.uyeler)
  const ekipGrv = useEkipStore((s) => s.gorevlendirmeler)
  const kurum = useOsgb()

  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]>('Genel Bakış')
  const [duzenle, setDuzenle] = useState(false)
  const [katipYeni, setKatipYeni] = useState(false)
  const [katipSecili, setKatipSecili] = useState<string | null>(null)
  const [katipDuzenle, setKatipDuzenle] = useState<KatipKayit | null>(null)
  const [olaySecili, setOlaySecili] = useState<Olay | null>(null)

  const firma = firmalar.find((f) => f.id === id)
  const katipList = katip.filter((k) => k.firmaId === id)
  const firmaOlaylar = olaylar.filter((o) => o.firmaId === id || o.firma === firma?.unvan)
  const seciliKatip = katip.find((k) => k.id === katipSecili) ?? null
  const firmaGrv = ekipGrv.filter((g) => g.firmaId === id)

  if (!firma) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
        <Building2Icon className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Firma bulunamadı</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/panel/firmalar')}>
          Firmalara dön
        </Button>
      </div>
    )
  }

  const eksikler = eksikAlanlar(firma)
  const sd = sozlesmeDurumu(firma)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Firma başlık kartı */}
      <div className="rounded-xl border bg-card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            <FirmaAvatar ad={firma.kisaAd || firma.unvan} logo={firma.logo} className="size-11 rounded-xl text-sm" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight">{firma.unvan}</h1>
                <span className="font-mono text-xs text-muted-foreground">{firma.kod}</span>
                <FirmaDurumBadge durum={firma.durum} />
                <TehlikeBadge sinif={firma.tehlikeSinifi} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheckIcon className="size-3" /> {kurum.kisaAd || kurum.unvan}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3" /> {firma.il} / {firma.ilce}
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="size-3" /> {firma.calisanSayisi} çalışan
                </span>
                {firma.telefon && (
                  <span className="inline-flex items-center gap-1">
                    <PhoneIcon className="size-3" /> {firma.telefon}
                  </span>
                )}
                {firma.eposta && (
                  <span className="inline-flex items-center gap-1">
                    <MailIcon className="size-3" /> {firma.eposta}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setKatipYeni(true)}>
              <PlusIcon /> İSG-KATİP Kaydı
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDuzenle(true)}>
              <PencilIcon /> Düzenle
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="icon" className="size-8" aria-label="Diğer" />
                }
              >
                ⋮
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {firma.durum === 'Aktif' ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      firmaDurumAyarla(firma.id, 'Pasif', 'Detay sayfası')
                      toast.success('Firma pasife alındı — İSG-KATİP kayıtları korunuyor')
                    }}
                  >
                    <CircleOffIcon /> Pasife al
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      firmaDurumAyarla(firma.id, 'Aktif', 'Detay sayfası')
                      toast.success('Firma aktifleştirildi')
                    }}
                  >
                    <CircleCheckIcon /> Aktifleştir
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/panel/firmalar')}>
                  Listeye dön
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {eksikler.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
            <SirenIcon className="size-3.5" />
            Zorunlu alan eksikleri: {eksikler.join(', ')}
          </p>
        )}
      </div>

      {/* Sekmeler */}
      <div className="flex items-center gap-1 overflow-x-auto border-b">
        {SEKMELER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSekme(s)}
            className={cn(
              'relative px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors',
              sekme === s ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s}
            {s === 'İSG-KATİP' && katipList.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">{katipList.length}</span>
            )}
            {s === 'Olay Bildirimleri' && firmaOlaylar.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">{firmaOlaylar.length}</span>
            )}
            {sekme === s && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber-400" />}
          </button>
        ))}
      </div>

      {/* Sekme içeriği */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {sekme === 'Genel Bakış' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Bolum baslik="Firma bilgileri">
              <div className="rounded-xl border px-4 py-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                  <Bilgi label="Vergi Dairesi">{firma.vergiDairesi}</Bilgi>
                  <Bilgi label="Vergi No">{firma.vergiNo || '—'}</Bilgi>
                  <Bilgi label="SGK Sicil">{firma.sgkSicil || '—'}</Bilgi>
                  <Bilgi label="MERSİS">{firma.mersis || '—'}</Bilgi>
                  <Bilgi label="NACE">{firma.nace || '—'}</Bilgi>
                  <Bilgi label="Faaliyet">{firma.faaliyet || '—'}</Bilgi>
                  <Bilgi label="Yetkili">{firma.yetkili || '—'}</Bilgi>
                  <Bilgi label="Adres" >
                    {firma.adres || '—'}
                  </Bilgi>
                </dl>
              </div>
            </Bolum>
            <Bolum baslik="İSG hizmet durumu">
              <div className="rounded-xl border px-4 py-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                  <Bilgi label="Hizmet türü">{firma.hizmetTuru}</Bilgi>
                  <Bilgi label="Uzman">
                    {firma.uzman ? `${firma.uzman}${firma.uzmanSinifi ? ` (${firma.uzmanSinifi})` : ''}` : '—'}
                  </Bilgi>
                  <Bilgi label="Hekim">{firma.hekim || '—'}</Bilgi>
                  <Bilgi label="DSP">{firma.dsp || '—'}</Bilgi>
                  <Bilgi label="Başlangıç">{firma.hizmetBaslangic ? formatKisa(firma.hizmetBaslangic) : '—'}</Bilgi>
                  <Bilgi label="Aylık süre">{firma.aylikSure || '—'}</Bilgi>
                </dl>
                <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-xs">
                  <span className="text-muted-foreground">Sözleşme bitişi</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">
                      {firma.hizmetBitis ? formatKisa(firma.hizmetBitis) : '—'}
                    </span>
                    {firma.hizmetBitis && <KalanGunBadge bitis={firma.hizmetBitis} />}
                  </span>
                </div>
              </div>
            </Bolum>
          </div>
        )}

        {sekme === 'İSG-KATİP' && (
          <div className="space-y-2.5">
            {katipList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
                <ClipboardListIcon className="size-7 text-muted-foreground/50" />
                <p className="text-sm font-medium">Bu firmaya ait İSG-KATİP kaydı yok</p>
                <Button variant="outline" size="sm" onClick={() => setKatipYeni(true)}>
                  <PlusIcon /> Kayıt oluştur
                </Button>
              </div>
            ) : (
              katipList.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKatipSecili(k.id)}
                  className="flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {k.sozlesmeNo}
                      <KatipDurumBadge durum={k.durum} />
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {k.sozlesmeTuru} · {formatKisa(k.sozlesmeBaslangic)} → {formatKisa(k.sozlesmeBitis)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {k.uzman ? <span>{k.uzman}</span> : <EksikGorev rol="Uzman" />}
                    <KalanGunBadge bitis={k.sozlesmeBitis} />
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {sekme === 'İSG Personeli' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[
                { rol: 'İş Güvenliği Uzmanı', kisi: firma.uzman, ek: firma.uzmanSinifi ? `${firma.uzmanSinifi} sınıfı` : '' },
                { rol: 'İşyeri Hekimi', kisi: firma.hekim, ek: '' },
                { rol: 'Diğer Sağlık Personeli', kisi: firma.dsp, ek: '' },
              ].map((p) => {
                const pers = ekipUyeler.find((u) => adSoyad(u) === p.kisi)
                return (
                  <button
                    key={p.rol}
                    type="button"
                    disabled={!pers}
                    onClick={() => pers && navigate(`/panel/ekip/${pers.id}`)}
                    className={cn(
                      'rounded-xl border px-4 py-3 text-left transition-colors',
                      pers && 'hover:border-foreground/30',
                    )}
                  >
                    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <UserIcon className="size-3" /> {p.rol}
                    </p>
                    <p className={cn('mt-1 text-sm font-medium', !p.kisi && 'text-red-600 dark:text-red-400')}>
                      {p.kisi || 'Görevlendirilmedi'}
                    </p>
                    {p.ek && <p className="text-xs text-muted-foreground">{p.ek}</p>}
                  </button>
                )
              })}
            </div>
            <Bolum baslik="Ekip görevlendirmeleri">
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-3.5 py-2 font-medium">Personel</th>
                      <th className="px-3.5 py-2 font-medium">Görev türü</th>
                      <th className="px-3.5 py-2 font-medium">Başlangıç</th>
                      <th className="px-3.5 py-2 font-medium">Bitiş</th>
                      <th className="px-3.5 py-2 font-medium">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firmaGrv.map((g) => {
                      const pers = ekipUyeler.find((u) => u.id === g.personelId)
                      return (
                        <tr
                          key={g.id}
                          onClick={() => pers && navigate(`/panel/ekip/${pers.id}`)}
                          className="cursor-pointer border-b last:border-b-0 hover:bg-muted/50"
                        >
                          <td className="px-3.5 py-2.5">
                            {pers ? <PersonelChip uye={pers} /> : g.personelId}
                          </td>
                          <td className="px-3.5 py-2.5"><Pill tone="sky">{g.gorevTuru}</Pill></td>
                          <td className="px-3.5 py-2.5 tabular-nums">{formatKisa(g.baslangic)}</td>
                          <td className="px-3.5 py-2.5 tabular-nums">{g.bitis ? formatKisa(g.bitis) : '—'}</td>
                          <td className="px-3.5 py-2.5">
                            <Pill tone={gorevlendirmeTone[g.durum]}>{g.durum}</Pill>
                          </td>
                        </tr>
                      )
                    })}
                    {firmaGrv.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3.5 py-8 text-center text-xs text-muted-foreground">
                          Bu firma için ekip görevlendirmesi yok — personel detayından ekleyin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Bolum>
          </div>
        )}

        {sekme === 'Sözleşmeler' && (
          <div className="space-y-2.5">
            <div className="rounded-xl border px-4 py-3">
              <p className="text-sm font-medium">Hizmet sözleşmesi</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                <Bilgi label="Tür">{firma.hizmetTuru}</Bilgi>
                <Bilgi label="Başlangıç">{firma.hizmetBaslangic ? formatKisa(firma.hizmetBaslangic) : '—'}</Bilgi>
                <Bilgi label="Bitiş">{firma.hizmetBitis ? formatKisa(firma.hizmetBitis) : '—'}</Bilgi>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Durum</dt>
                  <dd className="mt-0.5 flex items-center gap-2">
                    <Pill tone={sd === 'Aktif' ? 'green' : sd === 'Yaklaşıyor' ? 'orange' : sd === 'Doldu' ? 'red' : 'zinc'}>
                      {sd}
                    </Pill>
                    {firma.hizmetBitis && <KalanGunBadge bitis={firma.hizmetBitis} />}
                  </dd>
                </div>
              </dl>
            </div>
            {katipList.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKatipSecili(k.id)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors hover:border-foreground/30"
              >
                <div>
                  <p className="text-sm font-medium">{k.sozlesmeNo} — {k.sozlesmeTuru}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {formatKisa(k.sozlesmeBaslangic)} → {formatKisa(k.sozlesmeBitis)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <KalanGunBadge bitis={k.sozlesmeBitis} />
                  <KatipDurumBadge durum={k.durum} />
                </div>
              </button>
            ))}
          </div>
        )}

        {sekme === 'Olay Bildirimleri' && (
          <div className="space-y-2.5">
            {firmaOlaylar.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
                <SirenIcon className="size-7 text-muted-foreground/50" />
                <p className="text-sm font-medium">Bu firmaya ait olay kaydı yok</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/panel/olaylar')}>
                  Olay Bildirimleri'ne git
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-3.5 py-2 text-xs font-medium text-muted-foreground">No</th>
                      <th className="px-3.5 py-2 text-xs font-medium text-muted-foreground">Tarih</th>
                      <th className="px-3.5 py-2 text-xs font-medium text-muted-foreground">Başlık</th>
                      <th className="px-3.5 py-2 text-xs font-medium text-muted-foreground">Tür</th>
                      <th className="px-3.5 py-2 text-xs font-medium text-muted-foreground">Risk</th>
                      <th className="px-3.5 py-2 text-xs font-medium text-muted-foreground">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firmaOlaylar.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => setOlaySecili(o)}
                        className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/50"
                      >
                        <td className="px-3.5 py-2 font-mono text-xs font-medium whitespace-nowrap">{o.id}</td>
                        <td className="px-3.5 py-2 whitespace-nowrap tabular-nums">
                          {formatKisa(o.tarih)} <span className="text-xs text-muted-foreground">{o.saat}</span>
                        </td>
                        <td className="max-w-72 truncate px-3.5 py-2 font-medium">{o.baslik}</td>
                        <td className="px-3.5 py-2"><TurBadge tur={o.tur} /></td>
                        <td className="px-3.5 py-2"><RiskBadge risk={o.risk} /></td>
                        <td className="px-3.5 py-2"><DurumBadge durum={o.durum} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {sekme === 'Firma Kullanıcıları' && <FirmaKullanicilariTab firma={firma} />}
        {sekme === 'Belgeler' && (
          <div className="space-y-5">
            <FirmaEvraklarPanel firmaId={firma.id} />
            <div className="space-y-2.5">
            {firma.ekler.length === 0 && katipList.every((k) => k.belgeler.length === 0) ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
                <ClipboardListIcon className="size-7 text-muted-foreground/50" />
                <p className="text-sm font-medium">Belge eklenmedi</p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {firma.ekler.map((e, i) => (
                  <li key={i} className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm">
                    <EkIkon tur={e.tur} />
                    <span className="min-w-0 flex-1 truncate font-medium">{e.ad}</span>
                    <span className="text-xs text-muted-foreground">{e.boyut}</span>
                  </li>
                ))}
                {katipList.flatMap((k) =>
                  k.belgeler.map((b, i) => (
                    <li key={`${k.id}-${i}`} className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm">
                      <EkIkon tur={b.tur} />
                      <span className="min-w-0 flex-1 truncate font-medium">{b.ad}</span>
                      <span className="text-xs text-muted-foreground">{k.id}</span>
                    </li>
                  )),
                )}
              </ul>
            )}
            </div>
          </div>
        )}

        {sekme === 'İşlem Geçmişi' && (
          <ul className="space-y-0 rounded-xl border px-4 py-2">
            {[...firma.islemGecmisi]
              .sort((a, b) => b.tarih.localeCompare(a.tarih))
              .map((g, i) => (
                <li key={i} className="flex items-baseline gap-3 border-b py-2.5 last:border-b-0">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatKisa(g.tarih)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{g.islem}</p>
                    {g.not && <p className="text-xs text-muted-foreground">{g.not}</p>}
                  </div>
                  {i === 0 && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {gunFarki(g.tarih, firma.islemGecmisi[firma.islemGecmisi.length - 1]?.tarih ?? g.tarih) > 0
                        ? ''
                        : 'son işlem'}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>

      {duzenle && <FirmaFormDrawer firma={firma} onKapat={() => setDuzenle(false)} />}
      {katipYeni && <KatipFormDrawer kayit={null} firmaId={firma.id} onKapat={() => setKatipYeni(false)} />}
      <KatipDetailDrawer
        kayit={seciliKatip}
        onKapat={() => setKatipSecili(null)}
        onDuzenle={(k) => {
          setKatipSecili(null)
          setKatipDuzenle(k)
        }}
      />
      {katipDuzenle && (
        <KatipFormDrawer kayit={katipDuzenle} onKapat={() => setKatipDuzenle(null)} />
      )}
      <OlayDetailDrawer
        olay={olaySecili ? (olaylar.find((o) => o.id === olaySecili.id) ?? olaySecili) : null}
        onKapat={() => setOlaySecili(null)}
        onDuzenle={() => setOlaySecili(null)}
      />
    </div>
  )
}
