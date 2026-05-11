import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MovementCategory, MovementDto } from '@shared/types/movement'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useActiveProfile } from '@/features/profile/hooks/useActiveProfile'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { computeLearningStatuses } from './lib/learningPathStatus'
import { CategoryBranch } from './components/CategoryBranch'
import { MovementDetailDialog } from './components/MovementDetailDialog'
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  STATUS_DOT_CLASS
} from './components/learningPathEnums'
import type { LearningStatus } from './lib/learningPathStatus'

const LEGEND: { status: LearningStatus; label: string }[] = [
  { status: 'mastered', label: 'Dominado' },
  { status: 'practicing', label: 'En práctica' },
  { status: 'available', label: 'Disponible' },
  { status: 'locked', label: 'Bloqueado' }
]

export function LearningPathPage() {
  const { data: profile, isLoading: profileLoading } = useActiveProfile()
  const { data: movements, isLoading: movementsLoading } = useMovements()
  const [selected, setSelected] = useState<MovementDto | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const infoBySlug = useMemo(() => {
    if (!movements || !profile) return new Map()
    return computeLearningStatuses(movements, profile.level)
  }, [movements, profile])

  const namesBySlug = useMemo(() => {
    const m = new Map<string, string>()
    for (const mv of movements ?? []) m.set(mv.slug, mv.name)
    return m
  }, [movements])

  const byCategory = useMemo(() => {
    const map = new Map<MovementCategory, MovementDto[]>()
    for (const m of movements ?? []) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return map
  }, [movements])

  function onSelect(m: MovementDto) {
    setSelected(m)
    setDialogOpen(true)
  }

  if (profileLoading || movementsLoading) {
    return (
      <div className="px-8 py-6 max-w-6xl space-y-6">
        <PageHeader
          title="Camino de aprendizaje"
          description="Visualización tipo árbol de habilidades."
        />
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-8 py-6 max-w-2xl space-y-4">
        <PageHeader title="Camino de aprendizaje" />
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Necesitás un perfil activo para ver tu camino.</span>
            <Button asChild size="sm">
              <Link to="/profile">Crear perfil</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const total = movements?.length ?? 0
  const mastered = Array.from(infoBySlug.values()).filter(
    (i: ReturnType<typeof computeLearningStatuses> extends Map<string, infer V> ? V : never) =>
      i.status === 'mastered'
  ).length

  return (
    <div className="px-8 py-6 max-w-6xl space-y-6">
      <PageHeader
        title="Camino de aprendizaje"
        description="Avanzá nodo por nodo. Los conectados con línea sólida ya tienen el prereq dominado; los punteados todavía están bloqueados."
      >
        <Badge variant="outline" className="tabular-nums">
          {mastered} / {total}
        </Badge>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        {LEGEND.map((l) => (
          <span key={l.status} className="flex items-center gap-1.5">
            <span
              className={
                'inline-block h-2 w-2 rounded-full ' +
                STATUS_DOT_CLASS[l.status]
              }
              aria-hidden="true"
            />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-2 ml-auto">
          <svg width="34" height="10" aria-hidden="true">
            <path
              d="M 2 5 C 12 5, 22 5, 32 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary/70"
            />
          </svg>
          Prereq dominado
          <svg width="34" height="10" aria-hidden="true">
            <path
              d="M 2 5 C 12 5, 22 5, 32 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="text-muted-foreground/40"
            />
          </svg>
          Prereq pendiente
        </span>
      </div>

      {!movements || movements.length === 0 ? (
        <Alert>
          <AlertDescription>
            Todavía no hay movimientos en la biblioteca.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-8">
          {CATEGORY_ORDER.map((cat) => {
            const items = byCategory.get(cat)
            if (!items || items.length === 0) return null
            return (
              <CategoryBranch
                key={cat}
                category={cat}
                movements={items}
                infoBySlug={infoBySlug}
                allMovements={movements}
                onSelect={onSelect}
              />
            )
          })}
        </div>
      )}

      <MovementDetailDialog
        movement={selected}
        info={selected ? infoBySlug.get(selected.slug) ?? null : null}
        namesBySlug={namesBySlug}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
