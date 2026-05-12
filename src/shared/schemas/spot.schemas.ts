import { z } from 'zod'
import { VISIBILITY_VALUES } from '@shared/types/sharing'

export const visibilityEnum = z.enum(VISIBILITY_VALUES)

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

/**
 * Coordenadas geográficas opcionales. Ambas vienen juntas o ambas null —
 * el `.refine` rechaza el caso en que una esté seteada y la otra no.
 */
const latitudeSchema = z.number().min(-90).max(90).nullable()
const longitudeSchema = z.number().min(-180).max(180).nullable()

/**
 * Base sin refinements. La extendemos para crear/editar y, recién al
 * final, aplicamos el `.refine()` de coordenadas (no se puede extender
 * un esquema ya refinado).
 */
const spotFormBaseSchema = z.object({
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
  isFavorite: z.boolean(),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  /**
   * Visibilidad pedida por el usuario. La validación "no se puede
   * marcar public sin sesión" se hace server-side en el guard, no acá
   * — el form debe poder mandar el valor que el usuario seleccionó.
   * El backend lo rechaza si corresponde.
   */
  visibility: visibilityEnum
})

const requireBothCoordsOrNone = (val: { latitude: number | null; longitude: number | null }) =>
  (val.latitude === null && val.longitude === null) ||
  (val.latitude !== null && val.longitude !== null)

const coordsRefineOptions = {
  message: 'Las coordenadas deben venir las dos juntas o las dos vacías.',
  path: ['latitude']
}

export const spotFormSchema = spotFormBaseSchema.refine(
  requireBothCoordsOrNone,
  coordsRefineOptions
)
export type SpotFormValues = z.infer<typeof spotFormSchema>

export const createSpotInputSchema = spotFormSchema
export type CreateSpotInput = z.infer<typeof createSpotInputSchema>

export const updateSpotInputSchema = spotFormBaseSchema
  .extend({ id: z.string().min(1) })
  .refine(requireBothCoordsOrNone, coordsRefineOptions)
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
