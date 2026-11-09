import { useState } from 'react'
import { toast } from 'sonner'
import { AwardIcon, CopyIcon, DownloadIcon, EyeIcon, ExternalLinkIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CipGrup, ListeFooter, StatSerit } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import { durumRenkSertifika, dogrulamaUrl, sertifikaGuncelDurum } from '@/data/sertifikalar'
import {
  sertifikaPdfIndirV2,
  sertifikaPdfUrl,
  sertifikalarPdfBirlestir,
} from '@/lib/sertifika-render'
import { useOsgb } from '@/lib/osgb'
import { useFirmaKapsam, useFIzin } from './bits'
import { useOtoBoy } from '@/lib/use-oto-boy'

const CIPLER = ['Tümü', 'Aktif', 'Süresi Doldu', 'İptal Edildi'] as const

/** Sertifikalar — yalnız firma kapsamı; onaylama/iptal OSGB panelinde kalır */
export default function FirmaSertifikalarPage() {
  const k = useFirmaKapsam()
  const osgb = useOsgb().kisaAd || 'OSGB'
  const goruntule = useFIzin('sertifika.goruntule')
  const pdfIzni = useFIzin('sertifika.pdf')
  const dogrulamaIzni = useFIzin('sertifika.dogrulama')
  const [cip, setCip] = useState<(typeof CIPLER)[number]>('Tümü')
  const [ara, setAra] = useState('')
  const [sayfa, setSayfa] = useState(0)
  const [boyut, setBoyut] = useState<'oto' | number>('oto')
  const [secili, setSecili] = useState<Set<string>>(new Set())
  const [topluBusy, setTopluBusy] = useState(false)
  const [pdfOnizleme, setPdfOnizleme] = useState<{ ad: string; url: string } | null>(null)
  const { alanRef, otoBoy } = useOtoBoy('liste', { satirH: 53, baslikH: 40, kartH: 0, kartW: 0 })

  /** PDF'i yeni sekmede açar. Pencere önceden açılır ki tarayıcı engellemesin. */
  const onizle = async (s: (typeof k.sertifikalarim)[number]) => {
    const pencere = window.open('', '_blank')
    try {
      const url = await sertifikaPdfUrl(s)
      if (pencere) pencere.location.href = url
      // Yeni sekme engellendiyse (ör. uygulama penceresi pop-up'a izin vermez) PDF uygulama içinde açılır.
      else setPdfOnizleme({ ad: s.sertifikaNo, url })
    } catch {
      pencere?.close()
      toast.error('PDF önizlemesi hazırlanamadı')
    }
  }

  const topluIndir = async () => {
    const liste = liste0.filter((s) => secili.has(s.id))
    setTopluBusy(true)
    try {
      const adet = await sertifikalarPdfBirlestir(liste, `sertifikalar-${TODAY}.pdf`)
      if (adet === 0) return toast.error('Seçili sertifikaların PDF’i hazırlanamadı')
      toast.success(`${adet} sertifika tek PDF’te indirildi`)
      if (adet < liste.length) toast.message(`${liste.length - adet} sertifika eski biçimde olduğu için eklenemedi`)
    } catch {
      toast.error('Toplu PDF oluşturulamadı')
    } finally {
      setTopluBusy(false)
    }
  }

  const seciliDegistir = (id: string, v: boolean) =>
    setSecili((onceki) => {
      const yeni = new Set(onceki)
      if (v) yeni.add(id)
      else yeni.delete(id)
      return yeni
    })

  const liste0 = k.sertifikalarim.map((s) => ({ ...s, guncel: sertifikaGuncelDurum(s) }))
  const filtreli = liste0.filter((s) => {
    if (cip !== 'Tümü' && s.guncel !== cip) return false
    if (ara.trim() && ![s.sertifikaNo, s.personelAd, s.egitimAd].join(' ').toLowerCase().includes(ara.trim().toLowerCase()))
      return false
    return true
  })

  const sayfaBoyu = boyut === 'oto' ? otoBoy : boyut
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / sayfaBoyu))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const liste = filtreli.slice(sayfaGuvenli * sayfaBoyu, sayfaGuvenli * sayfaBoyu + sayfaBoyu)

  const buAy = liste0.filter((s) => s.duzenlenmeTarihi.startsWith(TODAY.slice(0, 7))).length
  /** Geçerlilik bitişine kalan gün (negatif = geçmiş). Tarih yoksa null. */
  const kalanGun = (t?: string) =>
    t ? Math.round((new Date(`${t}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86_400_000) : null
  const yakindaDolacak = liste0.filter((s) => {
    const g = kalanGun(s.gecerlilikTarihi)
    return s.guncel === 'Aktif' && g !== null && g >= 0 && g <= 60
  }).length

  if (!goruntule)
    return (
      <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
        Sertifikaları görüntüleme yetkiniz yok.
      </div>
    )

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sertifikalar</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {k.firma?.unvan} · onay işlemleri {osgb} yönetiminde yürütülür
          </p>
        </div>
      </div>

      <div className="px-6 pb-4">
        <StatSerit
          ogeler={[
            { label: 'Toplam', deger: liste0.length, ikon: AwardIcon },
            { label: 'Aktif', deger: liste0.filter((s) => s.guncel === 'Aktif').length },
            { label: 'Bu Ay Verilen', deger: buAy },
            { label: '60 gün içinde dolacak', deger: yakindaDolacak },
            { label: 'Süresi Dolan', deger: liste0.filter((s) => s.guncel === 'Süresi Doldu').length },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <CipGrup secenekler={CIPLER} value={cip} onChange={setCip} />
        <div className="relative ml-auto min-w-48 flex-1 sm:max-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Sertifika / çalışan ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
      </div>

      {secili.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
          <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5">
            <span className="text-sm font-medium">{secili.size} sertifika seçili</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSecili(new Set())}>Seçimi temizle</Button>
              {pdfIzni && (
                <Button size="sm" disabled={topluBusy} onClick={topluIndir}>
                  <DownloadIcon /> {topluBusy ? 'Hazırlanıyor…' : 'Seçilenleri tek PDF indir'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={alanRef} className="min-h-0 flex-1 overflow-auto px-6 pb-4">
        {filtreli.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
            <AwardIcon className="size-8 text-muted-foreground/40" />
            {liste0.length === 0 ? (
              <>
                <p className="text-sm font-medium">Henüz sertifika yok</p>
                <p className="max-w-sm text-xs text-muted-foreground">Eğitimini tamamlayan çalışanların sertifikaları {osgb} onayından sonra burada görünür.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Bu filtreye uyan sertifika yok</p>
                <p className="text-xs text-muted-foreground">Farklı bir durum seçin ya da aramayı temizleyin.</p>
              </>
            )}
          </div>
        ) : (
          <table className="w-full min-w-[960px] text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    aria-label="Listelenenlerin tümünü seç"
                    checked={liste.length > 0 && liste.every((s) => secili.has(s.id))}
                    onCheckedChange={(v) => liste.forEach((s) => seciliDegistir(s.id, !!v))}
                  />
                </th>
                <th className="px-3 py-2.5">Sertifika No</th>
                <th className="px-3 py-2.5">Çalışan</th>
                <th className="px-3 py-2.5">Eğitim</th>
                <th className="px-3 py-2.5">Süre</th>
                <th className="px-3 py-2.5">Tamamlanma</th>
                <th className="px-3 py-2.5">Düzenlenme</th>
                <th className="px-3 py-2.5">Geçerlilik</th>
                <th className="px-3 py-2.5">Durum</th>
                <th className="px-3 py-2.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {liste.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40">
                  <td className="px-3 py-3">
                    <Checkbox
                      aria-label={`${s.sertifikaNo} seç`}
                      checked={secili.has(s.id)}
                      onCheckedChange={(v) => seciliDegistir(s.id, !!v)}
                    />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs font-medium">{s.sertifikaNo}</td>
                  <td className="px-3 py-3 font-medium">{s.personelAd}</td>
                  <td className="max-w-56 truncate px-3 py-3 text-muted-foreground">{s.egitimAd}</td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums">{s.egitimSure} dk</td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums">{s.tamamlanmaTarihi}</td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums">{s.duzenlenmeTarihi}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {s.gecerlilikTarihi ? (
                      <>
                        <span className="text-muted-foreground">{s.gecerlilikTarihi}</span>
                        {(() => {
                          const g = kalanGun(s.gecerlilikTarihi)
                          if (g === null || s.guncel !== 'Aktif') return null
                          if (g < 0) return <span className="block text-[11px] text-red-500">{Math.abs(g)} gün önce doldu</span>
                          if (g <= 60) return <span className="block text-[11px] font-medium text-amber-600 dark:text-amber-400">{g} gün kaldı</span>
                          return null
                        })()}
                      </>
                    ) : (
                      <span className="italic text-muted-foreground/60">Süresiz</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenkSertifika[s.guncel])}>
                      {s.guncel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      {pdfIzni && (
                        <Button size="xs" variant="ghost" aria-label={`${s.sertifikaNo} önizle`} title="PDF’i yeni sekmede aç" onClick={() => onizle(s)}>
                          <EyeIcon /> Önizle
                        </Button>
                      )}
                      {pdfIzni && (
                        <Button size="xs" variant="outline" aria-label={`${s.sertifikaNo} PDF indir`} onClick={() => sertifikaPdfIndirV2(s)}>
                          <DownloadIcon /> PDF
                        </Button>
                      )}
                      {dogrulamaIzni && (
                        <>
                          <Button
                            size="xs"
                            variant="ghost"
                            title="Doğrulama bağlantısını kopyala"
                            aria-label="Doğrulama bağlantısını kopyala"
                            onClick={() => {
                              navigator.clipboard.writeText(dogrulamaUrl(s.dogrulamaKodu))
                              toast.success('Doğrulama bağlantısı kopyalandı')
                            }}
                          >
                            <CopyIcon />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            title="Doğrulama sayfasını aç"
                            aria-label="Doğrulama sayfasını aç"
                            onClick={() => window.open(`/dogrula/${s.dogrulamaKodu}`, '_blank')}
                          >
                            <ExternalLinkIcon />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Sheet open={!!pdfOnizleme} onOpenChange={(o) => !o && setPdfOnizleme(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-4xl">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="text-base">{pdfOnizleme?.ad} · önizleme</SheetTitle>
          </SheetHeader>
          {pdfOnizleme && <iframe title={pdfOnizleme.ad} src={pdfOnizleme.url} className="min-h-0 flex-1 border-0" />}
        </SheetContent>
      </Sheet>

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
    </div>
  )
}
