/**
 * Repositorio de Routine + RoutineBlock + RoutineExercise (siempre nested).
 * También orquesta el recomendador: arma el contexto desde el perfil activo.
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import { assessmentRepository } from './assessment.repository'
import { recommendRoutine } from '../services/routineRecommender'
import type { BodyPart } from '@shared/types/profile'
import type {
  FatigueLevel,
  RoutineBlockType,
  RoutineDto,
  RoutineLevel,
  RoutineRecommendationDto,
  RoutineSuitableFatigue
} from '@shared/types/routine'
import type { MainGoal } from '@shared/types/profile'

type RoutineWithRelations = Prisma.RoutineGetPayload<{
  include: {
    blocks: {
      include: {
        exercises: {
          include: { movement: true }
        }
      }
    }
  }
}>

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((it): it is string => typeof it === 'string')
  } catch {
    return []
  }
}

function toDto(r: RoutineWithRelations): RoutineDto {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    goal: r.goal as MainGoal,
    level: r.level as RoutineLevel,
    estimatedMin: r.estimatedMin,
    isBuiltIn: r.isBuiltIn,
    suitableForFatigue: r.suitableForFatigue as RoutineSuitableFatigue,
    avoidsInjuries: parseStringArray(r.avoidsInjuries),
    authorAccountId: r.authorAccountId,
    visibility: r.visibility as RoutineDto['visibility'],
    sharedAt: r.sharedAt ? r.sharedAt.toISOString() : null,
    shareSlug: r.shareSlug,
    blocks: r.blocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((b) => ({
        id: b.id,
        type: b.type as RoutineBlockType,
        order: b.order,
        exercises: b.exercises
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((e) => ({
            id: e.id,
            movementSlug: e.movement?.slug ?? null,
            movementName: e.movement?.name ?? null,
            name: e.name,
            description: e.description,
            sets: e.sets,
            reps: e.reps,
            durationSec: e.durationSec,
            restSec: e.restSec,
            notes: e.notes,
            order: e.order
          }))
      }))
  }
}

function fatigueFromAssessment(value: number | null): FatigueLevel {
  if (value === null) return 'moderate'
  if (value >= 7) return 'high'
  if (value <= 3) return 'low'
  return 'moderate'
}

const FULL_INCLUDE = {
  blocks: {
    include: {
      exercises: {
        include: { movement: true }
      }
    }
  }
} satisfies Prisma.RoutineInclude

export const routineRepository = {
  async getAll(): Promise<RoutineDto[]> {
    const rows = await prisma.routine.findMany({
      orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }],
      include: FULL_INCLUDE
    })
    return rows.map(toDto)
  },

  async getBySlug(slug: string): Promise<RoutineDto | null> {
    const row = await prisma.routine.findUnique({
      where: { slug },
      include: FULL_INCLUDE
    })
    return row ? toDto(row) : null
  },

  async recommendForActive(): Promise<RoutineRecommendationDto | null> {
    const activeId = await settingsRepository.getActiveProfileId()
    if (!activeId) return null

    const profile = await prisma.userProfile.findUnique({
      where: { id: activeId },
      include: { injuries: true }
    })
    if (!profile) return null

    const latest = await assessmentRepository.latestForActive()
    const fatigue = fatigueFromAssessment(latest?.fatigue ?? null)

    const activeInjuryParts = profile.injuries
      .filter((i) => i.isActive)
      .map((i) => i.bodyPart as BodyPart)

    const all = await prisma.routine.findMany({
      where: { isBuiltIn: true },
      include: FULL_INCLUDE
    })

    const result = recommendRoutine(all, {
      profileLevel: profile.level as 'beginner' | 'base' | 'intermediate',
      profileGoal: profile.mainGoal as MainGoal,
      fatigue,
      activeInjuryParts
    })

    if (!result.routine) return null
    return {
      routine: toDto(result.routine),
      reasons: result.reasons
    }
  }
}
