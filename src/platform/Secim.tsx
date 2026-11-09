import { ArrowRightIcon, HeartPulseIcon, ShieldCheckIcon } from 'lucide-react'
import '@/index.css'

const MODULLER = [
  {
    yol: '/isg/',
    ad: 'İSG Yönetimi',
    aciklama: 'Risk değerlendirme, denetim, eğitim ve İSG süreçleri',
    gorsel: '/images/isg-kart-gorsel.jpg',
    ikon: ShieldCheckIcon,
  },
  {
    yol: '/saglik/',
    ad: 'Mobil Sağlık Taraması',
    aciklama: 'Firma, tarama, teklif, ekip ve sonuç yönetimi',
    gorsel: '/images/saglik-kart-gorsel.jpg',
    ikon: HeartPulseIcon,
  },
]

/** Platform giriş ekranı: modül seçilir, ardından modülün giriş ekranına geçilir */
export default function Secim() {
  return (
    <main className="dark relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-[#11110f] p-4 text-foreground sm:p-6">
      <img
        src="/images/platform-secim-arkaplan.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-40"
      />
      <header className="relative flex flex-col items-center gap-2 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-400 uppercase">
          <span className="size-1.5 rounded-full bg-amber-400" />
          osgb platform
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Hangi modülle çalışmak istersiniz?</h1>
        <p className="max-w-md text-sm text-zinc-400">Her modülün kendi giriş ekranı ve verileri vardır. Seçtiğiniz modüle geçebilirsiniz.</p>
      </header>
      <div className="relative grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        {MODULLER.map((m) => (
          <a
            key={m.yol}
            href={m.yol}
            className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-card shadow-sm transition-colors hover:border-amber-400/60 sm:aspect-[4/5]"
          >
            <img
              src={m.gorsel}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
            <div className="relative flex flex-col gap-3 p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400 backdrop-blur-sm">
                <m.ikon className="size-5" />
              </span>
              <span>
                <span className="block text-base font-semibold text-white">{m.ad}</span>
                <span className="block text-xs text-zinc-300">{m.aciklama}</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                Giriş yap
                <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
