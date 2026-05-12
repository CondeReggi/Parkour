/**
 * Repositorio de PublicProfile.
 *
 * No hay tabla `PublicProfile`: los datos viven en `UserAccount`. Este
 * repo se encarga de:
 *  - Leer/actualizar los campos públicos de UserAccount.
 *  - Resolver la disponibilidad de un username (case-insensitive, lowercase).
 *  - Componer la vista pública por username, agregando stats, nivel,
 *    movimientos dominados y spots compartidos.
 *
 * Reglas:
 *  - Email NUNCA se devuelve en la vista pública.
 *  - Si `isPublicProfile=false`, la vista por username devuelve
 *    `visibility: 'private'`.
 *  - Cada toggle `show*` filtra una sección. Si está apagado, el campo
 *    correspondiente queda en null o array vacío.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../db/client'
import { computeLevelFromXp } from '../services/xpLevels'
import type {
  MyPublicProfileDto,
  PublicProfileDataDto,
  PublicProfileViewDto,
  UsernameAvailabilityDto
} from '@shared/types/publicProfile'
import type {
  SetPrivacyInput,
  UpdatePublicProfileInput
} from '@shared/schemas/publicProfile.schemas'

interface AccountSnapshot {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  coverImageUrl: string | null
  isPublicProfile: boolean
  showLevel: boolean
  showStats: boolean
  showDominatedMovements: boolean
  showSharedSpots: boolean
  profileId: string | null
  updatedAt: Date
}

async function findAccountById(accountId: string): Promise<AccountSnapshot | null> {
  const row = await prisma.userAccount.findUnique({ where: { id: accountId } })
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    coverImageUrl: row.coverImageUrl,
    isPublicProfile: row.isPublicProfile,
    showLevel: row.showLevel,
    showStats: row.showStats,
    showDominatedMovements: row.showDominatedMovements,
    showSharedSpots: row.showSharedSpots,
    profileId: row.profileId,
    updatedAt: row.updatedAt
  }
}

async function findAccountByUsername(username: string): Promise<AccountSnapshot | null> {
  const row = await prisma.userAccount.findUnique({
    where: { username: username.toLowerCase() }
  })
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    coverImageUrl: row.coverImageUrl,
    isPublicProfile: row.isPublicProfile,
    showLevel: row.showLevel,
    showStats: row.showStats,
    showDominatedMovements: row.showDominatedMovements,
    showSharedSpots: row.showSharedSpots,
    profileId: row.profileId,
    updatedAt: row.updatedAt
  }
}

/**
 * Arma el bloque de datos públicos a partir de una cuenta. Aplica los
 * flags de visibilidad: lo que no se muestra queda null o array vacío.
 */
async function buildPublicData(acc: AccountSnapshot): Promise<PublicProfileDataDto> {
  let level: string | null = null
  let totalXp: number | null = null
  let sessionsCount: number | null = null
  let masteredCount: number | null = null
  let dominatedMovements: Array<{ slug: string; name: string }> = []
  let sharedSpots: Array<{ id: string; name: string }> = []

  if (acc.profileId) {
    if (acc.showLevel) {
      const profile = await prisma.userProfile.findUnique({
        where: { id: acc.profileId },
        select: { level: true }
      })
      level = profile?.level ?? null
    }

    if (acc.showStats) {
      const [xpAgg, sessions, mastered] = await Promise.all([
        prisma.xpEvent.aggregate({
          where: { profileId: acc.profileId },
          _sum: { amount: true }
        }),
        prisma.workoutSession.count({
          where: { profileId: acc.profileId, endedAt: { not: null } }
        }),
        prisma.movementProgress.count({
          where: { profileId: acc.profileId, status: 'mastered' }
        })
      ])
      totalXp = xpAgg._sum.amount ?? 0
      sessionsCount = sessions
      masteredCount = mastered

      // El "nivel" calculado por XP es distinto del UserProfile.level
      // (que es habilidad técnica del usuario). Acá usamos el de
      // habilidad técnica para mostrar; XP queda en totalXp.
    }

    if (acc.showDominatedMovements) {
      const rows = await prisma.movementProgress.findMany({
        where: { profileId: acc.profileId, status: 'mastered' },
        include: { movement: { select: { slug: true, name: true } } },
        orderBy: { lastPracticedAt: 'desc' },
        take: 20
      })
      dominatedMovements = rows.map((r) => ({
        slug: r.movement.slug,
        name: r.movement.name
      }))
    }
  }

  if (acc.showSharedSpots) {
    const spots = await prisma.spot.findMany({
      where: { authorAccountId: acc.id, visibility: 'public' },
      select: { id: true, name: true },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })
    sharedSpots = spots
  }

  // Si totalXp se calculó, exponemos también el level numérico de gamif
  // bajo `totalXp` (no creamos campo extra para no inflar el DTO).
  if (acc.showStats && totalXp !== null) {
    // Sólo usamos el helper para validar la curva. Hoy no exponemos el
    // nivel numérico de gamif acá, sólo el totalXp.
    computeLevelFromXp(totalXp)
  }

  return {
    username: acc.username ?? '',
    displayName: acc.displayName,
    avatarUrl: acc.avatarUrl,
    bio: acc.bio,
    coverImageUrl: acc.coverImageUrl,
    level,
    totalXp,
    sessionsCount,
    masteredCount,
    dominatedMovements,
    sharedSpots
  }
}

async function toMyDto(acc: AccountSnapshot): Promise<MyPublicProfileDto> {
  // Preview siempre se calcula como si fuese público — el dueño ve qué
  // mostraría a otros con la config actual, sin importar isPublicProfile.
  const preview = await buildPublicData(acc)
  return {
    accountId: acc.id,
    username: acc.username,
    displayName: acc.displayName,
    avatarUrl: acc.avatarUrl,
    bio: acc.bio,
    coverImageUrl: acc.coverImageUrl,
    isPublic: acc.isPublicProfile,
    showLevel: acc.showLevel,
    showStats: acc.showStats,
    showDominatedMovements: acc.showDominatedMovements,
    showSharedSpots: acc.showSharedSpots,
    preview,
    updatedAt: acc.updatedAt.toISOString()
  }
}

export const publicProfileRepository = {
  async getMine(accountId: string): Promise<MyPublicProfileDto | null> {
    const acc = await findAccountById(accountId)
    if (!acc) return null
    return toMyDto(acc)
  },

  /**
   * Devuelve la vista pública de un username. Si no existe, devuelve
   * `visibility: 'not_found'`. Si existe pero está privado,
   * `visibility: 'private'`.
   */
  async getByUsername(username: string): Promise<PublicProfileViewDto> {
    const acc = await findAccountByUsername(username)
    if (!acc) return { visibility: 'not_found', username }
    if (!acc.isPublicProfile) {
      return { visibility: 'private', username: acc.username ?? username }
    }
    const data = await buildPublicData(acc)
    return { visibility: 'public', data }
  },

  /**
   * Disponibilidad para un input no validado. La validación de formato
   * la hizo Zod antes, pero acá igual la duplicamos defensivamente.
   */
  async checkUsernameAvailability(
    accountId: string | null,
    rawUsername: string
  ): Promise<UsernameAvailabilityDto> {
    const normalized = rawUsername.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(normalized) && normalized.length !== 1) {
      return { username: normalized, available: false, reason: 'invalid' }
    }
    if (normalized.length < 3 || normalized.length > 30) {
      return { username: normalized, available: false, reason: 'invalid' }
    }
    const existing = await prisma.userAccount.findUnique({
      where: { username: normalized },
      select: { id: true }
    })
    if (!existing) return { username: normalized, available: true }
    // Si soy yo mismo, está "disponible" — no me bloquea actualizar.
    if (accountId && existing.id === accountId) {
      return { username: normalized, available: true }
    }
    return { username: normalized, available: false, reason: 'taken' }
  },

  async upsertMine(
    accountId: string,
    input: UpdatePublicProfileInput
  ): Promise<MyPublicProfileDto> {
    try {
      const updated = await prisma.userAccount.update({
        where: { id: accountId },
        data: {
          username: input.username,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl ?? null,
          bio: input.bio ?? null,
          coverImageUrl: input.coverImageUrl ?? null,
          isPublicProfile: input.isPublic,
          showLevel: input.showLevel,
          showStats: input.showStats,
          showDominatedMovements: input.showDominatedMovements,
          showSharedSpots: input.showSharedSpots
        }
      })
      const snapshot: AccountSnapshot = {
        id: updated.id,
        username: updated.username,
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
        coverImageUrl: updated.coverImageUrl,
        isPublicProfile: updated.isPublicProfile,
        showLevel: updated.showLevel,
        showStats: updated.showStats,
        showDominatedMovements: updated.showDominatedMovements,
        showSharedSpots: updated.showSharedSpots,
        profileId: updated.profileId,
        updatedAt: updated.updatedAt
      }
      return toMyDto(snapshot)
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new Error('Ese nombre de usuario ya está en uso.')
      }
      throw e
    }
  },

  async setPrivacy(
    accountId: string,
    input: SetPrivacyInput
  ): Promise<MyPublicProfileDto> {
    const updated = await prisma.userAccount.update({
      where: { id: accountId },
      data: {
        isPublicProfile: input.isPublic,
        showLevel: input.showLevel,
        showStats: input.showStats,
        showDominatedMovements: input.showDominatedMovements,
        showSharedSpots: input.showSharedSpots
      }
    })
    const snapshot: AccountSnapshot = {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      coverImageUrl: updated.coverImageUrl,
      isPublicProfile: updated.isPublicProfile,
      showLevel: updated.showLevel,
      showStats: updated.showStats,
      showDominatedMovements: updated.showDominatedMovements,
      showSharedSpots: updated.showSharedSpots,
      profileId: updated.profileId,
      updatedAt: updated.updatedAt
    }
    return toMyDto(snapshot)
  }
}
