import type { UserLevel } from './profile'

export interface AssessmentDto {
  id: string
  profileId: string
  pushUps: number | null
  squats: number | null
  plankSeconds: number | null
  pullUps: number | null
  ankleMobility: number | null
  hipMobility: number | null
  wristMobility: number | null
  confidence: number | null
  fear: number | null
  pain: number | null
  fatigue: number | null
  computedLevel: UserLevel
  notes: string | null
  createdAt: string // ISO date
}
