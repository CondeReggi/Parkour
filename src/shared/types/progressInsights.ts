/**
 * DTOs del feature "Insights de Progreso". Pensados para alimentar la
 * pantalla /progress: combinan stats agregadas con texto interpretativo
 * generado en el main por una función pura.
 *
 * Todo es JSON-friendly: fechas como ISO strings, enums como literales.
 */

import type { MovementCategory } from './movement'

/** Tono visual del insight para que el renderer lo pinte sin lógica extra. */
export type InsightTone = 'positive' | 'neutral' | 'warning'

/**
 * Categorías de insight. Coinciden con los pedidos del producto:
 * mejoras, estancamiento, refuerzo, fatiga, constancia, cerca de dominar
 * y la "categoría más trabajada" (focus_category) como caso aparte para
 * que la UI pueda destacarla.
 */
export type InsightKind =
  | 'improving'
  | 'stagnant'
  | 'reinforce'
  | 'fatigue'
  | 'consistency'
  | 'close_to_master'
  | 'focus_category'

export interface InsightDto {
  kind: InsightKind
  title: string
  detail: string
  tone: InsightTone
}

/**
 * Foto de una semana. lastWeek puede ser idéntica en shape pero distinta
 * en ventana de cálculo (lunes a domingo). Si el usuario nunca entrenó
 * en la semana evaluada, todos los contadores vienen en 0.
 */
export interface WeeklySummaryDto {
  /** Lunes 00:00 local de la semana, como ISO string. */
  weekStart: string
  /** Domingo 23:59:59.999 local, como ISO string. */
  weekEnd: string
  sessionsCount: number
  /** Días únicos con al menos una sesión finalizada dentro de la ventana. */
  trainingDays: number
  totalDurationMin: number
  xpEarned: number
  /** Movimientos distintos practicados (vía WorkoutMovement de las sesiones de la semana). */
  movementsPracticed: number
  /** Movimientos dominados (XpEvent 'movement_mastered' dentro de la ventana). */
  movementsMastered: number
  /** Videos revisados (XpEvent 'video_reviewed' dentro de la ventana). */
  videosReviewed: number
  /** Promedio de painAfter en sesiones finalizadas; null si no hay datos. */
  avgPain: number | null
  /** Promedio de fatigueAfter; null si no hay datos. */
  avgFatigue: number | null
  /** Categoría más trabajada de la semana o null si no hay sesiones. */
  topCategory: TopCategoryDto | null
  /** Logros desbloqueados dentro de la ventana. */
  achievementsUnlocked: number
}

export interface TopCategoryDto {
  category: MovementCategory
  /** Cantidad de menciones (WorkoutMovement) de movimientos de esa categoría en la ventana. */
  mentions: number
}

export interface CategoryBreakdownEntry {
  category: MovementCategory
  mentions: number
}

/**
 * Comparación pareada con la semana anterior. delta = current - previous.
 * Para campos que pueden ser null (avgPain/avgFatigue), la comparación
 * también puede ser null si falta dato de cualquiera de los dos lados.
 */
export interface WeekComparisonDto {
  sessions: NumericComparison
  trainingDays: NumericComparison
  xpEarned: NumericComparison
  movementsPracticed: NumericComparison
  videosReviewed: NumericComparison
  avgPain: NullableNumericComparison
  avgFatigue: NullableNumericComparison
}

export interface NumericComparison {
  current: number
  previous: number
  delta: number
}

export interface NullableNumericComparison {
  current: number | null
  previous: number | null
  delta: number | null
}

export interface CloseToMasterMovementDto {
  movementId: string
  movementSlug: string
  movementName: string
  category: MovementCategory
  difficulty: number
  /** Veces que apareció en sesiones finalizadas en las últimas 4 semanas. */
  recentSessionAppearances: number
  /** Cuándo se practicó por última vez (max entre lastPracticedAt y WorkoutMovement.createdAt). */
  lastPracticedAt: string | null
}

export interface OverallStatsDto {
  level: number
  totalXp: number
  totalSessions: number
  daysTrained: number
  masteredMovements: number
  practicingMovements: number
  currentStreak: number
  bestStreak: number
  videosReviewed: number
  achievementsUnlocked: number
  achievementsTotal: number
}

export interface ProgressInsightsDto {
  /** false si no hay perfil activo. La UI muestra el empty state. */
  hasActiveProfile: boolean
  /** false si hay perfil pero todavía no hay ninguna sesión finalizada. */
  hasAnyData: boolean
  overall: OverallStatsDto
  thisWeek: WeeklySummaryDto
  /**
   * Semana anterior. Si no hay sesiones registradas en esa ventana ni en
   * ninguna previa al inicio de la semana actual, viene null.
   */
  lastWeek: WeeklySummaryDto | null
  /** null cuando lastWeek es null (no hay con qué comparar). */
  comparison: WeekComparisonDto | null
  /** Distribución por categoría de la semana actual, ordenada desc por mentions. */
  categoryBreakdown: CategoryBreakdownEntry[]
  /** Top movimientos en práctica con mayor probabilidad de dominio próximo. */
  closeToMaster: CloseToMasterMovementDto[]
  /** Mensajes interpretativos listos para pintar (orden = orden de aparición). */
  insights: InsightDto[]
}
