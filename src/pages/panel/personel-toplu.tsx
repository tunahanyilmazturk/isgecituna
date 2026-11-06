import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardPasteIcon,
  CopyIcon,
  DownloadIcon,
  FileUpIcon,
  Loader2Icon,
  PlusIcon,
  Redo2Icon,
  ShieldAlertIcon,
  Trash2Icon,
  Undo2Icon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { xlsxDosyaAdi, xlsxIndir } from '@/lib/excel'
import { useIzin } from '@/lib/izin'
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
  trNorm,
  type TopluKol,
  type TopluSatir,
} from '@/lib/toplu'
import { TopluGrid, type HucreKonum, type SatirBilgi, type Secim } from '@/components/toplu/grid'
import { usePersonelStore, type TopluKayit } from '@/stores/personeller-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useFirmalarStore } from '@/stores/firmalar-store'

const SON_C = TOPLU_KOLONLAR.length - 1
const BATCH = 40

type SifreModu = 'tek' | 'farkli'

interface HesapAyarlari {
  hesapOlustur: boolean
  otoKul: boolean
  sifreModu: SifreModu
  varsayilanSifre: string
  ilkGirisZorunlu: boolean
  varsayilanFirma: string
}

interface SonucSatir {
  ad: string
  soyad: string
  firma: string
  kullaniciAdi: string
  sifre: string
  ok: boolean
  mesaj?: string
}

const inp =
  'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30'

export default function PersonelTopluPage() {
  const navigate = useNavigate()
  const izinVarMi = useIzin('personeller.toplu-olustur')
  const firmalar = useFirmalarStore((s) => s.firmalar)
  const topluOlusturBatch = usePersonelStore((s) => s.topluOlusturBatch)
  const personeller = usePersonelStore((s) => s.personeller)
  const portalHesaplar = usePersonelStore((s) => s.hesaplar)
  const ekipHesaplar = useEkipStore((s) => s.hesaplar)

  const kullaniciVar = useCallback(
    (k: string) =>
      portalHesaplar.some((h) => h.kullaniciAdi === k) ||
      ekipHesaplar.some((h) => h.kullaniciAdi === k),
    [portalHesaplar, ekipHesaplar],
  )

  const [satirlar, setSatirlar] = useState<TopluSatir[]>(() => Array.from({ length: 15 }, bosSatir))
  const [gecmis, setGecmis] = useState<TopluSatir[][]>([])
  const [ileri, setIleri] = useState<TopluSatir[][]>([])
  const [aktif, setAktif] = useState<HucreKonum | null>(null)
  const [secim, setSecim] = useState<Secim | null>(null)
  const [ayarlar, setAyarlar] = useState<HesapAyarlari>({
    hesapOlustur: true,
    otoKul: true,
    sifreModu: 'tek',
    varsayilanSifre: '123456',
    ilkGirisZorunlu: true,
    varsayilanFirma: '',
  })
  const [yapistirAcik, setYapistirAcik] = useState(false)
  const [onayAcik, setOnayAcik] = useState(false)
  const [islem, setIslem] = useState<{ toplam: number; bitti: number; basarili: number; hata: number; calisiyor: boolean } | null>(null)
  const [sonuc, setSonuc] = useState<SonucSatir[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ---------- undo / redo ---------- */
  const uygula = useCallback((fn: (rows: TopluSatir[]) => TopluSatir[], undo = true) => {
    setSatirlar((rows) => {
      const yeni = fn(rows)
      if (undo) {
        setGecmis((g) => [...g.slice(-49), rows])
        setIleri([])
      }
      return yeni
    })
  }, [])
  const geriAl = useCallback(() => {
    setGecmis((g) => {
      if (g.length === 0) return g
      setIleri((i) => [...i, satirlar])
      setSatirlar(g[g.length - 1])
      return g.slice(0, -1)
    })
  }, [satirlar])
  const yinele = useCallback(() => {
    setIleri((i) => {
      if (i.length === 0) return i
      setGecmis((g) => [...g, satirlar])
      setSatirlar(i[i.length - 1])
      return i.slice(0, -1)
    })
  }, [satirlar])

  /* ---------- hücre işlemleri ---------- */
  const degerYaz = useCallback(
    (r: number, c: number, v: string) => {
      uygula((rows) =>
        rows.map((s, i) => {
          if (i !== r) return s
          const kol = TOPLU_KOLONLAR[c].key
          const hucre = { ...s.hucre, [kol]: v }
          // Otomatik kullanıcı adı: ad/soyad yazılırken boşsa üret
          if (
            ayarlar.otoKul &&
            (kol === 'ad' || kol === 'soyad') &&
            !hucre.kullaniciAdi.trim()
          ) {
            hucre.kullaniciAdi = benzersizKullaniciAdi(
              kullaniciAdiUret(kol === 'ad' ? v : hucre.ad, kol === 'soyad' ? v : hucre.soyad),
              (k) => kullaniciVar(k) || rows.some((x, j) => j !== r && x.hucre.kullaniciAdi === k),
            )
          }
          return { ...s, hucre, sonuc: undefined }
        }),
      )
    },
    [ayarlar.otoKul, kullaniciVar, uygula],
  )

  const matrisYaz = useCallback(
    (r: number, c: number, matris: string[][]) =>
      uygula((rows) => {
        const yeni = [...rows]
        const eklenenKul = new Set<string>()
        while (yeni.length < r + matris.length) yeni.push(bosSatir())
        matris.forEach((sat, dr) => {
          const s = yeni[r + dr]
          const hucre = { ...s.hucre }
          sat.forEach((v, dc) => {
            if (c + dc <= SON_C) hucre[TOPLU_KOLONLAR[c + dc].key] = v
          })
          if (ayarlar.otoKul && !hucre.kullaniciAdi.trim() && (hucre.ad || hucre.soyad))
            hucre.kullaniciAdi = benzersizKullaniciAdi(kullaniciAdiUret(hucre.ad, hucre.soyad), (k) =>
              kullaniciVar(k) || eklenenKul.has(k) || yeni.some((x, j) => j !== r + dr && x.hucre.kullaniciAdi === k),
            )
          if (hucre.kullaniciAdi) eklenenKul.add(hucre.kullaniciAdi)
          yeni[r + dr] = { ...s, hucre, sonuc: undefined }
        })
        return yeni
      }),
    [ayarlar.otoKul, kullaniciVar, uygula],
  )

  const hucreTemizle = useCallback(
    (s: Secim) =>
      uygula((rows) => {
        // Tam satır seçimi → satır silme
        if (s.c1 === 0 && s.c2 === SON_C) return rows.filter((_, i) => i < s.r1 || i > s.r2)
        return rows.map((sat, i) => {
          if (i < s.r1 || i > s.r2) return sat
          const hucre = { ...sat.hucre }
          for (let c = s.c1; c <= s.c2; c++) hucre[TOPLU_KOLONLAR[c].key] = ''
          return { ...sat, hucre, sonuc: undefined }
        })
      }),
    [uygula],
  )

  const satirEkle = useCallback(() => uygula((rows) => [...rows, bosSatir()]), [uygula])
  const temizle = useCallback(
    () => uygula(() => Array.from({ length: 15 }, bosSatir)),
    [uygula],
  )

  /* ---------- firma çözümleme ---------- */
  const firmaCoz = useCallback(
    (txt: string) => {
      const n = trNorm(txt)
      if (!n) return null
      const byId = firmalar.find((f) => f.id === txt)
      if (byId) return byId
      const tam = firmalar.filter((f) => trNorm(f.unvan) === n || trNorm(f.kod) === n)
      if (tam.length === 1) return tam[0]
      if (tam.length > 1) return null
      const kismi = firmalar.filter(
        (f) => trNorm(f.unvan).includes(n) || n.includes(trNorm(f.unvan)),
      )
      return kismi.length === 1 ? kismi[0] : null
    },
    [firmalar],
  )
  const firmaIdBul = useCallback((t: string) => firmaCoz(t)?.id ?? null, [firmaCoz])

  /* ---------- doğrulama ---------- */
  const satirBilgi = useCallback(
    (s: TopluSatir): SatirBilgi => {
      const hatalar: Partial<Record<TopluKol, string>> = {}
      const h = s.hucre
      const bos = !Object.values(h).some((v) => v.trim())
      if (bos) return { hatalar, durum: { label: 'Boş', cls: 'bg-zinc-500/10 text-zinc-400' } }
      if (s.sonuc?.ok)
        return { hatalar, durum: { label: 'Oluşturuldu', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' } }

      if (!h.ad.trim()) hatalar.ad = 'Ad zorunlu'
      if (!h.soyad.trim()) hatalar.soyad = 'Soyad zorunlu'
      if (h.tc.trim() && !tcGecerli(h.tc.trim())) hatalar.tc = 'Geçersiz T.C. kimlik no'
      else if (h.tc.trim() && personeller.some((p) => p.tc === h.tc.trim()))
        hatalar.tc = 'Mükerrer kayıt — T.C. kimlik no sistemde var'

      const firmaTxt = h.firma.trim()
      const eslesen = firmaCoz(firmaTxt)
      if (!eslesen) {
        if (firmaTxt && firmalar.filter((f) => trNorm(f.unvan).includes(trNorm(firmaTxt))).length > 1)
          hatalar.firma = 'Firma belirsiz — tam adı yazın veya listeden seçin'
        else if (!ayarlar.varsayilanFirma)
          hatalar.firma = firmaTxt ? 'Firma bulunamadı' : 'Firma gerekli (veya varsayılan firma seçin)'
        else hatalar.firma = 'Firma bulunamadı'
      }

      if (ayarlar.hesapOlustur) {
        const kul = h.kullaniciAdi.trim()
        if (!kul) hatalar.kullaniciAdi = 'Kullanıcı adı gerekli'
        else if (!/^[a-z0-9._-]+$/.test(kul)) hatalar.kullaniciAdi = 'Geçersiz karakter'
        else if (kullaniciVar(kul)) hatalar.kullaniciAdi = 'Kullanıcı adı çakışması'
      }

      // Liste içi mükerrer (önceki satırlara göre)
      const idx = satirlar.indexOf(s)
      for (let i = 0; i < idx; i++) {
        const o = satirlar[i].hucre
        if (!Object.values(o).some((v) => v.trim())) continue
        if (h.tc.trim() && o.tc.trim() === h.tc.trim()) hatalar.tc = 'Mükerrer kayıt — listede var'
        if (h.kullaniciAdi.trim() && o.kullaniciAdi.trim() === h.kullaniciAdi.trim())
          hatalar.kullaniciAdi = 'Kullanıcı adı çakışması — listede var'
        if (
          h.ad.trim() &&
          h.soyad.trim() &&
          trNorm(o.ad) === trNorm(h.ad) &&
          trNorm(o.soyad) === trNorm(h.soyad) &&
          trNorm(o.firma) === trNorm(h.firma)
        )
          hatalar.ad = hatalar.ad ?? 'Mükerrer kayıt — aynı ad-soyad listede var'
      }

      const ilk = Object.values(hatalar)[0]
      if (!ilk) return { hatalar, durum: { label: 'Hazır', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' } }
      const etiket = ilk.includes('Mükerrer')
        ? 'Mükerrer kayıt'
        : ilk.includes('Firma')
          ? 'Firma bulunamadı'
          : ilk.includes('çakışma')
            ? 'Kullanıcı adı çakışması'
            : ilk.includes('zorunlu') || ilk.includes('gerekli')
              ? 'Eksik bilgi'
              : 'Geçersiz veri'
      return { hatalar, durum: { label: etiket, cls: 'bg-red-500/10 text-red-600 dark:text-red-400' } }
    },
    [ayarlar.hesapOlustur, ayarlar.varsayilanFirma, firmaCoz, firmalar, kullaniciVar, personeller, satirlar],
  )

  const ozet = useMemo(() => {
    let gecerli = 0
    let hatali = 0
    let bos = 0
    for (const s of satirlar) {
      const b = satirBilgi(s)
      if (b.durum.label === 'Boş') bos++
      else if (Object.keys(b.hatalar).length === 0 && !s.sonuc) gecerli++
      else if (s.sonuc?.ok) gecerli++ // oluşturuldu sayısı — ayrı gösterilir
      else hatali++
    }
    return { toplam: satirlar.length, gecerli, hatali, bos }
  }, [satirlar, satirBilgi])

  /* ---------- dosya / yapıştır ---------- */
  const dosyaOku = (f: File) => {
    f.arrayBuffer().then((buf) => {
      const b = new Uint8Array(buf.slice(0, 4))
      if (b[0] === 0x50 && b[1] === 0x4b) {
        toast.error('.xlsx desteklenmiyor — dosyayı CSV olarak kaydedin veya tablodan kopyala-yapıştırın')
        return
      }
      f.text().then((t) => matrisUygula(metinAyristir(t)))
    })
  }

  const matrisUygula = (matris: string[][], esli = false) => {
    if (matris.length === 0) return
    const ilk = matris[0]
    const baslikVar = !esli && baslikSatirimi(ilk)
    const veri = baslikVar ? matris.slice(1) : matris
    if (veri.length === 0) return toast.error('Veri satırı bulunamadı')
    uygula((rows) => {
      const yeni = [...rows]
      veri.forEach((sat) => {
        const hedef = yeni.findIndex((s) => !Object.values(s.hucre).some((v) => v.trim()))
        const s = hedef >= 0 ? yeni[hedef] : bosSatir()
        const hucre = { ...s.hucre }
        sat.forEach((v, c) => {
          if (baslikVar) {
            const kol = baslikEslestir(ilk[c])
            if (kol) hucre[kol] = v
          } else if (c <= SON_C) {
            hucre[TOPLU_KOLONLAR[c].key] = v
          }
        })
        if (ayarlar.otoKul && !hucre.kullaniciAdi.trim() && (hucre.ad || hucre.soyad))
          hucre.kullaniciAdi = benzersizKullaniciAdi(kullaniciAdiUret(hucre.ad, hucre.soyad), (k) =>
            kullaniciVar(k) || yeni.some((x) => x.id !== s.id && x.hucre.kullaniciAdi === k),
          )
        const guncel = { ...s, hucre, sonuc: undefined }
        if (hedef >= 0) yeni[hedef] = guncel
        else yeni.push(guncel)
      })
      return yeni
    })
    toast.success(`${veri.length} satır aktarıldı`)
  }

  /* ---------- toplu oluşturma ---------- */
  const olustur = async () => {
    setOnayAcik(false)
    const hedefler = satirlar
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => {
        const b = satirBilgi(s)
        return b.durum.label !== 'Boş' && Object.keys(b.hatalar).length === 0 && !s.sonuc
      })
    if (hedefler.length === 0) return
    const sonucSatirlar: SonucSatir[] = []
    const ilerleme = { toplam: hedefler.length, bitti: 0, basarili: 0, hata: 0, calisiyor: true }
    setIslem({ ...ilerleme })

    for (let i = 0; i < hedefler.length; i += BATCH) {
      const parca = hedefler.slice(i, i + BATCH)
      const batchKul = new Set<string>()
      const kayitlar: TopluKayit[] = parca.map(({ s }) => {
        const h = s.hucre
        const sifre = h.sifre.trim() || (ayarlar.sifreModu === 'farkli' ? rastgeleSifre() : ayarlar.varsayilanSifre || '123456')
        const kul = h.kullaniciAdi.trim() || benzersizKullaniciAdi(kullaniciAdiUret(h.ad, h.soyad), (k) => kullaniciVar(k) || batchKul.has(k))
        batchKul.add(kul)
        const firma = firmaCoz(h.firma) ?? firmalar.find((f) => f.id === ayarlar.varsayilanFirma)
        return {
          firmaId: firma!.id,
          ad: h.ad.trim(),
          soyad: h.soyad.trim(),
          tc: h.tc.trim() || undefined,
          departman: h.departman.trim(),
          gorev: h.gorev.trim(),
          hesap: ayarlar.hesapOlustur,
          kullaniciAdi: kul,
          sifre,
          sifreDegisimZorunlu: ayarlar.ilkGirisZorunlu,
          islemNotu: 'Toplu içe aktarma ile oluşturuldu',
        }
      })
      const sonuclar = topluOlusturBatch(kayitlar, kullaniciVar)
      sonuclar.forEach((sonuc, j) => {
        const k = kayitlar[j]
        sonucSatirlar.push({
          ad: k.ad,
          soyad: k.soyad,
          firma: firmalar.find((f) => f.id === k.firmaId)?.unvan ?? k.firmaId,
          kullaniciAdi: k.hesap ? k.kullaniciAdi : '—',
          sifre: k.hesap ? k.sifre : '—',
          ok: sonuc.ok,
          mesaj: sonuc.mesaj,
        })
        if (sonuc.ok) ilerleme.basarili++
        else ilerleme.hata++
      })
      // Satır sonuçlarını geri yaz (undo'ya bulaşmadan)
      uygula((rows) =>
        rows.map((s) => {
          const idx = parca.findIndex((x) => x.s.id === s.id)
          if (idx < 0) return s
          return { ...s, sonuc: { ok: sonuclar[idx].ok, mesaj: sonuclar[idx].mesaj } }
        }),
        false,
      )
      ilerleme.bitti += parca.length
      setIslem({ ...ilerleme })
      await new Promise((r) => setTimeout(r, 0)) // UI'nin nefes alması için batch arası yield
    }
    setIslem((m) => (m ? { ...m, calisiyor: false } : m))
    setSonuc(sonucSatirlar)
  }

  const hesapKopyala = () => {
    if (!sonuc) return
    const metin = sonuc
      .filter((s) => s.kullaniciAdi !== '—')
      .map((s) => `${s.ad} ${s.soyad}\t${s.kullaniciAdi}\t${s.sifre}`)
      .join('\n')
    navigator.clipboard.writeText(`Personel\tKullanıcı Adı\tGeçici Şifre\n${metin}`)
    toast.success('Liste panoya kopyalandı')
  }

  const hesapIndir = () => {
    if (!sonuc) return
    // Tek seferlik hesap bilgileri — geçici şifre içerir, bu dosya dışında
    // hiçbir export parola/hash içermez
    xlsxIndir(xlsxDosyaAdi('Hesap_Bilgileri'), [
      {
        ad: 'Hesap Bilgileri',
        baslik: 'Oluşturulan Hesap Bilgileri',
        altBilgi: 'Toplu personel · geçici şifreler ilk girişte değiştirilmelidir',
        kolonlar: [
          { label: 'Personel', minGenislik: 24 },
          { label: 'Kullanıcı Adı', minGenislik: 20 },
          { label: 'Geçici Şifre', minGenislik: 16 },
          { label: 'Firma', minGenislik: 26, wrap: true },
          { label: 'Durum', minGenislik: 18, wrap: true },
        ],
        satirlar: sonuc.map((s) => [
          `${s.ad} ${s.soyad}`,
          s.kullaniciAdi,
          s.sifre,
          s.firma,
          s.ok ? 'Oluşturuldu' : `Hata: ${s.mesaj}`,
        ]),
      },
    ])
  }

  const sablonIndir = () => {
    const kols = TOPLU_KOLONLAR.filter((k) => ['ad', 'soyad', 'tc', 'firma', 'departman', 'gorev'].includes(k.key))
    xlsxIndir(xlsxDosyaAdi('Personel_Sablonu'), [
      {
        ad: 'Şablon',
        baslik: 'Toplu Personel Şablonu',
        altBilgi: 'Bu tabloyu kopyalayıp toplu oluşturma ekranına yapıştırın',
        kolonlar: kols.map((k) => ({ label: k.label, minGenislik: k.key === 'firma' ? 30 : 18, wrap: k.key === 'firma' })),
        satirlar: [
          ['Ahmet', 'Yılmaz', '12345678901', firmalar[0]?.unvan ?? 'Firma A.Ş.', 'Üretim', 'Operatör'],
        ],
      },
      {
        ad: 'Firma Listesi',
        baslik: 'Geçerli Firma Adları',
        altBilgi: 'Firma sütununa bu adlardan birini yazın',
        kolonlar: [{ label: 'Firma', minGenislik: 34, wrap: true }],
        satirlar: firmalar.map((f) => [f.unvan]),
      },
    ])
  }

  /* ---------- render ---------- */
  const statKart = (label: string, deger: number, cls: string) => (
    <div className="rounded-xl border bg-card px-4 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-semibold tabular-nums', cls)}>{deger}</p>
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Başlık + araç çubuğu */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-2">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/panel/personeller" className="hover:text-foreground">
              <ArrowLeftIcon className="size-4" />
            </Link>
            <h1 className="text-lg font-semibold text-foreground">Toplu Personel Oluşturma</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Excel'den personellerinizi aktarın, kullanıcı hesaplarını otomatik oluşturun.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={geriAl} disabled={gecmis.length === 0}>
            <Undo2Icon /> Geri Al
          </Button>
          <Button variant="outline" size="sm" onClick={yinele} disabled={ileri.length === 0}>
            <Redo2Icon /> Yinele
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={sablonIndir}>
            <DownloadIcon /> Şablon İndir
          </Button>
          <Button variant="outline" size="sm" onClick={() => setYapistirAcik(true)}>
            <ClipboardPasteIcon /> Excel'den Yapıştır
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <FileUpIcon /> Dosya Yükle
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) dosyaOku(f)
              e.target.value = ''
            }}
          />
          <Button variant="outline" size="sm" onClick={satirEkle}>
            <PlusIcon /> Satır Ekle
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => {
              temizle()
              toast.message('Tablo temizlendi')
            }}
          >
            <Trash2Icon /> Tümünü Temizle
          </Button>
          <Button
            size="sm"
            disabled={ozet.gecerli === 0}
            onClick={() => setOnayAcik(true)}
          >
            <CheckCircle2Icon /> Oluştur ({ozet.gecerli})
          </Button>
        </div>
      </div>

      {/* Hesap ayarları + istatistik — tek satır kompakt şerit */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border bg-card px-3 py-1.5">
          <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Hesap
          </span>
          <Ay label="Hesap oluştur" checked={ayarlar.hesapOlustur} onChange={(v) => setAyarlar({ ...ayarlar, hesapOlustur: v })} />
          <Ay label="Oto. kullanıcı adı" checked={ayarlar.otoKul} onChange={(v) => setAyarlar({ ...ayarlar, otoKul: v })} />
          <Ay label="İlk girişte şifre değişsin" checked={ayarlar.ilkGirisZorunlu} onChange={(v) => setAyarlar({ ...ayarlar, ilkGirisZorunlu: v })} />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            Şifre
            <select
              value={ayarlar.sifreModu}
              onChange={(e) => setAyarlar({ ...ayarlar, sifreModu: e.target.value as SifreModu })}
              className={cn(inp, 'h-7 w-auto px-2 text-xs')}
            >
              <option value="tek">Herkes aynı</option>
              <option value="farkli">Otomatik farklı</option>
            </select>
          </label>
          {ayarlar.sifreModu === 'tek' && (
            <input
              value={ayarlar.varsayilanSifre}
              onChange={(e) => setAyarlar({ ...ayarlar, varsayilanSifre: e.target.value })}
              className={cn(inp, 'h-7 w-24 px-2 text-xs')}
            />
          )}
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            Firma
            <select
              value={ayarlar.varsayilanFirma}
              onChange={(e) => setAyarlar({ ...ayarlar, varsayilanFirma: e.target.value })}
              className={cn(inp, 'h-7 w-44 max-w-52 px-2 text-xs')}
              title="Boş satırlara uygulanan varsayılan firma"
            >
              <option value="">Boş satırlar için…</option>
              {firmalar.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.unvan}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="ml-auto flex items-center gap-2.5 text-xs font-medium tabular-nums">
          <span className="text-muted-foreground">{ozet.toplam} satır</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-emerald-500">{ozet.gecerli} geçerli</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-red-500">{ozet.hatali} hatalı</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">{ozet.bos} boş</span>
        </div>
      </div>

      {!izinVarMi && (
        <div className="mx-6 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <ShieldAlertIcon className="size-4 shrink-0" />
          Bu işlem için <code className="rounded bg-background/50 px-1">personeller.toplu-olustur</code> izni gerekir. Görüntüleme serbest, oluşturma butonu yalnızca yetkili hesaplarda etkin olmalıdır (backend doğrulaması üretimde zorunludur).
        </div>
      )}

      {/* Grid */}
      <div className="min-h-0 flex-1 px-6 pb-3">
        <TopluGrid
          satirlar={satirlar}
          secim={secim}
          onSecim={setSecim}
          aktif={aktif}
          onAktif={setAktif}
          degerYaz={degerYaz}
          matrisYaz={matrisYaz}
          hucreTemizle={hucreTemizle}
          satirBilgi={satirBilgi}
          geriAl={geriAl}
          yinele={yinele}
          firmalar={firmalar}
          firmaIdBul={firmaIdBul}
        />
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          Enter ↓ · Tab → · Shift+Tab ← · Ok tuşları · Ctrl+C/V · Shift+seçim · Satır no: satır seç · Delete: temizle/sil · Ctrl+Z/Y: geri al/yinele
        </p>
      </div>

      {yapistirAcik && (
        <YapistirModal
          onKapat={() => setYapistirAcik(false)}
          onUygula={(matris, esli) => {
            matrisUygula(matris, esli)
            setYapistirAcik(false)
          }}
        />
      )}

      {onayAcik && (
        <Modal onKapat={() => setOnayAcik(false)} baslik="Toplu Oluşturma Önizlemesi">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {statKart('Bulunan', ozet.toplam - ozet.bos, '')}
              {statKart('Geçerli', ozet.gecerli, 'text-emerald-500')}
              {statKart('Hatalı', ozet.hatali, 'text-red-500')}
              {statKart('Hesap', ayarlar.hesapOlustur ? ozet.gecerli : 0, 'text-sky-500')}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {ozet.gecerli} personel{ayarlar.hesapOlustur ? ' ve kullanıcı hesabı' : ''} oluşturulacak.
              Hatalı {ozet.hatali} satır işlenmeyecek — düzelterek tekrar deneyebilirsiniz.
              {ayarlar.ilkGirisZorunlu && ' Oluşturulan hesaplarda ilk girişte şifre değiştirme ve KVKK teyidi zorunludur.'}
            </p>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="ghost" onClick={() => setOnayAcik(false)}>İptal</Button>
              <Button variant="outline" onClick={() => setOnayAcik(false)}>Hatalıları Düzelt</Button>
              <Button onClick={olustur}>
                <CheckCircle2Icon /> Yalnızca Geçerli {ozet.gecerli} Kaydı Oluştur
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {islem && (
        <Modal onKapat={() => !islem.calisiyor && setIslem(null)} baslik="Toplu Oluşturma İşlemi" kapatilamaz={islem.calisiyor}>
          <div className="space-y-4">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(islem.bitti / islem.toplam) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {islem.calisiyor && <Loader2Icon className="size-4 animate-spin" />}
                {islem.bitti}/{islem.toplam} işlendi
              </span>
              <span className="text-xs">
                <span className="text-emerald-500">{islem.basarili} başarılı</span>
                {' · '}
                <span className={islem.hata ? 'text-red-500' : 'text-muted-foreground'}>{islem.hata} hata</span>
              </span>
            </div>
            {!islem.calisiyor && (
              <div className="flex justify-end border-t pt-4">
                <Button onClick={() => setIslem(null)}>Tamam</Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {sonuc && !islem?.calisiyor && (
        <Modal genis onKapat={() => setSonuc(null)} baslik="Oluşturma Sonucu ve Giriş Bilgileri">
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              <ShieldAlertIcon className="size-4 shrink-0" />
              Bu liste geçici şifreleri içerir — yalnızca şimdi görüntülenir ve tek seferlik dışa aktarılır. Dosyayı güvenli kanaldan paylaşın.
            </div>
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-left text-[13px]">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Personel</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Kullanıcı Adı</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Geçici Şifre</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Firma</th>
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sonuc.map((s, i) => (
                    <tr key={i} className={!s.ok ? 'bg-red-500/5' : undefined}>
                      <td className="px-3 py-2 font-medium">{s.ad} {s.soyad}</td>
                      <td className="px-3 py-2 font-mono text-xs">{s.kullaniciAdi}</td>
                      <td className="px-3 py-2 font-mono text-xs">{s.sifre}</td>
                      <td className="max-w-44 truncate px-3 py-2 text-xs text-muted-foreground">{s.firma}</td>
                      <td className="px-3 py-2">
                        <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-medium', s.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500')}>
                          {s.ok ? 'Oluşturuldu' : s.mesaj}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={hesapKopyala}>
                <CopyIcon /> Listeyi Kopyala
              </Button>
              <Button variant="outline" onClick={hesapIndir}>
                <DownloadIcon /> Excel İndir
              </Button>
              <Button onClick={() => navigate('/panel/personeller')}>Personel Listesine Git</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ---------- küçük parçalar ---------- */

function Ay({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  )
}

function Modal({
  children,
  baslik,
  onKapat,
  genis,
  kapatilamaz,
}: {
  children: React.ReactNode
  baslik: string
  onKapat: () => void
  genis?: boolean
  kapatilamaz?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !kapatilamaz && onKapat()}>
      <div className={cn('w-full rounded-2xl border bg-card shadow-2xl', genis ? 'mx-4 max-w-4xl' : 'mx-4 max-w-xl')}>
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-sm font-semibold">{baslik}</h2>
          {!kapatilamaz && (
            <button onClick={onKapat} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

/* ---------- Excel'den yapıştırma + sütun eşleştirme ---------- */

function YapistirModal({ onKapat, onUygula }: { onKapat: () => void; onUygula: (m: string[][], esli?: boolean) => void }) {
  const [ham, setHam] = useState<string[][]>([])
  const [esleme, setEsleme] = useState<(TopluKol | '')[]>([])
  const [asama, setAsama] = useState<'yapistir' | 'eslestir'>('yapistir')

  const ayristir = (metin: string) => {
    const m = metinAyristir(metin)
    if (m.length === 0) return
    setHam(m)
    // Otomatik başlık eşleştirme
    const baslik = baslikSatirimi(m[0]) ? m[0] : null
    const es: (TopluKol | '')[] = Array.from({ length: Math.max(...m.map((r) => r.length)) }, (_, i) =>
      baslik ? (baslikEslestir(baslik[i]) ?? '') : '',
    )
    setEsleme(es)
    if (baslik && es.every(Boolean)) {
      onUygula(m) // tüm sütunlar tanındı — doğrudan uygula
      return
    }
    setAsama('eslestir')
  }

  const uygula = () => {
    const baslik = baslikSatirimi(ham[0]) ? ham[0] : null
    const veri = baslik ? ham.slice(1) : ham
    // Eşlemeye göre kolon sırasını yeniden düzenle → standart matris
    const matris = veri.map((sat) =>
      TOPLU_KOLONLAR.map((kol) => {
        const srcIdx = esleme.indexOf(kol.key)
        return srcIdx >= 0 ? (sat[srcIdx] ?? '') : ''
      }),
    )
    onUygula(matris, true)
  }

  return (
    <Modal onKapat={onKapat} baslik="Excel'den Yapıştır" genis>
      {asama === 'yapistir' ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Excel'de satırları seçip kopyalayın (Ctrl+C), sonra aşağıdaki alana yapıştırın (Ctrl+V).
            Başlıklar varsa sütunlar otomatik eşleştirilir.
          </p>
          <textarea
            autoFocus
            rows={10}
            placeholder="Buraya Ctrl+V ile yapıştırın…"
            onPaste={(e) => {
              const t = e.clipboardData.getData('text')
              if (t) {
                e.preventDefault()
                ayristir(t)
              }
            }}
            onChange={(e) => e.target.value && ayristir(e.target.value)}
            className="w-full rounded-xl border border-dashed bg-muted/30 p-3 font-mono text-xs outline-none focus:border-primary"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {ham.length} satır algılandı — bazı sütunlar tanınamadı. Her sütun için hedef alanı seçin:
          </p>
          <div className="overflow-auto rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60">
                <tr>
                  {esleme.map((e, i) => (
                    <th key={i} className="border-r px-2 py-2 last:border-r-0">
                      <p className="mb-1.5 truncate font-mono text-[10px] text-muted-foreground">{ham[0]?.[i] ?? `Sütun ${i + 1}`}</p>
                      <select
                        value={e}
                        onChange={(ev) => setEsleme(esleme.map((x, j) => (j === i ? (ev.target.value as TopluKol | '') : x)))}
                        className={cn('w-full rounded-lg border bg-background px-2 py-1.5 text-xs outline-none', e ? 'border-primary/50' : 'border-border')}
                      >
                        <option value="">— Atla —</option>
                        {TOPLU_KOLONLAR.map((k) => (
                          <option key={k.key} value={k.key} disabled={esleme.includes(k.key) && e !== k.key}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ham.slice(baslikSatirimi(ham[0]) ? 1 : 0, (baslikSatirimi(ham[0]) ? 1 : 0) + 4).map((sat, i) => (
                  <tr key={i} className="border-t">
                    {esleme.map((_, c) => (
                      <td key={c} className="max-w-40 truncate border-r px-2 py-1.5 text-muted-foreground last:border-r-0">
                        {sat[c] || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onKapat}>Vazgeç</Button>
            <Button onClick={uygula}>
              <CheckCircle2Icon /> Eşleştir ve Aktar ({ham.length - (baslikSatirimi(ham[0]) ? 1 : 0)} satır)
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
