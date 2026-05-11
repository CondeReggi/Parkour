import { useQuery } from '@tanstack/react-query'
import type { SessionDto } from '@shared/types/session'
import type { SessionStatsDto } from '@shared/types/stats'

export const sessionsKeys = {
  all: ['sessions'] as const,
  active: () => [...sessionsKeys.all, 'active'] as const,
  list: () => [...sessionsKeys.all, 'list'] as const,
  byId: (id: string) => [...sessionsKeys.all, 'byId', id] as const,
  stats: () => [...sessionsKeys.all, 'stats'] as const
}

export function useActiveSession() {
  return useQuery<SessionDto | null>({
    queryKey: sessionsKeys.active(),
    queryFn: () => window.parkourApi.sessions.getActive()
  })
}

export function useSessionsList() {
  return useQuery<SessionDto[]>({
    queryKey: sessionsKeys.list(),
    queryFn: () => window.parkourApi.sessions.listForActive()
  })
}

export function useSessionStats() {
  return useQuery<SessionStatsDto>({
    queryKey: sessionsKeys.stats(),
    queryFn: () => window.parkourApi.sessions.getStats()
  })
}
