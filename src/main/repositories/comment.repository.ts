/**
 * Repositorio de Comment (polimórfico sobre Post/Spot/Movement).
 *
 * Reglas que aplica:
 *  - Al crear: el target (post/spot/movement) debe existir.
 *  - Nesting de 1 nivel: si viene `parentCommentId`, el parent debe ser
 *    top-level (parentCommentId === null) y estar en el mismo target.
 *  - Edición y soft-delete sólo por el autor.
 *  - Listado: devuelve top-level + sus replies anidadas. Filtra
 *    `status='deleted'` salvo que la fila eliminada tenga replies vivas
 *    (en ese caso se devuelve con body=null como tombstone).
 *  - Conteo: cuenta sólo `status != 'deleted'`.
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'
import type {
  CommentDto,
  CommentStatus,
  CommentTarget
} from '@shared/types/comment'
import type {
  CreateCommentInput,
  UpdateCommentInput
} from '@shared/schemas/comment.schemas'

const COMMENT_INCLUDE = {
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true
    }
  }
} satisfies Prisma.CommentInclude

type CommentRow = Prisma.CommentGetPayload<{ include: typeof COMMENT_INCLUDE }>

function targetToWhere(t: CommentTarget): Prisma.CommentWhereInput {
  switch (t.kind) {
    case 'post':
      return { postId: t.id }
    case 'spot':
      return { spotId: t.id }
    case 'movement':
      return { movementId: t.id }
  }
}

function rowToDto(
  row: CommentRow,
  viewerAccountId: string | null,
  replies: CommentDto[]
): CommentDto {
  const isDeleted = row.status === 'deleted'
  return {
    id: row.id,
    author: {
      id: row.author.id,
      username: row.author.username,
      displayName: row.author.displayName,
      avatarUrl: row.author.avatarUrl
    },
    body: isDeleted ? null : row.body,
    status: row.status as CommentStatus,
    parentCommentId: row.parentCommentId,
    isOwnedByCurrentUser:
      viewerAccountId !== null && viewerAccountId === row.authorAccountId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    replies
  }
}

/**
 * Verifica que el target exista en su tabla correspondiente.
 * Throw si no existe.
 */
async function assertTargetExists(t: CommentTarget): Promise<void> {
  let exists = false
  switch (t.kind) {
    case 'post': {
      const row = await prisma.post.findUnique({
        where: { id: t.id },
        select: { id: true, status: true }
      })
      exists = !!row && row.status !== 'deleted'
      break
    }
    case 'spot': {
      const row = await prisma.spot.findUnique({
        where: { id: t.id },
        select: { id: true }
      })
      exists = !!row
      break
    }
    case 'movement': {
      const row = await prisma.movement.findUnique({
        where: { id: t.id },
        select: { id: true }
      })
      exists = !!row
      break
    }
  }
  if (!exists) {
    throw new Error('El contenido al que querés comentar ya no existe.')
  }
}

export const commentRepository = {
  /**
   * Lista comentarios de un target en orden cronológico ascendente,
   * agrupados como top-level con sus replies anidadas. Las replies se
   * ordenan por createdAt asc. Devuelve tombstones para top-level
   * eliminados si tienen replies vivas; los eliminados sin replies se
   * omiten.
   */
  async getByTarget(
    target: CommentTarget,
    viewerAccountId: string | null
  ): Promise<CommentDto[]> {
    const where = targetToWhere(target)

    // Traemos todo del target en una sola query (top-level + replies).
    const all = await prisma.comment.findMany({
      where,
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'asc' }
    })

    // Agrupamos: top-level (parentCommentId=null) y replies indexadas
    // por parentCommentId.
    const repliesByParent = new Map<string, CommentRow[]>()
    const topLevel: CommentRow[] = []
    for (const c of all) {
      if (c.parentCommentId === null) {
        topLevel.push(c)
      } else {
        const list = repliesByParent.get(c.parentCommentId) ?? []
        list.push(c)
        repliesByParent.set(c.parentCommentId, list)
      }
    }

    const result: CommentDto[] = []
    for (const parent of topLevel) {
      const childRows = repliesByParent.get(parent.id) ?? []
      // Filtra replies eliminadas (no las mostramos, no tienen sub-hilo
      // que preservar — son hojas).
      const childDtos: CommentDto[] = childRows
        .filter((r) => r.status !== 'deleted')
        .map((r) => rowToDto(r, viewerAccountId, []))

      const parentIsDeleted = parent.status === 'deleted'
      // Tombstone: si el top-level está eliminado pero tiene replies
      // vivas, lo conservamos como tombstone para no romper el hilo.
      if (parentIsDeleted && childDtos.length === 0) continue
      result.push(rowToDto(parent, viewerAccountId, childDtos))
    }
    return result
  },

  /**
   * Conteo total de comentarios (top-level + replies) no eliminados.
   * Útil para mostrar "12 comentarios" en cards.
   */
  async countByTarget(target: CommentTarget): Promise<number> {
    return prisma.comment.count({
      where: {
        ...targetToWhere(target),
        status: { not: 'deleted' }
      }
    })
  },

  /**
   * Conteos por postId, en una sola query. Lo usa el repo de Post para
   * adjuntar commentCount a los DTOs del feed sin N+1.
   */
  async countsByPostIds(postIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>()
    if (postIds.length === 0) return map
    const rows = await prisma.comment.groupBy({
      by: ['postId'],
      where: {
        postId: { in: postIds },
        status: { not: 'deleted' }
      },
      _count: { _all: true }
    })
    for (const r of rows) {
      if (r.postId) map.set(r.postId, r._count._all)
    }
    return map
  },

  async create(
    input: CreateCommentInput,
    authorAccountId: string
  ): Promise<CommentDto> {
    await assertTargetExists(input.target)

    // Si es respuesta, validamos: parent existe, está vivo, no es a su
    // vez una respuesta, y pertenece al mismo target.
    if (input.parentCommentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: input.parentCommentId },
        select: {
          id: true,
          parentCommentId: true,
          status: true,
          postId: true,
          spotId: true,
          movementId: true
        }
      })
      if (!parent || parent.status === 'deleted') {
        throw new Error('El comentario al que querés responder ya no existe.')
      }
      if (parent.parentCommentId !== null) {
        throw new Error('No se permiten respuestas a respuestas.')
      }
      const sameTarget =
        (input.target.kind === 'post' && parent.postId === input.target.id) ||
        (input.target.kind === 'spot' && parent.spotId === input.target.id) ||
        (input.target.kind === 'movement' && parent.movementId === input.target.id)
      if (!sameTarget) {
        throw new Error('El comentario padre no pertenece al mismo contenido.')
      }
    }

    const created = await prisma.comment.create({
      data: {
        authorAccountId,
        body: input.body,
        parentCommentId: input.parentCommentId ?? null,
        postId: input.target.kind === 'post' ? input.target.id : null,
        spotId: input.target.kind === 'spot' ? input.target.id : null,
        movementId: input.target.kind === 'movement' ? input.target.id : null
      },
      include: COMMENT_INCLUDE
    })
    return rowToDto(created, authorAccountId, [])
  },

  async update(
    input: UpdateCommentInput,
    requesterAccountId: string
  ): Promise<CommentDto> {
    const existing = await prisma.comment.findUnique({
      where: { id: input.id },
      select: { authorAccountId: true, status: true }
    })
    if (!existing || existing.status === 'deleted') {
      throw new Error('El comentario ya no existe.')
    }
    if (existing.authorAccountId !== requesterAccountId) {
      throw new Error('No podés editar un comentario que no es tuyo.')
    }
    const updated = await prisma.comment.update({
      where: { id: input.id },
      data: { body: input.body },
      include: COMMENT_INCLUDE
    })
    return rowToDto(updated, requesterAccountId, [])
  },

  async softDelete(id: string, requesterAccountId: string): Promise<void> {
    const existing = await prisma.comment.findUnique({
      where: { id },
      select: { authorAccountId: true, status: true }
    })
    if (!existing || existing.status === 'deleted') return // idempotente
    if (existing.authorAccountId !== requesterAccountId) {
      throw new Error('No podés eliminar un comentario que no es tuyo.')
    }
    await prisma.comment.update({
      where: { id },
      data: { status: 'deleted', deletedAt: new Date() }
    })
  }
}
