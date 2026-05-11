import { Search, X } from 'lucide-react'
import type {
  MovementCategory,
  MovementLevel
} from '@shared/types/movement'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

/**
 * Estado unificado de filtros. `learningStatus` mezcla los 4 valores que
 * el usuario espera: available / locked / practicing / mastered. La
 * derivación (qué es available vs locked) la hace MovementsPage con la
 * función pura de learning-path.
 */
export type LearningStatusFilter =
  | 'all'
  | 'available'
  | 'locked'
  | 'practicing'
  | 'mastered'

export type RiskFilter = 'all' | 'low' | 'medium' | 'high'

export type DifficultyFilter = 'all' | '1' | '2' | '3' | '4' | '5'

export interface MovementFilterState {
  search: string
  category: MovementCategory | 'all'
  level: MovementLevel | 'all'
  learningStatus: LearningStatusFilter
  difficulty: DifficultyFilter
  risk: RiskFilter
}

export const defaultFilters: MovementFilterState = {
  search: '',
  category: 'all',
  level: 'all',
  learningStatus: 'all',
  difficulty: 'all',
  risk: 'all'
}

const CATEGORY_OPTIONS: { value: MovementFilterState['category']; label: string }[] = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'landing', label: 'Aterrizaje' },
  { value: 'vault', label: 'Vault' },
  { value: 'climb', label: 'Climb' },
  { value: 'balance', label: 'Balance' },
  { value: 'precision', label: 'Precisión' },
  { value: 'wall', label: 'Wall' },
  { value: 'core', label: 'Core' }
]

const LEVEL_OPTIONS: { value: MovementFilterState['level']; label: string }[] = [
  { value: 'all', label: 'Todos los niveles' },
  { value: 'beginner', label: 'Principiante' },
  { value: 'base', label: 'Base' },
  { value: 'intermediate', label: 'Intermedio' }
]

const STATUS_OPTIONS: { value: LearningStatusFilter; label: string }[] = [
  { value: 'all', label: 'Cualquier estado' },
  { value: 'available', label: 'Disponible para aprender' },
  { value: 'practicing', label: 'En práctica' },
  { value: 'mastered', label: 'Dominado' },
  { value: 'locked', label: 'Bloqueado' }
]

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'Cualquier dificultad' },
  { value: '1', label: 'Dif 1' },
  { value: '2', label: 'Dif 2' },
  { value: '3', label: 'Dif 3' },
  { value: '4', label: 'Dif 4' },
  { value: '5', label: 'Dif 5' }
]

const RISK_OPTIONS: { value: RiskFilter; label: string }[] = [
  { value: 'all', label: 'Cualquier riesgo' },
  { value: 'low', label: 'Riesgo bajo (≤ 1)' },
  { value: 'medium', label: 'Riesgo medio (2-3)' },
  { value: 'high', label: 'Riesgo alto (4+)' }
]

interface Props {
  value: MovementFilterState
  onChange: (next: MovementFilterState) => void
}

export function MovementFilters({ value, onChange }: Props) {
  const isFiltered =
    value.search !== '' ||
    value.category !== 'all' ||
    value.level !== 'all' ||
    value.learningStatus !== 'all' ||
    value.difficulty !== 'all' ||
    value.risk !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nombre o tag…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="pl-8"
        />
      </div>

      <Select
        value={value.category}
        onValueChange={(v) =>
          onChange({ ...value, category: v as MovementFilterState['category'] })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.level}
        onValueChange={(v) =>
          onChange({ ...value, level: v as MovementFilterState['level'] })
        }
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LEVEL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.learningStatus}
        onValueChange={(v) =>
          onChange({ ...value, learningStatus: v as LearningStatusFilter })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.difficulty}
        onValueChange={(v) =>
          onChange({ ...value, difficulty: v as DifficultyFilter })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIFFICULTY_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.risk}
        onValueChange={(v) => onChange({ ...value, risk: v as RiskFilter })}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RISK_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(defaultFilters)}
          aria-label="Limpiar filtros"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
