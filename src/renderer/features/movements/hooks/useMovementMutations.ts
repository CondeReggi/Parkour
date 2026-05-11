import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MovementDto } from '@shared/types/movement'
import type { SetMovementProgressInput } from '@shared/schemas/movement.schemas'
import { movementsKeys } from './useMovements'
import { gamificationKeys } from '@/features/gamification/hooks/useGamification'
import { questsKeys } from '@/features/quests/hooks/useQuests'
import { achievementsKeys } from '@/features/achievements/hooks/useAchievements'
import { progressKeys } from '@/features/progress/hooks/useProgressInsights'

export function useSetMovementProgress() {
  const qc = useQueryClient()
  return useMutation<MovementDto, Error, SetMovementProgressInput>({
    mutationFn: (input) => window.parkourApi.movements.setProgress(input),
    onSuccess: (updated) => {
      // Refresca el listado y mete el item actualizado en el cache.
      void qc.invalidateQueries({ queryKey: movementsKeys.all })
      qc.setQueryData<MovementDto[] | undefined>(movementsKeys.list(), (prev) => {
        if (!prev) return prev
        return prev.map((m) => (m.id === updated.id ? updated : m))
      })
      // Marcar practicing/mastered suma XP, puede progresar misiones y
      // puede desbloquear logros, además afecta los insights de progreso.
      void qc.invalidateQueries({ queryKey: gamificationKeys.all })
      void qc.invalidateQueries({ queryKey: questsKeys.all })
      void qc.invalidateQueries({ queryKey: achievementsKeys.all })
      void qc.invalidateQueries({ queryKey: progressKeys.all })
    }
  })
}
