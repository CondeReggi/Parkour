import { ExternalLink, MapPin, MapPinOff } from 'lucide-react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import type { SpotDto } from '@shared/types/spot'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TILE_ATTRIBUTION,
  TILE_URL,
  ZOOM
} from '../lib/mapDefaults'
import { externalMapsUrl, formatLatLng, isValidLatLng } from '../lib/mapUtils'
import { getFavoriteSpotIcon, getSpotIcon } from '../lib/markerIcons'

interface Props {
  spot: SpotDto
}

/**
 * Sección "Ubicación" del detalle del spot. Muestra un mini-mapa con el
 * marker del spot, las coordenadas en texto y un link al mapa externo
 * (OpenStreetMap).
 */
export function SpotLocationCard({ spot }: Props) {
  const hasCoords = isValidLatLng(spot.latitude, spot.longitude)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Ubicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasCoords && (
          <div className="rounded-md border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <MapPinOff className="h-5 w-5" />
            Este spot todavía no tiene ubicación en el mapa. Editalo y elegí
            un punto.
          </div>
        )}

        {hasCoords && (
          <>
            <div className="relative h-[240px] overflow-hidden rounded-md border border-border">
              <MapContainer
                center={[spot.latitude as number, spot.longitude as number]}
                zoom={ZOOM.detail}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution={TILE_ATTRIBUTION}
                  url={TILE_URL}
                />
                <Marker
                  position={[
                    spot.latitude as number,
                    spot.longitude as number
                  ]}
                  icon={spot.isFavorite ? getFavoriteSpotIcon() : getSpotIcon()}
                />
              </MapContainer>
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 tabular-nums">
                <MapPin className="h-3 w-3 text-primary" />
                {formatLatLng(
                  spot.latitude as number,
                  spot.longitude as number
                )}
              </span>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
              >
                <a
                  href={externalMapsUrl(
                    spot.latitude as number,
                    spot.longitude as number
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir en mapa externo
                </a>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
