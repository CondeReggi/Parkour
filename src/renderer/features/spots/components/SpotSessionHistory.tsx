import { Link } from 'react-router-dom'
import { Clock, History } from 'lucide-react'
import type { SessionDto } from '@shared/types/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSessionsList } from '@/features/sessions/hooks/useSessions'
import { formatRelativeFromNow } from '../lib/spotFilters'

interface Props {
  spotId: string
}

const TL_LABEL: Record<SessionDto['safetyTrafficLight'], string> = {
  green: 'Verde',
  yellow: 'Ámbar',
  red: 'Rojo'
}

const TL_CLASS: Record<SessionDto['safetyTrafficLight'], string> = {
  green: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  yellow: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  red: 'bg-destructive/15 text-destructive border-destructive/30'
}

export function SpotSessionHistory({ spotId }: Props) {
  const { data: sessions, isLoading } = useSessionsList()
  const filtered = (sessions ?? [])
    .filter((s) => s.spotId === spotId)
    .slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Historial acá
          </CardTitle>
          <Badge variant="outline">{filtered.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no entrenaste acá. Cuando empieces una sesión asociada a
            este spot, va a aparecer en este historial.
          </p>
        )}
        {filtered.length > 0 && (
          <ul className="divide-y divide-border">
            {filtered.map((s) => {
              const when = formatRelativeFromNow(s.endedAt ?? s.startedAt)
              const date = new Date(s.endedAt ?? s.startedAt).toLocaleDateString()
              return (
                <li key={s.id} className="py-2">
                  <Link
                    to={`/progress`}
                    className="flex items-center justify-between gap-3 hover:text-foreground transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {s.routineName ?? 'Sesión libre'}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{date}</span>
                        {when && <span>· {when}</span>}
                        {s.durationMin && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {s.durationMin} min
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${TL_CLASS[s.safetyTrafficLight]}`}
                    >
                      {TL_LABEL[s.safetyTrafficLight]}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
