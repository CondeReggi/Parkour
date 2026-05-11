import { useQuery } from '@tanstack/react-query'
import type { ProfileDto } from '@shared/types/profile'

export const profileKeys = {
  all: ['profile'] as const,
  active: () => [...profileKeys.all, 'active'] as const
}

export function useActiveProfile() {
  return useQuery<ProfileDto | null>({
    queryKey: profileKeys.active(),
    queryFn: () => window.parkourApi.profile.getActive()
  })
}
