import type { MovementCategory } from '@shared/types/movement'
import type { InsightTone } from '@shared/types/progressInsights'

export const CATEGORY_LABEL: Record<MovementCategory, string> = {
  landing: 'Aterrizajes',
  vault: 'Vaults',
  climb: 'Climbs',
  balance: 'Balance',
  precision: 'Precisión',
  wall: 'Pared',
  core: 'Core'
}

/** Devuelve clases de Tailwind para el tono del insight (borde + texto). */
export function insightToneClasses(tone: InsightTone): string {
  switch (tone) {
    case 'positive':
      return 'border-emerald-500/30 bg-emerald-500/5'
    case 'warning':
      return 'border-amber-500/30 bg-amber-500/5'
    case 'neutral':
    default:
      return 'border-border bg-secondary/30'
  }
}

export function insightIconColor(tone: InsightTone): string {
  switch (tone) {
    case 'positive':
      return 'text-emerald-500'
    case 'warning':
      return 'text-amber-500'
    case 'neutral':
    default:
      return 'text-muted-foreground'
  }
}

/**
 * "Hace X días" / "hoy" / "ayer" para mostrar last practiced. Versión
 * mínima — para usos más sofisticados ya está formatRelativeFromNow en
 * features/spots/lib/spotFilters.ts, pero acá no queremos cross-feature
 * imports.
 */
export function relativeFromNow(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diffDay = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDay <= 0) return 'hoy'
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay} días`
  const weeks = Math.floor(diffDay / 7)
  if (weeks < 5) return `hace ${weeks} sem`
  const months = Math.floor(diffDay / 30)
  return `hace ${months} m`
}
