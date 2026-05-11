/**
 * Repositorio de UserAccount.
 *
 * Soporta dos providers:
 *  - 'google'   → cuenta vinculada por OAuth.
 *  - 'password' → cuenta local con email + bcrypt hash.
 *
 * Sólo el proceso main toca este repo. El renderer recibe DTOs sin
 * tokens ni passwordHash.
 *
 * Idempotencia: el upsert de Google usa la unique (provider, providerUserId).
 * Para password, `providerUserId` se setea al email lowercase, así no
 * se puede registrar dos veces el mismo mail.
 */

import { prisma } from '../db/client'
import type { AuthAccountDto, AuthProvider } from '@shared/types/auth'

interface UserAccountRow {
  id: string
  provider: string
  providerUserId: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  passwordHash: string | null
  profileId: string | null
  // Campos reservados Fase 0 — comunidad futura
  username: string | null
  bio: string | null
  coverImageUrl: string | null
  isPublicProfile: boolean
  lastLoginAt: Date
  createdAt: Date
  updatedAt: Date
}

/** Input al upsert de Google después del token exchange. */
export interface UpsertGoogleAccountInput {
  providerUserId: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  expiresAt: Date | null
}

/** Input al crear una cuenta password (registro). */
export interface CreatePasswordAccountInput {
  email: string // ya lowercase + trim
  displayName: string
  passwordHash: string
}

function toDto(row: UserAccountRow): AuthAccountDto {
  return {
    id: row.id,
    provider: row.provider as AuthProvider,
    providerUserId: row.providerUserId,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    hasPassword: row.passwordHash !== null,
    username: row.username,
    bio: row.bio,
    coverImageUrl: row.coverImageUrl,
    isPublicProfile: row.isPublicProfile,
    lastLoginAt: row.lastLoginAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export const userAccountRepository = {
  async findById(id: string): Promise<AuthAccountDto | null> {
    const row = await prisma.userAccount.findUnique({ where: { id } })
    return row ? toDto(row) : null
  },

  /**
   * Busca por email + provider='password'. Pensado para el flow de login
   * con contraseña. Si el email tiene una cuenta Google asociada pero no
   * password, devuelve null (no se puede loguear con contraseña).
   */
  async findPasswordAccountByEmail(
    email: string
  ): Promise<(AuthAccountDto & { passwordHash: string | null }) | null> {
    const row = await prisma.userAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'password',
          providerUserId: email.toLowerCase()
        }
      }
    })
    if (!row) return null
    return { ...toDto(row), passwordHash: row.passwordHash }
  },

  async createPasswordAccount(
    input: CreatePasswordAccountInput,
    profileIdToLink: string | null
  ): Promise<AuthAccountDto> {
    const created = await prisma.userAccount.create({
      data: {
        provider: 'password',
        providerUserId: input.email,
        email: input.email,
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        profileId: profileIdToLink
      }
    })
    return toDto(created)
  },

  async upsertGoogleAccount(
    input: UpsertGoogleAccountInput,
    profileIdToLink: string | null
  ): Promise<AuthAccountDto> {
    const now = new Date()
    const upserted = await prisma.userAccount.upsert({
      where: {
        provider_providerUserId: {
          provider: 'google',
          providerUserId: input.providerUserId
        }
      },
      create: {
        provider: 'google',
        providerUserId: input.providerUserId,
        email: input.email,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        idToken: input.idToken,
        expiresAt: input.expiresAt,
        profileId: profileIdToLink,
        lastLoginAt: now
      },
      update: {
        email: input.email,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        accessToken: input.accessToken,
        // Google sólo manda refresh_token en el primer consent. Si vino,
        // guardamos; si no, dejamos el que ya teníamos.
        ...(input.refreshToken !== null && { refreshToken: input.refreshToken }),
        idToken: input.idToken,
        expiresAt: input.expiresAt,
        // Auto-link al perfil activo sólo si la cuenta no estaba ligada.
        ...(profileIdToLink && { profileId: profileIdToLink }),
        lastLoginAt: now
      }
    })
    return toDto(upserted)
  },

  /**
   * Actualiza `lastLoginAt` y vincula al perfil si todavía no estaba
   * vinculada. Lo usa el servicio de auth en cada login exitoso.
   */
  async touchLogin(
    accountId: string,
    profileIdToLink: string | null
  ): Promise<AuthAccountDto> {
    const updated = await prisma.userAccount.update({
      where: { id: accountId },
      data: {
        lastLoginAt: new Date(),
        ...(profileIdToLink && { profileId: profileIdToLink })
      }
    })
    return toDto(updated)
  },

  /**
   * Vincula explícitamente el perfil activo a una cuenta. Sobreescribe
   * cualquier link anterior — no hay datos colgados de un profileId
   * concreto en la cuenta todavía.
   */
  async linkProfile(
    accountId: string,
    profileId: string
  ): Promise<AuthAccountDto | null> {
    const existing = await prisma.userAccount.findUnique({
      where: { id: accountId }
    })
    if (!existing) return null
    if (existing.profileId === profileId) return toDto(existing)
    const updated = await prisma.userAccount.update({
      where: { id: accountId },
      data: { profileId }
    })
    return toDto(updated)
  }
}
