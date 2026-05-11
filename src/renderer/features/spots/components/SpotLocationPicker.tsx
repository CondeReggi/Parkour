import { useEffect, useMemo } from 'react'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents
} from 'react-leaflet'
import { Compass, MapPin, MapPinOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FALLBACK_CENTER,
  TILE_ATTRIBUTION,
  TILE_URL,
  ZOOM
} from '../lib/mapDefaults'
import { getSpotIcon } from '../lib/markerIcons'
import { formatLatLng, isValidLatLng } from '../lib/mapUtils'
import { useCurrentLocation } from '../hooks/useCurrentLocation'

interface Props {
  /** Coordenadas seleccionadas actualmente, o null si no se eligió ninguna. */
  value: { latitude: number; longitude: number } | null
  /** Notifica al form. `null` = el usuario quitó la coordenada. */
  onChange: (next: { latitude: number; longitude: number } | null) => void
  heightClassName?: string
}

/**
 * Mapa interactivo para elegir/mover el punto de un spot.
 *
 * UX:
 *  - Si no hay coords elegidas, arrancamos en la ubicación del usuario
 *    (si dio permiso) o en el fallback. El marcador aparece sólo cuando
 *    se hace el primer click.
 *  - Si ya hay coords, centramos ahí y mostramos el marcador.
 *  - Cada click reemplaza la posición del marcador.
 *  - Botón "Quitar" para volver a null.
 */
export function SpotLocationPicker({
  value,
  onChange,
  heightClassName = 'h-[320px]'
}: Props) {
  const { center, status, user, errorMessage } = useCurrentLocation()

  // Centro inicial: coords del spot existente > user location > fallback.
  // Sólo se evalúa al montar; los cambios posteriores los maneja el
  // sub-componente `RecenterOnUser`.
  const initialCenter: [number, number] = useMemo(() => {
    if (value && isValidLatLng(value.latitude, value.longitude)) {
      return [value.latitude, value.longitude]
    }
    if (user) return user
    return center
  }, [value, user, center])

  return (
    <div className="space-y-2">
      <div
        className={`relative overflow-hidden rounded-md border border-border ${heightClassName}`}
      >
        <MapContainer
          center={initialCenter}
          zoom={value ? ZOOM.picker : user ? ZOOM.user : ZOOM.fallback}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

          <ClickToPlace
            value={value}
            onChange={onChange}
          />
          {/* Re-centra si llega user location después del mount y todavía
              no hay un punto elegido. */}
          <RecenterOnUserIfEmpty value={value} userLocation={user} />

          {value && (
            <Marker
              position={[value.latitude, value.longitude]}
              icon={getSpotIcon()}
            />
          )}
        </MapContainer>

        {/* Banner de instrucciones encima del mapa: chico, no tapa. */}
        <div className="pointer-events-none absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          <span className="pointer-events-auto rounded-md bg-background/85 backdrop-blur-sm text-xs px-2 py-1 border border-border shadow">
            Hacé click en el mapa para marcar el spot.
          </span>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="pointer-events-auto h-7 bg-background/85 backdrop-blur-sm border border-border"
            >
              <X className="h-3.5 w-3.5" />
              Quitar
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {value ? (
            <>
              <MapPin className="h-3 w-3 text-primary" />
              <span className="tabular-nums">
                {formatLatLng(value.latitude, value.longitude)}
              </span>
            </>
          ) : status === 'denied' ||
            status === 'unavailable' ||
            status === 'error' ? (
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
              <span>Sin punto elegido. Hacé click en el mapa.</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Captura clicks en el mapa y delega al onChange del padre. No renderiza
 * nada visible; tiene que estar adentro de `<MapContainer>` para que
 * `useMapEvents` enganche al instance correcto.
 */
function ClickToPlace({
  value: _value,
  onChange
}: {
  value: { latitude: number; longitude: number } | null
  onChange: (next: { latitude: number; longitude: number } | null) => void
}) {
  useMapEvents({
    click(e) {
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    }
  })
  return null
}

/**
 * Cuando llega la ubicación del usuario y todavía no se eligió un punto,
 * recentramos el mapa sobre ella. Si el usuario ya marcó un punto, no
 * tocamos la vista (sería molesto que se mueva sola).
 */
function RecenterOnUserIfEmpty({
  value,
  userLocation
}: {
  value: { latitude: number; longitude: number } | null
  userLocation: [number, number] | null
}) {
  const map = useMap()
  useEffect(() => {
    if (value) return
    if (!userLocation) return
    map.setView(userLocation, ZOOM.user, { animate: true })
  }, [map, userLocation, value])
  return null
}
