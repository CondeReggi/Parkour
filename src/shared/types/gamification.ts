/**
 * DTOs del sistema de XP / niveles. Todo JSON-friendly: las fechas viajan
 * como strings ISO; los enums son string literals.
 */

export type XpSource =
  | 'session_finalized'
  | 'movement_practicing'
  | 'movement_mastered'
  | 'video_uploaded'
  | 'video_reviewed'
  | 'spot_registered'
  | 'quest_claimed'
  | 'achievement_unlocked'

/**
 * Recompensa fija por tipo de acción. Vive en el código (no en DB)
 * para que sea visible y modificable junto con la lógica.
 *
 * `quest_claimed` y `achievement_unlocked` quedan en 0 porque la
 * recompensa depende de cada quest/logro. Los repos que escriben esos
 * XpEvent usan el variante `grantForActiveWithAmount` y el XpBreakdown
 * los trata como "varía".
 */
export const XP_REWARDS: Record<XpSource, number> = {
  session_finalized: 50,
  movement_practicing: 10,
  movement_mastered: 30,
  video_uploaded: 5,
  video_reviewed: 10,
  spot_registered: 15,
  quest_claimed: 0,
  achievement_unlocked: 0
}

export interface XpEventDto {
  id: string
  source: XpSource
  sourceRefId: string
  amount: number
  createdAt: string
}

export interface GamificationStateDto {
  totalXp: number
  level: number
  /** XP acumulado DENTRO del nivel actual (totalXp - threshold del nivel actual). */
  currentLevelXp: number
  /** Cuánto XP cuesta el nivel actual completo (threshold(N+1) - threshold(N)). */
  xpForCurrentLevel: number
  /** XP que falta para alcanzar el próximo nivel. */
  xpToNextLevel: number
  /** Threshold absoluto del próximo nivel. */
  nextLevelThreshold: number
  /** 0-100, redondeado hacia abajo. */
  progressPercent: number
}

/** Una fila del breakdown: cuántos eventos y cuánto XP suma una fuente. */
export interface XpBreakdownEntry {
  source: XpSource
  /** Cantidad de eventos de esa fuente. */
  count: number
  /** XP acumulado por esa fuente. */
  xp: number
  /** Recompensa por evento (espejo de XP_REWARDS — útil para el cliente). */
  rewardPerEvent: number
}

export interface XpBreakdownDto {
  totalXp: number
  entries: XpBreakdownEntry[]
}
