/**
 * Repositorio de VideoEntry.
 *
 * Convención de almacenamiento: la app NO copia el video. Sólo guarda el path
 * absoluto que el usuario eligió. Si el archivo desaparece, marcamos el DTO
 * con fileMissing=true para que el UI lo señalice (y bloqueamos la reproducción).
 */

import { existsSync } from 'node:fs'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'
import type { VideoDto, VideoReviewStatus } from '@shared/types/video'
import type {
  CreateVideoInput,
  UpdateVideoInput
} from '@shared/schemas/video.schemas'
import { xpEventRepository } from './xpEvent.repository'
import { questRepository } from './quest.repository'
import { achievementRepository } from './achievement.repository'
import { authService } from '../services/authService'

const VIDEO_INCLUDE = {
  movement: { select: { id: true, name: true, slug: true } },
  spot: { select: { id: true, name: true } },
  session: { select: { id: true, startedAt: true } }
} satisfies Prisma.VideoEntryInclude

type VideoWithRelations = Prisma.VideoEntryGetPayload<{ include: typeof VIDEO_INCLUDE }>

function videoToDto(v: VideoWithRelations): VideoDto {
  return {
    id: v.id,
    filePath: v.filePath,
    fileName: v.fileName,
    thumbnailPath: v.thumbnailPath,
    durationSec: v.durationSec,
    recordedAt: v.recordedAt ? v.recordedAt.toISOString() : null,
    movement: v.movement
      ? { id: v.movement.id, name: v.movement.name, slug: v.movement.slug }
      : null,
    spot: v.spot ? { id: v.spot.id, name: v.spot.name } : null,
    session: v.session
      ? { id: v.session.id, startedAt: v.session.startedAt.toISOString() }
      : null,
    notes: v.notes,
    whatWentWell: v.whatWentWell,
    whatWentWrong: v.whatWentWrong,
    reviewStatus: v.reviewStatus as VideoReviewStatus,
    fileMissing: !existsSync(v.filePath),
    authorAccountId: v.authorAccountId,
    visibility: v.visibility as VideoDto['visibility'],
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString()
  }
}

export const videoRepository = {
  async getAll(): Promise<VideoDto[]> {
    const rows = await prisma.videoEntry.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: VIDEO_INCLUDE
    })
    return rows.map(videoToDto)
  },

  async getById(id: string): Promise<VideoDto | null> {
    const row = await prisma.videoEntry.findUnique({
      where: { id },
      include: VIDEO_INCLUDE
    })
    return row ? videoToDto(row) : null
  },

  /** Devuelve sólo el path absoluto. Lo usa el protocolo parkour-media://. */
  async getFilePath(id: string): Promise<string | null> {
    const row = await prisma.videoEntry.findUnique({
      where: { id },
      select: { filePath: true }
    })
    return row?.filePath ?? null
  },

  async create(input: CreateVideoInput): Promise<VideoDto> {
    // Fase 0: sembramos autor si hay sesión activa.
    const authorAccountId = await authService.getCurrentAccountId()
    const created = await prisma.videoEntry.create({
      data: {
        filePath: input.filePath,
        fileName: input.fileName,
        movementId: input.movementId,
        spotId: input.spotId,
        sessionId: input.sessionId,
        notes: input.notes,
        whatWentWell: input.whatWentWell,
        whatWentWrong: input.whatWentWrong,
        reviewStatus: input.reviewStatus,
        authorAccountId
        // visibility default 'private'
      },
      include: VIDEO_INCLUDE
    })

    // XP por subir el video. Dedup por videoId.
    const grantedUpload = await xpEventRepository.grantForActive(
      'video_uploaded',
      created.id
    )
    if (grantedUpload) {
      await questRepository.progressForActive('videos_uploaded')
    }
    // Si el usuario lo crea ya marcado como revisado, también suma el XP
    // de revisión (mismo dedup, una vez por video).
    if (created.reviewStatus !== 'pending') {
      const grantedReview = await xpEventRepository.grantForActive(
        'video_reviewed',
        created.id
      )
      if (grantedReview) {
        await questRepository.progressForActive('videos_reviewed')
      }
    }

    await achievementRepository.evaluateAndUnlockForActive()

    return videoToDto(created)
  },

  async update(input: UpdateVideoInput): Promise<VideoDto> {
    const { id, ...data } = input
    const updated = await prisma.videoEntry.update({
      where: { id },
      data: {
        movementId: data.movementId,
        spotId: data.spotId,
        sessionId: data.sessionId,
        notes: data.notes,
        whatWentWell: data.whatWentWell,
        whatWentWrong: data.whatWentWrong,
        reviewStatus: data.reviewStatus
      },
      include: VIDEO_INCLUDE
    })

    // XP por revisar el video. Si vuelve a 'pending' no quitamos XP — la
    // acción de revisión ya ocurrió alguna vez. Dedup por videoId.
    if (updated.reviewStatus !== 'pending') {
      const grantedReview = await xpEventRepository.grantForActive(
        'video_reviewed',
        updated.id
      )
      if (grantedReview) {
        await questRepository.progressForActive('videos_reviewed')
      }
    }

    await achievementRepository.evaluateAndUnlockForActive()

    return videoToDto(updated)
  },

  async remove(id: string): Promise<void> {
    await prisma.videoEntry.delete({ where: { id } })
  }
}
