import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DownloadIcon, EyeIcon, FileTextIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EvrakOnizleme } from '@/components/evrak/evrak-onizleme'
import { useAuthStore } from '@/stores/auth-store'
import {
  EVRAK_KABUL,
  EVRAK_KATEGORILERI,
  EVRAK_MAX_BOYUT,
  boyutMetni,
  depoSigarMi,
  dosyaIndir,
  dosyaOku,
  onizlenebilir,
  uzanti,
  useEvrakStore,
  type Evrak,
  type EvrakKategori,
} from '@/stores/evraklar-store'

const UZANTILAR = EVRAK_KABUL.split(',').map((u) => u.replace('.', ''))

/**
 * İSG uzmanı için firma evrakları yönetimi: yükle, listele, indir, sil.
 * Yüklenen evraklar firma portalında "Evraklar" sayfasında görünür.
 */
export function FirmaEvraklarPanel({ firmaId }: { firmaId: string }) {
  const evraklar = useEvrakStore((s) => s.evraklar)
  const ekle = useEvrakStore((s) => s.ekle)
  const sil = useEvrakStore((s) => s.sil)
  const user = useAuthStore((s) => s.user)
  const [kategori, setKategori] = useState<EvrakKategori>('İSG Sözleşmesi')
  const [onizle, setOnizle] = useState<Evrak | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const firmaEvraklari = useMemo(
    () => evraklar.filter((e) => e.firmaId === firmaId),
    [evraklar, firmaId],
  )

  const yukle = async (dosya: File | undefined) => {
    if (!dosya) return
    const uzantiAdi = uzanti(dosya.name).toLowerCase()
    if (!UZANTILAR.includes(uzantiAdi)) return toast.error(`Desteklenmeyen dosya türü: .${uzantiAdi}`)
    if (dosya.size > EVRAK_MAX_BOYUT) return toast.error(`Dosya en fazla ${boyutMetni(EVRAK_MAX_BOYUT)} olabilir`)
    if (!depoSigarMi(evraklar, dosya.size)) return toast.error('Depolama alanı dolu; eski evrakları silerek devam edin')
    setYukleniyor(true)
    try {
      const icerik = await dosyaOku(dosya)
      ekle({
        firmaId,
        ad: dosya.name.replace(/\.[^.]+$/, ''),
        kategori,
        dosyaAdi: dosya.name,
        mime: dosya.type || 'application/octet-stream',
        boyut: dosya.size,
        icerik,
        yukleyen: user?.name ?? user?.username ?? 'İSG uzmanı',
      })
      toast.success('Evrak firmaya yüklendi')
    } catch {
      toast.error('Dosya okunamadı')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3">
        <label className="min-w-40 flex-1 space-y-1">
          <span className="text-[11px] text-muted-foreground">Kategori</span>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value as EvrakKategori)}
            className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm"
          >
            {EVRAK_KATEGORILERI.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted ${yukleniyor ? 'pointer-events-none opacity-60' : ''}`}>
          <UploadIcon className="size-4" /> {yukleniyor ? 'Yükleniyor…' : 'Evrak yükle'}
          <input
            type="file"
            accept={EVRAK_KABUL}
            className="sr-only"
            onChange={(e) => {
              yukle(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        <p className="w-full text-[11px] text-muted-foreground">
          PDF, Word, Excel, JPG veya PNG · en fazla {boyutMetni(EVRAK_MAX_BOYUT)} · firma portalında yalnızca görüntülenir.
        </p>
      </div>

      {firmaEvraklari.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
          <FileTextIcon className="size-7 text-muted-foreground/50" />
          <p className="text-sm font-medium">Bu firma için henüz evrak yüklenmedi</p>
          <p className="text-xs text-muted-foreground">Yüklediğiniz evraklar firmanın Evraklar sayfasında görünür.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {firmaEvraklari.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                {uzanti(e.dosyaAdi).slice(0, 4)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.ad}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {e.kategori} · {boyutMetni(e.boyut)} · {e.yukleyen} · {new Date(e.tarih).toLocaleDateString('tr-TR')}
                </p>
              </div>
              {onizlenebilir(e.mime) && (
                <Button size="xs" variant="ghost" aria-label={`${e.ad} önizle`} onClick={() => setOnizle(e)}>
                  <EyeIcon />
                </Button>
              )}
              <Button size="xs" variant="ghost" aria-label={`${e.ad} indir`} onClick={() => dosyaIndir(e)}>
                <DownloadIcon />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                aria-label={`${e.ad} sil`}
                onClick={() => {
                  if (window.confirm(`“${e.ad}” evrakı firmadan kaldırılsın mı? Firma bu evrakı artık göremez.`)) {
                    sil(e.id)
                    toast.success('Evrak silindi')
                  }
                }}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <EvrakOnizleme evrak={onizle} onKapat={() => setOnizle(null)} />
    </section>
  )
}
