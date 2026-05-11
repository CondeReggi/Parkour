/**
 * DTOs y tipos compartidos para Movement.
 * Se usan en main (repositorio devuelve esto) y en renderer (consume esto).
 */

export type MovementCategory =
  | 'landing'
  | 'vault'
  | 'climb'
  | 'balance'
  | 'precision'
  | 'wall'
  | 'core'

export type MovementLevel = 'beginner' | 'base' | 'intermediate'

export type MovementProgressStatus = 'not_attempted' | 'practicing' | 'mastered'

export interface MovementUserProgress {
  status: MovementProgressStatus
  notes: string | null
  lastPracticedAt: string | null // ISO
}

/** Resumen de una rutina que usa este movimiento. */
export interface MovementRoutineRef {
  id: string
  slug: string | null
  name: string
}

/** Movimiento que se "desbloquea" al dominar este (lo tiene como prereq). */
export interface MovementNextRef {
  slug: string
  name: string
  difficulty: number
}

export interface MovementDto {
  id: string
  slug: string
  name: string
  category: MovementCategory
  description: string
  difficulty: number
  requiredLevel: MovementLevel
  risks: string[]
  prerequisites: string[]
  commonMistakes: string[]
  goodExecutionCues: string[]
  preparatoryDrills: string[]
  musclesInvolved: string[]
  tags: string[]
  /** Frase corta con el objetivo técnico. Puede venir null para seeds viejos. */
  technicalGoal: string | null
  /** Items a verificar antes de practicar. Vacío si nunca se rellenó. */
  safetyChecklist: string[]
  isBuiltIn: boolean
  /**
   * Progreso del usuario en este movimiento. Si no hay perfil activo,
   * todos los campos vienen con sus defaults (status='not_attempted').
   */
  userProgress: MovementUserProgress
  /**
   * Rutinas que incluyen este movimiento. Sólo se rellena en `getBySlug`
   * (el listado deja el array vacío para no inflar la respuesta).
   */
  usedInRoutines: MovementRoutineRef[]
  /**
   * Próximos movimientos que se vuelven accesibles cuando dominás este
   * (lo declaran como prereq). Sólo rellenado en `getBySlug`.
   */
  nextMovements: MovementNextRef[]
}
