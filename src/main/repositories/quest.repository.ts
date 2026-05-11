/**
 * Repositorio de misiones (QuestAssignment).
 *
 * Responsabilidades:
 *  - Garantizar que existan las misiones del período actual (daily + weekly)
 *    para el perfil activo (idempotente).
 *  - Listar las misiones activas para el perfil activo.
 *  - Incrementar el progreso de las misiones afectadas por una métrica,
 *    marcándolas como completed cuando llegan al target.
 *  - Reclamar una misión completada → otorga XP via xpEventRepository.
 *
 * El catálogo de misiones vive en services/quests.ts. Acá sólo
 * materializamos asignaciones y consultamos progreso/estado.
 *
 * Idempotencia del progreso: los repos que disparan acciones (sessions,
 * movements, videos, spots) llaman a progressForActive SOLO cuando el
 * XpEvent asociado fue creado (no existía antes). Eso garantiza que cada
 * acción real-mundo sólo cuenta una vez para misiones.
 */

import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import { xpEventRepository } from './xpEvent.repository'
import { achievementRepository } from './achievement.repository'
import {
  QUEST_TEMPLATES,
  findTemplate,
  periodFor,
  templatesByType
} from '../services/quests'
import type {
  ClaimQuestResultDto,
  QuestDto,
  QuestMetric,
  QuestStatus,
  QuestType,
  QuestsListDto
} from '@shared/types/quest'

function rowToDto(row: {
  id: string
  templateSlug: string
  title: string
  description: string
  type: string
  metric: string
  target: number
  progress: number
  xpReward: number
  status: string
  startsAt: Date
  expiresAt: Date
  completedAt: Date | null
  claimedAt: Date | null
}): QuestDto {
  return {
    id: row.id,
    templateSlug: row.templateSlug,
    title: row.title,
    description: row.description,
    type: row.type as QuestType,
    metric: row.metric as QuestMetric,
    target: row.target,
    progress: row.progress,
    xpReward: row.xpReward,
    status: row.status as QuestStatus,
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    claimedAt: row.claimedAt ? row.claimedAt.toISOString() : null
  }
}

/**
 * Asegura que existan asignaciones para el período actual (daily + weekly)
 * del perfil dado. Idempotente vía createMany({ skipDuplicates: true }):
 * el unique (profileId, templateSlug, startsAt) descarta filas ya
 * presentes sin ruido en los logs.
 */
async function ensureCurrentForProfile(
  profileId: string,
  now: Date
): Promise<void> {
  const periods: Record<QuestType, ReturnType<typeof periodFor>> = {
    daily: periodFor('daily', now),
    weekly: periodFor('weekly', now)
  }

  // Pre-chequeamos qué slugs ya tienen asignación para el período exacto
  // y filtramos antes de insertar. Single-process: no hay race con otros
  // llamadores. Esto evita el log ruidoso de P2002 que Prisma escupe
  // antes del try/catch.
  const existing = await prisma.questAssignment.findMany({
    where: {
      profileId,
      OR: [
        { type: 'daily', startsAt: periods.daily.startsAt },
        { type: 'weekly', startsAt: periods.weekly.startsAt }
      ]
    },
    select: { templateSlug: true, type: true }
  })
  const existingKey = new Set(
    existing.map((e) => `${e.type}:${e.templateSlug}`)
  )

  const rows = QUEST_TEMPLATES.filter(
    (tmpl) => !existingKey.has(`${tmpl.type}:${tmpl.slug}`)
  ).map((tmpl) => {
    const p = periods[tmpl.type]
    return {
      profileId,
      templateSlug: tmpl.slug,
      title: tmpl.title,
      description: tmpl.description,
      type: tmpl.type,
      metric: tmpl.metric,
      target: tmpl.target,
      xpReward: tmpl.xpReward,
      startsAt: p.startsAt,
      expiresAt: p.expiresAt
    }
  })

  if (rows.length > 0) {
    await prisma.questAssignment.createMany({ data: rows })
  }
}

export const questRepository = {
  async listForActive(): Promise<QuestsListDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return { daily: [], weekly: [] }

    const now = new Date()
    await ensureCurrentForProfile(profileId, now)

    // Traigo las del período activo (las anteriores reclamadas / vencidas
    // siguen en DB pero no se muestran).
    const rows = await prisma.questAssignment.findMany({
      where: {
        profileId,
        expiresAt: { gte: now }
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }]
    })

    const daily: QuestDto[] = []
    const weekly: QuestDto[] = []
    for (const r of rows) {
      const dto = rowToDto(r)
      if (dto.type === 'daily') daily.push(dto)
      else weekly.push(dto)
    }
    return { daily, weekly }
  },

  /**
   * Aumenta el progreso de toda asignación del perfil activo que mida
   * `metric`, esté `pending` y dentro de su período. Si alcanza el target,
   * pasa a `completed` y setea completedAt.
   *
   * `amount` default 1: prácticamente todas las acciones suman de a uno.
   */
  async progressForActive(metric: QuestMetric, amount = 1): Promise<void> {
    if (amount <= 0) return
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return

    const now = new Date()
    const candidates = await prisma.questAssignment.findMany({
      where: {
        profileId,
        metric,
        status: 'pending',
        startsAt: { lte: now },
        expiresAt: { gte: now }
      }
    })

    for (const q of candidates) {
      const nextProgress = Math.min(q.target, q.progress + amount)
      const reachedTarget = nextProgress >= q.target
      await prisma.questAssignment.update({
        where: { id: q.id },
        data: {
          progress: nextProgress,
          ...(reachedTarget && {
            status: 'completed',
            completedAt: now
          })
        }
      })
    }
  },

  async claimForActive(id: string): Promise<ClaimQuestResultDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) {
      throw new Error('No hay un perfil activo.')
    }

    const quest = await prisma.questAssignment.findUnique({ where: { id } })
    if (!quest) throw new Error('Misión no encontrada')
    if (quest.profileId !== profileId) {
      throw new Error('Esta misión no pertenece al perfil activo')
    }
    if (quest.status === 'pending') {
      throw new Error('Esta misión todavía no está completada')
    }
    if (quest.status === 'claimed') {
      throw new Error('Esta misión ya fue reclamada')
    }

    const now = new Date()
    const updated = await prisma.questAssignment.update({
      where: { id },
      data: { status: 'claimed', claimedAt: now }
    })

    // El sourceRefId es el id de la asignación: garantiza que el XP por
    // reclamar esta misión específica sólo pueda otorgarse una vez.
    await xpEventRepository.grantForActiveWithAmount(
      'quest_claimed',
      quest.id,
      quest.xpReward
    )

    // Evaluación post-reclamo: el catálogo de logros no usa quests
    // directamente hoy, pero dejamos la integración explícita por si en
    // el futuro hay logros como "reclamá 10 misiones".
    await achievementRepository.evaluateAndUnlockForActive()

    return { quest: rowToDto(updated), xpAwarded: quest.xpReward }
  }
}

// Re-exporto para tests / debug aislado del helper.
export { ensureCurrentForProfile, templatesByType, findTemplate }
