import { Link } from 'react-router-dom'
import type { RoutineDto } from '@shared/types/routine'
import { Card } from '@/components/ui/card'
import { DurationBadge, GoalBadge, LevelBadge } from './RoutineMeta'

function totalExercises(r: RoutineDto): number {
  return r.blocks.reduce((sum, b) => sum + b.exercises.length, 0)
}

export function RoutineCard({ routine }: { routine: RoutineDto }) {
  const slug = routine.slug ?? routine.id
  return (
    <Link to={`/routines/${slug}`} className="block">
      <Card className="p-4 space-y-2.5 hover:border-foreground/30 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="font-medium">{routine.name}</div>
            {routine.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {routine.description}
              </p>
            )}
          </div>
          <DurationBadge minutes={routine.estimatedMin} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GoalBadge goal={routine.goal} />
          <LevelBadge level={routine.level} />
          <span className="text-xs text-muted-foreground">
            {routine.blocks.length} bloques · {totalExercises(routine)} ejercicios
          </span>
        </div>
      </Card>
    </Link>
  )
}
