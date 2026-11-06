import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  Building2Icon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ClockIcon,
  FileDownIcon,
  FileTextIcon,
  HistoryIcon,
  PlusIcon,
  SendIcon,
  ShieldAlertIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/dashboard'
import {
  AKSIYON_ONCELIKLER,
  aksiyonDurumRenk,
  aksiyonGecikmis,
  aksiyonAcik,
  guncelDurum,
  oncelikRenk,
  puanHesap,
  riskDurumRenk,
  seviyeHesap,
  seviyeRenk,
  RISK_SEVIYELERI,
  type AksiyonOncelik,
  type RiskTehlike,
} from '@/data/risk'
import { riskPdfIndir, aksiyonPdfIndir } from '@/lib/risk-pdf'
import { useRiskStore, type TehlikeKayit } from '@/stores/risk-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { adSoyad, hesapGorunenAd } from '@/data/ekip'
import { useIzin } from '@/lib/izin'
import { kapsamdaMi, useRiskKapsam } from '@/lib/risk-kapsam'

const SEKMELER = ['Genel Bakış', 'Tehlikeler ve Riskler', 'Aksiyonlar', 'Dokümanlar', 'Geçmiş'] as const
type Sekme = (typeof SEKMELER)[number]

const inputCls = 'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30'
const areaCls = 'w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

function Bilgi({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{l}</p>
      <p className="mt-0.5 text-sm font-medium">{v ?? '—'}</p>
    </div>
  )
}

export default function RiskDetayPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { degerlendirmeler, tehlikeler, aksiyonlar, yontemler, incelemeGonder, onayla, revizeIste, taslagaAl, revizeEt, tehlikeEkle, tehlikeGuncelle, tehlikeSil, aksiyonEkle, aksiyonDurum } = useRiskStore()
  const personeller = usePersonelStore((s) => s.personeller)
  const { uyeler, hesaplar } = useEkipStore()
  const user = useAuthStore((s) => s.user)
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.username ?? 'Kullanıcı')
  const duzenleIzni = useIzin('risk.duzenle')
  const onayIzni = useIzin('risk.onayla')
  const pdfIzni = useIzin('risk.pdf')
  const kapsam = useRiskKapsam()

  const d = degerlendirmeler.find((x) => x.id === id)
  const kapsamUygun = d ? kapsamdaMi(kapsam, d.firmaId) && (!kapsam.sadeceKendi || d.olusturan === kapsam.kullanici) : false
  const [sekme, setSekme] = useState<Sekme>('Genel Bakış')
  const [thModal, setThModal] = useState<false | 'yeni' | string>(false)
  const [akForm, setAkForm] = useState(false)
  const [revizeModal, setRevizeModal] = useState(false)
  const [revizeNot, setRevizeNot] = useState('')
  const [tf, setTf] = useState<TehlikeKayit>({ bolum: '', faaliyet: '', kaynak: '', aciklama: '', olasiRisk: '', etkilenenler: '', mevcutOnlemler: '', olasiSonuclar: '', yontemId: 'YM-L5x5', olasilik: 3, siddet: 3, ekOnlemler: '' })
  const [af, setAf] = useState({ baslik: '', tehlikeId: '', sorumluId: '', oncelik: 'Orta' as AksiyonOncelik, hedefTarih: '', aciklama: '' })

  const thListe = useMemo(() => tehlikeler.filter((t) => t.degerlendirmeId === id && !t.silindi), [tehlikeler, id])
  const akListe = useMemo(() => aksiyonlar.filter((a) => a.degerlendirmeId === id), [aksiyonlar, id])

  if (!d || !kapsamUygun) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{!d ? 'Değerlendirme bulunamadı.' : 'Bu değerlendirmeyi görüntüleme yetkiniz yok.'}</p>
        <Button variant="outline" size="sm" onClick={() => nav('/panel/risk')}>Listeye dön</Button>
      </div>
    )
  }

  const gu = guncelDurum(d)
  const yontem = yontemler.find((y) => y.id === d.yontemId)
  const sevSayi = RISK_SEVIYELERI.map((s) => ({ seviye: s, adet: thListe.filter((t) => t.seviye === s).length }))
  const acikAk = akListe.filter(aksiyonAcik)

  /* Tehlike formu */
  const thFormAc = (t?: RiskTehlike) => {
    if (t) {
      const { silindi: _s, puan: _p, seviye: _sv, id: _i, degerlendirmeId: _d, ...kayit } = t
      setTf(kayit)
      setThModal(t.id)
    } else {
      setTf({ bolum: '', faaliyet: '', kaynak: '', aciklama: '', olasiRisk: '', etkilenenler: '', mevcutOnlemler: '', olasiSonuclar: '', yontemId: d.yontemId, olasilik: 3, siddet: 3, ekOnlemler: '' })
      setThModal('yeni')
    }
  }

  /* Aksiyon formu */
  const sorumlular = [
    ...personeller.filter((p) => p.firmaId === d.firmaId && p.durum === 'Aktif').map((p) => ({ id: p.id, ad: `${p.ad} ${p.soyad}` })),
    ...uyeler.map((u) => ({ id: u.id, ad: adSoyad(u) })),
  ]

  const thKaydet = () => {
    if (!tf.bolum.trim() || !tf.kaynak.trim()) { toast.error('Bölüm ve tehlike kaynağı zorunlu'); return }
    if (thModal === 'yeni') {
      tehlikeEkle(d.id, tf, kullanici)
      toast.success('Tehlike eklendi')
    } else if (typeof thModal === 'string') {
      tehlikeGuncelle(thModal, tf, kullanici)
      toast.success('Tehlike güncellendi')
    }
    setThModal(false)
  }

  const akKaydet = () => {
    if (!af.baslik.trim() || !af.sorumluId || !af.hedefTarih) { toast.error('Başlık, sorumlu ve hedef tarih zorunlu'); return }
    const s = sorumlular.find((x) => x.id === af.sorumluId)
    aksiyonEkle(
      {
        degerlendirmeId: d.id,
        tehlikeId: af.tehlikeId || undefined,
        firmaId: d.firmaId,
        firmaAd: d.firmaAd,
        baslik: af.baslik.trim(),
        aciklama: af.aciklama || undefined,
        sorumluId: af.sorumluId,
        sorumluAd: s?.ad ?? '',
        oncelik: af.oncelik,
        baslangicTarihi: TODAY,
        hedefTarih: af.hedefTarih,
        olusturan: kullanici,
      },
      kullanici,
    )
    toast.success('Aksiyon eklendi')
    setAkForm(false)
    setAf({ baslik: '', tehlikeId: '', sorumluId: '', oncelik: 'Orta', hedefTarih: '', aciklama: '' })
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      {/* Üst bölüm */}
      <div className="flex flex-wrap items-start gap-3">
        <button onClick={() => nav('/panel/risk')} className="mt-0.5 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
          <ChevronLeftIcon className="size-4" />
        </button>
        <div className="mr-auto min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold">{d.ad}</h1>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', riskDurumRenk[gu])}>{gu}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">v{d.surum}</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2Icon className="size-3" /> {d.firmaAd} · {d.isyeriAd} · {d.degerlendirmeTarihi}
          </p>
        </div>
        {pdfIzni && (
          <Button variant="outline" size="sm" onClick={() => void riskPdfIndir(d).then(() => toast.success('PDF raporu indirildi')).catch(() => toast.error('PDF üretilemedi'))}>
            <FileDownIcon /> PDF Rapor
          </Button>
        )}
        {duzenleIzni && gu === 'Taslak' && (
          <Button size="sm" onClick={() => { incelemeGonder(d.id, kullanici); toast.success('İncelemeye gönderildi') }}>
            <SendIcon /> İncelemeye Gönder
          </Button>
        )}
        {onayIzni && (gu === 'İncelemede' || gu === 'Revize Edilmeli') && (
          <>
            <Button size="sm" onClick={() => { onayla(d.id, kullanici); toast.success('Değerlendirme onaylandı') }}>
              <CheckCircle2Icon /> Onayla
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRevizeModal(true)}>
              Revize İste
            </Button>
          </>
        )}
        {duzenleIzni && gu === 'Revize Edilmeli' && (
          <Button variant="outline" size="sm" onClick={() => { taslagaAl(d.id, kullanici); toast('Taslağa alındı') }}>
            Taslağa Al
          </Button>
        )}
        {duzenleIzni && gu === 'Onaylandı' && (
          <Button variant="outline" size="sm" onClick={() => setRevizeModal(true)}>
            <HistoryIcon /> Revize Et
          </Button>
        )}
      </div>

      {/* Sekmeler */}
      <div className="flex items-center gap-1 border-b">
        {SEKMELER.map((t) => (
          <button
            key={t}
            onClick={() => setSekme(t)}
            className={cn(
              'border-b-2 px-3 pb-2 text-sm font-medium whitespace-nowrap transition-colors',
              sekme === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
            {t === 'Aksiyonlar' && acikAk.length > 0 && <span className="ml-1.5 rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">{acikAk.length}</span>}
          </button>
        ))}
      </div>

      {/* ================= Genel Bakış ================= */}
      {sekme === 'Genel Bakış' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">İşyeri bilgileri</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
                <Bilgi l="Firma" v={d.firmaAd} />
                <Bilgi l="İşyeri" v={d.isyeriAd} />
                <Bilgi l="Adres" v={d.adres} />
                <Bilgi l="Tehlike sınıfı" v={d.tehlikeSinifi} />
                <Bilgi l="NACE" v={d.nace} />
                <Bilgi l="Faaliyet" v={d.faaliyet} />
                <Bilgi l="Çalışan sayısı" v={d.calisanSayisi} />
                <Bilgi l="İşveren" v={d.isveren} />
                <Bilgi l="İşveren vekili" v={d.isverenVekili} />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Değerlendirme özeti</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
                <Bilgi l="Yöntem" v={yontem?.ad} />
                <Bilgi l="Değerlendirme" v={d.degerlendirmeTarihi} />
                <Bilgi l="Yenileme" v={
                  <span className={gu === 'Süresi Doldu' ? 'text-red-500' : ''}>{d.yenilemeTarihi}</span>
                } />
                <Bilgi l="Son güncelleme" v={d.guncelleme} />
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Değerlendirme ekibi</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.ekip.map((u, i) => (
                    <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs">{u.adSoyad} <span className="text-muted-foreground">· {u.rol}</span></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Risk dağılımı</h2>
              <div className="space-y-2">
                {sevSayi.map((s) => (
                  <div key={s.seviye} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-sm" style={{ background: seviyeRenk[s.seviye].hex }} />
                    <span className="text-muted-foreground">{s.seviye}</span>
                    <div className="h-2 flex-1 rounded-full bg-muted/60">
                      <div className="h-full rounded-full" style={{ width: `${thListe.length ? (s.adet / thListe.length) * 100 : 0}%`, background: seviyeRenk[s.seviye].hex }} />
                    </div>
                    <span className="w-5 text-right font-medium tabular-nums">{s.adet}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Aksiyon özeti</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Toplam</span><span className="font-medium tabular-nums">{akListe.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Açık</span><span className="font-medium text-amber-600 tabular-nums dark:text-amber-400">{acikAk.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gecikmiş</span><span className="font-medium text-red-500 tabular-nums">{akListe.filter(aksiyonGecikmis).length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tamamlanan</span><span className="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">{akListe.filter((a) => a.durum === 'Tamamlandı').length}</span></div>
              </div>
            </div>
            {d.onaylar.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold">Onay kayıtları</h2>
                <div className="space-y-2">
                  {d.onaylar.map((o, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="mt-0.5 text-muted-foreground tabular-nums">{o.tarih.slice(0, 10)}</span>
                      <div>
                        <p className="font-medium">{o.islem}</p>
                        <p className="text-muted-foreground">{o.kullanici}{o.not ? ` — ${o.not}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= Tehlikeler ================= */}
      {sekme === 'Tehlikeler ve Riskler' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{thListe.length} tehlike kaydı — puan = olasılık × şiddet ({yontem?.ad})</p>
            {duzenleIzni && gu !== 'Onaylandı' && (
              <Button size="sm" variant="outline" onClick={() => thFormAc()}><PlusIcon /> Tehlike Ekle</Button>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:text-xs [&>th]:font-medium [&>th]:text-muted-foreground">
                  <th>Bölüm / Kaynak</th>
                  <th className="hidden lg:table-cell">Olası risk</th>
                  <th className="hidden xl:table-cell">Mevcut önlemler</th>
                  <th className="text-center">O×Ş</th>
                  <th className="text-center">Puan</th>
                  <th>Seviye</th>
                  <th className="text-center">Aksiyon</th>
                  {duzenleIzni && <th className="w-20" />}
                </tr>
              </thead>
              <tbody>
                {thListe.map((t) => {
                  const akAdet = akListe.filter((a) => a.tehlikeId === t.id).length
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 [&>td]:px-3 [&>td]:py-3">
                      <td>
                        <p className="font-medium">{t.kaynak}</p>
                        <p className="text-xs text-muted-foreground">{t.bolum} · {t.faaliyet}</p>
                      </td>
                      <td className="hidden max-w-52 text-xs text-muted-foreground lg:table-cell"><p className="line-clamp-2">{t.olasiRisk}</p></td>
                      <td className="hidden max-w-52 text-xs text-muted-foreground xl:table-cell"><p className="line-clamp-2">{t.mevcutOnlemler}</p></td>
                      <td className="text-center text-xs whitespace-nowrap text-muted-foreground tabular-nums">{t.olasilik} × {t.siddet}</td>
                      <td className="text-center"><span className={cn('inline-flex size-8 items-center justify-center rounded-lg text-sm font-bold tabular-nums', seviyeRenk[t.seviye].bg, seviyeRenk[t.seviye].text)}>{t.puan}</span></td>
                      <td><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', seviyeRenk[t.seviye].bg, seviyeRenk[t.seviye].text)}>{t.seviye}</span></td>
                      <td className="text-center tabular-nums">{akAdet}</td>
                      {duzenleIzni && (
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="xs" variant="ghost" onClick={() => thFormAc(t)}>Düzenle</Button>
                            {gu !== 'Onaylandı' && (
                              <button type="button" title="Kaldır (geçmiş korunur)" onClick={() => { tehlikeSil(t.id, kullanici); toast('Tehlike kaldırıldı — kayıt arşivlendi') }} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-red-500">
                                <Trash2Icon className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {thListe.length === 0 && (
                  <tr><td colSpan={8} className="py-14 text-center text-sm text-muted-foreground">Tehlike kaydı yok.{duzenleIzni && ' Sağ üstten ekleyin.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= Aksiyonlar ================= */}
      {sekme === 'Aksiyonlar' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{akListe.length} aksiyon · {acikAk.length} açık · {akListe.filter(aksiyonGecikmis).length} gecikmiş</p>
            {duzenleIzni && (
              <Button size="sm" variant="outline" onClick={() => setAkForm((v) => !v)}><PlusIcon /> Aksiyon Ekle</Button>
            )}
          </div>
          {akForm && (
            <div className="grid gap-2 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
              <input value={af.baslik} onChange={(e) => setAf({ ...af, baslik: e.target.value })} placeholder="Aksiyon başlığı *" className={cn(inputCls, 'lg:col-span-2')} />
              <select value={af.tehlikeId} onChange={(e) => setAf({ ...af, tehlikeId: e.target.value })} className={inputCls}>
                <option value="">İlgili tehlike (opsiyonel)</option>
                {thListe.map((t) => <option key={t.id} value={t.id}>{t.kaynak}</option>)}
              </select>
              <select value={af.sorumluId} onChange={(e) => setAf({ ...af, sorumluId: e.target.value })} className={inputCls}>
                <option value="">Sorumlu *</option>
                {sorumlular.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
              </select>
              <select value={af.oncelik} onChange={(e) => setAf({ ...af, oncelik: e.target.value as AksiyonOncelik })} className={inputCls}>
                {AKSIYON_ONCELIKLER.map((o) => <option key={o}>{o}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" value={af.hedefTarih} onChange={(e) => setAf({ ...af, hedefTarih: e.target.value })} className={inputCls} />
                <Button size="sm" className="h-8" onClick={akKaydet}>Ekle</Button>
              </div>
            </div>
          )}
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:text-xs [&>th]:font-medium [&>th]:text-muted-foreground">
                  <th>Aksiyon</th>
                  <th className="hidden lg:table-cell">İlgili tehlike</th>
                  <th>Sorumlu</th>
                  <th>Öncelik</th>
                  <th>Hedef</th>
                  <th>Durum</th>
                  {duzenleIzni && <th className="w-40" />}
                </tr>
              </thead>
              <tbody>
                {akListe.map((a) => {
                  const th = tehlikeler.find((t) => t.id === a.tehlikeId)
                  const gecikti = aksiyonGecikmis(a)
                  return (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 [&>td]:px-3 [&>td]:py-3">
                      <td>
                        <p className="font-medium">{a.baslik}</p>
                        <p className="text-xs text-muted-foreground">{a.tamamlanmaNotu ? `✓ ${a.tamamlanmaNotu.slice(0, 60)}` : a.aciklama?.slice(0, 60) ?? ''}</p>
                      </td>
                      <td className="hidden max-w-44 truncate text-xs text-muted-foreground lg:table-cell">{th?.kaynak ?? '—'}</td>
                      <td className="text-xs">{a.sorumluAd}</td>
                      <td><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', oncelikRenk[a.oncelik])}>{a.oncelik}</span></td>
                      <td className={cn('text-xs whitespace-nowrap', gecikti && 'font-semibold text-red-500')}>
                        {a.hedefTarih}{gecikti && <ClockIcon className="ml-1 inline size-3" />}
                      </td>
                      <td><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', aksiyonDurumRenk[a.durum])}>{a.durum}</span></td>
                      {duzenleIzni && (
                        <td className="text-right">
                          {aksiyonAcik(a) && a.durum !== 'Kontrol Bekliyor' && (
                            <Button size="xs" variant="ghost" onClick={() => aksiyonDurum(a.id, 'Devam Ediyor', kullanici)} disabled={a.durum === 'Devam Ediyor'}>Başlat</Button>
                          )}
                          {a.durum === 'Devam Ediyor' && (
                            <Button size="xs" variant="ghost" onClick={() => aksiyonDurum(a.id, 'Kontrol Bekliyor', kullanici)}>Kontrole Gönder</Button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {akListe.length === 0 && (
                  <tr><td colSpan={7} className="py-14 text-center text-sm text-muted-foreground">Bu değerlendirmeye bağlı aksiyon yok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= Dokümanlar ================= */}
      {sekme === 'Dokümanlar' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Raporlar</h2>
            <div className="space-y-2">
              <button
                disabled={!pdfIzni}
                onClick={() => void riskPdfIndir(d).then(() => toast.success('PDF indirildi'))}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
              >
                <FileTextIcon className="size-5 text-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">Risk Değerlendirme Raporu — v{d.surum}</p>
                  <p className="text-xs text-muted-foreground">Firma, ekip, tehlikeler, puanlar, önlemler ve imza alanları</p>
                </div>
                <FileDownIcon className="size-4 text-muted-foreground" />
              </button>
              <button
                disabled={!pdfIzni}
                onClick={() => void aksiyonPdfIndir(akListe, d.ad, d.firmaAd).then(() => toast.success('Aksiyon raporu indirildi'))}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
              >
                <FileTextIcon className="size-5 text-sky-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">Aksiyon Takip Raporu</p>
                  <p className="text-xs text-muted-foreground">{akListe.length} aksiyon — sorumlular, terminler, durumlar</p>
                </div>
                <FileDownIcon className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Revizyon geçmişi</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <ShieldAlertIcon className="size-4 text-emerald-500" />
                <div className="flex-1 text-sm"><span className="font-medium">Sürüm {d.surum}</span> — güncel ({gu})</div>
                <span className="text-xs text-muted-foreground">{d.guncelleme}</span>
              </div>
              {d.revizyonlar.map((r) => (
                <div key={r.surum} className="flex items-center gap-3 rounded-lg border p-3">
                  <HistoryIcon className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">Sürüm {r.surum} — {r.durum}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.sebep} · {r.tehlikeSayisi} tehlike · {r.aksiyonSayisi} aksiyon</p>
                  </div>
                  <span className="text-xs whitespace-nowrap text-muted-foreground">{r.tarih}</span>
                </div>
              ))}
              {d.revizyonlar.length === 0 && <p className="text-xs text-muted-foreground">Önceki sürüm yok — bu ilk yayın.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ================= Geçmiş ================= */}
      {sekme === 'Geçmiş' && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">İşlem geçmişi</h2>
          <div className="space-y-0">
            {[...d.gecmis].reverse().map((o, i) => (
              <div key={i} className="flex gap-3 border-l-2 border-border pb-4 pl-4 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{o.islem}</p>
                  <p className="text-xs text-muted-foreground">{o.tarih} · {o.kullanici}{o.not ? ` — ${o.not}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tehlike modalı */}
      {thModal !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setThModal(false)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-5 py-4">
              <h2 className="text-base font-semibold">{thModal === 'yeni' ? 'Tehlike Ekle' : 'Tehlikeyi Düzenle'}</h2>
            </div>
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Bölüm *</label><input value={tf.bolum} onChange={(e) => setTf({ ...tf, bolum: e.target.value })} className={inputCls} /></div>
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Faaliyet</label><input value={tf.faaliyet} onChange={(e) => setTf({ ...tf, faaliyet: e.target.value })} className={inputCls} /></div>
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Tehlike kaynağı *</label><input value={tf.kaynak} onChange={(e) => setTf({ ...tf, kaynak: e.target.value })} className={inputCls} /></div>
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Olası risk</label><input value={tf.olasiRisk} onChange={(e) => setTf({ ...tf, olasiRisk: e.target.value })} className={inputCls} /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-muted-foreground">Açıklama</label><textarea value={tf.aciklama} onChange={(e) => setTf({ ...tf, aciklama: e.target.value })} rows={2} className={areaCls} /></div>
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Etkilenen kişiler</label><input value={tf.etkilenenler} onChange={(e) => setTf({ ...tf, etkilenenler: e.target.value })} className={inputCls} /></div>
              <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Olası sonuçlar</label><input value={tf.olasiSonuclar} onChange={(e) => setTf({ ...tf, olasiSonuclar: e.target.value })} className={inputCls} /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-muted-foreground">Mevcut önlemler</label><textarea value={tf.mevcutOnlemler} onChange={(e) => setTf({ ...tf, mevcutOnlemler: e.target.value })} rows={2} className={areaCls} /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-muted-foreground">Alınması gereken ek önlemler</label><textarea value={tf.ekOnlemler} onChange={(e) => setTf({ ...tf, ekOnlemler: e.target.value })} rows={2} className={areaCls} /></div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Olasılık (1–5)</label>
                <div className="flex gap-1">{[1,2,3,4,5].map((n) => <button key={n} type="button" onClick={() => setTf({ ...tf, olasilik: n })} className={cn('size-8 rounded-lg border text-sm tabular-nums', tf.olasilik === n ? 'border-sky-500 bg-sky-500/10 text-sky-600' : 'text-muted-foreground')}>{n}</button>)}</div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Şiddet (1–5)</label>
                <div className="flex gap-1">{[1,2,3,4,5].map((n) => <button key={n} type="button" onClick={() => setTf({ ...tf, siddet: n })} className={cn('size-8 rounded-lg border text-sm tabular-nums', tf.siddet === n ? 'border-sky-500 bg-sky-500/10 text-sky-600' : 'text-muted-foreground')}>{n}</button>)}</div>
              </div>
              <div className={cn('flex w-fit items-center gap-2 rounded-lg px-3 py-2 sm:col-span-2', seviyeRenk[seviyeHesap(puanHesap(tf.olasilik, tf.siddet), d.esikler)].bg)}>
                <span className="font-bold tabular-nums">{puanHesap(tf.olasilik, tf.siddet)}</span>
                <span className="text-xs font-semibold">{seviyeHesap(puanHesap(tf.olasilik, tf.siddet), d.esikler)} risk</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Button variant="ghost" onClick={() => setThModal(false)}>Vazgeç</Button>
              <Button onClick={thKaydet} disabled={!tf.bolum.trim() || !tf.kaynak.trim()}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}

      {/* Revize modalı */}
      {revizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setRevizeModal(false)}>
          <div className="w-full max-w-md rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-5 py-4">
              <h2 className="text-base font-semibold">{gu === 'Onaylandı' ? 'Revizyon Başlat' : 'Revize İste'}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{gu === 'Onaylandı' ? `Sürüm ${d.surum + 1} taslak olarak açılır — mevcut sürüm özeti saklanır.` : 'Değerlendirme "Revize Edilmeli" durumuna geçer.'}</p>
            </div>
            <div className="px-5 py-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Revizyon nedeni</label>
              <textarea value={revizeNot} onChange={(e) => setRevizeNot(e.target.value)} rows={3} className={areaCls} placeholder="Örn: yeni bölüm eklendi, mevzuat değişikliği…" />
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Button variant="ghost" onClick={() => setRevizeModal(false)}>Vazgeç</Button>
              <Button
                disabled={!revizeNot.trim()}
                onClick={() => {
                  if (gu === 'Onaylandı') { revizeEt(d.id, kullanici, revizeNot.trim()); toast.success(`Sürüm ${d.surum + 1} taslak olarak açıldı`) }
                  else { revizeIste(d.id, kullanici, revizeNot.trim()); toast('Revize istendi') }
                  setRevizeModal(false); setRevizeNot('')
                }}
              >
                {gu === 'Onaylandı' ? 'Revizyonu Başlat' : 'Revize İste'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
