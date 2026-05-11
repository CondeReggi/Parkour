/**
 * Schemas Zod del perfil. Single source of truth para validación.
 * Se usan en el main (handlers IPC parsean inputs) y en el renderer
 * (react-hook-form + @hookform/resolvers/zod).
 */

import { z } from 'zod'

export const parkourExperienceEnum = z.enum(['none', 'lt6m', '6_12m', '1_2y', 'gt2y'])
export const dominantLegEnum = z.enum(['left', 'right', 'both'])
export const weakSideEnum = z.enum(['left', 'right', 'none'])
export const weekDayEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
export const mainGoalEnum = z.enum(['technique', 'mobility', 'strength', 'general'])
export const intensityEnum = z.enum(['low', 'moderate', 'high'])
export const userLevelEnum = z.enum(['beginner', 'base', 'intermediate'])

export const profileFormSchema = z.object({
  name: z.string().min(1, 'Requerido').max(80),
  age: z.number().int().min(8).max(100).nullable(),
  heightCm: z.number().min(80).max(250).nullable(),
  weightKg: z.number().min(20).max(250).nullable(),
  parkourExperience: parkourExperienceEnum,
  previousSports: z.string().max(500).nullable(),
  dominantLeg: dominantLegEnum,
  weakSide: weakSideEnum.nullable(),
  daysAvailable: z.array(weekDayEnum),
  sessionDurationMin: z.number().int().min(10).max(240),
  mainGoal: mainGoalEnum,
  preferredIntensity: intensityEnum
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const createProfileInputSchema = profileFormSchema
export type CreateProfileInput = z.infer<typeof createProfileInputSchema>

export const updateProfileInputSchema = profileFormSchema.extend({
  id: z.string().min(1)
})
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>
