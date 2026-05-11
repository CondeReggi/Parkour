/**
 * Stats agregadas a partir de las fechas de finalización de las sesiones.
 *
 * Función pura: recibe Date[] (los endedAt de sesiones finalizadas) y calcula
 * totalSessions, daysTrained, currentStreak y sessionsThisWeek.
 *
 * El streak tiene tolerancia de 1 día: se mantiene activo si entrenaste hoy
 * O ayer; con 2+ días sin entrenar, se rompe.
 */

export interface SessionStatsCore {
  totalSessions: number
  daysTrained: number
  currentStreak: number
  sessionsThisWeek: number
}

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function computeStreak(dayKeys: Set<string>, now: Date = new Date()): number {
  if (dayKeys.size === 0) return 0

  const today = startOfDay(now)
  const yesterday = startOfDay(now)
  yesterday.setDate(yesterday.getDate() - 1)

  let cursor: Date
  if (dayKeys.has(dayKey(today))) {
    cursor = today
  } else if (dayKeys.has(dayKey(yesterday))) {
    cursor = yesterday
  } else {
    return 0
  }

  let streak = 0
  while (dayKeys.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeSessionStats(
  endedAts: Date[],
  now: Date = new Date()
): SessionStatsCore {
  const dayKeys = new Set<string>()
  for (const d of endedAts) dayKeys.add(dayKey(d))

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sessionsThisWeek = endedAts.filter((d) => d >= sevenDaysAgo).length

  return {
    totalSessions: endedAts.length,
    daysTrained: dayKeys.size,
    currentStreak: computeStreak(dayKeys, now),
    sessionsThisWeek
  }
}
