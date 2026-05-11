import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProfileDto } from '@shared/types/profile'
import type {
  CreateProfileInput,
  UpdateProfileInput
} from '@shared/schemas/profile.schemas'
import { profileKeys } from './useActiveProfile'

export function useCreateProfile() {
  const qc = useQueryClient()
  return useMutation<ProfileDto, Error, CreateProfileInput>({
    mutationFn: (input) => window.parkourApi.profile.create(input),
    onSuccess: (created) => {
      qc.setQueryData(profileKeys.active(), created)
    }
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation<ProfileDto, Error, UpdateProfileInput>({
    mutationFn: (input) => window.parkourApi.profile.update(input),
    onSuccess: (updated) => {
      qc.setQueryData(profileKeys.active(), updated)
    }
  })
}
