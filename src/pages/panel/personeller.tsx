import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Building2Icon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CheckIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  FileUpIcon,
  GraduationCapIcon,
  RefreshCwIcon,
  MailPlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  SearchIcon,
  UserPlusIcon,
  UserRoundIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Dialog as Modal } from '@base-ui/react/dialog'
import { FiltrePopover, ListeFooter, StatSerit } from '@/components/list-bits'
import { Alan, Sec } from '@/components/form-bits'
import { cn } from '@/lib/utils'
import { durumRenk, PERSONEL_DURUMLARI, tcMaske, type FirmaPersonel, type PersonelDurum } from '@/data/personeller'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { sifreHashle } from '@/lib/sifre'
import { rastgeleSifreUret } from '@/lib/kullanici-adi'
import { personelAd, usePersonelStore } from '@/stores/personeller-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useOtoBoy } from '@/lib/use-oto-boy'

const hesapRenk: Record<string, string> = {
  Aktif: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Davet Bekliyor': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Askıda: 'bg-red-500/10 text-red-500',
  Yok: 'bg-muted text-muted-foreground',
}

export default function PersonellerPage() {
  const navigate = useNavigate()
  const { personeller, hesaplar, atamalar, personelDurum } = usePersonelStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const ilerlemeler = useEgitimlerStore((s) => s.ilerlemeler)
  const [ara, setAra] = useState('')
  const [firmaF, setFirmaF] = useState('Tümü')
  const [depF, setDepF] = useState('Tümü')
  const [durumF, setDurumF] = useState('Tümü')
  const [hesapF, setHesapF] = useState('Tümü')
  const [sayfa, setSayfa] = useState(0)
  const [boyut, setBoyut] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy('liste', { satirH: 58, baslikH: 45, kartH: 0, kartW: 0 })
  const [formAcik, setFormAcik] = useState<FirmaPersonel | 'yeni' | null>(null)

  const firmaAd = (id: string) => firmalar.find((f) => f.id === id)?.unvan ?? id
  const hesapOf = (pid: string) => hesaplar.find((h) => h.personelId === pid && h.durum !== 'Pasif')
  const atamaOf = (pid: string) => atamalar.filter((a) => a.durum !== 'İptal' && a.personelIds.includes(pid))
  const tamamlanan = (pid: string) =>
    ilerlemeler.filter((i) => i.hesapId === pid && i.durum === 'Tamamlandı').length

  const departmanlar = useMemo(() => ['Tümü', ...new Set(personeller.map((p) => p.departman).filter(Boolean))], [personeller])
  const firmaOps = useMemo(() => ['Tümü', ...firmalar.map((f) => f.unvan)], [firmalar])

  const filtreli = useMemo(() => {
    const q = ara.trim().toLowerCase()
    return personeller.filter((p) => {
      if (firmaF !== 'Tümü' && firmaAd(p.firmaId) !== firmaF) return false
      if (depF !== 'Tümü' && p.departman !== depF) return false
      if (durumF !== 'Tümü' && p.durum !== durumF) return false
      const h = hesapOf(p.id)
      if (hesapF !== 'Tümü' && (h?.durum ?? 'Yok') !== hesapF) return false
      if (q && ![p.ad, p.soyad, p.eposta, p.departman, p.gorev, p.sicilNo, firmaAd(p.firmaId)].join(' ').toLowerCase().includes(q)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personeller, hesaplar, ara, firmaF, depF, durumF, hesapF])

  const sayfaBoyu = boyut === 'oto' ? otoBoy : boyut
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / sayfaBoyu))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const liste = filtreli.slice(sayfaGuvenli * sayfaBoyu, sayfaGuvenli * sayfaBoyu + sayfaBoyu)

  const say = (d: PersonelDurum) => personeller.filter((p) => p.durum === d).length
  const filtreAktif = [firmaF, depF, durumF, hesapF].filter((f) => f !== 'Tümü').length

  // Ekrandaki filtre/sıralama sonucu `filtreli` üzerinden aktarır
  const excelleAktar = () => {
    const filtreOz = [firmaF, depF, durumF, hesapF].filter((f) => f !== 'Tümü').join(' · ')
    xlsxIndir(xlsxDosyaAdi('Personel_Listesi'), [
      {
        ad: 'Personel Listesi',
        baslik: 'Müşteri Firma Personel Listesi',
        altBilgi: `Personeller modülü${filtreOz ? ` · Filtre: ${filtreOz}` : ''} · KVKK kapsamında kişisel veri içerir`,
        kolonlar: [
          { label: 'Kod', minGenislik: 9 },
          { label: 'Ad Soyad', minGenislik: 22 },
          { label: 'T.C. Kimlik', minGenislik: 13 },
          { label: 'Firma', minGenislik: 26, wrap: true },
          { label: 'Departman', minGenislik: 14 },
          { label: 'Görev', minGenislik: 18, wrap: true },
          { label: 'Sicil No', minGenislik: 11 },
          { label: 'Telefon', minGenislik: 15 },
          { label: 'E-posta', maxGenislik: 36, wrap: true },
          { label: 'Hesap', minGenislik: 14 },
          { label: 'Durum', minGenislik: 10 },
          { label: 'Kayıt', tip: 'tarih' },
        ],
        satirlar: filtreli.map((p) => [
          p.id,
          personelAd(p),
          p.tc ?? '',
          firmaAd(p.firmaId),
          p.departman,
          p.gorev,
          p.sicilNo,
          p.telefon,
          p.eposta,
          hesapOf(p.id)?.kullaniciAdi ?? '—',
          p.durum,
          p.olusturma,
        ]),
        ozet: [
          ['Toplam (filtreli)', filtreli.length],
          ['Aktif', filtreli.filter((p) => p.durum === 'Aktif').length],
          ['Pasif', filtreli.filter((p) => p.durum === 'Pasif').length],
          ['Hesabı olan', filtreli.filter((p) => hesapOf(p.id)).length],
        ],
      },
      {
        ad: 'Firma Dağılımı',
        baslik: 'Firma Bazlı Personel Dağılımı',
        altBilgi: 'Personeller modülü',
        kolonlar: [
          { label: 'Firma', minGenislik: 30, wrap: true },
          { label: 'Personel', tip: 'sayi', minGenislik: 11 },
          { label: 'Aktif', tip: 'sayi' },
          { label: 'Pasif', tip: 'sayi' },
        ],
        satirlar: firmalar
          .map((f) => {
            const l = filtreli.filter((p) => p.firmaId === f.id)
            return [f.unvan, l.length, l.filter((p) => p.durum === 'Aktif').length, l.filter((p) => p.durum === 'Pasif').length]
          })
          .filter((r) => Number(r[1]) > 0),
      },
    ])
    toast.success(`${filtreli.length} kayıt Excel'e aktarıldı`)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Personeller</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Müşteri firma çalışanları — eğitim atamaları ve portal hesapları · {personeller.length} kayıt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={excelleAktar}>
            <DownloadIcon /> Excel'e aktar
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/panel/personeller/toplu')}>
            <FileUpIcon /> Toplu Oluştur
          </Button>
          <Button size="sm" onClick={() => setFormAcik('yeni')}>
            <UserPlusIcon /> Personel Ekle
          </Button>
        </div>
      </div>

      <StatSerit
          ogeler={[
            { label: 'Toplam Personel', deger: personeller.length, ikon: UsersIcon },
            { label: 'Aktif', deger: say('Aktif'), ikon: CheckCircle2Icon },
            { label: 'Hesabı Olan', deger: hesaplar.filter((h) => h.durum === 'Aktif').length, ikon: GraduationCapIcon },
            { label: 'Davet Bekleyen', deger: hesaplar.filter((h) => h.durum === 'Davet Bekliyor').length, ikon: MailPlusIcon },
            { label: 'Pasif', deger: say('Pasif') + say('Ayrıldı'), ikon: PauseCircleIcon },
            { label: 'Aktif Atama', deger: atamalar.filter((a) => a.durum === 'Aktif').length, ikon: Building2Icon },
          ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => { setAra(e.target.value); setSayfa(0) }}
            placeholder="Ad, e-posta, sicil no, firma ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <FiltrePopover
            aktifSayi={filtreAktif}
            onTemizle={() => { setFirmaF('Tümü'); setDepF('Tümü'); setDurumF('Tümü'); setHesapF('Tümü') }}
            sorular={[
              { label: 'Firma', value: firmaF, options: firmaOps, onChange: setFirmaF },
              { label: 'Departman', value: depF, options: departmanlar, onChange: setDepF },
              { label: 'Personel durumu', value: durumF, options: ['Tümü', ...PERSONEL_DURUMLARI], onChange: setDurumF },
              { label: 'Hesap durumu', value: hesapF, options: ['Tümü', 'Aktif', 'Davet Bekliyor', 'Askıda', 'Yok'], onChange: setHesapF },
            ]}
          />
        </div>
      </div>

      <div ref={alanRef} className="min-h-0 flex-1 overflow-hidden">
        {liste.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
            <UsersIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Personel bulunamadı</p>
            <p className="text-xs text-muted-foreground">Arama veya filtreleri değiştirin</p>
          </div>
        ) : (
          <div className="h-full overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b bg-card">
                <tr className="text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Personel</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Firma</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Departman / Görev</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">İletişim</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Eğitim</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Durum</th>
                  <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Hesap</th>
                  <th className="w-10 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {liste.map((p) => {
                  const h = hesapOf(p.id)
                  const atms = atamaOf(p.id)
                  const tam = tamamlanan(p.id)
                  return (
                    <tr key={p.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => navigate(`/panel/personeller/${p.id}`)}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold text-white">
                            {p.ad[0]}{p.soyad[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{personelAd(p)}</p>
                            <p className="text-xs text-muted-foreground">{p.sicilNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-40 truncate px-3 py-2.5 text-xs">{firmaAd(p.firmaId)}</td>
                      <td className="px-3 py-2.5">
                        <p className={cn('text-xs', !p.departman && 'italic text-muted-foreground/70')}>{p.departman || 'Departman yok'}</p>
                        <p className={cn('text-[11px] text-muted-foreground', !p.gorev && 'italic text-muted-foreground/70')}>{p.gorev || 'Görev belirtilmedi'}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className={cn('truncate text-xs', !p.eposta && 'italic text-muted-foreground/70')}>{p.eposta || 'E-posta yok'}</p>
                        <p className={cn('text-[11px] text-muted-foreground tabular-nums', !p.telefon && 'italic text-muted-foreground/70')}>{p.telefon || 'Telefon yok'}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        {atms.length === 0 ? (
                          <span className="text-xs text-muted-foreground/70">Atama yok</span>
                        ) : (
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
                              <span>{tam} / {atms.length} tamam</span>
                              <span>%{Math.round((tam / atms.length) * 100)}</span>
                            </div>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((tam / atms.length) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenk[p.durum])}>{p.durum}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', hesapRenk[h?.durum ?? 'Yok'])}>
                          {h ? `@${h.kullaniciAdi}` : 'Hesap yok'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" />}>
                            <MoreHorizontalIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => navigate(`/panel/personeller/${p.id}`)}>
                              <UsersIcon className="size-4" /> Detay
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFormAcik(p)}>
                              <PencilIcon className="size-4" /> Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/panel/personeller/${p.id}?sekme=egitim`)}>
                              <GraduationCapIcon className="size-4" /> Eğitim atamaları
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {p.durum === 'Aktif' || p.durum === 'İzinli' ? (
                              <DropdownMenuItem onClick={() => { personelDurum(p.id, 'Pasif'); toast('Personel pasife alındı') }}>
                                <PauseCircleIcon className="size-4" /> Pasife al
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => { personelDurum(p.id, 'Aktif'); toast.success('Personel aktifleştirildi') }}>
                                <PlayCircleIcon className="size-4" /> Aktifleştir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="shrink-0">
        <ListeFooter
          bas={filtreli.length === 0 ? 0 : sayfaGuvenli * sayfaBoyu + 1}
          son={Math.min(filtreli.length, (sayfaGuvenli + 1) * sayfaBoyu)}
          toplam={filtreli.length}
          sayfaGuvenli={sayfaGuvenli}
          sayfaSayisi={sayfaSayisi}
          sayfaBoyu={boyut}
          otoBoy={otoBoy}
          onBoyut={setBoyut}
          onSayfa={setSayfa}
        />
      </div>

      {formAcik && <PersonelForm duzenle={formAcik === 'yeni' ? undefined : formAcik} onKapat={() => setFormAcik(null)} />}
    </div>
  )
}

/* ============================ Personel form ============================= */

// Ad ve soyaddan önerilen kullanıcı adı (Türkçe karakterler sadeleştirilir).
const kullaniciOner = (ad: string, soyad: string) =>
  [ad, soyad].join('.').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9.]/g, '')

const rastgeleSifre = () => {
  const karakterler = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bayt = new Uint32Array(10)
  crypto.getRandomValues(bayt)
  return Array.from(bayt, (b) => karakterler[b % karakterler.length]).join('')
}

function PersonelForm({ duzenle, onKapat }: { duzenle?: FirmaPersonel; onKapat: () => void }) {
  const { personelEkle, personelGuncelle, firmaDegistir, epostaAlinmi, hesapOlustur, kullaniciAlinmi } = usePersonelStore()
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const [f, setF] = useState({
    firmaId: duzenle?.firmaId ?? '',
    ad: duzenle?.ad ?? '',
    soyad: duzenle?.soyad ?? '',
    eposta: duzenle?.eposta ?? '',
    telefon: duzenle?.telefon ?? '',
    tc: duzenle?.tc ?? '',
    departman: duzenle?.departman ?? '',
    gorev: duzenle?.gorev ?? '',
    sicilNo: duzenle?.sicilNo ?? '',
    durum: duzenle?.durum ?? ('Aktif' as PersonelDurum),
  })
  const [firmaOnay, setFirmaOnay] = useState(false)
  const [adim, setAdim] = useState(0)
  const [hesapAcik, setHesapAcik] = useState(false)
  // Kullanıcı adı ad/soyaddan otomatik türer; kullanıcı elle değiştirirse elle girilen değer kullanılır.
  const [kulManuel, setKulManuel] = useState<string | null>(null)
  const kul = kulManuel ?? kullaniciOner(f.ad, f.soyad)
  const [sifre, setSifre] = useState(() => rastgeleSifreUret())
  const [sifreTekrar, setSifreTekrar] = useState(sifre)
  const [sifreGoster, setSifreGoster] = useState(true)
  const firmaDegisti = !!duzenle && f.firmaId !== duzenle.firmaId

  // Yeni kayıtta hesap bilgileri; hata varsa mesaj döner.
  const hesapHatasi = (): string | null => {
    if (!hesapAcik) return null
    if (!kul.trim()) return 'Kullanıcı adı zorunlu'
    if (kullaniciAlinmi(kul.trim())) return 'Bu kullanıcı adı zaten kullanılıyor'
    if (sifre.length < 6) return 'Şifre en az 6 karakter olmalı'
    if (sifre !== sifreTekrar) return 'Şifreler eşleşmiyor'
    return null
  }

  const kaydet = async () => {
    if (!f.firmaId) return toast.error('Firma seçimi zorunlu')
    if (!f.ad.trim() || !f.soyad.trim()) return toast.error('Ad ve soyad zorunlu')
    if (f.eposta && epostaAlinmi(f.eposta, duzenle?.id)) return toast.error('Bu e-posta başka bir kayıtta kullanılıyor')
    if (duzenle) {
      if (firmaDegisti) {
        if (!firmaOnay) return toast.error('Firma değişikliğini onaylayın — geçmiş kayıtlar korunur')
        firmaDegistir(duzenle.id, f.firmaId)
      }
      personelGuncelle(duzenle.id, { ...f })
      toast.success('Personel güncellendi')
    } else {
      const hata = hesapHatasi()
      if (hata) return toast.error(hata)
      const yeniPersonel = personelEkle(f)
      if (hesapAcik) {
        try {
          hesapOlustur(yeniPersonel.id, kul.trim(), 'sifre', await sifreHashle(sifre))
          toast.success('Personel ve giriş hesabı oluşturuldu')
        } catch (e) {
          toast.error(e instanceof Error ? `Personel eklendi, hesap açılamadı: ${e.message}` : 'Personel eklendi, hesap açılamadı')
        }
      } else toast.success('Personel eklendi')
    }
    onKapat()
  }

  if (!duzenle) {
    const adimlar = [
      { baslik: 'Kişi & giriş hesabı', aciklama: 'İletişim ve isteğe bağlı giriş hesabı', Icon: UserRoundIcon },
      { baslik: 'Görev & kayıt', aciklama: 'Çalışma bilgileri ve kimlik', Icon: Building2Icon },
    ]
    return (
      <Modal.Root open onOpenChange={(o) => !o && onKapat()}>
        <Modal.Portal>
          <Modal.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Modal.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[min(900px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl outline-none max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:max-h-[94dvh] max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:flex-col max-md:rounded-b-none">
            <aside className="relative hidden w-60 shrink-0 flex-col overflow-hidden bg-[#111214] bg-cover bg-[center_68%] text-white md:flex" style={{ backgroundImage: "url('/images/firma-wizard-sidebar.png')" }}>
              <div className="absolute inset-0 bg-gradient-to-b from-[#101113]/95 via-[#111214]/82 to-[#111214]/95" />
              <div className="relative z-10 flex h-full flex-col p-4">
                <div className="border-b border-white/10 px-2 pb-4"><div className="text-sm font-semibold">Firma personeli</div><p className="mt-1 text-[11px] leading-relaxed text-white/55">Çalışan kaydını ve iletişim bilgilerini oluşturun.</p></div>
                <nav className="mt-3 space-y-1" aria-label="Personel oluşturma adımları">
                  {adimlar.map(({ baslik, aciklama, Icon }, i) => <button key={baslik} type="button" disabled={i > adim} onClick={() => i < adim && setAdim(i)} className={cn('flex w-full items-start gap-3 rounded-xl px-2.5 py-3 text-left', i === adim ? 'bg-white/10' : i < adim ? 'hover:bg-white/5' : 'cursor-default opacity-45')}><span className={cn('grid size-7 shrink-0 place-items-center rounded-full border', i < adim ? 'border-emerald-500 bg-emerald-500 text-white' : i === adim ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-white/20 text-white/50')}>{i < adim ? <CheckIcon className="size-3.5" /> : <Icon className="size-3.5" />}</span><span><span className="block text-xs font-medium">{baslik}</span><span className="mt-1 block text-[10px] text-white/50">{aciklama}</span></span></button>)}
                </nav>
                <div className="mt-auto rounded-xl border border-white/10 bg-black/25 p-3 backdrop-blur-sm"><span className="text-[10px] text-amber-300">KAYIT ÖNİZLEMESİ</span><p className="mt-1 truncate text-xs font-medium">{`${f.ad} ${f.soyad}`.trim() || 'Ad soyad girilmedi'}</p><p className="mt-0.5 truncate text-[10px] text-white/55">{firmalar.find((x) => x.id === f.firmaId)?.kisaAd || 'Firma seçilmedi'}</p></div>
              </div>
            </aside>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="border-b px-5 py-4 sm:px-6"><Modal.Title className="text-lg font-semibold">Yeni personel kaydı</Modal.Title><Modal.Description className="mt-1 text-sm text-muted-foreground">Firma çalışanını iki kısa adımda sisteme ekleyin.</Modal.Description><div className="mt-3 flex items-center gap-2 md:hidden"><span className="text-xs font-medium">{adimlar[adim].baslik}</span><span className="text-[11px] text-muted-foreground">{adim + 1}/2</span><div className="ml-auto h-1 w-20 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: `${((adim + 1) / 2) * 100}%` }} /></div></div></div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                {adim === 0 ? <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Alan label="Firma *"><Sec value={firmalar.find((x) => x.id === f.firmaId)?.unvan ?? ''} onChange={(v) => setF({ ...f, firmaId: firmalar.find((x) => x.unvan === v)?.id ?? '' })} options={['', ...firmalar.map((x) => x.unvan)]} /></Alan>
                    <div className="hidden sm:block" />
                    <Alan label="Ad *"><input value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /></Alan>
                    <Alan label="Soyad *"><input value={f.soyad} onChange={(e) => setF({ ...f, soyad: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /></Alan>
                    <Alan label="E-posta"><input type="email" value={f.eposta} onChange={(e) => setF({ ...f, eposta: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /></Alan>
                    <Alan label="Telefon"><input value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /></Alan>
                  </div>
                  <div className="space-y-3 rounded-xl border p-4">
                    <label className="flex cursor-pointer items-center gap-2.5"><Checkbox checked={hesapAcik} onCheckedChange={(v) => setHesapAcik(!!v)} /><span><span className="block text-sm font-medium">Giriş hesabı oluştur</span><span className="block text-xs text-muted-foreground">Çalışan bu kullanıcı adı ve şifre ile portala girer.</span></span></label>
                    {hesapAcik && <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Alan label="Kullanıcı adı *"><input value={kul} onChange={(e) => setKulManuel(e.target.value.replace(/\s/g, ''))} placeholder="ad.soyad" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />{kul && kullaniciAlinmi(kul.trim()) && <p className="mt-1 text-xs text-red-500">Bu kullanıcı adı zaten kullanılıyor</p>}</Alan>
                        <div className="hidden sm:block" />
                        <Alan label="Şifre *"><div className="flex gap-1.5"><input type={sifreGoster ? 'text' : 'password'} autoComplete="new-password" value={sifre} onChange={(e) => setSifre(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 font-mono text-sm outline-none focus-visible:border-ring dark:bg-input/30" /><button type="button" aria-label={sifreGoster ? 'Şifreyi gizle' : 'Şifreyi göster'} onClick={() => setSifreGoster((s) => !s)} className="flex size-9 shrink-0 items-center justify-center rounded-lg border hover:bg-muted">{sifreGoster ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}</button><button type="button" onClick={() => { const s = rastgeleSifre(); setSifre(s); setSifreTekrar(s); setSifreGoster(true) }} className="flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs hover:bg-muted"><RefreshCwIcon className="size-3.5" /> Rastgele</button></div></Alan>
                        <Alan label="Şifre tekrar *"><input type={sifreGoster ? 'text' : 'password'} autoComplete="new-password" value={sifreTekrar} onChange={(e) => setSifreTekrar(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 font-mono text-sm outline-none focus-visible:border-ring dark:bg-input/30" /></Alan>
                      </div>
                      <p className="rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">Şifreyi çalışana iletin. Çalışan ilk girişte değiştirebilir.</p>
                    </>}
                  </div>
                </> : <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Alan label="Departman"><input value={f.departman} onChange={(e) => setF({ ...f, departman: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /></Alan>
                    <Alan label="Görev / meslek"><input value={f.gorev} onChange={(e) => setF({ ...f, gorev: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /></Alan>
                    <Alan label="Çalışan numarası"><input value={f.sicilNo} onChange={(e) => setF({ ...f, sicilNo: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" /></Alan>
                    <Alan label="TCKN (opsiyonel)"><input value={f.tc} onChange={(e) => setF({ ...f, tc: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="11 haneli" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />{f.tc && <p className="mt-1 text-xs text-muted-foreground">{tcMaske(f.tc)}</p>}</Alan>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4"><div className="flex items-center gap-2 text-sm font-medium"><ShieldCheckIcon className="size-4 text-amber-600" /> Kayıt özeti</div><p className="mt-2 text-xs text-muted-foreground">{f.ad} {f.soyad} · {firmalar.find((x) => x.id === f.firmaId)?.kisaAd || 'Firma seçilmedi'}</p><p className="mt-1 text-xs text-muted-foreground">{f.gorev || 'Görev belirtilmedi'}{f.eposta ? ` · ${f.eposta}` : ''}</p></div>
                </>}
              </div>
              <div className="flex items-center justify-between gap-3 border-t px-5 py-3 sm:px-6"><span className="text-xs text-muted-foreground">Adım {adim + 1} / 2</span><div className="flex gap-2">{adim === 0 ? <Button variant="ghost" onClick={onKapat}>Vazgeç</Button> : <Button variant="outline" onClick={() => setAdim(adim - 1)}><ArrowLeftIcon /> Geri</Button>}{adim < 1 ? <Button onClick={() => { if (!f.firmaId || !f.ad.trim() || !f.soyad.trim()) return toast.error('Firma, ad ve soyad alanlarını doldurun'); const hata = hesapHatasi(); if (hata) return toast.error(hata); setAdim(1) }}>Devam et <ArrowRightIcon /></Button> : <Button onClick={kaydet}><CheckIcon /> Personeli ekle</Button>}</div></div>
            </div>
          </Modal.Popup>
        </Modal.Portal>
      </Modal.Root>
    )
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onKapat()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetTitle className="text-base">{duzenle ? 'Personeli Düzenle' : 'Yeni Personel'}</SheetTitle>
        <div className="mt-5 space-y-4">
          <Alan label="Firma">
            <Sec value={f.firmaId} onChange={(v) => setF({ ...f, firmaId: v })} options={['', ...firmalar.map((x) => x.id)]} />
            {f.firmaId && <p className="mt-1 text-xs text-muted-foreground">{firmalar.find((x) => x.id === f.firmaId)?.unvan}</p>}
          </Alan>
          <div className="grid grid-cols-2 gap-3">
            <Alan label="Ad">
              <input value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </Alan>
            <Alan label="Soyad">
              <input value={f.soyad} onChange={(e) => setF({ ...f, soyad: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </Alan>
          </div>
          <Alan label="E-posta">
            <input type="email" value={f.eposta} onChange={(e) => setF({ ...f, eposta: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
          </Alan>
          <div className="grid grid-cols-2 gap-3">
            <Alan label="Telefon">
              <input value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </Alan>
            <Alan label="Çalışan numarası">
              <input value={f.sicilNo} onChange={(e) => setF({ ...f, sicilNo: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </Alan>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Alan label="Departman">
              <input value={f.departman} onChange={(e) => setF({ ...f, departman: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </Alan>
            <Alan label="Görev / meslek">
              <input value={f.gorev} onChange={(e) => setF({ ...f, gorev: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            </Alan>
          </div>
          <Alan label="TCKN (opsiyonel — maskeli saklanır)">
            <input value={f.tc} onChange={(e) => setF({ ...f, tc: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="11 haneli" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
            {f.tc && <p className="mt-1 text-xs text-muted-foreground">{tcMaske(f.tc)}</p>}
          </Alan>
          {duzenle && (
            <>
              <Alan label="Personel durumu">
                <Sec value={f.durum} onChange={(v) => setF({ ...f, durum: v as PersonelDurum })} options={PERSONEL_DURUMLARI} />
              </Alan>
              {firmaDegisti && (
                <label className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                  <Checkbox checked={firmaOnay} onCheckedChange={(v) => setFirmaOnay(!!v)} className="mt-0.5" />
                  <span>Firma değişikliğini onaylıyorum. Personelin önceki firma geçmişi ve eğitim kayıtları korunur.</span>
                </label>
              )}
            </>
          )}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
            <Button onClick={kaydet}>{duzenle ? 'Güncelle' : 'Personeli Ekle'}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
