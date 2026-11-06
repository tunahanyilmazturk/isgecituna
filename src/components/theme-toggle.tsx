import { flushSync } from 'react-dom'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme = 'light', setTheme } = useTheme()

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!document.startViewTransition || reducedMotion) {
      setTheme(next)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || rect.left + rect.width / 2
    const y = e.clientY || rect.top + rect.height / 2

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    })

    transition.ready.then(() => {
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Temayı değiştir"
      onClick={toggleTheme}
      className={cn('relative', className)}
    >
      <SunIcon className="size-4 scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
