import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  AwardIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  DownloadIcon,
  GraduationCapIcon,
  SearchIcon,
  UploadIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import ExcelJS from 'exceljs'
import { Button } from '@/components/ui/button'
import { CipGrup, FiltrePopover, ListeFooter } from '@/components/list-bits'
import { cn } from '@/lib/utils'
import { sifreHashle } from '@/lib/sifre'
import { bildirimGonder } from '@/stores/bildirim-store'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { durumRenk, ilerlemedenKisi, kisiDurumRenk, tcMaske } from '@/data/personeller'
import { durumRenkSertifika, sertifikaGuncelDurum } from '@/data/sertifikalar'
import { sertifikaPdfIndirV2 } from '@/lib/sertifika-render'
import {
  baslikEslestir,
  baslikSatirimi,
  benzersizKullaniciAdi,
  bosSatir,
  kullaniciAdiUret,
  metinAyristir,
  rastgeleSifre,
  tcGecerli,
  TOPLU_KOLONLAR,
  type TopluKol,
} from '@/lib/toplu'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { usePersonelStore, personelAd, personelHesap, personelAtamalari } from '@/stores/personeller-store'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useFirmaKapsam, useFIzin, useYetkili } from './bits'
import { FirmaCalisanEkle } from '@/components/firmalar/firma-calisan-ekle'
import { useOtoBoy } from '@/lib/use-oto-boy'

type Kapsam = ReturnType<typeof useFirmaKapsam>

/** Çalışanın firma atamalarından türetilen özet eğitim durumu */
const egitimOzet = (k: Kapsam, pid: string) => {
  const atm = k.atamalarim.filter((a) => a.personelIds.includes(pid))
  const tamam = atm.filter((a) => {
    const il = k.ilSet.find((i) => i.hesapId === pid && i.atamaId === a.id)
    return il?.durum === 'Tamamlandı'
  }).length
  return { atm: atm.length, tamam }
}

const CIPLER = ['Tümü', 'Aktif', 'İzinli', 'Pasif', 'Ayrıldı'] as const

export default function FirmaCalisanlarPage() {
  const k = useFirmaKapsam()
  const yetkili = useYetkili()
  const navigate = useNavigate()
  const goruntule = useFIzin('calisan.goruntule')
  const olustur = useFIzin('calisan.olustur')
  const toplu = useFIzin('calisan.toplu')
  const [cip, setCip] = useState<(typeof CIPLER)[number]>('Tümü')
  const [ara, setAra] = useState('')
  const [dep, setDep] = useState('Tümü')
  const [sayfa, setSayfa] = useState(0)
  const [boyut, setBoyut] = useState<'oto' | number>('oto')
  const { alanRef, otoBoy } = useOtoBoy('liste', { satirH: 53, baslikH: 40, kartH: 0, kartW: 0 })
  const [ekleModal, setEkleModal] = useState(false)
  const hesapIzniVar = useFIzin('calisan.hesap')
  const [topluModal, setTopluModal] = useState(false)

  const departmanlar = useMemo(() => [...new Set(k.calisanlar.map((p) => p.departman).filter(Boolean))], [k.calisanlar])
  const filtreli = useMemo(() => {
    const q = ara.trim().toLowerCase()
    return k.calisanlar.filter((p) => {
      if (cip !== 'Tümü' && p.durum !== cip) return false
      if (dep !== 'Tümü' && p.departman !== dep) return false
      if (q && ![p.ad, p.soyad, p.departman, p.gorev, p.sicilNo, p.eposta].join(' ').toLowerCase().includes(q))
        return false
      return true
    })
  }, [k.calisanlar, cip, ara, dep])

  const sayfaBoyu = boyut === 'oto' ? otoBoy : boyut
  const sayfaSayisi = Math.max(1, Math.ceil(filtreli.length / sayfaBoyu))
  const sayfaGuvenli = Math.min(sayfa, sayfaSayisi - 1)
  const liste = filtreli.slice(sayfaGuvenli * sayfaBoyu, sayfaGuvenli * sayfaBoyu + sayfaBoyu)

  const excelleAktar = () => {
    xlsxIndir(xlsxDosyaAdi(`${k.firma?.kisaAd ?? 'Firma'}_Calisanlar`), [
      {
        ad: 'Çalışanlar',
        baslik: `${k.firma?.unvan ?? ''} — Çalışan Listesi`,
        altBilgi: 'Firma portalı dışa aktarımı',
        kolonlar: [
          { label: 'Ad Soyad', minGenislik: 22 },
          { label: 'Departman', minGenislik: 16 },
          { label: 'Görev', minGenislik: 20 },
          { label: 'Personel No', minGenislik: 14 },
          { label: 'E-posta', minGenislik: 30, wrap: true },
          { label: 'Durum', minGenislik: 10 },
          { label: 'Atama', tip: 'sayi', minGenislik: 9 },
          { label: 'Sertifika', tip: 'sayi', minGenislik: 9 },
        ],
        satirlar: filtreli.map((p) => {
          const o = egitimOzet(k, p.id)
          return [personelAd(p), p.departman, p.gorev, p.sicilNo, p.eposta, p.durum, o.atm, k.sertifikalarim.filter((s) => s.personelId === p.id).length]
        }),
        ozet: [
          ['Toplam çalışan', k.calisanlar.length],
          ['Aktif', k.calisanlar.filter((p) => p.durum === 'Aktif').length],
        ],
      },
    ])
    toast.success(`${filtreli.length} çalışan Excel'e aktarıldı`)
  }

  if (!goruntule)
    return (
      <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
        Bu sayfayı görüntüleme yetkiniz yok.
      </div>
    )

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Çalışanlarım</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {k.firma?.unvan} · {k.calisanlar.length} çalışan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={excelleAktar}>
            <DownloadIcon /> Excel
          </Button>
          {toplu && (
            <Button variant="outline" onClick={() => setTopluModal(true)}>
              <UploadIcon /> Toplu ekle
            </Button>
          )}
          {olustur && (
            <Button onClick={() => setEkleModal(true)}>
              <UserPlusIcon /> Çalışan ekle
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <CipGrup secenekler={CIPLER} value={cip} onChange={setCip} />
        <div className="relative ml-auto min-w-48 flex-1 sm:max-w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Çalışan ara…"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
          />
        </div>
        <FiltrePopover
          aktifSayi={dep === 'Tümü' ? 0 : 1}
          onTemizle={() => setDep('Tümü')}
          sorular={[{ label: 'Departman', value: dep, options: ['Tümü', ...departmanlar], onChange: setDep }]}
        />
      </div>

      <div ref={alanRef} className="min-h-0 flex-1 overflow-auto px-6 pb-4">
        {filtreli.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed">
            <UsersIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Çalışan bulunamadı</p>
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-2.5">Ad Soyad</th>
                <th className="px-3 py-2.5">Departman</th>
                <th className="px-3 py-2.5">Görev</th>
                <th className="px-3 py-2.5">Personel No</th>
                <th className="px-3 py-2.5">E-posta</th>
                <th className="px-3 py-2.5">Hesap</th>
                <th className="px-3 py-2.5">Eğitim</th>
                <th className="px-3 py-2.5">Sertifika</th>
                <th className="px-3 py-2.5">Durum</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {liste.map((p) => {
                const h = personelHesap(usePersonelStore.getState(), p.id)
                const o = egitimOzet(k, p.id)
                const sc = k.sertifikalarim.filter((s) => s.personelId === p.id).length
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => navigate(`/firma/calisanlar/${p.id}`)}
                  >
                    <td className="px-3 py-3 font-medium">{personelAd(p)}</td>
                    <td className={cn('px-3 py-3', p.departman ? 'text-muted-foreground' : 'italic text-muted-foreground/60')}>{p.departman || 'Belirtilmedi'}</td>
                    <td className={cn('px-3 py-3', p.gorev ? 'text-muted-foreground' : 'italic text-muted-foreground/60')}>{p.gorev || 'Belirtilmedi'}</td>
                    <td className={cn('px-3 py-3 tabular-nums', p.sicilNo ? 'text-muted-foreground' : 'italic text-muted-foreground/60')}>{p.sicilNo || 'Yok'}</td>
                    <td className={cn('max-w-52 truncate px-3 py-3', p.eposta ? 'text-muted-foreground' : 'italic text-muted-foreground/60')}>{p.eposta || 'E-posta yok'}</td>
                    <td className="px-3 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', h ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-zinc-500/10 text-zinc-500')}>
                        {h ? h.durum : 'Hesap yok'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {o.atm === 0 ? (
                        <span className="text-xs italic text-muted-foreground/60">Atama yok</span>
                      ) : (
                        <div className="w-28">
                          <div className="flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
                            <span>{o.tamam}/{o.atm} tamam</span>
                            <span>%{Math.round((o.tamam / o.atm) * 100)}</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((o.tamam / o.atm) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums">{sc || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenk[p.durum])}>{p.durum}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ChevronLeftIcon className="ml-auto size-4 rotate-180 text-muted-foreground" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ListeFooter
        bas={filtreli.length === 0 ? 0 : sayfaGuvenli * sayfaBoyu + 1}
        son={Math.min(filtreli.length, (sayfaGuvenli + 1) * sayfaBoyu)}
        toplam={filtreli.length}
        sayfaGuvenli={sayfaGuvenli}
        sayfaSayisi={sayfaSayisi}
        sayfaBoyu={boyut}
        otoBoy={otoBoy}
        onSayfa={setSayfa}
        onBoyut={(b) => {
          setBoyut(b)
          setSayfa(0)
        }}
      />

      {ekleModal && (
        <FirmaCalisanEkle
          firmaId={k.firmaId!}
          firmaUnvan={k.firma?.unvan ?? ''}
          kullanici={`${yetkili?.ad} ${yetkili?.soyad}`}
          hesapIzni={hesapIzniVar}
          onKapat={() => setEkleModal(false)}
        />
      )}
      {topluModal && <TopluModal k={k} kullanici={`${yetkili?.ad} ${yetkili?.soyad}`} onKapat={() => setTopluModal(false)} />}
    </div>
  )
}

/* ============================= Toplu ekleme ============================== */

interface TopluSatir {
  id: number
  hucre: Record<TopluKol, string>
  hata?: string
  sonuc?: { ok: boolean; mesaj?: string }
}

function TopluModal({ k, kullanici, onKapat }: { k: Kapsam; kullanici: string; onKapat: () => void }) {
  const { topluOlusturBatch, kullaniciAlinmi } = usePersonelStore()
  const logEkle = useAyarlarStore((s) => s.logEkle)
  const [satirlar, setSatirlar] = useState<TopluSatir[]>([])
  const [sonuclandi, setSonuclandi] = useState(false)
  const [hesapAc, setHesapAc] = useState(true)
  const kolonlar = TOPLU_KOLONLAR.filter((c) => c.key !== 'firma')

  const metinIsle = (metin: string) => {
    const matris = metinAyristir(metin)
    if (!matris.length) return toast.error('Veri okunamadı')
    const baslikVar = baslikSatirimi(matris[0])
    const esleme: (TopluKol | null)[] = matris[0].map((h) => (baslikVar ? baslikEslestir(h) : null))
    const veri = baslikVar ? matris.slice(1) : matris
    const yeni: TopluSatir[] = veri.map((s, i) => {
      const hucre = bosSatir().hucre
      if (baslikVar) s.forEach((c, j) => { const kk = esleme[j]; if (kk) hucre[kk] = c })
      else kolonlar.forEach((kol, j) => { hucre[kol.key] = s[j] ?? '' })
      return { id: i, hucre }
    })
    setSatirlar(dogrula(yeni))
    setSonuclandi(false)
  }

  const dosyaOku = async (f: File) => {
    try {
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(await f.arrayBuffer())
      const ws = wb.worksheets[0]
      const satirlar: string[] = []
      ws.eachRow((row) => {
        const hucreler: string[] = []
        for (let c = 1; c <= row.cellCount; c++) hucreler.push(String(row.getCell(c).value ?? ''))
        satirlar.push(hucreler.join('\t'))
      })
      metinIsle(satirlar.join('\n'))
    } catch {
      toast.error('XLSX okunamadı — kopyala-yapıştır deneyin')
    }
  }

  const dogrula = (liste: TopluSatir[]): TopluSatir[] =>
    liste.map((s) => {
      const h = s.hucre
      let hata = ''
      if (!h.ad.trim() || !h.soyad.trim()) hata = 'Ad ve soyad zorunlu'
      else if (h.tc && !tcGecerli(h.tc)) hata = 'Geçersiz T.C. kimlik no'
      else if (h.tc && liste.filter((x) => x.hucre.tc === h.tc).length > 1) hata = 'T.C. listede mükerrer'
      else if (h.tc && usePersonelStore.getState().personeller.some((p) => p.tc === h.tc)) hata = 'T.C. kayıtlı'
      else if (h.kullaniciAdi && kullaniciAlinmi(h.kullaniciAdi)) hata = 'Kullanıcı adı kayıtlı'
      else if (h.kullaniciAdi && liste.filter((x) => x.hucre.kullaniciAdi === h.kullaniciAdi).length > 1)
        hata = 'Kullanıcı adı listede mükerrer'
      return { ...s, hata }
    })

  const gecerliSayi = satirlar.filter((s) => !s.hata).length

  const olustur = async () => {
    const kayitlar = await Promise.all(satirlar
      .filter((s) => !s.hata)
      .map(async (s) => {
        const h = s.hucre
        const kul = h.kullaniciAdi.trim() || benzersizKullaniciAdi(kullaniciAdiUret(h.ad, h.soyad), kullaniciAlinmi)
        return {
          firmaId: k.firmaId!,
          ad: h.ad.trim(),
          soyad: h.soyad.trim(),
          tc: h.tc || undefined,
          departman: h.departman.trim(),
          gorev: h.gorev.trim(),
          sicilNo: '',
          // Kullanıcı adı üretilemiyorsa hesap açılmaz — personel kaydı yine oluşur
          hesap: hesapAc && !!kul,
          kullaniciAdi: kul,
          sifreHash: await sifreHashle(h.sifre || rastgeleSifre()),
          sifreDegisimZorunlu: true,
          // Firma hesabı doğrudan açamaz; İSG onayına gider
          hesapTalebi: k.firma?.unvan ?? 'Firma',
          islemNotu: `Toplu ekleme — ${kullanici} (firma portalı)`,
        }
      }))
    const sonuc = topluOlusturBatch(kayitlar)
    const sonucMap = new Map(satirlar.filter((s) => !s.hata).map((s, idx) => [s.id, sonuc[idx]]))
    setSatirlar((liste) =>
      liste.map((s) => (sonucMap.has(s.id) ? { ...s, sonuc: sonucMap.get(s.id) } : s)),
    )
    setSonuclandi(true)
    const ok = sonuc.filter((r) => r.ok).length
    logEkle({ tarih: new Date().toISOString(), kullanici, islem: 'Toplu çalışan eklendi (firma portalı)', kayit: `${ok}/${sonuc.length} kayıt · ${k.firma?.unvan}` })
    bildirimGonder({ hedef: 'osgb', ton: 'amber', baslik: 'Firma toplu çalışan ekledi', detay: `${ok} çalışan · ${k.firma?.unvan} · eğitim ataması bekliyor`, to: '/panel/personeller' })
    toast.success(`${ok} çalışan oluşturuldu`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onKapat}>
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Toplu Çalışan Ekle</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {k.firma?.unvan} — tüm kayıtlar bu firmaya bağlanır, firma sütunu gerekmez
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onKapat}>Kapat</Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {satirlar.length === 0 ? (
            <div className="space-y-3">
              <textarea
                rows={8}
                placeholder="Excel'den kopyala-yapıştır: Ad, Soyad, T.C. Kimlik No, Departman, Görev, Kullanıcı Adı, Şifre…"
                onPaste={(e) => {
                  e.preventDefault()
                  metinIsle(e.clipboardData.getData('text'))
                }}
                className="w-full rounded-xl border border-dashed bg-transparent p-3 text-sm outline-none focus-visible:border-ring"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">veya .xlsx dosyası yükleyin — sütunlar otomatik eşleştirilir</p>
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
                  <UploadIcon className="size-4" /> XLSX yükle
                  <input type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && dosyaOku(e.target.files[0])} />
                </label>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {kolonlar.map((c) => (
                    <th key={c.key} className="px-2 py-2">{c.label}</th>
                  ))}
                  <th className="px-2 py-2">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {satirlar.map((s) => (
                  <tr key={s.id} className={cn(s.hata && 'bg-red-500/5', s.sonuc && !s.sonuc.ok && 'bg-red-500/5', s.sonuc?.ok && 'bg-emerald-500/5')}>
                    {kolonlar.map((c) => (
                      <td key={c.key} className="px-2 py-1.5">{s.hucre[c.key] || <span className="text-muted-foreground/50">—</span>}</td>
                    ))}
                    <td className="px-2 py-1.5 text-[11px]">
                      {s.sonuc ? (s.sonuc.ok ? <span className="text-emerald-600">Oluşturuldu</span> : <span className="text-red-500">{s.sonuc.mesaj}</span>) : s.hata ? <span className="text-red-500">{s.hata}</span> : <span className="text-muted-foreground">Hazır</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3.5">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{satirlar.length > 0 && `${satirlar.length} satır · ${gecerliSayi} geçerli${sonuclandi ? ' · işlendi' : ''}`}</span>
            {!sonuclandi && (
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={hesapAc} onChange={(e) => setHesapAc(e.target.checked)} />
                Portal hesabı aç (geçici şifre)
              </label>
            )}
          </div>
          <div className="flex gap-2">
            {satirlar.length > 0 && !sonuclandi && (
              <Button variant="outline" onClick={() => setSatirlar([])}>Temizle</Button>
            )}
            {!sonuclandi ? (
              <Button disabled={!gecerliSayi} onClick={olustur}>
                <CheckCircle2Icon /> {gecerliSayi} çalışanı oluştur
              </Button>
            ) : (
              <Button onClick={onKapat}>Tamam</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================ Çalışan detayı ============================= */

const SEKMELER = ['Genel Bilgiler', 'Eğitimler', 'Sertifikalar', 'Hesap Bilgileri'] as const

const Bilgi = ({ l, v }: { l: string; v?: React.ReactNode }) => (
  <div>
    <p className="text-[11px] text-muted-foreground">{l}</p>
    <p className="mt-0.5 text-[13px] font-medium">{v || '—'}</p>
  </div>
)

export function FirmaCalisanDetay() {
  const { id } = useParams()
  const k = useFirmaKapsam()
  const egitimler = useEgitimlerStore((s) => s.egitimler)
  const navigate = useNavigate()
  const [sekme, setSekme] = useState<(typeof SEKMELER)[number]>('Genel Bilgiler')
  const p = k.calisanlar.find((x) => x.id === id)

  if (!p)
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="text-sm text-muted-foreground">Çalışan bulunamadı veya bu firmaya ait değil.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/firma/calisanlar')}>
          Listeye dön
        </Button>
      </div>
    )

  const h = personelHesap(usePersonelStore.getState(), p.id)
  const atamalar = personelAtamalari(usePersonelStore.getState(), p.id).filter((a) => a.firmaId === k.firmaId)
  const sertifikalar = k.sertifikalarim.filter((s) => s.personelId === p.id)

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <button className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate('/firma/calisanlar')}>
        <ChevronLeftIcon className="size-4" /> Çalışanlarım
      </button>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-base font-bold text-amber-600">
          {p.ad[0]}{p.soyad[0]}
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{personelAd(p)}</h1>
          <p className="text-sm text-muted-foreground">{p.departman || '—'} · {p.gorev || '—'} · Sicil {p.sicilNo || '—'}</p>
        </div>
        <span className={cn('ml-auto rounded-full px-2.5 py-1 text-xs font-medium', durumRenk[p.durum])}>{p.durum}</span>
      </div>

      <div className="mt-5 flex gap-1 border-b">
        {SEKMELER.map((s) => (
          <button
            key={s}
            onClick={() => setSekme(s)}
            className={cn(
              'px-4 py-2.5 text-sm transition-colors',
              sekme === s ? 'border-b-2 border-amber-500 font-medium' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {sekme === 'Genel Bilgiler' && (
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border bg-card p-5 sm:grid-cols-3">
          <Bilgi l="Ad Soyad" v={personelAd(p)} />
          <Bilgi l="Departman" v={p.departman} />
          <Bilgi l="Görev" v={p.gorev} />
          <Bilgi l="Personel No" v={p.sicilNo} />
          <Bilgi l="T.C. Kimlik No" v={tcMaske(p.tc)} />
          <Bilgi l="Durum" v={p.durum} />
          <Bilgi l="E-posta" v={p.eposta} />
          <Bilgi l="Telefon" v={p.telefon} />
          <Bilgi l="Kayıt tarihi" v={p.olusturma} />
        </div>
      )}

      {sekme === 'Eğitimler' && (
        <div className="mt-5 space-y-2">
          {atamalar.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Atanmış eğitim yok.</p>}
          {atamalar.map((a) => {
            const e = egitimler.find((x) => x.id === a.egitimId)
            const il = k.ilSet.find((i) => i.hesapId === p.id && i.atamaId === a.id)
            const kd = ilerlemedenKisi(il?.durum, a.sonTarih)
            const son = il?.denemeler[il.denemeler.length - 1]
            return (
              <div key={a.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                <GraduationCapIcon className="size-5 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e?.baslik ?? a.egitimId}</p>
                  <p className="text-xs text-muted-foreground">
                    Atanma {a.atamaTarihi} · son {a.sonTarih}
                    {son && ` · sınav ${son.puan} puan (${il!.denemeler.length} deneme)`}
                  </p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', kisiDurumRenk[kd])}>{il?.durum ?? 'Atanmış'}</span>
              </div>
            )
          })}
        </div>
      )}

      {sekme === 'Sertifikalar' && (
        <div className="mt-5 space-y-2">
          {sertifikalar.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Sertifika yok.</p>}
          {sertifikalar.map((s) => {
            const d = sertifikaGuncelDurum(s)
            return (
              <div key={s.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                <AwardIcon className="size-5 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.egitimAd}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{s.sertifikaNo} · {s.duzenlenmeTarihi}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenkSertifika[d])}>{d}</span>
                <Button size="sm" variant="outline" onClick={() => sertifikaPdfIndirV2(s)}>
                  <DownloadIcon /> PDF
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {sekme === 'Hesap Bilgileri' && (
        <div className="mt-5 space-y-2">
          {!h ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Portal hesabı oluşturulmamış.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border bg-card p-5">
              <Bilgi l="Kullanıcı adı" v={`@${h.kullaniciAdi}`} />
              <Bilgi l="Hesap durumu" v={h.durum} />
              <Bilgi l="E-posta" v={h.eposta} />
              <Bilgi l="Son giriş" v={h.sonGiris?.slice(0, 16).replace('T', ' ') ?? 'Hiç giriş yok'} />
              <Bilgi l="Oluşturulma" v={h.olusturma} />
              <Bilgi l="Aktif oturum" v={`${h.oturumlar.length}`} />
              <p className="col-span-2 rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                Şifre ve parola bilgileri bu görünüme dahil değildir — güvenlik gereği görüntülenemez.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
