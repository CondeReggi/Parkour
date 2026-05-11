import { useMemo } from 'react'
import type { MovementDto } from '@shared/types/movement'
import { useMovements } from './useMovements'

/**
 * Lee el cache de useMovements en lugar de hacer una llamada IPC adicional.
 * Si el cache está vacío (página de detalle abierta directo), useMovements
 * fetchea automáticamente.
 */
export function useMovementBySlug(slug: string | undefined) {
  const query = useMovements()
  const movement = useMemo<MovementDto | undefined>(
    () => (slug ? query.data?.find((m) => m.slug === slug) : undefined),
    [query.data, slug]
  )
  return { ...query, data: movement }
}
