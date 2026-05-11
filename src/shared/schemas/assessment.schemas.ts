import { z } from 'zod'

const intRange = (max: number) => z.number().int().min(0).max(max).nullable()
const ratingZeroTen = z.number().int().min(0).max(10).nullable()

export const createAssessmentInputSchema = z.object({
  pushUps: intRange(500),
  squats: intRange(500),
  plankSeconds: intRange(900),
  pullUps: intRange(100),
  ankleMobility: ratingZeroTen,
  hipMobility: ratingZeroTen,
  wristMobility: ratingZeroTen,
  confidence: ratingZeroTen,
  fear: ratingZeroTen,
  pain: ratingZeroTen,
  fatigue: ratingZeroTen,
  notes: z.string().max(1000).nullable()
})
export type CreateAssessmentInput = z.infer<typeof createAssessmentInputSchema>
