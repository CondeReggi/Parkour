import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquarePlus, Users2 } from 'lucide-react'
import { POST_TYPE_OPTIONS, type PostType } from '@shared/types/post'
import { PageHeader } from '@/components/PageHeader'
import { MotionPage } from '@/components/motion/MotionPage'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useCommunityFeed } from './hooks/usePosts'
import { useAuthState } from '@/features/auth/hooks/useAuth'
import { PostCard } from './components/PostCard'

export function CommunityPage() {
  const [typeFilter, setTypeFilter] = useState<PostType | null>(null)
  const feedQ = useCommunityFeed(typeFilter ? { type: typeFilter } : undefined)
  const { data: authState } = useAuthState()
  const isAuthenticated = authState?.mode === 'authenticated'

  return (
    <MotionPage className="px-8 py-6 max-w-4xl space-y-6">
      <PageHeader
        title="Comunidad"
        description="Publicaciones de la comunidad. Hoy se ven sólo las que están en este dispositivo; cuando se conecte el feed remoto, las verás todas."
      >
        {isAuthenticated ? (
          <Button asChild size="sm">
            <Link to="/community/new">
              <MessageSquarePlus className="h-4 w-4" />
              Nueva publicación
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link to="/login">Iniciar sesión para publicar</Link>
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip
          active={typeFilter === null}
          onClick={() => setTypeFilter(null)}
          label="Todos"
        />
        {POST_TYPE_OPTIONS.map((o) => (
          <FilterChip
            key={o.value}
            active={typeFilter === o.value}
            onClick={() => setTypeFilter(o.value)}
            label={o.label}
          />
        ))}
        <div className="ml-auto">
          <Button asChild variant="ghost" size="sm">
            <Link to="/community/mine">
              <Users2 className="h-4 w-4" />
              Mis publicaciones
            </Link>
          </Button>
        </div>
      </div>

      {feedQ.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {feedQ.error instanceof Error
              ? feedQ.error.message
              : String(feedQ.error)}
          </AlertDescription>
        </Alert>
      )}

      {feedQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : feedQ.data && feedQ.data.length > 0 ? (
        <div className="space-y-3">
          {feedQ.data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <MessageSquarePlus className="h-8 w-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">
                {typeFilter
                  ? 'No hay publicaciones de este tipo todavía.'
                  : 'No hay publicaciones todavía.'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sé el primero en crear una.
              </p>
            </div>
            {isAuthenticated && (
              <Button asChild size="sm">
                <Link to="/community/new">Crear publicación</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </MotionPage>
  )
}

interface FilterChipProps {
  active: boolean
  onClick: () => void
  label: string
}

function FilterChip({ active, onClick, label }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'transition-colors rounded-full',
        active ? '' : 'opacity-70 hover:opacity-100'
      )}
    >
      <Badge
        variant={active ? 'default' : 'outline'}
        className="cursor-pointer"
      >
        {label}
      </Badge>
    </button>
  )
}
