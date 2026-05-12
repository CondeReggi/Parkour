/**
 * Helpers para gestionar la visibilidad de las entidades compartibles
 * (Spot, Routine, VideoEntry).
 *
 * Responsabilidades:
 *  - Validar que sólo cuentas autenticadas puedan marcar contenido como
 *    public/unlisted. Si no hay sesión, se rechaza con mensaje legible.
 *  - Resolver los cambios derivados de una transición de visibility:
 *    `sharedAt` (timestamp) y `shareSlug` (slug estable URL-safe).
 *
 * El módulo es puro Node — no toca Prisma. El repositorio que recibe el
 * resultado lo aplica al `data` del create/update.
 */

import { randomBytes } from 'node:crypto'
import type { Visibility } from '@shared/types/sharing'
import { authService } from './authService'

export interface VisibilityResolution {
  visibility: Visibility
  /** Nuevo sharedAt si cambió; null para nullear; undefined para no tocar. */
  sharedAt: Date | null | undefined
  /** Nuevo shareSlug si hay que generarlo; undefined para no tocar.
   *  No lo nulleamos al volver a private — el slug se conserva. */
  shareSlug: string | undefined
}

/**
 * Slug random URL-safe (base64url, 16 chars ≈ 96 bits de entropía).
 * Suficiente para evitar colisiones prácticas; el unique de DB es la
 * defensa real.
 */
function generateShareSlug(): string {
  return randomBytes(12)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Valida que la visibility solicitada sea compatible con el estado de
 * auth, y resuelve los cambios derivados.
 *
 * @param requested   Visibility que pide el usuario.
 * @param current     Visibility actual de la entidad (null si es create).
 * @param currentSlug shareSlug actual (null si nunca se publicó).
 * @throws Error si requested ≠ private y no hay sesión activa.
 */
export async function resolveVisibilityChange(args: {
  requested: Visibility
  current: Visibility | null
  currentSlug: string | null
}): Promise<VisibilityResolution> {
  const { requested, current, currentSlug } = args

  if (requested !== 'private') {
    const accountId = await authService.getCurrentAccountId()
    if (!accountId) {
      throw new Error(
        'Necesitás iniciar sesión para compartir contenido. Activá tu cuenta y volvé a intentar.'
      )
    }
  }

  // Sin cambio: no tocamos sharedAt ni shareSlug.
  if (current === requested) {
    return {
      visibility: requested,
      sharedAt: undefined,
      shareSlug: undefined
    }
  }

  // Transición a private: nulleamos sharedAt, conservamos shareSlug.
  if (requested === 'private') {
    return {
      visibility: 'private',
      sharedAt: null,
      shareSlug: undefined
    }
  }

  // Transición saliendo de private (o entre public ↔ unlisted): siempre
  // actualizamos sharedAt al momento actual. Si no hay slug todavía, lo
  // generamos; si ya existía lo dejamos intacto (link estable).
  return {
    visibility: requested,
    sharedAt: new Date(),
    shareSlug: currentSlug ? undefined : generateShareSlug()
  }
}
