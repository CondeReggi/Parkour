/**
 * Catálogo de logros y evaluador puro.
 *
 * El catálogo es estático y vive en código; en DB sólo guardamos los
 * desbloqueos del usuario. Cada logro tiene `evaluate(ctx)`: una función
 * pura que recibe el snapshot del perfil y devuelve true cuando se cumple
 * la condición.
 *
 * El repositorio (achievement.repository.ts) construye el contexto desde
 * Prisma y orquesta el desbloqueo + recompensa de XP de forma idempotente.
 */

import type { AchievementCategory } from '@shared/types/achievement'

/** Snapshot del estado del perfil necesario para evaluar todos los logros. */
export interface AchievementContext {
  /** ISO timestamps de cuándo terminó cada sesión finalizada. */
  endedAts: Date[]
  /** Sesiones finalizadas con painAfter ≤ 3. */
  lowPainSessionCount: number
  /** Movements con MovementProgress.status='mastered'. */
  masteredMovementCount: number
  /** Cantidad total de VideoEntry. */
  videoCount: number
  /** VideoEntry con reviewStatus ≠ 'pending'. */
  videoReviewedCount: number
  /** Cantidad total de Spot. */
  spotCount: number
  /** Streak actual de días con sesión (tolerancia 1 día). */
  currentStreak: number
}

export interface AchievementTemplate {
  slug: string
  title: string
  description: string
  category: AchievementCategory
  xpReward: number
  evaluate: (ctx: AchievementContext) => boolean
}

/** Devuelve true si alguna semana ISO del histórico tuvo ≥ minSessions. */
function hasActiveWeek(endedAts: Date[], minSessions: number): boolean {
  if (endedAts.length < minSessions) return false
  const buckets = new Map<string, number>()
  for (const d of endedAts) {
    const c = new Date(d)
    c.setHours(0, 0, 0, 0)
    const dayIdx = (c.getDay() + 6) % 7 // lunes = 0
    c.setDate(c.getDate() - dayIdx)
    const key = `${c.getFullYear()}-${c.getMonth()}-${c.getDate()}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  for (const count of buckets.values()) {
    if (count >= minSessions) return true
  }
  return false
}

export const ACHIEVEMENT_CATALOG: AchievementTemplate[] = [
  {
    slug: 'first_session',
    title: 'Primer entrenamiento',
    description: 'Completá tu primera sesión.',
    category: 'sessions',
    xpReward: 25,
    evaluate: (ctx) => ctx.endedAts.length >= 1
  },
  {
    slug: 'five_sessions',
    title: 'Cinco sesiones',
    description: 'Completá cinco sesiones de entrenamiento.',
    category: 'sessions',
    xpReward: 50,
    evaluate: (ctx) => ctx.endedAts.length >= 5
  },
  {
    slug: 'ten_sessions',
    title: 'Diez sesiones',
    description: 'Llegá a diez sesiones completadas.',
    category: 'sessions',
    xpReward: 100,
    evaluate: (ctx) => ctx.endedAts.length >= 10
  },
  {
    slug: 'three_day_streak',
    title: 'Tres días seguidos',
    description: 'Entrená tres días consecutivos sin saltarte ninguno.',
    category: 'consistency',
    xpReward: 75,
    evaluate: (ctx) => ctx.currentStreak >= 3
  },
  {
    slug: 'first_mastered',
    title: 'Primer movimiento dominado',
    description: 'Marcá un movimiento como dominado.',
    category: 'movements',
    xpReward: 30,
    evaluate: (ctx) => ctx.masteredMovementCount >= 1
  },
  {
    slug: 'five_mastered',
    title: 'Cinco movimientos dominados',
    description: 'Dominá cinco movimientos del catálogo.',
    category: 'movements',
    xpReward: 100,
    evaluate: (ctx) => ctx.masteredMovementCount >= 5
  },
  {
    slug: 'first_video',
    title: 'Primer video',
    description: 'Sumá tu primer video a la biblioteca.',
    category: 'videos',
    xpReward: 15,
    evaluate: (ctx) => ctx.videoCount >= 1
  },
  {
    slug: 'five_reviews',
    title: 'Cinco videos revisados',
    description: 'Revisá cinco videos.',
    category: 'videos',
    xpReward: 50,
    evaluate: (ctx) => ctx.videoReviewedCount >= 5
  },
  {
    slug: 'first_spot',
    title: 'Primer spot',
    description: 'Registrá tu primer lugar de entrenamiento.',
    category: 'spots',
    xpReward: 20,
    evaluate: (ctx) => ctx.spotCount >= 1
  },
  {
    slug: 'first_active_week',
    title: 'Semana activa',
    description: 'Sumá tres sesiones dentro de una misma semana.',
    category: 'consistency',
    xpReward: 80,
    evaluate: (ctx) => hasActiveWeek(ctx.endedAts, 3)
  },
  {
    slug: 'low_pain_streak',
    title: 'Entrenamientos sin dolor',
    description: 'Cerrá cinco sesiones con dolor post ≤ 3.',
    category: 'wellness',
    xpReward: 60,
    evaluate: (ctx) => ctx.lowPainSessionCount >= 5
  }
]

export const ALL_ACHIEVEMENT_SLUGS: string[] = ACHIEVEMENT_CATALOG.map(
  (a) => a.slug
)

export function findAchievementTemplate(
  slug: string
): AchievementTemplate | undefined {
  return ACHIEVEMENT_CATALOG.find((a) => a.slug === slug)
}

/**
 * Devuelve los slugs que el contexto satisface AHORA. Función pura: no
 * mira la DB. El repo es quien filtra contra los ya desbloqueados.
 */
export function evaluateAllAchievements(ctx: AchievementContext): string[] {
  return ACHIEVEMENT_CATALOG.filter((a) => a.evaluate(ctx)).map((a) => a.slug)
}
