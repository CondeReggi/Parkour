import { UserRound } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useAuthState, useLogout } from '../hooks/useAuth'
import { AccountCard } from './AccountCard'

/**
 * Sección "Cuenta" composable. Se monta dentro de SettingsPage.
 *
 * Como las rutas privadas están protegidas por AuthGuard, esta sección
 * siempre se renderiza con un usuario logueado: muestra los datos de la
 * cuenta y el botón de cerrar sesión. No tiene rama "sin sesión".
 *
 * Si por algún motivo la query devuelve null (estado intermedio durante
 * un logout, por ejemplo), no renderiza nada — el AuthGuard se va a
 * encargar de redirigir al login en el siguiente render.
 */
export function AuthSection() {
  const { data: state, isLoading } = useAuthState()
  const logoutMut = useLogout()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </CardContent>
      </Card>
    )
  }

  if (!state?.account) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserRound className="h-4 w-4 text-muted-foreground" />
          Cuenta
        </CardTitle>
        <CardDescription>
          Tu identidad para preparar sincronización y comunidad. Tus
          datos siguen viviendo localmente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AccountCard
          account={state.account}
          onSignOut={() => logoutMut.mutate()}
          signingOut={logoutMut.isPending}
        />
      </CardContent>
    </Card>
  )
}
