/**
 * Tipos compartidos del perfil del usuario y de sus lesiones.
 * El renderer consume estos tipos; el main devuelve estos DTOs.
 */

export type ParkourExperience = 'none' | 'lt6m' | '6_12m' | '1_2y' | 'gt2y'
export type DominantLeg = 'left' | 'right' | 'both'
export type WeakSide = 'left' | 'right' | 'none'
export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type MainGoal = 'technique' | 'mobility' | 'strength' | 'general'
export type Intensity = 'low' | 'moderate' | 'high'
export type UserLevel = 'beginner' | 'base' | 'intermediate'

export type InjurySeverity = 'mild' | 'moderate' | 'severe'
export type BodyPart = 'ankle' | 'knee' | 'wrist' | 'shoulder' | 'back' | 'neck' | 'other'

export interface InjuryDto {
  id: string
  bodyPart: BodyPart
  description: string | null
  severity: InjurySeverity
  isActive: boolean
  startedAt: string // ISO date
  resolvedAt: string | null
  notes: string | null
}

export interface ProfileDto {
  id: string
  name: string
  age: number | null
  heightCm: number | null
  weightKg: number | null
  parkourExperience: ParkourExperience
  previousSports: string | null
  dominantLeg: DominantLeg
  weakSide: WeakSide | null
  daysAvailable: WeekDay[]
  sessionDurationMin: number
  mainGoal: MainGoal
  preferredIntensity: Intensity
  level: UserLevel
  injuries: InjuryDto[]
  createdAt: string
  updatedAt: string
}
