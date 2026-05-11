import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MotionPage } from '@/components/motion/MotionPage'
import { MotionList, MotionListItem } from '@/components/motion/MotionList'
import { useActiveProfile } from '@/features/profile/hooks/useActiveProfile'
import { computeLearningStatuses } from '@/features/learningPath/lib/learningPathStatus'
import { useMovements } from './hooks/useMovements'
import { MovementCard } from './components/MovementCard'
import {
  defaultFilters,
  MovementFilters,
  type MovementFilterState
} from './components/MovementFilters'
import type { MovementDto } from '@shared/types/movement'

function riskBucket(count: number): 'low' | 'medium' | 'high' {
  if (count >= 4) return 'high'
  if (count >= 2) return 'medium'
  return 'low'
}

export function MovementsPage() {
  const { data: profile } = useActiveProfile()
  const { data: movements, isLoading, error } = useMovements()
  const [filters, setFilters] = useState<MovementFilterState>(defaultFilters)

  const namesBySlug = useMemo(() => {
    const m = new Map<string, string>()
    for (const mv of movements ?? []) m.set(mv.slug, mv.name)
    return m
  }, [movements])

  // Cálculo de status (available / locked / practicing / mastered)
  // reutilizando la función pura del learning-path.
  const infoBySlug = useMemo(() => {
    if (!movements || !profile) return new Map()
    return computeLearningStatuses(movements, profile.level)
  }, [movements, profile])

  const filtered: MovementDto[] = useMemo(() => {
    if (!movements) return []
    const q = filters.search.trim().toLowerCase()
    return movements.filter((m) => {
      if (filters.category !== 'all' && m.category !== filters.category) return false
      if (filters.level !== 'all' && m.requiredLevel !== filters.level) return false

      if (filters.difficulty !== 'all') {
        if (String(m.difficulty) !== filters.difficulty) return false
      }

      if (filters.risk !== 'all') {
        if (riskBucket(m.risks.length) !== filters.risk) return false
      }

      if (filters.learningStatus !== 'all') {
        const info = infoBySlug.get(m.slug)
        if (!info) return false
        if (info.status !== filters.learningStatus) return false
      }

      if (q) {
        const hayName = m.name.toLowerCase().includes(q)
        const hayTag = m.tags.some((t) => t.toLowerCase().includes(q))
        const hayDesc = m.description.toLowerCase().includes(q)
        if (!hayName && !hayTag && !hayDesc) return false
      }
      return true
    })
  }, [movements, filters, infoBySlug])

  const total = movements?.length ?? 0
  const showingFiltered = filtered.length !== total

  return (
    <MotionPage className="px-8 py-6">
      <PageHeader
        title="Biblioteca de movimientos"
        description="Filtrá por estado, categoría o dificultad. Tocá una card para entrar al detalle."
      >
        <Badge variant="outline" className="tabular-nums">
          {isLoading
            ? '...'
            : showingFiltered
              ? `${filtered.length} / ${total}`
              : total}
        </Badge>
      </PageHeader>

      <MovementFilters value={filters} onChange={setFilters} />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error instanceof Error ? error.message : String(error)}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <p className="text-muted-foreground text-sm">Cargando movimientos…</p>
      )}

      {!isLoading && !error && (
        <>
          {filtered.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <div className="mx-auto h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Ningún movimiento coincide con los filtros activos.
              </p>
            </Card>
          ) : (
            <MotionList
              key={JSON.stringify(filters)}
              className="grid gap-3 md:grid-cols-2"
            >
              <AnimatePresence initial={false}>
                {filtered.map((m) => {
                  const info = infoBySlug.get(m.slug) ?? {
                    status: 'available' as const,
                    unmetPrereqSlugs: []
                  }
                  return (
                    <MotionListItem key={m.id}>
                      <MovementCard
                        movement={m}
                        info={info}
                        namesBySlug={namesBySlug}
                      />
                    </MotionListItem>
                  )
                })}
              </AnimatePresence>
            </MotionList>
          )}
        </>
      )}
    </MotionPage>
  )
}
