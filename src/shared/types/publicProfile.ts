/**
 * DTOs del perfil público.
 *
 * Dos formas distintas:
 *  - `MyPublicProfileDto`: lo que mira/edita el dueño. Incluye todos
 *    los toggles aunque el perfil esté en modo privado.
 *  - `PublicProfileViewDto`: lo que ve otra persona en /u/:username.
 *    Tiene un `visibility` que indica si se puede ver o no.
 *
 * Email JAMÁS aparece acá — la spec lo prohíbe explícitamente.
 */

export interface MyPublicProfileDto {
  accountId: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  coverImageUrl: string | null
  isPublic: boolean
  showLevel: boolean
  showStats: boolean
  showDominatedMovements: boolean
  showSharedSpots: boolean
  /** Snapshot de qué se vería en /u/:username con la config actual. */
  preview: PublicProfileDataDto
  updatedAt: string
}

/**
 * Estadísticas y datos del perfil. Se llenan según los flags
 * showLevel/showStats/showDominatedMovements/showSharedSpots. Si el flag
 * está apagado, el campo correspondiente queda en null/array vacío.
 */
export interface PublicProfileDataDto {
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  coverImageUrl: string | null
  /** Nivel del perfil vinculado (beginner | base | intermediate). */
  level: string | null
  /** XP total (suma de XpEvents del perfil). null si showStats=false. */
  totalXp: number | null
  /** Cantidad de sesiones finalizadas. null si showStats=false. */
  sessionsCount: number | null
  /** Cantidad de movimientos masterizados. null si showStats=false. */
  masteredCount: number | null
  /**
   * Slugs de los movimientos dominados. Vacío si showDominatedMovements=false
   * o si no hay perfil vinculado.
   */
  dominatedMovements: Array<{ slug: string; name: string }>
  /**
   * Spots compartidos por el usuario (visibility='public'). Vacío si
   * showSharedSpots=false.
   */
  sharedSpots: Array<{ id: string; name: string }>
}

/**
 * Resultado de consultar `/u/:username`. Encapsula también el caso
 * "privado" y "no existe" para que la UI no tenga que inferirlos.
 */
export type PublicProfileViewDto =
  | { visibility: 'public'; data: PublicProfileDataDto }
  | { visibility: 'private'; username: string }
  | { visibility: 'not_found'; username: string }

export interface UsernameAvailabilityDto {
  username: string
  available: boolean
  /** Si available=false, una pista corta de por qué. */
  reason?: 'taken' | 'invalid'
}
