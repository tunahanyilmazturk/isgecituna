import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldAlertIcon,
  LockKeyholeIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { selectCls } from '@/components/olaylar/olay-form-utils'
import { AyarBaslik } from '@/components/ayarlar/settings-bits'
import {
  hesapGorunenAd,
  type KullaniciHesap,
} from '@/data/ekip'
import {
  IZIN_MODULLERI,
  KAPSAM_SECENEKLERI,
  izinKey,
  type KapsamTipi,
} from '@/data/permissions'
import { hesapIzinleri, useIzin } from '@/lib/izin'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { cn } from '@/lib/utils'

export default function IzinlerPage() {
  const { uyeler, hesaplar, izinleriKaydet, kapsamKaydet } = useEkipStore()
  const { logEkle } = useAyarlarStore()
  const { firmalar } = useFirmalarStore()
  const { user } = useAuthStore()
  const yonetebilir = useIzin('ayarlar.izin-yonet')
  const [params] = useSearchParams()

  const [hesapId, setHesapId] = useState(params.get('hesap') ?? hesaplar[0]?.id ?? '')
  const hesap = hesaplar.find((h) => h.id === hesapId)

  // Taslak izin/kapsam durumu — kaydetmeden önce serbestçe düzenlenebilir
  const [taslak, setTaslak] = useState<Set<string> | null>(null)
  const [taslakKapsam, setTaslakKapsam] = useState<NonNullable<KullaniciHesap['kapsam']> | null>(null)
  const [ara, setAra] = useState('')
  const [acikModuller, setAcikModuller] = useState<Set<string>>(new Set(IZIN_MODULLERI.map((m) => m.key)))
  const [kopyala, setKopyala] = useState('')

  const secili = useMemo(() => taslak ?? new Set(hesap ? hesapIzinleri(hesap) : []), [taslak, hesap])
  const kapsam = taslakKapsam ?? hesap?.kapsam ?? {}
  const tumSayi = IZIN_MODULLERI.reduce((n, m) => n + m.izinler.length, 0)
  const seciliSayi = secili.has('*') ? tumSayi : secili.size
  const kendiHesabi = Boolean(hesap && user?.username === hesap.kullaniciAdi)
  const izinlerDegisti = taslak !== null && [...secili].sort().join('|') !== [...hesapIzinleri(hesap!).sort()].join('|')
  const kapsamDegisti = taslakKapsam !== null && JSON.stringify(kapsam) !== JSON.stringify(hesap?.kapsam ?? {})
  const degisti = izinlerDegisti || kapsamDegisti

  const sec = (h: KullaniciHesap) => {
    setHesapId(h.id)
    setTaslak(null)
    setTaslakKapsam(null)
    setAra('')
  }

  const toggle = (key: string) => {
    const yeni = new Set(secili)
    yeni.delete('*')
    if (yeni.has(key)) yeni.delete(key)
    else yeni.add(key)
    setTaslak(yeni)
  }

  const modulToggle = (tumIzinler: string[]) => {
    const yeni = new Set(secili)
    yeni.delete('*')
    const hepsiSecili = tumIzinler.every((k) => yeni.has(k))
    if (hepsiSecili) tumIzinler.forEach((k) => yeni.delete(k))
    else tumIzinler.forEach((k) => yeni.add(k))
    setTaslak(yeni)
  }

  const filtreliModuller = IZIN_MODULLERI.map((m) => ({
    ...m,
    izinler: m.izinler.filter(
      (i) =>
        !ara ||
        m.label.toLowerCase().includes(ara.toLowerCase()) ||
        i.label.toLowerCase().includes(ara.toLowerCase()) ||
        `${m.key}.${i.k}`.includes(ara.toLowerCase()),
    ),
  })).filter((m) => m.izinler.length > 0)

  const kaydet = () => {
    if (!hesap || kendiHesabi || !yonetebilir) return
    const eskiSayi = hesapIzinleri(hesap).includes('*') ? 'tümü' : String(hesapIzinleri(hesap).length)
    izinleriKaydet(hesap.id, secili.has('*') ? ['*'] : [...secili])
    if (kapsamDegisti && taslakKapsam) kapsamKaydet(hesap.id, taslakKapsam)
    logEkle({
      tarih: new Date().toISOString(),
      kullanici: user?.username ?? 'sistem',
      islem: 'İzinler güncellendi',
      kayit: `${hesap.kullaniciAdi} · ${hesap.eposta}`,
      eski: `${eskiSayi} izin`,
      yeni: `${seciliSayi} izin`,
    })
    setTaslak(null)
    setTaslakKapsam(null)
    toast.success('İzinler kaydedildi', { description: `${hesapGorunenAd(hesap, uyeler)} · ${seciliSayi} izin` })
  }

  const geriAl = () => {
    setTaslak(null)
    setTaslakKapsam(null)
  }

  if (!yonetebilir) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AyarBaslik baslik="Erişim İzinleri" aciklama="Kullanıcı erişimlerini ve kayıt kapsamlarını yönetin." />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600"><LockKeyholeIcon className="size-5" /></div>
            <h2 className="text-base font-semibold">Bu alan için yetkiniz yok</h2>
            <p className="mt-2 text-sm text-muted-foreground">Erişim izinlerini görüntülemek ve düzenlemek için “İzin yönetimi” yetkisi gerekir.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AyarBaslik
        baslik="Erişim İzinleri"
        aciklama="Kullanıcıların modül izinlerini ve hangi firma kayıtlarına erişebileceklerini yönetin."
      />

      {/* Kullanıcı seçimi + ara */}
      <div className="flex flex-wrap items-center gap-2 border-t px-6 py-3">
        <div className="relative">
          <select
            value={hesapId}
            onChange={(e) => {
              const h = hesaplar.find((x) => x.id === e.target.value)
              if (h) sec(h)
            }}
            className={cn(selectCls, 'h-9 w-64 pr-7 text-[12.5px]')}
          >
            {hesaplar.map((h) => (
              <option key={h.id} value={h.id}>
                {hesapGorunenAd(h, uyeler)} · @{h.kullaniciAdi}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        {hesap && (
          <div className="flex min-w-0 items-center gap-2 rounded-xl border bg-card px-3 py-1.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-700 dark:text-amber-300">{hesapGorunenAd(hesap, uyeler).split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase()}</span>
            <span className="min-w-0"><span className="block truncate text-xs font-semibold">{hesapGorunenAd(hesap, uyeler)}</span><span className="block truncate text-[10px] text-muted-foreground">{hesap.rol} · @{hesap.kullaniciAdi}</span></span>
            <Badge variant="secondary" className="ml-1 text-[10px]">{hesap.durum}</Badge>
          </div>
        )}
        <div className="relative ml-auto w-56">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="İzin ara…" className="h-8 pl-8" />
        </div>
      </div>

      {/* Özet çubuğu */}
      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/15 px-6 py-2.5">
        <span className="text-[12px] text-muted-foreground">
          <b className="text-foreground">{secili.has('*') ? 'Tümü' : `${seciliSayi}/${tumSayi}`}</b> izin seçili
          {hesap?.izinler === undefined && !taslak && ' (rol şablonundan)'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <select
              value={kopyala}
              onChange={(e) => setKopyala(e.target.value)}
              className={cn(selectCls, 'h-8 w-48 pr-7 text-[12px]')}
            >
              <option value="">Başkasından kopyala…</option>
              {hesaplar
                .filter((h) => h.id !== hesapId)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {hesapGorunenAd(h, uyeler)}
                  </option>
                ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!kopyala || kendiHesabi}
            onClick={() => {
              const kaynak = hesaplar.find((h) => h.id === kopyala)
              if (kaynak) {
                setTaslak(new Set(hesapIzinleri(kaynak)))
                setTaslakKapsam({ ...(kaynak.kapsam ?? {}) })
                setKopyala('')
                toast.info(`İzinler ${hesapGorunenAd(kaynak, uyeler)} kullanıcısından kopyalandı — kaydetmeyi unutmayın`)
              }
            }}
          >
            <CopyIcon className="size-3.5" /> Kopyala
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={kendiHesabi}
            onClick={() => setTaslak(new Set(IZIN_MODULLERI.flatMap((m) => m.izinler.map((i) => izinKey(m.key, i.k)))))}
          >
            Tümünü seç
          </Button>
          <Button variant="ghost" size="sm" className="h-8" disabled={kendiHesabi} onClick={() => setTaslak(new Set())}>
            Temizle
          </Button>
          {degisti && (
            <Button variant="ghost" size="sm" className="h-8" onClick={geriAl}>
              <RotateCcwIcon className="size-3.5" /> Geri al
            </Button>
          )}
          <Button size="sm" className="h-8" disabled={!degisti} onClick={kaydet}>
            <CheckIcon className="size-3.5" /> Kaydet ({seciliSayi})
          </Button>
        </div>
      </div>

      {!hesap ? (
        <div className="border-t px-6 py-12 text-center text-muted-foreground">Hesap seçilmedi.</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto border-t">
          {kendiHesabi && (
            <div className="m-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-xs text-muted-foreground">
              <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
              Kendi hesabınızın izinlerini buradan değiştiremezsiniz. Güvenlik için yetkiler başka bir yönetici tarafından düzenlenmelidir.
            </div>
          )}
          {hesap.durum !== 'Aktif' && (
            <div className="m-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-400">
              <ShieldAlertIcon className="size-4" />
              Hesap şu an "{hesap.durum}" — izinler tanımlansa da aktif hesap olmadan giriş yapılamaz.
            </div>
          )}

          {filtreliModuller.map((m) => {
            const tumKeyler = m.izinler.map((i) => izinKey(m.key, i.k))
            const seciliModul = tumKeyler.filter((k) => secili.has('*') || secili.has(k)).length
            const hepsi = seciliModul === tumKeyler.length
            const kismi = seciliModul > 0 && !hepsi
            const acik = acikModuller.has(m.key)
            return (
              <div key={m.key} className="border-b border-border/60">
                <button
                  type="button"
                  onClick={() =>
                    setAcikModuller((s) => {
                      const y = new Set(s)
                      if (y.has(m.key)) y.delete(m.key)
                      else y.add(m.key)
                      return y
                    })
                  }
                  className="flex w-full items-center gap-3 px-6 py-2.5 text-left transition-colors hover:bg-muted/40"
                >
                  <ChevronDownIcon className={cn('size-4 text-muted-foreground transition-transform', !acik && '-rotate-90')} />
                  <span className="text-[13px] font-semibold">{m.label}</span>
                  <span className={cn(
                    'text-[11px] font-medium',
                    hepsi ? 'text-emerald-600 dark:text-emerald-400' : kismi ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                  )}>
                    {seciliModul}/{tumKeyler.length}
                  </span>
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto flex cursor-pointer items-center gap-2 text-[11.5px] text-muted-foreground"
                  >
                    <Checkbox
                      checked={hepsi}
                      indeterminate={kismi}
                      disabled={kendiHesabi}
                      onCheckedChange={() => modulToggle(tumKeyler)}
                    />
                    Tümü
                  </label>
                </button>

                {acik && (
                  <div className="px-6 pb-3 pl-13">
                    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                      {m.izinler.map((i) => {
                        const key = izinKey(m.key, i.k)
                        const on = secili.has('*') || secili.has(key)
                        return (
                          <label
                            key={key}
                            className={cn(
                              'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] transition-colors',
                              on ? 'border-amber-500/35 bg-amber-500/5' : 'border-transparent hover:bg-muted/40',
                            )}
                          >
                            <Checkbox checked={on} disabled={kendiHesabi} onCheckedChange={() => toggle(key)} />
                            <span>
                              <span className="block">{i.label}</span>
                              <span className="block font-mono text-[10px] text-muted-foreground">{key}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>

                    {/* Kayıt erişim kapsamı */}
                    {m.kapsam && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <span className="text-[11.5px] font-medium text-muted-foreground">Kayıt erişim kapsamı:</span>
                        <div className="relative">
                          <select
                            value={kapsam[m.key]?.tip ?? 'tumu'}
                            disabled={kendiHesabi}
                            onChange={(e) =>
                              setTaslakKapsam({
                                ...kapsam,
                                [m.key]: { ...kapsam[m.key], tip: e.target.value as KapsamTipi, firmalar: kapsam[m.key]?.firmalar },
                              })
                            }
                            className={cn(selectCls, 'h-7 w-52 pr-7 text-[11.5px]')}
                          >
                            {KAPSAM_SECENEKLERI.map((k) => (
                              <option key={k.key} value={k.key}>{k.label}</option>
                            ))}
                          </select>
                          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        {kapsam[m.key]?.tip === 'secili' && (
                          <div className="flex flex-wrap items-center gap-1">
                            {firmalar.map((f) => {
                              const on = kapsam[m.key]?.firmalar?.includes(f.id)
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  disabled={kendiHesabi}
                                  onClick={() => {
                                    const cur = kapsam[m.key]?.firmalar ?? []
                                    setTaslakKapsam({
                                      ...kapsam,
                                      [m.key]: {
                                        tip: 'secili',
                                        firmalar: on ? cur.filter((x) => x !== f.id) : [...cur, f.id],
                                      },
                                    })
                                  }}
                                  className={cn(
                                    'rounded-full border px-2 py-0.5 text-[10.5px] transition-colors',
                                    on ? 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300' : 'text-muted-foreground hover:border-foreground/30',
                                  )}
                                >
                                  {f.kisaAd ?? f.unvan}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filtreliModuller.length === 0 && (
            <div className="px-6 py-12 text-center text-muted-foreground">"{ara}" ile eşleşen izin bulunamadı.</div>
          )}

          <div className="px-6 py-4 text-[11px] text-muted-foreground">
            Not: İzin denetimi arayüzde gösterimi belirler; aynı kontroller API/backend katmanında da zorunlu olarak uygulanmalıdır.
            Kullanıcılar kendi izinlerini yükseltemez — bu sayfa yalnızca `ayarlar.izin-yonet` yetkisi olanlara açılmalıdır.
          </div>
        </div>
      )}
    </div>
  )
}
