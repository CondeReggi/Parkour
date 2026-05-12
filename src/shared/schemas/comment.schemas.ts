import { z } from 'zod'

/**
 * Target del comentario: discriminado por `kind`. El repo valida que
 * la entidad exista antes de crear.
 */
export const commentTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('post'), id: z.string().min(1) }),
  z.object({ kind: z.literal('spot'), id: z.string().min(1) }),
  z.object({ kind: z.literal('movement'), id: z.string().min(1) })
])
export type CommentTargetInput = z.infer<typeof commentTargetSchema>

/** Body: 1-2000 caracteres tras trim. */
const bodySchema = z
  .string()
  .trim()
  .min(1, 'Requerido')
  .max(2000, 'Máximo 2000 caracteres')

export const getCommentsByTargetSchema = z.object({
  target: commentTargetSchema
})
export type GetCommentsByTargetInput = z.infer<typeof getCommentsByTargetSchema>

export const getCommentCountSchema = z.object({
  target: commentTargetSchema
})
export type GetCommentCountInput = z.infer<typeof getCommentCountSchema>

export const createCommentInputSchema = z.object({
  target: commentTargetSchema,
  body: bodySchema,
  /** ID del comentario padre (sólo para respuestas a un comentario principal). */
  parentCommentId: z.string().min(1).nullable().optional()
})
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>

export const updateCommentInputSchema = z.object({
  id: z.string().min(1),
  body: bodySchema
})
export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>

export const deleteCommentInputSchema = z.object({
  id: z.string().min(1)
})
export type DeleteCommentInput = z.infer<typeof deleteCommentInputSchema>
