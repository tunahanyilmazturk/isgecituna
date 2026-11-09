import { ThemeProvider } from '@/lib/theme'
import { Toaster } from '@/components/ui/sonner'
import '@/index.css'
import App from '@/App'

/** İSG yönetim modülü: yönlendirme kendi hash tabanlı router'ında çalışır */
export default function IsgModul() {
  return (
    <ThemeProvider>
      <App />
      <Toaster />
    </ThemeProvider>
  )
}
