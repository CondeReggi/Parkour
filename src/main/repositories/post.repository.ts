/**
 * Repositorio de Post.
 *
 * Reglas:
 *  - Lecturas filtran soft-deleted (`status='deleted'`) por default.
 *  - El feed sólo muestra `status='active'` y `visibility != 'private'`.
 *  - `getMine` devuelve todos los estados/visibilities del usuario,
 *    salvo `deleted` (soft-deleted ya no se ve en su listado tampoco).
 *  - `getById` aplica permiso: si el viewer no es el autor y el post
 *    no es público/activo, devuelve null.
 *  - `create`/`update` requieren accountId del autor; el handler IPC
 *    valida que haya sesión activa antes de llamar.
 *  - `delete` es soft: `status='deleted'`, `deletedAt=now()`.
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'
import type {
  PostAuthorDto,
  PostDto,
  PostStatus,
  PostType
} from '@shared/types/post'
import type { Visibility } from '@shared/types/sharing'
import type {
  CreatePostInput,
  GetFeedInput,
  UpdatePostInput
} from '@shared/schemas/post.schemas'
import { commentRepository } from './comment.repository'

const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true
    }
  },
  relatedMovement: { select: { id: true, name: true, slug: true } },
  relatedSpot: { select: { id: true, name: true, visibility: true } },
  relatedRoutine: {
    select: { id: true, name: true, slug: true, visibility: true }
  },
  relatedVideo: {
    select: { id: true, fileName: true, visibility: true }
  },
  relatedSession: { select: { id: true, startedAt: true } }
} satisfies Prisma.PostInclude

type PostWithRelations = Prisma.PostGetPayload<{ include: typeof POST_INCLUDE }>

function authorToDto(a: PostWithRelations['author']): PostAuthorDto {
  return {
    id: a.id,
    username: a.username,
    displayName: a.displayName,
    avatarUrl: a.avatarUrl
  }
}

function postToDto(
  p: PostWithRelations,
  viewerAccountId: string | null,
  commentCount: number
): PostDto {
  return {
    id: p.id,
    author: authorToDto(p.author),
    title: p.title,
    body: p.body,
    type: p.type as PostType,
    visibility: p.visibility as Visibility,
    status: p.status as PostStatus,
    relatedMovement: p.relatedMovement
      ? {
          id: p.relatedMovement.id,
          name: p.relatedMovement.name,
          slug: p.relatedMovement.slug
        }
      : null,
    relatedSpot: p.relatedSpot
      ? {
          id: p.relatedSpot.id,
          name: p.relatedSpot.name,
          visibility: p.relatedSpot.visibility as Visibility
        }
      : null,
    relatedRoutine: p.relatedRoutine
      ? {
          id: p.relatedRoutine.id,
          name: p.relatedRoutine.name,
          slug: p.relatedRoutine.slug,
          visibility: p.relatedRoutine.visibility as Visibility
        }
      : null,
    relatedVideo: p.relatedVideo
      ? {
          id: p.relatedVideo.id,
          fileName: p.relatedVideo.fileName,
          visibility: p.relatedVideo.visibility as Visibility
        }
      : null,
    relatedSession: p.relatedSession
      ? {
          id: p.relatedSession.id,
          startedAt: p.relatedSession.startedAt.toISOString()
        }
      : null,
    isOwnedByCurrentUser:
      viewerAccountId !== null && viewerAccountId === p.authorAccountId,
    commentCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null
  }
}

/**
 * Helper para mapear rows + adjuntar commentCount en batch.
 */
async function rowsToDtosWithCounts(
  rows: PostWithRelations[],
  viewerAccountId: string | null
): Promise<PostDto[]> {
  const counts = await commentRepository.countsByPostIds(rows.map((r) => r.id))
  return rows.map((p) => postToDto(p, viewerAccountId, counts.get(p.id) ?? 0))
}

export const postRepository = {
  /**
   * Feed público. Devuelve posts activos y non-private, ordenados por
   * createdAt desc. Acepta filtro por tipo (uno o varios).
   */
  async getFeed(
    input: GetFeedInput,
    viewerAccountId: string | null
  ): Promise<PostDto[]> {
    const rawType = input?.type
    const limit = input?.limit ?? 50

    const typeFilter = rawType
      ? Array.isArray(rawType)
        ? { in: rawType }
        : rawType
      : undefined

    const rows = await prisma.post.findMany({
      where: {
        status: 'active',
        visibility: { in: ['public', 'unlisted'] },
        ...(typeFilter !== undefined && { type: typeFilter })
      },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    return rowsToDtosWithCounts(rows, viewerAccountId)
  },

  /**
   * Posts del usuario logueado (cualquier visibility), excepto los
   * soft-deleted. Ordenados por createdAt desc.
   */
  async getMine(viewerAccountId: string): Promise<PostDto[]> {
    const rows = await prisma.post.findMany({
      where: {
        authorAccountId: viewerAccountId,
        status: { not: 'deleted' }
      },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' }
    })
    return rowsToDtosWithCounts(rows, viewerAccountId)
  },

  /**
   * Posts de un autor puntual. Pública: cualquiera puede pedirla.
   * Aplica los mismos filtros que el feed (activos y non-private),
   * salvo que el viewer sea el propio autor.
   */
  async getByAuthor(
    authorAccountId: string,
    limit: number,
    viewerAccountId: string | null
  ): Promise<PostDto[]> {
    const isOwner = viewerAccountId === authorAccountId
    const rows = await prisma.post.findMany({
      where: {
        authorAccountId,
        ...(isOwner
          ? { status: { not: 'deleted' } }
          : {
              status: 'active',
              visibility: { in: ['public', 'unlisted'] }
            })
      },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    return rowsToDtosWithCounts(rows, viewerAccountId)
  },

  /**
   * Devuelve un post por id. Aplica permisos:
   *  - El autor siempre puede ver su propio post (cualquier visibility
   *    o status excepto deleted).
   *  - Otros usuarios sólo si el post es active + non-private.
   *  - Si no se cumple, devuelve null (la UI lo trata como "no existe").
   */
  async getById(
    id: string,
    viewerAccountId: string | null
  ): Promise<PostDto | null> {
    const row = await prisma.post.findUnique({
      where: { id },
      include: POST_INCLUDE
    })
    if (!row) return null
    if (row.status === 'deleted') return null

    const isOwner = viewerAccountId !== null && viewerAccountId === row.authorAccountId
    if (!isOwner) {
      if (row.status !== 'active') return null
      if (row.visibility === 'private') return null
    }
    const count = await commentRepository.countByTarget({ kind: 'post', id: row.id })
    return postToDto(row, viewerAccountId, count)
  },

  async create(
    input: CreatePostInput,
    authorAccountId: string
  ): Promise<PostDto> {
    const created = await prisma.post.create({
      data: {
        authorAccountId,
        title: input.title,
        body: input.body,
        type: input.type,
        visibility: input.visibility,
        relatedMovementId: input.relatedMovementId,
        relatedSpotId: input.relatedSpotId,
        relatedRoutineId: input.relatedRoutineId,
        relatedVideoId: input.relatedVideoId,
        relatedSessionId: input.relatedSessionId
      },
      include: POST_INCLUDE
    })
    return postToDto(created, authorAccountId, 0)
  },

  /**
   * Edita un post. Verifica autoría: si el accountId que pide la
   * edición no es el autor, tira error legible.
   */
  async update(
    input: UpdatePostInput,
    requesterAccountId: string
  ): Promise<PostDto> {
    const existing = await prisma.post.findUnique({
      where: { id: input.id },
      select: { authorAccountId: true, status: true }
    })
    if (!existing || existing.status === 'deleted') {
      throw new Error('El post no existe o fue eliminado.')
    }
    if (existing.authorAccountId !== requesterAccountId) {
      throw new Error('No podés editar un post que no es tuyo.')
    }

    const updated = await prisma.post.update({
      where: { id: input.id },
      data: {
        title: input.title,
        body: input.body,
        type: input.type,
        visibility: input.visibility,
        relatedMovementId: input.relatedMovementId,
        relatedSpotId: input.relatedSpotId,
        relatedRoutineId: input.relatedRoutineId,
        relatedVideoId: input.relatedVideoId,
        relatedSessionId: input.relatedSessionId
      },
      include: POST_INCLUDE
    })
    const count = await commentRepository.countByTarget({ kind: 'post', id: updated.id })
    return postToDto(updated, requesterAccountId, count)
  },

  /**
   * Soft delete: marca status='deleted' + deletedAt=now. La fila queda
   * pero las queries la filtran. Sólo el autor puede borrar.
   */
  async softDelete(id: string, requesterAccountId: string): Promise<void> {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorAccountId: true, status: true }
    })
    if (!existing || existing.status === 'deleted') {
      // Idempotente: borrar dos veces el mismo post no es error.
      return
    }
    if (existing.authorAccountId !== requesterAccountId) {
      throw new Error('No podés eliminar un post que no es tuyo.')
    }
    await prisma.post.update({
      where: { id },
      data: { status: 'deleted', deletedAt: new Date() }
    })
  }
}
