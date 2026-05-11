import type { Visibility } from './sharing'

export type VideoReviewStatus = 'pending' | 'reviewed' | 'improved'

export interface VideoMovementRef {
  id: string
  name: string
  slug: string
}

export interface VideoSpotRef {
  id: string
  name: string
}

export interface VideoSessionRef {
  id: string
  startedAt: string
}

export interface VideoDto {
  id: string
  filePath: string
  fileName: string
  thumbnailPath: string | null
  durationSec: number | null
  recordedAt: string | null
  movement: VideoMovementRef | null
  spot: VideoSpotRef | null
  session: VideoSessionRef | null
  notes: string | null
  whatWentWell: string | null
  whatWentWrong: string | null
  reviewStatus: VideoReviewStatus
  /** El archivo en filePath ya no existe en disco. Se recalcula en cada lectura. */
  fileMissing: boolean
  /**
   * =====  Fase 0: campos reservados para comunidad futura  =====
   */
  authorAccountId: string | null
  visibility: Visibility
  createdAt: string
  updatedAt: string
}

/** Resultado de abrir el file picker. null = el usuario canceló. */
export interface PickedVideo {
  filePath: string
  fileName: string
}
