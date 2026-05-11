/**
 * Logros — DTOs JSON-friendly.
 *
 * El catálogo de logros vive en código (main/services/achievements.ts).
 * Sólo persiste en DB el desbloqueo del usuario (AchievementUnlock).
 * Los logros bloqueados se computan al vuelo en cada lectura cruzando
 * el catálogo contra los desbloqueos del perfil activo.
 */

export type AchievementCategory =
  | 'sessions'
  | 'movements'
  | 'videos'
  | 'spots'
  | 'consistency'
  | 'wellness'

export interface AchievementDto {
  slug: string
  title: string
  description: string
  category: AchievementCategory
  /** Si > 0, al desbloquearse otorga ese XP una sola vez. */
  xpReward: number
  unlocked: boolean
  unlockedAt: string | null
  /** XP que se otorgó en el momento del desbloqueo. 0 si todavía bloqueado. */
  xpAwarded: number
}

export interface AchievementsListDto {
  unlocked: AchievementDto[]
  locked: AchievementDto[]
  totalCount: number
  unlockedCount: number
}
