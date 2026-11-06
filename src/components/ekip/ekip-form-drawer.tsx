import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlaskConicalIcon,
  HardHatIcon,
  KeyRoundIcon,
  LinkIcon,
  MailPlusIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserCogIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Alan, Bolum, EkIkon, Sec } from '@/components/form-bits'
import { cn } from '@/lib/utils'
import { useEkipStore } from '@/stores/ekip-store'
import {
  CALISMA_TIPLERI,
  gorevRol,
  GOREV_TURLERI,
  PERSONEL_DURUMLARI,
  ROL_ADLARI,
  sifreHashle,
  type EkipUye,
  type GorevTuru,
} from '@/data/ekip'
import type { OlayEk } from '@/data/olaylar'

const GOREV_IKON: Record<GorevTuru, React.ComponentType<{ className?: string }>> = {
  'Kurum Müdürü': BriefcaseIcon,
  'İş Güvenliği Uzmanı': HardHatIcon,
  'İşyeri Hekimi': StethoscopeIcon,
  'Diğer Sağlık Personeli': ShieldCheckIcon,
  Hemşire: ShieldCheckIcon,
  'İdari Personel': UserIcon,
  'Operasyon Sorumlusu': UserCogIcon,
  'Laboratuvar Personeli': FlaskConicalIcon,
  Diğer: UsersIcon,
}

interface Form {
  unvanOnek: string
  ad: string
  soyad: string
  tc: string
  dogumTarihi: string
  telefon: string
  eposta: string
  adres: string
  gorev: GorevTuru
  uzmanSinifi: 'A' | 'B' | 'C'
  katipKaydi: string
  belgeNo: string
  belgeGecerlilik: string
  brans: string
  diplomaNo: string
  meslekiKayitNo: string
  meslekTuru: string
  departman: string
  pozisyon: string
  deneyimYili: string
  belgeler: OlayEk[]
  iseGiris: string
  calismaTipi: string
  dahiliTel: string
  aciklama: string
  durum: string
}

const bosForm: Form = {
  unvanOnek: '',
  ad: '',
  soyad: '',
  tc: '',
  dogumTarihi: '',
  telefon: '',
  eposta: '',
  adres: '',
  gorev: 'İş Güvenliği Uzmanı',
  uzmanSinifi: 'C',
  katipKaydi: '',
  belgeNo: '',
  belgeGecerlilik: '',
  brans: '',
  diplomaNo: '',
  meslekiKayitNo: '',
  meslekTuru: '',
  departman: '',
  pozisyon: '',
  deneyimYili: '',
  belgeler: [],
  iseGiris: '',
  calismaTipi: 'Tam zamanlı',
  dahiliTel: '',
  aciklama: '',
  durum: 'Aktif',
}

const formdan = (u: EkipUye): Form => ({
  unvanOnek: u.unvanOnek ?? '',
  ad: u.ad,
  soyad: u.soyad,
  tc: u.tc ?? '',
  dogumTarihi: u.dogumTarihi ?? '',
  telefon: u.telefon,
  eposta: u.eposta,
  adres: u.adres ?? '',
  gorev: u.gorev,
  uzmanSinifi: u.uzmanSinifi ?? 'C',
  katipKaydi: u.katipKaydi ?? '',
  belgeNo: u.belgeNo ?? '',
  belgeGecerlilik: u.belgeGecerlilik ?? '',
  brans: u.brans ?? '',
  diplomaNo: u.diplomaNo ?? '',
  meslekiKayitNo: u.meslekiKayitNo ?? '',
  meslekTuru: u.meslekTuru ?? '',
  departman: u.departman ?? '',
  pozisyon: u.pozisyon ?? '',
  deneyimYili: u.deneyimYili ?? '',
  belgeler: u.belgeler,
  iseGiris: u.iseGiris,
  calismaTipi: u.calismaTipi ?? 'Tam zamanlı',
  dahiliTel: u.dahiliTel ?? '',
  aciklama: u.aciklama ?? '',
  durum: u.durum,
})

type HesapMod = 'yok' | 'davet' | 'sifre'

const ADIMLAR = [
  { key: 'kisisel', baslik: 'Kişisel Bilgiler', aciklama: 'Kimlik ve iletişim' },
  { key: 'gorev', baslik: 'Görev & Mesleki Bilgiler', aciklama: 'Göreve göre dinamik alanlar' },
  { key: 'calisma', baslik: 'Çalışma Bilgileri', aciklama: 'İşe giriş ve durum' },
  { key: 'hesap', baslik: 'Kullanıcı Hesabı', aciklama: 'Opsiyonel giriş hesabı' },
] as const

export function EkipFormDrawer({
  uye,
  onKapat,
}: {
  uye: EkipUye | 'yeni' | null
  onKapat: () => void
}) {
  const uyeEkle = useEkipStore((s) => s.uyeEkle)
  const uyeGuncelle = useEkipStore((s) => s.uyeGuncelle)
  const hesapOlustur = useEkipStore((s) => s.hesapOlustur)
  const hesaplar = useEkipStore((s) => s.hesaplar)
  const uyeler = useEkipStore((s) => s.uyeler)

  const yeni = uye === 'yeni'
  const mevcut = typeof uye === 'object' && uye ? uye : null
  const mevcutHesap = mevcut ? hesaplar.find((h) => h.personelId === mevcut.id) : undefined

  const [f, setF] = useState<Form>(() => (mevcut ? formdan(mevcut) : bosForm))
  const [adim, setAdim] = useState(0)
  const [hesapMod, setHesapMod] = useState<HesapMod>('yok')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [hesapEposta, setHesapEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifre2, setSifre2] = useState('')
  const [rol, setRol] = useState<string>('İdari Personel')
  const [hata, setHata] = useState<string[]>([])

  const ac = uye !== null

  const sif = (k: keyof Form, v: string) => setF((s) => ({ ...s, [k]: v }))

  const dspMi = f.gorev === 'Diğer Sağlık Personeli' || f.gorev === 'Hemşire'
  const uzmanMi = f.gorev === 'İş Güvenliği Uzmanı'
  const hekimMi = f.gorev === 'İşyeri Hekimi'
  const meslekiMi = uzmanMi || hekimMi || dspMi

  const oneriKul = useMemo(() => {
    if (!f.ad || !f.soyad) return ''
    return `${f.ad[0]}${f.soyad}`
      .toLocaleLowerCase('tr')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '')
  }, [f.ad, f.soyad])

  const ekEkle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setF((s) => ({
      ...s,
      belgeler: [
        ...s.belgeler,
        ...files.map((x) => ({
          ad: x.name,
          tur: x.type.startsWith('image/')
            ? ('Fotoğraf' as const)
            : x.type.startsWith('video/')
              ? ('Video' as const)
              : ('Belge' as const),
          boyut: `${(x.size / 1024).toFixed(0)} KB`,
        })),
      ],
    }))
    e.target.value = ''
  }

  /* ------------------------------ Doğrulama ------------------------------ */

  const kisiselHatalar = () => {
    const h: string[] = []
    if (!f.ad.trim()) h.push('Ad zorunlu')
    if (!f.soyad.trim()) h.push('Soyad zorunlu')
    if (!f.telefon.trim()) h.push('Telefon zorunlu')
    if (!f.eposta.trim() || !f.eposta.includes('@')) h.push('Geçerli e-posta zorunlu')
    const adSoyad = `${f.ad} ${f.soyad}`.toLocaleLowerCase('tr')
    if (
      uyeler.some(
        (u) => `${u.ad} ${u.soyad}`.toLocaleLowerCase('tr') === adSoyad && u.id !== mevcut?.id,
      )
    )
      h.push('Bu isimde bir personel kaydı zaten var')
    return h
  }

  const gorevHatalar = () => (uzmanMi && !f.uzmanSinifi ? ['Uzmanlık sınıfı zorunlu'] : [])

  const calismaHatalar = () => (!f.iseGiris ? ['İşe giriş tarihi zorunlu'] : [])

  const hesapHatalar = () => {
    if (hesapMod === 'yok') return []
    const h: string[] = []
    const kul = kullaniciAdi.trim() || oneriKul
    if (!kul) h.push('Kullanıcı adı zorunlu')
    else if (hesaplar.some((x) => x.kullaniciAdi === kul && x.personelId !== mevcut?.id))
      h.push('Kullanıcı adı başka bir hesapta kullanılıyor')
    const ep = (hesapEposta || f.eposta).trim()
    if (!ep.includes('@')) h.push('Hesap e-postası geçersiz')
    else if (
      hesaplar.some((x) => x.eposta === ep && x.personelId !== mevcut?.id) ||
      uyeler.some(
        (u) =>
          u.eposta.toLocaleLowerCase('tr') === ep.toLocaleLowerCase('tr') &&
          u.id !== mevcut?.id,
      )
    )
      h.push('E-posta adresi başka bir kayıtta kullanılıyor')
    if (hesapMod === 'sifre') {
      if (sifre.length < 6) h.push('Şifre en az 6 karakter olmalı')
      else if (sifre !== sifre2) h.push('Şifreler eşleşmiyor')
    }
    return h
  }

  const adimHatalar = (a: number) =>
    [kisiselHatalar, gorevHatalar, calismaHatalar, hesapHatalar][a]?.() ?? []

  const dogrula = () => [
    ...kisiselHatalar(),
    ...gorevHatalar(),
    ...calismaHatalar(),
    ...hesapHatalar(),
  ]

  const ileri = () => {
    const h = adimHatalar(adim)
    setHata(h)
    if (h.length) return
    setAdim((a) => Math.min(a + 1, ADIMLAR.length - 1))
  }

  /* -------------------------------- Kaydet -------------------------------- */

  const kaydet = () => {
    const h = dogrula()
    setHata(h)
    if (h.length) return
    const payload = {
      unvanOnek: f.unvanOnek.trim() || undefined,
      ad: f.ad.trim(),
      soyad: f.soyad.trim(),
      tc: f.tc ? `*** *** **${f.tc.slice(-2)}` : undefined, // KVKK: maskeli sakla
      dogumTarihi: f.dogumTarihi || undefined,
      telefon: f.telefon.trim(),
      eposta: f.eposta.trim(),
      adres: f.adres.trim() || undefined,
      gorev: f.gorev,
      uzmanSinifi: uzmanMi ? f.uzmanSinifi : undefined,
      katipKaydi: meslekiMi ? f.katipKaydi.trim() || undefined : undefined,
      belgeNo: uzmanMi || dspMi ? f.belgeNo.trim() || undefined : undefined,
      belgeGecerlilik: meslekiMi ? f.belgeGecerlilik || undefined : undefined,
      brans: hekimMi ? f.brans.trim() || undefined : undefined,
      diplomaNo: hekimMi || dspMi ? f.diplomaNo.trim() || undefined : undefined,
      meslekiKayitNo: hekimMi || dspMi ? f.meslekiKayitNo.trim() || undefined : undefined,
      meslekTuru: dspMi ? f.meslekTuru.trim() || 'Hemşire' : undefined,
      departman: f.departman.trim() || undefined,
      pozisyon: f.pozisyon.trim() || undefined,
      deneyimYili: uzmanMi ? f.deneyimYili.trim() || undefined : undefined,
      belgeler: f.belgeler,
      iseGiris: f.iseGiris,
      calismaTipi: f.calismaTipi,
      dahiliTel: f.dahiliTel.trim() || undefined,
      aciklama: f.aciklama.trim() || undefined,
      durum: f.durum as EkipUye['durum'],
    }

    let hedef: EkipUye
    if (mevcut) {
      uyeGuncelle(mevcut.id, payload, 'Personel bilgileri güncellendi')
      hedef = { ...mevcut, ...payload }
      toast.success(`${f.ad} ${f.soyad} güncellendi`)
    } else {
      hedef = uyeEkle(payload)
      toast.success(`${f.ad} ${f.soyad} ekibe eklendi`)
    }

    if (hesapMod !== 'yok' && !mevcutHesap) {
      const davet = hesapMod === 'davet'
      const yeniHesap = hesapOlustur({
        personelId: hedef.id,
        kullaniciAdi: (kullaniciAdi.trim() || oneriKul).trim(),
        eposta: (hesapEposta || f.eposta).trim(),
        sifreHash: davet ? undefined : sifreHashle(sifre),
        rol: rol as Parameters<typeof hesapOlustur>[0]['rol'],
        durum: davet ? 'Davet Bekliyor' : 'Aktif',
        davetTarihi: undefined,
      })
      if (davet) {
        const token = useEkipStore.getState().davetYenile(yeniHesap.id)
        navigator.clipboard?.writeText(`${location.origin}/davet/${token}`).catch(() => {})
      }
      toast.success(
        davet
          ? `Davet bağlantısı oluşturuldu ve panoya kopyalandı: ${(hesapEposta || f.eposta).trim()}`
          : 'Kullanıcı hesabı oluşturuldu',
      )
    }
    onKapat()
  }

  /* ---------------------------- Bölüm içerikleri --------------------------- */

  const hataKutusu = hata.length > 0 && (
    <div className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2.5 text-xs text-red-700 dark:text-red-400">
      <p className="mb-1 font-medium">Form eksikleri:</p>
      <ul className="list-inside list-disc space-y-0.5">
        {hata.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  )

  const KisiselBilgiler = (
    <Bolum harf="A" baslik="Kişisel bilgiler">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Alan label="Unvan">
          <Sec
            value={f.unvanOnek || '—'}
            onChange={(v) => sif('unvanOnek', v === '—' ? '' : v)}
            options={['—', 'Dr.', 'Hemşire', 'ATT', 'Prof.', 'Doç.']}
          />
        </Alan>
        <Alan label="Ad *">
          <Input value={f.ad} onChange={(e) => sif('ad', e.target.value)} />
        </Alan>
        <Alan label="Soyad *" className="col-span-2">
          <Input value={f.soyad} onChange={(e) => sif('soyad', e.target.value)} />
        </Alan>
        <Alan label="TC Kimlik No">
          <Input
            value={f.tc}
            onChange={(e) => sif('tc', e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="11 hane"
            inputMode="numeric"
          />
        </Alan>
        <Alan label="Doğum tarihi">
          <Input type="date" value={f.dogumTarihi} onChange={(e) => sif('dogumTarihi', e.target.value)} />
        </Alan>
        <Alan label="Telefon *">
          <Input value={f.telefon} onChange={(e) => sif('telefon', e.target.value)} placeholder="05xx xxx xx xx" />
        </Alan>
        <Alan label="E-posta *">
          <Input type="email" value={f.eposta} onChange={(e) => sif('eposta', e.target.value)} />
        </Alan>
        <Alan label="İkamet adresi" className="col-span-2 sm:col-span-4">
          <Input value={f.adres} onChange={(e) => sif('adres', e.target.value)} placeholder="Opsiyonel — KVKK kapsamında zorunlu değil" />
        </Alan>
      </div>
      <p className="text-[11px] text-muted-foreground">
        TC kimlik numarası maskeli saklanır ve yalnızca yetkili rollere gösterilir.
      </p>
    </Bolum>
  )

  const GorevBilgileri = (
    <Bolum harf="B" baslik="Görev ve mesleki bilgiler">
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {GOREV_TURLERI.map((g) => {
          const Ikon = GOREV_IKON[g]
          const secili = f.gorev === g
          return (
            <button
              key={g}
              type="button"
              onClick={() => sif('gorev', g)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center text-[11px] font-medium transition-colors',
                secili
                  ? 'border-amber-500/60 bg-amber-500/10 text-foreground'
                  : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              <Ikon className="size-4" />
              {g === 'İş Güvenliği Uzmanı' ? 'İSG Uzmanı' : g === 'Diğer Sağlık Personeli' ? 'DSP' : g}
            </button>
          )
        })}
      </div>

      {uzmanMi && (
        <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="grid grid-cols-3 gap-2">
            {(['A', 'B', 'C'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sif('uzmanSinifi', s)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                  f.uzmanSinifi === s
                    ? s === 'A'
                      ? 'border-violet-500/60 bg-violet-500/15 text-violet-700 dark:text-violet-400'
                      : s === 'B'
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : 'border-sky-500/60 bg-sky-500/15 text-sky-700 dark:text-sky-400'
                    : 'text-muted-foreground hover:border-foreground/30',
                )}
              >
                {s} Sınıfı
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Alan label="İSG-KATİP kayıt no">
              <Input value={f.katipKaydi} onChange={(e) => sif('katipKaydi', e.target.value)} placeholder="KTIP-…" />
            </Alan>
            <Alan label="Belge / sertifika no">
              <Input value={f.belgeNo} onChange={(e) => sif('belgeNo', e.target.value)} placeholder="IGU-…" />
            </Alan>
            <Alan label="Belge geçerlilik tarihi">
              <Input type="date" value={f.belgeGecerlilik} onChange={(e) => sif('belgeGecerlilik', e.target.value)} />
            </Alan>
            <Alan label="Mesleki deneyim">
              <Input value={f.deneyimYili} onChange={(e) => sif('deneyimYili', e.target.value)} placeholder="örn. 5 yıl" />
            </Alan>
          </div>
        </div>
      )}

      {hekimMi && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
          <Alan label="Uzmanlık branşı (opsiyonel)">
            <Input value={f.brans} onChange={(e) => sif('brans', e.target.value)} placeholder="örn. İş Sağlığı" />
          </Alan>
          <Alan label="Diploma no">
            <Input value={f.diplomaNo} onChange={(e) => sif('diplomaNo', e.target.value)} placeholder="TIP-…" />
          </Alan>
          <Alan label="Mesleki kayıt no">
            <Input value={f.meslekiKayitNo} onChange={(e) => sif('meslekiKayitNo', e.target.value)} placeholder="KTP-HEK-…" />
          </Alan>
          <Alan label="İSG-KATİP kayıt no">
            <Input value={f.katipKaydi} onChange={(e) => sif('katipKaydi', e.target.value)} placeholder="KTIP-HEK-…" />
          </Alan>
          <Alan label="Belge geçerlilik tarihi">
            <Input type="date" value={f.belgeGecerlilik} onChange={(e) => sif('belgeGecerlilik', e.target.value)} />
          </Alan>
        </div>
      )}

      {dspMi && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
          <Alan label="Meslek türü">
            <Sec
              value={f.meslekTuru || 'Hemşire'}
              onChange={(v) => sif('meslekTuru', v)}
              options={['Hemşire', 'Acil Tıp Teknisyeni', 'Sağlık Memuru', 'Diğer']}
            />
          </Alan>
          <Alan label="Diploma / sertifika no">
            <Input value={f.diplomaNo} onChange={(e) => sif('diplomaNo', e.target.value)} />
          </Alan>
          <Alan label="Mesleki belge no">
            <Input value={f.meslekiKayitNo} onChange={(e) => sif('meslekiKayitNo', e.target.value)} placeholder="DSP-…" />
          </Alan>
          <Alan label="İSG-KATİP kayıt no">
            <Input value={f.katipKaydi} onChange={(e) => sif('katipKaydi', e.target.value)} placeholder="KTIP-DSP-…" />
          </Alan>
          <Alan label="Belge geçerlilik tarihi">
            <Input type="date" value={f.belgeGecerlilik} onChange={(e) => sif('belgeGecerlilik', e.target.value)} />
          </Alan>
        </div>
      )}

      {!meslekiMi && (
        <div className="grid grid-cols-2 gap-3">
          <Alan label="Departman">
            <Input value={f.departman} onChange={(e) => sif('departman', e.target.value)} />
          </Alan>
          <Alan label="Pozisyon">
            <Input value={f.pozisyon} onChange={(e) => sif('pozisyon', e.target.value)} />
          </Alan>
        </div>
      )}

      <div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
          <PaperclipIcon className="size-3.5" />
          {uzmanMi ? 'Sertifika belgesi yükle' : hekimMi ? 'Diploma / sertifika yükle' : 'Belge yükle'}
          <input type="file" multiple className="hidden" onChange={ekEkle} />
        </label>
        {f.belgeler.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {f.belgeler.map((b, i) => (
              <li key={`${b.ad}-${i}`} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                <EkIkon tur={b.tur} />
                <span className="max-w-40 truncate">{b.ad}</span>
                <button
                  type="button"
                  aria-label="Kaldır"
                  onClick={() => setF((s) => ({ ...s, belgeler: s.belgeler.filter((_, x) => x !== i) }))}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <XIcon className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Bolum>
  )

  const CalismaBilgileri = (
    <Bolum harf="C" baslik="Çalışma bilgileri">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Alan label="İşe giriş tarihi *">
          <Input type="date" value={f.iseGiris} onChange={(e) => sif('iseGiris', e.target.value)} />
        </Alan>
        <Alan label="Departman">
          <Input value={f.departman} onChange={(e) => sif('departman', e.target.value)} />
        </Alan>
        <Alan label="Personel durumu">
          <Sec value={f.durum} onChange={(v) => sif('durum', v)} options={PERSONEL_DURUMLARI} />
        </Alan>
        <Alan label="Çalışma tipi">
          <Sec value={f.calismaTipi} onChange={(v) => sif('calismaTipi', v)} options={CALISMA_TIPLERI} />
        </Alan>
        <Alan label="Dahili telefon">
          <Input value={f.dahiliTel} onChange={(e) => sif('dahiliTel', e.target.value)} placeholder="12xx" />
        </Alan>
        <Alan label="Açıklama" className="col-span-2 sm:col-span-3">
          <Input value={f.aciklama} onChange={(e) => sif('aciklama', e.target.value)} placeholder="Opsiyonel not" />
        </Alan>
      </div>
    </Bolum>
  )

  const HesapBolumu = (
    <Bolum harf="D" baslik="Kullanıcı hesabı">
      {mevcutHesap ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <KeyRoundIcon className="size-4 text-muted-foreground" />
            <span className="font-medium">@{mevcutHesap.kullaniciAdi}</span>
            <span className="text-xs text-muted-foreground">
              {mevcutHesap.rol} · {mevcutHesap.durum}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Hesap yönetimi detay sayfasında</span>
        </div>
      ) : (
        <>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[[data-checked]]:border-amber-500/50 has-[[data-checked]]:bg-amber-500/5">
            <Checkbox
              checked={hesapMod !== 'yok'}
              onCheckedChange={(c) => {
                setHesapMod(c === true ? 'davet' : 'yok')
                if (c === true && !kullaniciAdi) setKullaniciAdi(oneriKul)
              }}
            />
            <span>
              <span className="font-medium">Bu personel için kullanıcı hesabı oluştur</span>
              <span className="block text-xs text-muted-foreground">
                Hesap personel kaydına bağlanır; aynı kişi için ikinci hesap açılmaz.
              </span>
            </span>
          </label>

          {hesapMod !== 'yok' && (
            <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-2 gap-3">
                <Alan label="Kullanıcı adı *">
                  <Input
                    value={kullaniciAdi || oneriKul}
                    onChange={(e) => setKullaniciAdi(e.target.value)}
                    placeholder={oneriKul || 'kullaniciadi'}
                  />
                </Alan>
                <Alan label="Hesap e-postası *">
                  <Input
                    type="email"
                    value={hesapEposta || f.eposta}
                    onChange={(e) => setHesapEposta(e.target.value)}
                  />
                </Alan>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHesapMod('davet')}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
                    hesapMod === 'davet' ? 'border-amber-500/60 bg-amber-500/10' : 'hover:border-foreground/30',
                  )}
                >
                  <MailPlusIcon className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="block text-xs font-medium">Davet bağlantısı gönder</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Personel kendi şifresini belirler (önerilen)
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHesapMod('sifre')}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
                    hesapMod === 'sifre' ? 'border-amber-500/60 bg-amber-500/10' : 'hover:border-foreground/30',
                  )}
                >
                  <LinkIcon className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="block text-xs font-medium">Şifre belirle</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Hash'lenerek saklanır, düz metin tutulmaz
                    </span>
                  </span>
                </button>
              </div>

              {hesapMod === 'sifre' && (
                <div className="grid grid-cols-2 gap-3">
                  <Alan label="Şifre *">
                    <Input type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder="En az 6 karakter" />
                  </Alan>
                  <Alan label="Şifre tekrar *">
                    <Input type="password" value={sifre2} onChange={(e) => setSifre2(e.target.value)} />
                  </Alan>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Alan label="Kullanıcı rolü">
                  <Sec
                    value={rol === 'İdari Personel' && gorevRol[f.gorev] ? (gorevRol[f.gorev] as string) : rol}
                    onChange={setRol}
                    options={ROL_ADLARI}
                  />
                </Alan>
                <Alan label="Hesap durumu">
                  <Input
                    value={hesapMod === 'davet' ? 'Davet Bekliyor' : 'Aktif'}
                    disabled
                    className="opacity-60"
                  />
                </Alan>
              </div>
            </div>
          )}
        </>
      )}
    </Bolum>
  )

  /* ------------------------- Yeni: adım adım modal ------------------------- */

  if (yeni && ac) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onKapat} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Yeni Ekip Üyesi"
          className="relative flex h-[620px] max-h-[92dvh] w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-2xl"
        >
          {/* Sol adım rayı */}
          <div className="relative flex w-56 shrink-0 flex-col overflow-hidden border-r bg-[#111214] bg-cover bg-[center_68%] text-white before:absolute before:inset-0 before:bg-black/75" style={{ backgroundImage: "url('/images/firma-wizard-sidebar.png')" }}>
            <div className="relative z-10 border-b border-white/10 px-4 py-4">
              <div className="text-[14px] font-semibold tracking-tight">Yeni ekip üyesi</div>
              <p className="mt-0.5 text-[11px] text-white/60">Adım adım personel kaydı</p>
            </div>
            <nav className="relative z-10 flex-1 space-y-0.5 overflow-y-auto p-2">
              {ADIMLAR.map((a, i) => {
                const aktif = i === adim
                const gecti = i < adim
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => i <= adim && setAdim(i)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors',
                      aktif
                        ? 'bg-white/10 text-white'
                        : gecti
                          ? 'text-white/85 hover:bg-white/5'
                          : 'cursor-default text-white/45',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                        aktif
                          ? 'bg-amber-500 text-zinc-950'
                          : gecti
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-white/50',
                      )}
                    >
                      {gecti ? <CheckIcon className="size-3.5" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium">{a.baslik}</span>
                      <span className="block truncate text-[10.5px] text-white/50">{a.aciklama}</span>
                    </span>
                  </button>
                )
              })}
            </nav>
            <div className="relative z-10 border-t border-white/10 p-3">
              <div className="mb-1.5 flex justify-between text-[10.5px] text-white/60">
                <span>İlerleme</span>
                <span>
                  {adim + 1}/{ADIMLAR.length}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${((adim + 1) / ADIMLAR.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sağ içerik */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div className="text-[13px] font-semibold">
                {ADIMLAR[adim].baslik}
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  Adım {adim + 1} / {ADIMLAR.length}
                </span>
              </div>
              <button
                type="button"
                onClick={onKapat}
                aria-label="Kapat"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {hataKutusu}
              {adim === 0 && KisiselBilgiler}
              {adim === 1 && GorevBilgileri}
              {adim === 2 && CalismaBilgileri}
              {adim === 3 && (
                <>
                  {HesapBolumu}
                  <div className="rounded-lg border bg-muted/30 px-3.5 py-3 text-[12px]">
                    <div className="mb-1.5 font-medium text-muted-foreground">Kayıt özeti</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span><b>{f.ad || '—'} {f.soyad}</b> {f.unvanOnek && `(${f.unvanOnek})`}</span>
                      <span className="text-muted-foreground">{f.gorev}{uzmanMi ? ` · ${f.uzmanSinifi} Sınıfı` : ''}{hekimMi && f.brans ? ` · ${f.brans}` : ''}</span>
                      <span className="text-muted-foreground">{f.eposta || '—'}</span>
                      <span className="text-muted-foreground">
                        {hesapMod === 'yok' ? 'Hesap oluşturulmayacak' : hesapMod === 'davet' ? 'Davet gönderilecek' : 'Hesap aktif açılacak'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 border-t px-5 py-3">
              <Button variant="ghost" size="sm" onClick={onKapat}>
                Vazgeç
              </Button>
              <div className="ml-auto flex items-center gap-2">
                {adim > 0 && (
                  <Button variant="outline" size="sm" onClick={() => { setHata([]); setAdim((a) => a - 1) }}>
                    <ChevronLeftIcon className="size-4" /> Geri
                  </Button>
                )}
                {adim < ADIMLAR.length - 1 ? (
                  <Button size="sm" onClick={ileri}>
                    İleri <ChevronRightIcon className="size-4" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={kaydet}>
                    <CheckIcon className="size-4" /> Personeli Kaydet
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------------------- Düzenleme: drawer -------------------------- */

  return (
    <Sheet open={ac} onOpenChange={(a) => !a && onKapat()}>
      <SheetContent className="w-full max-w-2xl gap-0 p-0" aria-describedby={undefined}>
        <div className="border-b px-5 py-4">
          <SheetTitle className="text-lg">{`${mevcut?.ad ?? ''} ${mevcut?.soyad ?? ''} — Düzenle`}</SheetTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Personel kaydı, mesleki bilgiler ve kullanıcı hesabı tek formda
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
          {hataKutusu}
          {KisiselBilgiler}
          {GorevBilgileri}
          {CalismaBilgileri}
          {HesapBolumu}
        </div>

        <div className="flex items-center gap-2 border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onKapat}>
            Vazgeç
          </Button>
          <div className="ml-auto">
            <Button size="sm" onClick={kaydet}>
              Değişiklikleri Kaydet
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
