/**
 * Lógica pura del checklist de seguridad de "Entrenar hoy".
 * Sin IPC, sin DB. Se invoca desde useMemo en TrainingPage.
 */

import type { ProfileDto } from '@shared/types/profile'
import type { RoutineDto } from '@shared/types/routine'

export type FloorState = 'good' | 'wet' | 'dangerous'
export type EnvState = 'safe' | 'some_risks' | 'unsafe'

export interface SafetyChecklist {
  pain: number          // 0-10 (10 = mucho dolor)
  fatigue: number       // 0-10 (10 = agotado)
  sleepQuality: number  // 0-10 (10 = excelente sueño)
  confidence: number    // 0-10 (10 = mucha confianza)
  floor: FloorState
  environment: EnvState
}

export const DEFAULT_CHECKLIST: SafetyChecklist = {
  pain: 0,
  fatigue: 4,
  sleepQuality: 7,
  confidence: 7,
  floor: 'good',
  environment: 'safe'
}

export type TrafficLight = 'green' | 'yellow' | 'red'

export interface TrafficLightResult {
  level: TrafficLight
  reds: string[]
  yellows: string[]
}

export function computeTrafficLight(c: SafetyChecklist): TrafficLightResult {
  const reds: string[] = []
  const yellows: string[] = []

  // Dolor
  if (c.pain >= 7) reds.push('Dolor alto (≥7)')
  else if (c.pain >= 4) yellows.push('Dolor moderado')

  // Fatiga
  if (c.fatigue >= 8) reds.push('Fatiga muy alta (≥8)')
  else if (c.fatigue >= 5) yellows.push('Fatiga moderada')

  // Sueño
  if (c.sleepQuality <= 3) reds.push('Dormiste muy poco/mal')
  else if (c.sleepQuality <= 5) yellows.push('Sueño no del todo bueno')

  // Confianza
  if (c.confidence <= 3) reds.push('Confianza muy baja')
  else if (c.confidence <= 5) yellows.push('Confianza moderada')

  // Piso
  if (c.floor === 'dangerous') reds.push('Piso peligroso')
  else if (c.floor === 'wet') yellows.push('Piso húmedo')

  // Entorno
  if (c.environment === 'unsafe') reds.push('Entorno inseguro')
  else if (c.environment === 'some_risks') yellows.push('Algunos riesgos en el entorno')

  let level: TrafficLight
  if (reds.length > 0) level = 'red'
  else if (yellows.length >= 3) level = 'red'
  else if (yellows.length >= 1) level = 'yellow'
  else level = 'green'

  return { level, reds, yellows }
}

const LEVEL_ORDER = ['beginner', 'base', 'intermediate'] as const

/**
 * Picker simple para "Entrenar hoy". Selecciona una rutina apta según
 * el semáforo y el perfil. Ignora la última evaluación (la opinión
 * inmediata del checklist es lo que manda).
 *
 * - red: devuelve null (descansar)
 * - yellow: rutina con suitableForFatigue 'low' o 'any'
 * - green: cualquier rutina compatible con el nivel
 *
 * Filtros adicionales:
 *  - Nivel hasta un escalón arriba del perfil
 *  - Lesiones activas no listadas en avoidsInjuries
 */
export function pickRoutineForChecklist(
  routines: RoutineDto[] | undefined,
  profile: ProfileDto | undefined,
  trafficLight: TrafficLight
): RoutineDto | null {
  if (trafficLight === 'red') return null
  if (!routines || routines.length === 0) return null

  const profileIdx = profile ? LEVEL_ORDER.indexOf(profile.level) : -1
  const activeInjuries = profile
    ? profile.injuries.filter((i) => i.isActive).map((i) => i.bodyPart)
    : []
  const wantsSoft = trafficLight === 'yellow'

  const candidates = routines.filter((r) => {
    // Nivel
    if (r.level !== 'any' && profileIdx >= 0) {
      const routineIdx = LEVEL_ORDER.indexOf(r.level as typeof LEVEL_ORDER[number])
      if (routineIdx === -1 || routineIdx > profileIdx + 1) return false
    }

    // Suavidad
    if (wantsSoft && !(r.suitableForFatigue === 'low' || r.suitableForFatigue === 'any')) {
      return false
    }

    // Lesiones
    if (activeInjuries.some((p) => r.avoidsInjuries.includes(p))) return false

    return true
  })

  if (candidates.length === 0) return null

  // Si hay perfil, priorizar coincidencia exacta de objetivo y luego nivel exacto.
  if (profile) {
    const sorted = [...candidates].sort((a, b) => {
      const aGoal = a.goal === profile.mainGoal ? 1 : 0
      const bGoal = b.goal === profile.mainGoal ? 1 : 0
      if (aGoal !== bGoal) return bGoal - aGoal

      const aLevel = a.level === profile.level ? 1 : 0
      const bLevel = b.level === profile.level ? 1 : 0
      return bLevel - aLevel
    })
    return sorted[0] ?? null
  }

  return candidates[0] ?? null
}
