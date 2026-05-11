/**
 * Defaults del mapa de spots. Centralizado acá para que la lista, el
 * picker y el detalle compartan los mismos centros y zooms.
 */

/**
 * Fallback razonable cuando el usuario no permitió ubicación: centro
 * aproximado de Montevideo, Uruguay.
 */
export const FALLBACK_CENTER: [number, number] = [-34.9011, -56.1645]

export const ZOOM = {
  /** Cuando arrancamos en la ciudad/región fallback, sin user location. */
  fallback: 12,
  /** Cuando tenemos la ubicación del usuario: más cerca. */
  user: 14,
  /** Mapa del detalle: vemos la zona del spot puntual. */
  detail: 16,
  /** Picker en form: cercano para poder elegir bien el punto. */
  picker: 16
} as const

/**
 * Tile layer de OpenStreetMap. URL pública estándar. La attribution es
 * obligatoria por su licencia (ODbL).
 */
export const TILE_URL =
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
