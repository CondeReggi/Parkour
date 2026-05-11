import type { VideoReviewStatus } from '@shared/types/video'

export const REVIEW_STATUS_LABEL: Record<VideoReviewStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  improved: 'Mejora visible'
}

export const REVIEW_STATUS_OPTIONS: { value: VideoReviewStatus; label: string }[] = [
  { value: 'pending', label: REVIEW_STATUS_LABEL.pending },
  { value: 'reviewed', label: REVIEW_STATUS_LABEL.reviewed },
  { value: 'improved', label: REVIEW_STATUS_LABEL.improved }
]

export function reviewStatusBadgeVariant(
  status: VideoReviewStatus
): 'secondary' | 'default' | 'outline' {
  switch (status) {
    case 'improved':
      return 'default'
    case 'reviewed':
      return 'secondary'
    case 'pending':
    default:
      return 'outline'
  }
}
