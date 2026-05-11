import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LevelBadge } from '@/features/profile/components/LevelBadge'
import { useAssessments } from '../hooks/useAssessments'

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso)
  )

export function PastAssessments() {
  const { data, isLoading } = useAssessments()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">
            Todavía no hay evaluaciones registradas.
          </p>
        )}
        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium">{formatDate(a.createdAt)}</p>
                  {a.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{a.notes}</p>
                  )}
                </div>
                <LevelBadge level={a.computedLevel} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
