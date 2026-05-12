import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  MyPublicProfileDto,
  PublicProfileViewDto,
  UsernameAvailabilityDto
} from '@shared/types/publicProfile'
import type {
  SetPrivacyInput,
  UpdatePublicProfileInput
} from '@shared/schemas/publicProfile.schemas'

export const publicProfileKeys = {
  all: ['publicProfile'] as const,
  mine: () => [...publicProfileKeys.all, 'mine'] as const,
  byUsername: (username: string) =>
    [...publicProfileKeys.all, 'byUsername', username.toLowerCase()] as const,
  username: (raw: string) =>
    [...publicProfileKeys.all, 'usernameCheck', raw.toLowerCase()] as const
}

export function useMyPublicProfile() {
  return useQuery<MyPublicProfileDto | null>({
    queryKey: publicProfileKeys.mine(),
    queryFn: () => window.parkourApi.publicProfile.getMine()
  })
}

/**
 * Vista pública por username. La habilitación se hace afuera (con
 * `enabled`) para que la query no se dispare con un username vacío.
 */
export function usePublicProfileByUsername(username: string | undefined) {
  return useQuery<PublicProfileViewDto>({
    queryKey: publicProfileKeys.byUsername(username ?? ''),
    queryFn: () =>
      window.parkourApi.publicProfile.getByUsername({
        username: (username ?? '').toLowerCase()
      }),
    enabled: !!username && username.length > 0
  })
}

/**
 * Chequeo de disponibilidad. Se llama con `enabled` desde el form
 * cuando el username pasó la validación local. La query queda cacheada
 * por valor — sin debounce explícito, el cache nos da la deduplicación.
 */
export function useCheckUsernameAvailability(raw: string, enabled: boolean) {
  return useQuery<UsernameAvailabilityDto>({
    queryKey: publicProfileKeys.username(raw),
    queryFn: () =>
      window.parkourApi.publicProfile.checkUsernameAvailability({
        username: raw
      }),
    enabled,
    // No revalidamos al volver al foco — si el username está disponible
    // hace 2 segundos, probablemente sigue estándolo.
    refetchOnWindowFocus: false,
    staleTime: 30_000
  })
}

export function useUpdatePublicProfile() {
  const qc = useQueryClient()
  return useMutation<MyPublicProfileDto, Error, UpdatePublicProfileInput>({
    mutationFn: (input) => window.parkourApi.publicProfile.upsertMine(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: publicProfileKeys.all })
      // Si cambió el username, las queries por username quedan sucias.
      // invalidar `all` ya las alcanza.
    }
  })
}

export function useSetPublicProfilePrivacy() {
  const qc = useQueryClient()
  return useMutation<MyPublicProfileDto, Error, SetPrivacyInput>({
    mutationFn: (input) => window.parkourApi.publicProfile.setPrivacy(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: publicProfileKeys.all })
    }
  })
}
