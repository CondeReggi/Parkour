import { Link, useParams } from 'react-router-dom'
import { Lock, UserX } from 'lucide-react'
import { MotionPage } from '@/components/motion/MotionPage'
import { PageHeader } from '@/components/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePublicProfileByUsername } from './hooks/usePublicProfile'
import { PublicProfileView } from './components/PublicProfileView'

/**
 * Vista pública en `/u/:username`. Hoy no hay comunidad remota: sólo
 * resuelve perfiles del propio dispositivo. Cuando se agregue sync, el
 * mismo endpoint va a poder devolver perfiles de otros usuarios.
 *
 * El DTO viene discriminado por `visibility`, así que cada rama
 * (public / private / not_found) renderiza algo coherente sin tener
 * que inferir nada.
 */
export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const q = usePublicProfileByUsername(username)

  if (q.isLoading) {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </MotionPage>
    )
  }

  if (!q.data) {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl">
        <p className="text-sm text-muted-foreground">
          No se pudo cargar el perfil.
        </p>
      </MotionPage>
    )
  }

  if (q.data.visibility === 'not_found') {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl">
        <PageHeader title={`@${q.data.username}`} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="h-5 w-5 text-muted-foreground" />
              No encontramos a este usuario
            </CardTitle>
            <CardDescription>
              No existe una cuenta con ese username en este dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard">Volver al dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </MotionPage>
    )
  }

  if (q.data.visibility === 'private') {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl">
        <PageHeader title={`@${q.data.username}`} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Este perfil es privado
            </CardTitle>
            <CardDescription>
              El usuario decidió no compartir su perfil. No podemos mostrar
              sus datos.
            </CardDescription>
          </CardHeader>
        </Card>
      </MotionPage>
    )
  }

  // visibility === 'public'
  return (
    <MotionPage className="px-8 py-6 max-w-3xl space-y-6">
      <PageHeader title={`@${q.data.data.username}`} />
      <Card>
        <CardContent className="pt-6">
          <PublicProfileView data={q.data.data} />
        </CardContent>
      </Card>
    </MotionPage>
  )
}
