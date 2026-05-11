import { X } from 'lucide-react'
import type { MainGoal } from '@shared/types/profile'
import type { RoutineLevel } from '@shared/types/routine'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { GOAL_LABEL, LEVEL_LABEL } from './RoutineMeta'

export interface RoutineFilterState {
  goal: MainGoal | 'all'
  level: RoutineLevel | 'all'
}

export const defaultFilters: RoutineFilterState = {
  goal: 'all',
  level: 'all'
}

const GOAL_OPTIONS: { value: MainGoal | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los objetivos' },
  ...(Object.entries(GOAL_LABEL).map(([value, label]) => ({
    value: value as MainGoal,
    label
  })))
]

const LEVEL_OPTIONS: { value: RoutineLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los niveles' },
  ...(Object.entries(LEVEL_LABEL).map(([value, label]) => ({
    value: value as RoutineLevel,
    label
  })))
]

interface Props {
  value: RoutineFilterState
  onChange: (next: RoutineFilterState) => void
}

export function RoutineFilters({ value, onChange }: Props) {
  const isFiltered = value.goal !== 'all' || value.level !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Select
        value={value.goal}
        onValueChange={(v) => onChange({ ...value, goal: v as RoutineFilterState['goal'] })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GOAL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.level}
        onValueChange={(v) => onChange({ ...value, level: v as RoutineFilterState['level'] })}
      >
        <SelectTrigger className="w-[180px]">
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
