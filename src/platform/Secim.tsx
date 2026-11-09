import { HeartPulseIcon, ShieldCheckIcon } from 'lucide-react'
import '@/index.css'

const MODULLER = [
  { yol: '/isg/', ad: 'İSG Yönetimi', aciklama: 'Risk değerlendirme, denetim, eğitim ve İSG süreçleri', ikon: ShieldCheckIcon },
  { yol: '/saglik/', ad: 'Mobil Sağlık Taraması', aciklama: 'Firma, tarama, teklif, ekip ve sonuç yönetimi', ikon: HeartPulseIcon },
]

/** Platform giriş ekranı: modül seçilir, ardından modülün giriş ekranına geçilir */
export default function Secim() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="text-center">
        <p className="text-lg font-semibold tracking-tight">osgb platform</p>
        <p className="text-sm text-muted-foreground">Çalışmak istediğiniz modülü seçin</p>
      </div>
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {MODULLER.map((m) => (
          <a key={m.yol} href={m.yol} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-amber-400/60">
            <span className="flex size-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-400">
              <m.ikon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{m.ad}</span>
              <span className="block text-xs text-muted-foreground">{m.aciklama}</span>
            </span>
          </a>
        ))}
      </div>
    </main>
  )
}
