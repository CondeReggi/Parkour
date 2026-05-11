import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InjuryDto } from '@shared/types/profile'
import type { AddInjuryInput } from '@shared/schemas/injury.schemas'
import { profileKeys } from './useActiveProfile'

export function useAddInjury() {
  const qc = useQueryClient()
  return useMutation<InjuryDto, Error, AddInjuryInput>({
    mutationFn: (input) => window.parkourApi.profile.addInjury(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.active() })
    }
  })
}

export function useDeleteInjury() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string }>({
    mutationFn: (input) => window.parkourApi.profile.deleteInjury(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.active() })
    }
  })
}
