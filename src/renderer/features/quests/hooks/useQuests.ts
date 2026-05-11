import { useQuery } from '@tanstack/react-query'
import type { QuestsListDto } from '@shared/types/quest'

export const questsKeys = {
  all: ['quests'] as const,
  list: () => [...questsKeys.all, 'list'] as const
}

export function useQuests() {
  return useQuery<QuestsListDto>({
    queryKey: questsKeys.list(),
    queryFn: () => window.parkourApi.quests.listForActive()
  })
}
