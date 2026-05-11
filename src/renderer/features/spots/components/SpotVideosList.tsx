import { Link } from 'react-router-dom'
import { Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useVideos } from '@/features/videos/hooks/useVideos'
import { formatRelativeFromNow } from '../lib/spotFilters'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Sin revisar',
  reviewed: 'Revisado',
  improved: 'Mejora visible'
}

export function SpotVideosList({ spotId }: { spotId: string }) {
  const { data: videos, isLoading } = useVideos()
  const filtered = (videos ?? []).filter((v) => v.spot?.id === spotId)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-4 w-4 text-muted-foreground" />
            Videos asociados
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
            No tenés videos asociados a este spot. Cuando subas uno y lo
            asocies, va a aparecer acá.
          </p>
        )}
        {filtered.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((v) => (
              <li key={v.id}>
                <Link
                  to="/videos"
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {v.fileName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {v.movement?.name ?? 'Sin movimiento'} ·{' '}
                      {formatRelativeFromNow(v.recordedAt ?? v.createdAt)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      v.reviewStatus === 'improved'
                        ? 'default'
                        : v.reviewStatus === 'reviewed'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-[10px]"
                  >
                    {STATUS_LABEL[v.reviewStatus] ?? v.reviewStatus}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
