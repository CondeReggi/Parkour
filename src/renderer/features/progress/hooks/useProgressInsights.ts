import { useQuery } from '@tanstack/react-query'
import type { ProgressInsightsDto } from '@shared/types/progressInsights'

export const progressKeys = {
  all: ['progress'] as const,
  insights: () => [...progressKeys.all, 'insights'] as const
}

/**
 * Insights de progreso del perfil activo. Se invalida desde el resto de
 * features cuando cambian datos relevantes (sesiones, movimientos,
 * videos, logros, gamificación). El servidor calcula todo en una pasada
 * para que el render sea barato.
 */
export function useProgressInsights() {
  return useQuery<ProgressInsightsDto>({
    queryKey: progressKeys.insights(),
    queryFn: () => window.parkourApi.progress.getInsights()
  })
}
