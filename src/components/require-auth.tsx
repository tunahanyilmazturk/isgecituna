import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'

/** Oturum açılmamışsa girişe yönlendirir. */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/giris" replace />
  return <Outlet />
}
