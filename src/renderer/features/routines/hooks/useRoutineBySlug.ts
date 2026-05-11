import { useMemo } from 'react'
import type { RoutineDto } from '@shared/types/routine'
import { useRoutines } from './useRoutines'

export function useRoutineBySlug(slug: string | undefined) {
  const query = useRoutines()
  const routine = useMemo<RoutineDto | undefined>(
    () => (slug ? query.data?.find((r) => r.slug === slug) : undefined),
    [query.data, slug]
  )
  return { ...query, data: routine }
}
