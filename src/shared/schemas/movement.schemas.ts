import { z } from 'zod'

export const movementProgressStatusEnum = z.enum([
  'not_attempted',
  'practicing',
  'mastered'
])

export const setMovementProgressInputSchema = z.object({
  movementId: z.string().min(1),
  status: movementProgressStatusEnum,
  notes: z.string().max(1000).nullable()
})
export type SetMovementProgressInput = z.infer<typeof setMovementProgressInputSchema>

export const getMovementBySlugInputSchema = z.object({
  slug: z.string().min(1)
})
export type GetMovementBySlugInput = z.infer<typeof getMovementBySlugInputSchema>
