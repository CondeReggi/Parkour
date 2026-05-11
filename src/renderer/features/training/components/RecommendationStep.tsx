import { AlertTriangle, ArrowRight, Flame } from 'lucide-react'
import type {
  RoutineBlockType,
  RoutineDto
} from '@shared/types/routine'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { GuidedRecommendation } from '../lib/pickGuidedRoutine'
import type { TrafficLightResult } from '../lib/safety'

const BLOCK_LABEL: Record<RoutineBlockType, string> = {
  warmup: 'Calentamiento',
  technique: 'Técnica principal',
  strength: 'Bloque complementario',
  mobility: 'Movilidad',
  cooldown: 'Vuelta a la calma'
}

const BLOCK_ORDER: RoutineBlockType[] = [
  'warmup',
  'technique',
  'strength',
  'mobility',
  'cooldown'
]

interface Props {
  recommendation: GuidedRecommendation
  trafficLight: TrafficLightResult
  isStarting: boolean
  onStart: () => void
  onBack: () => void
}

function RoutineBlocks({ routine }: { routine: RoutineDto }) {
  // Ordeno por la jerarquía canónica + caída a order original.
  const sortedBlocks = [...routine.blocks].sort((a, b) => {
    const ai = BLOCK_ORDER.indexOf(a.type)
    const bi = BLOCK_ORDER.indexOf(b.type)
    if (ai !== bi) return ai - bi
    return a.order - b.order
  })
  return (
    <div className="space-y-3">
      {sortedBlocks.map((block, idx) => (
        <div
          key={block.id}
          className="rounded-lg border bg-card/60 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-6 w-6 rounded-md bg-primary/15 text-primary flex items-center justify-center font-semibold tabular-nums">
                {idx + 1}
              </span>
              <span className="font-medium">{BLOCK_LABEL[block.type]}</span>
            </div>
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {block.exercises.length}{' '}
              {block.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
            </Badge>
          </div>
          {block.exercises.length > 0 && (
            <ul className="pl-8 space-y-1">
              {block.exercises.slice(0, 4).map((ex) => (
                <li
                  key={ex.id}
                  className="text-xs text-muted-foreground leading-snug list-disc"
                >
                  {ex.name}
                  {ex.sets && ex.reps
                    ? ` — ${ex.sets} × ${ex.reps}`
                    : ex.durationSec
                      ? ` — ${ex.durationSec}s`
                      : ''}
                </li>
              ))}
              {block.exercises.length > 4 && (
                <li className="text-[11px] text-muted-foreground/70 pl-1">
                  + {block.exercises.length - 4} más
                </li>
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

export function RecommendationStep({
  recommendation,
  trafficLight,
  isStarting,
  onStart,
  onBack
}: Props) {
  const { routine, reasons, warnings } = recommendation

  return (
    <div className="space-y-5">
      {warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {trafficLight.yellows.length > 0 && trafficLight.level === 'yellow' && (
        <Alert>
          <AlertDescription className="text-xs">
            <span className="font-medium">Atención al semáforo: </span>
            {trafficLight.yellows.join(' · ')}
          </AlertDescription>
        </Alert>
      )}

      {!routine && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Hoy no hay una rutina que encaje con tu estado. Probá descansar
              o cargar una recuperación activa desde el dashboard.
            </p>
            <Button type="button" variant="outline" onClick={onBack}>
              Volver al check-in
            </Button>
          </CardContent>
        </Card>
      )}

      {routine && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  {routine.name}
                </CardTitle>
                {routine.description && (
                  <CardDescription className="leading-snug">
                    {routine.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <Badge variant="outline" className="tabular-nums">
                  {routine.estimatedMin} min
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {routine.goal}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {reasons.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Por qué te la recomendamos
                </p>
                <ul className="space-y-1">
                  {reasons.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground leading-snug flex items-start gap-2"
                    >
                      <span className="text-foreground/50 mt-0.5">·</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <RoutineBlocks routine={routine} />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          Volver
        </Button>
        {routine && (
          <Button type="button" onClick={onStart} disabled={isStarting}>
            {isStarting ? 'Arrancando…' : 'Empezar entrenamiento'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
