/**
 * Recomendador de movimientos. Función pura: dado el catálogo + nivel y
 * objetivo del usuario, devuelve los próximos movements a aprender.
 *
 * Filtros (descartan):
 *  - El usuario ya lo está practicando o lo dominó.
 *  - requiredLevel más de un escalón por encima del nivel del usuario.
 *  - Algún prerequisite (slug) no está en estado mastered.
 *
 * Score (suma):
 *  +3 si la categoría matchea el mainGoal del usuario (mapeo abajo).
 *  +2 si requiredLevel coincide exacto con el nivel del usuario.
 *  +1 si requiredLevel está justo un escalón por debajo (movements "fáciles").
 *  +1 si difficulty ≤ 2 (apto como next step).
 *  +1 si no tiene prerequisites (entrada limpia).
 */

import type {
  MovementCategory,
  MovementDto,
  MovementLevel
} from '@shared/types/movement'
import type { MainGoal, UserLevel } from '@shared/types/profile'
import type { MovementRecommendationDto } from '@shared/types/movementRecommendation'

const LEVEL_ORDER: UserLevel[] = ['beginner', 'base', 'intermediate']

const GOAL_CATEGORIES: Record<MainGoal, MovementCategory[]> = {
  technique: ['vault', 'precision', 'wall', 'climb'],
  mobility: ['balance', 'landing', 'precision'],
  strength: ['climb', 'wall', 'core'],
  general: []
}

const LEVEL_LABEL: Record<UserLevel, string> = {
  beginner: 'principiante',
  base: 'base',
  intermediate: 'intermedio'
}

const CATEGORY_LABEL: Record<MovementCategory, string> = {
  landing: 'aterrizaje',
  vault: 'vault',
  climb: 'climb',
  balance: 'balance',
  precision: 'precisión',
  wall: 'wall',
  core: 'core'
}

export interface MovementRecommendationContext {
  level: UserLevel
  goal: MainGoal
  /** Movement.slug de los movements que el usuario ya tiene en estado 'mastered'. */
  masteredSlugs: Set<string>
}

export function recommendMovements(
  movements: MovementDto[],
  ctx: MovementRecommendationContext,
  limit = 5
): MovementRecommendationDto[] {
  const profileLevelIdx = LEVEL_ORDER.indexOf(ctx.level)
  const goalCategories = new Set(GOAL_CATEGORIES[ctx.goal])

  const candidates = movements.filter((m) => {
    if (m.userProgress.status !== 'not_attempted') return false

    const reqIdx = LEVEL_ORDER.indexOf(m.requiredLevel)
    if (reqIdx === -1) return false
    if (reqIdx > profileLevelIdx + 1) return false

    if (m.prerequisites.length > 0) {
      const allMastered = m.prerequisites.every((slug) =>
        ctx.masteredSlugs.has(slug)
      )
      if (!allMastered) return false
    }

    return true
  })

  const scored: MovementRecommendationDto[] = candidates.map((m) => {
    let score = 0
    const reasons: string[] = []

    if (goalCategories.has(m.category)) {
      score += 3
      reasons.push(
        `Encaja con tu objetivo: ${CATEGORY_LABEL[m.category]}`
      )
    }

    const reqIdx = LEVEL_ORDER.indexOf(m.requiredLevel)
    if (m.requiredLevel === ctx.level) {
      score += 2
      reasons.push(`Está a tu nivel (${LEVEL_LABEL[ctx.level]})`)
    } else if (reqIdx === profileLevelIdx - 1) {
      score += 1
      reasons.push(
        `Más sencillo que tu nivel actual — bueno para consolidar`
      )
    } else if (reqIdx === profileLevelIdx + 1) {
      reasons.push(`Un escalón arriba de tu nivel — desafío controlado`)
    }

    if (m.difficulty <= 2) {
      score += 1
    }

    if (m.prerequisites.length === 0) {
      score += 1
      reasons.push('No requiere prerequisitos')
    } else {
      // Si llegó hasta acá con prereqs, es porque ya están dominados.
      const prereqNames = m.prerequisites
        .map((slug) => movements.find((mm) => mm.slug === slug)?.name)
        .filter((n): n is string => !!n)
      if (prereqNames.length > 0) {
        reasons.push(
          `Ya dominás sus prerequisitos (${prereqNames.join(', ')})`
        )
      }
    }

    return { movement: m, score, reasons }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Empate: prioridad a difficulty más baja, después por nombre alfabético
    if (a.movement.difficulty !== b.movement.difficulty) {
      return a.movement.difficulty - b.movement.difficulty
    }
    return a.movement.name.localeCompare(b.movement.name)
  })

  return scored.slice(0, limit)
}
