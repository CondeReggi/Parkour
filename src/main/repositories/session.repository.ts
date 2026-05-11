/**
 * Repositorio de WorkoutSession + WorkoutMovement.
 *
 * Convenciones:
 *  - "active session" = sesión del perfil activo con endedAt = null.
 *  - durationMin se computa al finalizar si el usuario no lo provee
 *    (diff entre startedAt y now en minutos, mínimo 1).
 *  - finalize replaza la lista completa de movements (delete + recreate)
 *    porque para MVP es más simple que diff.
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import type {
  SessionDto,
  SessionPlace,
  SessionTrafficLight,
  WorkoutMovementDto
} from '@shared/types/session'
import type {
  FinalizeSessionInput,
  StartSessionInput
} from '@shared/schemas/session.schemas'
import type { SessionStatsDto } from '@shared/types/stats'
import { computeSessionStats } from '../services/sessionStats'
import { xpEventRepository } from './xpEvent.repository'
import { questRepository } from './quest.repository'
import { routineRepository } from './routine.repository'
import { achievementRepository } from './achievement.repository'

type SessionWithRelations = Prisma.WorkoutSessionGetPayload<{
  include: {
    routine: { select: { name: true; slug: true } }
    movements: {
      include: {
        movement: { select: { name: true; slug: true } }
      }
    }
  }
}>

const FULL_INCLUDE = {
  routine: { select: { name: true, slug: true } },
  movements: {
    include: {
      movement: { select: { name: true, slug: true } }
    }
  }
} satisfies Prisma.WorkoutSessionInclude

function toMovementDto(m: SessionWithRelations['movements'][number]): WorkoutMovementDto {
  return {
    id: m.id,
    movementId: m.movementId,
    movementName: m.movement.name,
    movementSlug: m.movement.slug,
    notes: m.notes
  }
}

function toDto(s: SessionWithRelations): SessionDto {
  return {
    id: s.id,
    profileId: s.profileId,
    routineId: s.routineId,
    routineName: s.routine?.name ?? null,
    routineSlug: s.routine?.slug ?? null,
    spotId: s.spotId,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt ? s.endedAt.toISOString() : null,
    durationMin: s.durationMin,
    safetyTrafficLight: s.safetyTrafficLight as SessionTrafficLight,
    safetyOverridden: s.safetyOverridden,
    safetyNotes: s.safetyNotes,
    painBefore: s.painBefore,
    painAfter: s.painAfter,
    fatigueBefore: s.fatigueBefore,
    fatigueAfter: s.fatigueAfter,
    energyBefore: s.energyBefore,
    goalOfDay: s.goalOfDay,
    place: (s.place as SessionPlace | null) ?? null,
    generalState: s.generalState,
    personalNotes: s.personalNotes,
    movements: s.movements.map(toMovementDto),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString()
  }
}

async function requireActiveProfileId(): Promise<string> {
  const id = await settingsRepository.getActiveProfileId()
  if (!id) throw new Error('No hay un perfil activo. Creá un perfil primero.')
  return id
}

function computeDurationMinutes(startedAt: Date, endedAt: Date): number {
  const diffMs = endedAt.getTime() - startedAt.getTime()
  return Math.max(1, Math.round(diffMs / 60000))
}

export const sessionRepository = {
  async start(input: StartSessionInput): Promise<SessionDto> {
    const profileId = await requireActiveProfileId()

    // Si hay sesión activa previa, la cancelamos (sólo una en curso).
    await prisma.workoutSession.deleteMany({
      where: { profileId, endedAt: null }
    })

    const created = await prisma.workoutSession.create({
      data: {
        profileId,
        routineId: input.routineId,
        spotId: input.spotId ?? null,
        safetyTrafficLight: input.safetyTrafficLight,
        safetyOverridden: input.safetyOverridden,
        safetyNotes: input.safetyNotes,
        painBefore: input.painBefore,
        fatigueBefore: input.fatigueBefore,
        energyBefore: input.energyBefore ?? null,
        goalOfDay: input.goalOfDay ?? null,
        place: input.place ?? null
      },
      include: FULL_INCLUDE
    })
    return toDto(created)
  },

  async getActive(): Promise<SessionDto | null> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return null
    const row = await prisma.workoutSession.findFirst({
      where: { profileId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      include: FULL_INCLUDE
    })
    return row ? toDto(row) : null
  },

  async finalize(input: FinalizeSessionInput): Promise<SessionDto> {
    const profileId = await requireActiveProfileId()

    const existing = await prisma.workoutSession.findUnique({
      where: { id: input.id }
    })
    if (!existing) throw new Error('Sesión no encontrada')
    if (existing.profileId !== profileId) {
      throw new Error('Esta sesión no pertenece al perfil activo')
    }
    if (existing.endedAt !== null) {
      throw new Error('Esta sesión ya está finalizada')
    }

    const endedAt = new Date()
    const durationMin =
      input.durationMin ?? computeDurationMinutes(existing.startedAt, endedAt)

    // Reemplazar movements: delete + recreate (más simple que diff para MVP)
    await prisma.workoutMovement.deleteMany({
      where: { sessionId: input.id }
    })

    const updated = await prisma.workoutSession.update({
      where: { id: input.id },
      data: {
        endedAt,
        durationMin,
        painAfter: input.painAfter,
        fatigueAfter: input.fatigueAfter,
        generalState: input.generalState,
        personalNotes: input.personalNotes,
        movements: {
          create: input.movementIds.map((movementId) => ({ movementId }))
        }
      },
      include: FULL_INCLUDE
    })

    // XP por sesión finalizada (dedup por sessionId).
    const granted = await xpEventRepository.grantForActive(
      'session_finalized',
      updated.id
    )
    // Sólo progresamos misiones si el XpEvent fue nuevo. Eso garantiza que
    // si se reintenta la mutación, no se cuenta dos veces.
    if (granted) {
      await questRepository.progressForActive('sessions_finalized')

      const lowPain = updated.painAfter !== null && updated.painAfter <= 3
      if (lowPain) {
        await questRepository.progressForActive('sessions_low_pain')
      }

      if (updated.routineId) {
        const recommendation = await routineRepository.recommendForActive()
        if (recommendation?.routine?.id === updated.routineId) {
          await questRepository.progressForActive(
            'recommended_routine_completed'
          )
        }
      }
    }

    // Evaluamos logros después de progress/XP. Idempotente: no hace daño
    // llamarse aunque no haya nuevos contadores.
    await achievementRepository.evaluateAndUnlockForActive()

    return toDto(updated)
  },

  async cancel(id: string): Promise<void> {
    const profileId = await requireActiveProfileId()
    const existing = await prisma.workoutSession.findUnique({ where: { id } })
    if (!existing) return
    if (existing.profileId !== profileId) {
      throw new Error('Esta sesión no pertenece al perfil activo')
    }
    if (existing.endedAt !== null) {
      throw new Error('No se puede cancelar una sesión ya finalizada')
    }
    await prisma.workoutSession.delete({ where: { id } })
  },

  async listForActive(): Promise<SessionDto[]> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return []
    const rows = await prisma.workoutSession.findMany({
      where: { profileId, endedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      include: FULL_INCLUDE
    })
    return rows.map(toDto)
  },

  async getById(id: string): Promise<SessionDto | null> {
    const row = await prisma.workoutSession.findUnique({
      where: { id },
      include: FULL_INCLUDE
    })
    return row ? toDto(row) : null
  },

  async getStats(): Promise<SessionStatsDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) {
      return {
        totalSessions: 0,
        daysTrained: 0,
        currentStreak: 0,
        sessionsThisWeek: 0,
        masteredMovements: 0,
        practicingMovements: 0
      }
    }

    const [endedAtsRows, masteredCount, practicingCount] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { profileId, endedAt: { not: null } },
        select: { endedAt: true }
      }),
      prisma.movementProgress.count({
        where: { profileId, status: 'mastered' }
      }),
      prisma.movementProgress.count({
        where: { profileId, status: 'practicing' }
      })
    ])

    const endedAts = endedAtsRows
      .map((r) => r.endedAt)
      .filter((d): d is Date => d !== null)

    const core = computeSessionStats(endedAts)
    return {
      ...core,
      masteredMovements: masteredCount,
      practicingMovements: practicingCount
    }
  }
}
