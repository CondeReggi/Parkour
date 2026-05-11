import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Sparkles } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMovementRecommendations } from '@/features/movements/hooks/useMovements'
import { DashboardCardSkeleton } from './DashboardCardSkeleton'

const MAX_ITEMS = 4

export function RecommendedNextMovesCard() {
  const { data, isLoading } = useMovementRecommendations()

  if (isLoading) return <DashboardCardSkeleton lines={4} />

  const items = (data ?? []).slice(0, MAX_ITEMS)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Próximos a aprender
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/movements">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
              <Compass className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Marcá algunos movimientos como dominados para que podamos
              sugerir qué sigue.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/movements">Explorar movimientos</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((rec) => (
              <li key={rec.movement.id}>
                <Link
                  to={`/movements/${rec.movement.slug}`}
                  className="flex items-start gap-3 p-2 -mx-2 rounded-md hover:bg-accent/40 transition-colors group"
                >
                  <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-semibold tabular-nums">
                    {rec.movement.difficulty}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium leading-tight">
                        {rec.movement.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {rec.movement.category}
                      </Badge>
                    </div>
                    {rec.reasons.length > 0 && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {rec.reasons[0]}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground/80 transition-colors mt-1 flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
