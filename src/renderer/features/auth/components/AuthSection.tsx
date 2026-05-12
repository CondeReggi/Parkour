import { Link } from 'react-router-dom'
import { Globe2, LogIn, UserRound } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthState, useLogout } from '../hooks/useAuth'
import { AccountCard } from './AccountCard'

/**
 * Sección "Cuenta" composable. Se monta dentro de SettingsPage.
 *
 * Renderiza dos estados:
 *  - Con sesión → muestra `AccountCard` + botón "Cerrar sesión".
 *  - Sin sesión (modo local) → muestra invitación a iniciar sesión y
 *    explica qué cambia al hacerlo.
 *
 * Mientras la query carga muestra un placeholder neutro — sin esto, el
 * primer render alternaría entre los dos estados y se vería un flash.
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

  if (state?.account) {
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
        <CardContent className="space-y-4">
          <AccountCard
            account={state.account}
            onSignOut={() => logoutMut.mutate()}
            signingOut={logoutMut.isPending}
          />
          <Button asChild variant="outline" size="sm">
            <Link to="/profile">
              <Globe2 className="h-4 w-4" />
              Editar perfil público
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Modo local — sin sesión.
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserRound className="h-4 w-4 text-muted-foreground" />
          Cuenta
          <Badge variant="secondary" className="text-[10px]">
            Modo local
          </Badge>
        </CardTitle>
        <CardDescription>
          Estás usando la app sin cuenta. Tus datos viven sólo en este
          dispositivo. Si iniciás sesión, el perfil actual se vincula sin
          perder progreso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild size="sm">
          <Link to="/login">
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
