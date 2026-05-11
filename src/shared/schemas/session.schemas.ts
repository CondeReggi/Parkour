import { z } from 'zod'

export const sessionTrafficLightEnum = z.enum(['green', 'yellow', 'red'])
export const sessionPlaceEnum = z.enum(['home', 'spot', 'other'])

const ratingZeroTen = z.number().int().min(0).max(10).nullable()

export const startSessionInputSchema = z.object({
  routineId: z.string().min(1).nullable(),
  spotId: z.string().min(1).nullable().optional(),
  safetyTrafficLight: sessionTrafficLightEnum,
  safetyOverridden: z.boolean(),
  safetyNotes: z.string().max(500).nullable(),
  painBefore: ratingZeroTen,
  fatigueBefore: ratingZeroTen,
  energyBefore: ratingZeroTen.optional(),
  goalOfDay: z.string().max(200).nullable().optional(),
  place: sessionPlaceEnum.nullable().optional()
})
export type StartSessionInput = z.infer<typeof startSessionInputSchema>

export const finalizeSessionInputSchema = z.object({
  id: z.string().min(1),
  durationMin: z.number().int().min(1).max(600).nullable(),
  painAfter: ratingZeroTen,
  fatigueAfter: ratingZeroTen,
  generalState: z.string().max(500).nullable(),
  personalNotes: z.string().max(2000).nullable(),
  movementIds: z.array(z.string().min(1))
})
export type FinalizeSessionInput = z.infer<typeof finalizeSessionInputSchema>

export const cancelSessionInputSchema = z.object({
  id: z.string().min(1)
})
export type CancelSessionInput = z.infer<typeof cancelSessionInputSchema>

export const getSessionByIdInputSchema = z.object({
  id: z.string().min(1)
})
export type GetSessionByIdInput = z.infer<typeof getSessionByIdInputSchema>
