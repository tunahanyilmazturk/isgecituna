import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '@saglik/lib/theme'
import { Toaster } from '@saglik/components/ui/sonner'
import '@saglik/index.css'
import App from '@saglik/App'

/** Mobil sağlık taraması modülü: kendi yönlendirmesi `/saglik` altında çalışır */
export default function SaglikModul() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/saglik">
        <App />
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  )
}
