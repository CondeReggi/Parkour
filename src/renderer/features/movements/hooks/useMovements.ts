import { useQuery } from '@tanstack/react-query'
import type { MovementDto } from '@shared/types/movement'
import type { MovementRecommendationDto } from '@shared/types/movementRecommendation'

export const movementsKeys = {
  all: ['movements'] as const,
  list: () => [...movementsKeys.all, 'list'] as const,
  recommendations: () => [...movementsKeys.all, 'recommendations'] as const
}

/**
 * Hook canonical para listar movimientos. Las páginas no llaman
 * window.parkourApi directamente — siempre vía hooks como este.
 */
export function useMovements() {
  return useQuery<MovementDto[]>({
    queryKey: movementsKeys.list(),
    queryFn: () => window.parkourApi.movements.getAll()
  })
}

export function useMovementRecommendations() {
  return useQuery<MovementRecommendationDto[]>({
    queryKey: movementsKeys.recommendations(),
    queryFn: () => window.parkourApi.movements.recommendForActive()
  })
}
