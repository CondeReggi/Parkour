/**
 * Helpers de mapa puros (sin React, sin Leaflet imports caros).
 */

export function isValidLat(lat: number | null | undefined): lat is number {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90
}

export function isValidLng(lng: number | null | undefined): lng is number {
  return (
    typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180
  )
}

export function isValidLatLng(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  return isValidLat(lat) && isValidLng(lng)
}

/**
 * Formato corto para mostrar coordenadas: 5 decimales son ~1 metro de
 * precisión, suficiente para un spot.
 */
export function formatLatLng(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

/**
 * URL externa a OpenStreetMap mostrando el marcador. Funciona en
 * cualquier navegador sin API key. La app abre el link con el handler
 * de URLs del SO (Electron + target=_blank).
 */
export function externalMapsUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
}
