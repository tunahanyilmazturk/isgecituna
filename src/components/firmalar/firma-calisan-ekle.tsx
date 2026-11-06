import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, EyeIcon, EyeOffIcon, RefreshCwIcon, UserPlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alan } from '@/components/form-bits'
import { cn } from '@/lib/utils'
import { kullaniciOner, rastgeleSifreUret, VARSAYILAN_SIFRE } from '@/lib/kullanici-adi'
import { TODAY } from '@/data/dashboard'
import { personelAd, usePersonelStore } from '@/stores/personeller-store'
import { useAyarlarStore } from '@/stores/ayarlar-store'

const INPUT = 'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

interface Props {
  firmaId: string
  firmaUnvan: string
  kullanici: string
  hesapIzni: boolean
  onKapat: () => void
}

/**
 * Firma portalında çalışan ekleme — OSGB panelindeki “Yeni personel” formuyla aynı akış:
 * 1) Kişi & giriş hesabı  2) Görev & kayıt
 */
export function FirmaCalisanEkle({ firmaId, firmaUnvan, kullanici, hesapIzni, onKapat }: Props) {
  const { personelEkle, hesapOlustur, kullaniciAlinmi, epostaAlinmi } = usePersonelStore()
  const logEkle = useAyarlarStore((s) => s.logEkle)
  const [adim, setAdim] = useState(0)
  const [f, setF] = useState({
    ad: '',
    soyad: '',
    eposta: '',
    telefon: '',
    tc: '',
    departman: '',
    gorev: '',
    sicilNo: '',
    iseGiris: TODAY,
  })
  const [hesapAcik, setHesapAcik] = useState(false)
  // Kullanıcı adı ad/soyaddan türer; elle değiştirilirse o değer kullanılır.
  const [kulManuel, setKulManuel] = useState<string | null>(null)
  const kul = kulManuel ?? kullaniciOner(f.ad, f.soyad)
  const [sifre, setSifre] = useState(VARSAYILAN_SIFRE)
  const [sifreTekrar, setSifreTekrar] = useState(VARSAYILAN_SIFRE)
  const [sifreGoster, setSifreGoster] = useState(true)

  const hesaAktif = hesapIzni && hesapAcik

  const kisiHatasi = (): string | null => {
    if (!f.ad.trim() || !f.soyad.trim()) return 'Ad ve soyad zorunlu'
    if (f.eposta.trim() && epostaAlinmi(f.eposta.trim())) return 'Bu e-posta başka bir kayıtta kullanılıyor'
    return null
  }

  const hesapHatasi = (): string | null => {
    if (!hesaAktif) return null
    if (!kul.trim()) return 'Kullanıcı adı zorunlu'
    if (kullaniciAlinmi(kul.trim())) return 'Bu kullanıcı adı zaten kullanılıyor'
    if (sifre.length < 6) return 'Şifre en az 6 karakter olmalı'
    if (sifre !== sifreTekrar) return 'Şifreler eşleşmiyor'
    return null
  }

  const ileri = () => {
    const h = kisiHatasi() ?? hesapHatasi()
    if (h) return toast.error(h)
    setAdim(1)
  }

  const kaydet = () => {
    const kisi = kisiHatasi()
    if (kisi) {
      setAdim(0)
      return toast.error(kisi)
    }
    const hesap = hesapHatasi()
    if (hesap) {
      setAdim(0)
      return toast.error(hesap)
    }
    const p = personelEkle({
      firmaId,
      ad: f.ad.trim(),
      soyad: f.soyad.trim(),
      eposta: f.eposta.trim(),
      telefon: f.telefon.trim(),
      tc: f.tc.trim(),
      departman: f.departman.trim(),
      gorev: f.gorev.trim(),
      sicilNo: f.sicilNo.trim(),
      durum: 'Aktif',
      not: `İşe giriş: ${f.iseGiris} · ${kullanici} tarafından firma portalından eklendi`,
    })
    let hesapNot = ''
    if (hesaAktif) {
      try {
        hesapOlustur(p.id, kul.trim(), 'sifre', sifre)
        hesapNot = ` · giriş hesabı açıldı (@${kul.trim()})`
      } catch (e) {
        hesapNot = ` · hesap açılamadı: ${(e as Error).message}`
      }
    }
    logEkle({ tarih: new Date().toISOString(), kullanici, islem: 'Çalışan eklendi (firma portalı)', kayit: `${personelAd(p)} · ${firmaUnvan}` })
    toast.success(`${personelAd(p)} eklendi${hesapNot}`)
    onKapat()
  }

  const adimlar = [
    { baslik: 'Kişi & giriş hesabı', aciklama: 'İletişim ve isteğe bağlı giriş hesabı' },
    { baslik: 'Görev & kayıt', aciklama: 'Çalışma bilgileri' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onKapat}>
      <div className="flex max-h-[90dvh] w-full max-w-xl flex-col rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold">Yeni çalışan</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{firmaUnvan} — firma otomatik atanır · Adım {adim + 1} / 2</p>
          <div className="mt-3 flex gap-2">
            {adimlar.map((a, i) => (
              <button
                key={a.baslik}
                type="button"
                disabled={i > adim}
                onClick={() => i < adim && setAdim(i)}
                className={cn(
                  'flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs',
                  i === adim ? 'border-amber-500/60 bg-amber-500/5' : 'text-muted-foreground',
                  i > adim && 'opacity-50',
                )}
              >
                <span className={cn('grid size-5 place-items-center rounded-full text-[10px] font-semibold', i < adim ? 'bg-emerald-500 text-white' : i === adim ? 'bg-amber-400 text-zinc-950' : 'bg-muted')}>
                  {i < adim ? <CheckIcon className="size-3" /> : i + 1}
                </span>
                <span>
                  <span className="block font-medium">{a.baslik}</span>
                  <span className="block text-[10px] text-muted-foreground">{a.aciklama}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {adim === 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Alan label="Ad *"><input value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} className={INPUT} /></Alan>
                <Alan label="Soyad *"><input value={f.soyad} onChange={(e) => setF({ ...f, soyad: e.target.value })} className={INPUT} /></Alan>
                <Alan label="E-posta">
                  <input type="email" value={f.eposta} onChange={(e) => setF({ ...f, eposta: e.target.value })} className={cn(INPUT, f.eposta && epostaAlinmi(f.eposta) && 'border-red-500')} />
                  {f.eposta && epostaAlinmi(f.eposta) && <p className="mt-1 text-[11px] text-red-500">Bu e-posta kayıtlı</p>}
                </Alan>
                <Alan label="Telefon"><input value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} className={INPUT} /></Alan>
                <Alan label="TCKN (opsiyonel)">
                  <input value={f.tc} onChange={(e) => setF({ ...f, tc: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="11 haneli" className={INPUT} />
                </Alan>
              </div>

              {hesapIzni && (
                <div className="space-y-3 rounded-xl border p-4">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <Checkbox checked={hesapAcik} onCheckedChange={(v) => setHesapAcik(!!v)} />
                    <span>
                      <span className="block text-sm font-medium">Giriş hesabı oluştur</span>
                      <span className="block text-xs text-muted-foreground">Çalışan bu kullanıcı adı ve şifre ile portala girer.</span>
                    </span>
                  </label>
                  {hesapAcik && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Alan label="Kullanıcı adı *">
                          <input value={kul} onChange={(e) => setKulManuel(e.target.value.replace(/\s/g, ''))} placeholder="ad.soyad" className={INPUT} />
                          {kul && kullaniciAlinmi(kul.trim()) && <p className="mt-1 text-xs text-red-500">Bu kullanıcı adı zaten kullanılıyor</p>}
                        </Alan>
                        <div className="hidden sm:block" />
                        <Alan label="Şifre *">
                          <div className="flex gap-1.5">
                            <input type={sifreGoster ? 'text' : 'password'} autoComplete="new-password" value={sifre} onChange={(e) => setSifre(e.target.value)} className={cn(INPUT, 'min-w-0 flex-1 font-mono')} />
                            <button type="button" aria-label={sifreGoster ? 'Şifreyi gizle' : 'Şifreyi göster'} onClick={() => setSifreGoster((s) => !s)} className="flex size-9 shrink-0 items-center justify-center rounded-lg border hover:bg-muted">
                              {sifreGoster ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                            </button>
                            <button type="button" onClick={() => { const s = rastgeleSifreUret(); setSifre(s); setSifreTekrar(s); setSifreGoster(true) }} className="flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs hover:bg-muted">
                              <RefreshCwIcon className="size-3.5" /> Rastgele
                            </button>
                          </div>
                        </Alan>
                        <Alan label="Şifre tekrar *">
                          <input type={sifreGoster ? 'text' : 'password'} autoComplete="new-password" value={sifreTekrar} onChange={(e) => setSifreTekrar(e.target.value)} className={cn(INPUT, 'font-mono')} />
                        </Alan>
                      </div>
                      <p className="rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">Şifreyi çalışana iletin. Çalışan ilk girişte değiştirebilir.</p>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Alan label="Departman"><input value={f.departman} onChange={(e) => setF({ ...f, departman: e.target.value })} className={INPUT} /></Alan>
              <Alan label="Görev / meslek"><input value={f.gorev} onChange={(e) => setF({ ...f, gorev: e.target.value })} className={INPUT} /></Alan>
              <Alan label="Çalışan numarası"><input value={f.sicilNo} onChange={(e) => setF({ ...f, sicilNo: e.target.value })} className={INPUT} /></Alan>
              <Alan label="İşe giriş tarihi"><input type="date" value={f.iseGiris} onChange={(e) => setF({ ...f, iseGiris: e.target.value })} className={INPUT} /></Alan>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-5 py-3.5">
          <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
          <div className="flex gap-2">
            {adim === 1 && (
              <Button variant="outline" onClick={() => setAdim(0)}><ArrowLeftIcon /> Geri</Button>
            )}
            {adim === 0 ? (
              <Button disabled={!f.ad.trim() || !f.soyad.trim()} onClick={ileri}>Devam et <ArrowRightIcon /></Button>
            ) : (
              <Button onClick={kaydet}><UserPlusIcon /> Çalışanı ekle</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
