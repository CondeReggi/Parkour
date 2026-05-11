import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Pencil, Save, X } from 'lucide-react'
import type { MovementDto } from '@shared/types/movement'
import type { SpotDto } from '@shared/types/spot'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSetSpotIdealMovements } from '../hooks/useSpotMutations'

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
  spot: SpotDto
}

export function IdealMovementsEditor({ spot }: Props) {
  const { data: movements } = useMovements()
  const mut = useSetSpotIdealMovements()
  const [editing, setEditing] = useState(false)
  const initialIds = useMemo(
    () => new Set(spot.idealMovements.map((m) => m.movementId)),
    [spot.idealMovements]
  )
  const [selected, setSelected] = useState<Set<string>>(initialIds)

  useEffect(() => {
    setSelected(new Set(spot.idealMovements.map((m) => m.movementId)))
  }, [spot.idealMovements])

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
      spotId: spot.id,
      movementIds: Array.from(selected)
    })
    setEditing(false)
  }

  function cancel() {
    setSelected(new Set(spot.idealMovements.map((m) => m.movementId)))
    setEditing(false)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, MovementDto[]>()
    for (const m of movements ?? []) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return map
  }, [movements])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Movimientos ideales</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{spot.idealMovements.length}</Badge>
            {!editing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing && spot.idealMovements.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Marcá los movimientos que mejor se entrenan en este spot. Te van
            a aparecer rápido cuando vengas a entrenar acá.
          </p>
        )}

        {!editing && spot.idealMovements.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {spot.idealMovements.map((im) => (
              <li key={im.movementId}>
                <Link
                  to={`/movements/${im.movementSlug}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {im.movementName}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABEL[im.movementCategory] ?? im.movementCategory}
                      {' · '}
                      Dif {im.movementDifficulty}
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {editing && (
          <>
            {!movements && (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            )}
            {movements && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {Array.from(grouped.entries()).map(([cat, ms]) => (
                  <div key={cat} className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABEL[cat] ?? cat}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {ms.map((m) => (
                        <label
                          key={m.id}
                          className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 cursor-pointer hover:bg-secondary/50"
                        >
                          <Checkbox
                            checked={selected.has(m.id)}
                            onCheckedChange={(c) => toggle(m.id, !!c)}
                          />
                          <span className="text-xs truncate flex-1">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Dif {m.difficulty}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mut.error && (
              <Alert variant="destructive">
                <AlertDescription>{mut.error.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={cancel}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={!dirty || mut.isPending}
              >
                <Save className="h-4 w-4" />
                {mut.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
