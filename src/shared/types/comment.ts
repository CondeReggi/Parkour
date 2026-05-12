import type { PostAuthorDto } from './post'

export type CommentTargetKind = 'post' | 'spot' | 'movement'

export type CommentTarget =
  | { kind: 'post'; id: string }
  | { kind: 'spot'; id: string }
  | { kind: 'movement'; id: string }

export const COMMENT_STATUSES = ['active', 'hidden', 'deleted', 'reported'] as const
export type CommentStatus = (typeof COMMENT_STATUSES)[number]

/**
 * Comentario sobre un target (post/spot/movement). Reusa `PostAuthorDto`
 * para el autor — la forma es idéntica.
 *
 * Si `status === 'deleted'`, `body` viene `null` y la UI muestra un
 * tombstone "Comentario eliminado". Conservamos la fila en DB para no
 * romper el hilo cuando hay replies vivas.
 *
 * `replies` se llena sólo para comentarios top-level. Para replies a su
 * vez, queda `[]` (el modelo permite 1 nivel).
 */
export interface CommentDto {
  id: string
  author: PostAuthorDto
  body: string | null
  status: CommentStatus
  parentCommentId: string | null
  isOwnedByCurrentUser: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  replies: CommentDto[]
}
