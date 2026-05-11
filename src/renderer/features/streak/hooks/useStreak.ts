import { useQuery } from '@tanstack/react-query'
import type { StreakStateDto } from '@shared/types/streak'

export const streakKeys = {
  all: ['streak'] as const,
  state: () => [...streakKeys.all, 'state'] as const
}

export function useStreakState() {
  return useQuery<StreakStateDto>({
    queryKey: streakKeys.state(),
    queryFn: () => window.parkourApi.streak.getState()
  })
}
