/*
 * Sertifika Detay — tek belgenin yönetim merkezi.
 * Büyük canlı önizleme (zoom/tam ekran), sekmeli bilgiler, düzenleme,
 * şablon değiştirme ve PDF sürüm geçmişi.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeftIcon,
  BanIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExpandIcon,
  EyeIcon,
  FileBadgeIcon,
  PencilIcon,
  PrinterIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Alan } from '@/components/form-bits'
import { SertifikaOnizleme } from '@/components/sertifika/onizleme'
import { sertifikaPdfAcV2, sertifikaPdfIndirV2, sertifikaPng, sertifikaYazdirV2, surumPdfIndir } from '@/lib/sertifika-render'
import { sertifikaGuncelDurum, durumRenkSertifika, dogrulamaUrl, type Sertifika } from '@/data/sertifikalar'
import { ORNEK_VERI, sablonDuzen, veriGetir, type Yon } from '@/data/sertifika-tasarim'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useAuthStore } from '@/stores/auth-store'
import { useIzin } from '@/lib/izin'
import { cn } from '@/lib/utils'

const SEKMELER = ['Genel Bilgiler', 'Tasarım', 'Onay Bilgileri', 'Belgeler', 'İşlem Geçmişi'] as const

function Bilgi({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{l}</p>
      <p className="mt-0.5 text-[13px] font-medium break-words">{v}</p>
    </div>
  )
}

export default function SertifikaDetayPage() {
  const { id } = useParams()
  const { sertifikalar, tasarimlar, basvurular, sertifikaDuzenle, sablonDegistir, pdfYenidenUret, iptalEt } = useSertifikaStore()
  const personeller = usePersonelStore((s) => s.personeller)
  const kullanici = useAuthStore((s) => s.user)?.name ?? 'Sistem'
  const duzenleIzni = useIzin('sertifikalar.duzenle')
  const sablonIzni = useIzin('sertifikalar.sablon')
  const pdfIzni = useIzin('sertifikalar.pdf')
  const iptalIzni = useIzin('sertifikalar.iptal')

  const s = sertifikalar.find((x) => x.id === id)
  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]>('Genel Bilgiler')
  const [zoom, setZoom] = useState(0.62)
  const [sekiliYuz, setSekiliYuz] = useState<'on' | 'arka'>('on')
  const [tamEkran, setTamEkran] = useState(false)
  const [eskiPng, setEskiPng] = useState<string | null>(null)
  const [duzenModal, setDuzenModal] = useState(false)
  const [sablonModal, setSablonModal] = useState(false)
  const [iptalModal, setIptalModal] = useState(false)
  const [iptalNeden, setIptalNeden] = useState('')

  const veri = useMemo(() => (s ? veriGetir(s) : ORNEK_VERI), [s])
  const personel = s ? personeller.find((p) => p.id === s.personelId) : undefined
  const basvuru = s ? basvurular.find((b) => b.id === s.basvuruId) : undefined

  if (!s)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <FileBadgeIcon className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Sertifika bulunamadı</p>
        <Link to="/panel/sertifikalar" className="text-sm text-sky-600 hover:underline">← Listeye dön</Link>
      </div>
    )

  const d = sertifikaGuncelDurum(s)
  const v2 = !!s.tasarim
  const aktifSablon = s.tasarim ? tasarimlar.find((t) => t.id === s.tasarim!.sablonId) : undefined
  const yedekSablon = aktifSablon ?? tasarimlar.find((t) => t.varsayilan && !t.arsiv) ?? tasarimlar[0]
  const sayfaYonu = s.tasarim?.yon ?? yedekSablon?.yon ?? 'yatay'
  const onYuzElemanlari = s.tasarim?.elemanlar?.length
    ? s.tasarim.elemanlar
    : yedekSablon ? sablonDuzen(yedekSablon, sayfaYonu, 'on') : []
  const arkaYuzElemanlari = s.tasarim?.arkaElemanlar?.length
    ? s.tasarim.arkaElemanlar
    : yedekSablon ? sablonDuzen(yedekSablon, sayfaYonu, 'arka') : []

  const eskiOnizle = () => {
    if (!v2 && !eskiPng) sertifikaPng(s).then(setEskiPng)
    return eskiPng
  }

  const belge = v2 ? (
    <SertifikaOnizleme
      elemanlar={sekiliYuz === 'on' ? onYuzElemanlari : arkaYuzElemanlari}
      yon={sayfaYonu}
      zemin={sekiliYuz === 'arka' ? (s.tasarim?.arkaZemin ?? s.tasarim?.zemin ?? yedekSablon?.zemin ?? '#fff') : (s.tasarim?.zemin ?? yedekSablon?.zemin ?? '#fff')}
      veri={veri}
      olcek={zoom}
      iptal={s.durum === 'İptal Edildi'}
    />
  ) : (
    <div className="rounded-lg border bg-muted/30 p-2">
      {sekiliYuz === 'on'
        ? (eskiOnizle() ? <img src={eskiPng!} className="mx-auto block max-w-full" /> : <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Belge hazırlanıyor…</div>)
        : <SertifikaOnizleme elemanlar={arkaYuzElemanlari} yon={sayfaYonu} zemin={yedekSablon?.zemin} veri={veri} olcek={zoom} iptal={s.durum === 'İptal Edildi'} />}
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      {/* Başlık + aksiyonlar */}
      <div className="flex flex-wrap items-center gap-3 border-b px-6 pt-5 pb-4">
        <Link to="/panel/sertifikalar" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
            {s.sertifikaNo}
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenkSertifika[d])}>{d}</span>
            {s.belgeTuru === 'resmi' && <span className="rounded-full border px-2 py-0.5 text-[11px]">Resmî belge</span>}
          </h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {s.personelAd} · {s.egitimAd} · {s.duzenlenmeTarihi}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {duzenleIzni && (
            <Button size="sm" variant="outline" onClick={() => setDuzenModal(true)}>
              <PencilIcon /> Düzenle
            </Button>
          )}
          {sablonIzni && v2 && (
            <Button size="sm" variant="outline" onClick={() => setSablonModal(true)}>
              <RefreshCwIcon /> Şablonu Değiştir
            </Button>
          )}
          {pdfIzni && v2 && (
            <Button size="sm" variant="outline" onClick={() => { pdfYenidenUret(s.id, kullanici, 'Yeniden oluşturma'); toast.success('Yeni PDF sürümü kaydedildi') }}>
              <RefreshCwIcon /> PDF'i Yenile
            </Button>
          )}
          {pdfIzni && (
            <>
              <Button size="sm" variant="outline" onClick={() => { void sertifikaPdfAcV2(s).catch((error) => { console.error('Sertifika görüntülenemedi', error); toast.error('Sertifika PDF’i açılamadı. Tarayıcı açılır pencereleri engelliyorsa izin verip tekrar deneyin.') }) }}>
                <EyeIcon /> Görüntüle
              </Button>
              <Button size="sm" onClick={() => { void sertifikaPdfIndirV2(s).then(() => toast.success('Sertifika PDF’i indirildi')).catch((error) => { console.error('Sertifika indirilemedi', error); toast.error('PDF hazırlanamadı. Lütfen tekrar deneyin.') }) }}>
                <DownloadIcon /> PDF İndir
              </Button>
              <Button size="sm" variant="outline" onClick={() => { void sertifikaYazdirV2(s).catch((error) => { console.error('Sertifika yazdırılamadı', error); toast.error('Yazdırma önizlemesi açılamadı. Tarayıcı açılır pencereleri engelliyorsa izin verip tekrar deneyin.') }) }}>
                <PrinterIcon /> Yazdır
              </Button>
            </>
          )}
          {iptalIzni && s.durum !== 'İptal Edildi' && (
            <Button size="sm" variant="destructive" onClick={() => setIptalModal(true)}>
              <BanIcon /> İptal Et
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Ön ve arka yüz önizlemesi */}
        <div className="flex min-w-0 flex-1 overflow-hidden bg-zinc-200/50 dark:bg-zinc-950/50">
          <nav aria-label="Sertifika sayfaları" className="flex w-36 shrink-0 flex-col gap-3 overflow-y-auto border-r border-black/5 bg-white/55 p-3 dark:border-white/5 dark:bg-zinc-900/40">
            {([
              { yuz: 'on' as const, baslik: 'Ön yüz', numara: '01', elemanlar: onYuzElemanlari, zemin: s.tasarim?.zemin ?? yedekSablon?.zemin ?? '#fff' },
              { yuz: 'arka' as const, baslik: 'Arka yüz', numara: '02', elemanlar: arkaYuzElemanlari, zemin: s.tasarim?.arkaZemin ?? s.tasarim?.zemin ?? yedekSablon?.zemin ?? '#fff' },
            ]).map((sayfa) => (
              <button
                key={sayfa.yuz}
                type="button"
                onClick={() => setSekiliYuz(sayfa.yuz)}
                aria-pressed={sekiliYuz === sayfa.yuz}
                className={cn(
                  'group rounded-xl border p-2 text-left transition-colors',
                  sekiliYuz === sayfa.yuz ? 'border-amber-500 bg-amber-500/10 shadow-sm' : 'border-border/70 bg-card/80 hover:border-amber-500/50',
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{sayfa.baslik}</span>
                  <span className={cn('text-[10px] tabular-nums', sekiliYuz === sayfa.yuz ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>{sayfa.numara}</span>
                </div>
                <div className="flex h-[90px] items-center justify-center overflow-hidden rounded-md bg-zinc-100 p-1 dark:bg-zinc-950">
                  {v2 ? (
                    <SertifikaOnizleme elemanlar={sayfa.elemanlar} yon={sayfaYonu} zemin={sayfa.zemin} veri={veri} olcek={sayfaYonu === 'yatay' ? 0.105 : 0.078} iptal={s.durum === 'İptal Edildi'} />
                  ) : sayfa.yuz === 'on' ? (
                    eskiOnizle() ? <img src={eskiPng!} alt="Ön yüz küçük önizleme" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] text-muted-foreground">Yükleniyor…</span>
                  ) : (
                    <SertifikaOnizleme elemanlar={sayfa.elemanlar} yon={sayfaYonu} zemin={sayfa.zemin} veri={veri} olcek={sayfaYonu === 'yatay' ? 0.105 : 0.078} iptal={s.durum === 'İptal Edildi'} />
                  )}
                </div>
                <span className="mt-2 block text-[10px] text-muted-foreground">{sayfa.yuz === 'on' ? 'Sertifika bilgileri' : `${s.egitimKonulari?.length ?? 0} eğitim konusu`}</span>
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col overflow-auto p-4 lg:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border bg-card p-1 shadow-sm" role="tablist" aria-label="Sertifika yüzü">
                {(['on', 'arka'] as const).map((yuz) => (
                  <button
                    key={yuz}
                    type="button"
                    role="tab"
                    aria-selected={sekiliYuz === yuz}
                    onClick={() => setSekiliYuz(yuz)}
                    className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors', sekiliYuz === yuz ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-muted-foreground hover:bg-muted')}
                  >
                    {yuz === 'on' ? 'Ön yüz' : 'Arka yüz'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="range" min={0.3} max={1.4} step={0.05} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-32 sm:w-40" disabled={!v2} aria-label="Önizleme büyütme" />
                <span className="w-10 text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setTamEkran(true)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" title="Tam ekran">
                  <ExpandIcon className="size-4" />
                </button>
              </div>
            </div>
            <div className="mx-auto my-auto overflow-hidden rounded-lg shadow-xl ring-1 ring-black/10 dark:ring-white/10">{belge}</div>
          </div>
        </div>

        {/* Sağ — sekmeler */}
        <aside className="flex w-105 shrink-0 flex-col border-l bg-card">
          <div className="flex flex-wrap gap-1 border-b p-2">
            {SEKMELER.map((t) => (
              <button
                key={t}
                onClick={() => setSekme(t)}
                className={cn('rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors', sekme === t ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-muted-foreground hover:bg-muted')}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {sekme === 'Genel Bilgiler' && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Bilgi l="Sertifika No" v={s.sertifikaNo} />
                <Bilgi l="Durum" v={d} />
                <Bilgi l="Personel" v={s.personelAd} />
                <Bilgi l="Departman / Görev" v={`${personel?.departman ?? '—'} / ${personel?.gorev ?? '—'}`} />
                <Bilgi l="Firma" v={s.firmaAd} />
                <Bilgi l="Eğitim" v={`${s.egitimAd} (v${s.egitimSurumNo})`} />
                <Bilgi l="Süre / Kategori" v={`${s.egitimSure} dk · ${s.egitimKategori}`} />
                <Bilgi l="Tamamlanma" v={s.tamamlanmaTarihi} />
                <Bilgi l="Düzenlenme" v={s.duzenlenmeTarihi} />
                <Bilgi l="Geçerlilik" v={s.gecerlilikTarihi ?? 'Süresiz'} />
                {s.aciklama && <div className="col-span-2"><Bilgi l="Açıklama" v={s.aciklama} /></div>}
                <div className="col-span-2 flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                  <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{dogrulamaUrl(s.dogrulamaKodu)}</p>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => { navigator.clipboard.writeText(dogrulamaUrl(s.dogrulamaKodu)); toast.success('Bağlantı kopyalandı') }}>
                    <CopyIcon /> Kopyala
                  </Button>
                </div>
              </div>
            )}
            {sekme === 'Tasarım' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Bilgi l="Şablon" v={s.tasarim?.sablonAd ?? `${s.sablonSnap.baslik} (klasik)`} />
                  <Bilgi l="Sayfa yönü" v={s.tasarim ? (s.tasarim.yon === 'yatay' ? 'Yatay (297×210)' : 'Dikey (210×297)') : 'Yatay'} />
                  <Bilgi l="Tasarım sürümü" v={s.tasarim ? `v${s.tasarim.surum}` : '—'} />
                  <Bilgi l="Şablon durumu" v={aktifSablon ? (aktifSablon.arsiv ? 'Arşivde' : aktifSablon.aktif ? 'Aktif' : 'Pasif') : 'Klasik şablon'} />
                </div>
                {aktifSablon && (
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Güncel şablon sürümü</p>
                    <div className="inline-block overflow-hidden rounded border">
                      <SertifikaOnizleme elemanlar={sablonDuzen(aktifSablon, aktifSablon.yon)} yon={aktifSablon.yon} zemin={aktifSablon.zemin} veri={ORNEK_VERI} olcek={0.3} />
                    </div>
                    {aktifSablon.surum !== s.tasarim?.surum && (
                      <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                        Şablon v{aktifSablon.surum}'e güncellendi — bu sertifika v{s.tasarim?.surum} görüntüsünü korur.
                      </p>
                    )}
                  </div>
                )}
                {sablonIzni && v2 && (
                  <Button variant="outline" size="sm" onClick={() => setSablonModal(true)}>
                    <RefreshCwIcon /> Şablonu Değiştir
                  </Button>
                )}
              </div>
            )}
            {sekme === 'Onay Bilgileri' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Bilgi l="Onaylayan" v={s.onaylayan} />
                  <Bilgi l="Onay tarihi" v={s.onayTarihi} />
                  <Bilgi l="Başvuru" v={s.basvuruId} />
                  <Bilgi l="Sınav" v={basvuru ? `${basvuru.sinavPuani ?? '—'} puan · ${basvuru.denemeSayisi} deneme` : '—'} />
                </div>
                {basvuru && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Başvuru geçmişi</p>
                    <div className="space-y-0 rounded-xl border px-3 py-1">
                      {basvuru.olaylar.map((o, i) => (
                        <div key={i} className="border-b border-border/50 py-2 text-xs last:border-0">
                          <p>{o.islem}</p>
                          <p className="text-[11px] text-muted-foreground">{o.kullanici} · {o.tarih.slice(0, 16).replace('T', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {sekme === 'Belgeler' && (
              <div className="space-y-2">
                {(s.pdfSurumler ?? []).slice().reverse().map((p) => (
                  <div key={p.surum} className="flex items-center gap-3 rounded-xl border p-3">
                    <FileBadgeIcon className="size-8 shrink-0 text-muted-foreground/60" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">PDF sürüm {p.surum}</p>
                      <p className="text-[11px] text-muted-foreground">{p.sebep} · {p.kullanici} · {p.tarih.slice(0, 16).replace('T', ' ')}</p>
                    </div>
                    {pdfIzni && (
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => surumPdfIndir(p, veri, `${s.sertifikaNo}-v${p.surum}.pdf`)}>
                        <DownloadIcon /> İndir
                      </Button>
                    )}
                  </div>
                ))}
                {(!s.pdfSurumler || s.pdfSurumler.length === 0) && (
                  <p className="py-6 text-center text-xs text-muted-foreground">Klasik belge — sürüm kaydı v2 tasarımlar için tutulur</p>
                )}
              </div>
            )}
            {sekme === 'İşlem Geçmişi' && (
              <div className="space-y-0 rounded-xl border px-3 py-1">
                {s.gecmis.map((o, i) => (
                  <div key={i} className="border-b border-border/50 py-2.5 text-xs last:border-0">
                    <p className="text-[13px]">{o.islem}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {o.kullanici} · {o.tarih.slice(0, 16).replace('T', ' ')}
                      {o.not ? ` — ${o.not}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Tam ekran önizleme */}
      {tamEkran && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/85 p-6" onClick={() => setTamEkran(false)}>
          {v2 ? (
            <SertifikaOnizleme
              elemanlar={sekiliYuz === 'on' ? onYuzElemanlari : arkaYuzElemanlari}
              yon={sayfaYonu}
              zemin={sekiliYuz === 'arka' ? (s.tasarim?.arkaZemin ?? s.tasarim?.zemin ?? yedekSablon?.zemin) : (s.tasarim?.zemin ?? yedekSablon?.zemin)}
              veri={veri}
              olcek={sayfaYonu === 'yatay' ? 1.15 : 0.95}
              iptal={s.durum === 'İptal Edildi'}
            />
          ) : (
            sekiliYuz === 'on'
              ? (eskiPng && <img src={eskiPng} className="max-w-full" />)
              : <SertifikaOnizleme elemanlar={arkaYuzElemanlari} yon={sayfaYonu} zemin={yedekSablon?.zemin} veri={veri} olcek={sayfaYonu === 'yatay' ? 1.15 : 0.95} iptal={s.durum === 'İptal Edildi'} />
          )}
        </div>
      )}

      {/* Düzenleme modalı */}
      {duzenModal && (
        <DuzenleModal
          s={s}
          onKapat={() => setDuzenModal(false)}
          onKaydet={(p) => {
            sertifikaDuzenle(s.id, p, kullanici)
            if (s.tasarim) pdfYenidenUret(s.id, kullanici, 'Sertifika bilgileri düzenlendi')
            toast.success('Sertifika güncellendi — yeni PDF sürümü kaydedildi')
            setDuzenModal(false)
          }}
        />
      )}

      {/* Şablon değiştirme modalı */}
      {sablonModal && s.tasarim && (
        <SablonModal
          s={s}
          tasarimlar={tasarimlar.filter((t) => !t.arsiv && t.aktif)}
          onKapat={() => setSablonModal(false)}
          onSec={(tid, y) => {
            sablonDegistir(s.id, tid, y, kullanici)
            toast.success('Şablon değiştirildi — sertifika no korundu, yeni PDF sürümü oluştu')
            setSablonModal(false)
          }}
        />
      )}

      {/* İptal modalı */}
      {iptalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIptalModal(false)}>
          <div className="w-full max-w-md rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold"><BanIcon className="size-5 text-red-500" /> Sertifikayı İptal Et</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.sertifikaNo} — belge silinmez, doğrulamada "İptal Edildi" görünür</p>
            </div>
            <div className="px-5 py-4">
              <Alan label="İptal nedeni (zorunlu)">
                <textarea value={iptalNeden} onChange={(e) => setIptalNeden(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30" placeholder="İptal gerekçesi…" />
              </Alan>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Button variant="ghost" onClick={() => setIptalModal(false)}>Vazgeç</Button>
              <Button
                variant="destructive"
                disabled={!iptalNeden.trim()}
                onClick={() => {
                  iptalEt(s.id, { kullanici, neden: iptalNeden.trim() })
                  toast('Sertifika iptal edildi — geçmiş korunur')
                  setIptalModal(false)
                }}
              >
                <CheckIcon /> İptal Et
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DuzenleModal({ s, onKapat, onKaydet }: { s: Sertifika; onKapat: () => void; onKaydet: (p: { duzenlenmeTarihi?: string; gecerlilikTarihi?: string; aciklama?: string }) => void }) {
  const [duz, setDuz] = useState(s.duzenlenmeTarihi)
  const [gec, setGec] = useState(s.gecerlilikTarihi ?? '')
  const [aciklama, setAciklama] = useState(s.aciklama ?? '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onKapat}>
      <div className="w-full max-w-md rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold">Sertifika Bilgilerini Düzenle</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Personel, eğitim, sınav ve tamamlanma verileri kaynak kayıtlardan gelir — burada değiştirilemez.
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <Alan label="Düzenlenme tarihi">
            <input type="date" value={duz} onChange={(e) => setDuz(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
          </Alan>
          <Alan label="Geçerlilik tarihi (boş = süresiz)">
            <input type="date" value={gec} onChange={(e) => setGec(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
          </Alan>
          <Alan label="Açıklama">
            <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
          </Alan>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3.5">
          <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
          <Button onClick={() => onKaydet({ duzenlenmeTarihi: duz, gecerlilikTarihi: gec, aciklama })}>Kaydet</Button>
        </div>
      </div>
    </div>
  )
}

function SablonModal({ s, tasarimlar, onKapat, onSec }: { s: Sertifika; tasarimlar: import('@/data/sertifika-tasarim').TasarimSablon[]; onKapat: () => void; onSec: (id: string, yon: Yon) => void }) {
  const [secili, setSecili] = useState(s.tasarim!.sablonId)
  const [yon, setYon] = useState<Yon>(s.tasarim!.yon)
  const t = tasarimlar.find((x) => x.id === secili)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onKapat}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold">Şablonu Değiştir</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Sertifika numarası ve veriler korunur — yalnız tasarım değişir, eski sürüm saklanır.</p>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="w-60 shrink-0 overflow-y-auto border-r p-3">
            {tasarimlar.map((x) => (
              <button
                key={x.id}
                onClick={() => setSecili(x.id)}
                className={cn('mb-2 block w-full overflow-hidden rounded-xl border-2 text-left transition-colors', secili === x.id ? 'border-sky-500' : 'border-transparent hover:border-border')}
              >
                <div className="pointer-events-none flex items-center justify-center overflow-hidden bg-zinc-100 p-2 dark:bg-zinc-900" style={{ height: 96 }}>
                  <SertifikaOnizleme elemanlar={sablonDuzen(x)} yon={x.yon} zemin={x.zemin} veri={ORNEK_VERI} olcek={x.yon === 'yatay' ? 0.14 : 0.11} />
                </div>
                <p className="truncate px-2 py-1.5 text-xs font-medium">{x.ad}</p>
              </button>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 overflow-auto bg-zinc-100 p-4 dark:bg-zinc-950">
            <div className="flex items-center rounded-lg border bg-card">
              {(['yatay', 'dikey'] as const).map((y) => (
                <button
                  key={y}
                  onClick={() => setYon(y)}
                  className={cn('px-3 py-1.5 text-xs font-medium', yon === y ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-muted-foreground')}
                >
                  {y === 'yatay' ? 'Yatay' : 'Dikey'}
                </button>
              ))}
            </div>
            {t && (
              <div className="overflow-hidden rounded-lg shadow-lg">
                <SertifikaOnizleme elemanlar={sablonDuzen(t, yon)} yon={yon} zemin={t.zemin} veri={veriGetir(s)} olcek={yon === 'yatay' ? 0.52 : 0.42} iptal={s.durum === 'İptal Edildi'} />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3.5">
          <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
          <Button disabled={!t} onClick={() => t && onSec(t.id, yon)}>
            <CheckIcon /> Bu Tasarımla Güncelle
          </Button>
        </div>
      </div>
    </div>
  )
}
