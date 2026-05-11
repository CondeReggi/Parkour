import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import type { RoutineRecommendationDto } from '@shared/types/routine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DurationBadge, GoalBadge, LevelBadge } from './RoutineMeta'

interface Props {
  recommendation: RoutineRecommendationDto
}

export function RecommendedRoutineCard({ recommendation }: Props) {
  const { routine, reasons } = recommendation
  const slug = routine.slug ?? routine.id

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-foreground/70" />
          Recomendada para hoy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-lg font-semibold">{routine.name}</div>
          {routine.description && (
            <p className="text-sm text-muted-foreground">{routine.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <GoalBadge goal={routine.goal} />
            <LevelBadge level={routine.level} />
            <DurationBadge minutes={routine.estimatedMin} />
          </div>
        </div>

        {reasons.length > 0 && (
          <div className="rounded-md bg-secondary/50 p-3 space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Por qué te tocó esta
            </p>
            <ul className="text-xs space-y-1">
              {reasons.map((r, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-foreground/40 select-none">·</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link to={`/routines/${slug}`}>
              Ver rutina <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
