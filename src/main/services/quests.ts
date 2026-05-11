/**
 * Catálogo de misiones (templates) y cálculo del período activo.
 *
 * Función pura: no toca Prisma ni Electron. El repo es quien materializa
 * las asignaciones contra la DB usando estas definiciones.
 *
 * Períodos (hora local):
 *  - daily : 00:00:00.000 → 23:59:59.999 del mismo día
 *  - weekly: lunes 00:00:00.000 → domingo 23:59:59.999
 */

import type { QuestMetric, QuestType } from '@shared/types/quest'

export interface QuestTemplate {
  slug: string
  title: string
  description: string
  type: QuestType
  metric: QuestMetric
  target: number
  xpReward: number
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  // ---- diarias ----
  {
    slug: 'daily_finalize_session',
    title: 'Completá una sesión',
    description: 'Arrancá y finalizá un entrenamiento hoy.',
    type: 'daily',
    metric: 'sessions_finalized',
    target: 1,
    xpReward: 30
  },
  {
    slug: 'daily_practice_movement',
    title: 'Empezá a practicar un movimiento',
    description: 'Pasá un movimiento del catálogo a "en práctica".',
    type: 'daily',
    metric: 'movements_practiced',
    target: 1,
    xpReward: 15
  },
  {
    slug: 'daily_master_movement',
    title: 'Dominá un movimiento',
    description: 'Marcá un movimiento como dominado.',
    type: 'daily',
    metric: 'movements_mastered',
    target: 1,
    xpReward: 50
  },
  // ---- semanales ----
  {
    slug: 'weekly_upload_videos',
    title: 'Subí dos videos',
    description: 'Sumá al menos dos videos a tu biblioteca esta semana.',
    type: 'weekly',
    metric: 'videos_uploaded',
    target: 2,
    xpReward: 25
  },
  {
    slug: 'weekly_review_videos',
    title: 'Revisá dos videos',
    description: 'Cambiá el estado de revisión de dos videos pendientes.',
    type: 'weekly',
    metric: 'videos_reviewed',
    target: 2,
    xpReward: 30
  },
  {
    slug: 'weekly_register_spot',
    title: 'Registrá un spot',
    description: 'Agregá un nuevo lugar de entrenamiento esta semana.',
    type: 'weekly',
    metric: 'spots_registered',
    target: 1,
    xpReward: 40
  },
  {
    slug: 'weekly_train_without_pain',
    title: 'Entrená sin dolor alto',
    description: 'Cerrá tres sesiones con dolor post ≤ 3 esta semana.',
    type: 'weekly',
    metric: 'sessions_low_pain',
    target: 3,
    xpReward: 50
  },
  {
    slug: 'weekly_recommended_routine',
    title: 'Completá una rutina recomendada',
    description: 'Finalizá una sesión usando la rutina que te sugerimos.',
    type: 'weekly',
    metric: 'recommended_routine_completed',
    target: 1,
    xpReward: 60
  }
]

/** Lista de slugs canónica, en el orden en el que aparecen los templates. */
export const ALL_QUEST_SLUGS: string[] = QUEST_TEMPLATES.map((t) => t.slug)

export function templatesByType(type: QuestType): QuestTemplate[] {
  return QUEST_TEMPLATES.filter((t) => t.type === type)
}

export function findTemplate(slug: string): QuestTemplate | undefined {
  return QUEST_TEMPLATES.find((t) => t.slug === slug)
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function endOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(23, 59, 59, 999)
  return c
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d)
  // getDay = 0 (domingo) … 6 (sábado). Semana arranca lunes.
  const dayIdx = (c.getDay() + 6) % 7
  c.setDate(c.getDate() - dayIdx)
  return c
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export interface QuestPeriod {
  startsAt: Date
  expiresAt: Date
}

export function periodFor(type: QuestType, now: Date = new Date()): QuestPeriod {
  if (type === 'daily') {
    return { startsAt: startOfDay(now), expiresAt: endOfDay(now) }
  }
  return { startsAt: startOfWeek(now), expiresAt: endOfWeek(now) }
}
