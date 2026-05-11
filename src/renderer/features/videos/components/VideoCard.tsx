import { AlertTriangle, Film, MapPin } from 'lucide-react'
import type { VideoDto } from '@shared/types/video'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { REVIEW_STATUS_LABEL, reviewStatusBadgeVariant } from './videoEnums'

interface Props {
  video: VideoDto
  onClick: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function VideoCard({ video, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer hover:border-foreground/30 transition-colors space-y-2.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{video.fileName}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Agregado {formatDate(video.createdAt)}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {video.fileMissing && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Archivo faltante
            </Badge>
          )}
          <Badge variant={reviewStatusBadgeVariant(video.reviewStatus)}>
            {REVIEW_STATUS_LABEL[video.reviewStatus]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {video.movement && (
          <Badge variant="outline" className="font-normal">
            {video.movement.name}
          </Badge>
        )}
        {video.spot && (
          <Badge variant="outline" className="font-normal gap-1">
            <MapPin className="h-3 w-3" />
            {video.spot.name}
          </Badge>
        )}
        {video.session && (
          <Badge variant="outline" className="font-normal">
            Sesión {formatDate(video.session.startedAt)}
          </Badge>
        )}
      </div>

      {video.notes && (
        <p className="text-sm text-muted-foreground line-clamp-2">{video.notes}</p>
      )}
    </Card>
  )
}
