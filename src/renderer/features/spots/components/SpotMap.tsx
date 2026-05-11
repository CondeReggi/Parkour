import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Compass, MapPin, MapPinOff } from 'lucide-react'
import type { SpotDto } from '@shared/types/spot'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FALLBACK_CENTER,
  TILE_ATTRIBUTION,
  TILE_URL,
  ZOOM
} from '../lib/mapDefaults'
import {
  getCurrentLocationIcon,
  getFavoriteSpotIcon,
  getSpotIcon
} from '../lib/markerIcons'
import { isValidLatLng } from '../lib/mapUtils'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import { SpotMapPopup } from './SpotMapPopup'

interface Props {
  spots: SpotDto[]
  /** Altura visual del mapa. Default es 360px. */
  heightClassName?: string
}

/**
 * Mapa con todos los spots geolocalizados. Se centra primero en la
 * ubicación del usuario (si dio permiso) y si no, en el fallback
 * (Montevideo). Si hay varios spots con coordenadas válidas, ajusta
 * los bounds para verlos todos.
 *
 * Click en un marker abre un popup con el nombre, badges y links a
 * detalle / entrenar acá.
 */
export function SpotMap({ spots, heightClassName = 'h-[360px]' }: Props) {
  const { center, status, user, errorMessage } = useCurrentLocation()
  const geolocated = spots.filter((s) => isValidLatLng(s.latitude, s.longitude))

  // El primer center que pase al MapContainer es el que se usa al montar.
  // Si tenemos user location, la usamos; si no, fallback. Después un
  // efecto interno ajusta a los bounds de los spots cuando los hay.
  const initialCenter: [number, number] = user ?? center

  return (
    <div className="space-y-2">
      <div
        className={`relative overflow-hidden rounded-md border border-border ${heightClassName}`}
      >
        <MapContainer
          center={initialCenter}
          zoom={user ? ZOOM.user : ZOOM.fallback}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

          <FitToSpots spots={geolocated} userLocation={user} />

          {user && (
            <Marker position={user} icon={getCurrentLocationIcon()}>
              <Popup>Tu ubicación</Popup>
            </Marker>
          )}

          {geolocated.map((s) => (
            <Marker
              key={s.id}
              position={[s.latitude as number, s.longitude as number]}
              icon={s.isFavorite ? getFavoriteSpotIcon() : getSpotIcon()}
            >
              <Popup>
                <SpotMapPopup spot={s} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {status === 'denied' || status === 'unavailable' || status === 'error' ? (
            <>
              <MapPinOff className="h-3 w-3" />
              <span>{errorMessage ?? 'Sin ubicación: centramos en Montevideo.'}</span>
            </>
          ) : status === 'requesting' ? (
            <>
              <Compass className="h-3 w-3 animate-spin" />
              <span>Buscando ubicación…</span>
            </>
          ) : (
            <>
              <MapPin className="h-3 w-3" />
              <span>
                {geolocated.length} de {spots.length} spot
                {spots.length === 1 ? '' : 's'} con ubicación en el mapa
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Sub-componente que ajusta los bounds del mapa cuando cambia la lista
 * de spots geolocalizados. Tiene que vivir adentro de `<MapContainer>`
 * para acceder al instance vía `useMap()`.
 */
function FitToSpots({
  spots,
  userLocation
}: {
  spots: SpotDto[]
  userLocation: [number, number] | null
}) {
  const map = useMap()

  useEffect(() => {
    const points: L.LatLngExpression[] = []
    if (userLocation) points.push(userLocation)
    for (const s of spots) {
      if (s.latitude !== null && s.longitude !== null) {
        points.push([s.latitude, s.longitude])
      }
    }

    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0] as L.LatLngExpression, ZOOM.user, { animate: true })
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 16,
      animate: true
    })
  }, [spots, userLocation, map])

  return null
}

/**
 * Empty state visual cuando todavía no hay spots con coordenadas.
 * Se usa en SpotsPage debajo del mapa para invitar a crear uno.
 */
export function SpotMapEmptyOverlay({ onCreate }: { onCreate: () => void }) {
  return (
    <Alert>
      <AlertDescription className="flex items-center justify-between gap-3">
        <span className="text-sm">
          Ningún spot tiene ubicación guardada todavía. Creá uno y elegí
          el punto desde el mapa.
        </span>
        <Button type="button" size="sm" onClick={onCreate}>
          Crear spot
        </Button>
      </AlertDescription>
    </Alert>
  )
}
