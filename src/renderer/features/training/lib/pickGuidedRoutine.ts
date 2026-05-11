/**
 * Selector de rutina para el coach guiado. Función pura sobre los datos
 * que ya devuelven los hooks existentes (no toca backend).
 *
 * Combina filtros del checklist de seguridad (semáforo) con los inputs
 * del check-in nuevo (goal del día, tiempo disponible, lesiones,
 * fatiga). Devuelve la rutina elegida + razones para mostrar como
 * justificación y advertencias para que el usuario las vea antes de
 * arrancar.
 *
 * Si el semáforo es rojo: devuelve null. Caso especial: el usuario
 * puede "override" la seguridad desde la UI; en ese caso recomendamos
 * la rutina más liviana disponible.
 */

import type { ProfileDto, MainGoal, UserLevel } from '@shared/types/profile'
import type { RoutineDto } from '@shared/types/routine'
import type { TrafficLight } from './safety'

const LEVEL_ORDER: UserLevel[] = ['beginner', 'base', 'intermediate']

export interface GuidedRecommenderInput {
  routines: RoutineDto[] | undefined
  profile: ProfileDto | undefined
  trafficLight: TrafficLight
  /** Override del usuario para hoy. Si null/undefined usamos profile.mainGoal. */
  goalOfDay: MainGoal | null
  /** Minutos disponibles declarados en el check-in. */
  timeAvailableMin: number
  fatigue: number
  pain: number
}

export interface GuidedRecommendation {
  routine: RoutineDto | null
  reasons: string[]
  warnings: string[]
}

export function pickGuidedRoutine(
  input: GuidedRecommenderInput
): GuidedRecommendation {
  const reasons: string[] = []
  const warnings: string[] = []

  if (input.pain >= 7) {
    warnings.push(
      'Dolor alto (≥ 7): considerá descansar o hacer recuperación activa en vez de entrenar.'
    )
  }
  if (input.fatigue >= 8) {
    warnings.push(
      'Fatiga muy alta (≥ 8): mejor una sesión liviana o un día de recuperación.'
    )
  }

  if (input.trafficLight === 'red') {
    return {
      routine: null,
      reasons: [],
      warnings: [
        ...warnings,
        'El semáforo está en rojo. Hoy descansá o hacé recuperación activa.'
      ]
    }
  }

  if (!input.routines || input.routines.length === 0) {
    return { routine: null, reasons, warnings }
  }

  const profileIdx = input.profile
    ? LEVEL_ORDER.indexOf(input.profile.level)
    : -1
  const activeInjuries = input.profile
    ? input.profile.injuries.filter((i) => i.isActive).map((i) => i.bodyPart)
    : []
  const effectiveGoal: MainGoal | null =
    input.goalOfDay ?? input.profile?.mainGoal ?? null
  const wantsSoft = input.trafficLight === 'yellow' || input.fatigue >= 6

  const candidates = input.routines.filter((r) => {
    if (r.level !== 'any' && profileIdx >= 0) {
      const rIdx = LEVEL_ORDER.indexOf(r.level as UserLevel)
      if (rIdx === -1 || rIdx > profileIdx + 1) return false
    }
    if (
      wantsSoft &&
      !(r.suitableForFatigue === 'low' || r.suitableForFatigue === 'any')
    ) {
      return false
    }
    if (activeInjuries.some((p) => r.avoidsInjuries.includes(p))) return false
    return true
  })

  if (candidates.length === 0) {
    return {
      routine: null,
      reasons,
      warnings: [
        ...warnings,
        'No encontramos una rutina compatible. Revisá tus lesiones activas o el nivel del perfil.'
      ]
    }
  }

  // Scoring: tiempo + goal + nivel + suavidad.
  const scored = candidates.map((r) => {
    let score = 0
    const localReasons: string[] = []

    // Tiempo: penalizar si supera lo disponible; bonus si encaja bien.
    if (r.estimatedMin <= input.timeAvailableMin) {
      score += 3
      localReasons.push(`Entra en tus ${input.timeAvailableMin} min`)
    } else if (r.estimatedMin <= input.timeAvailableMin + 15) {
      score += 1
    } else {
      score -= 2
    }

    if (effectiveGoal && r.goal === effectiveGoal) {
      score += 3
      localReasons.push(`Alineada con tu objetivo (${effectiveGoal})`)
    }

    if (input.profile && r.level === input.profile.level) {
      score += 2
      localReasons.push('Adecuada para tu nivel')
    } else if (r.level === 'any') {
      score += 1
    }

    if (wantsSoft && r.suitableForFatigue === 'low') {
      score += 2
      localReasons.push('Liviana, ideal para hoy')
    }

    return { routine: r, score, reasons: localReasons }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]
  if (!best) return { routine: null, reasons, warnings }

  reasons.push(...best.reasons)

  if (best.routine.estimatedMin > input.timeAvailableMin) {
    warnings.push(
      `La rutina dura ${best.routine.estimatedMin} min y tenés ${input.timeAvailableMin}. Podés cortar bloques o estirar el día.`
    )
  }

  return { routine: best.routine, reasons, warnings }
}
