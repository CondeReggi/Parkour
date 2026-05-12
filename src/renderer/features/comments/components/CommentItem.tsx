import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CornerDownRight,
  Pencil,
  Reply,
  Trash2,
  UserCircle2
} from 'lucide-react'
import type { CommentDto, CommentTarget } from '@shared/types/comment'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment
} from '../hooks/useComments'
import { CommentForm } from './CommentForm'

interface Props {
  comment: CommentDto
  target: CommentTarget
  isAuthenticated: boolean
  /** Si es true, este comentario ya es una reply — no permitimos otro nivel. */
  isReply?: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function CommentItem({ comment, target, isAuthenticated, isReply }: Props) {
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const createMut = useCreateComment()
  const updateMut = useUpdateComment()
  const deleteMut = useDeleteComment()

  const isDeleted = comment.status === 'deleted'
  const authorName =
    comment.author.displayName ?? comment.author.username ?? 'Anónimo'

  async function handleReply(body: string) {
    await createMut.mutateAsync({
      target,
      body,
      parentCommentId: comment.id
    })
    setReplying(false)
  }

  async function handleEdit(body: string) {
    await updateMut.mutateAsync({ id: comment.id, body })
    setEditing(false)
  }

  async function handleDelete() {
    await deleteMut.mutateAsync({ id: comment.id })
    setConfirmDelete(false)
  }

  return (
    <div className={isReply ? '' : 'space-y-3'}>
      <article className="flex gap-3">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border flex-shrink-0">
          {!isDeleted && comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={authorName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {isDeleted ? (
              <span className="font-medium text-muted-foreground italic">
                Comentario eliminado
              </span>
            ) : comment.author.username ? (
              <Link
                to={`/u/${comment.author.username}`}
                className="font-medium hover:underline truncate"
              >
                {authorName}
              </Link>
            ) : (
              <span className="font-medium truncate">{authorName}</span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt && !isDeleted && (
              <span className="text-muted-foreground">(editado)</span>
            )}
          </div>

          {editing ? (
            <CommentForm
              initialBody={comment.body ?? ''}
              onSubmit={handleEdit}
              onCancel={() => setEditing(false)}
              submitting={updateMut.isPending}
              error={updateMut.error?.message ?? null}
              submitLabel="Guardar"
              autoFocus
            />
          ) : isDeleted ? (
            <p className="text-sm text-muted-foreground italic">
              [Comentario eliminado por el autor]
            </p>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {comment.body}
            </p>
          )}

          {!editing && !isDeleted && (
            <div className="flex items-center gap-1 flex-wrap pt-1">
              {!isReply && isAuthenticated && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => setReplying((v) => !v)}
                >
                  <Reply className="h-3.5 w-3.5" />
                  Responder
                </Button>
              )}
              {comment.isOwnedByCurrentUser && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        ¿Eliminar?
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={handleDelete}
                        disabled={deleteMut.isPending}
                      >
                        Sí
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleteMut.isPending}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {deleteMut.error && (
            <Alert variant="destructive">
              <AlertDescription>{deleteMut.error.message}</AlertDescription>
            </Alert>
          )}

          {replying && (
            <div className="pt-2">
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setReplying(false)}
                submitting={createMut.isPending}
                error={createMut.error?.message ?? null}
                placeholder={`Respondiendo a ${authorName}…`}
                submitLabel="Responder"
                autoFocus
              />
            </div>
          )}
        </div>
      </article>

      {/* Replies anidadas un nivel */}
      {comment.replies.length > 0 && (
        <div className="pl-11 mt-3 space-y-3 border-l-2 border-border ml-3">
          {comment.replies.map((r) => (
            <div key={r.id} className="relative">
              <CornerDownRight className="absolute -left-[1.85rem] top-2 h-4 w-4 text-muted-foreground" />
              <CommentItem
                comment={r}
                target={target}
                isAuthenticated={isAuthenticated}
                isReply
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
