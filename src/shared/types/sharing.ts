/**
 * Tipos y helpers para el "sharing layer".
 *
 * En esta fase todavía no hay comunidad ni feed remoto, pero el modelo
 * de visibilidad ya manda los datos del usuario: cada entidad
 * compartible elige `private` (default), `public` o `unlisted`. La
 * lógica de qué se publica realmente vendrá en una fase posterior.
 */

export type Visibility = 'private' | 'public' | 'unlisted'

export const VISIBILITY_VALUES = ['private', 'public', 'unlisted'] as const

export const DEFAULT_VISIBILITY: Visibility = 'private'

export interface VisibilityOption {
  value: Visibility
  label: string
  /** Microcopy corta que se muestra al lado del select. */
  description: string
}

export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: 'private',
    label: 'Privado',
    description: 'Privado: solo vos lo ves.'
  },
  {
    value: 'public',
    label: 'Público',
    description: 'Público: podrá aparecer en comunidad.'
  },
  {
    value: 'unlisted',
    label: 'No listado',
    description: 'No listado: visible solo con enlace.'
  }
]

/** True si el valor de visibility implica salir de "private". */
export function isShareableVisibility(v: Visibility): boolean {
  return v !== 'private'
}

/** Devuelve la microcopy de una visibility puntual. */
export function describeVisibility(v: Visibility): string {
  return VISIBILITY_OPTIONS.find((o) => o.value === v)?.description ?? ''
}
