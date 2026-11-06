import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  ArrowLeftIcon,
  AwardIcon,
  CheckCircle2Icon,
  ClockIcon,
  GraduationCapIcon,
  HistoryIcon,
  KeyRoundIcon,
  MailPlusIcon,
  MonitorSmartphoneIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  durumRenk,
  ilerlemedenKisi,
  kisiDurumRenk,
  tcMaske,
} from '@/data/personeller'
import { cn } from '@/lib/utils'
import { personelAd, usePersonelStore } from '@/stores/personeller-store'
import { useAuthStore } from '@/stores/auth-store'
import { sifreHashle } from '@/lib/sifre'
import { rastgeleSifreUret } from '@/lib/kullanici-adi'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { TODAY } from '@/data/dashboard'

const Satir = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b py-2.5 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-right text-sm">{children}</span>
  </div>
)

const SEKMELER = [
  { id: 'genel', label: 'Genel Bakış', ikon: UserIcon },
  { id: 'kisisel', label: 'Kişisel Bilgiler', ikon: ShieldCheckIcon },
  { id: 'egitim', label: 'Eğitimler', ikon: GraduationCapIcon },
  { id: 'hesap', label: 'Kullanıcı Hesabı', ikon: KeyRoundIcon },
  { id: 'sertifika', label: 'Sertifikalar', ikon: AwardIcon },
  { id: 'gecmis', label: 'İşlem Geçmişi', ikon: HistoryIcon },
] as const

export default function PersonelDetayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { personeller, hesaplar, atamalar, hesapOlustur, hesapGuncelle, davetYenile, oturumKapat, kullaniciAlinmi, sifreSifirla, hesapOnayla, hesapReddet } = usePersonelStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const { egitimler, ilerlemeler } = useEgitimlerStore()
  const [sekme, setSekme] = useState<string>(params.get('sekme') ?? 'genel')
  const [hesapForm, setHesapForm] = useState<{ kullaniciAdi: string; mod: 'davet' | 'sifre' } | null>(null)
  const [sifreOnayAcik, setSifreOnayAcik] = useState(false)
  const [sifreSonuc, setSifreSonuc] = useState<string | null>(null)
  const kullanici = useAuthStore((s) => s.user)?.name ?? 'Yönetici'

  const p = personeller.find((x) => x.id === id)
  const atms = useMemo(
    () => (p ? atamalar.filter((a) => a.durum !== 'İptal' && a.personelIds.includes(p.id)) : []),
    [atamalar, p],
  )

  if (!p)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Personel bulunamadı</p>
        <Button variant="outline" onClick={() => navigate('/panel/personeller')}><ArrowLeftIcon /> Listeye dön</Button>
      </div>
    )

  const hesap = hesaplar.find((h) => h.personelId === p.id && h.durum !== 'Pasif')
  const firma = firmalar.find((f) => f.id === p.firmaId)
  const ilOf = (a: (typeof atms)[0]) =>
    ilerlemeler.find((i) => i.hesapId === p.id && i.atamaId === a.id)
  const tamamlanan = atms.filter((a) => ilOf(a)?.durum === 'Tamamlandı').length
  const yaklasanlar = atms.filter((a) => a.durum === 'Aktif' && a.sonTarih >= TODAY && ilOf(a)?.durum !== 'Tamamlandı').sort((a, b) => a.sonTarih.localeCompare(b.sonTarih)).slice(0, 3)

  const hesapRenk = hesap
    ? ({ Aktif: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', 'Davet Bekliyor': 'bg-amber-500/10 text-amber-600 dark:text-amber-400', 'Onay Bekliyor': 'bg-amber-500/10 text-amber-600 dark:text-amber-400', 'Askıda': 'bg-red-500/10 text-red-500' } as Record<string, string>)[hesap.durum]
    : ''

  const hesapAc = () => {
    if (!hesapForm) return
    if (!hesapForm.kullaniciAdi.trim()) return toast.error('Kullanıcı adı zorunlu')
    if (kullaniciAlinmi(hesapForm.kullaniciAdi)) return toast.error('Kullanıcı adı alınmış')
    try {
      const h = hesapOlustur(p.id, hesapForm.kullaniciAdi, hesapForm.mod)
      if (hesapForm.mod === 'davet' && h.davetToken) {
        const link = `${location.origin}/davet/${h.davetToken}`
        navigator.clipboard?.writeText(link).catch(() => {})
        toast.success('Hesap oluşturuldu — davet bağlantısı panoya kopyalandı')
      } else toast.success('Hesap oluşturuldu')
      setHesapForm(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Hata')
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Üst */}
      <div className="border-b px-6 pt-5 pb-0">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/panel/personeller')}>
          <ArrowLeftIcon /> Personeller
        </Button>
        <div className="mt-3 flex items-center gap-4 pb-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-semibold text-white">
            {p.ad[0]}{p.soyad[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold">{personelAd(p)}</h1>
            <p className="text-sm text-muted-foreground">
              {firma?.unvan ?? p.firmaId} · {p.departman || 'Departman yok'} · {p.gorev || 'Görev belirtilmedi'}
            </p>
          </div>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', durumRenk[p.durum])}>{p.durum}</span>
          {hesap && <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', hesapRenk)}>@{hesap.kullaniciAdi} · {hesap.durum}</span>}
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {SEKMELER.map((s) => (
            <button key={s.id} type="button" onClick={() => setSekme(s.id)}
              className={cn('flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors', sekme === s.id ? 'border-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <s.ikon className="size-3.5" /> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 px-6 py-5">
        <div className="mx-auto max-w-4xl">
          {sekme === 'genel' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Eğitim Özeti</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/60 py-3"><p className="text-xl font-semibold tabular-nums">{atms.length}</p><p className="text-[11px] text-muted-foreground">Atama</p></div>
                  <div className="rounded-lg bg-muted/60 py-3"><p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{tamamlanan}</p><p className="text-[11px] text-muted-foreground">Tamamlanan</p></div>
                  <div className="rounded-lg bg-muted/60 py-3"><p className="text-xl font-semibold tabular-nums">{atms.length - tamamlanan}</p><p className="text-[11px] text-muted-foreground">Açık</p></div>
                </div>
                {yaklasanlar.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Yaklaşan son tarihler</p>
                    {yaklasanlar.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-xs">
                        <ClockIcon className="size-3.5 text-amber-500" />
                        <span className="min-w-0 flex-1 truncate">{egitimler.find((e) => e.id === a.egitimId)?.baslik}</span>
                        <span className="tabular-nums">{a.sonTarih}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Kayıt Bilgileri</h3>
                <div className="mt-2">
                  <Satir label="Firma">{firma?.unvan ?? p.firmaId}</Satir>
                  <Satir label="Firma geçmişi">{p.firmaGecmisi.length} kayıt</Satir>
                  <Satir label="Sicil no">{p.sicilNo || '—'}</Satir>
                  <Satir label="Kayıt tarihi">{p.olusturma}</Satir>
                  <Satir label="Son giriş">{hesap?.sonGiris ? new Date(hesap.sonGiris).toLocaleString('tr-TR') : 'Hiç giriş yok'}</Satir>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Eğitim tamamlanma</h3>
                  <span className="text-sm font-semibold tabular-nums">{atms.length ? Math.round((tamamlanan / atms.length) * 100) : 0}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${atms.length ? Math.round((tamamlanan / atms.length) * 100) : 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{atms.length} atamadan {tamamlanan} tanesi tamamlandı</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <h3 className="text-sm font-semibold">İletişim</h3>
                <div className="mt-2">
                  <Satir label="E-posta">{p.eposta || <span className="italic text-muted-foreground/70">Eklenmemiş</span>}</Satir>
                  <Satir label="Telefon">{p.telefon || <span className="italic text-muted-foreground/70">Eklenmemiş</span>}</Satir>
                </div>
              </div>
            </div>
          )}

          {sekme === 'kisisel' && (
            <div className="max-w-xl rounded-xl border bg-card p-4">
              <Satir label="Ad Soyad">{personelAd(p)}</Satir>
              <Satir label="TCKN"><span className="tabular-nums">{tcMaske(p.tc)}</span></Satir>
              <Satir label="E-posta">{p.eposta || '—'}</Satir>
              <Satir label="Telefon">{p.telefon || '—'}</Satir>
              <Satir label="Departman">{p.departman || '—'}</Satir>
              <Satir label="Görev">{p.gorev || '—'}</Satir>
              <p className="mt-3 text-[11px] text-muted-foreground">Hassas alanlar maskelenir — detay erişimi izne bağlıdır.</p>
            </div>
          )}

          {sekme === 'egitim' && (
            <div className="space-y-2">
              {atms.length === 0 && (
                <div className="rounded-xl border border-dashed py-10 text-center">
                  <GraduationCapIcon className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">Bu personele atanmış eğitim yok</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('/panel/egitim-atamalari')}>Atamalar sayfasına git</Button>
                </div>
              )}
              {atms.map((a) => {
                const eg = egitimler.find((e) => e.id === a.egitimId)
                const sv = eg?.surumler.find((s) => s.id === a.surumId)
                const il = ilOf(a)
                const kd = ilerlemedenKisi(il?.durum, a.sonTarih)
                const zorunlular = sv?.bolumler.flatMap((b) => b.icerikler).filter((i) => i.zorunlu) ?? []
                const tam = zorunlular.filter((i) => il?.icerikler[i.id]?.tamamlandi).length
                const yuzde = zorunlular.length ? Math.round((tam / zorunlular.length) * 100) : 0
                return (
                  <div key={a.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                    <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', eg?.kapakTon)}>
                      <GraduationCapIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{eg?.baslik}</p>
                      <p className="text-xs text-muted-foreground">
                        v{sv?.no ?? '?'} · Atama: {a.atamaTarihi} · Son: {a.sonTarih} · {a.zorunlu ? 'Zorunlu' : 'İsteğe bağlı'}
                      </p>
                      {il?.onSinav ? (
                        <details className="mt-1.5 text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Ön sınav: <b className="tabular-nums text-foreground">%{il.onSinav.puan}</b> · {il.onSinav.dogruSayisi}/{il.onSinav.toplam} doğru · {new Date(il.onSinav.tarih).toLocaleDateString('tr-TR')}
                          </summary>
                          <ol className="mt-2 space-y-1.5 border-l pl-3">
                            {(sv?.onSinav?.sorular ?? []).map((soru, qi) => {
                              const ok = il.onSinav?.soruSonuc[soru.id]
                              const secilen = (il.onSinav?.cevaplar[soru.id] ?? []).map((x) => soru.secenekler[x]).join(', ')
                              return (
                                <li key={soru.id} className="text-[11px]">
                                  <span className={ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{ok ? '✓' : '✗'}</span>{' '}
                                  {qi + 1}. {soru.soru}
                                  <span className="block text-muted-foreground">Yanıt: {secilen || '—'}</span>
                                </li>
                              )
                            })}
                          </ol>
                        </details>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-muted-foreground">Ön sınav yapılmadı</p>
                      )}
                      <div className="mt-1.5 h-1 w-48 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${yuzde}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', kisiDurumRenk[kd])}>{kd}</span>
                      <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">%{yuzde}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {sekme === 'hesap' && (
            <div className="max-w-xl space-y-4">
              {hesap ? (
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">@{hesap.kullaniciAdi}</h3>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', hesapRenk)}>{hesap.durum}</span>
                  </div>
                  <div className="mt-2">
                    <Satir label="E-posta">{hesap.eposta}</Satir>
                    <Satir label="Oluşturma">{hesap.olusturma}</Satir>
                    <Satir label="Son giriş">{hesap.sonGiris ? new Date(hesap.sonGiris).toLocaleString('tr-TR') : '—'}</Satir>
                    <Satir label="Davet bitiş">{hesap.davetBitis ? new Date(hesap.davetBitis).toLocaleString('tr-TR') : '—'}</Satir>
                    <Satir label="Şifre son değişim">{hesap.sifreDegisimTarihi ? new Date(hesap.sifreDegisimTarihi).toLocaleString('tr-TR') : 'Henüz belirlenmedi'}</Satir>
                    <Satir label="Şifre değişimi">{hesap.sifreDegisimZorunlu ? 'Zorunlu — ilk girişte değiştirilecek' : 'Gerekmiyor'}</Satir>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hesap.durum === 'Onay Bekliyor' && (
                      <div className="w-full rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                        <p className="font-medium">Firma hesap talebi — {hesap.hesapTalebi?.firma ?? 'Firma'}</p>
                        <p className="mt-1 text-muted-foreground">Talep {hesap.hesapTalebi?.tarih ?? '—'} tarihinde açıldı. Onaylanana kadar çalışan giriş yapamaz.</p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={() => { hesapOnayla(hesap.id, kullanici); toast.success('Hesap talebi onaylandı; çalışan giriş yapabilir') }}>Onayla</Button>
                          <Button size="sm" variant="outline" onClick={() => { hesapReddet(hesap.id, kullanici); toast('Hesap talebi reddedildi') }}>Reddet</Button>
                        </div>
                      </div>
                    )}
                    {hesap.durum === 'Davet Bekliyor' && (
                      <Button size="sm" variant="outline" onClick={() => { const t = davetYenile(hesap.id); navigator.clipboard?.writeText(`${location.origin}/davet/${t}`).catch(() => {}); toast.success('Yeni davet bağlantısı panoya kopyalandı') }}>
                        <MailPlusIcon /> Daveti yenile
                      </Button>
                    )}
                    {hesap.durum === 'Aktif' && (
                      <Button size="sm" variant="outline" onClick={() => { hesapGuncelle(hesap.id, { durum: 'Askıda' }); toast('Hesap askıya alındı — giriş engellendi') }}>
                        <PauseCircleIcon /> Askıya al
                      </Button>
                    )}
                    {hesap.durum === 'Askıda' && (
                      <Button size="sm" variant="outline" onClick={() => { hesapGuncelle(hesap.id, { durum: 'Aktif' }); toast.success('Hesap aktifleştirildi') }}>
                        <PlayCircleIcon /> Aktifleştir
                      </Button>
                    )}
                    {!sifreOnayAcik && !sifreSonuc && (
                      <Button size="sm" variant="outline" onClick={() => setSifreOnayAcik(true)}>
                        <KeyRoundIcon /> Şifreyi sıfırla
                      </Button>
                    )}
                  </div>
                  {sifreOnayAcik && (
                    <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs">
                      <p className="font-medium">Katılımcının mevcut şifresi geçersiz olacak ve açık oturumları kapanacak.</p>
                      <p className="mt-1 text-muted-foreground">Yeni geçici şifre oluşturulur; katılımcı ilk girişte kendi şifresini belirlemek zorunda kalır.</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="destructive" onClick={async () => {
                          const yeniSifre = rastgeleSifreUret()
                          sifreSifirla(hesap.id, await sifreHashle(yeniSifre), kullanici)
                          setSifreOnayAcik(false)
                          setSifreSonuc(yeniSifre)
                          toast.success('Geçici şifre oluşturuldu')
                        }}>Sıfırla</Button>
                        <Button size="sm" variant="ghost" onClick={() => setSifreOnayAcik(false)}>Vazgeç</Button>
                      </div>
                    </div>
                  )}
                  {sifreSonuc && (
                    <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                      <p className="font-medium">Geçici şifre</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="rounded bg-background px-2 py-1 font-mono text-sm">{sifreSonuc}</code>
                        <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard?.writeText(sifreSonuc); toast.success('Şifre panoya kopyalandı') }}>Kopyala</Button>
                      </div>
                      <p className="mt-2 text-muted-foreground">Bu şifre yalnızca şimdi gösterilir ve kaydedilmez. Katılımcıya iletin; ilk girişte değiştirecek.</p>
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => setSifreSonuc(null)}>Tamam</Button>
                    </div>
                  )}
                  {hesap.oturumlar.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <p className="text-xs font-medium">Aktif oturumlar</p>
                      {hesap.oturumlar.map((o) => (
                        <div key={o.id} className="mt-1.5 flex items-center gap-2 text-xs">
                          <MonitorSmartphoneIcon className="size-3.5 text-muted-foreground" />
                          <span className="flex-1">{o.cihaz} · {o.ip}</span>
                          <span className="text-muted-foreground">{new Date(o.tarih).toLocaleDateString('tr-TR')}</span>
                          <button type="button" className="text-destructive hover:underline" onClick={() => { oturumKapat(hesap.id, o.id); toast('Oturum sonlandırıldı') }}>Sonlandır</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <KeyRoundIcon className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm font-medium">Kullanıcı hesabı yok</p>
                  <p className="mt-1 text-xs text-muted-foreground">Personel kaydı hesaptan bağımsızdır — giriş için hesap oluşturun.</p>
                  <Button size="sm" className="mt-3" onClick={() => setHesapForm({ kullaniciAdi: `${p.ad}.${p.soyad}`.toLowerCase().replace(/[^a-z.]/g, ''), mod: 'davet' })}>
                    <MailPlusIcon /> Hesap Oluştur
                  </Button>
                </div>
              )}
              {hesapForm && (
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="text-sm font-semibold">Hesap Oluştur — {personelAd(p)}</h3>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Kullanıcı adı</label>
                      <input value={hesapForm.kullaniciAdi} onChange={(e) => setHesapForm({ ...hesapForm, kullaniciAdi: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([['davet', 'Davet bağlantısı gönder', 'Çalışan kendi şifresini belirler — önerilir', MailPlusIcon], ['sifre', 'Şifre belirle', 'Geçici şifre elle tanımlanır', KeyRoundIcon]] as const).map(([m, t, d, I]) => (
                        <button key={m} type="button" onClick={() => setHesapForm({ ...hesapForm, mod: m })} className={cn('flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors', hesapForm.mod === m ? 'border-amber-500/60 bg-amber-500/5' : 'hover:border-foreground/30')}>
                          <I className="mt-0.5 size-4 shrink-0" />
                          <span><span className="block text-sm font-medium">{t}</span><span className="mt-0.5 block text-xs text-muted-foreground">{d}</span></span>
                        </button>
                      ))}
                    </div>
                    {hesapForm.mod === 'sifre' && (
                      <p className="rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">Güvenlik: yönetici düz metin şifre göremez — geçici şifre davet yerine yalnızca gerektiğinde kullanılır ve saklanmaz.</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setHesapForm(null)}>Vazgeç</Button>
                      <Button size="sm" onClick={hesapAc}><CheckCircle2Icon /> Hesabı Oluştur</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {sekme === 'sertifika' && (
            <div className="rounded-xl border border-dashed py-14 text-center">
              <AwardIcon className="mx-auto size-9 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium">Henüz sertifika yok</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">Eğitim tamamlama sonrası otomatik belge üretimi sonraki aşamada eklenecek — altyapı hazır.</p>
            </div>
          )}

          {sekme === 'gecmis' && (
            <div className="max-w-xl space-y-0 rounded-xl border bg-card px-4">
              {p.islemGecmisi.map((g, i) => (
                <div key={i} className="flex items-center gap-3 border-b py-2.5 last:border-0">
                  <HistoryIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{g.islem}</p>
                    {g.detay && <p className="text-xs text-muted-foreground">{g.detay}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{new Date(g.tarih).toLocaleDateString('tr-TR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
