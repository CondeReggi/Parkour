/**
 * Calcula el nivel del usuario a partir de una evaluación.
 *
 * Algoritmo: cada categoría (fuerza, movilidad, mental) aporta un score 0-3.
 * Se promedian los scores disponibles → 0-3. Mapeo:
 *   < 1.0 → beginner
 *   < 2.0 → base
 *   ≥ 2.0 → intermediate
 *
 * Si no se llenó nada, devuelve 'beginner' (default seguro).
 *
 * Cualquier campo nullable se ignora — el usuario puede dejar vacío
 * lo que no sabe medir.
 */

import type { CreateAssessmentInput } from '@shared/schemas/assessment.schemas'
import type { UserLevel } from '@shared/types/profile'

function bucket(value: number, thresholds: readonly [number, number, number]): number {
  if (value < thresholds[0]) return 0
  if (value < thresholds[1]) return 1
  if (value < thresholds[2]) return 2
  return 3
}

function avg(arr: number[]): number {
  return arr.reduce((acc, v) => acc + v, 0) / arr.length
}

function strengthScore(a: CreateAssessmentInput): number | null {
  const scores: number[] = []
  if (a.pushUps !== null) scores.push(bucket(a.pushUps, [5, 15, 30]))
  if (a.squats !== null) scores.push(bucket(a.squats, [10, 25, 50]))
  if (a.plankSeconds !== null) scores.push(bucket(a.plankSeconds, [20, 45, 90]))
  if (a.pullUps !== null) scores.push(bucket(a.pullUps, [1, 4, 8]))
  return scores.length === 0 ? null : avg(scores)
}

function mobilityScore(a: CreateAssessmentInput): number | null {
  const vals: number[] = []
  if (a.ankleMobility !== null) vals.push(a.ankleMobility)
  if (a.hipMobility !== null) vals.push(a.hipMobility)
  if (a.wristMobility !== null) vals.push(a.wristMobility)
  if (vals.length === 0) return null
  return (avg(vals) / 10) * 3
}

function mentalScore(a: CreateAssessmentInput): number | null {
  const vals: number[] = []
  if (a.confidence !== null) vals.push(a.confidence)
  // miedo, dolor y fatiga se invierten: bajo es bueno
  if (a.fear !== null) vals.push(10 - a.fear)
  if (a.pain !== null) vals.push(10 - a.pain)
  if (a.fatigue !== null) vals.push(10 - a.fatigue)
  if (vals.length === 0) return null
  return (avg(vals) / 10) * 3
}

export function computeLevel(input: CreateAssessmentInput): UserLevel {
  const subs: number[] = []
  const s = strengthScore(input)
  if (s !== null) subs.push(s)
  const m = mobilityScore(input)
  if (m !== null) subs.push(m)
  const mt = mentalScore(input)
  if (mt !== null) subs.push(mt)

  if (subs.length === 0) return 'beginner'

  const total = avg(subs)
  if (total < 1.0) return 'beginner'
  if (total < 2.0) return 'base'
  return 'intermediate'
}
