import { Search, Star, X } from 'lucide-react'
import type {
  RecommendedLevel,
  SpotRiskLevel,
  SpotType
} from '@shared/types/spot'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  RECOMMENDED_LEVEL_OPTIONS,
  SPOT_RISK_OPTIONS,
  SPOT_TYPE_OPTIONS
} from './spotEnums'
import {
  DEFAULT_SPOT_FILTERS,
  type SpotFilters
} from '../lib/spotFilters'

interface Props {
  value: SpotFilters
  onChange: (next: SpotFilters) => void
}

export function SpotFiltersBar({ value, onChange }: Props) {
  const isDirty =
    value.search !== '' ||
    value.spotType !== 'all' ||
    value.riskLevel !== 'all' ||
    value.recommendedLevel !== 'all' ||
    value.favoritesOnly

  return (
    <div className="space-y-3">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, ubicación, tag…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={value.spotType}
          onValueChange={(v) =>
            onChange({ ...value, spotType: v as SpotType | 'all' })
          }
        >
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tipo: todos</SelectItem>
            {SPOT_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.riskLevel}
          onValueChange={(v) =>
            onChange({ ...value, riskLevel: v as SpotRiskLevel | 'all' })
          }
        >
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Riesgo: todos</SelectItem>
            {SPOT_RISK_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                Riesgo: {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.recommendedLevel}
          onValueChange={(v) =>
            onChange({
              ...value,
              recommendedLevel: v as RecommendedLevel | 'all'
            })
          }
        >
          <SelectTrigger className="h-9 w-auto min-w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Nivel: todos</SelectItem>
            {RECOMMENDED_LEVEL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={value.favoritesOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            onChange({ ...value, favoritesOnly: !value.favoritesOnly })
          }
          className="h-9"
        >
          <Star
            className={cn(
              'h-3.5 w-3.5',
              value.favoritesOnly && 'fill-current'
            )}
          />
          Favoritos
        </Button>

        {isDirty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_SPOT_FILTERS)}
            className="h-9 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
