import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { MovementRecommendationDto } from '@shared/types/movementRecommendation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const MAX_ITEMS = 4

interface Props {
  recommendations: MovementRecommendationDto[]
}

export function RecommendedMovementsCard({ recommendations }: Props) {
  const items = recommendations.slice(0, MAX_ITEMS)

  return (
    <Card>
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
          <p className="text-sm text-muted-foreground">
            Marcá algunos movimientos como dominados para que podamos
            recomendarte qué sigue.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((rec) => (
              <li
                key={rec.movement.id}
                className="border-b border-border/40 last:border-0 pb-3 last:pb-0"
              >
                <Link
                  to={`/movements/${rec.movement.slug}`}
                  className="flex items-start justify-between gap-3 hover:bg-accent/30 -mx-2 px-2 py-1 rounded transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {rec.movement.name}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        Dif {rec.movement.difficulty}/5
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {rec.movement.category}
                      </Badge>
                    </div>
                    {rec.reasons.length > 0 && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {rec.reasons[0]}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
