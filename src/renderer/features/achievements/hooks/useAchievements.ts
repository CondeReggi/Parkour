import { useQuery } from '@tanstack/react-query'
import type {
  AchievementDto,
  AchievementsListDto
} from '@shared/types/achievement'

export const achievementsKeys = {
  all: ['achievements'] as const,
  list: () => [...achievementsKeys.all, 'list'] as const,
  recent: () => [...achievementsKeys.all, 'recent'] as const
}

export function useAchievementsList() {
  return useQuery<AchievementsListDto>({
    queryKey: achievementsKeys.list(),
    queryFn: () => window.parkourApi.achievements.listForActive()
  })
}

export function useRecentAchievements() {
  return useQuery<AchievementDto[]>({
    queryKey: achievementsKeys.recent(),
    queryFn: () => window.parkourApi.achievements.recentForActive()
  })
}
