import { Link } from 'react-router-dom'
import { MessageSquare, ShieldAlert } from 'lucide-react'
import type { CommentTarget } from '@shared/types/comment'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuthState } from '@/features/auth/hooks/useAuth'
import { useCreateComment, useTargetComments } from '../hooks/useComments'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'

interface Props {
  target: CommentTarget
  /** Override del título de la card. Default "Comentarios". */
  title?: string
}

/**
 * Sección de comentarios reutilizable. Se monta abajo de cada
 * pantalla de detalle (post, spot, movement). Maneja:
 *  - Listado con nesting de 1 nivel.
 *  - Form principal abajo (responde top-level).
 *  - Estados loading/empty/error.
 *  - Mensaje + CTA a login en modo local.
 */
export function CommentsSection({ target, title = 'Comentarios' }: Props) {
  const { data: state } = useAuthState()
  const isAuthenticated = state?.mode === 'authenticated'
  const commentsQ = useTargetComments(target)
  const createMut = useCreateComment()

  async function handleCreate(body: string) {
    await createMut.mutateAsync({ target, body, parentCommentId: null })
  }

  const list = commentsQ.data ?? []
  const visibleCount = list.reduce(
    (acc, c) => acc + (c.status === 'deleted' ? 0 : 1) + c.replies.length,
    0
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          {title}
          {visibleCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              · {visibleCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {commentsQ.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {commentsQ.error instanceof Error
                ? commentsQ.error.message
                : String(commentsQ.error)}
            </AlertDescription>
          </Alert>
        )}

        {commentsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando comentarios…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Todavía no hay comentarios. {isAuthenticated ? 'Sé el primero.' : ''}
          </p>
        ) : (
          <div className="space-y-5">
            {list.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                target={target}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Form principal o CTA de login */}
        <div className="pt-2 border-t border-border">
          {isAuthenticated ? (
            <div className="pt-4">
              <CommentForm
                onSubmit={handleCreate}
                submitting={createMut.isPending}
                error={createMut.error?.message ?? null}
              />
            </div>
          ) : (
            <div className="pt-4 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Para comentar necesitás iniciar sesión.</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
