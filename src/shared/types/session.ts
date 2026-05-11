/**
 * DTOs de WorkoutSession + WorkoutMovement.
 * El semáforo se duplica acá como literal para evitar dep cruzada con el renderer.
 */

export type SessionTrafficLight = 'green' | 'yellow' | 'red'
export type SessionPlace = 'home' | 'spot' | 'other'

export interface WorkoutMovementDto {
  id: string
  movementId: string
  movementName: string
  movementSlug: string
  notes: string | null
}

export interface WorkoutSessionDto {
  id: string
  profileId: string
  routineId: string | null
  routineName: string | null
  routineSlug: string | null
  spotId: string | null
  startedAt: string // ISO
  endedAt: string | null
  durationMin: number | null
  safetyTrafficLight: SessionTrafficLight
  safetyOverridden: boolean
  safetyNotes: string | null
  painBefore: number | null
  painAfter: number | null
  fatigueBefore: number | null
  fatigueAfter: number | null
  energyBefore: number | null
  goalOfDay: string | null
  /** 'home' | 'spot' | 'other' o null si no se declaró. */
  place: SessionPlace | null
  generalState: string | null
  personalNotes: string | null
  movements: WorkoutMovementDto[]
  createdAt: string
  updatedAt: string
}

export type SessionDto = WorkoutSessionDto
