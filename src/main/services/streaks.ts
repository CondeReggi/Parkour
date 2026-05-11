/**
 * Rachas inteligentes. Función pura: recibe los eventos diarios del
 * perfil y devuelve el estado completo (racha actual, mejor histórico,
 * tipo de hoy, días activos esta semana, recomendación tipo coach).
 *
 * Reglas:
 *  - Un día con sesión finalizada = training (cuenta).
 *  - Un día con recuperación activa = active_recovery (cuenta).
 *  - Un día sin nada se considera 'justified_rest' si la última sesión
 *    finalizada anterior tuvo painAfter >= 7 o fatigueAfter >= 7 y el
 *    gap entre ese pico y el día evaluado es ≤ 2 días.
 *  - Caso contrario, es 'rest' y rompe la racha.
 *  - Tolerancia: la racha actual sobrevive si HOY no hay actividad PERO
 *    AYER sí (mismo criterio que la racha simple existente). El día sin
 *    actividad de hoy todavía no se considera rest definitivo.
 *  - La mejor racha histórica cuenta días consecutivos con tipo
 *    training / active_recovery / justified_rest.
 */

import type {
  DayType,
  RecommendationDto,
  StreakStateDto,
  TodayStatusDto
} from '@shared/types/streak'

export interface SessionEvent {
  /** ISO de cuando terminó la sesión. */
  endedAt: Date
  painAfter: number | null
  fatigueAfter: number | null
}

export interface RecoveryEvent {
  /** Fecha del día (cualquier hora). */
  date: Date
}

const HIGH_PAIN_THRESHOLD = 7
const HIGH_FATIGUE_THRESHOLD = 7
const JUSTIFIED_REST_WINDOW_DAYS = 2

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function dayKey(d: Date): string {
  const c = startOfDay(d)
  const y = c.getFullYear()
  const m = String(c.getMonth() + 1).padStart(2, '0')
  const day = String(c.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.round(
    (startOfDay(later).getTime() - startOfDay(earlier).getTime()) / 86400000
  )
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d)
  const dayIdx = (c.getDay() + 6) % 7 // lunes = 0
  c.setDate(c.getDate() - dayIdx)
  return c
}

interface DayBucket {
  hasSession: boolean
  hasRecovery: boolean
  /** Pico de dolor/fatiga del día (si hubo sesión, vale el máximo). */
  maxPain: number
  maxFatigue: number
}

function emptyBucket(): DayBucket {
  return { hasSession: false, hasRecovery: false, maxPain: 0, maxFatigue: 0 }
}

function buildBucketMap(
  sessions: SessionEvent[],
  recoveries: RecoveryEvent[]
): Map<string, DayBucket> {
  const map = new Map<string, DayBucket>()
  for (const s of sessions) {
    const k = dayKey(s.endedAt)
    const b = map.get(k) ?? emptyBucket()
    b.hasSession = true
    if (s.painAfter !== null && s.painAfter > b.maxPain) b.maxPain = s.painAfter
    if (s.fatigueAfter !== null && s.fatigueAfter > b.maxFatigue) {
      b.maxFatigue = s.fatigueAfter
    }
    map.set(k, b)
  }
  for (const r of recoveries) {
    const k = dayKey(r.date)
    const b = map.get(k) ?? emptyBucket()
    b.hasRecovery = true
    map.set(k, b)
  }
  return map
}

/**
 * Encuentra la última sesión finalizada en o antes de `before` y devuelve
 * si tuvo dolor o fatiga alta. Necesario para decidir si los días sin
 * actividad cuentan como justified_rest.
 */
function lastSessionHadHighStrain(
  sessions: SessionEvent[],
  before: Date
): { hadHigh: boolean; endedAt: Date | null; painAfter: number | null; fatigueAfter: number | null } {
  let best: SessionEvent | null = null
  for (const s of sessions) {
    if (s.endedAt.getTime() > before.getTime()) continue
    if (!best || s.endedAt.getTime() > best.endedAt.getTime()) best = s
  }
  if (!best) {
    return { hadHigh: false, endedAt: null, painAfter: null, fatigueAfter: null }
  }
  const hadHigh =
    (best.painAfter !== null && best.painAfter >= HIGH_PAIN_THRESHOLD) ||
    (best.fatigueAfter !== null && best.fatigueAfter >= HIGH_FATIGUE_THRESHOLD)
  return {
    hadHigh,
    endedAt: best.endedAt,
    painAfter: best.painAfter,
    fatigueAfter: best.fatigueAfter
  }
}

/** Tipo de un día puntual. No considera "idle" — para eso usa todayType. */
function classifyDay(
  date: Date,
  buckets: Map<string, DayBucket>,
  sessions: SessionEvent[]
): DayType {
  const b = buckets.get(dayKey(date))
  if (b?.hasSession) return 'training'
  if (b?.hasRecovery) return 'active_recovery'
  const last = lastSessionHadHighStrain(sessions, date)
  if (last.hadHigh && last.endedAt) {
    const gap = daysBetween(date, last.endedAt)
    if (gap >= 1 && gap <= JUSTIFIED_REST_WINDOW_DAYS) return 'justified_rest'
  }
  return 'rest'
}

/**
 * Racha actual: mira hoy y ayer con tolerancia.
 *  - Si hoy es activo (training/recovery), arranca contando desde hoy.
 *  - Si hoy no hay nada y ayer fue activo, arranca contando desde ayer
 *    (el día de hoy todavía no cuenta como rest definitivo).
 *  - Else, racha = 0.
 *  - Después retrocede mientras el día sea training/recovery/justified_rest.
 */
function computeCurrentStreak(
  buckets: Map<string, DayBucket>,
  sessions: SessionEvent[],
  now: Date
): number {
  if (buckets.size === 0) return 0
  const today = startOfDay(now)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayType = classifyDay(today, buckets, sessions)
  const yesterdayType = classifyDay(yesterday, buckets, sessions)

  let cursor: Date
  if (todayType === 'training' || todayType === 'active_recovery') {
    cursor = today
  } else if (
    yesterdayType === 'training' ||
    yesterdayType === 'active_recovery'
  ) {
    cursor = yesterday
  } else {
    return 0
  }

  let streak = 0
  while (true) {
    const t = classifyDay(cursor, buckets, sessions)
    if (t === 'rest' || t === 'idle') break
    streak++
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/**
 * Mejor racha histórica: la cadena más larga de días consecutivos cuyo
 * tipo NO sea 'rest'. Recorre desde el primer día con bucket hasta hoy.
 */
function computeBestStreak(
  buckets: Map<string, DayBucket>,
  sessions: SessionEvent[],
  now: Date
): number {
  if (buckets.size === 0) return 0
  // Día más antiguo con bucket.
  let earliest: Date | null = null
  for (const key of buckets.keys()) {
    // dayKey: "YYYY-MM-DD"
    const parts = key.split('-').map(Number)
    if (parts.length !== 3) continue
    const [y, m, d] = parts as [number, number, number]
    const dt = new Date(y, m - 1, d)
    if (!earliest || dt.getTime() < earliest.getTime()) earliest = dt
  }
  if (!earliest) return 0
  const today = startOfDay(now)

  let best = 0
  let run = 0
  const cursor = new Date(earliest)
  while (cursor.getTime() <= today.getTime()) {
    const t = classifyDay(cursor, buckets, sessions)
    if (t === 'rest') {
      run = 0
    } else {
      run++
      if (run > best) best = run
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return best
}

function computeWeeklyActiveDays(
  buckets: Map<string, DayBucket>,
  now: Date
): number {
  const start = startOfWeek(now)
  const end = startOfDay(now)
  let count = 0
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    const b = buckets.get(dayKey(cursor))
    if (b?.hasSession || b?.hasRecovery) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

function pickTodayStatus(
  buckets: Map<string, DayBucket>,
  sessions: SessionEvent[],
  now: Date
): TodayStatusDto {
  const today = startOfDay(now)
  const key = dayKey(today)
  const b = buckets.get(key)
  if (b?.hasSession) {
    return { date: key, type: 'training' }
  }
  if (b?.hasRecovery) {
    return { date: key, type: 'active_recovery' }
  }
  const last = lastSessionHadHighStrain(sessions, today)
  if (last.hadHigh && last.endedAt) {
    const gap = daysBetween(today, last.endedAt)
    if (gap >= 1 && gap <= JUSTIFIED_REST_WINDOW_DAYS) {
      return {
        date: key,
        type: 'justified_rest',
        justifiedReason: {
          painAfter: last.painAfter,
          fatigueAfter: last.fatigueAfter
        }
      }
    }
  }
  return { date: key, type: 'idle' }
}

function pickRecommendation(
  sessions: SessionEvent[],
  buckets: Map<string, DayBucket>,
  currentStreak: number,
  today: TodayStatusDto,
  now: Date
): RecommendationDto {
  if (sessions.length === 0 && buckets.size === 0) {
    return {
      text: 'Arrancá con una sesión cortita hoy. Lo importante es empezar y volver mañana.',
      suggestActiveRecovery: false
    }
  }

  if (today.type === 'training') {
    return {
      text: 'Hoy ya hiciste lo tuyo. Cerrá bien la sesión y cuidá la recuperación.',
      suggestActiveRecovery: false
    }
  }

  if (today.type === 'active_recovery') {
    return {
      text: 'Buena. Hoy le diste lugar al cuerpo y la racha sigue viva.',
      suggestActiveRecovery: false
    }
  }

  if (today.type === 'justified_rest') {
    return {
      text: 'Vienen de cargar duro. Hoy es buen día para parar o hacer algo bien liviano. Si te animás a una recuperación activa, marcala y sumás a la racha.',
      suggestActiveRecovery: true
    }
  }

  // today.type === 'idle'
  const last = lastSessionHadHighStrain(sessions, startOfDay(now))
  if (last.hadHigh) {
    return {
      text: 'La última sesión te dejó cargado. Hoy probá una recuperación activa: caminata, movilidad o estiramiento. Mantenés la racha sin forzar.',
      suggestActiveRecovery: true
    }
  }

  // Contar días consecutivos de training puro (sin recovery) terminando ayer.
  const yesterday = new Date(startOfDay(now))
  yesterday.setDate(yesterday.getDate() - 1)
  let trainOnlyRun = 0
  const cursor = new Date(yesterday)
  while (true) {
    const b = buckets.get(dayKey(cursor))
    if (b?.hasSession && !b.hasRecovery) {
      trainOnlyRun++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  if (trainOnlyRun >= 3) {
    return {
      text: `Llevás ${trainOnlyRun} días seguidos de entrenamiento. Si arrastrás cansancio, una recuperación activa hoy también suma. No tenés que entrenar fuerte todos los días.`,
      suggestActiveRecovery: true
    }
  }

  if (currentStreak >= 1) {
    return {
      text: 'Hoy es buen día para mover. Aunque sea una recuperación activa, no la dejes pasar.',
      suggestActiveRecovery: true
    }
  }

  return {
    text: 'Volvamos a sumar. Una sesión cortita hoy y empezás racha nueva.',
    suggestActiveRecovery: false
  }
}

export function computeStreakState(
  sessions: SessionEvent[],
  recoveries: RecoveryEvent[],
  now: Date = new Date()
): StreakStateDto {
  const buckets = buildBucketMap(sessions, recoveries)
  const currentStreak = computeCurrentStreak(buckets, sessions, now)
  const bestStreak = computeBestStreak(buckets, sessions, now)

  // Último día activo (training o recovery) — recorro buckets ordenados desc.
  let lastActiveDate: string | null = null
  const keys = Array.from(buckets.keys()).sort()
  for (let i = keys.length - 1; i >= 0; i--) {
    const k = keys[i]!
    const b = buckets.get(k)!
    if (b.hasSession || b.hasRecovery) {
      lastActiveDate = k
      break
    }
  }

  const today = pickTodayStatus(buckets, sessions, now)
  const weeklyActiveDays = computeWeeklyActiveDays(buckets, now)
  const recommendation = pickRecommendation(
    sessions,
    buckets,
    currentStreak,
    today,
    now
  )

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    lastActiveDate,
    today,
    weeklyActiveDays,
    recommendation
  }
}
