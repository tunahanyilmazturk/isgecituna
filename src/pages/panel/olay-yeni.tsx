import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  PaperclipIcon,
  ShieldAlertIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AdimEkler,
  AdimIlkMudahale,
  AdimIlgiliKisiler,
  AdimOlayBilgileri,
  AdimSiniflandirma,
} from '@/components/olaylar/olay-form'
import { bosForm, formdanOlaya } from '@/components/olaylar/olay-form-utils'
import type { OlayFormSet } from '@/components/olaylar/olay-form-utils'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useOlaylarStore } from '@/stores/olaylar-store'
import { BUGUN, SORUMLULAR } from '@/data/olaylar'

const ADIMLAR = [
  {
    harf: 'A',
    baslik: 'Olay Bilgileri',
    aciklama: 'Tarih, yer, tür ve açıklama',
    ikon: FileTextIcon,
  },
  {
    harf: 'B',
    baslik: 'İlgili Kişiler',
    aciklama: 'Etkilenen çalışan ve tanıklar',
    ikon: UsersIcon,
  },
  {
    harf: 'C',
    baslik: 'Sınıflandırma',
    aciklama: 'Risk seviyesi ve sonuç',
    ikon: ShieldAlertIcon,
  },
  {
    harf: 'D',
    baslik: 'Kanıt ve Ekler',
    aciklama: 'Fotoğraf, belge, video',
    ikon: PaperclipIcon,
  },
  {
    harf: 'E',
    baslik: 'İlk Müdahale & Aksiyon',
    aciklama: 'Önlemler ve DÖF planı',
    ikon: ClipboardListIcon,
  },
]

export default function OlayYeniPage() {
  const navigate = useNavigate()
  const ekle = useOlaylarStore((s) => s.ekle)
  const user = useAuthStore((s) => s.user)
  const dosyaRef = useRef<HTMLInputElement>(null)

  const [adim, setAdim] = useState(0)
  const [form, setForm] = useState(() => bosForm(user?.name ?? 'Tunahan Yılmaztürk'))
  const set: OlayFormSet = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const sonAdim = adim === ADIMLAR.length - 1
  const aktif = ADIMLAR[adim]

  const kaydet = () => {
    if (!form.baslik.trim()) {
      toast.error('Olay başlığı gerekli — Olay Bilgileri adımına dönün')
      setAdim(0)
      return
    }
    const yeniAksiyonlar =
      form.aksiyonSorumlusu && form.duzelticiFaaliyet
        ? [
            {
              id: 'AKS-Y',
              aciklama: form.duzelticiFaaliyet.trim(),
              sorumlu: form.aksiyonSorumlusu,
              baslangic: BUGUN,
              hedefBitis: form.hedefTarih || BUGUN,
              tamamlandi: false,
            },
          ]
        : []
    const sorumlu = form.aksiyonSorumlusu || SORUMLULAR[0]
    const yeni = ekle({ ...formdanOlaya(form), sorumlu, aksiyonlar: yeniAksiyonlar })
    toast.success(`${yeni.id} oluşturuldu — durum: Yeni Bildirildi`)
    navigate('/panel/olaylar')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Yeni Olay Bildir</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            İş kazası, ramak kala veya tehlikeli durum kaydı — adım adım tamamlayın.
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Kapat" onClick={() => navigate('/panel/olaylar')}>
          <XIcon />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <aside className="relative hidden w-60 shrink-0 flex-col overflow-hidden rounded-xl border bg-[#111214] bg-cover bg-[center_68%] p-2.5 text-white lg:flex" style={{ backgroundImage: "url('/images/firma-wizard-sidebar.png')" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#101113]/95 via-[#111214]/82 to-[#111214]/95" />
          <div className="relative z-10 border-b border-white/10 px-2.5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="grid size-7 place-items-center rounded-lg bg-amber-400/15 text-amber-300"><ShieldAlertIcon className="size-4" /></span> Olay bildirimi</div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/60">Olayı kaydedin, ilgili kişileri ve alınan önlemleri aynı akışta tamamlayın.</p>
          </div>
          <nav className="relative z-10 mt-2 space-y-1">
            {ADIMLAR.map((a, i) => {
              const tamam = i < adim
              const simdiki = i === adim
              return (
                <button
                  key={a.harf}
                  type="button"
                  onClick={() => setAdim(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    simdiki ? 'bg-white/10' : 'hover:bg-white/5',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                      tamam && 'border-emerald-500 bg-emerald-500 text-white',
                      simdiki && 'border-amber-400 bg-amber-400 text-zinc-950',
                      !tamam && !simdiki && 'border-white/20 text-white/50',
                    )}
                  >
                    {tamam ? <CheckIcon className="size-3.5" /> : a.harf}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block truncate text-sm',
                        simdiki ? 'font-medium text-white' : 'text-white/75',
                      )}
                    >
                      {a.baslik}
                    </span>
                    <span className="block truncate text-xs text-white/50">
                      {a.aciklama}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>
          <div className="relative z-10 mt-auto rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 backdrop-blur-sm">
            <div className="mb-1.5 flex justify-between text-xs text-white/60">
              <span>İlerleme</span>
              <span className="tabular-nums">
                {adim + 1}/{ADIMLAR.length}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${((adim + 1) / ADIMLAR.length) * 100}%` }}
              />
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <aktif.ikon className="size-4" />
            </span>
            <div>
              <h2 className="font-medium">{aktif.baslik}</h2>
              <p className="text-xs text-muted-foreground">
                Adım {adim + 1}/{ADIMLAR.length} · {aktif.aciklama}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {adim === 0 && <AdimOlayBilgileri form={form} set={set} />}
            {adim === 1 && <AdimIlgiliKisiler form={form} set={set} />}
            {adim === 2 && <AdimSiniflandirma form={form} set={set} />}
            {adim === 3 && <AdimEkler form={form} set={set} dosyaRef={dosyaRef} />}
            {adim === 4 && <AdimIlkMudahale form={form} set={set} />}
          </div>

          <div className="flex items-center justify-between border-t px-5 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/panel/olaylar')}>
              Vazgeç
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={adim === 0}
                onClick={() => setAdim((a) => a - 1)}
              >
                <ArrowLeftIcon /> Geri
              </Button>
              {sonAdim ? (
                <Button size="sm" onClick={kaydet}>
                  Olayı Bildir
                </Button>
              ) : (
                <Button size="sm" onClick={() => setAdim((a) => a + 1)}>
                  İleri <ArrowRightIcon />
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
