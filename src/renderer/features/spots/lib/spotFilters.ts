/**
 * Funciones puras de filtrado para la lista de spots. Mantenerlas
 * separadas de la página facilita el testing y deja el componente sólo
 * para layout y estado de UI.
 */

import type {
  RecommendedLevel,
  SpotDto,
  SpotRiskLevel,
  SpotType
} from '@shared/types/spot'

export interface SpotFilters {
  search: string
  spotType: SpotType | 'all'
  riskLevel: SpotRiskLevel | 'all'
  recommendedLevel: RecommendedLevel | 'all'
  favoritesOnly: boolean
}

export const DEFAULT_SPOT_FILTERS: SpotFilters = {
  search: '',
  spotType: 'all',
  riskLevel: 'all',
  recommendedLevel: 'all',
  favoritesOnly: false
}

export function applySpotFilters(
  spots: SpotDto[],
  filters: SpotFilters
): SpotDto[] {
  const search = filters.search.trim().toLowerCase()
  return spots.filter((s) => {
    if (filters.favoritesOnly && !s.isFavorite) return false
    if (filters.spotType !== 'all' && s.spotType !== filters.spotType) return false
    if (filters.riskLevel !== 'all' && s.riskLevel !== filters.riskLevel) return false
    if (
      filters.recommendedLevel !== 'all' &&
      s.recommendedLevel !== filters.recommendedLevel
    ) {
      return false
    }
    if (search) {
      const haystack = [
        s.name,
        s.locationText ?? '',
        s.description ?? '',
        s.notes ?? '',
        ...s.tags
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

/**
 * Frase corta tipo "hace 3 días" / "hoy" / "hace 2 semanas". Pensada para
 * usarse en cards y headers; no necesita ser exacta.
 */
export function formatRelativeFromNow(isoDate: string | null): string | null {
  if (!isoDate) return null
  const d = new Date(isoDate)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'recién'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `hace ${diffHr} h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 0) return 'hoy'
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay} días`
  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 5) return `hace ${diffWeek} sem`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `hace ${diffMonth} m`
  const diffYear = Math.floor(diffDay / 365)
  return `hace ${diffYear} a`
}
