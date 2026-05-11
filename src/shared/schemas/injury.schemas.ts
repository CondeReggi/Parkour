import { z } from 'zod'

export const bodyPartEnum = z.enum(['ankle', 'knee', 'wrist', 'shoulder', 'back', 'neck', 'other'])
export const injurySeverityEnum = z.enum(['mild', 'moderate', 'severe'])

export const addInjuryInputSchema = z.object({
  profileId: z.string().min(1),
  bodyPart: bodyPartEnum,
  description: z.string().max(500).nullable().optional(),
  severity: injurySeverityEnum.default('mild'),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional()
})
export type AddInjuryInput = z.infer<typeof addInjuryInputSchema>

export const updateInjuryInputSchema = z.object({
  id: z.string().min(1),
  bodyPart: bodyPartEnum.optional(),
  description: z.string().max(500).nullable().optional(),
  severity: injurySeverityEnum.optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional()
})
export type UpdateInjuryInput = z.infer<typeof updateInjuryInputSchema>

export const deleteInjuryInputSchema = z.object({ id: z.string().min(1) })
export type DeleteInjuryInput = z.infer<typeof deleteInjuryInputSchema>
