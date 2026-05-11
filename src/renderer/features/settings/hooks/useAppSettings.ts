import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppSettingsDto, Theme } from '@shared/types/settings'

export const settingsKeys = {
  all: ['settings'] as const,
  current: () => [...settingsKeys.all, 'current'] as const
}

export function useAppSettings() {
  return useQuery<AppSettingsDto>({
    queryKey: settingsKeys.current(),
    queryFn: () => window.parkourApi.settings.get()
  })
}

export function useSetTheme() {
  const qc = useQueryClient()
  return useMutation<AppSettingsDto, Error, Theme>({
    mutationFn: (theme) => window.parkourApi.settings.setTheme({ theme }),
    onSuccess: (next) => {
      qc.setQueryData(settingsKeys.current(), next)
    }
  })
}
