import { useMemo } from 'react'
import type { MovementCategory, MovementDto } from '@shared/types/movement'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

const CATEGORY_ORDER: MovementCategory[] = [
  'landing',
  'vault',
  'climb',
  'balance',
  'precision',
  'wall',
  'core'
]

const CATEGORY_LABEL: Record<MovementCategory, string> = {
  landing: 'Aterrizaje',
  vault: 'Vault',
  climb: 'Climb',
  balance: 'Balance',
  precision: 'Precisión',
  wall: 'Wall',
  core: 'Core'
}

interface CategoryRow {
  category: MovementCategory
  total: number
  mastered: number
  practicing: number
}

interface Props {
  movements: MovementDto[]
}

export function MovementProgressChart({ movements }: Props) {
  const rows = useMemo<CategoryRow[]>(() => {
    const map = new Map<MovementCategory, CategoryRow>()
    for (const c of CATEGORY_ORDER) {
      map.set(c, { category: c, total: 0, mastered: 0, practicing: 0 })
    }
    for (const m of movements) {
      const r = map.get(m.category)
      if (!r) continue
      r.total++
      if (m.userProgress.status === 'mastered') r.mastered++
      else if (m.userProgress.status === 'practicing') r.practicing++
    }
    return CATEGORY_ORDER.map((c) => map.get(c)!).filter((r) => r.total > 0)
  }, [movements])

  const totalAll = rows.reduce((acc, r) => acc + r.total, 0)
  const masteredAll = rows.reduce((acc, r) => acc + r.mastered, 0)
  const practicingAll = rows.reduce((acc, r) => acc + r.practicing, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Progreso por categoría</CardTitle>
        <CardDescription>
          {totalAll === 0
            ? 'Cargando biblioteca…'
            : `${masteredAll} dominados · ${practicingAll} en práctica · ${totalAll} totales`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {rows.map((r) => {
            const masteredPct = (r.mastered / r.total) * 100
            const practicingPct = (r.practicing / r.total) * 100
            return (
              <li key={r.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {CATEGORY_LABEL[r.category]}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {r.mastered + r.practicing} / {r.total}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden flex">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${masteredPct}%` }}
                    title={`${r.mastered} dominados`}
                  />
                  <div
                    className="bg-primary/40 h-full"
                    style={{ width: `${practicingPct}%` }}
                    title={`${r.practicing} en práctica`}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-primary" />
            Dominado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-primary/40" />
            En práctica
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-muted-foreground/30" />
            Sin intentar
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
