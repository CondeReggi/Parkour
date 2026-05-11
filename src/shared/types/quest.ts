/**
 * Misiones (quests) — DTOs JSON-friendly.
 *
 * El catálogo de misiones vive en código (main/services/quests.ts).
 * En la DB sólo persisten asignaciones (QuestAssignment), con un snapshot
 * de los datos del template al momento de crear la asignación.
 */

export type QuestType = 'daily' | 'weekly'

export type QuestStatus = 'pending' | 'completed' | 'claimed'

/**
 * Identifica qué acción incrementa el progreso de la misión.
 *
 * - sessions_finalized:           +1 por sesión finalizada
 * - movements_practiced:          +1 por movement marcado como practicing
 *                                 (mastered también dispara este)
 * - movements_mastered:           +1 por movement marcado como mastered
 * - videos_uploaded:              +1 por video creado
 * - videos_reviewed:              +1 por video cuya revisión pasó de pending
 * - spots_registered:             +1 por spot creado
 * - sessions_low_pain:            +1 por sesión finalizada con painAfter ≤ 3
 * - recommended_routine_completed +1 por sesión finalizada cuya rutina
 *                                 coincide con la recomendada del momento
 */
export type QuestMetric =
  | 'sessions_finalized'
  | 'movements_practiced'
  | 'movements_mastered'
  | 'videos_uploaded'
  | 'videos_reviewed'
  | 'spots_registered'
  | 'sessions_low_pain'
  | 'recommended_routine_completed'

export interface QuestDto {
  id: string
  templateSlug: string
  title: string
  description: string
  type: QuestType
  metric: QuestMetric
  target: number
  progress: number
  xpReward: number
  status: QuestStatus
  startsAt: string
  expiresAt: string
  completedAt: string | null
  claimedAt: string | null
}

export interface QuestsListDto {
  daily: QuestDto[]
  weekly: QuestDto[]
}

export interface ClaimQuestResultDto {
  quest: QuestDto
  xpAwarded: number
}
