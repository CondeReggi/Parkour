import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { VideoDto } from '@shared/types/video'
import type {
  CreateVideoInput,
  UpdateVideoInput
} from '@shared/schemas/video.schemas'
import { videosKeys } from './useVideos'
import { gamificationKeys } from '@/features/gamification/hooks/useGamification'
import { questsKeys } from '@/features/quests/hooks/useQuests'
import { achievementsKeys } from '@/features/achievements/hooks/useAchievements'
import { progressKeys } from '@/features/progress/hooks/useProgressInsights'

export function useCreateVideo() {
  const qc = useQueryClient()
  return useMutation<VideoDto, Error, CreateVideoInput>({
    mutationFn: (input) => window.parkourApi.videos.create(input),
    onSuccess: (created) => {
      qc.setQueryData(videosKeys.byId(created.id), created)
      void qc.invalidateQueries({ queryKey: videosKeys.list() })
      // Subir video suma XP, y si vino ya con reviewStatus distinto a
      // 'pending', el backend además otorgó el XP de revisión.
      void qc.invalidateQueries({ queryKey: gamificationKeys.all })
      void qc.invalidateQueries({ queryKey: questsKeys.all })
      void qc.invalidateQueries({ queryKey: achievementsKeys.all })
      void qc.invalidateQueries({ queryKey: progressKeys.all })
    }
  })
}

export function useUpdateVideo() {
  const qc = useQueryClient()
  return useMutation<VideoDto, Error, UpdateVideoInput>({
    mutationFn: (input) => window.parkourApi.videos.update(input),
    onSuccess: (updated) => {
      qc.setQueryData(videosKeys.byId(updated.id), updated)
      void qc.invalidateQueries({ queryKey: videosKeys.list() })
      // Revisar un video por primera vez suma XP, progresa misiones y
      // puede desbloquear logros.
      void qc.invalidateQueries({ queryKey: gamificationKeys.all })
      void qc.invalidateQueries({ queryKey: questsKeys.all })
      void qc.invalidateQueries({ queryKey: achievementsKeys.all })
      void qc.invalidateQueries({ queryKey: progressKeys.all })
    }
  })
}

export function useDeleteVideo() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: (input) => window.parkourApi.videos.delete(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: videosKeys.all })
      void qc.invalidateQueries({ queryKey: progressKeys.all })
    }
  })
}
