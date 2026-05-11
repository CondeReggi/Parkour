import { Link } from 'react-router-dom'
import { ArrowRight, Coffee, Play } from 'lucide-react'
import type { ProfileDto } from '@shared/types/profile'
import type { RoutineDto } from '@shared/types/routine'
import type { TrafficLight } from '../lib/safety'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DurationBadge,
  GoalBadge,
  LevelBadge
} from '@/features/routines/components/RoutineMeta'
import { useStartSession } from '@/features/sessions/hooks/useSessionMutations'

interface Props {
  trafficLight: TrafficLight
  routine: RoutineDto | null
  profile: ProfileDto | undefined
  /** Datos pre del checklist para registrar en la sesión. */
  painBefore: number
  fatigueBefore: number
}

export function RecommendedForTodayCard({
  trafficLight,
  routine,
  profile,
  painBefore,
  fatigueBefore
}: Props) {
  const startMut = useStartSession()

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu rutina de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>Necesitás un perfil para que te recomendemos una rutina.</span>
              <Button asChild size="sm">
                <Link to="/profile">Crear perfil</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  async function startWithRoutine(targetRoutine: RoutineDto | null, overridden: boolean) {
    await startMut.mutateAsync({
      routineId: targetRoutine?.id ?? null,
      safetyTrafficLight: trafficLight,
      safetyOverridden: overridden,
      safetyNotes: null,
      painBefore,
      fatigueBefore
    })
  }

  if (trafficLight === 'red') {
    return (
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coffee className="h-4 w-4 text-foreground/70" />
            Día de descanso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>Hoy no es buena idea entrenar. El descanso también es entrenamiento.</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>· Hidratate</li>
            <li>· Movilidad ligera de tobillos, cadera y muñecas</li>
            <li>· 10-15 minutos de respiración o estiramientos suaves</li>
            <li>· Volvé mañana con el checklist de nuevo</li>
          </ul>

          {startMut.error && (
            <Alert variant="destructive">
              <AlertDescription>{startMut.error.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={startMut.isPending}
              onClick={() => {
                if (
                  !confirm(
                    'El semáforo está en rojo. ¿Seguro querés entrenar igual? Va a quedar registrado como override.'
                  )
                )
                  return
                void startWithRoutine(routine, true)
              }}
            >
              {startMut.isPending ? 'Iniciando…' : 'Quiero entrenar igual'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!routine) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu rutina de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No encontramos una rutina compatible con tu nivel y estado actual. Probá
              ajustar el checklist o revisá tus lesiones activas en el perfil.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const slug = routine.slug ?? routine.id
  const headerLabel =
    trafficLight === 'yellow' ? 'Rutina liviana para hoy' : 'Tu rutina de hoy'

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base">{headerLabel}</CardTitle>
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

        {startMut.error && (
          <Alert variant="destructive">
            <AlertDescription>{startMut.error.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/routines/${slug}`}>
              Ver rutina <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={startMut.isPending}
            onClick={() => startWithRoutine(routine, false)}
          >
            <Play className="h-4 w-4" />
            {startMut.isPending ? 'Iniciando…' : 'Empezar entrenamiento'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
