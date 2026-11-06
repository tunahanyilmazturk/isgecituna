import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AwardIcon,
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  DownloadIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  LogOutIcon,
  PlayIcon,
  RotateCwIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CipGrup } from '@/components/list-bits'
import { sifreHashle } from '@/data/ekip'
import { ilerlemedenKisi, kisiDurumRenk, type KisiDurum } from '@/data/personeller'
import { cn } from '@/lib/utils'
import { usePersonelStore } from '@/stores/personeller-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useAuthStore } from '@/stores/auth-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { sertifikaGuncelDurum, durumRenkSertifika } from '@/data/sertifikalar'
import { sertifikaPdfIndirV2 } from '@/lib/sertifika-render'
import { TODAY } from '@/data/dashboard'

/** Son tarihe kalan gün metni (ör. “3 gün kaldı”, “2 gün gecikti”). */
const kalanGunMetni = (tarih: string) => {
  const fark = Math.round((new Date(`${tarih}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86_400_000)
  if (!Number.isFinite(fark)) return ''
  if (fark < 0) return `${Math.abs(fark)} gün gecikti`
  if (fark === 0) return 'bugün son gün'
  return `${fark} gün kaldı`
}

/** Giriş yapan çalışanın personel kimliği — atamalar ve ilerleme buna bağlı */
const useBen = () => {
  const user = useAuthStore((s) => s.user)
  const personeller = usePersonelStore((s) => s.personeller)
  const p = personeller.find((x) => x.id === user?.personelId)
  return { user, p, pid: user?.personelId ?? '' }
}

const useAtamalarim = (pid: string) => {
  const atamalar = usePersonelStore((s) => s.atamalar)
  const { egitimler, ilerlemeler } = useEgitimlerStore()
  return useMemo(
    () =>
      atamalar
        .filter((a) => a.durum !== 'İptal' && a.personelIds.includes(pid))
        .map((a) => {
          const eg = egitimler.find((e) => e.id === a.egitimId)
          const sv = eg?.surumler.find((s) => s.id === a.surumId)
          const il = ilerlemeler.find((i) => i.hesapId === pid && i.atamaId === a.id)
          const kd = ilerlemedenKisi(il?.durum, a.sonTarih)
          const zorunlular = sv?.bolumler.flatMap((b) => b.icerikler).filter((i) => i.zorunlu) ?? []
          const tam = zorunlular.filter((i) => il?.icerikler[i.id]?.tamamlandi).length
          return { a, eg, sv, il, kd, yuzde: zorunlular.length ? Math.round((tam / zorunlular.length) * 100) : 0 }
        })
        .sort((x, y) => x.a.sonTarih.localeCompare(y.a.sonTarih)),
    [atamalar, egitimler, ilerlemeler, pid],
  )
}

/* =============================== Dashboard ============================== */

export function PortalDashboard() {
  const navigate = useNavigate()
  const { user, p, pid } = useBen()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const liste = useAtamalarim(pid)
  const say = (d: KisiDurum) => liste.filter((x) => x.kd === d).length
  const devam = liste.find((x) => x.kd === 'Devam Ediyor' || x.kd === 'Bekliyor' || x.kd === 'Gecikti')
  const yaklasan = liste.filter((x) => x.kd !== 'Tamamlandı').slice(0, 3)

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hoş geldin, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2Icon className="size-4" />
            {firmalar.find((f) => f.id === p?.firmaId)?.unvan ?? 'Firma bilgisi yok'} · {p?.departman || 'Departman belirtilmedi'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            [liste.length, 'Atanan Eğitim', GraduationCapIcon],
            [say('Tamamlandı'), 'Tamamlanan', CheckCircle2Icon],
            [say('Devam Ediyor'), 'Devam Eden', PlayIcon],
            [say('Bekliyor') + say('Gecikti'), 'Bekleyen', ClockIcon],
          ] as [number, string, typeof GraduationCapIcon][]
        ).map(([v, l, I]) => (
          <div key={l} className="rounded-2xl border bg-card p-4">
            <I className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-semibold tabular-nums">{v}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      {liste.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Genel ilerleme</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${Math.round((say('Tamamlandı') / liste.length) * 100)}%` }} />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">%{Math.round((say('Tamamlandı') / liste.length) * 100)}</span>
        </div>
      )}

      {liste.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed py-14 text-center">
          <GraduationCapIcon className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">Henüz size atanmış bir eğitim yok</p>
          <p className="mt-1 text-xs text-muted-foreground">Atamalar yapıldığında eğitimleriniz burada görünecek.</p>
        </div>
      )}

      {liste.length > 0 && !devam && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <CheckCircle2Icon className="size-6 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold">Tüm atanan eğitimleri tamamladınız</p>
            <p className="text-xs text-muted-foreground">Belgelerinizi “Sertifikalarım” sayfasından görüntüleyebilirsiniz.</p>
          </div>
        </div>
      )}

      {devam && (
        <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
          <div className={cn('relative overflow-hidden bg-gradient-to-br px-6 py-5 text-white', devam.eg?.kapakTon)}>
            {devam.eg?.kapakGorsel && <img src={devam.eg.kapakGorsel} alt="" className="absolute inset-0 size-full object-cover" />}
            {devam.eg?.kapakGorsel && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />}
            <div className="relative">
            <p className="text-[11px] font-medium tracking-widest uppercase opacity-80">Eğitime devam et</p>
            <h2 className="mt-1 text-lg font-semibold">{devam.eg?.baslik}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${devam.yuzde}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">%{devam.yuzde}</span>
            <Button size="sm" onClick={() => navigate(`/portal/egitimler/${devam.a.egitimId}/oynat?atama=${devam.a.id}`)}>
              <PlayIcon /> {devam.yuzde > 0 ? 'Devam Et' : 'Başla'}
            </Button>
          </div>
        </div>
      )}

      {yaklasan.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold">Yaklaşan son tarihler</h2>
          <div className="mt-2 space-y-1.5">
            {yaklasan.map(({ a, eg, kd }) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5">
                <CalendarIcon className="size-4 text-amber-500" />
                <span className="min-w-0 flex-1 truncate text-sm">{eg?.baslik}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', kisiDurumRenk[kd])}>{kd}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{a.sonTarih} · {kalanGunMetni(a.sonTarih)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================== Eğitimlerim ============================= */

const SEKME_MAP: Record<string, KisiDurum[]> = {
  'Tümü': ['Bekliyor', 'Devam Ediyor', 'Tamamlandı', 'Başarısız', 'Onay Bekliyor', 'Gecikti'],
  'Bekleyen': ['Bekliyor', 'Gecikti'],
  'Devam Eden': ['Devam Ediyor', 'Onay Bekliyor'],
  'Tamamlanan': ['Tamamlandı'],
  'Başarısız': ['Başarısız'],
}

export function PortalEgitimler() {
  const navigate = useNavigate()
  const { pid } = useBen()
  const liste = useAtamalarim(pid)
  const [sekme, setSekme] = useState<keyof typeof SEKME_MAP>('Tümü')
  const filtreli = liste.filter((x) => SEKME_MAP[sekme].includes(x.kd))

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Eğitimlerim</h1>
      <p className="mt-1 text-sm text-muted-foreground">Size atanan eğitimler ve ilerlemeniz</p>
      <div className="mt-4">
        <CipGrup secenekler={Object.keys(SEKME_MAP) as (keyof typeof SEKME_MAP)[]} value={sekme} onChange={setSekme} />
      </div>
      {filtreli.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed py-16 text-center">
          <GraduationCapIcon className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">Bu sekmede eğitim yok</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {filtreli.map(({ a, eg, il, kd, yuzde }) => (
            <div key={a.id} className="overflow-hidden rounded-2xl border bg-card">
              <div className={cn('relative h-24 bg-gradient-to-br px-5 py-4', eg?.kapakTon)}>
                {eg?.kapakGorsel && <img src={eg.kapakGorsel} alt="" className="absolute inset-0 size-full object-cover" />}
                {eg?.kapakGorsel && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />}
                <p className="relative z-10 line-clamp-2 max-w-[80%] text-base leading-snug font-semibold text-white">{eg?.baslik}</p>
                <span className={cn('absolute top-3 right-3 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur', kd === 'Tamamlandı' ? 'bg-emerald-500/85 text-white' : 'bg-black/30 text-white')}>{kd}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><ClockIcon className="size-3" /> {eg?.sureDakika} dk</span>
                  <span className="inline-flex items-center gap-1"><CalendarIcon className="size-3" /> Son: {a.sonTarih} · {kalanGunMetni(a.sonTarih)}</span>
                  {a.zorunlu && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">Zorunlu</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', kd === 'Tamamlandı' ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${yuzde}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">%{yuzde}</span>
                </div>
                {il?.denemeler.length ? (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">Son sınav: {il.denemeler[il.denemeler.length - 1].puan} puan · {il.denemeler.length} deneme</p>
                ) : null}
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  variant={kd === 'Tamamlandı' ? 'outline' : 'default'}
                  onClick={() => navigate(`/portal/egitimler/${a.egitimId}/oynat?atama=${a.id}`)}
                >
                  {kd === 'Tamamlandı' ? <RotateCwIcon /> : <PlayIcon />}
                  {kd === 'Tamamlandı' ? 'Tekrar Gözden Geçir' : yuzde > 0 ? 'Devam Et' : 'Eğitime Başla'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================ Profilim ============================== */

export function PortalProfil() {
  const { user, p } = useBen()
  const { logout } = useAuthStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const navigate = useNavigate()
  const [sifreForm, setSifreForm] = useState(false)
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')
  const hesapGuncelle = usePersonelStore((s) => s.hesapGuncelle)
  const hesaplar = usePersonelStore((s) => s.hesaplar)
  const hesap = hesaplar.find((h) => h.personelId === p?.id && h.durum !== 'Pasif')
  const personelGuncelle = usePersonelStore((s) => s.personelGuncelle)
  const epostaAlinmi = usePersonelStore((s) => s.epostaAlinmi)
  const [iletisimForm, setIletisimForm] = useState(false)
  const [eposta, setEposta] = useState('')
  const [telefon, setTelefon] = useState('')

  const iletisimAc = () => {
    setEposta(p?.eposta ?? '')
    setTelefon(p?.telefon ?? '')
    setIletisimForm(true)
  }

  const iletisimKaydet = () => {
    if (!p) return
    const yeniEposta = eposta.trim()
    const yeniTelefon = telefon.trim()
    if (yeniEposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(yeniEposta)) return toast.error('Geçerli bir e-posta adresi girin')
    if (yeniEposta && epostaAlinmi(yeniEposta, p.id)) return toast.error('Bu e-posta başka bir kayıtta kullanılıyor')
    if (yeniTelefon && yeniTelefon.replace(/\D/g, '').length < 10) return toast.error('Telefon numarası en az 10 haneli olmalı')
    personelGuncelle(p.id, { eposta: yeniEposta, telefon: yeniTelefon })
    toast.success('İletişim bilgileriniz güncellendi')
    setIletisimForm(false)
  }

  const satir = (l: string, v: string) => (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{l}</span>
      <span className="text-sm font-medium">{v || '—'}</span>
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Profilim</h1>
      <div className="mt-5 flex items-center gap-4 rounded-2xl border bg-card p-5">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-semibold text-white">
          {user?.initials}
        </div>
        <div>
          <p className="text-base font-semibold">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{p?.gorev || '—'} · {p?.departman || '—'}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border bg-card">
        {satir('Firma', firmalar.find((f) => f.id === p?.firmaId)?.unvan ?? '')}
        {satir('Departman', p?.departman ?? '')}
        {satir('Görev', p?.gorev ?? '')}
        <div className="border-b px-4 py-3">
          {iletisimForm ? (
            <div className="space-y-2">
              <label className="block text-xs text-muted-foreground" htmlFor="profil-eposta">E-posta</label>
              <input id="profil-eposta" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} placeholder="ornek@firma.com" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              <label className="block text-xs text-muted-foreground" htmlFor="profil-telefon">Telefon</label>
              <input id="profil-telefon" type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="05xx xxx xx xx" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={iletisimKaydet}>Kaydet</Button>
                <Button size="sm" variant="ghost" onClick={() => setIletisimForm(false)}>Vazgeç</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex gap-4 text-sm"><span className="w-20 text-muted-foreground">E-posta</span><span className="font-medium">{p?.eposta || '—'}</span></div>
                <div className="flex gap-4 text-sm"><span className="w-20 text-muted-foreground">Telefon</span><span className="font-medium">{p?.telefon || '—'}</span></div>
              </div>
              <Button size="sm" variant="outline" onClick={iletisimAc}>Düzenle</Button>
            </div>
          )}
        </div>
        {satir('Kullanıcı adı', user?.username ?? '')}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Firma ve rol bilgileri işvereniniz tarafından yönetilir; güncellemek için İSG ekibinize başvurun.</p>

      <div className="mt-4 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium"><KeyRoundIcon className="size-4" /> Şifre</p>
          {!sifreForm && <Button size="sm" variant="outline" onClick={() => setSifreForm(true)}>Şifre Değiştir</Button>}
        </div>
        {sifreForm && (
          <div className="mt-3 space-y-2">
            <input type="password" value={s1} onChange={(e) => setS1(e.target.value)} placeholder="Yeni şifre" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            <input type="password" value={s2} onChange={(e) => setS2(e.target.value)} placeholder="Yeni şifre (tekrar)" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                if (s1.length < 6) return toast.error('Şifre en az 6 karakter olmalı')
                if (s1 !== s2) return toast.error('Şifreler eşleşmiyor')
                if (hesap) {
                  hesapGuncelle(hesap.id, { sifreHash: sifreHashle(s1) })
                  toast.success('Şifreniz güncellendi')
                }
                setSifreForm(false); setS1(''); setS2('')
              }}>Kaydet</Button>
              <Button size="sm" variant="ghost" onClick={() => setSifreForm(false)}>Vazgeç</Button>
            </div>
          </div>
        )}
      </div>

      <Button variant="outline" className="mt-4 w-full" onClick={() => { logout(); navigate('/giris') }}>
        <LogOutIcon /> Oturumu Kapat
      </Button>
    </div>
  )
}

/* ============================= Sertifikalarım =========================== */

export function PortalSertifikalar() {
  const { pid } = useBen()
  const { sertifikalar, basvurular } = useSertifikaStore()
  const benim = sertifikalar.filter((s) => s.personelId === pid)
  const bekleyen = basvurular.filter(
    (b) =>
      b.personelId === pid &&
      (b.durum === 'İnceleme Bekliyor' || b.durum === 'İnceleniyor' || b.durum === 'Eksik Koşul'),
  )
  const egitimAd = (id: string) =>
    useEgitimlerStore.getState().egitimler.find((e) => e.id === id)?.baslik ?? '—'
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sertifikalarım</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tamamlanan eğitimlere ait belgeler ve doğrulama bilgileri</p>

      {bekleyen.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <ClockIcon className="size-4" /> Onay sürecinde ({bekleyen.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {bekleyen.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{egitimAd(b.egitimId)}</span>
                <span className="tabular-nums">{b.basvuruTarihi} · {b.durum}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {benim.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed py-16 text-center">
          <AwardIcon className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">
            {bekleyen.length > 0 ? 'Sertifikanız onaylandığında burada görünecek' : 'Henüz sertifika yok'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Bir eğitimi tamamladığınızda sertifika başvurunuz otomatik oluşur; onaylandıktan sonra belgenizi buradan indirebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {benim.map((s) => {
            const d = sertifikaGuncelDurum(s)
            return (
              <div key={s.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: `linear-gradient(135deg, ${s.sablonSnap.anaRenk}, ${s.sablonSnap.vurguRenk})` }}
                  >
                    <AwardIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.egitimAd}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {s.sertifikaNo} · {s.duzenlenmeTarihi}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenkSertifika[d])}>
                    {d}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    {s.gecerlilikTarihi ? `Geçerlilik: ${s.gecerlilikTarihi}` : 'Süresiz geçerli'}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => sertifikaPdfIndirV2(s)}>
                    <DownloadIcon /> PDF İndir
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
