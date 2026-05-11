import { z } from 'zod'

export const videoReviewStatusEnum = z.enum(['pending', 'reviewed', 'improved'])

const nullableId = z.string().min(1).nullable()

export const videoFormSchema = z.object({
  movementId: nullableId,
  spotId: nullableId,
  sessionId: nullableId,
  notes: z.string().max(1000).nullable(),
  whatWentWell: z.string().max(1000).nullable(),
  whatWentWrong: z.string().max(1000).nullable(),
  reviewStatus: videoReviewStatusEnum
})
export type VideoFormValues = z.infer<typeof videoFormSchema>

export const createVideoInputSchema = videoFormSchema.extend({
  filePath: z.string().min(1),
  fileName: z.string().min(1).max(260)
})
export type CreateVideoInput = z.infer<typeof createVideoInputSchema>

export const updateVideoInputSchema = videoFormSchema.extend({
  id: z.string().min(1)
})
export type UpdateVideoInput = z.infer<typeof updateVideoInputSchema>

export const deleteVideoInputSchema = z.object({ id: z.string().min(1) })
export type DeleteVideoInput = z.infer<typeof deleteVideoInputSchema>

export const getVideoByIdInputSchema = z.object({ id: z.string().min(1) })
export type GetVideoByIdInput = z.infer<typeof getVideoByIdInputSchema>
