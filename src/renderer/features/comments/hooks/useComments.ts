import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CommentDto, CommentTarget } from '@shared/types/comment'
import type {
  CreateCommentInput,
  UpdateCommentInput
} from '@shared/schemas/comment.schemas'

const targetKey = (t: CommentTarget): string => `${t.kind}:${t.id}`

export const commentKeys = {
  all: ['comments'] as const,
  byTarget: (t: CommentTarget) =>
    [...commentKeys.all, 'byTarget', targetKey(t)] as const,
  count: (t: CommentTarget) =>
    [...commentKeys.all, 'count', targetKey(t)] as const
}

export function useTargetComments(target: CommentTarget | null) {
  return useQuery<CommentDto[]>({
    queryKey: target ? commentKeys.byTarget(target) : ['comments', 'disabled'],
    queryFn: () =>
      target
        ? window.parkourApi.comments.getByTarget({ target })
        : Promise.resolve([]),
    enabled: !!target
  })
}

export function useTargetCommentCount(target: CommentTarget | null) {
  return useQuery<number>({
    queryKey: target ? commentKeys.count(target) : ['comments', 'count', 'disabled'],
    queryFn: () =>
      target
        ? window.parkourApi.comments.countByTarget({ target })
        : Promise.resolve(0),
    enabled: !!target
  })
}

function invalidateForTarget(
  qc: ReturnType<typeof useQueryClient>,
  target: CommentTarget
) {
  void qc.invalidateQueries({ queryKey: commentKeys.byTarget(target) })
  void qc.invalidateQueries({ queryKey: commentKeys.count(target) })
  // Si el target es un post, también invalidamos posts (para que se
  // actualice commentCount en la card del feed).
  if (target.kind === 'post') {
    void qc.invalidateQueries({ queryKey: ['posts'] })
  }
}

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation<CommentDto, Error, CreateCommentInput>({
    mutationFn: (input) => window.parkourApi.comments.create(input),
    onSuccess: (_data, variables) => invalidateForTarget(qc, variables.target)
  })
}

/**
 * Update no necesita conocer el target (sólo cambia el body). Igual
 * invalidamos todos los listados de comentarios — barrido amplio pero
 * barato dado el cache de TanStack.
 */
export function useUpdateComment() {
  const qc = useQueryClient()
  return useMutation<CommentDto, Error, UpdateCommentInput>({
    mutationFn: (input) => window.parkourApi.comments.update(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: commentKeys.all })
    }
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: (input) => window.parkourApi.comments.delete(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: commentKeys.all })
      void qc.invalidateQueries({ queryKey: ['posts'] })
    }
  })
}
