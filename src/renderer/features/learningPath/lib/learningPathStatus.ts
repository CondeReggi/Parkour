/**
 * Cálculo puro del estado de cada movimiento en el camino de aprendizaje.
 *
 * No depende del backend: opera sobre los DTOs que ya devuelve
 * `useMovements()`. El estado se deriva de:
 *  - userProgress.status (mastered / practicing / not_attempted)
 *  - userLevel del perfil
 *  - requiredLevel del movimiento (más de un escalón arriba → bloqueado)
 *  - prerequisites (slugs que el usuario debe dominar primero)
 *
 * La regla "un escalón arriba" matchea el recomendador de movimientos
 * (services/movementRecommender.ts) para que un movimiento que el
 * recomendador propone como "próximo a aprender" aparezca como
 * `available` acá también.
 */

import type { MovementDto, MovementLevel } from '@shared/types/movement'
import type { UserLevel } from '@shared/types/profile'

export type LearningStatus = 'locked' | 'available' | 'practicing' | 'mastered'

export type LockReason = 'level' | 'prereq'

export interface LearningInfo {
  status: LearningStatus
  /** Sólo definido si status === 'locked'. */
  lockReason?: LockReason
  /** Slugs de prereqs no dominados (vacío si lockReason !== 'prereq'). */
  unmetPrereqSlugs: string[]
}

const LEVEL_ORDER: UserLevel[] = ['beginner', 'base', 'intermediate']

function compareLevel(req: MovementLevel, user: UserLevel): number {
  const reqIdx = LEVEL_ORDER.indexOf(req)
  const userIdx = LEVEL_ORDER.indexOf(user)
  if (reqIdx === -1 || userIdx === -1) return 0
  return reqIdx - userIdx
}

export function computeLearningStatuses(
  movements: MovementDto[],
  userLevel: UserLevel
): Map<string, LearningInfo> {
  const masteredSlugs = new Set(
    movements
      .filter((m) => m.userProgress.status === 'mastered')
      .map((m) => m.slug)
  )

  const map = new Map<string, LearningInfo>()
  for (const m of movements) {
    if (m.userProgress.status === 'mastered') {
      map.set(m.slug, { status: 'mastered', unmetPrereqSlugs: [] })
      continue
    }
    if (m.userProgress.status === 'practicing') {
      map.set(m.slug, { status: 'practicing', unmetPrereqSlugs: [] })
      continue
    }

    const levelGap = compareLevel(m.requiredLevel, userLevel)
    if (levelGap > 1) {
      map.set(m.slug, {
        status: 'locked',
        lockReason: 'level',
        unmetPrereqSlugs: []
      })
      continue
    }

    const unmet = m.prerequisites.filter((slug) => !masteredSlugs.has(slug))
    if (unmet.length > 0) {
      map.set(m.slug, {
        status: 'locked',
        lockReason: 'prereq',
        unmetPrereqSlugs: unmet
      })
      continue
    }

    map.set(m.slug, { status: 'available', unmetPrereqSlugs: [] })
  }
  return map
}
