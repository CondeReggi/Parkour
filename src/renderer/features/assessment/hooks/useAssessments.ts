import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AssessmentDto } from '@shared/types/assessment'
import type { CreateAssessmentInput } from '@shared/schemas/assessment.schemas'
import { profileKeys } from '@/features/profile/hooks/useActiveProfile'

export const assessmentKeys = {
  all: ['assessment'] as const,
  list: () => [...assessmentKeys.all, 'list'] as const,
  latest: () => [...assessmentKeys.all, 'latest'] as const
}

export function useAssessments() {
  return useQuery<AssessmentDto[]>({
    queryKey: assessmentKeys.list(),
    queryFn: () => window.parkourApi.assessment.listForActive()
  })
}

export function useLatestAssessment() {
  return useQuery<AssessmentDto | null>({
    queryKey: assessmentKeys.latest(),
    queryFn: () => window.parkourApi.assessment.latest()
  })
}

export function useCreateAssessment() {
  const qc = useQueryClient()
  return useMutation<AssessmentDto, Error, CreateAssessmentInput>({
    mutationFn: (input) => window.parkourApi.assessment.create(input),
    onSuccess: () => {
      // El nivel del perfil cambia; revalido perfil + listado + última.
      void qc.invalidateQueries({ queryKey: profileKeys.active() })
      void qc.invalidateQueries({ queryKey: assessmentKeys.all })
    }
  })
}
