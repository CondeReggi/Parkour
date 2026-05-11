import { Search, X } from 'lucide-react'
import type { VideoReviewStatus } from '@shared/types/video'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { REVIEW_STATUS_OPTIONS } from './videoEnums'

const MOVEMENT_ALL = 'all'
const MOVEMENT_NONE = '__none__'

export interface VideoFilterState {
  search: string
  reviewStatus: VideoReviewStatus | 'all'
  /** 'all' | '__none__' (sin movimiento) | id de movimiento */
  movement: string
}

export const defaultVideoFilters: VideoFilterState = {
  search: '',
  reviewStatus: 'all',
  movement: MOVEMENT_ALL
}

const REVIEW_OPTIONS: { value: VideoFilterState['reviewStatus']; label: string }[] = [
  { value: 'all', label: 'Cualquier estado' },
  ...REVIEW_STATUS_OPTIONS
]

interface Props {
  value: VideoFilterState
  onChange: (next: VideoFilterState) => void
}

export function VideoFilters({ value, onChange }: Props) {
  const movementsQ = useMovements()
  const isFiltered =
    value.search !== '' ||
    value.reviewStatus !== 'all' ||
    value.movement !== MOVEMENT_ALL

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar en archivo o notas…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="pl-8"
        />
      </div>

      <Select
        value={value.reviewStatus}
        onValueChange={(v) =>
          onChange({
            ...value,
            reviewStatus: v as VideoFilterState['reviewStatus']
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REVIEW_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.movement}
        onValueChange={(v) => onChange({ ...value, movement: v })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={MOVEMENT_ALL}>Cualquier movimiento</SelectItem>
          <SelectItem value={MOVEMENT_NONE}>Sin movimiento</SelectItem>
          {(movementsQ.data ?? []).map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(defaultVideoFilters)}
          aria-label="Limpiar filtros"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export function applyVideoFilters<T extends {
  fileName: string
  notes: string | null
  whatWentWell: string | null
  whatWentWrong: string | null
  reviewStatus: VideoReviewStatus
  movement: { id: string } | null
}>(videos: T[], filters: VideoFilterState): T[] {
  const q = filters.search.trim().toLowerCase()
  return videos.filter((v) => {
    if (filters.reviewStatus !== 'all' && v.reviewStatus !== filters.reviewStatus) {
      return false
    }
    if (filters.movement === MOVEMENT_NONE) {
      if (v.movement) return false
    } else if (filters.movement !== MOVEMENT_ALL) {
      if (v.movement?.id !== filters.movement) return false
    }
    if (q) {
      const haystack = [
        v.fileName,
        v.notes ?? '',
        v.whatWentWell ?? '',
        v.whatWentWrong ?? ''
      ]
        .join('\n')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}
