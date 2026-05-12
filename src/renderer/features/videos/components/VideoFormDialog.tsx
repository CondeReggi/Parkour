import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import {
  videoFormSchema,
  type VideoFormValues
} from '@shared/schemas/video.schemas'
import type { PickedVideo, VideoDto } from '@shared/types/video'
import { useMovements } from '@/features/movements/hooks/useMovements'
import { useSpots } from '@/features/spots/hooks/useSpots'
import { useSessionsList } from '@/features/sessions/hooks/useSessions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useCreateVideo,
  useDeleteVideo,
  useUpdateVideo
} from '../hooks/useVideoMutations'
import { REVIEW_STATUS_OPTIONS } from './videoEnums'
import { VideoPlayer } from './VideoPlayer'
import { VisibilitySelector } from '@/features/sharing/components/VisibilitySelector'

const NONE_VALUE = '__none__'

const defaultValues: VideoFormValues = {
  movementId: null,
  spotId: null,
  sessionId: null,
  notes: null,
  whatWentWell: null,
  whatWentWrong: null,
  reviewStatus: 'pending',
  visibility: 'private'
}

function videoToFormValues(v: VideoDto): VideoFormValues {
  return {
    movementId: v.movement?.id ?? null,
    spotId: v.spot?.id ?? null,
    sessionId: v.session?.id ?? null,
    notes: v.notes,
    whatWentWell: v.whatWentWell,
    whatWentWrong: v.whatWentWrong,
    reviewStatus: v.reviewStatus,
    visibility: v.visibility
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si está presente, modo edición. Si no, modo creación con archivo recién pickeado. */
  video?: VideoDto
  /** Sólo en modo creación: el archivo que el usuario eligió en el picker. */
  picked?: PickedVideo
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function VideoFormDialog({ open, onOpenChange, video, picked }: Props) {
  const isEdit = !!video
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: video ? videoToFormValues(video) : defaultValues
  })

  useEffect(() => {
    if (!open) return
    form.reset(video ? videoToFormValues(video) : defaultValues)
  }, [open, video, form])

  const movementsQ = useMovements()
  const spotsQ = useSpots()
  const sessionsQ = useSessionsList()

  const createMut = useCreateVideo()
  const updateMut = useUpdateVideo()
  const deleteMut = useDeleteVideo()
  const mut = isEdit ? updateMut : createMut

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  useEffect(() => {
    if (!open) setConfirmingDelete(false)
  }, [open])

  async function onSubmit(values: VideoFormValues) {
    if (isEdit && video) {
      await updateMut.mutateAsync({ id: video.id, ...values })
    } else if (picked) {
      await createMut.mutateAsync({
        filePath: picked.filePath,
        fileName: picked.fileName,
        ...values
      })
    } else {
      return
    }
    onOpenChange(false)
  }

  async function onDelete() {
    if (!video) return
    await deleteMut.mutateAsync({ id: video.id })
    onOpenChange(false)
  }

  const fileName = video?.fileName ?? picked?.fileName ?? ''
  const filePath = video?.filePath ?? picked?.filePath ?? ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Revisar video' : 'Nuevo video'}</DialogTitle>
          <DialogDescription className="truncate">{fileName}</DialogDescription>
          {!isEdit && filePath && (
            <p className="text-xs font-mono text-muted-foreground/70 truncate">
              {filePath}
            </p>
          )}
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto space-y-5">
          {isEdit && video && <VideoPlayer video={video} />}

          <Form {...form}>
            <form
              id="video-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="movementId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Movimiento</FormLabel>
                      <Select
                        value={field.value ?? NONE_VALUE}
                        onValueChange={(v) =>
                          field.onChange(v === NONE_VALUE ? null : v)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin movimiento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>
                            Sin movimiento
                          </SelectItem>
                          {(movementsQ.data ?? []).map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spotId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spot</FormLabel>
                      <Select
                        value={field.value ?? NONE_VALUE}
                        onValueChange={(v) =>
                          field.onChange(v === NONE_VALUE ? null : v)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin spot" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Sin spot</SelectItem>
                          {(spotsQ.data ?? []).map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sesión</FormLabel>
                      <Select
                        value={field.value ?? NONE_VALUE}
                        onValueChange={(v) =>
                          field.onChange(v === NONE_VALUE ? null : v)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin sesión" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Sin sesión</SelectItem>
                          {(sessionsQ.data ?? []).map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {formatSessionDate(s.startedAt)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reviewStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de revisión</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REVIEW_STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="whatWentWell"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qué salió bien</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Lo que querés conservar"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : e.target.value
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatWentWrong"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qué salió mal</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Lo que tenés que corregir la próxima"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : e.target.value
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas libres</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : e.target.value
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <VisibilitySelector
                    value={field.value}
                    onChange={field.onChange}
                    label="Compartir"
                  />
                )}
              />

              {mut.error && (
                <Alert variant="destructive">
                  <AlertDescription>{mut.error.message}</AlertDescription>
                </Alert>
              )}
              {deleteMut.error && (
                <Alert variant="destructive">
                  <AlertDescription>{deleteMut.error.message}</AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </DialogBody>

        <DialogFooter className="border-t bg-background/95 backdrop-blur sticky bottom-0">
          <Button type="submit" form="video-form" disabled={mut.isPending}>
            {mut.isPending
              ? 'Guardando…'
              : isEdit
                ? 'Guardar cambios'
                : 'Agregar video'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mut.isPending}
          >
            Cancelar
          </Button>
          {isEdit && (
            <div className="mr-auto">
              {confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">¿Seguro?</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={onDelete}
                    disabled={deleteMut.isPending}
                  >
                    {deleteMut.isPending ? 'Eliminando…' : 'Sí, eliminar'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleteMut.isPending}
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
