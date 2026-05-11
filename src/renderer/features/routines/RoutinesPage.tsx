import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRecommendedRoutine, useRoutines } from './hooks/useRoutines'
import { RoutineCard } from './components/RoutineCard'
import { RecommendedRoutineCard } from './components/RecommendedRoutineCard'
import {
  defaultFilters,
  RoutineFilters,
  type RoutineFilterState
} from './components/RoutineFilters'

export function RoutinesPage() {
  const { data: routines, isLoading, error } = useRoutines()
  const { data: recommendation, isLoading: recLoading } = useRecommendedRoutine()
  const [filters, setFilters] = useState<RoutineFilterState>(defaultFilters)

  const filtered = useMemo(() => {
    if (!routines) return []
    return routines.filter((r) => {
      if (filters.goal !== 'all' && r.goal !== filters.goal) return false
      if (filters.level !== 'all' && r.level !== filters.level) return false
      return true
    })
  }, [routines, filters])

  return (
    <div className="px-8 py-6 max-w-3xl">
      <PageHeader
        title="Rutinas"
        description="Rutinas precargadas. Click en una para ver los bloques y empezar a entrenar."
      >
        <Badge variant="outline">
          {isLoading ? '...' : `${filtered.length} / ${routines?.length ?? 0}`}
        </Badge>
      </PageHeader>

      <div className="space-y-6">
        {!recLoading && recommendation && (
          <RecommendedRoutineCard recommendation={recommendation} />
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : String(error)}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <RoutineFilters value={filters} onChange={setFilters} />

          {isLoading && (
            <p className="text-muted-foreground text-sm">Cargando rutinas…</p>
          )}

          {!isLoading && filtered.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground text-center">
              No hay rutinas que coincidan con los filtros.
            </Card>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="grid gap-3">
              {filtered.map((r) => (
                <RoutineCard key={r.id} routine={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
