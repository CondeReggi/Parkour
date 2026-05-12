import { Navigate, useLocation } from 'react-router-dom'
import { hasChosenLocalMode, useAuthState } from '../hooks/useAuth'

/**
 * Guard de rutas protegidas.
 *
 * Política:
 *  - `mode === 'authenticated'` → pasa.
 *  - `mode === 'local'` + flag explícita "elegí seguir sin cuenta" →
 *    pasa. La flag la setea `useContinueLocal` y la limpian login,
 *    register, googleSignIn y logout.
 *  - Cualquier otro caso → redirect a `/login`, preservando la ruta
 *    original en `state.from` para volver después de iniciar sesión.
 *
 * Mientras la query carga mostramos un placeholder — sin esto, el primer
 * frame redirige a /login y se ve un flash incómodo.
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

  const authenticated = data?.mode === 'authenticated'
  const allowedLocal = data?.mode === 'local' && hasChosenLocalMode()

  if (!authenticated && !allowedLocal) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
