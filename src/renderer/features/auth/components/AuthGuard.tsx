import { Navigate, useLocation } from 'react-router-dom'
import { useAuthState } from '../hooks/useAuth'

/**
 * Guard de rutas protegidas. Si no hay sesión activa, redirige a
 * `/login` preservando la ruta original en `state.from` para que el
 * login pueda volver después (lo dejamos preparado aunque hoy no lo
 * usemos).
 *
 * Mientras la query de auth carga, mostramos un placeholder neutro —
 * así no flashea el redirect antes de saber si hay sesión.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { data, isLoading } = useAuthState()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (!data || data.mode !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
