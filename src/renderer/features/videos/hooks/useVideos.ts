import { useQuery } from '@tanstack/react-query'
import type { VideoDto } from '@shared/types/video'

export const videosKeys = {
  all: ['videos'] as const,
  list: () => [...videosKeys.all, 'list'] as const,
  byId: (id: string) => [...videosKeys.all, 'byId', id] as const
}

export function useVideos() {
  return useQuery<VideoDto[]>({
    queryKey: videosKeys.list(),
    queryFn: () => window.parkourApi.videos.getAll()
  })
}
