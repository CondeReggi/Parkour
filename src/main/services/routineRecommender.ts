/**
 * Recomendador de rutinas. Función pura: dada una lista de rutinas
 * y un contexto del usuario, devuelve la mejor (o null) y un array
 * de "razones" para mostrar como justificación.
 *
 * Filtros (descartan):
 *   - Nivel de la rutina más de un escalón por encima del nivel del usuario
 *   - Fatiga alta del usuario + rutina marcada como 'moderate'
 *   - Alguna lesión activa cae dentro de avoidsInjuries de la rutina
 *
 * Score (suma):
 *   +3 si goal coincide
 *   +2 si nivel coincide exacto
 *   +1 si nivel es 'any'
 *   +2 si fatiga alta y rutina 'low' (es la indicada)
 */

import type {
  BodyPart,
  MainGoal,
  UserLevel
} from '@shared/types/profile'
import type { FatigueLevel } from '@shared/types/routine'

export interface RecommendationContext {
  profileLevel: UserLevel
  profileGoal: MainGoal
  fatigue: FatigueLevel
  activeInjuryParts: BodyPart[]
}

/** Subconjunto mínimo de Routine que el algoritmo necesita. */
export interface RecommenderRoutineInput {
  id: string
  goal: string
  level: string
  suitableForFatigue: string
  avoidsInjuries: string // JSON array<string>
}

export interface RecommenderResult<T extends RecommenderRoutineInput> {
  routine: T | null
  reasons: string[]
}

const LEVEL_ORDER: UserLevel[] = ['beginner', 'base', 'intermediate']

const GOAL_LABEL: Record<MainGoal, string> = {
  technique: 'técnica',
  mobility: 'movilidad',
  strength: 'fuerza',
  general: 'general'
}

const LEVEL_LABEL: Record<UserLevel, string> = {
  beginner: 'principiante',
  base: 'base',
  intermediate: 'intermedio'
}

function parseInjuryArray(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p): p is string => typeof p === 'string')
  } catch {
    return []
  }
}

export function recommendRoutine<T extends RecommenderRoutineInput>(
  routines: T[],
  ctx: RecommendationContext
): RecommenderResult<T> {
  // Filtros
  const candidates = routines.filter((r) => {
    if (r.level !== 'any') {
      const profileIdx = LEVEL_ORDER.indexOf(ctx.profileLevel)
      const routineIdx = LEVEL_ORDER.indexOf(r.level as UserLevel)
      if (routineIdx === -1) return false
      // Hasta un nivel arriba del perfil; descarto si es más alto.
      if (routineIdx > profileIdx + 1) return false
    }

    if (ctx.fatigue === 'high' && r.suitableForFatigue === 'moderate') return false

    const avoidParts = parseInjuryArray(r.avoidsInjuries)
    if (ctx.activeInjuryParts.some((p) => avoidParts.includes(p))) return false

    return true
  })

  if (candidates.length === 0) return { routine: null, reasons: [] }

  // Score
  const scored = candidates.map((r) => {
    let score = 0
    const reasons: string[] = []

    if (r.goal === ctx.profileGoal) {
      score += 3
      reasons.push(`Coincide con tu objetivo (${GOAL_LABEL[r.goal as MainGoal]})`)
    }

    if (r.level === ctx.profileLevel) {
      score += 2
      reasons.push(`Adecuada para tu nivel (${LEVEL_LABEL[r.level as UserLevel]})`)
    } else if (r.level === 'any') {
      score += 1
      reasons.push('Aplicable a cualquier nivel')
    }

    if (ctx.fatigue === 'high' && r.suitableForFatigue === 'low') {
      score += 2
      reasons.push('Liviana, ideal para días de fatiga alta')
    }

    if (ctx.activeInjuryParts.length > 0) {
      reasons.push(`Compatible con tus lesiones activas (${ctx.activeInjuryParts.join(', ')})`)
    }

    return { routine: r, score, reasons }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]!
  return { routine: best.routine, reasons: best.reasons }
}
