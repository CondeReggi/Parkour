import { useQuery } from '@tanstack/react-query'
import type { RoutineDto, RoutineRecommendationDto } from '@shared/types/routine'

export const routinesKeys = {
  all: ['routines'] as const,
  list: () => [...routinesKeys.all, 'list'] as const,
  recommended: () => [...routinesKeys.all, 'recommended'] as const
}

export function useRoutines() {
  return useQuery<RoutineDto[]>({
    queryKey: routinesKeys.list(),
    queryFn: () => window.parkourApi.routines.getAll()
  })
}

export function useRecommendedRoutine() {
  return useQuery<RoutineRecommendationDto | null>({
    queryKey: routinesKeys.recommended(),
    queryFn: () => window.parkourApi.routines.recommendForActive()
  })
}
