import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DailyActivityDto } from '@shared/types/streak'
import type { MarkActiveRecoveryInput } from '@shared/schemas/streak.schemas'
import { streakKeys } from './useStreak'
import { achievementsKeys } from '@/features/achievements/hooks/useAchievements'
import { sessionsKeys } from '@/features/sessions/hooks/useSessions'
import { progressKeys } from '@/features/progress/hooks/useProgressInsights'

export function useMarkActiveRecovery() {
  const qc = useQueryClient()
  return useMutation<DailyActivityDto, Error, MarkActiveRecoveryInput>({
    mutationFn: (input) => window.parkourApi.streak.markActiveRecovery(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: streakKeys.all })
      // Puede haber desbloqueado logros de constancia (tres_dias_seguidos, etc).
      void qc.invalidateQueries({ queryKey: achievementsKeys.all })
      // Si tenemos misiones futuras basadas en streak, también las querríamos
      // ver actualizadas. Por ahora invalido sessions stats por las dudas
      // (no afecta directamente pero el dashboard puede refrescar).
      void qc.invalidateQueries({ queryKey: sessionsKeys.stats() })
      // La racha alimenta los insights (currentStreak / bestStreak).
      void qc.invalidateQueries({ queryKey: progressKeys.all })
    }
  })
}
