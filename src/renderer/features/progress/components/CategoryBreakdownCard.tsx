import type { CategoryBreakdownEntry } from '@shared/types/progressInsights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CATEGORY_LABEL } from '../lib/labels'

/**
 * Distribución de menciones por categoría en la semana. Barras simples
 * con porcentaje sobre el máximo, para que el lector vea la "huella"
 * del foco semanal sin necesidad de un chart library.
 */
export function CategoryBreakdownCard({
  entries
}: {
  entries: CategoryBreakdownEntry[]
}) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sin movimientos cargados todavía esta semana.
          </p>
        </CardContent>
      </Card>
    )
  }

  const max = entries[0]?.mentions ?? 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribución por categoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((e) => {
          const pct = max === 0 ? 0 : (e.mentions / max) * 100
          return (
            <div key={e.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {CATEGORY_LABEL[e.category]}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {e.mentions}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
