import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

/* Platform yönlendirmesi: yol önekine göre ilgili modül yüklenir (her modül kendi CSS'ini getirir) */
const yol = window.location.pathname
const Modul = yol.startsWith('/saglik')
  ? lazy(() => import('./modules/saglik/entry'))
  : yol.startsWith('/isg')
    ? lazy(() => import('./modules/isg/entry'))
    : lazy(() => import('./platform/Secim'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Modul />
    </Suspense>
  </StrictMode>,
)
