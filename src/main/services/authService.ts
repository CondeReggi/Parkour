/**
 * Servicio de autenticación. Coordina los repos de UserAccount, AuthSession
 * y AppSettings. Encapsula:
 *  - Registro local (email + password).
 *  - Login local.
 *  - Logout / continuar sin cuenta.
 *  - Resolución del estado de auth actual (mode local | authenticated).
 *  - Vinculación del perfil activo a la cuenta.
 *
 * El servicio de Google (googleAuthService.ts) usa este servicio para
 * cerrar el flow (crear AuthSession + setear current).
 *
 * Sin lógica de UI. Sin Electron primitives — sólo Prisma, repos y bcrypt.
 */

import bcrypt from 'bcryptjs'
import { userAccountRepository } from '../repositories/userAccount.repository'
import { authSessionRepository } from '../repositories/authSession.repository'
import { settingsRepository } from '../repositories/settings.repository'
import type {
  AuthAccountDto,
  AuthStateDto,
  SignInResultDto
} from '@shared/types/auth'
import type {
  LoginInput,
  RegisterInput
} from '@shared/schemas/auth.schemas'

const BCRYPT_ROUNDS = 10

const localState = (sessionExpired = false): AuthStateDto => ({
  mode: 'local',
  account: null,
  sessionId: null,
  sessionExpiresAt: null,
  sessionExpired
})

const authenticatedState = (
  account: AuthAccountDto,
  sessionId: string,
  sessionExpiresAt: Date | null
): AuthStateDto => ({
  mode: 'authenticated',
  account,
  sessionId,
  sessionExpiresAt: sessionExpiresAt ? sessionExpiresAt.toISOString() : null,
  sessionExpired: false
})

/**
 * Crea una sesión nueva para la cuenta, la marca como sesión activa
 * en AppSettings, y vincula el perfil activo a la cuenta si todavía
 * no estaba vinculado.
 */
async function startSessionFor(
  accountId: string
): Promise<{ sessionId: string; account: AuthAccountDto }> {
  const profileId = await settingsRepository.getActiveProfileId()
  // Vinculamos profile → account si corresponde.
  const account = await userAccountRepository.touchLogin(accountId, profileId)

  const session = await authSessionRepository.create(accountId)
  await settingsRepository.setCurrentAuthSessionId(session.id)
  return { sessionId: session.id, account }
}

export const authService = {
  // =========================================================
  // Estado actual
  // =========================================================

  async getState(): Promise<AuthStateDto> {
    const sessionId = await settingsRepository.getCurrentAuthSessionId()
    if (!sessionId) return localState()

    const session = await authSessionRepository.findById(sessionId)
    if (!authSessionRepository.isLive(session)) {
      // Sesión revocada o expirada: limpiamos el puntero y avisamos.
      await settingsRepository.setCurrentAuthSessionId(null)
      return localState(true)
    }

    const account = await userAccountRepository.findById(session!.userAccountId)
    if (!account) {
      // Caso raro: la cuenta fue borrada pero la sesión quedó colgada.
      await settingsRepository.setCurrentAuthSessionId(null)
      return localState(true)
    }
    return authenticatedState(account, session!.id, session!.expiresAt)
  },

  // =========================================================
  // Register / login / logout local
  // =========================================================

  /**
   * Registra una cuenta nueva con email/password.
   * Devuelve { account: null, errorMessage } si el email ya existe;
   * tira error para casos inesperados.
   */
  async register(input: RegisterInput): Promise<SignInResultDto> {
    const existing = await userAccountRepository.findPasswordAccountByEmail(
      input.email
    )
    if (existing) {
      return {
        account: null,
        errorMessage:
          'Ya hay una cuenta registrada con ese email. Probá iniciar sesión.'
      }
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    const profileId = await settingsRepository.getActiveProfileId()

    const account = await userAccountRepository.createPasswordAccount(
      {
        email: input.email,
        displayName: input.displayName,
        passwordHash
      },
      profileId
    )

    const session = await authSessionRepository.create(account.id)
    await settingsRepository.setCurrentAuthSessionId(session.id)
    return { account }
  },

  async login(input: LoginInput): Promise<SignInResultDto> {
    const account = await userAccountRepository.findPasswordAccountByEmail(
      input.email
    )
    if (!account || !account.passwordHash) {
      // No filtramos qué falló (cuenta o pass) — defensa contra
      // enumeration. El usuario sólo ve un error genérico.
      return {
        account: null,
        errorMessage: 'Email o contraseña inválidos.'
      }
    }

    const ok = await bcrypt.compare(input.password, account.passwordHash)
    if (!ok) {
      return {
        account: null,
        errorMessage: 'Email o contraseña inválidos.'
      }
    }

    const started = await startSessionFor(account.id)
    return { account: started.account }
  },

  async logout(): Promise<void> {
    const sessionId = await settingsRepository.getCurrentAuthSessionId()
    if (sessionId) {
      try {
        await authSessionRepository.revoke(sessionId)
      } catch {
        // Si la sesión ya no existía, no es un error fatal.
      }
    }
    await settingsRepository.setCurrentAuthSessionId(null)
  },

  /**
   * Variante semántica del logout: "decidí seguir sin cuenta". Es lo
   * mismo a nivel datos — limpiar la sesión — pero el nombre deja
   * claro el caso de uso (botón "Continuar sin cuenta" en /login).
   */
  async continueLocal(): Promise<void> {
    await this.logout()
  },

  // =========================================================
  // Vinculación explícita perfil ↔ cuenta
  // =========================================================

  async linkCurrentProfile(): Promise<AuthAccountDto | null> {
    const state = await this.getState()
    if (state.mode !== 'authenticated' || !state.account) return null
    const profileId = await settingsRepository.getActiveProfileId()
    if (!profileId) return state.account
    return userAccountRepository.linkProfile(state.account.id, profileId)
  },

  // =========================================================
  // API interna para googleAuthService
  // =========================================================

  /**
   * Llamado por googleAuthService.signIn después de upsertear la cuenta.
   * Crea la AuthSession y la setea como activa.
   */
  async startSessionForAccountId(
    accountId: string
  ): Promise<{ sessionId: string; account: AuthAccountDto }> {
    return startSessionFor(accountId)
  }
}
