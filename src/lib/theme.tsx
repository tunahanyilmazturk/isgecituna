import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TemaContext, type CozulmusTema, type Tema } from '@/lib/tema-context'

/*
 * Tema sağlayıcısı — next-themes yerine yerel uygulama. next-themes, React 19 altında
 * render sırasında <script> öğesi üretip konsola uyarı bastığı için kaldırıldı.
 * Tercih `theme` anahtarında saklanır; html kökünde `dark` sınıfı ve color-scheme uygulanır.
 */

const ANAHTAR = 'theme'
const KARANLIK_SORGU = '(prefers-color-scheme: dark)'

const kayitliTema = (): Tema => {
  try {
    const v = localStorage.getItem(ANAHTAR)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* depo erişilemez — varsayılan */
  }
  return 'system'
}

const sistemKoyuMu = () => typeof window !== 'undefined' && window.matchMedia(KARANLIK_SORGU).matches

const temaUygula = (cozulmus: CozulmusTema) => {
  const kok = document.documentElement
  kok.classList.toggle('dark', cozulmus === 'dark')
  kok.style.colorScheme = cozulmus
}

// Boyama öncesi uygula: ilk render'da yanlış tema görünmesin.
if (typeof document !== 'undefined') {
  const ilk = kayitliTema()
  temaUygula(ilk === 'system' ? (sistemKoyuMu() ? 'dark' : 'light') : ilk)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Tema>(kayitliTema)
  const [sistemKoyu, setSistemKoyu] = useState(sistemKoyuMu)

  useEffect(() => {
    const sorgu = window.matchMedia(KARANLIK_SORGU)
    const dinle = () => setSistemKoyu(sorgu.matches)
    sorgu.addEventListener('change', dinle)
    return () => sorgu.removeEventListener('change', dinle)
  }, [])

  const resolvedTheme: CozulmusTema = theme === 'system' ? (sistemKoyu ? 'dark' : 'light') : theme

  useEffect(() => {
    temaUygula(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback((tema: Tema) => {
    try {
      localStorage.setItem(ANAHTAR, tema)
    } catch {
      /* kaydedilemedi — oturum boyunca yine de uygulanır */
    }
    setThemeState(tema)
  }, [])

  const deger = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])

  return <TemaContext.Provider value={deger}>{children}</TemaContext.Provider>
}
