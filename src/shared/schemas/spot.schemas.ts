import { z } from 'zod'

export const floorTypeEnum = z.enum(['concrete', 'grass', 'rubber', 'mixed', 'other'])
export const spotRiskLevelEnum = z.enum(['low', 'moderate', 'high'])
export const obstacleTypeEnum = z.enum([
  'wall',
  'rail',
  'bench',
  'gap',
  'stairs',
  'ledge',
  'other'
])
export const obstacleRiskLevelEnum = z.enum(['low', 'moderate', 'high'])

export const spotTypeEnum = z.enum([
  'precision',
  'vaults',
  'wall',
  'balance',
  'strength',
  'flow',
  'mobility',
  'low_risk'
])
export const recommendedLevelEnum = z.enum(['beginner', 'base', 'intermediate'])

export const spotFormSchema = z.object({
  name: z.string().min(1, 'Requerido').max(100),
  locationText: z.string().max(200).nullable(),
  description: z.string().max(1000).nullable(),
  floorType: floorTypeEnum.nullable(),
  riskLevel: spotRiskLevelEnum,
  recommendedHours: z.string().max(200).nullable(),
  beginnerFriendly: z.boolean(),
  notes: z.string().max(2000).nullable(),
  spotType: spotTypeEnum.nullable(),
  recommendedLevel: recommendedLevelEnum.nullable(),
  tags: z.array(z.string().min(1).max(30)).max(20),
  isFavorite: z.boolean()
})
export type SpotFormValues = z.infer<typeof spotFormSchema>

export const createSpotInputSchema = spotFormSchema
export type CreateSpotInput = z.infer<typeof createSpotInputSchema>

export const updateSpotInputSchema = spotFormSchema.extend({
  id: z.string().min(1)
})
export type UpdateSpotInput = z.infer<typeof updateSpotInputSchema>

export const deleteSpotInputSchema = z.object({ id: z.string().min(1) })
export type DeleteSpotInput = z.infer<typeof deleteSpotInputSchema>

export const getSpotByIdInputSchema = z.object({ id: z.string().min(1) })
export type GetSpotByIdInput = z.infer<typeof getSpotByIdInputSchema>

export const setSpotFavoriteInputSchema = z.object({
  id: z.string().min(1),
  isFavorite: z.boolean()
})
export type SetSpotFavoriteInput = z.infer<typeof setSpotFavoriteInputSchema>

// === Obstacles ===

export const addObstacleInputSchema = z.object({
  spotId: z.string().min(1),
  name: z.string().min(1, 'Requerido').max(100),
  type: obstacleTypeEnum,
  riskLevel: obstacleRiskLevelEnum,
  notes: z.string().max(500).nullable()
})
export type AddObstacleInput = z.infer<typeof addObstacleInputSchema>

export const updateObstacleInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  type: obstacleTypeEnum.optional(),
  riskLevel: obstacleRiskLevelEnum.optional(),
  notes: z.string().max(500).nullable().optional()
})
export type UpdateObstacleInput = z.infer<typeof updateObstacleInputSchema>

export const deleteObstacleInputSchema = z.object({ id: z.string().min(1) })
export type DeleteObstacleInput = z.infer<typeof deleteObstacleInputSchema>

export const setObstacleMovementsInputSchema = z.object({
  obstacleId: z.string().min(1),
  movementIds: z.array(z.string().min(1))
})
export type SetObstacleMovementsInput = z.infer<typeof setObstacleMovementsInputSchema>

// === Ideal movements (a nivel de spot) ===

export const setIdealMovementsInputSchema = z.object({
  spotId: z.string().min(1),
  movementIds: z.array(z.string().min(1))
})
export type SetIdealMovementsInput = z.infer<typeof setIdealMovementsInputSchema>

// === Photos ===

export const addSpotPhotoInputSchema = z.object({
  spotId: z.string().min(1),
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  caption: z.string().max(200).nullable()
})
export type AddSpotPhotoInput = z.infer<typeof addSpotPhotoInputSchema>

export const updateSpotPhotoInputSchema = z.object({
  id: z.string().min(1),
  caption: z.string().max(200).nullable().optional(),
  order: z.number().int().min(0).optional()
})
export type UpdateSpotPhotoInput = z.infer<typeof updateSpotPhotoInputSchema>

export const deleteSpotPhotoInputSchema = z.object({ id: z.string().min(1) })
export type DeleteSpotPhotoInput = z.infer<typeof deleteSpotPhotoInputSchema>
