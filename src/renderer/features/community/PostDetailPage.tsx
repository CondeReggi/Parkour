import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  EyeOff,
  Link2,
  Lock,
  Pencil,
  Trash2,
  UserCircle2
} from 'lucide-react'
import { MotionPage } from '@/components/motion/MotionPage'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useDeletePost, usePost } from './hooks/usePosts'
import { PostTypeBadge } from './components/PostTypeBadge'
import { CommentsSection } from '@/features/comments/components/CommentsSection'

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const postQ = usePost(id)
  const deleteMut = useDeletePost()
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (postQ.isLoading) {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </MotionPage>
    )
  }

  if (!postQ.data) {
    return (
      <MotionPage className="px-8 py-6 max-w-3xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/community">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <p className="text-sm">Publicación no encontrada o no disponible.</p>
            <p className="text-xs text-muted-foreground">
              Es posible que el autor la haya eliminado o que su visibilidad no
              te permita verla.
            </p>
          </CardContent>
        </Card>
      </MotionPage>
    )
  }

  const post = postQ.data
  const dateLabel = new Date(post.createdAt).toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const editedLabel =
    post.updatedAt !== post.createdAt
      ? new Date(post.updatedAt).toLocaleString('es-UY', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : null
  const authorName =
    post.author.displayName ?? post.author.username ?? 'Anónimo'

  async function onDelete() {
    if (!id) return
    await deleteMut.mutateAsync({ id })
    navigate('/community')
  }

  return (
    <MotionPage className="px-8 py-6 max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/community">
          <ArrowLeft className="h-4 w-4" />
          Volver al feed
        </Link>
      </Button>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <PostTypeBadge type={post.type} />
            {post.visibility === 'private' && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Lock className="h-3 w-3" />
                Privado
              </Badge>
            )}
            {post.visibility === 'unlisted' && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <EyeOff className="h-3 w-3" />
                No listado
              </Badge>
            )}
            {post.status !== 'active' && (
              <Badge variant="outline" className="text-[10px]">
                {post.status}
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl leading-tight">{post.title}</CardTitle>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-7 w-7 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border flex-shrink-0">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={authorName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {post.author.username ? (
              <Link
                to={`/u/${post.author.username}`}
                className="hover:underline truncate"
              >
                {authorName}
              </Link>
            ) : (
              <span className="truncate">{authorName}</span>
            )}
            <span>·</span>
            <span>{dateLabel}</span>
            {editedLabel && (
              <>
                <span>·</span>
                <span>Editado {editedLabel}</span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {post.body}
          </p>

          {(post.relatedMovement ||
            post.relatedSpot ||
            post.relatedRoutine ||
            post.relatedVideo ||
            post.relatedSession) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  Contenido relacionado
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.relatedMovement && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/movements/${post.relatedMovement.slug}`}>
                        Movimiento · {post.relatedMovement.name}
                      </Link>
                    </Button>
                  )}
                  {post.relatedSpot &&
                    (post.relatedSpot.visibility === 'private' &&
                    !post.isOwnedByCurrentUser ? (
                      <Badge variant="outline" className="gap-1 py-1">
                        <Lock className="h-3 w-3" />
                        Spot · {post.relatedSpot.name} (privado)
                      </Badge>
                    ) : (
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/spots/${post.relatedSpot.id}`}>
                          Spot · {post.relatedSpot.name}
                        </Link>
                      </Button>
                    ))}
                  {post.relatedRoutine &&
                    (post.relatedRoutine.slug ? (
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/routines/${post.relatedRoutine.slug}`}>
                          Rutina · {post.relatedRoutine.name}
                        </Link>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="py-1">
                        Rutina · {post.relatedRoutine.name}
                      </Badge>
                    ))}
                  {post.relatedVideo && (
                    <Badge variant="outline" className="py-1">
                      Video · {post.relatedVideo.fileName}
                    </Badge>
                  )}
                  {post.relatedSession && (
                    <Badge variant="outline" className="py-1">
                      Sesión ·{' '}
                      {new Date(post.relatedSession.startedAt).toLocaleDateString(
                        'es-UY'
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}

          {post.isOwnedByCurrentUser && (
            <>
              <Separator />
              <div className="flex items-center gap-2 flex-wrap">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/community/posts/${post.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                {confirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      ¿Eliminar esta publicación?
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={onDelete}
                      disabled={deleteMut.isPending}
                    >
                      {deleteMut.isPending ? 'Eliminando…' : 'Sí, eliminar'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingDelete(false)}
                      disabled={deleteMut.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>
              {deleteMut.error && (
                <Alert variant="destructive">
                  <AlertDescription>{deleteMut.error.message}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CommentsSection target={{ kind: 'post', id: post.id }} />
    </MotionPage>
  )
}
