import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { VideoDto } from '@shared/types/video'
import { videoMediaUrl } from '../lib/mediaUrl'

interface Props {
  video: VideoDto
}

/**
 * Reproductor que consume el protocolo parkour-media:// del main.
 * El renderer nunca ve el path absoluto del archivo.
 *
 * Si el archivo no existe en disco (fileMissing), no intentamos cargar
 * el video — sólo mostramos un placeholder.
 */
export function VideoPlayer({ video }: Props) {
  const src = useMemo(() => videoMediaUrl(video.id), [video.id])

  if (video.fileMissing) {
    return (
      <div className="aspect-video rounded-lg border border-dashed bg-muted/40 flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
        <AlertTriangle className="h-6 w-6" />
        <p className="text-sm font-medium">No encontramos el archivo</p>
        <p className="text-xs">
          Es probable que lo hayas movido o borrado del disco.
        </p>
        <p className="text-xs font-mono break-all opacity-60 mt-1">
          {video.filePath}
        </p>
      </div>
    )
  }

  return (
    <video
      key={src}
      controls
      preload="metadata"
      className="w-full max-h-[60vh] rounded-lg bg-black"
      src={src}
    />
  )
}
