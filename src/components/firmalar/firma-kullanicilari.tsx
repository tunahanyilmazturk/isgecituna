import { useState } from 'react'
import { toast } from 'sonner'
import {
  GraduationCapIcon,
  KeyRoundIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PowerIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Alan } from '@/components/form-bits'
import { cn } from '@/lib/utils'
import { rastgeleSifre } from '@/lib/toplu'
import { sifreHashle } from '@/data/ekip'
import {
  FIRMA_IZINLERI,
  yetkiliDurumRenk,
  type FirmaYetkili,
  type YetkiliDurum,
} from '@/data/firma-portal'
import type { Firma } from '@/data/firmalar'
import { useFirmaPortalStore } from '@/stores/firma-portal-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useAuthStore } from '@/stores/auth-store'
import { useIzin } from '@/lib/izin'

/** Firma portalı özeti — yetkili/çalışan/atama/sertifika sayıları tek bakışta */
function PortalOzeti({ firmaId }: { firmaId: string }) {
  // Selector'larda filtreleme yapılmaz — yeni dizi referansı sonsuz render tetikler
  const yetkiliAll = useFirmaPortalStore((s) => s.yetkililer)
  const personelAll = usePersonelStore((s) => s.personeller)
  const atamaAll = usePersonelStore((s) => s.atamalar)
  const sertifikaAll = useSertifikaStore((s) => s.sertifikalar)
  const ilerlemeler = useEgitimlerStore((s) => s.ilerlemeler)
  const yetkililer = yetkiliAll.filter((y) => y.firmaId === firmaId)
  const personeller = personelAll.filter((p) => p.firmaId === firmaId)
  const atamalar = atamaAll.filter((a) => a.firmaId === firmaId && a.durum === 'Aktif')
  const sertifikalar = sertifikaAll.filter((x) => x.firmaId === firmaId)
  const pids = new Set(personeller.map((p) => p.id))
  const tamam = ilerlemeler.filter((i) => pids.has(i.hesapId) && i.durum === 'Tamamlandı').length
  const kayit = ilerlemeler.filter((i) => pids.has(i.hesapId)).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {[
        { label: 'Firma çalışanı', deger: personeller.length, ikon: UsersIcon },
        { label: 'Yetkili kullanıcı', deger: yetkililer.length, ikon: ShieldCheckIcon },
        { label: 'Aktif atama', deger: atamalar.length, ikon: GraduationCapIcon },
        { label: 'Tamamlanma', deger: kayit ? `%${Math.round((tamam / kayit) * 100)}` : '—' },
        { label: 'Sertifika', deger: sertifikalar.length },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border bg-card p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            {s.ikon && <s.ikon className="size-3.5 text-muted-foreground/50" />}
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums">{s.deger}</p>
        </div>
      ))}
    </div>
  )
}

const bosForm = {
  ad: '',
  soyad: '',
  eposta: '',
  telefon: '',
  gorev: '',
  kullaniciAdi: '',
  yontem: 'davet' as 'davet' | 'sifre',
}

/** Firma Kullanıcıları — firma yetkilisi hesaplarının tam yaşam döngüsü */
export function FirmaKullanicilariTab({ firma }: { firma: Firma }) {
  const {
    yetkililer,
    yetkiliDurum,
    davetYenile,
    sifreSifirla,
    oturumKapat,
    izinKaydet,
    kullaniciAlinmi,
  } = useFirmaPortalStore()
  const duzenleIzni = useIzin('firmalar.duzenle')
  const admin = useAuthStore((s) => s.user?.name ?? 'OSGB Yöneticisi')

  const liste = yetkililer.filter((y) => y.firmaId === firma.id)
  const [formAcik, setFormAcik] = useState(false)
  const [duzenlenen, setDuzenlenen] = useState<FirmaYetkili | null>(null)
  const [izinAcik, setIzinAcik] = useState<FirmaYetkili | null>(null)

  const durumAksiyon = (y: FirmaYetkili, d: YetkiliDurum) => {
    yetkiliDurum(y.id, d, admin)
    toast.success(`${y.ad} ${y.soyad} → ${d}`)
  }

  return (
    <div className="space-y-4">
      <PortalOzeti firmaId={firma.id} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {liste.length} yetkili kullanıcı — her biri kendi izin setiyle firma portalına girer
        </p>
        {duzenleIzni && (
          <Button size="sm" onClick={() => setFormAcik(true)}>
            <UserPlusIcon /> Yetkili ekle
          </Button>
        )}
      </div>

      {liste.length === 0 ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
          <UsersIcon className="size-7 text-muted-foreground/40" />
          <p className="text-sm font-medium">Bu firmaya ait yetkili kullanıcı yok</p>
          <p className="text-xs text-muted-foreground">
            Firma portalı kullanıcıları buradan oluşturulur ve davet edilir.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b bg-muted/40 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-3.5 py-2.5">Yetkili</th>
                <th className="px-3.5 py-2.5">Görev</th>
                <th className="px-3.5 py-2.5">Kullanıcı adı</th>
                <th className="px-3.5 py-2.5">Son giriş</th>
                <th className="px-3.5 py-2.5">Oturum</th>
                <th className="px-3.5 py-2.5">Durum</th>
                <th className="px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {liste.map((y) => (
                <tr key={y.id} className="hover:bg-muted/30">
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[11px] font-bold text-amber-600">
                        {y.ad[0]}{y.soyad[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{y.ad} {y.soyad}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{y.eposta}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-muted-foreground">{y.gorev || '—'}</td>
                  <td className="px-3.5 py-2.5 font-mono text-xs text-muted-foreground">@{y.kullaniciAdi}</td>
                  <td className="px-3.5 py-2.5 text-muted-foreground tabular-nums">
                    {y.sonGiris?.slice(0, 16).replace('T', ' ') ?? '—'}
                  </td>
                  <td className="px-3.5 py-2.5 text-muted-foreground tabular-nums">{y.oturumlar.length}</td>
                  <td className="px-3.5 py-2.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', yetkiliDurumRenk[y.durum])}>
                      {y.durum}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {duzenleIzni && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                              <MoreHorizontalIcon className="size-4" />
                            </button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => setDuzenlenen(y)}>
                            <PencilIcon /> Bilgileri düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIzinAcik(y)}>
                            <ShieldCheckIcon /> Yetkileri düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              const t = davetYenile(y.id, admin)
                              navigator.clipboard.writeText(`${location.origin}/davet/${t}`)
                              toast.success('Davet bağlantısı yenilendi ve kopyalandı')
                            }}
                          >
                            <LinkIcon /> Daveti yenile / kopyala
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              sifreSifirla(y.id, admin)
                              const g = useFirmaPortalStore.getState().yetkililer.find((x) => x.id === y.id)
                              if (g?.davetToken) {
                                navigator.clipboard.writeText(`${location.origin}/davet/${g.davetToken}`)
                                toast.success('Şifre sıfırlandı — yeni davet bağlantısı kopyalandı')
                              }
                            }}
                          >
                            <KeyRoundIcon /> Şifre sıfırla
                          </DropdownMenuItem>
                          {y.oturumlar.length > 0 && (
                            <DropdownMenuItem
                              onClick={() => {
                                y.oturumlar.forEach((o) => oturumKapat(y.id, o.id, admin))
                                toast.success('Aktif oturumlar sonlandırıldı')
                              }}
                            >
                              <XCircleIcon /> Oturumları sonlandır
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {y.durum === 'Aktif' ? (
                            <DropdownMenuItem onClick={() => durumAksiyon(y, 'Askıda')}>
                              <PowerIcon /> Hesabı askıya al
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => durumAksiyon(y, 'Aktif')}>
                              <PowerIcon /> Hesabı aktifleştir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formAcik && (
        <YetkiliForm firma={firma} kullaniciAlinmi={kullaniciAlinmi} admin={admin} onKapat={() => setFormAcik(false)} />
      )}
      {duzenlenen && (
        <YetkiliForm firma={firma} mevcut={duzenlenen} kullaniciAlinmi={kullaniciAlinmi} admin={admin} onKapat={() => setDuzenlenen(null)} />
      )}
      {izinAcik && <IzinDrawer y={izinAcik} onKaydet={(iz) => izinKaydet(izinAcik.id, iz, admin)} onKapat={() => setIzinAcik(null)} />}
    </div>
  )
}

/* ------------------------------ Form drawer ------------------------------ */

function YetkiliForm({
  firma,
  mevcut,
  kullaniciAlinmi,
  admin,
  onKapat,
}: {
  firma: Firma
  mevcut?: FirmaYetkili
  kullaniciAlinmi: (k: string) => boolean
  admin: string
  onKapat: () => void
}) {
  const { yetkiliEkle, yetkiliGuncelle } = useFirmaPortalStore()
  const [f, setF] = useState(() =>
    mevcut
      ? { ad: mevcut.ad, soyad: mevcut.soyad, eposta: mevcut.eposta, telefon: mevcut.telefon, gorev: mevcut.gorev, kullaniciAdi: mevcut.kullaniciAdi, yontem: 'davet' as const }
      : bosForm,
  )
  const [izinler, setIzinler] = useState<string[]>(mevcut?.izinler ?? ['calisan.goruntule', 'egitim.goruntule', 'egitim.ilerleme', 'sertifika.goruntule', 'firma.goruntule'])
  const gecici = rastgeleSifre()
  const gecerli = f.ad.trim() && f.soyad.trim() && f.kullaniciAdi.trim()
  const kulCakisiyor = f.kullaniciAdi && f.kullaniciAdi !== mevcut?.kullaniciAdi && kullaniciAlinmi(f.kullaniciAdi)

  const kaydet = () => {
    if (mevcut) {
      yetkiliGuncelle(mevcut.id, { ...f, izinler }, 'Bilgiler güncellendi', admin)
      toast.success('Yetkili güncellendi')
      return onKapat()
    }
    yetkiliEkle(
      {
        firmaId: firma.id,
        ad: f.ad.trim(),
        soyad: f.soyad.trim(),
        eposta: f.eposta.trim(),
        telefon: f.telefon.trim(),
        gorev: f.gorev.trim(),
        kullaniciAdi: f.kullaniciAdi.trim(),
        sifreHash: f.yontem === 'sifre' ? sifreHashle(gecici) : undefined,
        sifreDegisimZorunlu: f.yontem === 'sifre',
        davetToken: f.yontem === 'davet' ? `dvt-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}` : undefined,
        davetBitis: f.yontem === 'davet' ? new Date(Date.now() + 7 * 86400000).toISOString() : undefined,
        durum: f.yontem === 'davet' ? 'Davet Bekliyor' : 'Aktif',
        izinler,
      },
      admin,
    )
    const yeni = useFirmaPortalStore.getState().yetkililer[0]
    if (f.yontem === 'davet' && yeni?.davetToken) {
      navigator.clipboard.writeText(`${location.origin}/davet/${yeni.davetToken}`)
      toast.success('Yetkili oluşturuldu — davet bağlantısı panoya kopyalandı')
    } else {
      toast.success(`Yetkili oluşturuldu — geçici şifre: ${gecici} (ilk girişte değişir)`)
    }
    onKapat()
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onKapat()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetTitle className="sr-only">{mevcut ? 'Yetkili Düzenle' : 'Firma Yetkilisi Ekle'}</SheetTitle>
        <div className="flex h-full flex-col overflow-y-auto p-5">
          <h3 className="text-base font-semibold">{mevcut ? 'Yetkili Düzenle' : 'Firma Yetkilisi Ekle'}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{firma.unvan} — hesap bu firmaya bağlanır</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Alan label="Ad *"><Input value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} /></Alan>
            <Alan label="Soyad *"><Input value={f.soyad} onChange={(e) => setF({ ...f, soyad: e.target.value })} /></Alan>
            <Alan label="E-posta"><Input value={f.eposta} onChange={(e) => setF({ ...f, eposta: e.target.value })} /></Alan>
            <Alan label="Telefon"><Input value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} /></Alan>
            <div className="col-span-2">
              <Alan label="Görev / Unvan"><Input value={f.gorev} onChange={(e) => setF({ ...f, gorev: e.target.value })} placeholder="İnsan Kaynakları Müdürü, İSG Uzmanı…" /></Alan>
            </div>
            <div className="col-span-2">
              <Alan label="Kullanıcı adı *">
                <Input value={f.kullaniciAdi} onChange={(e) => setF({ ...f, kullaniciAdi: e.target.value.toLowerCase() })} />
                {kulCakisiyor && <p className="mt-1 text-[11px] text-red-500">Bu kullanıcı adı kayıtlı</p>}
              </Alan>
            </div>
          </div>

          {!mevcut && (
            <div className="mt-4 space-y-2 rounded-xl border p-3.5">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Hesap oluşturma yöntemi</p>
              {(
                [
                  ['davet', 'Davet bağlantısı', 'Kullanıcı bağlantıyla kendi şifresini belirler — önerilen'],
                  ['sifre', 'Geçici şifre', `İlk girişte değişim zorunlu — ${gecici}`],
                ] as const
              ).map(([v, t, a]) => (
                <label key={v} className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input type="radio" className="mt-1" checked={f.yontem === v} onChange={() => setF({ ...f, yontem: v })} />
                  <span>
                    <span className="block font-medium">{t}</span>
                    <span className="block text-[11px] text-muted-foreground">{a}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-3 rounded-xl border p-3.5">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Yetki ayarları</p>
            {FIRMA_IZINLERI.map((m) => (
              <div key={m.modul}>
                <p className="mb-1.5 text-xs font-medium">{m.label}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {m.izinler.map((i) => (
                    <label key={i.key} className="flex items-center gap-1.5 text-[12px]">
                      <input
                        type="checkbox"
                        checked={izinler.includes('*') || izinler.includes(i.key)}
                        disabled={izinler.includes('*')}
                        onChange={(e) => {
                          const y = new Set(izinler)
                          if (e.target.checked) y.add(i.key)
                          else y.delete(i.key)
                          setIzinler([...y])
                        }}
                      />
                      {i.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <label className="flex items-center gap-1.5 border-t pt-2 text-[12px] font-medium">
              <input
                type="checkbox"
                checked={izinler.includes('*')}
                onChange={(e) => setIzinler(e.target.checked ? ['*'] : [])}
              />
              Tüm firma izinleri (tam yetki)
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
            <Button disabled={!gecerli || !!kulCakisiyor} onClick={kaydet}>
              {mevcut ? 'Kaydet' : 'Oluştur'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------ İzin drawer ------------------------------ */

function IzinDrawer({ y, onKaydet, onKapat }: { y: FirmaYetkili; onKaydet: (iz: string[]) => void; onKapat: () => void }) {
  const [izinler, setIzinler] = useState<string[]>(y.izinler)
  return (
    <Sheet open onOpenChange={(o) => !o && onKapat()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetTitle className="sr-only">Yetki Düzenle</SheetTitle>
        <div className="flex h-full flex-col overflow-y-auto p-5">
          <h3 className="text-base font-semibold">Yetki Düzenle</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{y.ad} {y.soyad} · @{y.kullaniciAdi}</p>
          <div className="mt-5 space-y-4">
            {FIRMA_IZINLERI.map((m) => (
              <div key={m.modul} className="rounded-xl border p-3.5">
                <p className="mb-2 text-xs font-semibold">{m.label}</p>
                <div className="space-y-1.5">
                  {m.izinler.map((i) => (
                    <label key={i.key} className="flex items-center gap-2 text-[12.5px]">
                      <input
                        type="checkbox"
                        checked={izinler.includes('*') || izinler.includes(i.key)}
                        disabled={izinler.includes('*')}
                        onChange={(e) => {
                          const s = new Set(izinler)
                          if (e.target.checked) s.add(i.key)
                          else s.delete(i.key)
                          setIzinler([...s])
                        }}
                      />
                      {i.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <label className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[12.5px] font-medium">
              <input type="checkbox" checked={izinler.includes('*')} onChange={(e) => setIzinler(e.target.checked ? ['*'] : [])} />
              Tüm firma izinleri (tam yetki)
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
            <Button
              onClick={() => {
                onKaydet(izinler)
                toast.success('Yetki seti güncellendi')
                onKapat()
              }}
            >
              Kaydet
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
