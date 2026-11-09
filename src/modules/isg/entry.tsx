import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '@/lib/theme'
import { Toaster } from '@/components/ui/sonner'
import '@/index.css'
import App from '@/App'

/** İSG yönetim modülü: kendi yönlendirmesi `/isg` altında çalışır */
export default function IsgModul() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/isg">
        <App />
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  )
}
