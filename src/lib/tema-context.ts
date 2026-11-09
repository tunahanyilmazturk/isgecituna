import { createContext, useContext } from 'react'

export type Tema = 'light' | 'dark' | 'system'
export type CozulmusTema = Exclude<Tema, 'system'>

export interface TemaDurumu {
  theme: Tema
  resolvedTheme: CozulmusTema
  setTheme: (tema: Tema) => void
}

export const TemaContext = createContext<TemaDurumu | null>(null)

export function useTheme(): TemaDurumu {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalı')
  return ctx
}
