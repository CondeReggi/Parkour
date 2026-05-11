import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  /** Líneas falsas a renderizar dentro del Card. */
  lines?: number
  className?: string
}

/**
 * Skeleton genérico para cards del dashboard. Mantiene la altura visual
 * y disimula el flash de "Cargando…" planos. Estilo deportivo: barras
 * con un poco de animación pulse.
 */
export function DashboardCardSkeleton({ lines = 3, className }: Props) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="pt-5 pb-5 space-y-3">
        <div className="h-4 w-1/3 rounded bg-muted/70" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-muted/50"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </CardContent>
    </Card>
  )
}
