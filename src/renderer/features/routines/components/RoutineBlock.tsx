import { Link } from 'react-router-dom'
import { Activity, Dumbbell, Flame, Move, Wind, type LucideIcon } from 'lucide-react'
import type { RoutineBlockDto, RoutineBlockType, RoutineExerciseDto } from '@shared/types/routine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const BLOCK_LABEL: Record<RoutineBlockType, string> = {
  warmup: 'Calentamiento',
  technique: 'Técnica',
  strength: 'Fuerza',
  mobility: 'Movilidad',
  cooldown: 'Vuelta a la calma'
}

const BLOCK_ICON: Record<RoutineBlockType, LucideIcon> = {
  warmup: Flame,
  technique: Activity,
  strength: Dumbbell,
  mobility: Move,
  cooldown: Wind
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} seg`
  const min = Math.floor(sec / 60)
  const remaining = sec % 60
  if (remaining === 0) return `${min} min`
  return `${min}'${remaining.toString().padStart(2, '0')}"`
}

function formatExerciseMetrics(e: RoutineExerciseDto): string {
  const parts: string[] = []
  if (e.sets !== null && e.sets > 0) {
    if (e.reps !== null && e.reps > 0) {
      parts.push(`${e.sets} × ${e.reps} reps`)
    } else if (e.durationSec !== null && e.durationSec > 0) {
      parts.push(`${e.sets} × ${formatDuration(e.durationSec)}`)
    } else {
      parts.push(`${e.sets} series`)
    }
  } else if (e.reps !== null && e.reps > 0) {
    parts.push(`${e.reps} reps`)
  } else if (e.durationSec !== null && e.durationSec > 0) {
    parts.push(formatDuration(e.durationSec))
  }
  if (e.restSec !== null && e.restSec > 0) {
    parts.push(`descanso ${formatDuration(e.restSec)}`)
  }
  return parts.join(' · ')
}

function ExerciseRow({ exercise }: { exercise: RoutineExerciseDto }) {
  const metrics = formatExerciseMetrics(exercise)
  return (
    <li className="border-l-2 border-border pl-3 py-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          {exercise.movementSlug ? (
            <Link
              to={`/movements/${exercise.movementSlug}`}
              className="font-medium text-sm hover:underline"
            >
              {exercise.name}
            </Link>
          ) : (
            <span className="font-medium text-sm">{exercise.name}</span>
          )}
          {exercise.description && (
            <p className="text-xs text-muted-foreground">{exercise.description}</p>
          )}
          {exercise.notes && (
            <p className="text-xs text-muted-foreground italic">{exercise.notes}</p>
          )}
        </div>
        {metrics && (
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap flex-shrink-0">
            {metrics}
          </span>
        )}
      </div>
    </li>
  )
}

export function RoutineBlock({ block }: { block: RoutineBlockDto }) {
  const Icon = BLOCK_ICON[block.type]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-foreground/70" />
          {BLOCK_LABEL[block.type]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {block.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin ejercicios.</p>
        ) : (
          <ul className="space-y-1">
            {block.exercises.map((e) => (
              <ExerciseRow key={e.id} exercise={e} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
