import { z } from 'zod'

export const questTypeEnum = z.enum(['daily', 'weekly'])
export const questStatusEnum = z.enum(['pending', 'completed', 'claimed'])
export const questMetricEnum = z.enum([
  'sessions_finalized',
  'movements_practiced',
  'movements_mastered',
  'videos_uploaded',
  'videos_reviewed',
  'spots_registered',
  'sessions_low_pain',
  'recommended_routine_completed'
])

export const claimQuestInputSchema = z.object({ id: z.string().min(1) })
export type ClaimQuestInput = z.infer<typeof claimQuestInputSchema>
