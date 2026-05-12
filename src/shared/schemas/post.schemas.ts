import { z } from 'zod'
import { POST_TYPES, POST_STATUSES } from '@shared/types/post'
import { VISIBILITY_VALUES } from '@shared/types/sharing'

export const postTypeEnum = z.enum(POST_TYPES)
export const postStatusEnum = z.enum(POST_STATUSES)
export const postVisibilityEnum = z.enum(VISIBILITY_VALUES)

const nullableId = z.string().min(1).nullable()

/**
 * Base con los campos del form. La validación "post tiene title y body
 * no vacíos" sale del .min() de cada string. Visibility y type son
 * enums obligatorios. Las refs relacionadas son opcionales.
 */
const postFormBaseSchema = z.object({
  title: z.string().trim().min(1, 'Requerido').max(140, 'Máximo 140 caracteres'),
  body: z.string().trim().min(1, 'Requerido').max(5000, 'Máximo 5000 caracteres'),
  type: postTypeEnum,
  visibility: postVisibilityEnum,
  relatedMovementId: nullableId,
  relatedSpotId: nullableId,
  relatedRoutineId: nullableId,
  relatedVideoId: nullableId,
  relatedSessionId: nullableId
})

export const createPostInputSchema = postFormBaseSchema
export type CreatePostInput = z.infer<typeof createPostInputSchema>

export const updatePostInputSchema = postFormBaseSchema.extend({
  id: z.string().min(1)
})
export type UpdatePostInput = z.infer<typeof updatePostInputSchema>

export const getPostByIdInputSchema = z.object({ id: z.string().min(1) })
export type GetPostByIdInput = z.infer<typeof getPostByIdInputSchema>

export const deletePostInputSchema = z.object({ id: z.string().min(1) })
export type DeletePostInput = z.infer<typeof deletePostInputSchema>

/**
 * Filtros del feed. Todos opcionales. `type` puede venir como string
 * único o array. Si no llega nada, el feed devuelve los más recientes
 * de todos los tipos.
 */
export const getFeedInputSchema = z
  .object({
    type: z
      .union([postTypeEnum, z.array(postTypeEnum).min(1)])
      .optional(),
    limit: z.number().int().min(1).max(100).optional().default(50)
  })
  .optional()
export type GetFeedInput = z.infer<typeof getFeedInputSchema>

export const getByAuthorInputSchema = z.object({
  authorAccountId: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional().default(50)
})
export type GetByAuthorInput = z.infer<typeof getByAuthorInputSchema>

/**
 * Form values para react-hook-form. Como en otros forms del proyecto,
 * derivamos del schema sin `.default()` (para no romper la inferencia
 * de zodResolver).
 */
export type PostFormValues = z.infer<typeof postFormBaseSchema>
