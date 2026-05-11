import { useState } from 'react'
import { ImageOff, ImagePlus, Trash2, X } from 'lucide-react'
import type { SpotPhotoDto } from '@shared/types/spot'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  pickSpotPhotoNative,
  useAddSpotPhoto,
  useDeleteSpotPhoto,
  useUpdateSpotPhoto
} from '../hooks/useSpotMutations'
import { spotPhotoMediaUrl } from '../lib/mediaUrl'

interface Props {
  spotId: string
  photos: SpotPhotoDto[]
}

export function SpotPhotosGallery({ spotId, photos }: Props) {
  const addMut = useAddSpotPhoto()
  const delMut = useDeleteSpotPhoto(spotId)
  const updateMut = useUpdateSpotPhoto(spotId)

  const [error, setError] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const previewPhoto = photos.find((p) => p.id === previewId) ?? null

  async function handlePick() {
    setError(null)
    try {
      const picked = await pickSpotPhotoNative()
      if (!picked) return
      await addMut.mutateAsync({
        spotId,
        filePath: picked.filePath,
        fileName: picked.fileName,
        caption: null
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleDelete(p: SpotPhotoDto) {
    if (!confirm(`¿Quitar la foto "${p.fileName}"? Sólo se elimina la referencia, el archivo en disco queda.`))
      return
    await delMut.mutateAsync({ id: p.id })
    if (previewId === p.id) setPreviewId(null)
  }

  async function handleCaptionSave(id: string, caption: string) {
    await updateMut.mutateAsync({
      id,
      caption: caption.trim() === '' ? null : caption.trim()
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Fotos</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{photos.length}</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePick}
              disabled={addMut.isPending}
            >
              <ImagePlus className="h-4 w-4" />
              {addMut.isPending ? 'Agregando…' : 'Agregar foto'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {addMut.error && (
          <Alert variant="destructive">
            <AlertDescription>{addMut.error.message}</AlertDescription>
          </Alert>
        )}

        {photos.length === 0 && (
          <div className="rounded-md border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
            Todavía no agregaste fotos. Las fotos te ayudan a recordar cómo es
            el spot y armar tu mapa visual.
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreviewId(p.id)}
                className={cn(
                  'relative aspect-video overflow-hidden rounded-md border bg-secondary/40 group',
                  p.fileMissing && 'border-destructive/40'
                )}
              >
                {!p.fileMissing ? (
                  <img
                    src={spotPhotoMediaUrl(p.id)}
                    alt={p.caption ?? p.fileName}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    draggable={false}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-destructive/80 gap-1 text-[10px] uppercase tracking-wider">
                    <ImageOff className="h-5 w-5" />
                    Faltante
                  </div>
                )}
                {p.caption && (
                  <span className="absolute bottom-1 left-1 right-1 text-[10px] bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 truncate">
                    {p.caption}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={!!previewPhoto}
        onOpenChange={(open) => !open && setPreviewId(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewPhoto?.fileName ?? 'Foto'}</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <PreviewBody
              photo={previewPhoto}
              onCaptionSave={(c) => handleCaptionSave(previewPhoto.id, c)}
              onDelete={() => handleDelete(previewPhoto)}
              onClose={() => setPreviewId(null)}
              isDeleting={delMut.isPending}
              isUpdating={updateMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function PreviewBody({
  photo,
  onCaptionSave,
  onDelete,
  onClose,
  isDeleting,
  isUpdating
}: {
  photo: SpotPhotoDto
  onCaptionSave: (caption: string) => Promise<void> | void
  onDelete: () => void
  onClose: () => void
  isDeleting: boolean
  isUpdating: boolean
}) {
  const [caption, setCaption] = useState(photo.caption ?? '')
  const captionDirty = (photo.caption ?? '') !== caption

  return (
    <div className="space-y-4 px-6 pb-6">
      <div className="relative bg-black/40 rounded-md overflow-hidden">
        {!photo.fileMissing ? (
          <img
            src={spotPhotoMediaUrl(photo.id)}
            alt={photo.caption ?? photo.fileName}
            className="w-full max-h-[60vh] object-contain"
            draggable={false}
          />
        ) : (
          <div className="aspect-video flex items-center justify-center text-destructive flex-col gap-2">
            <ImageOff className="h-8 w-8" />
            <p className="text-sm">El archivo no está disponible en disco.</p>
            <p className="text-xs text-muted-foreground">{photo.filePath}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Caption
        </label>
        <Input
          placeholder="Descripción corta de la foto (opcional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? 'Quitando…' : 'Quitar foto'}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            Cerrar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onCaptionSave(caption)}
            disabled={!captionDirty || isUpdating}
          >
            {isUpdating ? 'Guardando…' : 'Guardar caption'}
          </Button>
        </div>
      </div>
    </div>
  )
}
