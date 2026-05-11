import { Link } from 'react-router-dom'
import type { SessionDto, SessionTrafficLight } from '@shared/types/session'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso))
}

function painFatigueLine(before: number | null, after: number | null): string {
  if (before === null && after === null) return '—'
  return `${before ?? '—'} → ${after ?? '—'}`
}

const MAX_MOVEMENT_NAMES = 3

export function SessionCard({ session }: { session: SessionDto }) {
  const startDate = formatDate(session.startedAt)
  const movementNames = session.movements.slice(0, MAX_MOVEMENT_NAMES).map((m) => m.movementName)
  const hiddenMovements = Math.max(0, session.movements.length - MAX_MOVEMENT_NAMES)

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <p className="text-sm font-medium">
            {startDate}
            {session.durationMin !== null && (
              <span className="text-muted-foreground"> · {session.durationMin} min</span>
            )}
          </p>
          {session.routineName && (
            <p className="text-sm text-muted-foreground">
              {session.routineSlug ? (
                <Link
                  to={`/routines/${session.routineSlug}`}
                  className="hover:text-foreground hover:underline"
                >
                  {session.routineName}
                </Link>
              ) : (
                session.routineName
              )}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <span
              className={cn('h-1.5 w-1.5 rounded-full', TRAFFIC_DOT[session.safetyTrafficLight])}
            />
            {TRAFFIC_LABEL[session.safetyTrafficLight]}
          </Badge>
          {session.safetyOverridden && (
            <Badge variant="destructive" className="text-[10px]">
              Override
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Dolor: <span className="font-mono text-foreground">{painFatigueLine(session.painBefore, session.painAfter)}</span>
        </span>
        <span>
          Fatiga: <span className="font-mono text-foreground">{painFatigueLine(session.fatigueBefore, session.fatigueAfter)}</span>
        </span>
      </div>

      {session.movements.length > 0 && (
        <div className="text-xs">
          <span className="text-muted-foreground">
            {session.movements.length} movimiento{session.movements.length !== 1 && 's'}:{' '}
          </span>
          <span>
            {movementNames.join(', ')}
            {hiddenMovements > 0 && (
              <span className="text-muted-foreground"> + {hiddenMovements} más</span>
            )}
          </span>
        </div>
      )}

      {session.generalState && (
        <p className="text-xs text-muted-foreground italic">{session.generalState}</p>
      )}

      {session.personalNotes && (
        <p className="text-xs text-foreground/80 line-clamp-2 border-l-2 border-border pl-3">
          {session.personalNotes}
        </p>
      )}
    </Card>
  )
}
