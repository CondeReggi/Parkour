/**
 * Repositorio de rachas inteligentes.
 *
 * Construye el estado al vuelo cruzando:
 *  - WorkoutSession finalizada → días "training".
 *  - DailyActivity con type='active_recovery' → días "active_recovery".
 *  - El resto (justified_rest / rest / idle) se computa en el servicio.
 *
 * Marcar recuperación activa es idempotente: el unique
 * (profileId, date, type) del modelo Prisma silencia el doble marcado en
 * el mismo día.
 */

import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import { computeStreakState } from '../services/streaks'
import type { DailyActivityDto, StreakStateDto } from '@shared/types/streak'
import type { MarkActiveRecoveryInput } from '@shared/schemas/streak.schemas'

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parsea "YYYY-MM-DD" como medianoche LOCAL del cliente/servidor. */
function parseDateOrToday(input: string | undefined): Date {
  if (!input) {
    const c = new Date()
    c.setHours(0, 0, 0, 0)
    return c
  }
  const [yStr, mStr, dStr] = input.split('-')
  return new Date(Number(yStr), Number(mStr) - 1, Number(dStr), 0, 0, 0, 0)
}

function rowToDto(row: {
  id: string
  date: Date
  type: string
  notes: string | null
  createdAt: Date
}): DailyActivityDto {
  return {
    id: row.id,
    date: dayKey(row.date),
    type: row.type as DailyActivityDto['type'],
    notes: row.notes,
    createdAt: row.createdAt.toISOString()
  }
}

export const streakRepository = {
  async getStateForActive(): Promise<StreakStateDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) {
      return computeStreakState([], [])
    }

    const [sessions, recoveries] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { profileId, endedAt: { not: null } },
        select: { endedAt: true, painAfter: true, fatigueAfter: true }
      }),
      prisma.dailyActivity.findMany({
        where: { profileId, type: 'active_recovery' },
        select: { date: true }
      })
    ])

    const sessionEvents = sessions
      .filter(
        (s): s is { endedAt: Date; painAfter: number | null; fatigueAfter: number | null } =>
          s.endedAt !== null
      )
      .map((s) => ({
        endedAt: s.endedAt,
        painAfter: s.painAfter,
        fatigueAfter: s.fatigueAfter
      }))

    const recoveryEvents = recoveries.map((r) => ({ date: r.date }))

    return computeStreakState(sessionEvents, recoveryEvents)
  },

  async markActiveRecoveryForActive(
    input: MarkActiveRecoveryInput
  ): Promise<DailyActivityDto> {
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) {
      throw new Error('No hay un perfil activo.')
    }
    const date = parseDateOrToday(input.date)
    const notes = input.notes ?? null

    // Upsert por (profileId, date, type='active_recovery'). Si ya existía,
    // dejamos las notas viejas — la acción es "marcar el día", no editar.
    const existing = await prisma.dailyActivity.findUnique({
      where: {
        profileId_date_type: {
          profileId,
          date,
          type: 'active_recovery'
        }
      }
    })
    if (existing) return rowToDto(existing)

    const created = await prisma.dailyActivity.create({
      data: { profileId, date, type: 'active_recovery', notes }
    })
    return rowToDto(created)
  }
}
