import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type { MovementCategory, MovementDto } from '@shared/types/movement'
import { Badge } from '@/components/ui/badge'
import { MovementNode } from './MovementNode'
import { CATEGORY_LABEL } from './learningPathEnums'
import type { LearningInfo } from '../lib/learningPathStatus'

interface Props {
  category: MovementCategory
  movements: MovementDto[]
  infoBySlug: Map<string, LearningInfo>
  /** Necesario para mostrar el nombre amigable de prereqs inter-categoría. */
  allMovements: MovementDto[]
  onSelect: (m: MovementDto) => void
}

interface ConnectionPath {
  d: string
  fromStatus: string
  toStatus: string
}

/**
 * Una rama del skill tree por categoría. Layout:
 *  - Columnas = niveles de dificultad (1..5) que aparecen en la categoría.
 *  - Cada columna contiene los movements de esa dificultad apilados.
 *  - Un SVG superpuesto dibuja paths cubic-bezier desde el centro
 *    derecho de cada prereq al centro izquierdo de su dependiente.
 *  - Las conexiones inter-categoría no se dibujan: se anuncian como
 *    chip "Viene de ..." debajo del nodo.
 *
 * Recalcula los paths con useLayoutEffect (sincronizado con el render
 * para que no haya un flash sin líneas) y en cada window resize.
 */
export function CategoryBranch({
  category,
  movements,
  infoBySlug,
  allMovements,
  onSelect
}: Props) {
  const slugSet = useMemo(
    () => new Set(movements.map((m) => m.slug)),
    [movements]
  )

  // Agrupo por dificultad. Sólo muestro las columnas que tienen al menos
  // un movimiento para evitar gaps innecesarios.
  const columns = useMemo(() => {
    const byDiff = new Map<number, MovementDto[]>()
    for (const m of movements) {
      const arr = byDiff.get(m.difficulty) ?? []
      arr.push(m)
      byDiff.set(m.difficulty, arr)
    }
    const sorted = Array.from(byDiff.entries()).sort((a, b) => a[0] - b[0])
    return sorted.map(([diff, items]) => ({
      diff,
      items: items.slice().sort((a, b) => a.name.localeCompare(b.name))
    }))
  }, [movements])

  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [paths, setPaths] = useState<ConnectionPath[]>([])
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [tick, setTick] = useState(0)

  const setNodeRef = useCallback(
    (slug: string) => (el: HTMLElement | null) => {
      if (el) nodeRefs.current.set(slug, el)
      else nodeRefs.current.delete(slug)
    },
    []
  )

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    setContainerSize({ w: cRect.width, h: cRect.height })

    const next: ConnectionPath[] = []
    for (const m of movements) {
      const childEl = nodeRefs.current.get(m.slug)
      if (!childEl) continue
      const info = infoBySlug.get(m.slug)
      for (const prereqSlug of m.prerequisites) {
        // Sólo dibujamos conexiones intra-categoría — los prereqs de otra
        // categoría se anuncian como chip, no como línea (mantiene el
        // grid limpio).
        if (!slugSet.has(prereqSlug)) continue
        const prereqEl = nodeRefs.current.get(prereqSlug)
        if (!prereqEl) continue

        const pRect = prereqEl.getBoundingClientRect()
        const childRect = childEl.getBoundingClientRect()
        const x1 = pRect.right - cRect.left
        const y1 = pRect.top + pRect.height / 2 - cRect.top
        const x2 = childRect.left - cRect.left
        const y2 = childRect.top + childRect.height / 2 - cRect.top
        const dx = Math.max(20, Math.min(80, (x2 - x1) / 2))
        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`

        const prereqInfo = infoBySlug.get(prereqSlug)
        next.push({
          d,
          fromStatus: prereqInfo?.status ?? 'locked',
          toStatus: info?.status ?? 'locked'
        })
      }
    }
    setPaths(next)
  }, [movements, infoBySlug, slugSet, tick])

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const masteredCount = movements.filter(
    (m) => infoBySlug.get(m.slug)?.status === 'mastered'
  ).length
  const totalCount = movements.length

  // Nombre humano de los prereqs externos para chips "Viene de ...".
  const namesBySlug = useMemo(() => {
    const m = new Map<string, string>()
    for (const mv of allMovements) m.set(mv.slug, mv.name)
    return m
  }, [allMovements])

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {CATEGORY_LABEL[category]}
        </h2>
        <Badge variant="outline" className="text-[10px] tabular-nums">
          {masteredCount} / {totalCount}
        </Badge>
      </div>

      <div ref={containerRef} className="relative overflow-x-auto">
        {containerSize.w > 0 && containerSize.h > 0 && paths.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={containerSize.w}
            height={containerSize.h}
            aria-hidden="true"
          >
            {paths.map((p, i) => (
              <path
                key={i}
                d={p.d}
                fill="none"
                strokeWidth="1.5"
                className={
                  p.fromStatus === 'mastered'
                    ? 'stroke-primary/70'
                    : 'stroke-muted-foreground/30'
                }
                strokeDasharray={
                  p.toStatus === 'locked' && p.fromStatus !== 'mastered'
                    ? '4 4'
                    : undefined
                }
              />
            ))}
          </svg>
        )}

        <div
          className="grid gap-x-6 gap-y-3"
          style={{
            gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(160px, 1fr))`
          }}
        >
          {columns.map((col) => (
            <div key={col.diff} className="space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Dif {col.diff}
              </div>
              <div className="space-y-3">
                {col.items.map((m) => {
                  const info = infoBySlug.get(m.slug) ?? {
                    status: 'locked' as const,
                    unmetPrereqSlugs: []
                  }
                  const externalPrereqs = m.prerequisites.filter(
                    (s) => !slugSet.has(s)
                  )
                  return (
                    <div key={m.id} className="space-y-1">
                      <MovementNode
                        ref={setNodeRef(m.slug)}
                        movement={m}
                        info={info}
                        onSelect={onSelect}
                      />
                      {externalPrereqs.length > 0 && (
                        <p className="text-[10px] text-muted-foreground pl-1 leading-snug">
                          Viene de:{' '}
                          {externalPrereqs
                            .map((s) => namesBySlug.get(s) ?? s)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
