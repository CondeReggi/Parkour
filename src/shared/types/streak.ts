/**
 * Rachas inteligentes — DTOs JSON-friendly.
 *
 * "Inteligente" en dos sentidos:
 *  - Una recuperación activa NO rompe la racha.
 *  - Un día sin actividad después de una sesión con dolor/fatiga alta se
 *    considera "descanso justificado": tampoco la rompe (hasta cierto
 *    margen). La app preferimos sugerir descanso antes que forzar.
 */

export type DayType =
  | 'training'
  | 'active_recovery'
  | 'justified_rest'
  | 'rest'
  | 'idle' // hoy todavía no hay actividad y aún no es rest

export type ActivityType = 'active_recovery'

export interface DailyActivityDto {
  id: string
  /** "YYYY-MM-DD" en hora local. */
  date: string
  type: ActivityType
  notes: string | null
  createdAt: string
}

export interface TodayStatusDto {
  /** "YYYY-MM-DD" en hora local. */
  date: string
  type: DayType
  /**
   * Si el tipo es 'justified_rest', `painPeak` / `fatiguePeak` describen
   * por qué el descanso está justificado (la última sesión cargada).
   */
  justifiedReason?: {
    painAfter: number | null
    fatigueAfter: number | null
  }
}

export interface RecommendationDto {
  /** Mensaje en español rioplatense estilo coach. */
  text: string
  /** Si la UI debe ofrecer un botón para marcar recuperación activa. */
  suggestActiveRecovery: boolean
}

export interface StreakStateDto {
  currentStreak: number
  bestStreak: number
  /** "YYYY-MM-DD" del último día con actividad (training o recovery), o null. */
  lastActiveDate: string | null
  today: TodayStatusDto
  /** Días activos en la semana actual (lunes a domingo). */
  weeklyActiveDays: number
  recommendation: RecommendationDto
}
