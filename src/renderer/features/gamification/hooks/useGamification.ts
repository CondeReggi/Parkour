import { useQuery } from '@tanstack/react-query'
import type {
  GamificationStateDto,
  XpBreakdownDto,
  XpEventDto
} from '@shared/types/gamification'

export const gamificationKeys = {
  all: ['gamification'] as const,
  state: () => [...gamificationKeys.all, 'state'] as const,
  events: () => [...gamificationKeys.all, 'events'] as const,
  breakdown: () => [...gamificationKeys.all, 'breakdown'] as const
}

export function useGamificationState() {
  return useQuery<GamificationStateDto>({
    queryKey: gamificationKeys.state(),
    queryFn: () => window.parkourApi.gamification.getState()
  })
}

export function useXpEvents() {
  return useQuery<XpEventDto[]>({
    queryKey: gamificationKeys.events(),
    queryFn: () => window.parkourApi.gamification.listEvents()
  })
}

export function useXpBreakdown() {
  return useQuery<XpBreakdownDto>({
    queryKey: gamificationKeys.breakdown(),
    queryFn: () => window.parkourApi.gamification.getBreakdown()
  })
}
