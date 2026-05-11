/**
 * Repositorio de logros.
 *
 * Responsabilidades:
 *  - Construir el contexto del perfil activo desde la DB.
 *  - Evaluar el catálogo y desbloquear los que se cumplan (idempotente).
 *  - Listar el estado completo (desbloqueados + bloqueados).
 *  - Otorgar el XP de recompensa una sola vez por logro.
 *
 * Idempotencia:
 *  - El unique (profileId, slug) garantiza que cada logro se inserte una
 *    sola vez. Capturamos P2002 silenciosamente.
 *  - El XP por desbloqueo usa 'achievement_unlocked' como source y el slug
 *    como sourceRefId. El unique de XpEvent garantiza que el grant también
 *    sea una sola vez aunque el caller llame a evaluateAndUnlockForActive
 *    múltiples veces.
 *
 * Notas:
 *  - El evaluador no se llama desde dentro de xpEventRepository — se llama
 *    explícitamente desde los repos que sí toman acciones importantes
 *    (sessions, movements, videos, spots, quests). Eso evita recursión:
 *    el XpEvent 'achievement_unlocked' no dispara otra evaluación.
 */

import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import { xpEventRepository } from './xpEvent.repository'
import { computeSessionStats } from '../services/sessionStats'
import {
  ACHIEVEMENT_CATALOG,
  evaluateAllAchievements,
  findAchievementTemplate,
  type AchievementContext
} from '../services/achievements'
import type {
  AchievementCategory,
  AchievementDto,
  AchievementsListDto
} from '@shared/types/achievement'

async function buildContextForProfile(
  profileId: string
): Promise<AchievementContext> {
  // Las consultas son independientes — paralelizamos.
  const [
    finalizedSessions,
    masteredMovementCount,
    videoCount,
    videoReviewedCount,
    spotCount
  ] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { profileId, endedAt: { not: null } },
      select: { endedAt: true, painAfter: true }
    }),
    prisma.movementProgress.count({
      where: { profileId, status: 'mastered' }
    }),
    prisma.videoEntry.count(),
    prisma.videoEntry.count({
      where: { reviewStatus: { not: 'pending' } }
    }),
    prisma.spot.count()
  ])

  const endedAts: Date[] = finalizedSessions
    .map((s) => s.endedAt)
    .filter((d): d is Date => d !== null)

  const lowPainSessionCount = finalizedSessions.filter(
    (s) => s.painAfter !== null && s.painAfter <= 3
  ).length

  const stats = computeSessionStats(endedAts)

  return {
    endedAts,
    lowPainSessionCount,
    masteredMovementCount,
    videoCount,
    videoReviewedCount,
    spotCount,
    currentStreak: stats.currentStreak
  }
}

function rowToUnlockedDto(
  row: { slug: string; unlockedAt: Date; xpAwarded: number }
): AchievementDto | null {
  const tmpl = findAchievementTemplate(row.slug)
  if (!tmpl) return null
  return {
    slug: tmpl.slug,
    title: tmpl.title,
    description: tmpl.description,
    category: tmpl.category,
    xpReward: tmpl.xpReward,
    unlocked: true,
    unlockedAt: row.unlockedAt.toISOString(),
    xpAwarded: row.xpAwarded
  }
}

function templateToLockedDto(slug: string): AchievementDto | null {
  const tmpl = findAchievementTemplate(slug)
  if (!tmpl) return null
  return {
    slug: tmpl.slug,
    title: tmpl.title,
    description: tmpl.description,
    category: tmpl.category,
    xpReward: tmpl.xpReward,
    unlocked: false,
    unlockedAt: null,
    xpAwarded: 0
  }
}

export const achievementRepository = {
  async listForActive(): Promise<AchievementsListDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    const unlockedRows = profileId
      ? await prisma.achievementUnlock.findMany({
          where: { profileId },
          orderBy: { unlockedAt: 'desc' }
        })
      : []

    const unlockedBySlug = new Map(unlockedRows.map((r) => [r.slug, r]))
    const unlocked: AchievementDto[] = []
    const locked: AchievementDto[] = []

    for (const tmpl of ACHIEVEMENT_CATALOG) {
      const row = unlockedBySlug.get(tmpl.slug)
      if (row) {
        const dto = rowToUnlockedDto(row)
        if (dto) unlocked.push(dto)
      } else {
        const dto = templateToLockedDto(tmpl.slug)
        if (dto) locked.push(dto)
      }
    }

    // unlocked ya viene ordenado desc por unlockedAt (lo trajimos así).
    return {
      unlocked,
      locked,
      totalCount: ACHIEVEMENT_CATALOG.length,
      unlockedCount: unlocked.length
    }
  },

  async recentForActive(limit = 3): Promise<AchievementDto[]> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return []
    const rows = await prisma.achievementUnlock.findMany({
      where: { profileId },
      orderBy: { unlockedAt: 'desc' },
      take: limit
    })
    const dtos: AchievementDto[] = []
    for (const r of rows) {
      const dto = rowToUnlockedDto(r)
      if (dto) dtos.push(dto)
    }
    return dtos
  },

  /**
   * Evalúa el catálogo contra el estado actual del perfil activo y
   * desbloquea los logros que cumplan la condición y todavía no estén
   * desbloqueados. Devuelve los slugs recién desbloqueados (vacío si no
   * hubo ninguno).
   *
   * Diseñada para llamarse después de cualquier acción que pueda mover
   * un contador: finalizar sesión, marcar progreso de movement, subir
   * o revisar video, registrar spot, reclamar misión.
   *
   * Si no hay perfil activo, no hace nada y devuelve [].
   */
  async evaluateAndUnlockForActive(): Promise<string[]> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return []

    const ctx = await buildContextForProfile(profileId)
    const satisfied = evaluateAllAchievements(ctx)
    if (satisfied.length === 0) return []

    // Filtro los que ya estén desbloqueados para no pegarle a DB por nada.
    const alreadyUnlocked = await prisma.achievementUnlock.findMany({
      where: { profileId, slug: { in: satisfied } },
      select: { slug: true }
    })
    const alreadySet = new Set(alreadyUnlocked.map((r) => r.slug))
    const toUnlock = satisfied.filter((s) => !alreadySet.has(s))
    if (toUnlock.length === 0) return []

    const toInsert: { profileId: string; slug: string; xpAwarded: number }[] =
      []
    for (const slug of toUnlock) {
      const tmpl = findAchievementTemplate(slug)
      if (!tmpl) continue
      toInsert.push({ profileId, slug, xpAwarded: tmpl.xpReward })
    }
    if (toInsert.length === 0) return []

    // Filtrado ya hecho contra `alreadySet`. Single-process: no hay race
    // con otros llamadores. createMany sin skipDuplicates: SQLite no
    // soporta esa opción.
    await prisma.achievementUnlock.createMany({ data: toInsert })

    const justUnlocked: string[] = []
    for (const row of toInsert) {
      if (row.xpAwarded > 0) {
        // Slug como sourceRefId → dedupe garantiza que el XP también se
        // otorga una sola vez (aun si por algún motivo se reintenta).
        await xpEventRepository.grantForActiveWithAmount(
          'achievement_unlocked',
          row.slug,
          row.xpAwarded
        )
      }
      justUnlocked.push(row.slug)
    }
    return justUnlocked
  }
}
