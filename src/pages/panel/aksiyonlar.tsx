import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  BanIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  PaperclipIcon,
  SearchIcon,
  ShieldAlertIcon,
  Undo2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CipGrup, FiltrePopover, ListeFooter, StatSerit } from '@/components/list-bits'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { xlsxTekSayfa } from '@/lib/excel'
import { aksiyonPdfIndir } from '@/lib/risk-pdf'
import { osgbAd } from '@/lib/osgb'
import { TODAY } from '@/data/dashboard'
import {
  AKSIYON_ONCELIKLER,
  aksiyonDurumRenk,
  aksiyonGecikmis,
  aksiyonAcik,
  oncelikRenk,
  type RiskAksiyon,
} from '@/data/risk'
import { useRiskStore } from '@/stores/risk-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { hesapGorunenAd } from '@/data/ekip'
import { useIzin } from '@/lib/izin'
import { kapsamdaMi, useRiskKapsam } from '@/lib/risk-kapsam'
import { useOtoBoy } from '@/lib/use-oto-boy'

const CIPLER = ['Tümü', 'Bekliyor', 'Devam Ediyor', 'Kontrol Bekliyor', 'Tamamlandı', 'İptal Edildi', 'Gecikmiş'] as const
type Cip = (typeof CIPLER)[number]

export default function AksiyonlarPage() {
  const { aksiyonlar, tehlikeler, degerlendirmeler, aksiyonDurum, aksiyonTamamla, aksiyonYenidenAc } = useRiskStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const { uyeler, hesaplar } = useEkipStore()
  const user = useAuthStore((s) => s.user)
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.username ?? 'Kullanıcı')
  const duzenleIzni = useIzin('risk.duzenle')
  const aktarIzni = useIzin('risk.aktar')
  const kapsam = useRiskKapsam()
  const nav = useNavigate()

  // Kapsam görünürlüğü — bağlı olduğu değerlendirme üzerinden
  const { gorunenAk, gorunenDeg, gorunenFirmalar } = useMemo(() => {
    const deg = degerlendirmeler.filter(
      (d) => kapsamdaMi(kapsam, d.firmaId) && (!kapsam.sadeceKendi || d.olusturan === kapsam.kullanici),
    )
    const ids = new Set(deg.map((d) => d.id))
    return {
      gorunenDeg: deg,
      gorunenAk: aksiyonlar.filter(
        (a) =>
          (a.degerlendirmeId ? ids.has(a.degerlendirmeId) : a.kaynak?.tur === 'denetim') &&
          kapsamdaMi(kapsam, a.firmaId),
      ),
      gorunenFirmalar: firmalar.filter((f) => kapsamdaMi(kapsam, f.id)),
    }
  }, [aksiyonlar, degerlendirmeler, firmalar, kapsam])

  const [cip, setCip] = useState<Cip>('Tümü')
  const [ara, setAra] = useState('')
  const [firmaF, setFirmaF] = useState('Tümü')
  const [sorumluF, setSorumluF] = useState('Tümü')
  const [oncelikF, setOncelikF] = useState('Tümü')
  const [degF, setDegF] = useState('Tümü')
  const [secili, setSecili] = useState<RiskAksiyon | null>(null)
  const [notMetni, setNotMetni] = useState('')
  const [sayfa, setSayfa] = useState(0)
  const [sayfaBoyu, setSayfaBoyu] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy('liste', { satirH: 52, baslikH: 110, kartH: 0, kartW: 0 })
  const boyut = sayfaBoyu === 'oto' ? otoBoy : sayfaBoyu

  const sorumlular = useMemo(() => [...new Set(gorunenAk.map((a) => a.sorumluAd))].sort(), [gorunenAk])

  const filtreli = useMemo(() => {
    const q = ara.trim().toLowerCase()
    return gorunenAk.filter((a) => {
      if (cip === 'Gecikmiş' ? !aksiyonGecikmis(a) : cip !== 'Tümü' && a.durum !== cip) return false
      if (firmaF !== 'Tümü' && a.firmaId !== firmaF) return false
      if (sorumluF !== 'Tümü' && a.sorumluAd !== sorumluF) return false
      if (oncelikF !== 'Tümü' && a.oncelik !== oncelikF) return false
      if (degF !== 'Tümü' && a.degerlendirmeId !== degF) return false
      if (q && ![a.baslik, a.firmaAd, a.sorumluAd, a.aciklama ?? ''].some((x) => x.toLowerCase().includes(q))) return false
      return true
    }).sort((a, b) => (aksiyonGecikmis(b) ? 1 : 0) - (aksiyonGecikmis(a) ? 1 : 0) || a.hedefTarih.localeCompare(b.hedefTarih))
  }, [gorunenAk, cip, ara, firmaF, sorumluF, oncelikF, degF])

  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / boyut))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const sayfaVeri = filtreli.slice(sayfaGuvenli * boyut, sayfaGuvenli * boyut + boyut)

  const acikSayi = gorunenAk.filter(aksiyonAcik).length
  const gecikmisSayi = gorunenAk.filter(aksiyonGecikmis).length
  const tamamlananSayi = gorunenAk.filter((a) => a.durum === 'Tamamlandı').length
  const buAyTamamlanan = gorunenAk.filter((a) => a.tamamlanmaTarihi?.startsWith(TODAY.slice(0, 7))).length

  const excelAktar = () =>
    xlsxTekSayfa('risk-aksiyonlar', {
      ad: 'Aksiyonlar',
      baslik: 'Risk Aksiyon Takip Listesi',
      altBilgi: `${filtreli.length} kayıt`,
      kolonlar: [
        { label: 'Aksiyon', tip: 'metin' }, { label: 'Firma', tip: 'metin' },
        { label: 'Değerlendirme', tip: 'metin' }, { label: 'Sorumlu', tip: 'metin' },
        { label: 'Öncelik', tip: 'metin' }, { label: 'Başlangıç', tip: 'tarih' },
        { label: 'Hedef Tarih', tip: 'tarih' }, { label: 'Durum', tip: 'metin' },
        { label: 'Gecikme', tip: 'metin' },
      ],
      satirlar: filtreli.map((a) => {
        const deg = gorunenDeg.find((x) => x.id === a.degerlendirmeId)
        return [a.baslik, a.firmaAd, deg?.ad ?? '', a.sorumluAd, a.oncelik, a.baslangicTarihi, a.hedefTarih, a.durum, aksiyonGecikmis(a) ? 'Gecikmiş' : '']
      }),
    })

  const thBul = (a: RiskAksiyon) => tehlikeler.find((t) => t.id === a.tehlikeId)
  const degBul = (a: RiskAksiyon) => gorunenDeg.find((x) => x.id === a.degerlendirmeId)

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="text-lg font-semibold tracking-tight">Aksiyonlar</h1>
          <p className="text-xs text-muted-foreground">Tüm risk değerlendirmelerinden üretilen önlem aksiyonlarının merkezi takibi</p>
        </div>
        {aktarIzni && (
          <>
            <Button variant="outline" size="sm" onClick={() => void aksiyonPdfIndir(filtreli, 'Aksiyon Takip Raporu', osgbAd()).then(() => toast.success('Rapor indirildi'))}>
              <FileTextIcon /> Rapor
            </Button>
            <Button variant="outline" size="sm" onClick={() => void excelAktar()}>
              Excel
            </Button>
          </>
        )}
      </div>

      <StatSerit
        ogeler={[
          { label: 'Toplam aksiyon', deger: gorunenAk.length, ikon: ShieldAlertIcon },
          { label: 'Açık', deger: acikSayi, ikon: ClockIcon },
          { label: 'Gecikmiş', deger: gecikmisSayi, delta: gecikmisSayi > 0 ? 'acil' : undefined, iyi: gecikmisSayi === 0 },
          { label: 'Tamamlanan', deger: tamamlananSayi, ikon: CheckCircle2Icon },
          { label: 'Bu ay tamamlanan', deger: buAyTamamlanan },
          { label: 'Değerlendirme', deger: gorunenDeg.length },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <CipGrup secenekler={CIPLER} value={cip} onChange={(v) => { setCip(v); setSayfa(0) }} />
        <div className="relative ml-auto w-56">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => { setAra(e.target.value); setSayfa(0) }}
            placeholder="Aksiyon, sorumlu, firma ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <FiltrePopover
          aktifSayi={(firmaF !== 'Tümü' ? 1 : 0) + (sorumluF !== 'Tümü' ? 1 : 0) + (oncelikF !== 'Tümü' ? 1 : 0) + (degF !== 'Tümü' ? 1 : 0)}
          onTemizle={() => { setFirmaF('Tümü'); setSorumluF('Tümü'); setOncelikF('Tümü'); setDegF('Tümü'); setSayfa(0) }}
          sorular={[
            { label: 'Firma', value: gorunenFirmalar.find((f) => f.id === firmaF)?.kisaAd ?? 'Tümü', options: ['Tümü', ...gorunenFirmalar.map((f) => f.kisaAd)], onChange: (v) => { setFirmaF(gorunenFirmalar.find((f) => f.kisaAd === v)?.id ?? 'Tümü'); setSayfa(0) } },
            { label: 'Sorumlu', value: sorumluF, options: ['Tümü', ...sorumlular], onChange: (v) => { setSorumluF(v); setSayfa(0) } },
            { label: 'Öncelik', value: oncelikF, options: ['Tümü', ...AKSIYON_ONCELIKLER], onChange: (v) => { setOncelikF(v); setSayfa(0) } },
            { label: 'Değerlendirme', value: gorunenDeg.find((x) => x.id === degF)?.ad ?? 'Tümü', options: ['Tümü', ...gorunenDeg.map((x) => x.ad)], onChange: (v) => { setDegF(gorunenDeg.find((x) => x.ad === v)?.id ?? 'Tümü'); setSayfa(0) } },
          ]}
        />
      </div>

      <div ref={alanRef} className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b bg-card text-left">
            <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:text-xs [&>th]:font-medium [&>th]:text-muted-foreground">
              <th>Aksiyon</th>
              <th>Firma</th>
              <th className="hidden xl:table-cell">Değerlendirme</th>
              <th className="hidden lg:table-cell">İlgili tehlike</th>
              <th>Sorumlu</th>
              <th>Öncelik</th>
              <th>Oluşturulma</th>
              <th>Hedef</th>
              <th className="text-right">Durum</th>
            </tr>
          </thead>
          <tbody>
            {sayfaVeri.map((a) => {
              const gecikti = aksiyonGecikmis(a)
              return (
                <tr
                  key={a.id}
                  onClick={() => { setSecili(a); setNotMetni('') }}
                  className={cn('cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40 [&>td]:px-3 [&>td]:py-3', gecikti && 'bg-red-500/[0.04]')}
                >
                  <td>
                    <p className="font-medium">{a.baslik}</p>
                    {gecikti && <p className="text-[11px] font-medium text-red-500">Hedef tarih geçti</p>}
                  </td>
                  <td className="text-xs text-muted-foreground">{a.firmaAd}</td>
                  <td className="hidden max-w-48 truncate text-xs text-muted-foreground xl:table-cell">{degBul(a)?.ad ?? '—'}</td>
                  <td className="hidden max-w-44 truncate text-xs text-muted-foreground lg:table-cell">{thBul(a)?.kaynak ?? '—'}</td>
                  <td className="text-xs whitespace-nowrap">{a.sorumluAd}</td>
                  <td><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', oncelikRenk[a.oncelik])}>{a.oncelik}</span></td>
                  <td className="text-xs whitespace-nowrap text-muted-foreground">{a.olusturma}</td>
                  <td className={cn('text-xs whitespace-nowrap', gecikti ? 'font-semibold text-red-500' : 'text-muted-foreground')}>{a.hedefTarih}</td>
                  <td className="text-right"><span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', aksiyonDurumRenk[a.durum])}>{a.durum}</span></td>
                </tr>
              )
            })}
            {sayfaVeri.length === 0 && (
              <tr><td colSpan={9} className="py-16 text-center text-sm text-muted-foreground">Kriterlere uygun aksiyon bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
        <ListeFooter
          bas={sayfaGuvenli * boyut + (filtreli.length ? 1 : 0)}
          son={Math.min(filtreli.length, sayfaGuvenli * boyut + boyut)}
          toplam={filtreli.length}
          sayfaGuvenli={sayfaGuvenli}
          sayfaSayisi={sayfaSayisi}
          sayfaBoyu={sayfaBoyu}
          otoBoy={otoBoy}
          onBoyut={setSayfaBoyu}
          onSayfa={setSayfa}
        />
      </div>

      {/* Aksiyon detay drawer */}
      {secili && (
        <Sheet open onOpenChange={(o) => !o && setSecili(null)}>
          <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
            <SheetTitle className="flex items-center gap-2 px-4 pt-4 text-base">
              {secili.baslik}
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', aksiyonDurumRenk[secili.durum])}>{secili.durum}</span>
              {aksiyonGecikmis(secili) && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-500">Gecikmiş</span>}
            </SheetTitle>
            <div className="space-y-5 px-4 pt-3 pb-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border bg-card p-4">
                <div><p className="text-[11px] text-muted-foreground">Firma</p><p className="text-sm font-medium">{secili.firmaAd}</p></div>
                <div><p className="text-[11px] text-muted-foreground">Sorumlu</p><p className="text-sm font-medium">{secili.sorumluAd}</p></div>
                <div><p className="text-[11px] text-muted-foreground">Öncelik</p><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', oncelikRenk[secili.oncelik])}>{secili.oncelik}</span></div>
                <div><p className="text-[11px] text-muted-foreground">Hedef tarih</p><p className={cn('text-sm font-medium', aksiyonGecikmis(secili) && 'text-red-500')}>{secili.hedefTarih}</p></div>
                <div className="col-span-2">
                  <p className="text-[11px] text-muted-foreground">{secili.kaynak?.tur === 'denetim' ? 'Kaynak denetim' : 'Değerlendirme'}</p>
                  {secili.kaynak?.tur === 'denetim' ? (
                    <button onClick={() => nav(`/panel/denetimler/${secili.kaynak!.denetimId}`)} className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400">
                      {secili.kaynak.denetimNo} → {secili.kaynak.bulguId ? `bulgu ${secili.kaynak.bulguId}` : ''} →
                    </button>
                  ) : (
                    <button onClick={() => nav(`/panel/risk/${secili.degerlendirmeId}`)} className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400">
                      {degBul(secili)?.ad ?? secili.degerlendirmeId} →
                    </button>
                  )}
                </div>
                {thBul(secili) && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-muted-foreground">İlgili tehlike</p>
                    <p className="text-sm">{thBul(secili)!.bolum} — {thBul(secili)!.kaynak} <span className="text-xs text-muted-foreground">(puan {thBul(secili)!.puan} · {thBul(secili)!.seviye})</span></p>
                  </div>
                )}
                {secili.aciklama && <div className="col-span-2"><p className="text-[11px] text-muted-foreground">Açıklama</p><p className="text-sm">{secili.aciklama}</p></div>}
                {secili.tamamlanmaNotu && (
                  <div className="col-span-2 rounded-lg bg-emerald-500/5 p-3">
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Tamamlanma notu — {secili.tamamlayan} · {secili.tamamlanmaTarihi}</p>
                    <p className="mt-0.5 text-sm">{secili.tamamlanmaNotu}</p>
                  </div>
                )}
              </div>

              {/* Dosyalar */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><PaperclipIcon className="size-3.5" /> Dosyalar ({secili.dosyalar.length})</p>
                <div className="space-y-1.5">
                  {secili.dosyalar.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                      <FileTextIcon className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{f.ad}</span>
                      <span className="text-[11px] text-muted-foreground">{f.ekleyen} · {f.tarih}</span>
                    </div>
                  ))}
                  {secili.dosyalar.length === 0 && <p className="text-xs text-muted-foreground">Ek yok.</p>}
                </div>
              </div>

              {/* Durum geçmişi */}
              <div>
                <p className="mb-2 text-xs font-semibold">Durum geçmişi</p>
                <div className="space-y-0">
                  {[...secili.gecmis].reverse().map((o, i) => (
                    <div key={i} className="border-l-2 border-border pb-3 pl-3 last:pb-0">
                      <p className="text-xs font-medium">{o.islem}</p>
                      <p className="text-[11px] text-muted-foreground">{o.tarih} · {o.kullanici}{o.not ? ` — ${o.not}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aksiyon işlemleri */}
              {duzenleIzni && aksiyonAcik(secili) && (
                <div className="space-y-2 rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold">Tamamla</p>
                  <textarea
                    value={notMetni}
                    onChange={(e) => setNotMetni(e.target.value)}
                    rows={2}
                    placeholder="Tamamlanma açıklaması (zorunlu) — yapılan işlem ve kanıtlar…"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!notMetni.trim()}
                      onClick={() => {
                        aksiyonTamamla(secili.id, { kullanici, not: notMetni.trim() })
                        toast.success('Aksiyon tamamlandı')
                        setSecili(null)
                      }}
                    >
                      <CheckCircle2Icon /> Tamamla
                    </Button>
                    {secili.durum === 'Bekliyor' && (
                      <Button size="sm" variant="outline" onClick={() => { aksiyonDurum(secili.id, 'Devam Ediyor', kullanici); setSecili({ ...secili, durum: 'Devam Ediyor' }) }}>Devam Et</Button>
                    )}
                    {secili.durum === 'Devam Ediyor' && (
                      <Button size="sm" variant="outline" onClick={() => { aksiyonDurum(secili.id, 'Kontrol Bekliyor', kullanici); setSecili({ ...secili, durum: 'Kontrol Bekliyor' }) }}>Kontrole Gönder</Button>
                    )}
                    <Button
                      size="sm" variant="ghost" className="ml-auto text-muted-foreground"
                      onClick={() => { aksiyonDurum(secili.id, 'İptal Edildi', kullanici, 'Kullanıcı tarafından iptal edildi'); toast('Aksiyon iptal edildi'); setSecili(null) }}
                    >
                      <BanIcon /> İptal Et
                    </Button>
                  </div>
                </div>
              )}
              {duzenleIzni && secili.durum === 'Tamamlandı' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-400">Tamamlanan aksiyonu yeniden aç</p>
                  <div className="flex gap-2">
                    <input
                      value={notMetni}
                      onChange={(e) => setNotMetni(e.target.value)}
                      placeholder="Yeniden açma nedeni (zorunlu)"
                      className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!notMetni.trim()}
                      onClick={() => {
                        aksiyonYenidenAc(secili.id, kullanici, notMetni.trim())
                        toast('Aksiyon yeniden açıldı')
                        setSecili(null)
                      }}
                    >
                      <Undo2Icon /> Yeniden Aç
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
