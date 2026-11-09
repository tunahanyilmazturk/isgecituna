import { useEffect, useMemo, useState } from 'react'
import {
  AwardIcon,
  BadgeCheckIcon,
  BanIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ClipboardCheckIcon,
  ClockIcon,
  DownloadIcon,

  FileSearchIcon,
  GraduationCapIcon,
  HistoryIcon,
  RotateCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserIcon,
  XCircleIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { CipGrup, FiltrePopover, ListeFooter, StatSerit } from '@/components/list-bits'
import { Alan, Sec } from '@/components/form-bits'
import { cn } from '@/lib/utils'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { useIzin } from '@/lib/izin'
import {
  RET_NEDENLERI,
  basvuruDurumRenk,
  type BasvuruDurum,
  type SertifikaBasvuru,
} from '@/data/sertifikalar'
import { TODAY } from '@/data/dashboard'
import { egitimSuresiDakika } from '@/data/egitimler'
import { personelAd, usePersonelStore } from '@/stores/personeller-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { useAuthStore } from '@/stores/auth-store'
import { useOtoBoy } from '@/lib/use-oto-boy'
import { SertifikaOnizleme } from '@/components/sertifika/onizleme'
import { ORNEK_VERI, sablonDuzen, sureEtiketi, tarihEtiketi, type SertifikaVeri } from '@/data/sertifika-tasarim'

const DURUM_CIPLERI = ['Tümü', 'İnceleme Bekliyor', 'İnceleniyor', 'Onaylandı', 'Reddedildi'] as const
type Cip = (typeof DURUM_CIPLERI)[number]

export default function SertifikaOnayPage() {
  const { basvurular, tasarimlar, tara, inceleAl, onayla, reddet, tekrarGonder } = useSertifikaStore()
  const { personeller, atamalar } = usePersonelStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const { egitimler } = useEgitimlerStore()
  const user = useAuthStore((s) => s.user)
  const kullanici = user?.name ?? 'Sistem'
  const onayIzni = useIzin('sertifikalar.onayla')

  const [cip, setCip] = useState<Cip>('İnceleme Bekliyor')
  const [ara, setAra] = useState('')
  const [firmaF, setFirmaF] = useState('Tümü')
  const [egitimF, setEgitimF] = useState('Tümü')
  const [kategoriF, setKategoriF] = useState('Tümü')
  const [sayfa, setSayfa] = useState(0)
  const [boyut, setBoyut] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy('liste', { satirH: 53, baslikH: 40, kartH: 0, kartW: 0 })
  const [detay, setDetay] = useState<SertifikaBasvuru | null>(null)
  const [onayModal, setOnayModal] = useState<SertifikaBasvuru | null>(null)
  const [retModal, setRetModal] = useState<SertifikaBasvuru | null>(null)

  // Tamamlanan eğitimleri tara → yeni başvuruları kuyruğa düşür
  useEffect(() => {
    tara()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const firmaAd = (id: string) => firmalar.find((f) => f.id === id)?.unvan ?? id
  const personelOf = (b: SertifikaBasvuru) => personeller.find((p) => p.id === b.personelId)
  const atamaOf = (b: SertifikaBasvuru) => atamalar.find((a) => a.id === b.atamaId)
  const egitimOf = (b: SertifikaBasvuru) => egitimler.find((e) => e.id === b.egitimId)
  const surumNo = (b: SertifikaBasvuru) =>
    egitimOf(b)?.surumler.find((s) => s.id === b.surumId)?.no ?? '?'

  const filtreli = useMemo(() => {
    const q = ara.trim().toLowerCase()
    return basvurular.filter((b) => {
      if (cip !== 'Tümü' && b.durum !== cip) return false
      const p = personelOf(b)
      const a = atamaOf(b)
      const e = egitimOf(b)
      if (firmaF !== 'Tümü' && firmaAd(a?.firmaId ?? '') !== firmaF) return false
      if (egitimF !== 'Tümü' && e?.baslik !== egitimF) return false
      if (kategoriF !== 'Tümü' && e?.kategori !== kategoriF) return false
      if (
        q &&
        ![p ? personelAd(p) : '', p?.departman ?? '', p?.gorev ?? '', firmaAd(a?.firmaId ?? ''), e?.baslik ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basvurular, cip, ara, firmaF, egitimF, kategoriF, personeller, atamalar, egitimler])

  const sayfaBoyu = boyut === 'oto' ? otoBoy : boyut
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / sayfaBoyu))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const liste = filtreli.slice(sayfaGuvenli * sayfaBoyu, sayfaGuvenli * sayfaBoyu + sayfaBoyu)

  const sayDurum = (d: BasvuruDurum) => basvurular.filter((b) => b.durum === d).length
  const filtreSayisi = [firmaF, egitimF, kategoriF].filter((f) => f !== 'Tümü').length

  const excelleAktar = () => {
    xlsxIndir(xlsxDosyaAdi('Sertifika_Onay_Kuyrugu'), [
      {
        ad: 'Onay Kuyruğu',
        baslik: 'Sertifika Onay Başvuruları',
        altBilgi: 'Sertifika onay modülü',
        kolonlar: [
          { label: 'Başvuru', minGenislik: 12 },
          { label: 'Personel', minGenislik: 22 },
          { label: 'Firma', minGenislik: 24, wrap: true },
          { label: 'Departman', minGenislik: 14 },
          { label: 'Eğitim', minGenislik: 32, wrap: true },
          { label: 'Sürüm', minGenislik: 9 },
          { label: 'Tamamlanma', tip: 'tarih' },
          { label: 'Sınav', tip: 'sayi', minGenislik: 9 },
          { label: 'Sonuç', minGenislik: 11 },
          { label: 'Başvuru', tip: 'tarih' },
          { label: 'Durum', minGenislik: 16 },
        ],
        satirlar: filtreli.map((b) => {
          const p = personelOf(b)
          return [
            b.id,
            p ? personelAd(p) : b.personelId,
            firmaAd(atamaOf(b)?.firmaId ?? ''),
            p?.departman ?? '',
            egitimOf(b)?.baslik ?? '—',
            `v${surumNo(b)}`,
            b.tamamlanmaTarihi,
            b.sinavPuani ?? '—',
            b.sinavGecti === undefined ? '—' : b.sinavGecti ? 'Geçti' : 'Kaldı',
            b.basvuruTarihi,
            b.durum,
          ]
        }),
        ozet: [
          ['Toplam', basvurular.length],
          ['İnceleme bekliyor', sayDurum('İnceleme Bekliyor')],
          ['Onaylanan', sayDurum('Onaylandı')],
          ['Reddedilen', sayDurum('Reddedildi')],
        ],
      },
    ])
    toast.success(`${filtreli.length} başvuru Excel'e aktarıldı`)
  }

  const detayAc = (b: SertifikaBasvuru) => {
    setDetay(b)
    if (b.durum === 'İnceleme Bekliyor') inceleAl(b.id, kullanici)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sertifika Onay</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Eğitimini tamamlayan personelin sertifika başvuruları · {sayDurum('İnceleme Bekliyor')} bekleyen
          </p>
        </div>
        <Button variant="outline" onClick={excelleAktar}>
          <DownloadIcon /> Excel'e aktar
        </Button>
      </div>

      <div className="px-6 pb-4">
        <StatSerit
          ogeler={[
            { label: 'Toplam Başvuru', deger: basvurular.length, ikon: ClipboardCheckIcon },
            { label: 'Onay Bekleyen', deger: sayDurum('İnceleme Bekliyor'), ikon: ClockIcon },
            { label: 'İnceleme Gereken', deger: sayDurum('İnceleniyor'), ikon: FileSearchIcon },
            { label: 'Onaylanan', deger: sayDurum('Onaylandı'), ikon: BadgeCheckIcon },
            { label: 'Reddedilen', deger: sayDurum('Reddedildi'), ikon: XCircleIcon },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <CipGrup secenekler={DURUM_CIPLERI} value={cip} onChange={setCip} />
        <div className="relative ml-auto min-w-48 flex-1 sm:max-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Personel, firma veya eğitim ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <FiltrePopover
          aktifSayi={filtreSayisi}
          onTemizle={() => {
            setFirmaF('Tümü')
            setEgitimF('Tümü')
            setKategoriF('Tümü')
          }}
          sorular={[
            { label: 'Firma', value: firmaF, options: ['Tümü', ...firmalar.map((f) => f.unvan)], onChange: setFirmaF },
            { label: 'Eğitim', value: egitimF, options: ['Tümü', ...egitimler.map((e) => e.baslik)], onChange: setEgitimF },
            {
              label: 'Kategori',
              value: kategoriF,
              options: ['Tümü', ...new Set(egitimler.map((e) => e.kategori))],
              onChange: setKategoriF,
            },
          ]}
        />
      </div>

      <div ref={alanRef} className="min-h-0 flex-1 overflow-auto px-6 pb-4">
        {filtreli.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
            <AwardIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Başvuru bulunamadı</p>
            <p className="text-xs text-muted-foreground">
              Personel bir eğitimi tamamladığında başvuru otomatik olarak bu kuyruğa düşer
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[1150px] text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-2.5">Personel</th>
                <th className="px-3 py-2.5">Firma</th>
                <th className="px-3 py-2.5">Eğitim</th>
                <th className="px-3 py-2.5">Sürüm</th>
                <th className="px-3 py-2.5">Tamamlanma</th>
                <th className="px-3 py-2.5 text-right">Sınav</th>
                <th className="px-3 py-2.5">Başvuru</th>
                <th className="px-3 py-2.5">Durum</th>
                <th className="px-3 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {liste.map((b) => {
                const p = personelOf(b)
                const e = egitimOf(b)
                return (
                  <tr
                    key={b.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => detayAc(b)}
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium">{p ? personelAd(p) : b.personelId}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p?.departman ?? '—'} · {p?.gorev ?? '—'}
                      </p>
                    </td>
                    <td className="max-w-44 truncate px-3 py-3 text-muted-foreground">
                      {firmaAd(atamaOf(b)?.firmaId ?? '')}
                    </td>
                    <td className="max-w-72 px-3 py-3">
                      <p className="truncate">{e?.baslik ?? '—'}</p>
                      <p className="text-[11px] text-muted-foreground">{e?.kategori ?? ''}</p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">v{surumNo(b)}</td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{b.tamamlanmaTarihi}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {b.sinavPuani !== undefined ? (
                        <span
                          className={cn(
                            'font-medium',
                            b.sinavGecti ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
                          )}
                        >
                          {b.sinavPuani}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {b.sinavPuani !== undefined && (
                        <p className="text-[11px] text-muted-foreground">{b.denemeSayisi} deneme</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{b.basvuruTarihi}</td>
                    <td className="px-3 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', basvuruDurumRenk[b.durum])}>
                        {b.durum}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {onayIzni && (b.durum === 'İnceleme Bekliyor' || b.durum === 'İnceleniyor') && (
                          <>
                            <Button size="sm" onClick={() => setOnayModal(b)}>
                              <BadgeCheckIcon /> Onayla
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setRetModal(b)}>
                              <BanIcon /> Reddet
                            </Button>
                          </>
                        )}
                        <button
                          aria-label="Detay"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                          onClick={() => detayAc(b)}
                        >
                          <ChevronLeftIcon className="size-4 rotate-180" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ListeFooter
        bas={filtreli.length === 0 ? 0 : sayfaGuvenli * sayfaBoyu + 1}
        son={Math.min(filtreli.length, (sayfaGuvenli + 1) * sayfaBoyu)}
        toplam={filtreli.length}
        sayfaGuvenli={sayfaGuvenli}
        sayfaSayisi={sayfaSayisi}
        sayfaBoyu={boyut}
        otoBoy={otoBoy}
        onSayfa={setSayfa}
        onBoyut={(b) => {
          setBoyut(b)
          setSayfa(0)
        }}
      />

      {detay && (
        <BasvuruDetay
          basvuru={basvurular.find((b) => b.id === detay.id) ?? detay}
          onKapat={() => setDetay(null)}
          onOnay={() => {
            setOnayModal(basvurular.find((b) => b.id === detay.id) ?? detay)
          }}
          onRet={() => setRetModal(basvurular.find((b) => b.id === detay.id) ?? detay)}
          onTekrar={() => {
            tekrarGonder(detay.id, kullanici)
            toast.success('Başvuru tekrar incelemeye alındı')
          }}
          onayIzni={onayIzni}
        />
      )}
      {onayModal && (
        <OnayModal
          basvuru={onayModal}
          tasarimlar={tasarimlar.filter((t) => t.aktif && !t.arsiv)}
          kullanici={kullanici}
          onKapat={() => setOnayModal(null)}
          onOnayla={(g) => {
            const crt = onayla(onayModal.id, g)
            if (crt) {
              toast.success(`${crt.sertifikaNo} numaralı sertifika oluşturuldu`)
              setOnayModal(null)
              setDetay(null)
            } else toast.error('Sertifika oluşturulamadı')
          }}
        />
      )}
      {retModal && (
        <RetModal
          basvuru={retModal}
          onKapat={() => setRetModal(null)}
          onReddet={(g) => {
            reddet(retModal.id, { kullanici, ...g })
            toast('Başvuru reddedildi')
            setRetModal(null)
            setDetay(null)
          }}
        />
      )}
    </div>
  )
}

function Kontrol({ ok, metin, detay: d }: { ok: boolean; metin: string; detay?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      {ok ? (
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircleIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px]">{metin}</p>
        {d && <p className="text-[11px] text-muted-foreground">{d}</p>}
      </div>
    </div>
  )
}

/* ============================ Başvuru detay ============================= */

function BasvuruDetay({
  basvuru: b,
  onKapat,
  onOnay,
  onRet,
  onTekrar,
  onayIzni,
}: {
  basvuru: SertifikaBasvuru
  onKapat: () => void
  onOnay: () => void
  onRet: () => void
  onTekrar: () => void
  onayIzni: boolean
}) {
  const { personeller, atamalar } = usePersonelStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const { egitimler, ilerlemeler } = useEgitimlerStore()
  const p = personeller.find((x) => x.id === b.personelId)
  const a = atamalar.find((x) => x.id === b.atamaId)
  const e = egitimler.find((x) => x.id === b.egitimId)
  const sv = e?.surumler.find((s) => s.id === b.surumId)
  const il = ilerlemeler.find((i) => i.hesapId === b.personelId && i.atamaId === b.atamaId)
  const firma = firmalar.find((f) => f.id === a?.firmaId)

  const zorunlular = sv?.bolumler.flatMap((x) => x.icerikler).filter((i) => i.zorunlu) ?? []
  const tamamIcerik = zorunlular.filter((i) => il?.icerikler[i.id]?.tamamlandi).length
  const videolar = zorunlular.filter((i) => i.tur === 'video')
  const sonDeneme = il?.denemeler[il.denemeler.length - 1]
  const bekliyor = b.durum === 'İnceleme Bekliyor' || b.durum === 'İnceleniyor'

  return (
    <Sheet open onOpenChange={(o) => !o && onKapat()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetTitle className="flex items-center gap-2 text-base">
          Başvuru Detayı
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', basvuruDurumRenk[b.durum])}>
            {b.durum}
          </span>
        </SheetTitle>

        {/* Personel */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <UserIcon className="size-3.5" /> Personel
          </h3>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">{p ? personelAd(p) : b.personelId}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {firma?.unvan ?? '—'} · {p?.departman ?? '—'} · {p?.gorev ?? '—'} · Sicil {p?.sicilNo ?? '—'}
            </p>
          </div>
        </section>

        {/* Eğitim */}
        <section className="mt-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <GraduationCapIcon className="size-3.5" /> Eğitim
          </h3>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">{e?.baslik ?? '—'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {e?.kategori} · v{sv?.no ?? '?'} · {e ? egitimSuresiDakika(e) : '—'} dk · Atama {a?.id} (son {a?.sonTarih})
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{e?.aciklama}</p>
          </div>
        </section>

        {/* Tamamlanma kontrolü */}
        <section className="mt-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <ShieldCheckIcon className="size-3.5" /> Tamamlanma Kontrolü
          </h3>
          <div className="divide-y divide-border/50 rounded-xl border bg-card px-4">
            <Kontrol
              ok={tamamIcerik === zorunlular.length && zorunlular.length > 0}
              metin={`Zorunlu içerikler: ${tamamIcerik}/${zorunlular.length} tamamlandı`}
              detay={
                videolar.length
                  ? `${videolar.filter((v) => il?.icerikler[v.id]?.tamamlandi).length}/${videolar.length} video izlendi`
                  : undefined
              }
            />
            <Kontrol
              ok={!sv?.tamamlama.sinavZorunlu || !!sonDeneme}
              metin={sv?.tamamlama.sinavZorunlu ? 'Sınava girildi' : 'Sınav zorunlu değil'}
              detay={il ? `${il.denemeler.length} deneme` : 'İlerleme kaydı yok'}
            />
            <Kontrol
              ok={!sv?.sinav || !!sonDeneme?.gecti}
              metin={
                sonDeneme
                  ? `Sınav sonucu: ${sonDeneme.puan} puan (geçme ${sv?.sinav?.ayarlar.gecmePuani ?? '—'})`
                  : 'Sınav sonucu yok'
              }
            />
            <Kontrol ok metin={`Eğitim tamamlanma tarihi: ${b.tamamlanmaTarihi}`} />
            <Kontrol
              ok={!!il && (il.durum === 'Tamamlandı' || il.durum === 'Onay Bekliyor')}
              metin={`İlerleme durumu: ${il?.durum ?? 'Kayıt yok'}`}
            />
          </div>
        </section>

        {/* Geçmiş */}
        <section className="mt-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <HistoryIcon className="size-3.5" /> Onay Geçmişi
          </h3>
          <div className="space-y-0 rounded-xl border bg-card px-4 py-2">
            {b.olaylar.map((o, i) => (
              <div key={i} className="flex gap-3 border-b border-border/50 py-2.5 last:border-0">
                <span className="w-36 shrink-0 text-[11px] text-muted-foreground tabular-nums">
                  {o.tarih.slice(0, 16).replace('T', ' ')}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px]">{o.islem}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.kullanici}
                    {o.not ? ` — ${o.not}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {b.retNedeni && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-[11px] font-semibold tracking-wide text-red-600 uppercase dark:text-red-400">
              Ret Nedeni
            </p>
            <p className="mt-1 text-sm">{b.retNedeni}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{b.retAciklama}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-4 pb-2">
          {(b.durum === 'Reddedildi' || b.durum === 'Eksik Koşul') && (
            <Button variant="outline" onClick={onTekrar}>
              <RotateCwIcon /> Tekrar İncelemeye Gönder
            </Button>
          )}
          {onayIzni && bekliyor && (
            <>
              <Button variant="outline" onClick={onRet}>
                <BanIcon /> Reddet
              </Button>
              <Button onClick={onOnay}>
                <BadgeCheckIcon /> Onayla ve Sertifika Oluştur
              </Button>
            </>
          )}
          {b.durum === 'Onaylandı' && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {b.sertifikaId} — sertifika yayımlandı ({b.onayTarihi})
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ============================== Onay modalı ============================= */

function OnayModal({
  basvuru: b,
  tasarimlar,
  kullanici,
  onKapat,
  onOnayla,
}: {
  basvuru: SertifikaBasvuru
  tasarimlar: import('@/data/sertifika-tasarim').TasarimSablon[]
  kullanici: string
  onKapat: () => void
  onOnayla: (g: {
    kullanici: string
    sablonId: string
    duzenlenmeTarihi: string
    gecerlilikTarihi?: string
    not?: string
    katilimDetayi?: import('@/data/sertifikalar').SertifikaKatilimDetayi
  }) => void
}) {
  const personeller = usePersonelStore((s) => s.personeller)
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const p = personeller.find((x) => x.id === b.personelId)
  const e = egitimler.find((x) => x.id === b.egitimId)
  const [sablonId, setSablonId] = useState(
    tasarimlar.find((s) => s.varsayilan)?.id ?? tasarimlar[0]?.id ?? '',
  )
  const [tarih, setTarih] = useState(TODAY)
  const [gecerlilik, setGecerlilik] = useState('')
  const [not, setNot] = useState('')
  const [egitimTarihi, setEgitimTarihi] = useState('')
  const [egitimBaslangic, setEgitimBaslangic] = useState('')
  const [egitimBitis, setEgitimBitis] = useState('')
  const [egitimSekli, setEgitimSekli] = useState('')
  const [egitimYeri, setEgitimYeri] = useState('')
  const [egitimTuru, setEgitimTuru] = useState('')
  const [egiticiMetni, setEgiticiMetni] = useState('')
  const [onizlemeYuzu, setOnizlemeYuzu] = useState<'on' | 'arka'>('on')
  const tsb = tasarimlar.find((s) => s.id === sablonId)
  const surum = e?.surumler.find((s) => s.id === b.surumId)
  const konular = surum?.bolumler.flatMap((bolum) => bolum.icerikler.map((icerik) => ({ bolum: bolum.baslik, baslik: icerik.baslik, sureDakika: icerik.sureDakika }))) ?? []
  const konuSureToplami = konular.reduce((n, x) => n + (x.sureDakika || 0), 0)
  const onizlemeVeri: SertifikaVeri = {
    ...ORNEK_VERI,
    employee_name: p ? personelAd(p) : b.personelId,
    employee_title: p?.gorev || undefined,
    employee_id: p?.tc || undefined,
    company_name: useFirmalarStore.getState().firmalar.find((f) => f.id === usePersonelStore.getState().atamalar.find((a) => a.id === b.atamaId)?.firmaId)?.unvan ?? '',
    training_name: e?.baslik ?? '',
    training_duration: e ? sureEtiketi(egitimSuresiDakika(e)) : '—',
    completion_date: tarihEtiketi(b.tamamlanmaTarihi),
    issue_date: tarihEtiketi(tarih),
    expiry_date: gecerlilik ? tarihEtiketi(gecerlilik) : 'Süresiz',
    certificate_number: 'ÖNİZLEME',
    training_date: tarihEtiketi(egitimTarihi),
    training_start: tarihEtiketi(egitimBaslangic),
    training_end: tarihEtiketi(egitimBitis),
    training_mode: egitimSekli || undefined,
    training_place: egitimYeri || undefined,
    training_type: egitimTuru || undefined,
    training_instructors: egiticiMetni || undefined,
    training_topics: konular,
    training_total_duration: e ? sureEtiketi(egitimSuresiDakika(e)) : '—',
    approver_name: kullanici,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onKapat}>
      <div className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <BadgeCheckIcon className="size-5 text-emerald-500" /> Sertifika Onayı
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Başvuru {b.id} onaylanıp sertifika düzenlenecek</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border bg-muted/30 p-3.5">
            <p className="text-sm font-medium">{p ? personelAd(p) : b.personelId}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{e?.baslik} · tamamlanma {b.tamamlanmaTarihi}</p>
          </div>
          <Alan label="Sertifika şablonu">
            <select
              value={sablonId}
              onChange={(e) => setSablonId(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            >
              {tasarimlar.length === 0 && <option value="">Aktif sertifika tasarımı bulunamadı</option>}
              {tasarimlar.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ad} ({s.yon === 'yatay' ? 'Yatay' : 'Dikey'} · {s.kategori})
                </option>
              ))}
            </select>
            {tsb && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {tsb.aciklama} · {tsb.yon === 'yatay' ? 'Yatay A4' : 'Dikey A4'} · v{tsb.surum}
              </p>
            )}
            {!tsb && <p className="mt-1 text-[11px] text-amber-700">Yeni sertifika oluşturmak için önce aktif bir iki yüzlü tasarım ekleyin.</p>}
          </Alan>
          {tsb && (
            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold">Belge önizlemesi</p>
                  <p className="text-[10px] text-muted-foreground">Kaydedilecek kişi, eğitim ve içerik bilgileriyle</p>
                </div>
                <div className="flex rounded-lg border bg-background p-0.5">
                  {(['on', 'arka'] as const).map((y) => <button key={y} type="button" onClick={() => setOnizlemeYuzu(y)} className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium', onizlemeYuzu === y ? 'bg-amber-500 text-zinc-950' : 'text-muted-foreground')}>{y === 'on' ? 'Ön yüz' : 'Arka yüz'}</button>)}
                </div>
              </div>
              <div className="flex justify-center overflow-auto rounded-lg bg-zinc-200/70 p-3 dark:bg-zinc-950/60">
                <div className="shrink-0 overflow-hidden rounded-sm shadow-lg ring-1 ring-black/10">
                  <SertifikaOnizleme elemanlar={sablonDuzen(tsb, tsb.yon, onizlemeYuzu)} yon={tsb.yon} zemin={tsb.zemin} veri={onizlemeVeri} olcek={tsb.yon === 'yatay' ? 0.38 : 0.32} />
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Alan label="Düzenlenme tarihi">
              <input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
              />
            </Alan>
            <Alan label="Geçerlilik tarihi (opsiyonel)">
              <input
                type="date"
                value={gecerlilik}
                onChange={(e) => setGecerlilik(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
              />
            </Alan>
          </div>
          <div className="rounded-xl border p-3">
            <p className="mb-2 text-xs font-semibold">Eğitim oturumu bilgileri <span className="font-normal text-muted-foreground">(varsa)</span></p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Alan label="Eğitim tarihi">
                <input type="date" value={egitimTarihi} onChange={(e) => setEgitimTarihi(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <Alan label="Başlangıç tarihi (opsiyonel)">
                <input type="date" value={egitimBaslangic} onChange={(e) => setEgitimBaslangic(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <Alan label="Bitiş tarihi (opsiyonel)">
                <input type="date" value={egitimBitis} onChange={(e) => setEgitimBitis(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <Alan label="Eğitim şekli">
                <Sec value={egitimSekli || 'Belirtilmedi'} onChange={(v) => setEgitimSekli(v === 'Belirtilmedi' ? '' : v)} options={['Belirtilmedi', 'Yüz yüze', 'Uzaktan']} />
              </Alan>
              <Alan label="Eğitimin yapıldığı yer">
                <input value={egitimYeri} onChange={(e) => setEgitimYeri(e.target.value)} placeholder="Kayıtlı değilse boş bırakın" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <Alan label="Eğitim türü">
                <Sec value={egitimTuru || 'Belirtilmedi'} onChange={(v) => setEgitimTuru(v === 'Belirtilmedi' ? '' : v)} options={['Belirtilmedi', 'İlk defa', 'Tekrar']} />
              </Alan>
              <Alan label="Eğitici adı (varsa)" className="sm:col-span-2">
                <input value={egiticiMetni} onChange={(e) => setEgiticiMetni(e.target.value)} placeholder="Birden fazla adı virgülle ayırın" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
            </div>
          </div>
          {konuSureToplami > 0 && e && konuSureToplami !== egitimSuresiDakika(e) && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              Eğitim planı {sureEtiketi(egitimSuresiDakika(e))}, içerik süreleri toplamı {sureEtiketi(konuSureToplami)}. PDF her iki kayıt değerini ayrı ayrı gösterecek; süreleri içerik kaydında güncellemeniz önerilir.
            </p>
          )}
          <Alan label="Onay notu (opsiyonel)">
            <textarea
              value={not}
              onChange={(e) => setNot(e.target.value)}
              rows={2}
              placeholder="Başvuru geçmişine eklenecek not…"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            />
          </Alan>
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              Onaylandığında ön ve arka yüz için sertifika numarası, QR doğrulama kodu ve eğitim sürümünün konu özeti kaydedilir. Eksik oturum bilgileri belgeye eklenmez.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3.5">
          <Button variant="ghost" onClick={onKapat}>
            Vazgeç
          </Button>
          <Button
            disabled={!tsb}
            onClick={() =>
              onOnayla({ kullanici, sablonId, duzenlenmeTarihi: tarih, gecerlilikTarihi: gecerlilik || undefined, not: not || undefined, katilimDetayi: { egitimTarihi: egitimTarihi || undefined, baslangic: egitimBaslangic || undefined, bitis: egitimBitis || undefined, egitimSekli: (egitimSekli || undefined) as 'Yüz yüze' | 'Uzaktan' | undefined, egitimYeri: egitimYeri.trim() || undefined, egitimTuru: (egitimTuru || undefined) as 'İlk defa' | 'Tekrar' | undefined, egiticiler: egiticiMetni.split(',').map((adSoyad) => adSoyad.trim()).filter(Boolean).map((adSoyad) => ({ adSoyad })) } })
            }
          >
            <BadgeCheckIcon /> Onayla ve Sertifikayı Oluştur
          </Button>
        </div>
      </div>
    </div>
  )
}

/* =============================== Ret modalı ============================= */

function RetModal({
  basvuru: b,
  onKapat,
  onReddet,
}: {
  basvuru: SertifikaBasvuru
  onKapat: () => void
  onReddet: (g: { neden: string; aciklama: string }) => void
}) {
  const [neden, setNeden] = useState<string>(RET_NEDENLERI[0])
  const [aciklama, setAciklama] = useState('')
  const gecerli = neden !== 'Diğer' || aciklama.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onKapat}>
      <div className="w-full max-w-md rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <BanIcon className="size-5 text-red-500" /> Başvuruyu Reddet
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{b.id} — ret nedeni geçmişe kaydedilir</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <Alan label="Ret nedeni">
            <Sec value={neden} onChange={setNeden} options={[...RET_NEDENLERI]} />
          </Alan>
          <Alan label={neden === 'Diğer' ? 'Açıklama (zorunlu)' : 'Açıklama (opsiyonel)'}>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={3}
              placeholder="Personel ve yöneticinin göreceği açıklama…"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            />
          </Alan>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3.5">
          <Button variant="ghost" onClick={onKapat}>
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            disabled={!gecerli}
            onClick={() => onReddet({ neden, aciklama: aciklama || neden })}
          >
            <BanIcon /> Reddet
          </Button>
        </div>
      </div>
    </div>
  )
}
