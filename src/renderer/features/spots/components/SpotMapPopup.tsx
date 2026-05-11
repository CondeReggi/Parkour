import { Link } from 'react-router-dom'
import { ChevronRight, PlayCircle, Star } from 'lucide-react'
import type { SpotDto } from '@shared/types/spot'
import { Badge } from '@/components/ui/badge'
import {
  RECOMMENDED_LEVEL_LABEL,
  RISK_BADGE_VARIANT,
  RISK_LABEL,
  SPOT_TYPE_LABEL
} from './spotEnums'

interface Props {
  spot: SpotDto
}

/**
 * Contenido del popup que aparece al clickear un marker en el mapa.
 * No depende de Leaflet — se monta como children de `<Popup>` y Leaflet
 * lo renderiza en el portal del popup.
 *
 * Mantiene la estética del sistema (badges + links) para que se sienta
 * parte de la app y no un widget separado.
 */
export function SpotMapPopup({ spot }: Props) {
  return (
    <div className="space-y-2 min-w-[200px] max-w-[260px]">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{spot.name}</p>
          {spot.isFavorite && (
            <Star className="h-3.5 w-3.5 text-primary fill-current flex-shrink-0" />
          )}
        </div>
        {spot.locationText && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">
            {spot.locationText}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {spot.spotType && (
          <Badge variant="secondary" className="text-[10px]">
            {SPOT_TYPE_LABEL[spot.spotType]}
          </Badge>
        )}
        <Badge
          variant={RISK_BADGE_VARIANT(spot.riskLevel)}
          className="text-[10px]"
        >
          Riesgo: {RISK_LABEL[spot.riskLevel]}
        </Badge>
        {spot.recommendedLevel && (
          <Badge variant="outline" className="text-[10px]">
            {RECOMMENDED_LEVEL_LABEL[spot.recommendedLevel]}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Link
          to={`/spots/${spot.id}`}
          className="flex-1 inline-flex items-center justify-between gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ver detalle
          <ChevronRight className="h-3 w-3" />
        </Link>
        <Link
          to={`/training?spotId=${encodeURIComponent(spot.id)}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <PlayCircle className="h-3 w-3" />
          Entrenar acá
        </Link>
      </div>
    </div>
  )
}
