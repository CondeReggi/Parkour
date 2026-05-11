/**
 * Repositorio de Movement + MovementProgress (acoplado: el progreso siempre
 * se consulta en el contexto del perfil activo).
 *
 * Reglas:
 *  - No importa nada de Electron.
 *  - No conoce IPC.
 *  - Devuelve sólo DTOs de @shared/types.
 */

import type { Movement, MovementProgress } from '@prisma/client'
import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import type {
  MovementCategory,
  MovementDto,
  MovementLevel,
  MovementProgressStatus,
  MovementUserProgress
} from '@shared/types/movement'
import type { SetMovementProgressInput } from '@shared/schemas/movement.schemas'
import type { MovementRecommendationDto } from '@shared/types/movementRecommendation'
import type { MainGoal, UserLevel } from '@shared/types/profile'
import { recommendMovements } from '../services/movementRecommender'
import { xpEventRepository } from './xpEvent.repository'
import { questRepository } from './quest.repository'
import { achievementRepository } from './achievement.repository'

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

function defaultProgress(): MovementUserProgress {
  return { status: 'not_attempted', notes: null, lastPracticedAt: null }
}

function progressToDto(p: MovementProgress): MovementUserProgress {
  return {
    status: p.status as MovementProgressStatus,
    notes: p.notes,
    lastPracticedAt: p.lastPracticedAt ? p.lastPracticedAt.toISOString() : null
  }
}

function toDto(
  row: Movement,
  progress: MovementProgress | null,
  extra?: {
    usedInRoutines?: MovementDto['usedInRoutines']
    nextMovements?: MovementDto['nextMovements']
  }
): MovementDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as MovementCategory,
    description: row.description,
    difficulty: row.difficulty,
    requiredLevel: row.requiredLevel as MovementLevel,
    risks: parseStringArray(row.risks),
    prerequisites: parseStringArray(row.prerequisites),
    commonMistakes: parseStringArray(row.commonMistakes),
    goodExecutionCues: parseStringArray(row.goodExecutionCues),
    preparatoryDrills: parseStringArray(row.preparatoryDrills),
    musclesInvolved: parseStringArray(row.musclesInvolved),
    tags: parseStringArray(row.tags),
    technicalGoal: row.technicalGoal,
    safetyChecklist: parseStringArray(row.safetyChecklist),
    isBuiltIn: row.isBuiltIn,
    userProgress: progress ? progressToDto(progress) : defaultProgress(),
    usedInRoutines: extra?.usedInRoutines ?? [],
    nextMovements: extra?.nextMovements ?? []
  }
}

export const movementRepository = {
  async getAll(): Promise<MovementDto[]> {
    const profileId = await settingsRepository.getActiveProfileId()
    const rows = await prisma.movement.findMany({
      orderBy: [{ category: 'asc' }, { difficulty: 'asc' }, { name: 'asc' }],
      include: {
        progressEntries: profileId
          ? { where: { profileId }, take: 1 }
          : false
      }
    })
    return rows.map((m) => {
      const progress = 'progressEntries' in m && Array.isArray(m.progressEntries)
        ? m.progressEntries[0] ?? null
        : null
      return toDto(m, progress)
    })
  },

  async getBySlug(slug: string): Promise<MovementDto | null> {
    const profileId = await settingsRepository.getActiveProfileId()
    const row = await prisma.movement.findUnique({
      where: { slug },
      include: {
        progressEntries: profileId
          ? { where: { profileId }, take: 1 }
          : false,
        routineExercises: {
          include: {
            block: {
              include: {
                routine: { select: { id: true, slug: true, name: true } }
              }
            }
          }
        }
      }
    })
    if (!row) return null
    const progress =
      'progressEntries' in row && Array.isArray(row.progressEntries)
        ? row.progressEntries[0] ?? null
        : null

    // Rutinas únicas en las que aparece este movement.
    const routinesMap = new Map<string, MovementDto['usedInRoutines'][number]>()
    for (const ex of row.routineExercises) {
      const r = ex.block.routine
      if (!routinesMap.has(r.id)) {
        routinesMap.set(r.id, { id: r.id, slug: r.slug, name: r.name })
      }
    }
    const usedInRoutines = Array.from(routinesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    // Próximos movements: los que declaran este slug en sus prerequisites.
    // Como prerequisites es JSON string, hago un LIKE para narrowing y
    // después filtro en código para descartar falsos positivos.
    const candidates = await prisma.movement.findMany({
      where: { prerequisites: { contains: `"${slug}"` } },
      select: {
        slug: true,
        name: true,
        difficulty: true,
        prerequisites: true
      }
    })
    const nextMovements = candidates
      .filter((c) => parseStringArray(c.prerequisites).includes(slug))
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        difficulty: c.difficulty
      }))
      .sort((a, b) => {
        if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty
        return a.name.localeCompare(b.name)
      })

    return toDto(row, progress, { usedInRoutines, nextMovements })
  },

  async setProgress(input: SetMovementProgressInput): Promise<MovementDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) {
      throw new Error('No hay un perfil activo. Creá un perfil primero.')
    }

    const now = input.status === 'not_attempted' ? null : new Date()

    await prisma.movementProgress.upsert({
      where: {
        profileId_movementId: { profileId, movementId: input.movementId }
      },
      create: {
        profileId,
        movementId: input.movementId,
        status: input.status,
        notes: input.notes,
        lastPracticedAt: now
      },
      update: {
        status: input.status,
        notes: input.notes,
        // Sólo actualizamos lastPracticedAt si pasamos a un estado activo
        ...(now !== null && { lastPracticedAt: now })
      }
    })

    // XP por hitos del progreso. grantForActive dedupa por movementId,
    // así que volver de mastered a practicing y de vuelta no re-otorga.
    // Sólo progresamos misiones cuando el grant fue nuevo (true).
    if (input.status === 'practicing' || input.status === 'mastered') {
      const grantedPracticing = await xpEventRepository.grantForActive(
        'movement_practicing',
        input.movementId
      )
      if (grantedPracticing) {
        await questRepository.progressForActive('movements_practiced')
      }
    }
    if (input.status === 'mastered') {
      const grantedMastered = await xpEventRepository.grantForActive(
        'movement_mastered',
        input.movementId
      )
      if (grantedMastered) {
        await questRepository.progressForActive('movements_mastered')
      }
    }

    await achievementRepository.evaluateAndUnlockForActive()

    const row = await prisma.movement.findUnique({
      where: { id: input.movementId },
      include: {
        progressEntries: { where: { profileId }, take: 1 }
      }
    })
    if (!row) throw new Error('Movement not found after upsert')
    return toDto(row, row.progressEntries[0] ?? null)
  },

  async getRecommendationsForActive(
    limit = 5
  ): Promise<MovementRecommendationDto[]> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return []
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { level: true, mainGoal: true }
    })
    if (!profile) return []

    const movements = await this.getAll()
    const masteredSlugs = new Set(
      movements
        .filter((m) => m.userProgress.status === 'mastered')
        .map((m) => m.slug)
    )

    return recommendMovements(
      movements,
      {
        level: profile.level as UserLevel,
        goal: profile.mainGoal as MainGoal,
        masteredSlugs
      },
      limit
    )
  }
}
