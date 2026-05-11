import { useQuery } from '@tanstack/react-query'
import type { SpotDto } from '@shared/types/spot'

export const spotsKeys = {
  all: ['spots'] as const,
  list: () => [...spotsKeys.all, 'list'] as const,
  byId: (id: string) => [...spotsKeys.all, 'byId', id] as const
}

export function useSpots() {
  return useQuery<SpotDto[]>({
    queryKey: spotsKeys.list(),
    queryFn: () => window.parkourApi.spots.getAll()
  })
}

export function useSpotById(id: string | undefined) {
  return useQuery<SpotDto | null>({
    queryKey: id ? spotsKeys.byId(id) : ['spots', 'byId', 'none'],
    queryFn: () =>
      id ? window.parkourApi.spots.getById({ id }) : Promise.resolve(null),
    enabled: !!id
  })
}
