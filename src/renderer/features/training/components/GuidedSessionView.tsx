import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  Circle,
  Flame,
  PauseCircle,
  X
} from 'lucide-react'
import type { RoutineBlockType } from '@shared/types/routine'
import type { SessionDto, SessionTrafficLight } from '@shared/types/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRoutines } from '@/features/routines/hooks/useRoutines'
import { useCancelSession } from '@/features/sessions/hooks/useSessionMutations'

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

const TRAFFIC_DOT: Record<SessionTrafficLight, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500'
}

const TRAFFIC_LABEL: Record<SessionTrafficLight, string> = {
  green: 'Verde',
  yellow: 'Amarillo',
  red: 'Rojo'
}

function minutesSince(iso: string): number {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

interface Props {
  session: SessionDto
  onFinish: () => void
}

/**
 * Sesión en curso con bloques paso a paso. Estado de "bloque completado"
 * es local (no se persiste): refleja el orden en el que el usuario los
 * está atravesando para guiarlo. Al final, el usuario apreta "Terminé,
 * cargar feedback" y pasa al step de feedback en TrainingPage.
 */
export function GuidedSessionView({ session, onFinish }: Props) {
  const { data: routines } = useRoutines()
  const cancelMut = useCancelSession()
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const sessionRoutine = useMemo(
    () =>
      session.routineId
        ? routines?.find((r) => r.id === session.routineId)
        : undefined,
    [routines, session.routineId]
  )

  const blocks = useMemo(() => {
    if (!sessionRoutine) return []
    return [...sessionRoutine.blocks].sort((a, b) => {
      const ai = BLOCK_ORDER.indexOf(a.type)
      const bi = BLOCK_ORDER.indexOf(b.type)
      if (ai !== bi) return ai - bi
      return a.order - b.order
    })
  }, [sessionRoutine])

  const currentBlock = blocks.find((b) => !completed.has(b.id))
  const progressPct =
    blocks.length === 0
      ? 0
      : Math.floor((completed.size / blocks.length) * 100)

  const elapsedMin = minutesSince(session.startedAt)

  function toggle(blockId: string) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }

  function handleCancel() {
    if (
      !confirm('¿Cancelar esta sesión? Se borra y no queda registro.')
    )
      return
    void cancelMut.mutate({ id: session.id })
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full animate-pulse bg-primary" />
                Entrenamiento en curso
              </CardTitle>
              <p className="text-xs text-muted-foreground tabular-nums">
                {elapsedMin} min · {session.routineName ?? 'Sin rutina'}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Badge variant="outline" className="gap-2">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    TRAFFIC_DOT[session.safetyTrafficLight]
                  )}
                />
                {TRAFFIC_LABEL[session.safetyTrafficLight]}
              </Badge>
              {session.safetyOverridden && (
                <Badge variant="destructive">Override</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
              <span>
                Paso {Math.min(completed.size + 1, blocks.length || 1)} de{' '}
                {blocks.length || 1}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {currentBlock && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-primary/80">
                Ahora
              </p>
              <p className="text-sm font-medium">
                {BLOCK_LABEL[currentBlock.type]}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentBlock.exercises.length}{' '}
                {currentBlock.exercises.length === 1
                  ? 'ejercicio'
                  : 'ejercicios'}{' '}
                · clavá el bloque y marcalo como hecho.
              </p>
            </div>
          )}

          {!currentBlock && blocks.length > 0 && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-primary/80">
                Listo
              </p>
              <p className="text-sm font-medium">
                Pasaste todos los bloques. Cerrá la sesión cuando estés.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bloques de la rutina</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {blocks.map((block, idx) => {
                const isDone = completed.has(block.id)
                const isCurrent = currentBlock?.id === block.id
                return (
                  <li key={block.id}>
                    <button
                      type="button"
                      onClick={() => toggle(block.id)}
                      className={cn(
                        'w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                        isDone
                          ? 'bg-primary/10 border-primary/40'
                          : isCurrent
                            ? 'border-primary/50 hover:bg-accent/30'
                            : 'border-border hover:bg-accent/30'
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isDone ? (
                          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center text-[10px] tabular-nums text-muted-foreground">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              'text-sm leading-tight',
                              isDone
                                ? 'line-through text-muted-foreground'
                                : 'font-medium'
                            )}
                          >
                            {BLOCK_LABEL[block.type]}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] tabular-nums"
                          >
                            {block.exercises.length} ej.
                          </Badge>
                        </div>
                        {block.exercises.length > 0 && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {block.exercises
                              .slice(0, 3)
                              .map((e) => e.name)
                              .join(' · ')}
                            {block.exercises.length > 3 ? ' …' : ''}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {blocks.length === 0 && (
        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Circle className="h-4 w-4" />
            Esta sesión no tiene rutina asociada. Cuando termines, cargá el
            feedback.
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={cancelMut.isPending}
        >
          <X className="h-4 w-4" />
          Cancelar sesión
        </Button>
        <Button type="button" onClick={onFinish}>
          <Flame className="h-4 w-4" />
          Terminé, cargar feedback
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
