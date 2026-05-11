import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Provider de TanStack Query. Una sola instancia de QueryClient
 * para toda la app, con defaults razonables para datos locales:
 *  - staleTime alto: los datos no cambian solos en una app local.
 *  - sin refetchOnWindowFocus: no aporta nada en desktop.
 *  - retry bajo: si Prisma falla, falla; no tiene sentido reintentar 3 veces.
 */

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
