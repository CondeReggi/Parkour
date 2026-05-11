import type { Visibility } from './sharing'

export type FloorType = 'concrete' | 'grass' | 'rubber' | 'mixed' | 'other'
export type SpotRiskLevel = 'low' | 'moderate' | 'high'
export type ObstacleType =
  | 'wall'
  | 'rail'
  | 'bench'
  | 'gap'
  | 'stairs'
  | 'ledge'
  | 'other'
export type ObstacleRiskLevel = 'low' | 'moderate' | 'high'

/**
 * Tipo principal del spot: la "vibe" del lugar. No es exhaustivo y un
 * spot puede no encajar en ninguno (spotType = null).
 */
export type SpotType =
  | 'precision'
  | 'vaults'
  | 'wall'
  | 'balance'
  | 'strength'
  | 'flow'
  | 'mobility'
  | 'low_risk'

export type RecommendedLevel = 'beginner' | 'base' | 'intermediate'

export interface ObstacleMovementDto {
  movementId: string
  movementName: string
  movementSlug: string
}

export interface SpotObstacleDto {
  id: string
  spotId: string
  name: string
  type: ObstacleType
  riskLevel: ObstacleRiskLevel
  notes: string | null
  recommendedMovements: ObstacleMovementDto[]
  createdAt: string
}

export interface SpotPhotoDto {
  id: string
  spotId: string
  filePath: string
  fileName: string
  caption: string | null
  order: number
  /** Recalculado en cada lectura: el archivo en filePath ya no existe en disco. */
  fileMissing: boolean
  createdAt: string
}

export interface SpotIdealMovementDto {
  movementId: string
  movementName: string
  movementSlug: string
  movementCategory: string
  movementDifficulty: number
  notes: string | null
}

/** Resultado de abrir el file picker para foto de spot. null si el usuario cancela. */
export interface PickedSpotPhoto {
  filePath: string
  fileName: string
}

export interface SpotDto {
  id: string
  name: string
  locationText: string | null
  description: string | null
  floorType: FloorType | null
  riskLevel: SpotRiskLevel
  recommendedHours: string | null
  beginnerFriendly: boolean
  notes: string | null
  spotType: SpotType | null
  recommendedLevel: RecommendedLevel | null
  tags: string[]
  isFavorite: boolean
  /**
   * Coordenadas geográficas opcionales del spot. Ambas vienen juntas
   * (no se persisten validaciones cruzadas en DB; la UI siempre setea
   * las dos a la vez o las dos a null).
   */
  latitude: number | null
  longitude: number | null
  photos: SpotPhotoDto[]
  obstacles: SpotObstacleDto[]
  idealMovements: SpotIdealMovementDto[]
  /** Cantidad de sesiones finalizadas que tienen este spot asociado. */
  sessionCount: number
  /** ISO string. Última vez que terminó una sesión asociada a este spot. */
  lastTrainedAt: string | null
  /**
   * =====  Fase 0: campos reservados para comunidad futura  =====
   * Quién creó el spot (null si se creó antes de tener cuenta) y si
   * está pensado para compartirse.
   */
  authorAccountId: string | null
  visibility: Visibility
  createdAt: string
  updatedAt: string
}
