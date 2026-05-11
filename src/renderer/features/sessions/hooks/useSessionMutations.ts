import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SessionDto } from '@shared/types/session'
import type {
  FinalizeSessionInput,
  StartSessionInput
} from '@shared/schemas/session.schemas'
import { sessionsKeys } from './useSessions'
import { gamificationKeys } from '@/features/gamification/hooks/useGamification'
import { questsKeys } from '@/features/quests/hooks/useQuests'
import { achievementsKeys } from '@/features/achievements/hooks/useAchievements'
import { streakKeys } from '@/features/streak/hooks/useStreak'
import { progressKeys } from '@/features/progress/hooks/useProgressInsights'

export function useStartSession() {
  const qc = useQueryClient()
  return useMutation<SessionDto, Error, StartSessionInput>({
    mutationFn: (input) => window.parkourApi.sessions.start(input),
    onSuccess: (created) => {
      qc.setQueryData(sessionsKeys.active(), created)
      void qc.invalidateQueries({ queryKey: sessionsKeys.list() })
    }
  })
}

export function useFinalizeSession() {
  const qc = useQueryClient()
  return useMutation<SessionDto, Error, FinalizeSessionInput>({
    mutationFn: (input) => window.parkourApi.sessions.finalize(input),
    onSuccess: () => {
      // Active session ya terminó: la seteamos a null sin refetch.
      qc.setQueryData(sessionsKeys.active(), null)
      // List y stats sí necesitan refrescarse.
      void qc.invalidateQueries({ queryKey: sessionsKeys.list() })
      void qc.invalidateQueries({ queryKey: sessionsKeys.stats() })
      // Finalizar suma XP.
      void qc.invalidateQueries({ queryKey: gamificationKeys.all })
      // Y puede progresar varias misiones (sessions_finalized,
      // sessions_low_pain, recommended_routine_completed).
      void qc.invalidateQueries({ queryKey: questsKeys.all })
      // Y eventualmente desbloquear logros.
      void qc.invalidateQueries({ queryKey: achievementsKeys.all })
      // Finalizar siempre afecta la racha (training del día).
      void qc.invalidateQueries({ queryKey: streakKeys.all })
      // Insights de progreso dependen de prácticamente todo lo anterior.
      void qc.invalidateQueries({ queryKey: progressKeys.all })
    }
  })
}

export function useCancelSession() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: (input) => window.parkourApi.sessions.cancel(input),
    onSuccess: () => {
      qc.setQueryData(sessionsKeys.active(), null)
      // Stats no cambian (las canceladas no contaban).
    }
  })
}
