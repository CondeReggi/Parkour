import type { Visibility } from './sharing'

/**
 * Tipos del DTO de un post.
 *
 * Convención: el DTO público NO trae rutas locales de archivos. Si un
 * video referenciado tiene filePath/thumbnailPath, no aparecen acá —
 * sólo el id + nombre.
 */

export const POST_TYPES = [
  'question',
  'progress',
  'advice',
  'shared_spot',
  'shared_routine',
  'video_review',
  'achievement',
  'general'
] as const

export type PostType = (typeof POST_TYPES)[number]

export const POST_STATUSES = ['active', 'hidden', 'deleted', 'reported'] as const
export type PostStatus = (typeof POST_STATUSES)[number]

/** Snapshot ligero del autor para mostrar en card/detalle. */
export interface PostAuthorDto {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}

/** Referencias livianas a contenido relacionado. Sin rutas de archivo. */
export interface PostMovementRef {
  id: string
  name: string
  slug: string
}

export interface PostSpotRef {
  id: string
  name: string
  visibility: Visibility
}

export interface PostRoutineRef {
  id: string
  name: string
  slug: string | null
  visibility: Visibility
}

export interface PostVideoRef {
  id: string
  fileName: string
  visibility: Visibility
  /** NO incluye filePath ni thumbnailPath: ambos son rutas locales. */
}

export interface PostSessionRef {
  id: string
  startedAt: string
}

export interface PostDto {
  id: string
  author: PostAuthorDto
  title: string
  body: string
  type: PostType
  visibility: Visibility
  status: PostStatus
  relatedMovement: PostMovementRef | null
  relatedSpot: PostSpotRef | null
  relatedRoutine: PostRoutineRef | null
  relatedVideo: PostVideoRef | null
  relatedSession: PostSessionRef | null
  /** True si el viewer es el autor del post. */
  isOwnedByCurrentUser: boolean
  /** Cantidad de comentarios no eliminados (top-level + replies). */
  commentCount: number
  createdAt: string
  updatedAt: string
  /** ISO. Sólo aparece si status='deleted'. */
  deletedAt: string | null
}

/**
 * Helpers para microcopy de tipos.
 */
export interface PostTypeOption {
  value: PostType
  label: string
  description: string
}

export const POST_TYPE_OPTIONS: PostTypeOption[] = [
  {
    value: 'question',
    label: 'Pregunta',
    description: 'Buscás ayuda o consejo de la comunidad.'
  },
  {
    value: 'progress',
    label: 'Progreso',
    description: 'Mostrar avance personal o un hito.'
  },
  {
    value: 'advice',
    label: 'Consejo',
    description: 'Compartís lo que te funcionó.'
  },
  {
    value: 'shared_spot',
    label: 'Spot compartido',
    description: 'Presentar un spot tuyo.'
  },
  {
    value: 'shared_routine',
    label: 'Rutina compartida',
    description: 'Presentar una rutina personalizada.'
  },
  {
    value: 'video_review',
    label: 'Review de video',
    description: 'Analizás un video propio o pedís feedback.'
  },
  {
    value: 'achievement',
    label: 'Logro',
    description: 'Celebrás un achievement.'
  },
  {
    value: 'general',
    label: 'General',
    description: 'Cualquier cosa que no entra en las otras.'
  }
]
