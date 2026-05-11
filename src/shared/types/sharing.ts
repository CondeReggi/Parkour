/**
 * Tipos compartidos para el "sharing layer" (Fase 0).
 *
 * Hoy ninguna entidad se publica todavía — todo arranca con
 * visibility='private'. Estos tipos están reservados para cuando llegue
 * la comunidad: posts, perfiles públicos, feeds, etc.
 */

export type Visibility = 'private' | 'public' | 'unlisted'

export const DEFAULT_VISIBILITY: Visibility = 'private'
