import type { InitialAssessment } from '@prisma/client'
import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import { profileRepository } from './profile.repository'
import { computeLevel } from '../services/levelCalculator'
import type { AssessmentDto } from '@shared/types/assessment'
import type { UserLevel } from '@shared/types/profile'
import type { CreateAssessmentInput } from '@shared/schemas/assessment.schemas'

function toDto(a: InitialAssessment): AssessmentDto {
  return {
    id: a.id,
    profileId: a.profileId,
    pushUps: a.pushUps,
    squats: a.squats,
    plankSeconds: a.plankSeconds,
    pullUps: a.pullUps,
    ankleMobility: a.ankleMobility,
    hipMobility: a.hipMobility,
    wristMobility: a.wristMobility,
    confidence: a.confidence,
    fear: a.fear,
    pain: a.pain,
    fatigue: a.fatigue,
    computedLevel: a.computedLevel as UserLevel,
    notes: a.notes,
    createdAt: a.createdAt.toISOString()
  }
}

async function requireActiveProfileId(): Promise<string> {
  const id = await settingsRepository.getActiveProfileId()
  if (!id) throw new Error('No hay un perfil activo. Creá un perfil primero.')
  return id
}

export const assessmentRepository = {
  async createForActive(input: CreateAssessmentInput): Promise<AssessmentDto> {
    const profileId = await requireActiveProfileId()
    const computedLevel = computeLevel(input)
    const created = await prisma.initialAssessment.create({
      data: {
        profileId,
        pushUps: input.pushUps,
        squats: input.squats,
        plankSeconds: input.plankSeconds,
        pullUps: input.pullUps,
        ankleMobility: input.ankleMobility,
        hipMobility: input.hipMobility,
        wristMobility: input.wristMobility,
        confidence: input.confidence,
        fear: input.fear,
        pain: input.pain,
        fatigue: input.fatigue,
        notes: input.notes,
        computedLevel
      }
    })
    // El nivel del perfil siempre refleja la última evaluación.
    await profileRepository.setLevel(profileId, computedLevel)
    return toDto(created)
  },

  async listForActive(): Promise<AssessmentDto[]> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return []
    const rows = await prisma.initialAssessment.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' }
    })
    return rows.map(toDto)
  },

  async latestForActive(): Promise<AssessmentDto | null> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return null
    const row = await prisma.initialAssessment.findFirst({
      where: { profileId },
      orderBy: { createdAt: 'desc' }
    })
    return row ? toDto(row) : null
  }
}
