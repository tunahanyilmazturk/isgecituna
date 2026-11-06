import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  Building2Icon,
  CircleCheckIcon,
  CircleOffIcon,
  MailIcon,
  MailPlusIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  RotateCcwKeyIcon,
  ShieldCheckIcon,
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
import { Input } from '@/components/ui/input'
import { EkIkon, Sec } from '@/components/form-bits'
import {
  Avatar,
  GorevBadge,
  HesapBadge,
  PersonelDurumBadge,
  SinifBadge,
} from '@/components/ekip/badges'
import { EkipFormDrawer } from '@/components/ekip/ekip-form-drawer'
import { DurumBadge, RiskBadge, TurBadge } from '@/components/olaylar/badges'
import { OlayDetailDrawer } from '@/components/olaylar/olay-detail-drawer'
import { KatipDurumBadge } from '@/components/firmalar/badges'
import { Pill } from '@/components/pill'
import { formatKisa, gunFarki } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useEkipStore } from '@/stores/ekip-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useOlaylarStore } from '@/stores/olaylar-store'
import {
  adSoyad,
  BUGUN,
  gorevlendirmeTone,
  gorevRol,
  MODULLER,
  IZINLER,
  ROLLER,
  ROL_ADLARI,
  type Gorevlendirme,
} from '@/data/ekip'
import type { Olay } from '@/data/olaylar'

const SEKMELER = [
  'Genel Bakış',
  'Mesleki Bilgiler',
  'Sorumlu Olduğu Firmalar',
  'İSG-KATİP',
  'Olay Bildirimleri',
  'Görevler',
  'Belgeler',
  'Kullanıcı & Yetkiler',
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

export default function EkipDetayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const uyeler = useEkipStore((s) => s.uyeler)
  const hesaplar = useEkipStore((s) => s.hesaplar)
  const gorevlendirmeler = useEkipStore((s) => s.gorevlendirmeler)
  const uyeDurum = useEkipStore((s) => s.uyeDurum)
  const hesapDurum = useEkipStore((s) => s.hesapDurum)
  const hesapGuncelle = useEkipStore((s) => s.hesapGuncelle)
  const hesapOlustur = useEkipStore((s) => s.hesapOlustur)
  const gorevlendirmeEkle = useEkipStore((s) => s.gorevlendirmeEkle)
  const gorevlendirmeBitir = useEkipStore((s) => s.gorevlendirmeBitir)
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const katip = useFirmalarStore((s) => s.katip)
  const olaylar = useOlaylarStore((s) => s.olaylar)

  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]>('Genel Bakış')
  const [duzenle, setDuzenle] = useState(false)
  const [olaySecili, setOlaySecili] = useState<Olay | null>(null)
  const [yeniGrv, setYeniGrv] = useState(false)
  const [grvFirma, setGrvFirma] = useState('')
  const [grvTur, setGrvTur] = useState<Gorevlendirme['gorevTuru']>('Uzman')
  const [grvBaslangic, setGrvBaslangic] = useState(BUGUN)

  const uye = uyeler.find((u) => u.id === id)
  const hesap = uye ? hesaplar.find((h) => h.personelId === uye.id) : undefined
  const ad = uye ? adSoyad(uye) : ''

  const uyeId = uye?.id
  const grvList = uyeId ? gorevlendirmeler.filter((g) => g.personelId === uyeId) : []
  const firmaMap = useMemo(() => new Map(firmalar.map((f) => [f.id, f])), [firmalar])
  const katipList = katip.filter((k) => [k.uzman, k.hekim, k.dsp].includes(ad))
  const sorumluOlaylar = olaylar.filter((o) => o.sorumlu === ad)
  const gorevler = olaylar.flatMap((o) =>
    o.aksiyonlar.filter((a) => a.sorumlu === ad).map((a) => ({ olay: o, a })),
  )

  if (!uye) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
        <UserIcon className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">Personel bulunamadı</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/panel/ekip')}>
          Ekibe dön
        </Button>
      </div>
    )
  }

  const aktifGrv = grvList.filter((g) => g.durum === 'Aktif')
  const acikGorevler = gorevler.filter((g) => !g.a.tamamlandi)
  const gecikenGorevler = acikGorevler.filter((g) => g.a.hedefBitis < BUGUN)
  const belgeKalan = uye.belgeGecerlilik ? gunFarki(BUGUN, uye.belgeGecerlilik) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Personel başlık kartı */}
      <div className="rounded-xl border bg-card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            <Avatar uye={uye} boyut="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight">{ad}</h1>
                <span className="font-mono text-xs text-muted-foreground">{uye.id}</span>
                <PersonelDurumBadge durum={uye.durum} />
                <HesapBadge
                  hesap={hesap ? hesap.durum : 'Hesap Yok'}
                  kullaniciAdi={hesap?.kullaniciAdi}
                />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <GorevBadge gorev={uye.gorev} />
                {uye.uzmanSinifi && <SinifBadge sinif={uye.uzmanSinifi} />}
                {(uye.brans || uye.meslekTuru) && (
                  <Pill tone="sky">{uye.brans || uye.meslekTuru}</Pill>
                )}
                <span className="inline-flex items-center gap-1">
                  <PhoneIcon className="size-3" /> {uye.telefon}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MailIcon className="size-3" /> {uye.eposta}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                {!hesap && (
                  <DropdownMenuItem
                    onClick={() => {
                      hesapOlustur({
                        personelId: uye.id,
                        kullaniciAdi: `${uye.ad[0] ?? ''}${uye.soyad}`
                          .toLocaleLowerCase('tr')
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/\s+/g, ''),
                        eposta: uye.eposta,
                        rol: gorevRol[uye.gorev] ?? 'İdari Personel',
                        durum: 'Davet Bekliyor',
                        davetTarihi: BUGUN,
                      })
                      toast.success('Kullanıcı hesabı oluşturuldu — davet gönderildi')
                    }}
                  >
                    <MailPlusIcon /> Hesap oluştur & davet gönder
                  </DropdownMenuItem>
                )}
                {uye.durum === 'Aktif' || uye.durum === 'İzinli' ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      uyeDurum(uye.id, 'Pasif')
                      toast.success('Personel pasife alındı — geçmiş kayıtlar korunuyor')
                    }}
                  >
                    <CircleOffIcon /> Pasife al
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      uyeDurum(uye.id, 'Aktif')
                      toast.success('Personel aktifleştirildi')
                    }}
                  >
                    <CircleCheckIcon /> Aktifleştir
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/panel/ekip')}>
                  Listeye dön
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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
            {s === 'Sorumlu Olduğu Firmalar' && aktifGrv.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">{aktifGrv.length}</span>
            )}
            {s === 'İSG-KATİP' && katipList.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">{katipList.length}</span>
            )}
            {s === 'Olay Bildirimleri' && sorumluOlaylar.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">{sorumluOlaylar.length}</span>
            )}
            {s === 'Görevler' && acikGorevler.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">{acikGorevler.length}</span>
            )}
            {sekme === s && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber-400" />}
          </button>
        ))}
      </div>

      {/* Sekme içeriği */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {sekme === 'Genel Bakış' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-5">
              {[
                { l: 'Sorumlu firma', v: aktifGrv.length },
                { l: 'Toplam görevlendirme', v: grvList.length },
                { l: 'Açık görev', v: acikGorevler.length, uyari: gecikenGorevler.length > 0 },
                { l: 'Sorumlu olay', v: sorumluOlaylar.filter((o) => o.durum !== 'Kapatıldı').length },
                {
                  l: 'Belge geçerlilik',
                  v: uye.belgeGecerlilik ? formatKisa(uye.belgeGecerlilik) : '—',
                  uyari: belgeKalan !== null && belgeKalan <= 30,
                },
              ].map((s) => (
                <div key={s.l} className="bg-card px-4 py-3">
                  <p className="text-[11px] text-muted-foreground">{s.l}</p>
                  <p className={cn('mt-1 text-lg font-semibold tabular-nums', s.uyari && 'text-amber-600 dark:text-amber-400')}>
                    {s.v}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Bolum baslik="Kişisel bilgiler">
                <div className="rounded-xl border px-4 py-3">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                    <Bilgi label="TC Kimlik">{uye.tc ?? '—'}</Bilgi>
                    <Bilgi label="Doğum tarihi">{uye.dogumTarihi ? formatKisa(uye.dogumTarihi) : '—'}</Bilgi>
                    <Bilgi label="Telefon">{uye.telefon}</Bilgi>
                    <Bilgi label="E-posta">{uye.eposta}</Bilgi>
                    <Bilgi label="Dahili">{uye.dahiliTel ?? '—'}</Bilgi>
                    <Bilgi label="Adres">{uye.adres ?? '—'}</Bilgi>
                  </dl>
                </div>
              </Bolum>
              <Bolum baslik="Çalışma bilgileri">
                <div className="rounded-xl border px-4 py-3">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                    <Bilgi label="İşe giriş">{formatKisa(uye.iseGiris)}</Bilgi>
                    <Bilgi label="Departman">{uye.departman ?? '—'}</Bilgi>
                    <Bilgi label="Pozisyon">{uye.pozisyon ?? '—'}</Bilgi>
                    <Bilgi label="Çalışma tipi">{uye.calismaTipi ?? '—'}</Bilgi>
                    <Bilgi label="Durum">{uye.durum}</Bilgi>
                    <Bilgi label="Deneyim">{uye.deneyimYili ?? '—'}</Bilgi>
                  </dl>
                  {uye.aciklama && (
                    <p className="mt-2.5 border-t pt-2.5 text-xs text-muted-foreground">{uye.aciklama}</p>
                  )}
                </div>
              </Bolum>
            </div>
          </div>
        )}

        {sekme === 'Mesleki Bilgiler' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Bolum baslik="Mesleki kayıt">
              <div className="rounded-xl border px-4 py-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <Bilgi label="Görev">{uye.gorev}</Bilgi>
                  {uye.uzmanSinifi && (
                    <Bilgi label="Uzmanlık sınıfı">{uye.uzmanSinifi} Sınıfı</Bilgi>
                  )}
                  {uye.brans !== undefined && uye.gorev === 'İşyeri Hekimi' && (
                    <Bilgi label="Branş">{uye.brans || '—'}</Bilgi>
                  )}
                  {uye.meslekTuru && <Bilgi label="Meslek türü">{uye.meslekTuru}</Bilgi>}
                  <Bilgi label="İSG-KATİP kayıt">{uye.katipKaydi ?? '—'}</Bilgi>
                  <Bilgi label="Belge no">{uye.belgeNo ?? uye.diplomaNo ?? '—'}</Bilgi>
                  <Bilgi label="Mesleki kayıt no">{uye.meslekiKayitNo ?? '—'}</Bilgi>
                </dl>
              </div>
            </Bolum>
            <Bolum baslik="Belge geçerlilik">
              <div className="rounded-xl border px-4 py-3">
                {uye.belgeGecerlilik ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium tabular-nums">{formatKisa(uye.belgeGecerlilik)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {belgeKalan !== null && belgeKalan < 0
                          ? `${Math.abs(belgeKalan)} gün önce doldu`
                          : `${belgeKalan} gün kaldı`}
                      </p>
                    </div>
                    <Pill
                      tone={
                        belgeKalan !== null && belgeKalan < 0
                          ? 'red'
                          : belgeKalan !== null && belgeKalan <= 30
                            ? 'amber'
                            : 'green'
                      }
                    >
                      {belgeKalan !== null && belgeKalan < 0
                        ? 'Süresi doldu'
                        : belgeKalan !== null && belgeKalan <= 30
                          ? 'Yenileme zamanı'
                          : 'Geçerli'}
                    </Pill>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Belge geçerlilik bilgisi girilmemiş.</p>
                )}
              </div>
            </Bolum>
          </div>
        )}

        {sekme === 'Sorumlu Olduğu Firmalar' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {aktifGrv.length} aktif · {grvList.length} toplam görevlendirme — geçmiş kayıtlar korunur
              </p>
              <Button variant="outline" size="sm" onClick={() => setYeniGrv((a) => !a)}>
                <PlusIcon /> Görevlendirme ekle
              </Button>
            </div>
            {yeniGrv && (
              <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed p-3">
                <div className="min-w-52 flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Firma</label>
                  <Sec
                    value={grvFirma || 'Seçiniz'}
                    onChange={(v) => setGrvFirma(v === 'Seçiniz' ? '' : v)}
                    options={['Seçiniz', ...firmalar.filter((f) => f.durum === 'Aktif').map((f) => f.id)]}
                  />
                </div>
                <div className="w-36">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Görev türü</label>
                  <Sec
                    value={grvTur}
                    onChange={(v) => setGrvTur(v as Gorevlendirme['gorevTuru'])}
                    options={['Uzman', 'Hekim', 'DSP', 'Diğer']}
                  />
                </div>
                <div className="w-36">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Başlangıç</label>
                  <Input type="date" value={grvBaslangic} onChange={(e) => setGrvBaslangic(e.target.value)} />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!grvFirma) {
                      toast.error('Firma seçin')
                      return
                    }
                    gorevlendirmeEkle({
                      personelId: uye.id,
                      firmaId: grvFirma,
                      gorevTuru: grvTur,
                      baslangic: grvBaslangic,
                      durum: 'Aktif',
                    })
                    toast.success(`${firmaMap.get(grvFirma)?.kisaAd ?? grvFirma} görevlendirmesi eklendi`)
                    setYeniGrv(false)
                    setGrvFirma('')
                  }}
                >
                  Ekle
                </Button>
              </div>
            )}
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-3.5 py-2 font-medium">Firma</th>
                    <th className="px-3.5 py-2 font-medium">Görev türü</th>
                    <th className="px-3.5 py-2 font-medium">Başlangıç</th>
                    <th className="px-3.5 py-2 font-medium">Bitiş</th>
                    <th className="px-3.5 py-2 font-medium">Durum</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {grvList.map((g) => {
                    const f = firmaMap.get(g.firmaId)
                    return (
                      <tr key={g.id} className="border-b last:border-b-0">
                        <td className="px-3.5 py-2.5">
                          {f ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/panel/firmalar/${f.id}`)}
                              className="flex items-center gap-1.5 font-medium hover:text-amber-600"
                            >
                              <Building2Icon className="size-3.5 text-muted-foreground" />
                              {f.kisaAd}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">{g.firmaId}</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5"><Pill tone="sky">{g.gorevTuru}</Pill></td>
                        <td className="px-3.5 py-2.5 tabular-nums">{formatKisa(g.baslangic)}</td>
                        <td className="px-3.5 py-2.5 tabular-nums">{g.bitis ? formatKisa(g.bitis) : '—'}</td>
                        <td className="px-3.5 py-2.5">
                          <Pill tone={gorevlendirmeTone[g.durum]}>{g.durum}</Pill>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          {g.durum === 'Aktif' && (
                            <button
                              type="button"
                              onClick={() => {
                                gorevlendirmeBitir(g.id)
                                toast.success('Görevlendirme sonlandırıldı')
                              }}
                              className="text-xs text-muted-foreground transition-colors hover:text-red-500"
                            >
                              Sonlandır
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {grvList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3.5 py-8 text-center text-xs text-muted-foreground">
                        Henüz firma görevlendirmesi yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sekme === 'İSG-KATİP' && (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-3.5 py-2 font-medium">Kayıt</th>
                  <th className="px-3.5 py-2 font-medium">Firma</th>
                  <th className="px-3.5 py-2 font-medium">Görevi</th>
                  <th className="px-3.5 py-2 font-medium">Sözleşme</th>
                  <th className="px-3.5 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {katipList.map((k) => {
                  const f = firmaMap.get(k.firmaId)
                  const gorev =
                    k.uzman === ad ? 'İSG Uzmanı' : k.hekim === ad ? 'İşyeri Hekimi' : 'DSP'
                  return (
                    <tr
                      key={k.id}
                      onClick={() => navigate('/panel/isg-katip')}
                      className="cursor-pointer border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="px-3.5 py-2.5 font-mono text-xs font-medium">{k.id}</td>
                      <td className="px-3.5 py-2.5 font-medium">{f?.kisaAd ?? k.firmaId}</td>
                      <td className="px-3.5 py-2.5"><Pill tone="sky">{gorev}</Pill></td>
                      <td className="px-3.5 py-2.5 tabular-nums text-muted-foreground">
                        {formatKisa(k.sozlesmeBaslangic)} → {formatKisa(k.sozlesmeBitis)}
                      </td>
                      <td className="px-3.5 py-2.5"><KatipDurumBadge durum={k.durum} /></td>
                    </tr>
                  )
                })}
                {katipList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3.5 py-8 text-center text-xs text-muted-foreground">
                      Bu personele ait İSG-KATİP görevlendirmesi yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {sekme === 'Olay Bildirimleri' && (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-3.5 py-2 font-medium">Olay</th>
                  <th className="px-3.5 py-2 font-medium">Tarih</th>
                  <th className="px-3.5 py-2 font-medium">Firma</th>
                  <th className="px-3.5 py-2 font-medium">Tür</th>
                  <th className="px-3.5 py-2 font-medium">Risk</th>
                  <th className="px-3.5 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {sorumluOlaylar.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setOlaySecili(o)}
                    className="cursor-pointer border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <td className="max-w-52 truncate px-3.5 py-2.5 font-medium">
                      <span className="mr-2 font-mono text-xs text-muted-foreground">{o.id}</span>
                      {o.baslik}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">
                      {formatKisa(o.tarih)}
                    </td>
                    <td className="max-w-40 truncate px-3.5 py-2.5 text-muted-foreground">
                      {o.firma}
                    </td>
                    <td className="px-3.5 py-2.5"><TurBadge tur={o.tur} /></td>
                    <td className="px-3.5 py-2.5"><RiskBadge risk={o.risk} /></td>
                    <td className="px-3.5 py-2.5"><DurumBadge durum={o.durum} /></td>
                  </tr>
                ))}
                {sorumluOlaylar.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3.5 py-8 text-center text-xs text-muted-foreground">
                      Bu personelin sorumlu olduğu olay kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {sekme === 'Görevler' && (
          <div className="space-y-2">
            {gecikenGorevler.length > 0 && (
              <p className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400">
                <AlertTriangleIcon className="size-3.5" />
                {gecikenGorevler.length} görev hedef tarihi geçti
              </p>
            )}
            {gorevler.map(({ olay: o, a }) => {
              const gecikme = !a.tamamlandi ? gunFarki(a.hedefBitis, BUGUN) : 0
              return (
                <div
                  key={a.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
                    gecikme > 0 && 'border-red-500/40 bg-red-500/5',
                    a.tamamlandi && 'opacity-70',
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium', a.tamamlandi && 'line-through')}>
                      {a.aciklama}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => setOlaySecili(o)}
                        className="font-mono hover:text-amber-600"
                      >
                        {o.id}
                      </button>
                      <span aria-hidden>·</span>
                      <span className="truncate">{o.baslik}</span>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">hedef {formatKisa(a.hedefBitis)}</span>
                    </p>
                  </div>
                  {a.tamamlandi ? (
                    <Pill tone="green">Tamamlandı</Pill>
                  ) : gecikme > 0 ? (
                    <Pill tone="red">{gecikme} gün gecikti</Pill>
                  ) : (
                    <Pill tone="amber">Açık</Pill>
                  )}
                </div>
              )
            })}
            {gorevler.length === 0 && (
              <div className="rounded-xl border px-4 py-8 text-center text-xs text-muted-foreground">
                Atanmış görev veya düzeltici faaliyet yok.
              </div>
            )}
          </div>
        )}

        {sekme === 'Belgeler' && (
          <div className="rounded-xl border px-4 py-4">
            {uye.belgeler.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {uye.belgeler.map((b, i) => (
                  <li key={`${b.ad}-${i}`}>
                    <button
                      type="button"
                      onClick={() => toast.info(`${b.ad} — önizleme (demo)`)}
                      className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                    >
                      <EkIkon tur={b.tur} />
                      <span className="font-medium">{b.ad}</span>
                      <span className="text-muted-foreground">{b.boyut}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Yüklenmiş belge yok.</p>
            )}
          </div>
        )}

        {sekme === 'Kullanıcı & Yetkiler' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Bolum baslik="Kullanıcı hesabı">
              <div className="rounded-xl border px-4 py-3">
                {hesap ? (
                  <div className="space-y-3">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <Bilgi label="Kullanıcı adı">@{hesap.kullaniciAdi}</Bilgi>
                      <Bilgi label="E-posta">{hesap.eposta}</Bilgi>
                      <Bilgi label="Durum">{hesap.durum}</Bilgi>
                      <Bilgi label="Son giriş">
                        {hesap.sonGiris
                          ? new Date(hesap.sonGiris).toLocaleString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </Bilgi>
                      <Bilgi label="Son aktiflik">
                        {hesap.sonAktiflik
                          ? new Date(hesap.sonAktiflik).toLocaleString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </Bilgi>
                      {hesap.davetTarihi && (
                        <Bilgi label="Davet tarihi">{formatKisa(hesap.davetTarihi)}</Bilgi>
                      )}
                    </dl>
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                      {hesap.durum === 'Davet Bekliyor' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            hesapDurum(uye.id, 'Davet Bekliyor', 'Davet bağlantısı yeniden gönderildi')
                            toast.success(`Davet yeniden gönderildi: ${hesap.eposta}`)
                          }}
                        >
                          <MailPlusIcon /> Daveti yeniden gönder
                        </Button>
                      )}
                      {hesap.durum !== 'Davet Bekliyor' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toast.success(`Şifre sıfırlama bağlantısı gönderildi: ${hesap.eposta}`)
                          }
                        >
                          <RotateCcwKeyIcon /> Şifre sıfırla
                        </Button>
                      )}
                      {hesap.durum === 'Aktif' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            hesapDurum(uye.id, 'Pasif', 'Yönetici tarafından devre dışı bırakıldı')
                            toast.success('Hesap devre dışı bırakıldı')
                          }}
                        >
                          <CircleOffIcon /> Devre dışı bırak
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            hesapDurum(uye.id, 'Aktif', 'Yönetici tarafından aktifleştirildi')
                            toast.success('Hesap aktifleştirildi')
                          }}
                        >
                          <CircleCheckIcon /> Aktifleştir
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Şifreler hash'lenmiş saklanır; hiçbir kullanıcıya gösterilmez. Yetki denetimi
                      API katmanında uygulanmalıdır — arayüz yalnızca görünürlüğü yönetir.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-xs text-muted-foreground">
                      Bu personel için kullanıcı hesabı yok. Hesap oluşturulunca mevcut giriş
                      ekranından giriş yapabilir.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        hesapOlustur({
                          personelId: uye.id,
                          kullaniciAdi: `${uye.ad[0] ?? ''}${uye.soyad}`
                            .toLocaleLowerCase('tr')
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/\s+/g, ''),
                          eposta: uye.eposta,
                          rol: gorevRol[uye.gorev] ?? 'İdari Personel',
                          durum: 'Davet Bekliyor',
                          davetTarihi: BUGUN,
                        })
                        toast.success('Hesap oluşturuldu — davet bağlantısı gönderildi')
                      }}
                    >
                      <MailPlusIcon /> Hesap oluştur & davet gönder
                    </Button>
                  </div>
                )}
              </div>
            </Bolum>
            <Bolum baslik="Rol ve modül izinleri">
              <div className="rounded-xl border px-4 py-3">
                {hesap ? (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheckIcon className="size-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Rol şablonu</span>
                      <div className="w-56">
                        <Sec
                          value={hesap.rol}
                          onChange={(v) => {
                            hesapGuncelle(uye.id, { rol: v as typeof hesap.rol }, `Rol değiştirildi: ${v}`)
                            toast.success(`Rol güncellendi: ${v}`)
                          }}
                          options={ROL_ADLARI}
                        />
                      </div>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">{ROLLER[hesap.rol].aciklama}</p>
                    <div className="overflow-hidden rounded-lg border">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b bg-muted/40 text-[11px] text-muted-foreground">
                            <th className="px-2.5 py-1.5 font-medium">Modül</th>
                            {IZINLER.map((i) => (
                              <th key={i} className="px-2.5 py-1.5 text-center font-medium">
                                {i}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MODULLER.map((m) => {
                            const izinler = ROLLER[hesap.rol].izinler[m] ?? []
                            return (
                              <tr key={m} className="border-b last:border-b-0">
                                <td className="px-2.5 py-1.5 font-medium">{m}</td>
                                {IZINLER.map((i) => (
                                  <td key={i} className="px-2.5 py-1.5 text-center">
                                    {izinler.includes(i) ? (
                                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                                    ) : (
                                      <span className="text-muted-foreground/40">—</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Rol atamak için önce kullanıcı hesabı oluşturun.
                  </p>
                )}
              </div>
            </Bolum>
          </div>
        )}

        {sekme === 'İşlem Geçmişi' && (
          <div className="rounded-xl border px-4 py-4">
            <ul className="space-y-0">
              {uye.islemGecmisi.map((g, i) => (
                <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < uye.islemGecmisi.length - 1 && (
                    <span className="absolute top-4 left-[5px] h-full w-px bg-border" />
                  )}
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-muted-foreground/40 bg-background" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {g.islem}
                      <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                        {formatKisa(g.tarih)}
                      </span>
                    </p>
                    {g.not && <p className="mt-0.5 text-xs text-muted-foreground">{g.not}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {duzenle && <EkipFormDrawer uye={uye} onKapat={() => setDuzenle(false)} />}
      {olaySecili && (
        <OlayDetailDrawer
          olay={olaySecili}
          onKapat={() => setOlaySecili(null)}
          onDuzenle={() => {}}
        />
      )}
    </div>
  )
}
