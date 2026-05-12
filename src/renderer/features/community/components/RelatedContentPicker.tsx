import { ShieldAlert } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { useSpots } from '@/features/spots/hooks/useSpots'
import { useRoutines } from '@/features/routines/hooks/useRoutines'
import { useVideos } from '@/features/videos/hooks/useVideos'
import type { Visibility } from '@shared/types/sharing'

const NONE = '__none__'

interface PickerProps {
  movementId: string | null
  spotId: string | null
  routineId: string | null
  videoId: string | null
  onChange: (
    next: Partial<{
      movementId: string | null
      spotId: string | null
      routineId: string | null
      videoId: string | null
    }>
  ) => void
  /** Visibility del post — para chequear si referencia contenido privado. */
  postVisibility: Visibility
}

/**
 * Selectores para asociar contenido al post. Cuando el post es público
 * y el contenido elegido es privado, mostramos un Alert amarillo: la
 * referencia va a aparecer en el feed pero el destino no se va a poder
 * abrir. Permitimos guardar igual (informed consent).
 */
export function RelatedContentPicker({
  movementId,
  spotId,
  routineId,
  videoId,
  onChange,
  postVisibility
}: PickerProps) {
  const movementsQ = useMovements()
  const spotsQ = useSpots()
  const routinesQ = useRoutines()
  const videosQ = useVideos()

  const selectedSpot = spotsQ.data?.find((s) => s.id === spotId)
  const selectedRoutine = routinesQ.data?.find((r) => r.id === routineId)
  const selectedVideo = videosQ.data?.find((v) => v.id === videoId)

  const postIsPublic = postVisibility === 'public' || postVisibility === 'unlisted'
  const conflicts: string[] = []
  if (postIsPublic && selectedSpot && selectedSpot.visibility === 'private') {
    conflicts.push(`el spot "${selectedSpot.name}"`)
  }
  if (postIsPublic && selectedRoutine && selectedRoutine.visibility === 'private') {
    conflicts.push(`la rutina "${selectedRoutine.name}"`)
  }
  if (postIsPublic && selectedVideo && selectedVideo.visibility === 'private') {
    conflicts.push(`el video "${selectedVideo.fileName}"`)
  }

  return (
    <div className="space-y-4">
      <FormItem>
        <FormLabel>Movimiento</FormLabel>
        <Select
          value={movementId ?? NONE}
          onValueChange={(v) => onChange({ movementId: v === NONE ? null : v })}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Sin movimiento" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value={NONE}>Sin movimiento</SelectItem>
            {(movementsQ.data ?? []).map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>

      <FormItem>
        <FormLabel>Spot</FormLabel>
        <Select
          value={spotId ?? NONE}
          onValueChange={(v) => onChange({ spotId: v === NONE ? null : v })}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Sin spot" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value={NONE}>Sin spot</SelectItem>
            {(spotsQ.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.visibility === 'private' && '  · privado'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>

      <FormItem>
        <FormLabel>Rutina</FormLabel>
        <Select
          value={routineId ?? NONE}
          onValueChange={(v) => onChange({ routineId: v === NONE ? null : v })}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Sin rutina" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value={NONE}>Sin rutina</SelectItem>
            {(routinesQ.data ?? []).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
                {!r.isBuiltIn && r.visibility === 'private' && '  · privada'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormDescription>
          Podés referenciar rutinas built-in o tus rutinas custom.
        </FormDescription>
        <FormMessage />
      </FormItem>

      <FormItem>
        <FormLabel>Video</FormLabel>
        <Select
          value={videoId ?? NONE}
          onValueChange={(v) => onChange({ videoId: v === NONE ? null : v })}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Sin video" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value={NONE}>Sin video</SelectItem>
            {(videosQ.data ?? []).map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.fileName}
                {v.visibility === 'private' && '  · privado'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormDescription>
          Sólo referenciamos el video (id + nombre). El archivo local no se
          sube ni se comparte.
        </FormDescription>
        <FormMessage />
      </FormItem>

      {conflicts.length > 0 && (
        <Alert variant="default" className="border-amber-500/30">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Tu post es público pero estás referenciando contenido privado (
            {conflicts.join(', ')}). Otros usuarios van a ver el nombre pero no
            van a poder abrirlo. Cambiá su visibilidad si querés que se pueda
            ver.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
