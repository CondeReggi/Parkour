import { Link } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import type { CloseToMasterMovementDto } from '@shared/types/progressInsights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABEL, relativeFromNow } from '../lib/labels'

export function CloseToMasterCard({
  movements
}: {
  movements: CloseToMasterMovementDto[]
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            Cerca de dominar
          </CardTitle>
          <Badge variant="outline">{movements.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {movements.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no hay movimientos suficientemente practicados como para
            estar cerca de dominar. Repetí los que ya tenés en práctica en
            varias sesiones para que aparezcan acá.
          </p>
        )}
        {movements.length > 0 && (
          <ul className="space-y-2">
            {movements.map((m) => (
              <li key={m.movementId}>
                <Link
                  to={`/movements/${m.movementSlug}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium truncate">{m.movementName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORY_LABEL[m.category]} · Dif {m.difficulty} ·{' '}
                      {m.recentSessionAppearances} sesion
                      {m.recentSessionAppearances === 1 ? '' : 'es'} recientes ·{' '}
                      {relativeFromNow(m.lastPracticedAt)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
