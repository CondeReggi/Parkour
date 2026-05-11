/**
 * Repositorio de AuthSession.
 *
 * Cada login (password o Google) crea una nueva fila. El AppSettings
 * apunta a la activa. Logout = setear `revokedAt` y limpiar el puntero.
 *
 * En local-first no expiramos sesiones por tiempo (expiresAt queda
 * null). Está preparado para cuando agreguemos sync en la nube.
 */

import { prisma } from '../db/client'

export interface AuthSessionRow {
  id: string
  userAccountId: string
  createdAt: Date
  expiresAt: Date | null
  revokedAt: Date | null
}

export const authSessionRepository = {
  async create(userAccountId: string): Promise<AuthSessionRow> {
    return prisma.authSession.create({
      data: { userAccountId }
    })
  },

  async findById(id: string): Promise<AuthSessionRow | null> {
    return prisma.authSession.findUnique({ where: { id } })
  },

  async revoke(id: string): Promise<void> {
    await prisma.authSession.update({
      where: { id },
      data: { revokedAt: new Date() }
    })
  },

  /** True si la sesión existe, no fue revocada y (si tiene expiresAt) no expiró. */
  isLive(s: AuthSessionRow | null): boolean {
    if (!s) return false
    if (s.revokedAt) return false
    if (s.expiresAt && s.expiresAt.getTime() < Date.now()) return false
    return true
  }
}
