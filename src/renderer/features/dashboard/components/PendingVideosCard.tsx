import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Film, Plus, Video } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVideos } from '@/features/videos/hooks/useVideos'
import { DashboardCardSkeleton } from './DashboardCardSkeleton'

const MAX_ITEMS = 4

export function PendingVideosCard() {
  const { data, isLoading } = useVideos()

  if (isLoading) return <DashboardCardSkeleton lines={4} />

  const all = data ?? []
  const pending = all.filter((v) => v.reviewStatus === 'pending')
  const visible = pending.slice(0, MAX_ITEMS)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            Por revisar
          </CardTitle>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <Badge variant="outline" className="tabular-nums">
                {pending.length}
              </Badge>
            )}
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/videos">
                Ir a videos <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {all.length === 0 && (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
              <Video className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Sumá tu primer video para empezar a revisar tus intentos.
            </p>
            <Button asChild size="sm">
              <Link to="/videos">
                <Plus className="h-4 w-4" />
                Subir un video
              </Link>
            </Button>
          </div>
        )}

        {all.length > 0 && pending.length === 0 && (
          <div className="text-center py-4 space-y-2">
            <div className="mx-auto h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Tenés todos los videos revisados. Buen trabajo.
            </p>
          </div>
        )}

        {visible.length > 0 && (
          <ul className="space-y-2">
            {visible.map((v) => (
              <li key={v.id}>
                <Link
                  to="/videos"
                  className="flex items-center gap-2.5 p-2 -mx-2 rounded-md hover:bg-accent/40 transition-colors"
                >
                  <div className="h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Film className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {v.fileName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {v.movement?.name ?? 'Sin movimiento'}
                      {v.spot ? ` · ${v.spot.name}` : ''}
                    </p>
                  </div>
                  {v.fileMissing && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] flex-shrink-0"
                    >
                      Faltante
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {pending.length > MAX_ITEMS && (
          <p className="text-[11px] text-muted-foreground text-center pt-2">
            +{pending.length - MAX_ITEMS} más
          </p>
        )}
      </CardContent>
    </Card>
  )
}
