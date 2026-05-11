import type { MovementDto } from './movement'

export interface MovementRecommendationDto {
  movement: MovementDto
  reasons: string[]
  /** Score interno; lo expongo por si en el futuro queremos ordenar visualmente. */
  score: number
}
