import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ClaimQuestResultDto } from '@shared/types/quest'
import type { ClaimQuestInput } from '@shared/schemas/quest.schemas'
import { questsKeys } from './useQuests'
import { gamificationKeys } from '@/features/gamification/hooks/useGamification'
import { achievementsKeys } from '@/features/achievements/hooks/useAchievements'
import { progressKeys } from '@/features/progress/hooks/useProgressInsights'

export function useClaimQuest() {
  const qc = useQueryClient()
  return useMutation<ClaimQuestResultDto, Error, ClaimQuestInput>({
    mutationFn: (input) => window.parkourApi.quests.claim(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: questsKeys.all })
      // Reclamar suma XP — invalidamos gamification también.
      void qc.invalidateQueries({ queryKey: gamificationKeys.all })
      // Y puede haber gatillado evaluación de logros.
      void qc.invalidateQueries({ queryKey: achievementsKeys.all })
      // El XP nuevo se refleja en los insights.
      void qc.invalidateQueries({ queryKey: progressKeys.all })
    }
  })
}
