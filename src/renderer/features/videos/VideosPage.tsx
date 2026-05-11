import { useMemo, useState } from 'react'
import { Plus, Video } from 'lucide-react'
import type { PickedVideo, VideoDto } from '@shared/types/video'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useVideos } from './hooks/useVideos'
import { VideoCard } from './components/VideoCard'
import { VideoFormDialog } from './components/VideoFormDialog'
import {
  VideoFilters,
  applyVideoFilters,
  defaultVideoFilters,
  type VideoFilterState
} from './components/VideoFilters'

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create'; picked: PickedVideo }
  | { kind: 'edit'; video: VideoDto }

export function VideosPage() {
  const { data: videos, isLoading, error } = useVideos()
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' })
  const [pickError, setPickError] = useState<string | null>(null)
  const [filters, setFilters] = useState<VideoFilterState>(defaultVideoFilters)

  const filtered = useMemo(
    () => applyVideoFilters(videos ?? [], filters),
    [videos, filters]
  )

  async function onAdd() {
    setPickError(null)
    try {
      const picked = await window.parkourApi.videos.pickFile()
      if (picked) setDialog({ kind: 'create', picked })
    } catch (e) {
      setPickError(e instanceof Error ? e.message : String(e))
    }
  }

  const total = videos?.length ?? 0
  const showingFiltered = filters !== defaultVideoFilters && filtered.length !== total

  return (
    <div className="px-8 py-6 max-w-3xl">
      <PageHeader
        title="Videos"
        description="Tus videos locales asociados a movimientos, spots y entrenamientos."
      >
        <Badge variant="outline">
          {isLoading ? '...' : showingFiltered ? `${filtered.length} / ${total}` : total}
        </Badge>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Agregar video
        </Button>
      </PageHeader>

      {(error || pickError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {pickError ??
              (error instanceof Error ? error.message : String(error))}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!isLoading && total === 0 && (
        <Card className="p-6 text-center space-y-3">
          <Video className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Todavía no tenés videos. Agregá uno desde tu PC para empezar a
            revisar tus intentos.
          </p>
          <div className="flex justify-center">
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Elegir archivo
            </Button>
          </div>
        </Card>
      )}

      {total > 0 && (
        <>
          <VideoFilters value={filters} onChange={setFilters} />

          {filtered.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Ningún video coincide con los filtros.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  onClick={() => setDialog({ kind: 'edit', video: v })}
                />
              ))}
            </div>
          )}
        </>
      )}

      <VideoFormDialog
        open={dialog.kind !== 'closed'}
        onOpenChange={(o) => {
          if (!o) setDialog({ kind: 'closed' })
        }}
        video={dialog.kind === 'edit' ? dialog.video : undefined}
        picked={dialog.kind === 'create' ? dialog.picked : undefined}
      />
    </div>
  )
}
