import type { MainGoal, UserLevel } from './profile'
import type { Visibility } from './sharing'

export type RoutineLevel = UserLevel | 'any'
export type FatigueLevel = 'low' | 'moderate' | 'high'
export type RoutineSuitableFatigue = FatigueLevel | 'any'

export type RoutineBlockType =
  | 'warmup'
  | 'technique'
  | 'strength'
  | 'mobility'
  | 'cooldown'

export interface RoutineExerciseDto {
  id: string
  /** Si está vinculado a un movimiento de la biblioteca, podés navegar al detalle. */
  movementSlug: string | null
  movementName: string | null
  name: string
  description: string | null
  sets: number | null
  reps: number | null
  durationSec: number | null
  restSec: number | null
  notes: string | null
  order: number
}

export interface RoutineBlockDto {
  id: string
  type: RoutineBlockType
  order: number
  exercises: RoutineExerciseDto[]
}

export interface RoutineDto {
  id: string
  slug: string | null
  name: string
  description: string | null
  goal: MainGoal
  level: RoutineLevel
  estimatedMin: number
  isBuiltIn: boolean
  suitableForFatigue: RoutineSuitableFatigue
  avoidsInjuries: string[]
  blocks: RoutineBlockDto[]
  /**
   * =====  Fase 0: campos reservados para comunidad futura  =====
   * Autor (null para built-in y para rutinas pre-auth) y visibilidad
   * para cuando se pueda publicar.
   */
  authorAccountId: string | null
  visibility: Visibility
  /** ISO. Cuándo se publicó. */
  sharedAt: string | null
  /** Slug estable para link no listado. */
  shareSlug: string | null
}

export interface RoutineRecommendationDto {
  routine: RoutineDto
  /** Bullets en español que la UI muestra como justificación. */
  reasons: string[]
}
