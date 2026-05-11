/**
 * Repositorio del sistema de gamificación (XP / niveles).
 *
 * grantOnce es idempotente vía el unique compuesto (profileId, source,
 * sourceRefId) del modelo Prisma. Si una acción se reintenta o el repo
 * que la dispara se llama dos veces, la segunda inserción rebota con
 * P2002 y la silenciamos: el resultado neto es que ese par sólo otorga
 * XP una vez en la vida del perfil.
 *
 * Backfill lazy: la primera vez que se pide el estado de gamificación de
 * un perfil sin XpEvent, recorremos los datos existentes (sesiones,
 * progreso de movimientos, videos, spots) y le damos al usuario el XP
 * que correspondería si esos eventos se hubieran emitido en su momento.
 * Como grantOnce es idempotente, ejecutar el backfill múltiples veces
 * es seguro.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import { computeLevelFromXp } from '../services/xpLevels'
import type {
  GamificationStateDto,
  XpBreakdownDto,
  XpEventDto,
  XpSource
} from '@shared/types/gamification'
import { XP_REWARDS } from '@shared/types/gamification'

const ALL_SOURCES: XpSource[] = [
  'session_finalized',
  'movement_practicing',
  'movement_mastered',
  'video_uploaded',
  'video_reviewed',
  'spot_registered',
  'quest_claimed',
  'achievement_unlocked'
]

function toDto(row: {
  id: string
  source: string
  sourceRefId: string
  amount: number
  createdAt: Date
}): XpEventDto {
  return {
    id: row.id,
    source: row.source as XpSource,
    sourceRefId: row.sourceRefId,
    amount: row.amount,
    createdAt: row.createdAt.toISOString()
  }
}

/**
 * Crea un XpEvent o lo ignora silenciosamente si ya existe el mismo trío
 * (profileId, source, sourceRefId). Devuelve true si efectivamente se creó.
 *
 * Si `customAmount` viene, sobreescribe XP_REWARDS[source]. Está pensado
 * para 'quest_claimed' donde la recompensa depende de la misión reclamada.
 */
async function grantOnce(
  profileId: string,
  source: XpSource,
  sourceRefId: string,
  customAmount?: number
): Promise<boolean> {
  try {
    await prisma.xpEvent.create({
      data: {
        profileId,
        source,
        sourceRefId,
        amount: customAmount ?? XP_REWARDS[source]
      }
    })
    return true
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      // Dedup: ya había un XpEvent con ese (profileId, source, sourceRefId).
      return false
    }
    throw e
  }
}

/**
 * Recorre los datos preexistentes del perfil y otorga XP retroactivo.
 * Pensado para correr una sola vez por perfil (la primera lectura del
 * estado de gamificación), pero idempotente: si se vuelve a correr no
 * hace daño.
 */
async function backfillForProfile(profileId: string): Promise<void> {
  // Sesiones finalizadas.
  const finalizedSessions = await prisma.workoutSession.findMany({
    where: { profileId, endedAt: { not: null } },
    select: { id: true }
  })
  for (const s of finalizedSessions) {
    await grantOnce(profileId, 'session_finalized', s.id)
  }

  // Progreso de movimientos: por cada estado activo, una vez.
  const progress = await prisma.movementProgress.findMany({
    where: { profileId, status: { in: ['practicing', 'mastered'] } },
    select: { movementId: true, status: true }
  })
  for (const p of progress) {
    if (p.status === 'practicing') {
      await grantOnce(profileId, 'movement_practicing', p.movementId)
    } else if (p.status === 'mastered') {
      // Si fue mastered, presumimos que pasó por practicing antes.
      await grantOnce(profileId, 'movement_practicing', p.movementId)
      await grantOnce(profileId, 'movement_mastered', p.movementId)
    }
  }

  // Videos: uno por cada video del usuario, y video_reviewed si su estado
  // dejó de ser 'pending'. Como VideoEntry no tiene profileId, los videos
  // son globales (no scopados); sólo otorgamos XP de video al perfil
  // activo en el momento del backfill.
  const videos = await prisma.videoEntry.findMany({
    select: { id: true, reviewStatus: true }
  })
  for (const v of videos) {
    await grantOnce(profileId, 'video_uploaded', v.id)
    if (v.reviewStatus !== 'pending') {
      await grantOnce(profileId, 'video_reviewed', v.id)
    }
  }

  // Spots: globales también, mismo tratamiento.
  const spots = await prisma.spot.findMany({ select: { id: true } })
  for (const s of spots) {
    await grantOnce(profileId, 'spot_registered', s.id)
  }
}

export const xpEventRepository = {
  /**
   * Punto de entrada que usan los otros repositorios (sessions, movements,
   * videos, spots) cuando ocurre una acción que otorga XP. Si no hay
   * perfil activo, no hace nada (la acción se persiste igual sin XP).
   *
   * Devuelve `true` si efectivamente se creó un XpEvent nuevo (es la
   * primera vez que se ve ese par source/refId para el perfil). Los repos
   * usan ese booleano para decidir si también propagan progreso a misiones.
   */
  async grantForActive(
    source: XpSource,
    sourceRefId: string
  ): Promise<boolean> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return false
    return grantOnce(profileId, source, sourceRefId)
  },

  /** Variante con amount explícito, pensada para 'quest_claimed'. */
  async grantForActiveWithAmount(
    source: XpSource,
    sourceRefId: string,
    amount: number
  ): Promise<boolean> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return false
    return grantOnce(profileId, source, sourceRefId, amount)
  },

  async getStateForActive(): Promise<GamificationStateDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return computeLevelFromXp(0)

    // Backfill lazy: sólo si nunca se registró un evento para este perfil.
    const existingCount = await prisma.xpEvent.count({ where: { profileId } })
    if (existingCount === 0) {
      await backfillForProfile(profileId)
    }

    const agg = await prisma.xpEvent.aggregate({
      where: { profileId },
      _sum: { amount: true }
    })
    return computeLevelFromXp(agg._sum.amount ?? 0)
  },

  async listEventsForActive(limit = 50): Promise<XpEventDto[]> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return []
    const rows = await prisma.xpEvent.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    return rows.map(toDto)
  },

  /**
   * Distribución del XP del perfil activo por fuente. Devuelve siempre una
   * fila por cada XpSource conocida (con count=0 / xp=0 si no hubo eventos),
   * para que la UI pueda renderizar la lista completa con el "tarifario"
   * incluso para el usuario nuevo. Ordenado por XP descendente, después
   * por orden canónico de ALL_SOURCES.
   */
  async getBreakdownForActive(): Promise<XpBreakdownDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) {
      return {
        totalXp: 0,
        entries: ALL_SOURCES.map((source) => ({
          source,
          count: 0,
          xp: 0,
          rewardPerEvent: XP_REWARDS[source]
        }))
      }
    }

    // Mismo backfill lazy que getStateForActive: si el perfil nunca registró
    // eventos pero tiene historia, generamos el XP retroactivo antes de
    // agrupar.
    const existingCount = await prisma.xpEvent.count({ where: { profileId } })
    if (existingCount === 0) {
      await backfillForProfile(profileId)
    }

    const grouped = await prisma.xpEvent.groupBy({
      by: ['source'],
      where: { profileId },
      _sum: { amount: true },
      _count: { _all: true }
    })
    const bySource = new Map<XpSource, { count: number; xp: number }>()
    for (const g of grouped) {
      bySource.set(g.source as XpSource, {
        count: g._count._all,
        xp: g._sum.amount ?? 0
      })
    }

    const entries = ALL_SOURCES.map((source) => {
      const agg = bySource.get(source) ?? { count: 0, xp: 0 }
      return {
        source,
        count: agg.count,
        xp: agg.xp,
        rewardPerEvent: XP_REWARDS[source]
      }
    }).sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp
      return ALL_SOURCES.indexOf(a.source) - ALL_SOURCES.indexOf(b.source)
    })

    const totalXp = entries.reduce((acc, e) => acc + e.xp, 0)
    return { totalXp, entries }
  }
}
