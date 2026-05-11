import { useEffect, useMemo, useState } from 'react'
import type { MovementDto } from '@shared/types/movement'
import type { SpotObstacleDto } from '@shared/types/spot'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useSetObstacleMovements } from '../hooks/useSpotMutations'

const CATEGORY_LABEL: Record<string, string> = {
  landing: 'Aterrizaje',
  vault: 'Vault',
  climb: 'Climb',
  balance: 'Balance',
  precision: 'Precisión',
  wall: 'Wall',
  core: 'Core'
}

interface Props {
  obstacle: SpotObstacleDto
  movements: MovementDto[]
}

export function ObstacleMovementsEditor({ obstacle, movements }: Props) {
  const initialIds = useMemo(
    () => new Set(obstacle.recommendedMovements.map((m) => m.movementId)),
    [obstacle.recommendedMovements]
  )

  const [selected, setSelected] = useState<Set<string>>(initialIds)

  // Re-sincronizar si vienen cambios externos (p.ej. invalidate por otra ventana)
  useEffect(() => {
    setSelected(new Set(obstacle.recommendedMovements.map((m) => m.movementId)))
  }, [obstacle.recommendedMovements])

  const mut = useSetObstacleMovements(obstacle.spotId)

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const dirty = useMemo(() => {
    if (selected.size !== initialIds.size) return true
    for (const id of selected) if (!initialIds.has(id)) return true
    return false
  }, [selected, initialIds])

  async function save() {
    await mut.mutateAsync({
      obstacleId: obstacle.id,
      movementIds: Array.from(selected)
    })
  }

  // Agrupado por categoría
  const grouped = useMemo(() => {
    const map = new Map<string, MovementDto[]>()
    for (const m of movements) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return map
  }, [movements])

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-border">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Movimientos recomendados para este obstáculo
      </p>

      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([cat, ms]) => (
          <div key={cat} className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABEL[cat] ?? cat}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {ms.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 cursor-pointer hover:bg-secondary/50"
                >
                  <Checkbox
                    checked={selected.has(m.id)}
                    onCheckedChange={(c) => toggle(m.id, !!c)}
                  />
                  <span className="text-xs truncate">{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={!dirty || mut.isPending}
        >
          {mut.isPending ? 'Guardando…' : 'Guardar movimientos'}
        </Button>
      </div>
    </div>
  )
}
