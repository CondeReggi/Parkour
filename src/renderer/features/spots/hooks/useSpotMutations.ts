import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  PickedSpotPhoto,
  SpotDto,
  SpotObstacleDto,
  SpotPhotoDto
} from '@shared/types/spot'
import type {
  AddObstacleInput,
  AddSpotPhotoInput,
  CreateSpotInput,
  SetIdealMovementsInput,
  SetObstacleMovementsInput,
  SetSpotFavoriteInput,
  UpdateObstacleInput,
  UpdateSpotInput,
  UpdateSpotPhotoInput
} from '@shared/schemas/spot.schemas'
import { spotsKeys } from './useSpots'
import { gamificationKeys } from '@/features/gamification/hooks/useGamification'
import { questsKeys } from '@/features/quests/hooks/useQuests'
import { achievementsKeys } from '@/features/achievements/hooks/useAchievements'
import { progressKeys } from '@/features/progress/hooks/useProgressInsights'

export function useCreateSpot() {
  const qc = useQueryClient()
  return useMutation<SpotDto, Error, CreateSpotInput>({
    mutationFn: (input) => window.parkourApi.spots.create(input),
    onSuccess: (created) => {
      qc.setQueryData(spotsKeys.byId(created.id), created)
      void qc.invalidateQueries({ queryKey: spotsKeys.list() })
      // Registrar un spot suma XP, progresa misiones y puede desbloquear
      // logros.
      void qc.invalidateQueries({ queryKey: gamificationKeys.all })
      void qc.invalidateQueries({ queryKey: questsKeys.all })
      void qc.invalidateQueries({ queryKey: achievementsKeys.all })
      void qc.invalidateQueries({ queryKey: progressKeys.all })
    }
  })
}

export function useUpdateSpot() {
  const qc = useQueryClient()
  return useMutation<SpotDto, Error, UpdateSpotInput>({
    mutationFn: (input) => window.parkourApi.spots.update(input),
    onSuccess: (updated) => {
      qc.setQueryData(spotsKeys.byId(updated.id), updated)
      void qc.invalidateQueries({ queryKey: spotsKeys.list() })
    }
  })
}

export function useDeleteSpot() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: (input) => window.parkourApi.spots.delete(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: spotsKeys.all })
    }
  })
}

export function useSetSpotFavorite() {
  const qc = useQueryClient()
  return useMutation<SpotDto, Error, SetSpotFavoriteInput>({
    mutationFn: (input) => window.parkourApi.spots.setFavorite(input),
    onSuccess: (updated) => {
      qc.setQueryData(spotsKeys.byId(updated.id), updated)
      void qc.invalidateQueries({ queryKey: spotsKeys.list() })
    }
  })
}

// === Obstacles ===

export function useAddObstacle() {
  const qc = useQueryClient()
  return useMutation<SpotObstacleDto, Error, AddObstacleInput>({
    mutationFn: (input) => window.parkourApi.spots.addObstacle(input),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: spotsKeys.byId(created.spotId) })
      void qc.invalidateQueries({ queryKey: spotsKeys.list() })
    }
  })
}

export function useUpdateObstacle() {
  const qc = useQueryClient()
  return useMutation<SpotObstacleDto, Error, UpdateObstacleInput>({
    mutationFn: (input) => window.parkourApi.spots.updateObstacle(input),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: spotsKeys.byId(updated.spotId) })
    }
  })
}

export function useDeleteObstacle(spotId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: (input) => window.parkourApi.spots.deleteObstacle(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: spotsKeys.byId(spotId) })
      void qc.invalidateQueries({ queryKey: spotsKeys.list() })
    }
  })
}

export function useSetObstacleMovements(spotId: string) {
  const qc = useQueryClient()
  return useMutation<SpotObstacleDto, Error, SetObstacleMovementsInput>({
    mutationFn: (input) => window.parkourApi.spots.setObstacleMovements(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: spotsKeys.byId(spotId) })
    }
  })
}

// === Ideal movements (nivel de spot) ===

export function useSetSpotIdealMovements() {
  const qc = useQueryClient()
  return useMutation<SpotDto, Error, SetIdealMovementsInput>({
    mutationFn: (input) => window.parkourApi.spots.setIdealMovements(input),
    onSuccess: (updated) => {
      qc.setQueryData(spotsKeys.byId(updated.id), updated)
      void qc.invalidateQueries({ queryKey: spotsKeys.list() })
    }
  })
}

// === Photos ===

export function useAddSpotPhoto() {
  const qc = useQueryClient()
  return useMutation<SpotPhotoDto, Error, AddSpotPhotoInput>({
    mutationFn: (input) => window.parkourApi.spots.addPhoto(input),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: spotsKeys.byId(created.spotId) })
      void qc.invalidateQueries({ queryKey: spotsKeys.list() })
    }
  })
}

export function useUpdateSpotPhoto(spotId: string) {
  const qc = useQueryClient()
  return useMutation<SpotPhotoDto, Error, UpdateSpotPhotoInput>({
    mutationFn: (input) => window.parkourApi.spots.updatePhoto(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: spotsKeys.byId(spotId) })
    }
  })
}

export function useDeleteSpotPhoto(spotId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: (input) => window.parkourApi.spots.deletePhoto(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: spotsKeys.byId(spotId) })
      void qc.invalidateQueries({ queryKey: spotsKeys.list() })
    }
  })
}

export async function pickSpotPhotoNative(): Promise<PickedSpotPhoto | null> {
  return window.parkourApi.spots.pickPhoto()
}
