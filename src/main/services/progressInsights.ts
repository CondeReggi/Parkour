/**
 * Cálculo puro de los insights de progreso. Recibe datos crudos ya cargados
 * desde la DB y devuelve el DTO listo para el renderer.
 *
 * No depende de Prisma ni Electron. Pensada para testeo unitario directo.
 *
 * Convenciones de fecha:
 *  - "Semana" es lunes 00:00:00 → domingo 23:59:59.999 hora local.
 *  - "Esta semana" se calcula sobre `now` (param). Si now cae en domingo
 *    al límite, la ventana de la semana corre desde el último lunes.
 *  - Todas las comparaciones temporales usan Date.getTime(), sin TZ-magic.
 */

import type {
  CategoryBreakdownEntry,
  CloseToMasterMovementDto,
  InsightDto,
  InsightTone,
  NullableNumericComparison,
  NumericComparison,
  OverallStatsDto,
  ProgressInsightsDto,
  TopCategoryDto,
  WeekComparisonDto,
  WeeklySummaryDto
} from '@shared/types/progressInsights'
import type {
  MovementCategory,
  MovementProgressStatus
} from '@shared/types/movement'

// =========================================================
// Inputs (estructuras planas, no Prisma)
// =========================================================

export interface PureSessionInput {
  id: string
  endedAt: Date | null
  startedAt: Date
  durationMin: number | null
  painAfter: number | null
  fatigueAfter: number | null
  /** WorkoutMovement.movementId[] de esa sesión. */
  movementIds: string[]
}

export interface PureMovementInput {
  id: string
  slug: string
  name: string
  category: MovementCategory
  difficulty: number
}

export interface PureProgressInput {
  movementId: string
  status: MovementProgressStatus
  lastPracticedAt: Date | null
}

export interface PureXpEventInput {
  source: string
  amount: number
  createdAt: Date
}

export interface PureAchievementUnlockInput {
  slug: string
  unlockedAt: Date
}

export interface PureVideoInput {
  reviewStatus: string
  updatedAt: Date
}

export interface InsightsComputeInput {
  now: Date
  hasActiveProfile: boolean
  sessions: PureSessionInput[]
  movements: PureMovementInput[]
  progress: PureProgressInput[]
  xpEvents: PureXpEventInput[]
  achievements: PureAchievementUnlockInput[]
  achievementsCatalogTotal: number
  videos: PureVideoInput[]
  level: number
  totalXp: number
  currentStreak: number
  bestStreak: number
}

// =========================================================
// Helpers
// =========================================================

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

/**
 * Lunes 00:00 local de la semana que contiene a `now`. JS define
 * getDay() como 0=domingo, 1=lunes, ..., 6=sábado. Para que el lunes
 * sea base, calculamos offset = (day + 6) % 7.
 */
function startOfWeekMonday(d: Date): Date {
  const c = startOfDay(d)
  const offset = (c.getDay() + 6) % 7
  c.setDate(c.getDate() - offset)
  return c
}

export interface WeekRange {
  start: Date
  end: Date
}

/** Semana de `now`: lunes 00:00 → domingo 23:59:59.999. */
export function getCurrentWeekRange(now: Date): WeekRange {
  const start = startOfWeekMonday(now)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  end.setMilliseconds(end.getMilliseconds() - 1)
  return { start, end }
}

/** Semana anterior completa. */
export function getPreviousWeekRange(now: Date): WeekRange {
  const cur = getCurrentWeekRange(now)
  const start = new Date(cur.start)
  start.setDate(start.getDate() - 7)
  const end = new Date(cur.end)
  end.setDate(end.getDate() - 7)
  return { start, end }
}

function inRange(d: Date, r: WeekRange): boolean {
  const t = d.getTime()
  return t >= r.start.getTime() && t <= r.end.getTime()
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((a, b) => a + b, 0)
  return Math.round((sum / values.length) * 10) / 10
}

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function categoryLabel(c: MovementCategory): string {
  switch (c) {
    case 'landing':
      return 'aterrizajes'
    case 'vault':
      return 'vaults'
    case 'climb':
      return 'climbs'
    case 'balance':
      return 'balance'
    case 'precision':
      return 'precisión'
    case 'wall':
      return 'pared'
    case 'core':
      return 'core'
  }
}

// =========================================================
// Resumen semanal
// =========================================================

export function computeWeeklySummary(
  range: WeekRange,
  sessions: PureSessionInput[],
  xpEvents: PureXpEventInput[],
  achievements: PureAchievementUnlockInput[],
  movementsById: Map<string, PureMovementInput>
): WeeklySummaryDto {
  const inWeek = sessions.filter(
    (s) => s.endedAt !== null && inRange(s.endedAt, range)
  )

  const dayKeys = new Set<string>()
  let totalDuration = 0
  const painValues: number[] = []
  const fatigueValues: number[] = []
  const practicedSet = new Set<string>()
  const categoryCount = new Map<MovementCategory, number>()

  for (const s of inWeek) {
    if (s.endedAt) dayKeys.add(dayKey(s.endedAt))
    if (s.durationMin !== null) totalDuration += s.durationMin
    if (s.painAfter !== null) painValues.push(s.painAfter)
    if (s.fatigueAfter !== null) fatigueValues.push(s.fatigueAfter)
    for (const mid of s.movementIds) {
      practicedSet.add(mid)
      const m = movementsById.get(mid)
      if (m) {
        categoryCount.set(m.category, (categoryCount.get(m.category) ?? 0) + 1)
      }
    }
  }

  const xpEarned = xpEvents
    .filter((e) => inRange(e.createdAt, range))
    .reduce((acc, e) => acc + e.amount, 0)

  const movementsMastered = xpEvents.filter(
    (e) =>
      e.source === 'movement_mastered' && inRange(e.createdAt, range)
  ).length

  const videosReviewed = xpEvents.filter(
    (e) => e.source === 'video_reviewed' && inRange(e.createdAt, range)
  ).length

  const achievementsUnlocked = achievements.filter((a) =>
    inRange(a.unlockedAt, range)
  ).length

  let topCategory: TopCategoryDto | null = null
  for (const [cat, count] of categoryCount.entries()) {
    if (!topCategory || count > topCategory.mentions) {
      topCategory = { category: cat, mentions: count }
    }
  }

  return {
    weekStart: range.start.toISOString(),
    weekEnd: range.end.toISOString(),
    sessionsCount: inWeek.length,
    trainingDays: dayKeys.size,
    totalDurationMin: totalDuration,
    xpEarned,
    movementsPracticed: practicedSet.size,
    movementsMastered,
    videosReviewed,
    avgPain: average(painValues),
    avgFatigue: average(fatigueValues),
    topCategory,
    achievementsUnlocked
  }
}

export function computeCategoryBreakdown(
  range: WeekRange,
  sessions: PureSessionInput[],
  movementsById: Map<string, PureMovementInput>
): CategoryBreakdownEntry[] {
  const counts = new Map<MovementCategory, number>()
  for (const s of sessions) {
    if (!s.endedAt || !inRange(s.endedAt, range)) continue
    for (const mid of s.movementIds) {
      const m = movementsById.get(mid)
      if (!m) continue
      counts.set(m.category, (counts.get(m.category) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([category, mentions]) => ({ category, mentions }))
    .sort((a, b) => b.mentions - a.mentions)
}

// =========================================================
// Comparación
// =========================================================

function numericComparison(current: number, previous: number): NumericComparison {
  return { current, previous, delta: current - previous }
}

function nullableComparison(
  current: number | null,
  previous: number | null
): NullableNumericComparison {
  const delta =
    current !== null && previous !== null
      ? Math.round((current - previous) * 10) / 10
      : null
  return { current, previous, delta }
}

export function compareWeeks(
  current: WeeklySummaryDto,
  previous: WeeklySummaryDto
): WeekComparisonDto {
  return {
    sessions: numericComparison(current.sessionsCount, previous.sessionsCount),
    trainingDays: numericComparison(current.trainingDays, previous.trainingDays),
    xpEarned: numericComparison(current.xpEarned, previous.xpEarned),
    movementsPracticed: numericComparison(
      current.movementsPracticed,
      previous.movementsPracticed
    ),
    videosReviewed: numericComparison(
      current.videosReviewed,
      previous.videosReviewed
    ),
    avgPain: nullableComparison(current.avgPain, previous.avgPain),
    avgFatigue: nullableComparison(current.avgFatigue, previous.avgFatigue)
  }
}

// =========================================================
// Cerca de dominar
// =========================================================

const RECENT_WINDOW_DAYS = 28
const CLOSE_TO_MASTER_MIN_APPEARANCES = 3
const CLOSE_TO_MASTER_LIMIT = 5

export function pickCloseToMaster(
  now: Date,
  sessions: PureSessionInput[],
  progress: PureProgressInput[],
  movementsById: Map<string, PureMovementInput>
): CloseToMasterMovementDto[] {
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - RECENT_WINDOW_DAYS)

  // Map movementId → {count, lastInSession}
  const appearances = new Map<string, { count: number; last: Date | null }>()
  for (const s of sessions) {
    if (!s.endedAt) continue
    if (s.endedAt.getTime() < windowStart.getTime()) continue
    for (const mid of s.movementIds) {
      const prev = appearances.get(mid)
      if (!prev) {
        appearances.set(mid, { count: 1, last: s.endedAt })
      } else {
        prev.count += 1
        if (!prev.last || s.endedAt.getTime() > prev.last.getTime()) {
          prev.last = s.endedAt
        }
      }
    }
  }

  // Sólo movimientos en estado 'practicing'.
  const candidates: CloseToMasterMovementDto[] = []
  for (const p of progress) {
    if (p.status !== 'practicing') continue
    const m = movementsById.get(p.movementId)
    if (!m) continue
    const app = appearances.get(p.movementId)
    const count = app?.count ?? 0
    // El último practicado es el max entre lastPracticedAt y la última
    // aparición en una sesión.
    let last: Date | null = p.lastPracticedAt
    if (app?.last && (!last || app.last.getTime() > last.getTime())) {
      last = app.last
    }
    candidates.push({
      movementId: p.movementId,
      movementSlug: m.slug,
      movementName: m.name,
      category: m.category,
      difficulty: m.difficulty,
      recentSessionAppearances: count,
      lastPracticedAt: last ? last.toISOString() : null
    })
  }

  return candidates
    .filter((c) => c.recentSessionAppearances >= CLOSE_TO_MASTER_MIN_APPEARANCES)
    .sort((a, b) => {
      if (b.recentSessionAppearances !== a.recentSessionAppearances) {
        return b.recentSessionAppearances - a.recentSessionAppearances
      }
      const at = a.lastPracticedAt ? new Date(a.lastPracticedAt).getTime() : 0
      const bt = b.lastPracticedAt ? new Date(b.lastPracticedAt).getTime() : 0
      return bt - at
    })
    .slice(0, CLOSE_TO_MASTER_LIMIT)
}

// =========================================================
// Insights (copy interpretativo)
// =========================================================

const STAGNANT_DAYS_THRESHOLD = 14
const FATIGUE_AVG_THRESHOLD = 6.5
const PAIN_AVG_THRESHOLD = 5
const CONSISTENCY_WEEKLY_SESSIONS = 3
const CONSISTENCY_STREAK = 3

function pushInsight(
  list: InsightDto[],
  kind: InsightDto['kind'],
  tone: InsightTone,
  title: string,
  detail: string
): void {
  list.push({ kind, tone, title, detail })
}

export function buildInsights(input: {
  now: Date
  thisWeek: WeeklySummaryDto
  lastWeek: WeeklySummaryDto | null
  comparison: WeekComparisonDto | null
  closeToMaster: CloseToMasterMovementDto[]
  progress: PureProgressInput[]
  movementsById: Map<string, PureMovementInput>
  currentStreak: number
}): InsightDto[] {
  const out: InsightDto[] = []

  // 1. Constancia: si hizo >=3 sesiones esta semana o tiene racha >=3.
  if (
    input.thisWeek.sessionsCount >= CONSISTENCY_WEEKLY_SESSIONS ||
    input.currentStreak >= CONSISTENCY_STREAK
  ) {
    const sessions = input.thisWeek.sessionsCount
    const detail =
      input.currentStreak >= CONSISTENCY_STREAK
        ? `Llevás ${input.currentStreak} ${input.currentStreak === 1 ? 'día' : 'días'} al hilo. Estás sosteniendo el hábito.`
        : `Esta semana metiste ${sessions} ${sessions === 1 ? 'sesión' : 'sesiones'}. Buena constancia, así se construye.`
    pushInsight(out, 'consistency', 'positive', 'Buena constancia', detail)
  }

  // 2. Foco de la semana — categoría más trabajada.
  if (input.thisWeek.topCategory) {
    const cat = categoryLabel(input.thisWeek.topCategory.category)
    pushInsight(
      out,
      'focus_category',
      'neutral',
      'Foco de la semana',
      `Esta semana metiste más foco en ${cat}.`
    )
  }

  // 3. Mejora vs semana anterior (sesiones o XP).
  if (input.comparison) {
    const sessionsDelta = input.comparison.sessions.delta
    const xpDelta = input.comparison.xpEarned.delta
    if (sessionsDelta > 0) {
      pushInsight(
        out,
        'improving',
        'positive',
        'Venís mejorando',
        `${sessionsDelta} ${sessionsDelta === 1 ? 'sesión' : 'sesiones'} más que la semana pasada. Vas para adelante.`
      )
    } else if (xpDelta > 50 && sessionsDelta >= 0) {
      pushInsight(
        out,
        'improving',
        'positive',
        'Más XP que la semana pasada',
        `Sumaste ${xpDelta} XP de más respecto a la semana anterior.`
      )
    }
  }

  // 4. Cerca de dominar.
  if (input.closeToMaster.length > 0) {
    const n = input.closeToMaster.length
    const top = input.closeToMaster[0]?.movementName
    const detail =
      n === 1
        ? `Tenés "${top}" muy cerca de dominar. Una sesión enfocada y va.`
        : `Tenés ${n} movimientos cerca de dominar. Si los repetís un par de veces más, los cerrás.`
    pushInsight(
      out,
      'close_to_master',
      'positive',
      'Cerca de dominar',
      detail
    )
  }

  // 5. Señales de fatiga.
  const pain = input.thisWeek.avgPain
  const fatigue = input.thisWeek.avgFatigue
  const rising =
    input.comparison?.avgFatigue.delta !== null &&
    (input.comparison?.avgFatigue.delta ?? 0) >= 1.5
  if (
    (fatigue !== null && fatigue >= FATIGUE_AVG_THRESHOLD) ||
    (pain !== null && pain >= PAIN_AVG_THRESHOLD) ||
    rising
  ) {
    const reasons: string[] = []
    if (fatigue !== null && fatigue >= FATIGUE_AVG_THRESHOLD) {
      reasons.push(`fatiga promedio ${fatigue}`)
    }
    if (pain !== null && pain >= PAIN_AVG_THRESHOLD) {
      reasons.push(`dolor promedio ${pain}`)
    }
    if (rising && reasons.length === 0) reasons.push('fatiga subiendo')
    pushInsight(
      out,
      'fatigue',
      'warning',
      'Señales de fatiga',
      `La fatiga viene subiendo (${reasons.join(' · ')}), conviene bajar un cambio y priorizar movilidad o recuperación activa.`
    )
  }

  // 6. Estancamiento: movimientos en práctica sin actividad reciente.
  const cutoffMs =
    input.now.getTime() - STAGNANT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000
  const stagnant = input.progress.filter((p) => {
    if (p.status !== 'practicing') return false
    if (!p.lastPracticedAt) return false
    return p.lastPracticedAt.getTime() < cutoffMs
  })
  if (stagnant.length > 0) {
    const n = stagnant.length
    const example = stagnant[0]?.movementId
      ? input.movementsById.get(stagnant[0].movementId)?.name
      : null
    pushInsight(
      out,
      'stagnant',
      'warning',
      'Algo estancado',
      n === 1 && example
        ? `Hace más de 2 semanas que no practicás "${example}". Si todavía lo querés dominar, volvé a meterle.`
        : `Tenés ${n} ${n === 1 ? 'movimiento' : 'movimientos'} en práctica que no tocás hace más de 2 semanas.`
    )
  }

  // 7. Refuerzo: sin sesiones esta semana pero sí algunas la pasada.
  if (
    input.thisWeek.sessionsCount === 0 &&
    input.lastWeek &&
    input.lastWeek.sessionsCount > 0
  ) {
    pushInsight(
      out,
      'reinforce',
      'warning',
      'Conviene reforzar',
      'Esta semana todavía no entrenaste. Una sesión cortita ya rompe la inercia.'
    )
  }

  return out
}

// =========================================================
// Entrypoint
// =========================================================

export function computeProgressInsights(
  input: InsightsComputeInput
): ProgressInsightsDto {
  const movementsById = new Map(input.movements.map((m) => [m.id, m]))

  const currentRange = getCurrentWeekRange(input.now)
  const previousRange = getPreviousWeekRange(input.now)

  const thisWeek = computeWeeklySummary(
    currentRange,
    input.sessions,
    input.xpEvents,
    input.achievements,
    movementsById
  )

  // Verificamos si tuvo *alguna* actividad antes de la semana actual para
  // decidir si vale mostrar la comparación.
  const hadActivityBefore = input.sessions.some(
    (s) =>
      s.endedAt !== null &&
      s.endedAt.getTime() < currentRange.start.getTime()
  )

  const lastWeek = hadActivityBefore
    ? computeWeeklySummary(
        previousRange,
        input.sessions,
        input.xpEvents,
        input.achievements,
        movementsById
      )
    : null

  const comparison = lastWeek ? compareWeeks(thisWeek, lastWeek) : null

  const categoryBreakdown = computeCategoryBreakdown(
    currentRange,
    input.sessions,
    movementsById
  )

  const closeToMaster = pickCloseToMaster(
    input.now,
    input.sessions,
    input.progress,
    movementsById
  )

  const finalizedSessionsCount = input.sessions.filter(
    (s) => s.endedAt !== null
  ).length
  const daysTrained = new Set(
    input.sessions
      .filter((s) => s.endedAt !== null)
      .map((s) => dayKey(s.endedAt as Date))
  ).size

  const masteredMovements = input.progress.filter(
    (p) => p.status === 'mastered'
  ).length
  const practicingMovements = input.progress.filter(
    (p) => p.status === 'practicing'
  ).length

  const videosReviewedTotal = input.videos.filter(
    (v) => v.reviewStatus !== 'pending'
  ).length

  const overall: OverallStatsDto = {
    level: input.level,
    totalXp: input.totalXp,
    totalSessions: finalizedSessionsCount,
    daysTrained,
    masteredMovements,
    practicingMovements,
    currentStreak: input.currentStreak,
    bestStreak: input.bestStreak,
    videosReviewed: videosReviewedTotal,
    achievementsUnlocked: input.achievements.length,
    achievementsTotal: input.achievementsCatalogTotal
  }

  const insights = buildInsights({
    now: input.now,
    thisWeek,
    lastWeek,
    comparison,
    closeToMaster,
    progress: input.progress,
    movementsById,
    currentStreak: input.currentStreak
  })

  return {
    hasActiveProfile: input.hasActiveProfile,
    hasAnyData: finalizedSessionsCount > 0,
    overall,
    thisWeek,
    lastWeek,
    comparison,
    categoryBreakdown,
    closeToMaster,
    insights
  }
}
