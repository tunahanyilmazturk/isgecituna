import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertTriangleIcon,
  Building2Icon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  ListChecksIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SecimAlan } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import {
  AKSIYON_ONCELIKLER,
  puanHesap,
  seviyeHesap,
  seviyeRenk,
  yontemSeed,
  type AksiyonOncelik,
  type EkipUye,
  type RiskEsik,
  type RiskSeviye,
} from '@/data/risk'
import { TEHLIKE_SINIFLARI, type TehlikeSinifi } from '@/data/firmalar'
import { adSoyad, hesapGorunenAd } from '@/data/ekip'
import { useRiskStore, type TehlikeKayit } from '@/stores/risk-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { kapsamdaMi, useRiskKapsam } from '@/lib/risk-kapsam'

/* ------------------------------- Form parçaları ---------------------------- */

function Alan({ label, children, zorunlu }: { label: string; zorunlu?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label} {zorunlu && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30'
const areaCls =
  'w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

const ADIMLAR = [
  { no: 1, ad: 'İşletme Bilgileri', ikon: Building2Icon, aciklama: 'Firma, işyeri ve değerlendirme ekibi' },
  { no: 2, ad: 'Tehlikeler ve Riskler', ikon: AlertTriangleIcon, aciklama: '5×5 matris ile tehlike puanlama' },
  { no: 3, ad: 'Önlemler ve Aksiyonlar', ikon: ListChecksIcon, aciklama: 'Alınacak önlemleri aksiyona dönüştür' },
  { no: 4, ad: 'Kontrol ve Onay', ikon: ClipboardListIcon, aciklama: 'Özet — taslak veya incelemeye gönder' },
]

interface TehlikeForm extends Omit<TehlikeKayit, 'yontemId'> {}
interface AksiyonForm {
  tehlikeIdx: number | null
  baslik: string
  aciklama: string
  sorumluId: string
  sorumluAd: string
  oncelik: AksiyonOncelik
  baslangicTarihi: string
  hedefTarih: string
}

const bosTehlike = (): TehlikeForm => ({
  bolum: '', faaliyet: '', kaynak: '', aciklama: '', olasiRisk: '',
  etkilenenler: '', mevcutOnlemler: '', olasiSonuclar: '', olasilik: 3, siddet: 3, ekOnlemler: '',
})

const EKIP_ROLLERI = ['İSG Uzmanı', 'İşyeri Hekimi', 'İşveren Vekili', 'Çalışan Temsilcisi', 'DSP', 'Destek Elemanı']

/** 5×5 matris ısı haritası — seçili hücre vurgulu */
function Matris({ esikler, o, s, onSec }: { esikler: RiskEsik[]; o: number; s: number; onSec: (o: number, s: number) => void }) {
  return (
    <div className="inline-block">
      <p className="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Şiddet ↓ / Olasılık →</p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
        {[5, 4, 3, 2, 1].map((sv) =>
          [1, 2, 3, 4, 5].map((ol) => {
            const puan = puanHesap(ol, sv)
            const sev = seviyeHesap(puan, esikler)
            const secili = ol === o && sv === s
            return (
              <button
                key={`${ol}-${sv}`}
                type="button"
                onClick={() => onSec(ol, sv)}
                title={`Olasılık ${ol} × Şiddet ${sv} = ${puan} (${sev})`}
                className={cn(
                  'flex h-8 w-9 items-center justify-center rounded text-[11px] font-semibold tabular-nums transition-transform',
                  seviyeRenk[sev].bg, seviyeRenk[sev].text,
                  secili && 'ring-2 ring-foreground scale-110 z-10',
                )}
              >
                {puan}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}

export default function RiskYeniPage() {
  const nav = useNavigate()
  const { degerlendirmeOlustur } = useRiskStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const personeller = usePersonelStore((s) => s.personeller)
  const { uyeler, hesaplar } = useEkipStore()
  const user = useAuthStore((s) => s.user)
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.username ?? 'Kullanıcı')
  const kapsam = useRiskKapsam()
  const secilebilirFirmalar = useMemo(() => firmalar.filter((f) => kapsamdaMi(kapsam, f.id)), [firmalar, kapsam])

  const [adim, setAdim] = useState(0)

  /* Adım 1 */
  const [firmaId, setFirmaId] = useState('')
  const [ad, setAd] = useState('')
  const [isyeriAd, setIsyeriAd] = useState('')
  const [adres, setAdres] = useState('')
  const [nace, setNace] = useState('')
  const [faaliyet, setFaaliyet] = useState('')
  const [tehlikeSinifi, setTehlikeSinifi] = useState<TehlikeSinifi | ''>('')
  const [calisanSayisi, setCalisanSayisi] = useState('')
  const [degTarih, setDegTarih] = useState(TODAY)
  const [yenTarih, setYenTarih] = useState('')
  const [isveren, setIsveren] = useState('')
  const [isverenVekili, setIsverenVekili] = useState('')
  const [ekip, setEkip] = useState<EkipUye[]>([])
  const [uyeAd, setUyeAd] = useState('')
  const [uyeRol, setUyeRol] = useState(EKIP_ROLLERI[0])
  const [esikler] = useState<RiskEsik[]>(yontemSeed[0].esikler)

  /* Adım 2 */
  const [tehlikeler, setTehlikeler] = useState<TehlikeForm[]>([])
  const [tf, setTf] = useState<TehlikeForm>(bosTehlike())
  const [duzenlenen, setDuzenlenen] = useState<number | null>(null)

  /* Adım 3 */
  const [aksiyonlar, setAksiyonlar] = useState<AksiyonForm[]>([])

  const firma = firmalar.find((f) => f.id === firmaId)
  const firmaPersonel = useMemo(
    () => personeller.filter((p) => p.firmaId === firmaId && p.durum === 'Aktif'),
    [personeller, firmaId],
  )
  const sorumluSecenekleri = useMemo(() => [
    ...firmaPersonel.map((p) => ({ id: p.id, ad: `${p.ad} ${p.soyad}`, grup: `${firma?.kisaAd ?? 'Firma'} personeli` })),
    ...uyeler.map((u) => ({ id: u.id, ad: adSoyad(u), grup: 'OSGB ekibi' })),
  ], [firmaPersonel, uyeler, firma])

  const firmaSec = (id: string) => {
    setFirmaId(id)
    const f = firmalar.find((x) => x.id === id)
    if (!f) return
    // CRM kaydından otomatik doldur — kullanıcı düzenleyebilir
    setIsyeriAd(f.unvan)
    setAdres(f.adres)
    setNace(f.nace)
    setFaaliyet(f.faaliyet)
    setTehlikeSinifi(f.tehlikeSinifi)
    setCalisanSayisi(String(f.calisanSayisi))
    setIsveren(f.yetkili)
    if (!ad) setAd(`${new Date().getFullYear()} ${f.kisaAd} Risk Değerlendirmesi`)
  }

  const adim1Gecerli = firmaId && ad.trim() && isyeriAd.trim() && degTarih && yenTarih
  const toplamAksiyon = aksiyonlar.length

  const tehlikeKaydet = () => {
    if (!tf.bolum.trim() || !tf.kaynak.trim()) {
      toast.error('Bölüm ve tehlike kaynağı zorunlu')
      return
    }
    if (duzenlenen !== null) {
      setTehlikeler((l) => l.map((t, i) => (i === duzenlenen ? tf : t)))
      setDuzenlenen(null)
    } else {
      setTehlikeler((l) => [...l, tf])
    }
    setTf(bosTehlike())
  }

  const kaydet = (durum: 'Taslak' | 'İncelemede') => {
    if (!firmaId || !ad.trim()) return
    const kayit = degerlendirmeOlustur(
      {
        ad: ad.trim(),
        firmaId,
        firmaAd: firma?.unvan ?? '',
        tehlikeSinifi,
        nace,
        faaliyet,
        isyeriAd,
        adres,
        calisanSayisi: Number(calisanSayisi) || 0,
        isveren,
        isverenVekili: isverenVekili || undefined,
        ekip: ekip.length ? ekip : [{ adSoyad: kullanici, rol: 'İSG Uzmanı' }],
        yontemId: 'YM-L5x5',
        esikler,
        degerlendirmeTarihi: degTarih,
        yenilemeTarihi: yenTarih,
        olusturan: kullanici,
      },
      {
        kullanici,
        durum,
        tehlikeler: tehlikeler.map((t) => ({ ...t, yontemId: 'YM-L5x5' })),
        aksiyonlar: aksiyonlar.map((a) => {
          const th = a.tehlikeIdx !== null ? tehlikeler[a.tehlikeIdx] : null
          return {
            tehlikeId: th ? `TH-WIZ-${a.tehlikeIdx}` : undefined, // sihirbaz içi referans — store gerçek id ile eşler
            baslik: a.baslik,
            aciklama: a.aciklama || undefined,
            sorumluId: a.sorumluId,
            sorumluAd: a.sorumluAd,
            oncelik: a.oncelik,
            baslangicTarihi: a.baslangicTarihi,
            hedefTarih: a.hedefTarih,
            olusturan: kullanici,
          }
        }),
      },
    )
    // Sihirbaz tehlike referanslarını gerçek id'lere eşle — store'da oluşturulan sıra aynı
    toast.success(durum === 'Taslak' ? 'Taslak kaydedildi' : 'Değerlendirme incelemeye gönderildi')
    nav(`/panel/risk/${kayit.id}`)
  }

  const secilenPuan = puanHesap(tf.olasilik, tf.siddet)
  const secilenSeviye: RiskSeviye = seviyeHesap(secilenPuan, esikler)

  return (
    <div className="flex h-full flex-col">
      {/* Üst bar */}
      <div className="flex items-center gap-3 border-b px-5 py-3.5">
        <button onClick={() => nav('/panel/risk')} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
          <ChevronLeftIcon className="size-4" />
        </button>
        <div className="mr-auto">
          <h1 className="text-base font-semibold">Yeni Risk Değerlendirmesi</h1>
          <p className="text-xs text-muted-foreground">{ADIMLAR[adim].ad} — {ADIMLAR[adim].aciklama}</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">Adım {adim + 1}/4</span>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r bg-[#111214] bg-cover bg-[center_68%] text-white lg:flex" style={{ backgroundImage: "url('/images/firma-wizard-sidebar.png')" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#101113]/95 via-[#111214]/80 to-[#111214]/95" />
          <div className="relative z-10 flex h-full flex-col p-4">
            <div className="border-b border-white/10 px-2 pb-4"><div className="text-sm font-semibold">Risk değerlendirmesi</div><p className="mt-1 text-[11px] leading-relaxed text-white/55">Tehlikeleri belirleyin, önlemleri planlayın ve kaydı incelemeye hazırlayın.</p></div>
            <nav className="mt-3 space-y-1" aria-label="Risk değerlendirmesi adımları">
              {ADIMLAR.map((a, i) => <button key={a.no} type="button" disabled={i > adim} onClick={() => i < adim && setAdim(i)} className={cn('flex w-full items-start gap-3 rounded-xl px-2.5 py-3 text-left transition-colors', i === adim ? 'bg-white/10' : i < adim ? 'hover:bg-white/5' : 'cursor-default opacity-45')}>
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold', i < adim ? 'border-emerald-500 bg-emerald-500 text-white' : i === adim ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-white/20 text-white/50')}>{i < adim ? <CheckIcon className="size-3.5" /> : a.no}</span>
                <span><span className="block text-xs font-medium text-white">{a.ad}</span><span className="mt-1 block text-[10px] leading-relaxed text-white/50">{a.aciklama}</span></span>
              </button>)}
            </nav>
            <div className="mt-auto rounded-xl border border-white/10 bg-black/25 p-3 backdrop-blur-sm"><div className="flex justify-between text-[10px] text-white/55"><span>İlerleme</span><span>{adim + 1}/4</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-amber-400" style={{ width: `${((adim + 1) / 4) * 100}%` }} /></div><p className="mt-2 truncate text-[11px] font-medium text-white">{firma?.kisaAd || 'Firma seçilmedi'}</p></div>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-b px-4 py-2 lg:hidden"><div className="flex items-center justify-between text-xs"><span className="font-medium">{ADIMLAR[adim].ad}</span><span className="text-muted-foreground">Adım {adim + 1}/4</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: `${((adim + 1) / 4) * 100}%` }} /></div></div>

      {/* İçerik */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-5 py-6">

          {/* ================= ADIM 1 — İşletme ================= */}
          {adim === 0 && (
            <div className="space-y-5">
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Building2Icon className="size-4 text-amber-500" /> Firma ve işyeri</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SecimAlan label="Firma *" value={firma?.kisaAd ?? 'Seçin…'} options={['Seçin…', ...secilebilirFirmalar.map((f) => f.kisaAd)]} onChange={(v) => firmaSec(secilebilirFirmalar.find((f) => f.kisaAd === v)?.id ?? '')} />
                  <Alan label="Değerlendirme adı" zorunlu>
                    <input value={ad} onChange={(e) => setAd(e.target.value)} className={inputCls} placeholder="2026 Üretim Sahası Risk Değerlendirmesi" />
                  </Alan>
                  <Alan label="İşyeri adı" zorunlu>
                    <input value={isyeriAd} onChange={(e) => setIsyeriAd(e.target.value)} className={inputCls} />
                  </Alan>
                  <Alan label="İşyeri adresi">
                    <input value={adres} onChange={(e) => setAdres(e.target.value)} className={inputCls} />
                  </Alan>
                  <Alan label="NACE kodu">
                    <input value={nace} onChange={(e) => setNace(e.target.value)} className={inputCls} placeholder="25.61" />
                  </Alan>
                  <Alan label="Faaliyet alanı">
                    <input value={faaliyet} onChange={(e) => setFaaliyet(e.target.value)} className={inputCls} />
                  </Alan>
                  <SecimAlan label="Tehlike sınıfı" value={tehlikeSinifi || 'Seçin…'} options={['Seçin…', ...TEHLIKE_SINIFLARI]} onChange={(v) => setTehlikeSinifi(v === 'Seçin…' ? '' : (v as TehlikeSinifi))} />
                  <Alan label="Çalışan sayısı">
                    <input type="number" min={0} value={calisanSayisi} onChange={(e) => setCalisanSayisi(e.target.value)} className={inputCls} />
                  </Alan>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 text-sm font-semibold">Tarihler</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Alan label="Değerlendirme tarihi" zorunlu>
                    <input type="date" value={degTarih} onChange={(e) => setDegTarih(e.target.value)} className={inputCls} />
                  </Alan>
                  <Alan label="Sonraki değerlendirme / yenileme tarihi" zorunlu>
                    <input type="date" value={yenTarih} onChange={(e) => setYenTarih(e.target.value)} className={inputCls} />
                  </Alan>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Yenileme süresi işyerinin tehlike sınıfı ve koşullarına göre belirlenir — sabit bir süre varsayılmaz.</p>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><UsersIcon className="size-4 text-amber-500" /> İşveren ve değerlendirme ekibi</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Alan label="İşveren">
                    <input value={isveren} onChange={(e) => setIsveren(e.target.value)} className={inputCls} />
                  </Alan>
                  <Alan label="İşveren vekili">
                    <input value={isverenVekili} onChange={(e) => setIsverenVekili(e.target.value)} className={inputCls} />
                  </Alan>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Değerlendirme ekibi ({ekip.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ekip.map((u, i) => (
                      <span key={i} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
                        {u.adSoyad} <span className="text-muted-foreground">· {u.rol}</span>
                        <button type="button" onClick={() => setEkip((l) => l.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500">×</button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <input value={uyeAd} onChange={(e) => setUyeAd(e.target.value)} placeholder="Ad Soyad" className="h-7 w-36 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30" />
                      <select value={uyeRol} onChange={(e) => setUyeRol(e.target.value)} className="h-7 rounded-lg border border-input bg-transparent px-1.5 text-xs outline-none dark:bg-input/30">
                        {EKIP_ROLLERI.map((r) => <option key={r}>{r}</option>)}
                      </select>
                      <Button size="xs" variant="outline" disabled={!uyeAd.trim()} onClick={() => { setEkip((l) => [...l, { adSoyad: uyeAd.trim(), rol: uyeRol }]); setUyeAd('') }}>
                        <PlusIcon /> Ekle
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ADIM 2 — Tehlikeler ================= */}
          {adim === 1 && (
            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                {tehlikeler.map((t, i) => {
                  const puan = puanHesap(t.olasilik, t.siddet)
                  const sev = seviyeHesap(puan, esikler)
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums', seviyeRenk[sev].bg, seviyeRenk[sev].text)}>{puan}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.kaynak}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.bolum} · {t.faaliyet} — {sev} risk</p>
                      </div>
                      <Button size="xs" variant="ghost" onClick={() => { setTf(t); setDuzenlenen(i) }}>Düzenle</Button>
                      <button type="button" onClick={() => setTehlikeler((l) => l.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500"><Trash2Icon className="size-4" /></button>
                    </div>
                  )
                })}
                {tehlikeler.length === 0 && (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Henüz tehlike eklenmedi — sağdaki formu veya aşağıdaki alanı kullanın.
                  </div>
                )}

                {/* Tehlike formu */}
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="mb-4 text-sm font-semibold">{duzenlenen !== null ? `Tehlike #${duzenlenen + 1} düzenleniyor` : `Tehlike ekle (${tehlikeler.length + 1})`}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Alan label="Bölüm / çalışma alanı" zorunlu><input value={tf.bolum} onChange={(e) => setTf({ ...tf, bolum: e.target.value })} className={inputCls} placeholder="Üretim — Pres Hattı" /></Alan>
                    <Alan label="Faaliyet"><input value={tf.faaliyet} onChange={(e) => setTf({ ...tf, faaliyet: e.target.value })} className={inputCls} placeholder="Hidrolik pres ile şekillendirme" /></Alan>
                    <Alan label="Tehlike kaynağı" zorunlu><input value={tf.kaynak} onChange={(e) => setTf({ ...tf, kaynak: e.target.value })} className={inputCls} placeholder="Koruyucusuz pres kalıbı" /></Alan>
                    <Alan label="Olası risk"><input value={tf.olasiRisk} onChange={(e) => setTf({ ...tf, olasiRisk: e.target.value })} className={inputCls} placeholder="El/parmak ezilmesi" /></Alan>
                    <div className="sm:col-span-2"><Alan label="Tehlike açıklaması"><textarea value={tf.aciklama} onChange={(e) => setTf({ ...tf, aciklama: e.target.value })} rows={2} className={areaCls} /></Alan></div>
                    <Alan label="Etkilenebilecek kişiler"><input value={tf.etkilenenler} onChange={(e) => setTf({ ...tf, etkilenenler: e.target.value })} className={inputCls} placeholder="Pres operatörleri (3 kişi)" /></Alan>
                    <Alan label="Olası sonuçlar"><input value={tf.olasiSonuclar} onChange={(e) => setTf({ ...tf, olasiSonuclar: e.target.value })} className={inputCls} placeholder="Kalıcı uzuv kaybı" /></Alan>
                    <div className="sm:col-span-2"><Alan label="Mevcut önlemler"><textarea value={tf.mevcutOnlemler} onChange={(e) => setTf({ ...tf, mevcutOnlemler: e.target.value })} rows={2} className={areaCls} placeholder="İki el kumanda, acil stop…" /></Alan></div>
                    <div className="sm:col-span-2"><Alan label="Alınması gereken ek önlemler"><textarea value={tf.ekOnlemler} onChange={(e) => setTf({ ...tf, ekOnlemler: e.target.value })} rows={2} className={areaCls} placeholder="Işık perdesi montajı, periyodik kontrol…" /></Alan></div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-5">
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Olasılık (1–5)</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setTf({ ...tf, olasilik: n })}
                            className={cn('size-8 rounded-lg border text-sm font-medium tabular-nums', tf.olasilik === n ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'text-muted-foreground hover:border-foreground/30')}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Şiddet (1–5)</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setTf({ ...tf, siddet: n })}
                            className={cn('size-8 rounded-lg border text-sm font-medium tabular-nums', tf.siddet === n ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'text-muted-foreground hover:border-foreground/30')}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', seviyeRenk[secilenSeviye].bg)}>
                      <span className="text-lg font-bold tabular-nums">{secilenPuan}</span>
                      <span className={cn('text-xs font-semibold', seviyeRenk[secilenSeviye].text)}>{secilenSeviye} risk</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    {duzenlenen !== null && <Button variant="ghost" size="sm" onClick={() => { setTf(bosTehlike()); setDuzenlenen(null) }}>Vazgeç</Button>}
                    <Button size="sm" onClick={tehlikeKaydet} disabled={!tf.bolum.trim() || !tf.kaynak.trim()}>
                      <PlusIcon /> {duzenlenen !== null ? 'Güncelle' : 'Tehlike ekle'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Matris paneli */}
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-4">
                  <p className="mb-3 text-xs font-semibold">5×5 L Tipi Matris</p>
                  <Matris esikler={esikler} o={tf.olasilik} s={tf.siddet} onSec={(o, s) => setTf({ ...tf, olasilik: o, siddet: s })} />
                  <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    {esikler.map((e) => (
                      <div key={e.seviye} className="flex items-center gap-1.5">
                        <span className="size-2 rounded-sm" style={{ background: seviyeRenk[e.seviye].hex }} />
                        {e.min}–{e.max}: {e.seviye}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Yöntem: {yontemSeed[0].ad}</p>
                  <p className="mt-1">{yontemSeed[0].aciklama}</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= ADIM 3 — Aksiyonlar ================= */}
          {adim === 2 && (
            <div className="space-y-4">
              {tehlikeler.map((t, i) => {
                const iliskili = aksiyonlar.filter((a) => a.tehlikeIdx === i)
                const puan = puanHesap(t.olasilik, t.siddet)
                const sev = seviyeHesap(puan, esikler)
                return (
                  <div key={i} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums', seviyeRenk[sev].bg, seviyeRenk[sev].text)}>{puan}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.kaynak}</p>
                        <p className="text-xs text-muted-foreground">{t.bolum} — {sev}</p>
                      </div>
                      <Button size="xs" variant="outline" onClick={() => setAksiyonlar((l) => [...l, { tehlikeIdx: i, baslik: t.ekOnlemler?.split(/[;\n]/)[0]?.trim() || `${t.kaynak} önlemi`, aciklama: t.ekOnlemler ?? '', sorumluId: sorumluSecenekleri[0]?.id ?? '', sorumluAd: sorumluSecenekleri[0]?.ad ?? '', oncelik: sev === 'Çok Yüksek' ? 'Kritik' : sev === 'Yüksek' ? 'Yüksek' : 'Orta', baslangicTarihi: TODAY, hedefTarih: yenTarih || TODAY }])}>
                        <PlusIcon /> Aksiyon
                      </Button>
                    </div>
                    {iliskili.map((a) => {
                      const gi = aksiyonlar.indexOf(a)
                      return (
                        <div key={gi} className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
                          <div className="flex items-center gap-2">
                            <input value={a.baslik} onChange={(e) => setAksiyonlar((l) => l.map((x, j) => j === gi ? { ...x, baslik: e.target.value } : x))} className={cn(inputCls, 'h-8 flex-1')} placeholder="Aksiyon başlığı" />
                            <select value={a.oncelik} onChange={(e) => setAksiyonlar((l) => l.map((x, j) => j === gi ? { ...x, oncelik: e.target.value as AksiyonOncelik } : x))} className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs dark:bg-input/30">
                              {AKSIYON_ONCELIKLER.map((o) => <option key={o}>{o}</option>)}
                            </select>
                            <input type="date" value={a.hedefTarih} onChange={(e) => setAksiyonlar((l) => l.map((x, j) => j === gi ? { ...x, hedefTarih: e.target.value } : x))} className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs dark:bg-input/30" />
                            <button type="button" onClick={() => setAksiyonlar((l) => l.filter((_, j) => j !== gi))} className="text-muted-foreground hover:text-red-500"><Trash2Icon className="size-4" /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={a.sorumluId}
                              onChange={(e) => {
                                const s = sorumluSecenekleri.find((x) => x.id === e.target.value)
                                setAksiyonlar((l) => l.map((x, j) => j === gi ? { ...x, sorumluId: s?.id ?? '', sorumluAd: s?.ad ?? '' } : x))
                              }}
                              className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-xs dark:bg-input/30"
                            >
                              <option value="">Sorumlu seç…</option>
                              {(['Firma personeli', 'OSGB ekibi'] as const).map((g) => (
                                <optgroup key={g} label={g === 'Firma personeli' ? (firma?.kisaAd ?? g) : g}>
                                  {sorumluSecenekleri.filter((x) => x.grup === g || (g === 'Firma personeli' && x.grup.endsWith('personeli'))).map((x) => (
                                    <option key={x.id} value={x.id}>{x.ad}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <input value={a.aciklama} onChange={(e) => setAksiyonlar((l) => l.map((x, j) => j === gi ? { ...x, aciklama: e.target.value } : x))} className={cn(inputCls, 'h-8 flex-2')} placeholder="Açıklama (opsiyonel)" />
                          </div>
                        </div>
                      )
                    })}
                    {t.ekOnlemler && iliskili.length === 0 && (
                      <p className="mt-2 text-[11px] text-muted-foreground">Önerilen önlem: {t.ekOnlemler}</p>
                    )}
                  </div>
                )
              })}
              {tehlikeler.length === 0 && (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aksiyon tanımlamak için önce tehlike ekleyin — 2. adıma dönün.</div>
              )}
              {tehlikeler.length > 0 && (
                <p className="text-xs text-muted-foreground">{toplamAksiyon} aksiyon tanımlandı — her aksiyon sorumlusu ve hedef tarihiyle merkezi aksiyon takibine düşer.</p>
              )}
            </div>
          )}

          {/* ================= ADIM 4 — Kontrol ================= */}
          {adim === 3 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { l: 'Değerlendirme', v: ad || '—', d: `${firma?.unvan ?? '—'} · ${isyeriAd}` },
                  { l: 'Tehlike', v: tehlikeler.length, d: `${tehlikeler.filter((t) => ['Yüksek', 'Çok Yüksek'].includes(seviyeHesap(puanHesap(t.olasilik, t.siddet), esikler))).length} yüksek+` },
                  { l: 'Aksiyon', v: toplamAksiyon, d: `${aksiyonlar.filter((a) => a.oncelik === 'Kritik').length} kritik öncelik` },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{k.l}</p>
                    <p className="mt-1 truncate text-lg font-semibold">{k.v}</p>
                    <p className="truncate text-xs text-muted-foreground">{k.d}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold">Tehlike özeti</h2>
                <div className="space-y-2">
                  {tehlikeler.map((t, i) => {
                    const puan = puanHesap(t.olasilik, t.siddet)
                    const sev = seviyeHesap(puan, esikler)
                    const ak = aksiyonlar.filter((a) => a.tehlikeIdx === i).length
                    return (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className={cn('w-8 text-center text-xs font-bold tabular-nums rounded', seviyeRenk[sev].bg, seviyeRenk[sev].text)}>{puan}</span>
                        <span className="min-w-0 flex-1 truncate">{t.bolum} — {t.kaynak}</span>
                        <span className={cn('text-xs font-medium', seviyeRenk[sev].text)}>{sev}</span>
                        <span className="text-xs text-muted-foreground">{ak} aksiyon</span>
                      </div>
                    )
                  })}
                  {tehlikeler.length === 0 && <p className="text-sm text-muted-foreground">Tehlike kaydı yok.</p>}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-400">
                <p className="font-medium">Onay ve imza süreçleri</p>
                <p className="mt-1">Uygulama içi onay, hukuken gerekli imza ve onay süreçlerinin yerine geçmez. Üretilen PDF, ilgili mevzuatın öngördüğü imza/onay akışı için ayrıca kullanılmalıdır.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alt navigasyon */}
      <div className="flex items-center justify-between border-t px-5 py-3.5">
        <Button variant="ghost" size="sm" disabled={adim === 0} onClick={() => setAdim((a) => a - 1)}>
          <ChevronLeftIcon /> Geri
        </Button>
        <div className="flex items-center gap-2">
          {adim === 0 && !adim1Gecerli && <span className="text-xs text-muted-foreground">Firma, ad, işyeri ve tarihler zorunlu</span>}
          {adim < 3 ? (
            <Button size="sm" disabled={adim === 0 && !adim1Gecerli} onClick={() => setAdim((a) => a + 1)}>
              İleri <ChevronRightIcon />
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => kaydet('Taslak')}>
                Taslak olarak kaydet
              </Button>
              <Button size="sm" onClick={() => kaydet('İncelemede')}>
                <ShieldAlertIcon /> İncelemeye gönder
              </Button>
            </>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}
