/**
 * Repositorio del feature "Insights de Progreso".
 *
 * Sólo orquesta queries y delega el cálculo en services/progressInsights.ts
 * (pura, testeable, sin Prisma). El IPC consume este repo.
 *
 * Sin perfil activo, devolvemos un DTO con hasActiveProfile=false para que
 * la UI muestre su empty state correspondiente.
 */

import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import { computeProgressInsights } from '../services/progressInsights'
import { computeStreakState } from '../services/streaks'
import { computeLevelFromXp } from '../services/xpLevels'
import { ACHIEVEMENT_CATALOG } from '../services/achievements'
import type {
  PureMovementInput,
  PureProgressInput,
  PureSessionInput,
  PureXpEventInput
} from '../services/progressInsights'
import type {
  MovementCategory,
  MovementProgressStatus
} from '@shared/types/movement'
import type { ProgressInsightsDto } from '@shared/types/progressInsights'

function emptyDto(): ProgressInsightsDto {
  return computeProgressInsights({
    now: new Date(),
    hasActiveProfile: false,
    sessions: [],
    movements: [],
    progress: [],
    xpEvents: [],
    achievements: [],
    achievementsCatalogTotal: ACHIEVEMENT_CATALOG.length,
    videos: [],
    level: 1,
    totalXp: 0,
    currentStreak: 0,
    bestStreak: 0
  })
}

export const progressInsightsRepository = {
  async getForActive(): Promise<ProgressInsightsDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return emptyDto()

    // 6 queries independientes, en paralelo. Los videos son globales
    // (no scopados al perfil), igual que en el resto del repo.
    const [
      sessions,
      movements,
      progress,
      xpEvents,
      achievements,
      videos,
      recoveries
    ] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { profileId },
        select: {
          id: true,
          endedAt: true,
          startedAt: true,
          durationMin: true,
          painAfter: true,
          fatigueAfter: true,
          movements: { select: { movementId: true } }
        }
      }),
      prisma.movement.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          difficulty: true
        }
      }),
      prisma.movementProgress.findMany({
        where: { profileId },
        select: { movementId: true, status: true, lastPracticedAt: true }
      }),
      prisma.xpEvent.findMany({
        where: { profileId },
        select: { source: true, amount: true, createdAt: true }
      }),
      prisma.achievementUnlock.findMany({
        where: { profileId },
        select: { slug: true, unlockedAt: true }
      }),
      prisma.videoEntry.findMany({
        select: { reviewStatus: true, updatedAt: true }
      }),
      prisma.dailyActivity.findMany({
        where: { profileId, type: 'active_recovery' },
        select: { date: true }
      })
    ])

    const pureSessions: PureSessionInput[] = sessions.map((s) => ({
      id: s.id,
      endedAt: s.endedAt,
      startedAt: s.startedAt,
      durationMin: s.durationMin,
      painAfter: s.painAfter,
      fatigueAfter: s.fatigueAfter,
      movementIds: s.movements.map((m) => m.movementId)
    }))

    const pureMovements: PureMovementInput[] = movements.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      category: m.category as MovementCategory,
      difficulty: m.difficulty
    }))

    const pureProgress: PureProgressInput[] = progress.map((p) => ({
      movementId: p.movementId,
      status: p.status as MovementProgressStatus,
      lastPracticedAt: p.lastPracticedAt
    }))

    const pureXpEvents: PureXpEventInput[] = xpEvents.map((e) => ({
      source: e.source,
      amount: e.amount,
      createdAt: e.createdAt
    }))

    // Total XP + nivel: lo computamos acá para evitar otra query.
    const totalXp = pureXpEvents.reduce((acc, e) => acc + e.amount, 0)
    const xpState = computeLevelFromXp(totalXp)

    // Racha: reusamos el servicio puro existente para ser coherentes con
    // el resto de la UI.
    const sessionEvents = pureSessions
      .filter(
        (
          s
        ): s is PureSessionInput & {
          endedAt: Date
        } => s.endedAt !== null
      )
      .map((s) => ({
        endedAt: s.endedAt,
        painAfter: s.painAfter,
        fatigueAfter: s.fatigueAfter
      }))
    const streakState = computeStreakState(
      sessionEvents,
      recoveries.map((r) => ({ date: r.date }))
    )

    return computeProgressInsights({
      now: new Date(),
      hasActiveProfile: true,
      sessions: pureSessions,
      movements: pureMovements,
      progress: pureProgress,
      xpEvents: pureXpEvents,
      achievements: achievements.map((a) => ({
        slug: a.slug,
        unlockedAt: a.unlockedAt
      })),
      achievementsCatalogTotal: ACHIEVEMENT_CATALOG.length,
      videos: videos.map((v) => ({
        reviewStatus: v.reviewStatus,
        updatedAt: v.updatedAt
      })),
      level: xpState.level,
      totalXp,
      currentStreak: streakState.currentStreak,
      bestStreak: streakState.bestStreak
    })
  }
}
