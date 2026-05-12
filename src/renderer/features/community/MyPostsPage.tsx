import { Link } from 'react-router-dom'
import { ArrowLeft, MessageSquarePlus } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MotionPage } from '@/components/motion/MotionPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMyPosts } from './hooks/usePosts'
import { useAuthState } from '@/features/auth/hooks/useAuth'
import { PostCard } from './components/PostCard'

export function MyPostsPage() {
  const myQ = useMyPosts()
  const { data: state } = useAuthState()
  const isLocal = state?.mode !== 'authenticated'

  if (isLocal) {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/community">
            <ArrowLeft className="h-4 w-4" />
            Volver al feed
          </Link>
        </Button>
        <PageHeader title="Mis publicaciones" />
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <p className="text-sm">
              Necesitás iniciar sesión para ver tus publicaciones.
            </p>
            <Button asChild size="sm">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </MotionPage>
    )
  }

  return (
    <MotionPage className="px-8 py-6 max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/community">
          <ArrowLeft className="h-4 w-4" />
          Volver al feed
        </Link>
      </Button>
      <PageHeader
        title="Mis publicaciones"
        description="Todo lo que publicaste, en cualquier estado de visibilidad."
      >
        <Button asChild size="sm">
          <Link to="/community/new">
            <MessageSquarePlus className="h-4 w-4" />
            Nueva publicación
          </Link>
        </Button>
      </PageHeader>

      {myQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : myQ.data && myQ.data.length > 0 ? (
        <div className="space-y-3">
          {myQ.data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <MessageSquarePlus className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm">Todavía no publicaste nada.</p>
            <Button asChild size="sm">
              <Link to="/community/new">Crear mi primera publicación</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </MotionPage>
  )
}
