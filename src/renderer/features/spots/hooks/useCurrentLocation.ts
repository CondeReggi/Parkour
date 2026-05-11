import { useEffect, useState } from 'react'
import { FALLBACK_CENTER } from '../lib/mapDefaults'

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error'

export interface LocationResult {
  /** Coordenadas a usar para inicializar el mapa. Nunca es null. */
  center: [number, number]
  /** Si las coordenadas son del usuario o del fallback. */
  status: LocationStatus
  /** Mensaje legible si algo falló. */
  errorMessage: string | null
  /** Latitud y longitud reales del usuario, o null si no las tenemos. */
  user: [number, number] | null
}

/**
 * Encapsula `navigator.geolocation.getCurrentPosition` con manejo de
 * estados (idle / requesting / granted / denied / unavailable / error).
 * Siempre devuelve un `center` usable: si no hay user location, usa el
 * fallback de Montevideo.
 *
 * Notas:
 *  - En Electron el prompt de permisos puede aparecer la primera vez.
 *    Si el usuario rechaza, el browser recuerda el rechazo y el hook
 *    queda en 'denied' para siempre hasta que cambie permisos del SO.
 *  - El hook NO bloquea el render: el primer paint es con `idle` (que
 *    ya tiene fallback como center) y al resolver actualiza.
 */
export function useCurrentLocation(options?: {
  /** Si false, no pide automáticamente. Útil para pedirlo bajo demanda. */
  autoRequest?: boolean
}): LocationResult {
  const autoRequest = options?.autoRequest ?? true

  const [user, setUser] = useState<[number, number] | null>(null)
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!autoRequest) return
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable')
      setErrorMessage('La geolocalización no está disponible en este equipo.')
      return
    }

    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUser([latitude, longitude])
        setStatus('granted')
        setErrorMessage(null)
      },
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err.code === 1) {
          setStatus('denied')
          setErrorMessage('Sin permiso de ubicación. Usamos un centro por defecto.')
        } else if (err.code === 2) {
          setStatus('unavailable')
          setErrorMessage('No se pudo obtener la ubicación.')
        } else {
          setStatus('error')
          setErrorMessage(err.message || 'Error al obtener la ubicación.')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000
      }
    )
  }, [autoRequest])

  return {
    center: user ?? FALLBACK_CENTER,
    status,
    errorMessage,
    user
  }
}
