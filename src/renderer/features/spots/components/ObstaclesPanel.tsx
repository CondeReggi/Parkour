import { useState } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import type {
  ObstacleRiskLevel,
  ObstacleType,
  SpotObstacleDto
} from '@shared/types/spot'
import { useMovements } from '@/features/movements/hooks/useMovements'
import {
  useAddObstacle,
  useDeleteObstacle
} from '../hooks/useSpotMutations'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  OBSTACLE_RISK_OPTIONS,
  OBSTACLE_TYPE_LABEL,
  OBSTACLE_TYPE_OPTIONS,
  RISK_BADGE_VARIANT,
  RISK_LABEL
} from './spotEnums'
import { ObstacleMovementsEditor } from './ObstacleMovementsEditor'

function ObstacleRow({
  obstacle,
  spotId
}: {
  obstacle: SpotObstacleDto
  spotId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: movements } = useMovements()
  const delMut = useDeleteObstacle(spotId)

  const movementCount = obstacle.recommendedMovements.length

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 p-3 hover:bg-secondary/50 text-left"
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
            expanded && 'rotate-90'
          )}
        />
        <span className="font-medium text-sm flex-1 truncate">{obstacle.name}</span>
        <Badge variant="outline" className="text-[10px]">
          {OBSTACLE_TYPE_LABEL[obstacle.type]}
        </Badge>
        <Badge
          variant={RISK_BADGE_VARIANT(obstacle.riskLevel)}
          className="text-[10px]"
        >
          {RISK_LABEL[obstacle.riskLevel]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {movementCount} mov
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={delMut.isPending}
          onClick={(e) => {
            e.stopPropagation()
            if (!confirm(`¿Borrar el obstáculo "${obstacle.name}"?`)) return
            void delMut.mutate({ id: obstacle.id })
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {obstacle.notes && (
            <p className="text-xs text-muted-foreground italic mb-2">{obstacle.notes}</p>
          )}
          {!movements && (
            <p className="text-xs text-muted-foreground">Cargando movimientos…</p>
          )}
          {movements && (
            <ObstacleMovementsEditor obstacle={obstacle} movements={movements} />
          )}
        </div>
      )}
    </div>
  )
}

interface PanelProps {
  spotId: string
  obstacles: SpotObstacleDto[]
}

export function ObstaclesPanel({ spotId, obstacles }: PanelProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ObstacleType>('wall')
  const [risk, setRisk] = useState<ObstacleRiskLevel>('moderate')
  const [notes, setNotes] = useState('')

  const addMut = useAddObstacle()

  async function handleAdd() {
    if (name.trim() === '') return
    await addMut.mutateAsync({
      spotId,
      name: name.trim(),
      type,
      riskLevel: risk,
      notes: notes.trim() === '' ? null : notes.trim()
    })
    setName('')
    setType('wall')
    setRisk('moderate')
    setNotes('')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Obstáculos</CardTitle>
          <Badge variant="outline">{obstacles.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {obstacles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no agregaste obstáculos.
          </p>
        )}

        {obstacles.length > 0 && (
          <ul className="space-y-2">
            {obstacles.map((o) => (
              <li key={o.id}>
                <ObstacleRow obstacle={o} spotId={spotId} />
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Agregar obstáculo
          </p>
          <Input
            placeholder="Nombre del obstáculo (ej: muro alto, baranda larga)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={type} onValueChange={(v) => setType(v as ObstacleType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBSTACLE_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={risk} onValueChange={(v) => setRisk(v as ObstacleRiskLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBSTACLE_RISK_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    Riesgo: {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {addMut.error && (
            <Alert variant="destructive">
              <AlertDescription>{addMut.error.message}</AlertDescription>
            </Alert>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={addMut.isPending || name.trim() === ''}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            {addMut.isPending ? 'Agregando…' : 'Agregar obstáculo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
