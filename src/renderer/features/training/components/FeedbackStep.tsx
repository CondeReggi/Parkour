import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Film,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Video as VideoIcon
} from 'lucide-react'
import type { MovementDto } from '@shared/types/movement'
import type { PickedVideo, VideoDto } from '@shared/types/video'
import type { SessionDto } from '@shared/types/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { useFinalizeSession } from '@/features/sessions/hooks/useSessionMutations'
import { useVideos } from '@/features/videos/hooks/useVideos'
import { useUpdateVideo } from '@/features/videos/hooks/useVideoMutations'
import { VideoFormDialog } from '@/features/videos/components/VideoFormDialog'

const CATEGORY_LABEL: Record<string, string> = {
  landing: 'Aterrizaje',
  vault: 'Vault',
  climb: 'Climb',
  balance: 'Balance',
  precision: 'Precisión',
  wall: 'Wall',
  core: 'Core'
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
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            {hint}
          </span>
        </label>
        <span className="text-sm font-mono w-8 text-right tabular-nums">
          {value}
        </span>
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

interface Props {
  session: SessionDto
  /** Si el routine tenía movements vinculados, vienen pre-marcados. */
  preselectedMovementIds: string[]
  onBack: () => void
  onFinished: () => void
}

export function FeedbackStep({
  session,
  preselectedMovementIds,
  onBack,
  onFinished
}: Props) {
  const { data: allMovements } = useMovements()
  const { data: allVideos } = useVideos()
  const finalizeMut = useFinalizeSession()
  const updateVideoMut = useUpdateVideo()

  const [whatWentWell, setWhatWentWell] = useState('')
  const [whatWentWrong, setWhatWentWrong] = useState('')
  const [painAfter, setPainAfter] = useState<number>(session.painBefore ?? 0)
  const [fatigueAfter, setFatigueAfter] = useState<number>(
    session.fatigueBefore ?? 5
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(preselectedMovementIds)
  )
  const [associatedVideoIds, setAssociatedVideoIds] = useState<Set<string>>(
    new Set()
  )
  const [picked, setPicked] = useState<PickedVideo | null>(null)
  const [pickError, setPickError] = useState<string | null>(null)
  const [showVideoDialog, setShowVideoDialog] = useState(false)

  function toggleMovement(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAssociated(id: string, checked: boolean) {
    setAssociatedVideoIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function onAddVideo() {
    setPickError(null)
    try {
      const result = await window.parkourApi.videos.pickFile()
      if (result) {
        setPicked(result)
        setShowVideoDialog(true)
      }
    } catch (e) {
      setPickError(e instanceof Error ? e.message : String(e))
    }
  }

  const movementsByCategory = useMemo(() => {
    const map = new Map<string, MovementDto[]>()
    for (const m of allMovements ?? []) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return map
  }, [allMovements])

  // Videos candidatos para asociar: pending o ya revisados pero todavía
  // sin sessionId. Mostramos los últimos 8 cargados.
  const candidateVideos = useMemo(() => {
    if (!allVideos) return []
    return allVideos
      .filter((v) => v.session === null)
      .slice(0, 8)
  }, [allVideos])

  function buildNoteFromFeedback(): string | null {
    const lines: string[] = []
    if (whatWentWell.trim()) {
      lines.push('Salió bien: ' + whatWentWell.trim())
    }
    if (whatWentWrong.trim()) {
      lines.push('A mejorar: ' + whatWentWrong.trim())
    }
    return lines.length > 0 ? lines.join('\n') : null
  }

  async function handleFinalize() {
    const personalNotes = buildNoteFromFeedback()

    await finalizeMut.mutateAsync({
      id: session.id,
      durationMin: null, // dejamos que el backend lo calcule desde startedAt
      painAfter,
      fatigueAfter,
      generalState: null,
      personalNotes,
      movementIds: Array.from(selectedIds)
    })

    // Asociar videos seleccionados al sessionId (best-effort: errores
    // individuales no rompen el flujo).
    for (const videoId of associatedVideoIds) {
      const v = (allVideos ?? []).find((x) => x.id === videoId)
      if (!v) continue
      try {
        await updateVideoMut.mutateAsync({
          id: v.id,
          movementId: v.movement?.id ?? null,
          spotId: v.spot?.id ?? null,
          sessionId: session.id,
          notes: v.notes,
          whatWentWell: v.whatWentWell,
          whatWentWrong: v.whatWentWrong,
          reviewStatus: v.reviewStatus,
          // Preserva la visibility actual: no la cambiamos al asociar
          // el video con la sesión.
          visibility: v.visibility
        })
      } catch {
        // dejamos seguir; el usuario puede asociar después desde /videos.
      }
    }

    onFinished()
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo te fue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
              Qué salió bien
            </label>
            <Textarea
              rows={2}
              placeholder="Lo que querés conservar para la próxima."
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" />
              Qué salió mal
            </label>
            <Textarea
              rows={2}
              placeholder="Lo que tenés que corregir."
              value={whatWentWrong}
              onChange={(e) => setWhatWentWrong(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo terminaste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SliderRow
            label="Dolor post sesión"
            hint="0 = nada, 10 = mucho"
            value={painAfter}
            onChange={setPainAfter}
          />
          <SliderRow
            label="Fatiga post sesión"
            hint="0 = descansado, 10 = rendido"
            value={fatigueAfter}
            onChange={setFatigueAfter}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Movimientos practicados</CardTitle>
            <Badge variant="outline" className="tabular-nums">
              {selectedIds.size} seleccionados
            </Badge>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <VideoIcon className="h-4 w-4 text-primary" />
              Video de la sesión
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddVideo}
            >
              <Plus className="h-4 w-4" />
              Subir nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pickError && (
            <Alert variant="destructive">
              <AlertDescription>{pickError}</AlertDescription>
            </Alert>
          )}
          {candidateVideos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No tenés videos previos sin sesión. Subí uno si querés
              revisarlo después.
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">
                Asociá videos existentes a esta sesión para que queden
                vinculados.
              </p>
              <ul className="space-y-2">
                {candidateVideos.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2"
                  >
                    <Checkbox
                      checked={associatedVideoIds.has(v.id)}
                      onCheckedChange={(c) => toggleAssociated(v.id, !!c)}
                    />
                    <Film className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{v.fileName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {v.movement?.name ?? 'Sin movimiento'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {finalizeMut.error && (
        <Alert variant="destructive">
          <AlertDescription>{finalizeMut.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Volver a la sesión
        </Button>
        <Button
          type="button"
          onClick={handleFinalize}
          disabled={finalizeMut.isPending}
        >
          <Check className="h-4 w-4" />
          {finalizeMut.isPending
            ? 'Finalizando…'
            : 'Finalizar entrenamiento'}
        </Button>
      </div>

      <VideoFormDialog
        open={showVideoDialog}
        onOpenChange={(o) => {
          setShowVideoDialog(o)
          if (!o) setPicked(null)
        }}
        picked={picked ?? undefined}
      />
    </div>
  )
}
