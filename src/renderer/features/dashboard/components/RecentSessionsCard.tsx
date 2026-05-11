import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { SessionDto, SessionTrafficLight } from '@shared/types/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TRAFFIC_DOT: Record<SessionTrafficLight, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500'
}

const MAX_ITEMS = 3

function relativeDateTime(iso: string): string {
  const d = new Date(iso)
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(d)
}

export function RecentSessionsCard({ sessions }: { sessions: SessionDto[] }) {
  const recent = sessions.slice(0, MAX_ITEMS)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimos entrenamientos</CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/progress">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no registraste ningún entrenamiento.
          </p>
        ) : (
          <ul className="space-y-3">
            {recent.map((s) => (
              <li key={s.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full mt-2 flex-shrink-0',
                    TRAFFIC_DOT[s.safetyTrafficLight]
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {relativeDateTime(s.startedAt)}
                    {s.durationMin !== null && (
                      <span className="text-muted-foreground"> · {s.durationMin} min</span>
                    )}
                  </p>
                  {s.routineName && (
                    <p className="text-xs text-muted-foreground truncate">{s.routineName}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
