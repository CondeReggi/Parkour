import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MovementDto, MovementProgressStatus } from '@shared/types/movement'
import { useActiveProfile } from '@/features/profile/hooks/useActiveProfile'
import { useSetMovementProgress } from '../hooks/useMovementMutations'
import { STATUS_LABEL } from './StatusBadge'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const STATUS_OPTIONS: MovementProgressStatus[] = [
  'not_attempted',
  'practicing',
  'mastered'
]

const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(iso))
    : null

export function MovementProgressForm({ movement }: { movement: MovementDto }) {
  const { data: profile } = useActiveProfile()
  const mut = useSetMovementProgress()

  const [status, setStatus] = useState<MovementProgressStatus>(
    movement.userProgress.status
  )
  const [notes, setNotes] = useState<string>(movement.userProgress.notes ?? '')

  // Si la prop cambia (por refetch), sincronizo el estado local.
  useEffect(() => {
    setStatus(movement.userProgress.status)
    setNotes(movement.userProgress.notes ?? '')
  }, [movement.userProgress.status, movement.userProgress.notes])

  const lastPracticed = formatDate(movement.userProgress.lastPracticedAt)
  const dirty =
    status !== movement.userProgress.status ||
    notes !== (movement.userProgress.notes ?? '')

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>Necesitás un perfil para registrar progreso.</span>
              <Button asChild size="sm">
                <Link to="/profile">Crear perfil</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  async function handleSave() {
    await mut.mutateAsync({
      movementId: movement.id,
      status,
      notes: notes.trim() === '' ? null : notes.trim()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tu progreso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Estado</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as MovementProgressStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notas personales</label>
          <Textarea
            rows={3}
            placeholder="Lo que te cuesta, sensaciones, qué practicar la próxima"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {lastPracticed && (
          <p className="text-xs text-muted-foreground">
            Última práctica registrada: {lastPracticed}
          </p>
        )}

        {mut.error && (
          <Alert variant="destructive">
            <AlertDescription>{mut.error.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!dirty || mut.isPending}
          >
            {mut.isPending ? 'Guardando…' : 'Guardar progreso'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
