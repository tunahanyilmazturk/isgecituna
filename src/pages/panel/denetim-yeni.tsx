import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckIcon,
  ListChecksIcon,
  SaveIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import { formatKisa } from '@/lib/date'
import { KATILIMCI_ROLLER, type DenetimKatilimci, type KatilimciRol } from '@/data/denetimler'
import { sablondanMaddeler, useDenetimlerStore } from '@/stores/denetimler-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { adSoyad, hesapGorunenAd } from '@/data/ekip'
import { useIzin } from '@/lib/izin'
import { kapsamdaMi, useKapsam } from '@/lib/kapsam'

const ADIMLAR = ['Denetim Bilgileri', 'Kontrol Listeleri', 'Ekip & Hazırlık', 'Özet & Planlama'] as const

const inp = 'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30'
const lbl = 'mb-1 block text-xs font-medium text-muted-foreground'

export default function DenetimYeniPage() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const st = useDenetimlerStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const personeller = usePersonelStore((s) => s.personeller)
  const { uyeler, hesaplar } = useEkipStore()
  const user = useAuthStore((s) => s.user)
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.name ?? 'Kullanıcı')
  const olusturIzni = useIzin('gorevlendirmeler.olustur')
  const kapsam = useKapsam('denetimler')

  const secilebilir = useMemo(() => firmalar.filter((f) => f.durum === 'Aktif' && kapsamdaMi(kapsam, f.id)), [firmalar, kapsam])
  const uzmanlar = useMemo(() => uyeler.filter((u) => u.durum === 'Aktif' && (u.gorev?.includes('Uzman') || u.gorev?.includes('Hekim'))), [uyeler])

  const [adim, setAdim] = useState(0)
  const [baslik, setBaslik] = useState('')
  const [firmaId, setFirmaId] = useState('')
  const [lokasyon, setLokasyon] = useState('')
  const [turId, setTurId] = useState('')
  const [tarih, setTarih] = useState(params.get('planla') ? TODAY : '')
  const [saat, setSaat] = useState('')
  const [uzmanId, setUzmanId] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [kapsamT, setKapsamT] = useState('')
  const [sablonIds, setSablonIds] = useState<string[]>([])
  const [katilimcilar, setKatilimcilar] = useState<DenetimKatilimci[]>([])
  const [yeniKat, setYeniKat] = useState('')
  const [yeniKatRol, setYeniKatRol] = useState<KatilimciRol>('Katılımcı')
  const [hazirlik, setHazirlik] = useState('')
  const [yeniTur, setYeniTur] = useState('')

  const firma = firmalar.find((f) => f.id === firmaId)
  const tur = st.turler.find((t) => t.id === turId)
  const uzman = uyeler.find((u) => u.id === uzmanId)

  const aktifTurler = st.turler.filter((t) => t.aktif)
  const aktifSablonlar = st.sablonlar.filter((s) => s.durum === 'Aktif')
  const { maddeler: seciliMaddeler } = useMemo(() => sablondanMaddeler(st.sablonlar, sablonIds), [st.sablonlar, sablonIds])

  const firmaSec = (id: string) => {
    setFirmaId(id)
    const f = firmalar.find((x) => x.id === id)
    if (f && !lokasyon) setLokasyon(f.adres || f.il)
  }

  // Çakışma uyarısı: aynı uzman + aynı tarih
  const cakisma = useMemo(
    () =>
      uzman && tarih
        ? st.denetimler.filter((d) => (d.durum === 'Planlandı' || d.durum === 'Devam Ediyor') && d.uzmanAd === adSoyad(uzman) && d.planlananTarih === tarih)
        : [],
    [uzman, tarih, st.denetimler],
  )

  if (!olusturIzni)
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-muted-foreground">Denetim oluşturma yetkiniz yok.</p>
        <Button variant="outline" size="sm" onClick={() => nav('/panel/denetimler')}><ArrowLeftIcon /> Listeye dön</Button>
      </div>
    )

  const adim0Ok = baslik.trim().length >= 3 && !!firma && !!tur && !!tarih && !!uzman
  const adim1Ok = sablonIds.length > 0 && seciliMaddeler.length > 0

  const olustur = (planla: boolean) => {
    const d = st.denetimOlustur(
      {
        baslik: baslik.trim(),
        firmaId: firma!.id,
        firmaAd: firma!.unvan,
        lokasyon: lokasyon.trim() || firma!.adres || firma!.il || '—',
        turId: tur!.id,
        turAd: tur!.ad,
        planlananTarih: tarih,
        planlananSaat: saat || undefined,
        uzmanId: uzman!.id,
        uzmanAd: adSoyad(uzman!),
        katilimcilar: [{ ad: adSoyad(uzman!), rol: 'Sorumlu Uzman' as KatilimciRol }, ...katilimcilar],
        aciklama: aciklama.trim() || undefined,
        kapsam: kapsamT.trim() || undefined,
        hazirlikNotlari: hazirlik.trim() || undefined,
        sablonIds,
        olusturan: kullanici,
      },
      planla,
    )
    toast.success(planla ? `Denetim planlandı: ${d.no}` : `Taslak kaydedildi: ${d.no}`, {
      description: `${d.firmaAd} · ${formatKisa(d.planlananTarih)} · ${seciliMaddeler.length} kontrol maddesi`,
    })
    nav(`/panel/denetimler/${d.id}`)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-4">
      <div>
        <button type="button" onClick={() => nav('/panel/denetimler')} className="mb-2 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeftIcon className="size-3.5" /> Denetimler
        </button>
        <h1 className="text-xl font-semibold tracking-tight">Yeni denetim</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Saha denetimini planlayın — kontrol listeleri seçip ekibi belirleyin.</p>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <aside className="relative hidden w-60 shrink-0 flex-col overflow-hidden rounded-xl border bg-[#111214] bg-cover bg-[center_68%] text-white lg:flex" style={{ backgroundImage: "url('/images/firma-wizard-sidebar.png')" }}>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#101113]/95 via-[#111214]/82 to-[#111214]/95" />
          <div className="relative z-10 flex h-full flex-col p-3">
            <div className="border-b border-white/10 px-2 py-3"><div className="text-sm font-semibold">Yeni denetim</div><p className="mt-1 text-[11px] leading-relaxed text-white/55">Saha kontrolünü ve ekibi tek akışta planlayın.</p></div>
            <nav className="mt-2 space-y-1" aria-label="Denetim oluşturma adımları">
              {ADIMLAR.map((a, i) => <button key={a} type="button" disabled={i > adim} onClick={() => i < adim && setAdim(i)} className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors', i === adim ? 'bg-white/10 text-white' : i < adim ? 'text-white/80 hover:bg-white/5' : 'cursor-default text-white/40')}>
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold', i < adim ? 'border-emerald-500 bg-emerald-500 text-white' : i === adim ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-white/20 text-white/50')}>{i < adim ? <CheckIcon className="size-3.5" /> : i + 1}</span><span className="min-w-0 truncate text-xs font-medium">{a}</span>
              </button>)}
            </nav>
            <div className="mt-auto rounded-lg border border-white/10 bg-black/25 p-3 backdrop-blur-sm"><div className="flex justify-between text-[10px] text-white/55"><span>İlerleme</span><span>{adim + 1}/{ADIMLAR.length}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-amber-400" style={{ width: `${((adim + 1) / ADIMLAR.length) * 100}%` }} /></div><p className="mt-2 truncate text-[11px] font-medium text-white">{firma?.kisaAd || 'Firma seçilmedi'}</p></div>
          </div>
        </aside>
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 lg:hidden"><div><h2 className="text-sm font-medium">{ADIMLAR[adim]}</h2><p className="text-[11px] text-muted-foreground">Adım {adim + 1} / {ADIMLAR.length}</p></div><div className="h-1 w-20 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: `${((adim + 1) / ADIMLAR.length) * 100}%` }} /></div></div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">

      {/* Adım 0 — Bilgiler */}
      {adim === 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={lbl}>Denetim başlığı *</label>
              <input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="ör. Kasım genel saha denetimi" className={inp} autoFocus />
            </div>
            <div>
              <label className={lbl}>Firma *</label>
              <select value={firmaId} onChange={(e) => firmaSec(e.target.value)} className={inp}>
                <option value="">Firma seçin…</option>
                {secilebilir.map((f) => <option key={f.id} value={f.id}>{f.unvan} — {f.il}</option>)}
              </select>
              {firma && <p className="mt-1 text-[11px] text-muted-foreground">Tehlike sınıfı: {firma.tehlikeSinifi || '—'} · SGK: {firma.sgkSicil || '—'}</p>}
            </div>
            <div>
              <label className={lbl}>İşyeri / lokasyon *</label>
              <input value={lokasyon} onChange={(e) => setLokasyon(e.target.value)} placeholder={firma?.adres ?? 'Denetim yapılacak bölüm'} className={inp} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className={lbl}>Denetim türü *</label>
              </div>
              <select value={turId} onChange={(e) => setTurId(e.target.value)} className={inp}>
                <option value="">Tür seçin…</option>
                {aktifTurler.map((t) => <option key={t.id} value={t.id}>{t.ad}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={lbl}>Yeni tür ekle</label>
                <input value={yeniTur} onChange={(e) => setYeniTur(e.target.value)} placeholder="Özel denetim türü…" className={inp} />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!yeniTur.trim()}
                onClick={() => {
                  const t = st.turEkle(yeniTur.trim(), undefined, kullanici)
                  setTurId(t.id)
                  setYeniTur('')
                  toast.success(`Denetim türü eklendi: ${t.ad}`)
                }}
              >
                Ekle
              </Button>
            </div>
            <div>
              <label className={lbl}>Planlanan tarih *</label>
              <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Saat</label>
              <input type="time" value={saat} onChange={(e) => setSaat(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Sorumlu uzman *</label>
              <select value={uzmanId} onChange={(e) => setUzmanId(e.target.value)} className={inp}>
                <option value="">Uzman seçin…</option>
                {uzmanlar.map((u) => <option key={u.id} value={u.id}>{adSoyad(u)} — {u.gorev}</option>)}
              </select>
            </div>
            {cakisma.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 sm:col-span-2 dark:text-amber-400">
                <AlertTriangleIcon className="size-3.5 shrink-0" />
                {adSoyad(uzman!)} aynı gün {cakisma.length} denetimde daha görevli: {cakisma.map((c) => c.no).join(', ')}
              </div>
            )}
            <div className="sm:col-span-2">
              <label className={lbl}>Açıklama</label>
              <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={2} className={cn(inp, 'h-auto py-2')} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Denetim kapsamı</label>
              <input value={kapsamT} onChange={(e) => setKapsamT(e.target.value)} placeholder="ör. Üretim alanı, depo, acil çıkışlar" className={inp} />
            </div>
          </div>
        </div>
      )}

      {/* Adım 1 — Şablon seçimi */}
      {adim === 1 && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-medium">Kontrol listeleri *</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Birden fazla liste seçilebilir — maddeler denetime sürüm snapshot'ı olarak kopyalanır.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {aktifSablonlar.map((s) => {
                const secili = sablonIds.includes(s.id)
                const n = s.kategoriler.reduce((a, k) => a + k.maddeler.length, 0)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSablonIds((l) => (secili ? l.filter((x) => x !== s.id) : [...l, s.id]))}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
                      secili ? 'border-amber-500/50 bg-amber-500/5' : 'hover:border-foreground/20',
                    )}
                  >
                    <span className={cn('mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded border', secili ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-input')}>
                      {secili && <CheckIcon className="size-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{s.ad}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{s.aciklama}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">v{s.surum} · {s.kategoriler.length} kategori · {n} madde</span>
                    </span>
                  </button>
                )
              })}
            </div>
            {sablonIds.length > 0 && (
              <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs">
                <ListChecksIcon className="mr-1 inline size-3.5" />
                Toplam <b>{seciliMaddeler.length}</b> kontrol maddesi kopyalanacak
                ({seciliMaddeler.filter((m) => m.zorunlu).length} zorunlu, {seciliMaddeler.filter((m) => m.fotografGerekli).length} fotoğraf gerekli).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Adım 2 — Ekip & hazırlık */}
      {adim === 2 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-medium">Denetim ekibi</h2>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <span className="text-sm font-medium">{uzman ? adSoyad(uzman) : '—'}</span>
              <span className="text-xs text-muted-foreground">Sorumlu Uzman</span>
            </div>
            {katilimcilar.map((k, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-sm">{k.ad}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{k.rol}</span>
                  <button type="button" onClick={() => setKatilimcilar((l) => l.filter((_, x) => x !== i))} aria-label="Kaldır" className="text-muted-foreground hover:text-foreground"><XIcon className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={yeniKat} onChange={(e) => setYeniKat(e.target.value)} placeholder="Katılımcı adı" className={cn(inp, 'flex-1')} list="kat-aday" />
            <datalist id="kat-aday">
              {firmaId && personeller.filter((p) => p.firmaId === firmaId && p.durum === 'Aktif').map((p) => <option key={p.id} value={`${p.ad} ${p.soyad}`} />)}
              {uyeler.filter((u) => u.durum === 'Aktif' && u.id !== uzmanId).map((u) => <option key={u.id} value={adSoyad(u)} />)}
            </datalist>
            <select value={yeniKatRol} onChange={(e) => setYeniKatRol(e.target.value as KatilimciRol)} className={cn(inp, 'w-40')}>
              {KATILIMCI_ROLLER.filter((r) => r !== 'Sorumlu Uzman').map((r) => <option key={r}>{r}</option>)}
            </select>
            <Button
              variant="outline"
              size="sm"
              disabled={!yeniKat.trim()}
              onClick={() => { setKatilimcilar((l) => [...l, { ad: yeniKat.trim(), rol: yeniKatRol }]); setYeniKat('') }}
            >
              Ekle
            </Button>
          </div>
          <div className="mt-4">
            <label className={lbl}>Denetim öncesi notlar / kontrol edilecek özel alanlar</label>
            <textarea value={hazirlik} onChange={(e) => setHazirlik(e.target.value)} rows={3} placeholder="ör. Gece vardiyası kayıtları, forklift operatör sertifikaları…" className={cn(inp, 'h-auto py-2')} />
          </div>
        </div>
      )}

      {/* Adım 3 — Özet */}
      {adim === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 text-sm font-medium">Denetim özeti</h2>
            <dl className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
              <Ozet t="Başlık" v={baslik} />
              <Ozet t="Firma" v={firma?.unvan ?? ''} />
              <Ozet t="Lokasyon" v={lokasyon || firma?.adres || '—'} />
              <Ozet t="Tür" v={tur?.ad ?? ''} />
              <Ozet t="Planlanan" v={`${tarih ? formatKisa(tarih) : '—'}${saat ? ` ${saat}` : ''}`} />
              <Ozet t="Sorumlu uzman" v={uzman ? adSoyad(uzman) : '—'} />
              <Ozet t="Kontrol listeleri" v={aktifSablonlar.filter((s) => sablonIds.includes(s.id)).map((s) => s.ad).join(', ') || '—'} />
              <Ozet t="Kontrol maddesi" v={`${seciliMaddeler.length} (${seciliMaddeler.filter((m) => m.zorunlu).length} zorunlu)`} />
              {kapsamT && <Ozet t="Kapsam" v={kapsamT} />}
              {hazirlik && <Ozet t="Hazırlık notları" v={hazirlik} />}
            </dl>
            <div className="mt-3 border-t pt-3">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Katılımcılar</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{uzman ? adSoyad(uzman) : ''} · Sorumlu</span>
                {katilimcilar.map((k, i) => <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs">{k.ad} · {k.rol}</span>)}
              </div>
            </div>
          </div>
          {cakisma.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangleIcon className="size-3.5 shrink-0" /> Çakışma uyarısı: uzman aynı gün {cakisma.length} denetimde daha görevli.
            </div>
          )}
        </div>
      )}
          </div>

      {/* Alt navigasyon */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" disabled={adim === 0} onClick={() => setAdim((a) => a - 1)}>
          <ArrowLeftIcon /> Geri
        </Button>
        <div className="flex items-center gap-2">
          {adim === 3 && (
            <>
              <Button variant="outline" size="sm" onClick={() => olustur(false)}><SaveIcon /> Taslak Kaydet</Button>
              <Button size="sm" onClick={() => olustur(true)}><CalendarCheckIcon /> Planla</Button>
            </>
          )}
          {adim < 3 && (
            <Button
              size="sm"
              disabled={(adim === 0 && !adim0Ok) || (adim === 1 && !adim1Ok)}
              onClick={() => setAdim((a) => a + 1)}
            >
              İleri <ArrowRightIcon />
            </Button>
          )}
        </div>
      </div>
        </section>
      </div>
    </div>
  )
}

function Ozet({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted-foreground">{t}</dt>
      <dd className="min-w-0 text-right text-sm">{v}</dd>
    </div>
  )
}
