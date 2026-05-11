/**
 * Repositorio de Spot + SpotObstacle + SpotObstacleMovement + SpotPhoto +
 * SpotIdealMovement.
 *
 * Los spots son globales (no scopados al perfil activo). Pero sessionCount
 * y lastTrainedAt sí se computan sobre las sesiones del perfil activo —
 * son derived fields que viajan en el DTO.
 */

import { existsSync } from 'node:fs'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'
import { settingsRepository } from './settings.repository'
import type {
  FloorType,
  ObstacleRiskLevel,
  ObstacleType,
  RecommendedLevel,
  SpotDto,
  SpotIdealMovementDto,
  SpotObstacleDto,
  SpotPhotoDto,
  SpotRiskLevel,
  SpotType
} from '@shared/types/spot'
import type {
  AddObstacleInput,
  AddSpotPhotoInput,
  CreateSpotInput,
  SetIdealMovementsInput,
  SetObstacleMovementsInput,
  UpdateObstacleInput,
  UpdateSpotInput,
  UpdateSpotPhotoInput
} from '@shared/schemas/spot.schemas'
import { xpEventRepository } from './xpEvent.repository'
import { questRepository } from './quest.repository'
import { achievementRepository } from './achievement.repository'

const FULL_SPOT_INCLUDE = {
  obstacles: {
    include: {
      recommendedMovements: {
        include: {
          movement: { select: { id: true, name: true, slug: true } }
        }
      }
    }
  },
  photos: true,
  idealMovements: {
    include: {
      movement: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          difficulty: true
        }
      }
    }
  }
} satisfies Prisma.SpotInclude

const FULL_OBSTACLE_INCLUDE = {
  recommendedMovements: {
    include: {
      movement: { select: { id: true, name: true, slug: true } }
    }
  }
} satisfies Prisma.SpotObstacleInclude

type SpotWithRelations = Prisma.SpotGetPayload<{ include: typeof FULL_SPOT_INCLUDE }>
type ObstacleWithRelations = Prisma.SpotObstacleGetPayload<{
  include: typeof FULL_OBSTACLE_INCLUDE
}>
type PhotoRow = SpotWithRelations['photos'][number]
type IdealRow = SpotWithRelations['idealMovements'][number]

function parseTagsField(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : []
  } catch {
    return []
  }
}

function photoToDto(p: PhotoRow): SpotPhotoDto {
  return {
    id: p.id,
    spotId: p.spotId,
    filePath: p.filePath,
    fileName: p.fileName,
    caption: p.caption,
    order: p.order,
    fileMissing: !existsSync(p.filePath),
    createdAt: p.createdAt.toISOString()
  }
}

function idealToDto(i: IdealRow): SpotIdealMovementDto {
  return {
    movementId: i.movement.id,
    movementName: i.movement.name,
    movementSlug: i.movement.slug,
    movementCategory: i.movement.category,
    movementDifficulty: i.movement.difficulty,
    notes: i.notes
  }
}

function obstacleToDto(o: ObstacleWithRelations): SpotObstacleDto {
  return {
    id: o.id,
    spotId: o.spotId,
    name: o.name,
    type: o.type as ObstacleType,
    riskLevel: o.riskLevel as ObstacleRiskLevel,
    notes: o.notes,
    recommendedMovements: o.recommendedMovements.map((rm) => ({
      movementId: rm.movement.id,
      movementName: rm.movement.name,
      movementSlug: rm.movement.slug
    })),
    createdAt: o.createdAt.toISOString()
  }
}

interface SessionAgg {
  count: number
  lastTrainedAt: string | null
}

async function aggregateSessionsForSpots(
  spotIds: string[]
): Promise<Map<string, SessionAgg>> {
  const map = new Map<string, SessionAgg>()
  if (spotIds.length === 0) return map

  const profileId = await settingsRepository.getActiveProfileId()
  if (!profileId) return map

  const rows = await prisma.workoutSession.findMany({
    where: {
      profileId,
      endedAt: { not: null },
      spotId: { in: spotIds }
    },
    select: { spotId: true, endedAt: true }
  })

  for (const r of rows) {
    if (!r.spotId || !r.endedAt) continue
    const prev = map.get(r.spotId)
    if (!prev) {
      map.set(r.spotId, {
        count: 1,
        lastTrainedAt: r.endedAt.toISOString()
      })
    } else {
      prev.count += 1
      if (!prev.lastTrainedAt || r.endedAt.toISOString() > prev.lastTrainedAt) {
        prev.lastTrainedAt = r.endedAt.toISOString()
      }
    }
  }

  return map
}

function spotToDto(s: SpotWithRelations, agg: SessionAgg | undefined): SpotDto {
  return {
    id: s.id,
    name: s.name,
    locationText: s.locationText,
    description: s.description,
    floorType: (s.floorType as FloorType | null) ?? null,
    riskLevel: s.riskLevel as SpotRiskLevel,
    recommendedHours: s.recommendedHours,
    beginnerFriendly: s.beginnerFriendly,
    notes: s.notes,
    spotType: (s.spotType as SpotType | null) ?? null,
    recommendedLevel: (s.recommendedLevel as RecommendedLevel | null) ?? null,
    tags: parseTagsField(s.tags),
    isFavorite: s.isFavorite,
    latitude: s.latitude,
    longitude: s.longitude,
    photos: s.photos
      .slice()
      .sort((a, b) => a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime())
      .map(photoToDto),
    obstacles: s.obstacles
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(obstacleToDto),
    idealMovements: s.idealMovements
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(idealToDto),
    sessionCount: agg?.count ?? 0,
    lastTrainedAt: agg?.lastTrainedAt ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString()
  }
}

export const spotRepository = {
  async getAll(): Promise<SpotDto[]> {
    const rows = await prisma.spot.findMany({
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
      include: FULL_SPOT_INCLUDE
    })
    const aggMap = await aggregateSessionsForSpots(rows.map((r) => r.id))
    return rows.map((r) => spotToDto(r, aggMap.get(r.id)))
  },

  async getById(id: string): Promise<SpotDto | null> {
    const row = await prisma.spot.findUnique({
      where: { id },
      include: FULL_SPOT_INCLUDE
    })
    if (!row) return null
    const aggMap = await aggregateSessionsForSpots([row.id])
    return spotToDto(row, aggMap.get(row.id))
  },

  /** Resuelve la ruta absoluta del archivo de una foto. Devuelve null si la foto no existe. */
  async getPhotoFilePath(id: string): Promise<string | null> {
    const row = await prisma.spotPhoto.findUnique({
      where: { id },
      select: { filePath: true }
    })
    return row?.filePath ?? null
  },

  async create(input: CreateSpotInput): Promise<SpotDto> {
    const created = await prisma.spot.create({
      data: {
        name: input.name,
        locationText: input.locationText,
        description: input.description,
        floorType: input.floorType,
        riskLevel: input.riskLevel,
        recommendedHours: input.recommendedHours,
        beginnerFriendly: input.beginnerFriendly,
        notes: input.notes,
        spotType: input.spotType,
        recommendedLevel: input.recommendedLevel,
        tags: JSON.stringify(input.tags),
        isFavorite: input.isFavorite,
        latitude: input.latitude,
        longitude: input.longitude
      },
      include: FULL_SPOT_INCLUDE
    })

    // XP por registrar un spot. Dedup por spotId.
    const granted = await xpEventRepository.grantForActive(
      'spot_registered',
      created.id
    )
    if (granted) {
      await questRepository.progressForActive('spots_registered')
    }

    await achievementRepository.evaluateAndUnlockForActive()

    const aggMap = await aggregateSessionsForSpots([created.id])
    return spotToDto(created, aggMap.get(created.id))
  },

  async update(input: UpdateSpotInput): Promise<SpotDto> {
    const { id, ...data } = input
    const updated = await prisma.spot.update({
      where: { id },
      data: {
        name: data.name,
        locationText: data.locationText,
        description: data.description,
        floorType: data.floorType,
        riskLevel: data.riskLevel,
        recommendedHours: data.recommendedHours,
        beginnerFriendly: data.beginnerFriendly,
        notes: data.notes,
        spotType: data.spotType,
        recommendedLevel: data.recommendedLevel,
        tags: JSON.stringify(data.tags),
        isFavorite: data.isFavorite,
        latitude: data.latitude,
        longitude: data.longitude
      },
      include: FULL_SPOT_INCLUDE
    })
    const aggMap = await aggregateSessionsForSpots([updated.id])
    return spotToDto(updated, aggMap.get(updated.id))
  },

  async setFavorite(id: string, isFavorite: boolean): Promise<SpotDto> {
    const updated = await prisma.spot.update({
      where: { id },
      data: { isFavorite },
      include: FULL_SPOT_INCLUDE
    })
    const aggMap = await aggregateSessionsForSpots([updated.id])
    return spotToDto(updated, aggMap.get(updated.id))
  },

  async remove(id: string): Promise<void> {
    await prisma.spot.delete({ where: { id } })
  },

  // === Obstacles ===

  async addObstacle(input: AddObstacleInput): Promise<SpotObstacleDto> {
    const created = await prisma.spotObstacle.create({
      data: {
        spotId: input.spotId,
        name: input.name,
        type: input.type,
        riskLevel: input.riskLevel,
        notes: input.notes
      },
      include: FULL_OBSTACLE_INCLUDE
    })
    return obstacleToDto(created)
  },

  async updateObstacle(input: UpdateObstacleInput): Promise<SpotObstacleDto> {
    const { id, ...rest } = input
    const updated = await prisma.spotObstacle.update({
      where: { id },
      data: {
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.type !== undefined && { type: rest.type }),
        ...(rest.riskLevel !== undefined && { riskLevel: rest.riskLevel }),
        ...(rest.notes !== undefined && { notes: rest.notes })
      },
      include: FULL_OBSTACLE_INCLUDE
    })
    return obstacleToDto(updated)
  },

  async removeObstacle(id: string): Promise<void> {
    await prisma.spotObstacle.delete({ where: { id } })
  },

  async setObstacleMovements(input: SetObstacleMovementsInput): Promise<SpotObstacleDto> {
    // Reemplazo total: borro las relaciones existentes y creo las nuevas.
    await prisma.spotObstacleMovement.deleteMany({
      where: { obstacleId: input.obstacleId }
    })
    if (input.movementIds.length > 0) {
      await prisma.spotObstacleMovement.createMany({
        data: input.movementIds.map((movementId) => ({
          obstacleId: input.obstacleId,
          movementId
        }))
      })
    }
    const updated = await prisma.spotObstacle.findUnique({
      where: { id: input.obstacleId },
      include: FULL_OBSTACLE_INCLUDE
    })
    if (!updated) throw new Error('Obstacle not found after movement update')
    return obstacleToDto(updated)
  },

  // === Ideal movements (a nivel de spot) ===

  async setIdealMovements(input: SetIdealMovementsInput): Promise<SpotDto> {
    await prisma.spotIdealMovement.deleteMany({
      where: { spotId: input.spotId }
    })
    if (input.movementIds.length > 0) {
      await prisma.spotIdealMovement.createMany({
        data: input.movementIds.map((movementId) => ({
          spotId: input.spotId,
          movementId
        }))
      })
    }
    const updated = await prisma.spot.findUnique({
      where: { id: input.spotId },
      include: FULL_SPOT_INCLUDE
    })
    if (!updated) throw new Error('Spot no encontrado al setear movimientos ideales')
    const aggMap = await aggregateSessionsForSpots([updated.id])
    return spotToDto(updated, aggMap.get(updated.id))
  },

  // === Photos ===

  async addPhoto(input: AddSpotPhotoInput): Promise<SpotPhotoDto> {
    // El nuevo arranca con order = max(order)+1 dentro del spot, para que
    // se agregue al final sin reordenar todo.
    const maxOrderRow = await prisma.spotPhoto.findFirst({
      where: { spotId: input.spotId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })
    const nextOrder = (maxOrderRow?.order ?? -1) + 1

    const created = await prisma.spotPhoto.create({
      data: {
        spotId: input.spotId,
        filePath: input.filePath,
        fileName: input.fileName,
        caption: input.caption,
        order: nextOrder
      }
    })
    return photoToDto(created)
  },

  async updatePhoto(input: UpdateSpotPhotoInput): Promise<SpotPhotoDto> {
    const { id, ...rest } = input
    const updated = await prisma.spotPhoto.update({
      where: { id },
      data: {
        ...(rest.caption !== undefined && { caption: rest.caption }),
        ...(rest.order !== undefined && { order: rest.order })
      }
    })
    return photoToDto(updated)
  },

  async removePhoto(id: string): Promise<void> {
    await prisma.spotPhoto.delete({ where: { id } })
  }
}
