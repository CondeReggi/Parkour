import { useNavigate } from 'react-router-dom'
import { Activity, ImageOff, MapPin, Star } from 'lucide-react'
import type { SpotDto } from '@shared/types/spot'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSetSpotFavorite } from '../hooks/useSpotMutations'
import { spotPhotoMediaUrl } from '../lib/mediaUrl'
import { formatRelativeFromNow } from '../lib/spotFilters'
import {
  RECOMMENDED_LEVEL_LABEL,
  RISK_BADGE_VARIANT,
  RISK_LABEL,
  SPOT_TYPE_LABEL
} from './spotEnums'

export function SpotCard({ spot }: { spot: SpotDto }) {
  const navigate = useNavigate()
  const favMut = useSetSpotFavorite()

  const cover = spot.photos[0]
  const coverMissing = cover ? cover.fileMissing : false
  const lastTrained = formatRelativeFromNow(spot.lastTrainedAt)

  function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    favMut.mutate({ id: spot.id, isFavorite: !spot.isFavorite })
  }

  return (
    <Card
      onClick={() => navigate(`/spots/${spot.id}`)}
      className="overflow-hidden hover:border-primary/40 transition-colors cursor-pointer group"
    >
      {/* Cover: foto si hay, placeholder con gradient si no */}
      <div className="relative h-36 bg-gradient-to-br from-primary/15 via-secondary to-secondary/50 overflow-hidden">
        {cover && !coverMissing && (
          <img
            src={spotPhotoMediaUrl(cover.id)}
            alt={cover.caption ?? spot.name}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        )}
        {cover && coverMissing && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/70 gap-2 text-xs">
            <ImageOff className="h-4 w-4" />
            Foto no disponible
          </div>
        )}
        {!cover && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
            <MapPin className="h-10 w-10" />
          </div>
        )}

        {/* Estrella favorito en esquina */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={favMut.isPending}
          className={cn(
            'absolute top-2 right-2 h-8 w-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors',
            spot.isFavorite
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-background/70 text-muted-foreground hover:text-foreground hover:bg-background/90'
          )}
          aria-label={spot.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        >
          <Star
            className={cn('h-4 w-4', spot.isFavorite && 'fill-current')}
          />
        </button>

        {/* Badges flotantes inferiores */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
          {spot.spotType && (
            <Badge variant="secondary" className="text-[10px] backdrop-blur-md bg-background/80">
              {SPOT_TYPE_LABEL[spot.spotType]}
            </Badge>
          )}
          <Badge
            variant={RISK_BADGE_VARIANT(spot.riskLevel)}
            className="text-[10px] backdrop-blur-md"
          >
            Riesgo: {RISK_LABEL[spot.riskLevel]}
          </Badge>
          {spot.recommendedLevel && (
            <Badge variant="outline" className="text-[10px] backdrop-blur-md bg-background/80">
              {RECOMMENDED_LEVEL_LABEL[spot.recommendedLevel]}
            </Badge>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-4 space-y-2.5">
        <div>
          <div className="font-semibold tracking-tight truncate">{spot.name}</div>
          {spot.locationText && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{spot.locationText}</span>
            </p>
          )}
        </div>

        {spot.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {spot.description}
          </p>
        )}

        {spot.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {spot.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded"
              >
                #{t}
              </span>
            ))}
            {spot.tags.length > 4 && (
              <span className="text-[10px] text-muted-foreground/70">
                +{spot.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {spot.sessionCount} sesi{spot.sessionCount === 1 ? 'ón' : 'ones'}
          </span>
          <span>
            {spot.obstacles.length} obst · {spot.idealMovements.length} mov
          </span>
          <span>{lastTrained ?? 'sin entrenar'}</span>
        </div>
      </div>
    </Card>
  )
}

/** Empty state reutilizable cuando una página de spots queda sin filas. */
export function SpotsEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <Card className="p-8 text-center space-y-3">
      <div className="mx-auto h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
        <MapPin className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Sin spots todavía</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tus lugares de entrenamiento favoritos viven acá.
        </p>
      </div>
      {onCreate && (
        <Button onClick={onCreate} size="sm">
          Crear el primero
        </Button>
      )}
    </Card>
  )
}
