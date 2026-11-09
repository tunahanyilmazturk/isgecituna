import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  KeyRoundIcon,
  LinkIcon,
  MoreHorizontalIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Alan } from '@/components/form-bits'
import { selectCls } from '@/components/form-bits'
import { AyarBaslik } from '@/components/ayarlar/settings-bits'
import { adSoyad, hesapGorunenAd, type KullaniciHesap } from '@/data/ekip'
import { izinSayisi } from '@/lib/izin'
import { kapsamLabel } from '@/data/permissions'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const DURUM_ROL: Record<KullaniciHesap['durum'], string> = {
  Aktif: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Davet Bekliyor': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Pasif: 'bg-zinc-500/10 text-zinc-500',
  'Askıda': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

const fmtTarih = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/* ------------------------------ Davet formu ------------------------------ */

function DavetForm({ onKapat }: { onKapat: () => void }) {
  const { uyeler, hesaplar, hesapOlustur, logYaz } = useDavetDeps()
  const [ad, setAd] = useState('')
  const [eposta, setEposta] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [personelId, setPersonelId] = useState('')
  const [hata, setHata] = useState('')

  const personelsiz = uyeler.filter((u) => !hesaplar.some((h) => h.personelId === u.id))

  const gonder = () => {
    if (!eposta.includes('@')) return setHata('Geçerli bir e-posta adresi girin.')
    if (!kullaniciAdi.trim()) return setHata('Kullanıcı adı zorunlu.')
    if (hesaplar.some((h) => h.kullaniciAdi === kullaniciAdi.trim()))
      return setHata('Bu kullanıcı adı zaten kullanılıyor.')
    if (hesaplar.some((h) => h.eposta === eposta.trim()))
      return setHata('Bu e-posta adresi zaten kayıtlı.')
    const h = hesapOlustur({
      personelId: personelId || undefined,
      ad: ad.trim() || undefined,
      kullaniciAdi: kullaniciAdi.trim(),
      eposta: eposta.trim(),
      rol: 'İdari Personel',
      durum: 'Davet Bekliyor',
      davetTarihi: new Date().toISOString().slice(0, 10),
      izinler: [],
    })
    const token = useEkipStore.getState().davetYenile(h.id)
    logYaz(h, 'Kullanıcı daveti gönderildi')
    navigator.clipboard?.writeText(`${location.origin}/davet/${token}`).catch(() => {})
    toast.success(`Davet gönderildi: ${eposta}`, { description: 'Davet bağlantısı panoya kopyalandı.' })
    onKapat()
  }

  return (
    <div className="space-y-4 px-4 pb-4">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-[12px] text-muted-foreground">
        Davet bağlantısı <b>7 gün geçerli ve tek kullanımlıktır</b>. Kullanıcı kabul edince kendi
        şifresini belirler; hesap hiç izin olmadan açılır.
      </div>
      <Alan label="Personel kaydıyla ilişkilendir (opsiyonel)">
        <div className="relative">
          <select
            value={personelId}
            onChange={(e) => {
              setPersonelId(e.target.value)
              const p = uyeler.find((u) => u.id === e.target.value)
              if (p) {
                setAd(adSoyad(p))
                setEposta(p.eposta)
              }
            }}
            className={selectCls}
          >
            <option value="">İlişkilendirme — personel seçin…</option>
            {personelsiz.map((u) => (
              <option key={u.id} value={u.id}>
                {adSoyad(u)} · {u.gorev}
              </option>
            ))}
          </select>
          <KeyRoundIcon className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground opacity-0" />
        </div>
      </Alan>
      <div className="grid grid-cols-2 gap-3">
        <Alan label="Ad soyad">
          <Input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Kullanıcı adı" />
        </Alan>
        <Alan label="Kullanıcı adı">
          <Input value={kullaniciAdi} onChange={(e) => setKullaniciAdi(e.target.value)} placeholder="kullanici.adi" />
        </Alan>
      </div>
      <Alan label="E-posta adresi">
        <Input type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} placeholder="kullanici@firma.com" />
      </Alan>
      {hata && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{hata}</div>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onKapat}>Vazgeç</Button>
        <Button size="sm" onClick={gonder}>Davet Gönder</Button>
      </div>
    </div>
  )
}

function useDavetDeps() {
  const { uyeler, hesaplar, hesapOlustur } = useEkipStore()
  const { logEkle } = useAyarlarStore()
  const { user } = useAuthStore()
  return {
    uyeler,
    hesaplar,
    hesapOlustur,
    logYaz: (h: KullaniciHesap, islem: string) =>
      logEkle({ tarih: new Date().toISOString(), kullanici: user?.username ?? 'sistem', islem, kayit: `${h.kullaniciAdi} · ${h.eposta}` }),
  }
}

/* ------------------------------- Detay drawer ---------------------------- */

function KullaniciDetay({ hesap }: { hesap: KullaniciHesap }) {
  const navigate = useNavigate()
  const { uyeler } = useEkipStore()
  const { oturumlar, oturumSonlandir, hesapOturumlariSonlandir, loglar } = useAyarlarStore()
  const [sekme, setSekme] = useState<'profil' | 'izinler' | 'kapsam' | 'oturumlar' | 'gecmis'>('profil')
  const personel = uyeler.find((u) => u.id === hesap.personelId)
  const hesapOturumlar = oturumlar.filter((o) => o.hesapId === hesap.id)
  const hesapLoglar = loglar.filter((l) => l.kayit.includes(hesap.kullaniciAdi) || l.kullanici === hesap.kullaniciAdi)
  const izSayisi = izinSayisi(hesap)

  return (
    <SheetContent className="w-full sm:max-w-xl">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-zinc-800 text-[12px] font-bold text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900">
            {hesapGorunenAd(hesap, uyeler).split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <span>
            <span className="block">{hesapGorunenAd(hesap, uyeler)}</span>
            <span className="block text-[12px] font-normal text-muted-foreground">@{hesap.kullaniciAdi} · {hesap.eposta}</span>
          </span>
        </SheetTitle>
        <SheetDescription className="flex items-center gap-2">
          <Badge variant="secondary" className={cn('text-[10.5px]', DURUM_ROL[hesap.durum])}>{hesap.durum}</Badge>
          <span className="text-[11px] text-muted-foreground">
            {izSayisi === Infinity ? 'Tüm izinler' : `${izSayisi} izin`} · Son giriş: {fmtTarih(hesap.sonGiris)}
          </span>
        </SheetDescription>
      </SheetHeader>

      <div className="flex gap-1 border-b px-4">
        {([
          ['profil', 'Profil'],
          ['izinler', 'İzinler'],
          ['kapsam', 'Erişim Kapsamı'],
          ['oturumlar', 'Oturumlar'],
          ['gecmis', 'Geçmiş'],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSekme(k)}
            className={cn(
              'border-b-2 px-3 py-2 text-[12px] font-medium transition-colors',
              sekme === k ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sekme === 'profil' && (
          <div className="space-y-3 text-[12.5px]">
            {[
              ['Kullanıcı adı', `@${hesap.kullaniciAdi}`],
              ['E-posta', hesap.eposta],
              ['Bağlı personel', personel ? `${adSoyad(personel)} · ${personel.gorev}` : 'Bağlı personel yok'],
              ['Hesap durumu', hesap.durum],
              ['Son giriş', fmtTarih(hesap.sonGiris)],
              ['Son aktiflik', fmtTarih(hesap.sonAktiflik)],
              ['Davet tarihi', hesap.davetTarihi ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
            {personel && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/panel/ekip/${personel.id}`)}>
                Personel kaydına git
              </Button>
            )}
          </div>
        )}

        {sekme === 'izinler' && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-[12px] text-muted-foreground">
              Bu kullanıcının <b className="text-foreground">{izSayisi === Infinity ? 'tüm izinleri' : `${izSayisi} izni`}</b> var.
              İzinler kullanıcıya özeldir; sabit rol yoktur.
            </div>
            <Button size="sm" onClick={() => navigate(`/panel/ayarlar/izinler?hesap=${hesap.id}`)}>
              <KeyRoundIcon className="size-3.5" /> İzinleri düzenle
            </Button>
          </div>
        )}

        {sekme === 'kapsam' && (
          <div className="space-y-2 text-[12.5px]">
            <div className="rounded-lg border bg-muted/30 p-3 text-[12px] text-muted-foreground">
              Modül bazlı kayıt erişim kapsamı — hangi firmaların verisini görebileceğini belirler.
            </div>
            {Object.entries(hesap.kapsam ?? {}).length === 0 && (
              <div className="text-muted-foreground">Varsayılan: tüm modüllerde tam erişim.</div>
            )}
            {Object.entries(hesap.kapsam ?? {}).map(([modul, k]) => (
              <div key={modul} className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">{modul}</span>
                <span className="font-medium">{kapsamLabel(k)}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => navigate(`/panel/ayarlar/izinler?hesap=${hesap.id}`)}>
              Kapsamı düzenle
            </Button>
          </div>
        )}

        {sekme === 'oturumlar' && (
          <div className="space-y-2">
            {hesapOturumlar.length === 0 && <div className="text-[12.5px] text-muted-foreground">Kayıtlı oturum yok.</div>}
            {hesapOturumlar.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <div className="text-[12.5px] font-medium">{o.cihaz} · {o.tarayici}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {o.ip} · {o.konum} · {o.aktif ? `Son aktiflik ${fmtTarih(o.sonAktiflik)}` : 'Sonlandırıldı'}
                  </div>
                </div>
                {o.aktif ? (
                  <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => oturumSonlandir(o.id)}>
                    Sonlandır
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Kapalı</Badge>
                )}
              </div>
            ))}
            {hesapOturumlar.some((o) => o.aktif) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  hesapOturumlariSonlandir(hesap.id)
                  toast.success('Tüm oturumlar sonlandırıldı')
                }}
              >
                Tüm oturumları sonlandır
              </Button>
            )}
          </div>
        )}

        {sekme === 'gecmis' && (
          <div className="space-y-0">
            {hesapLoglar.length === 0 && <div className="text-[12.5px] text-muted-foreground">Kayıtlı işlem yok.</div>}
            {hesapLoglar.map((l) => (
              <div key={l.id} className="border-b border-border/50 py-2">
                <div className="text-[12.5px] font-medium">{l.islem}</div>
                <div className="text-[11px] text-muted-foreground">
                  {fmtTarih(l.tarih)} · {l.kayit}
                  {l.eski && l.yeni ? ` · ${l.eski} → ${l.yeni}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SheetContent>
  )
}

/* --------------------------------- Sayfa --------------------------------- */

export default function KullanicilarPage() {
  const navigate = useNavigate()
  const { uyeler, hesaplar, hesapDurumById, davetYenile } = useEkipStore()
  const { hesapOturumlariSonlandir, logEkle } = useAyarlarStore()
  const { user } = useAuthStore()
  const [ara, setAra] = useState('')
  const [davetAcik, setDavetAcik] = useState(false)
  const [detay, setDetay] = useState<KullaniciHesap | null>(null)

  const log = (islem: string, h: KullaniciHesap, extra?: Partial<Parameters<typeof logEkle>[0]>) =>
    logEkle({ tarih: new Date().toISOString(), kullanici: user?.username ?? 'sistem', islem, kayit: `${h.kullaniciAdi} · ${h.eposta}`, ...extra })

  const liste = useMemo(
    () =>
      hesaplar.filter((h) => {
        const q = ara.toLowerCase()
        return !q || hesapGorunenAd(h, uyeler).toLowerCase().includes(q) || h.eposta.includes(q) || h.kullaniciAdi.includes(q)
      }),
    [hesaplar, uyeler, ara],
  )

  const aksiyonlar = (h: KullaniciHesap) => (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem onClick={() => setDetay(h)}>
        <ShieldCheckIcon className="size-3.5" /> Hesap detayı
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate(`/panel/ayarlar/izinler?hesap=${h.id}`)}>
        <KeyRoundIcon className="size-3.5" /> İzinleri düzenle
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          const token = davetYenile(h.id)
          navigator.clipboard?.writeText(`${location.origin}/davet/${token}`).catch(() => {})
          log('Davet bağlantısı yenilendi', h)
          toast.success('Yeni davet bağlantısı oluşturuldu ve panoya kopyalandı')
        }}
      >
        <LinkIcon className="size-3.5" /> Davet bağlantısı yenile
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          const token = davetYenile(h.id)
          navigator.clipboard?.writeText(`${location.origin}/sifre-sifirla/${token}`).catch(() => {})
          log('Şifre sıfırlama bağlantısı gönderildi', h)
          toast.success('Şifre sıfırlama bağlantısı gönderildi')
        }}
      >
        Şifre sıfırlama bağlantısı gönder
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          hesapOturumlariSonlandir(h.id)
          log('Aktif oturumlar sonlandırıldı', h)
          toast.success('Aktif oturumlar sonlandırıldı')
        }}
      >
        Oturumları sonlandır
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {h.durum === 'Pasif' || h.durum === 'Askıda' ? (
        <DropdownMenuItem
          onClick={() => {
            hesapDurumById(h.id, 'Aktif')
            log('Hesap aktifleştirildi', h, { eski: h.durum, yeni: 'Aktif' })
            toast.success('Hesap aktifleştirildi')
          }}
        >
          Hesabı aktifleştir
        </DropdownMenuItem>
      ) : h.durum === 'Aktif' ? (
        <DropdownMenuItem
          onClick={() => {
            hesapDurumById(h.id, 'Askıda')
            hesapOturumlariSonlandir(h.id)
            log('Hesap askıya alındı', h, { eski: h.durum, yeni: 'Askıda' })
            toast.success('Hesap askıya alındı, oturumları kapatıldı')
          }}
        >
          Geçici olarak askıya al
        </DropdownMenuItem>
      ) : null}
      {h.durum !== 'Pasif' && (
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            hesapDurumById(h.id, 'Pasif')
            hesapOturumlariSonlandir(h.id)
            log('Hesap pasife alındı', h, { eski: h.durum, yeni: 'Pasif' })
            toast.success('Hesap pasife alındı — geçmiş kayıtlar korundu')
          }}
        >
          Kullanıcıyı pasife al
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AyarBaslik
        baslik="Kullanıcı Yönetimi"
        aciklama="Sisteme giriş yapabilen hesaplar. Personel kaydıyla ilişki opsiyoneldir; izinler kullanıcı bazlıdır."
        aksiyon={
          <Button size="sm" onClick={() => setDavetAcik(true)}>
            <UserPlusIcon className="size-3.5" /> Kullanıcı Davet Et
          </Button>
        }
      />

      <div className="flex items-center gap-2 border-t px-6 py-3">
        <div className="relative w-72">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Kullanıcı ara…" className="h-8 pl-8" />
        </div>
        <span className="ml-auto text-[11px] text-muted-foreground">{liste.length} hesap</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-t">
        <table className="w-full text-[12.5px]">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b text-left text-[11px] text-muted-foreground">
              {['Kullanıcı', 'E-posta', 'Bağlı personel', 'Durum', 'Son giriş', 'İzin', ''].map((h) => (
                <th key={h} className="px-4 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liste.map((h) => {
              const personel = uyeler.find((u) => u.id === h.personelId)
              const ad = hesapGorunenAd(h, uyeler)
              const n = izinSayisi(h)
              return (
                <tr key={h.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => setDetay(h)} className="flex items-center gap-2.5 text-left">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900">
                        {ad.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        <span className="block font-medium">{ad}</span>
                        <span className="block text-[10.5px] text-muted-foreground">@{h.kullaniciAdi}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{h.eposta}</td>
                  <td className="px-4 py-2">
                    {personel ? (
                      <Link to={`/panel/ekip/${personel.id}`} className="text-[12px] font-medium text-blue-600 hover:underline dark:text-blue-400">
                        {adSoyad(personel)}
                      </Link>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Bağlı değil</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="secondary" className={cn('text-[10.5px]', DURUM_ROL[h.durum])}>{h.durum}</Badge>
                  </td>
                  <td className="px-4 py-2 text-[11.5px] text-muted-foreground">{fmtTarih(h.sonGiris)}</td>
                  <td className="px-4 py-2 text-[11.5px] text-muted-foreground">
                    {n === Infinity ? 'Tümü' : `${n} izin`}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
                        <MoreHorizontalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      {aksiyonlar(h)}
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
            {liste.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Kullanıcı bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={davetAcik} onOpenChange={setDavetAcik}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Kullanıcı Davet Et</SheetTitle>
            <SheetDescription>E-posta ile davet gönderilir; kullanıcı kendi şifresini belirler.</SheetDescription>
          </SheetHeader>
          <DavetForm onKapat={() => setDavetAcik(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={!!detay} onOpenChange={(o) => !o && setDetay(null)}>
        {detay && <KullaniciDetay hesap={detay} />}
      </Sheet>
    </div>
  )
}
