import { useEffect, useMemo, useState } from 'react'
import type { MovementDto } from '@shared/types/movement'
import type { SessionDto, SessionTrafficLight } from '@shared/types/session'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { useRoutines } from '@/features/routines/hooks/useRoutines'
import { useFinalizeSession, useCancelSession } from '../hooks/useSessionMutations'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const TRAFFIC_DOT: Record<SessionTrafficLight, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500'
}

const TRAFFIC_LABEL: Record<SessionTrafficLight, string> = {
  green: 'Verde',
  yellow: 'Amarillo',
  red: 'Rojo'
}

const CATEGORY_LABEL: Record<string, string> = {
  landing: 'Aterrizaje',
  vault: 'Vault',
  climb: 'Climb',
  balance: 'Balance',
  precision: 'Precisión',
  wall: 'Wall',
  core: 'Core'
}

function formatStartedAt(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso))
}

function minutesSince(iso: string): number {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

interface SliderRowProps {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
}

function SliderRow({ label, hint, value, onChange }: SliderRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          <span className="ml-2 text-xs text-muted-foreground font-normal">{hint}</span>
        </label>
        <span className="text-sm font-mono w-8 text-right">{value}</span>
      </div>
      <Slider
        min={0}
        max={10}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? 0)}
      />
    </div>
  )
}

export function ActiveSessionView({ session }: { session: SessionDto }) {
  const { data: routines } = useRoutines()
  const sessionRoutine = useMemo(
    () => (session.routineId ? routines?.find((r) => r.id === session.routineId) : undefined),
    [routines, session.routineId]
  )
  const { data: allMovements } = useMovements()

  // Pre-checked: movimientos del routine que tienen vínculo a un Movement
  const routineMovementIds = useMemo<string[]>(() => {
    if (!sessionRoutine || !allMovements) return []
    const slugs = new Set<string>()
    for (const block of sessionRoutine.blocks) {
      for (const ex of block.exercises) {
        if (ex.movementSlug) slugs.add(ex.movementSlug)
      }
    }
    return allMovements.filter((m) => slugs.has(m.slug)).map((m) => m.id)
  }, [sessionRoutine, allMovements])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [painAfter, setPainAfter] = useState<number>(session.painBefore ?? 0)
  const [fatigueAfter, setFatigueAfter] = useState<number>(session.fatigueBefore ?? 5)
  const [generalState, setGeneralState] = useState<string>('')
  const [personalNotes, setPersonalNotes] = useState<string>('')
  const [durationOverride, setDurationOverride] = useState<string>('')

  const computedMinutes = minutesSince(session.startedAt)

  // Pre-marcar movimientos del routine la primera vez que llegan los datos
  useEffect(() => {
    if (routineMovementIds.length === 0) return
    setSelectedIds((prev) => {
      if (prev.size > 0) return prev
      return new Set(routineMovementIds)
    })
  }, [routineMovementIds])

  const finalizeMut = useFinalizeSession()
  const cancelMut = useCancelSession()

  function toggleMovement(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleFinalize() {
    const dur = durationOverride.trim() === '' ? null : Number(durationOverride)
    await finalizeMut.mutateAsync({
      id: session.id,
      durationMin: dur && dur > 0 ? dur : null,
      painAfter,
      fatigueAfter,
      generalState: generalState.trim() === '' ? null : generalState.trim(),
      personalNotes: personalNotes.trim() === '' ? null : personalNotes.trim(),
      movementIds: Array.from(selectedIds)
    })
  }

  function handleCancel() {
    if (!confirm('¿Cancelar esta sesión? Se borra y no queda registro.')) return
    void cancelMut.mutate({ id: session.id })
  }

  // Agrupo por categoría para que el listado sea menos abrumador
  const movementsByCategory = useMemo(() => {
    if (!allMovements) return new Map<string, MovementDto[]>()
    const map = new Map<string, MovementDto[]>()
    for (const m of allMovements) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return map
  }, [allMovements])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full animate-pulse bg-primary" />
                Entrenamiento en curso
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Iniciado {formatStartedAt(session.startedAt)} · {computedMinutes} min
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Badge variant="outline" className="gap-2">
                <span className={cn('h-1.5 w-1.5 rounded-full', TRAFFIC_DOT[session.safetyTrafficLight])} />
                {TRAFFIC_LABEL[session.safetyTrafficLight]}
              </Badge>
              {session.safetyOverridden && (
                <Badge variant="destructive">Override</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {session.routineName && (
            <p>
              <span className="text-muted-foreground">Rutina:</span>{' '}
              <span className="font-medium">{session.routineName}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Pre — Dolor: {session.painBefore ?? '—'} · Fatiga: {session.fatigueBefore ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Después del entrenamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <SliderRow
            label="Dolor"
            hint="cómo terminaste"
            value={painAfter}
            onChange={setPainAfter}
          />
          <SliderRow
            label="Fatiga"
            hint="cómo terminaste"
            value={fatigueAfter}
            onChange={setFatigueAfter}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado general (opcional)</label>
            <Input
              placeholder="Ej: bien, motivado / pesado, rendido"
              value={generalState}
              onChange={(e) => setGeneralState(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas personales (opcional)</label>
            <Textarea
              rows={3}
              placeholder="Lo que aprendiste, sensaciones, qué practicar la próxima"
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Duración (minutos)
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                Vacío usa {computedMinutes} min auto
              </span>
            </label>
            <Input
              type="number"
              min={1}
              placeholder={String(computedMinutes)}
              value={durationOverride}
              onChange={(e) => setDurationOverride(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Movimientos practicados</CardTitle>
            <Badge variant="outline">{selectedIds.size} seleccionados</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!allMovements && (
            <p className="text-sm text-muted-foreground">Cargando biblioteca…</p>
          )}
          {allMovements &&
            Array.from(movementsByCategory.entries()).map(([cat, movements]) => (
              <div key={cat} className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABEL[cat] ?? cat}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {movements.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-secondary/50"
                    >
                      <Checkbox
                        checked={selectedIds.has(m.id)}
                        onCheckedChange={(c) => toggleMovement(m.id, !!c)}
                      />
                      <span className="text-sm truncate">{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {finalizeMut.error && (
        <Alert variant="destructive">
          <AlertDescription>{finalizeMut.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={cancelMut.isPending}
        >
          Cancelar sesión
        </Button>
        <Button
          type="button"
          onClick={handleFinalize}
          disabled={finalizeMut.isPending}
        >
          {finalizeMut.isPending ? 'Finalizando…' : 'Finalizar entrenamiento'}
        </Button>
      </div>
    </div>
  )
}
