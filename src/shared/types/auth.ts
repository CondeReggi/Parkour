/**
 * DTOs de autenticación. Lo que el main expone al renderer.
 *
 * IMPORTANTE: nunca incluir tokens (accessToken/refreshToken/idToken) ni
 * passwordHash en estos DTOs. Quedan en la DB y sólo los usa el proceso
 * main para renovar sesión o validar contraseñas.
 */

export type AuthProvider = 'google' | 'password'

/**
 * Modo actual de la app:
 *  - 'authenticated': hay sesión activa, `account` viene poblado.
 *  - 'local': no hay sesión. La app funciona offline, datos solo en
 *    este dispositivo.
 */
export type AuthMode = 'authenticated' | 'local'

export interface AuthAccountDto {
  /** Id local de la cuenta (cuid). Distinto del `sub` del provider. */
  id: string
  provider: AuthProvider
  /** Identificador del usuario en el provider (`sub` o email lowercase). */
  providerUserId: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  /** True si la cuenta tiene contraseña local (provider='password'). */
  hasPassword: boolean
  /**
   * =====  Fase 0: campos reservados para comunidad futura  =====
   * Hoy se exponen pero ninguna UI los setea todavía. Cuando llegue
   * el onboarding de comunidad, se llenan.
   */
  username: string | null
  bio: string | null
  coverImageUrl: string | null
  isPublicProfile: boolean
  /** ISO. Último login exitoso. */
  lastLoginAt: string
  createdAt: string
  updatedAt: string
}

/** Estado consolidado que consume el renderer en cada query. */
export interface AuthStateDto {
  mode: AuthMode
  account: AuthAccountDto | null
  sessionId: string | null
  /** ISO. null si la sesión no expira (caso local-first actual). */
  sessionExpiresAt: string | null
  /** True si el último intento de leer la sesión la detectó expirada/revocada. */
  sessionExpired: boolean
}

/**
 * Resultado de operaciones que pueden fallar de forma "limpia"
 * (cancelación, credenciales malas, etc.). Para errores inesperados,
 * el handler IPC lanza y el renderer lo recibe como Error normal.
 */
export interface SignInResultDto {
  account: AuthAccountDto | null
  errorMessage?: string
}
