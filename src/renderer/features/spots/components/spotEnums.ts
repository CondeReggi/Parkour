import type {
  FloorType,
  ObstacleRiskLevel,
  ObstacleType,
  RecommendedLevel,
  SpotRiskLevel,
  SpotType
} from '@shared/types/spot'

export const FLOOR_OPTIONS: { value: FloorType | 'unspecified'; label: string }[] = [
  { value: 'unspecified', label: 'Sin especificar' },
  { value: 'concrete', label: 'Hormigón' },
  { value: 'grass', label: 'Césped' },
  { value: 'rubber', label: 'Goma / sintético' },
  { value: 'mixed', label: 'Mixto' },
  { value: 'other', label: 'Otro' }
]

export const SPOT_RISK_OPTIONS: { value: SpotRiskLevel; label: string }[] = [
  { value: 'low', label: 'Bajo' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'high', label: 'Alto' }
]

export const OBSTACLE_TYPE_OPTIONS: { value: ObstacleType; label: string }[] = [
  { value: 'wall', label: 'Muro' },
  { value: 'rail', label: 'Baranda' },
  { value: 'bench', label: 'Banco' },
  { value: 'gap', label: 'Hueco / gap' },
  { value: 'stairs', label: 'Escaleras' },
  { value: 'ledge', label: 'Borde / saliente' },
  { value: 'other', label: 'Otro' }
]

export const OBSTACLE_RISK_OPTIONS: { value: ObstacleRiskLevel; label: string }[] = [
  { value: 'low', label: 'Bajo' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'high', label: 'Alto' }
]

export const SPOT_TYPE_OPTIONS: { value: SpotType; label: string }[] = [
  { value: 'precision', label: 'Precisión' },
  { value: 'vaults', label: 'Vaults' },
  { value: 'wall', label: 'Pared' },
  { value: 'balance', label: 'Balance' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'flow', label: 'Flow' },
  { value: 'mobility', label: 'Movilidad' },
  { value: 'low_risk', label: 'Bajo riesgo' }
]

export const SPOT_TYPE_LABEL: Record<SpotType, string> = {
  precision: 'Precisión',
  vaults: 'Vaults',
  wall: 'Pared',
  balance: 'Balance',
  strength: 'Fuerza',
  flow: 'Flow',
  mobility: 'Movilidad',
  low_risk: 'Bajo riesgo'
}

export const RECOMMENDED_LEVEL_OPTIONS: { value: RecommendedLevel; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'base', label: 'Base' },
  { value: 'intermediate', label: 'Intermedio' }
]

export const RECOMMENDED_LEVEL_LABEL: Record<RecommendedLevel, string> = {
  beginner: 'Principiante',
  base: 'Base',
  intermediate: 'Intermedio'
}

export const FLOOR_LABEL: Record<FloorType, string> = {
  concrete: 'Hormigón',
  grass: 'Césped',
  rubber: 'Goma',
  mixed: 'Mixto',
  other: 'Otro'
}

export const RISK_LABEL: Record<SpotRiskLevel, string> = {
  low: 'Bajo',
  moderate: 'Moderado',
  high: 'Alto'
}

export const OBSTACLE_TYPE_LABEL: Record<ObstacleType, string> = {
  wall: 'Muro',
  rail: 'Baranda',
  bench: 'Banco',
  gap: 'Gap',
  stairs: 'Escaleras',
  ledge: 'Borde',
  other: 'Otro'
}

export const RISK_BADGE_VARIANT = (
  r: SpotRiskLevel | ObstacleRiskLevel
): 'default' | 'secondary' | 'destructive' => {
  if (r === 'high') return 'destructive'
  if (r === 'moderate') return 'default'
  return 'secondary'
}

/**
 * Texto de recomendación según el riesgo. Se muestra en el detalle como
 * guía para que el usuario sepa qué precauciones tomar antes de entrenar.
 */
export const RISK_RECOMMENDATION: Record<SpotRiskLevel, string> = {
  low: 'Buen lugar para calentar, practicar repeticiones y construir confianza.',
  moderate: 'Trabajá con regresiones, calentá fuerte y bajá la intensidad si hay dolor o fatiga.',
  high: 'Sólo con buen descanso y buena confianza. Empezá con landings y rolls. Nunca solo.'
}
