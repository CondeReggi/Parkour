/**
 * Serializa todos los datos del usuario a un objeto plano JSON-friendly.
 * Las relaciones a entidades built-in (Movement, Routine built-in) se exportan
 * por slug para sobrevivir a re-seeds que cambian los cuids.
 */

import { prisma } from '../db/client'
import {
  EXPORT_VERSION,
  type ExportPayload
} from '@shared/types/portability'

export async function buildExportPayload(): Promise<ExportPayload> {
  // Cargamos las tablas en paralelo. Cada findMany es independiente.
  const [
    profiles,
    injuries,
    assessments,
    movementProgress,
    routines,
    routineBlocks,
    routineExercises,
    spots,
    spotObstacles,
    spotObstacleMovements,
    spotPhotos,
    spotIdealMovements,
    workoutSessions,
    workoutMovements,
    videos,
    movements,
    builtInRoutines,
    xpEvents,
    questAssignments,
    achievementUnlocks,
    dailyActivities
  ] = await Promise.all([
    prisma.userProfile.findMany(),
    prisma.injury.findMany(),
    prisma.initialAssessment.findMany(),
    prisma.movementProgress.findMany(),
    prisma.routine.findMany({ where: { isBuiltIn: false } }),
    prisma.routineBlock.findMany(),
    prisma.routineExercise.findMany(),
    prisma.spot.findMany(),
    prisma.spotObstacle.findMany(),
    prisma.spotObstacleMovement.findMany(),
    prisma.spotPhoto.findMany(),
    prisma.spotIdealMovement.findMany(),
    prisma.workoutSession.findMany(),
    prisma.workoutMovement.findMany(),
    prisma.videoEntry.findMany(),
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.routine.findMany({
      where: { isBuiltIn: true, slug: { not: null } },
      select: { id: true, slug: true }
    }),
    prisma.xpEvent.findMany(),
    prisma.questAssignment.findMany(),
    prisma.achievementUnlock.findMany(),
    prisma.dailyActivity.findMany()
  ])

  const movementSlugById = new Map<string, string>(
    movements.map((m) => [m.id, m.slug])
  )
  const builtInRoutineSlugById = new Map<string, string>(
    builtInRoutines
      .filter((r): r is { id: string; slug: string } => r.slug !== null)
      .map((r) => [r.id, r.slug])
  )

  // RoutineBlock referenciado por una RoutineExercise puede pertenecer a una
  // routine built-in (el seed crea blocks). Sólo exportamos blocks cuyas
  // routines son del usuario (custom).
  const customRoutineIds = new Set(routines.map((r) => r.id))
  const customRoutineBlocks = routineBlocks.filter((b) =>
    customRoutineIds.has(b.routineId)
  )
  const customBlockIds = new Set(customRoutineBlocks.map((b) => b.id))
  const customRoutineExercises = routineExercises.filter((e) =>
    customBlockIds.has(e.blockId)
  )

  // Si una routine custom referencia un movement built-in cuyo slug no
  // pudimos resolver (no debería pasar), exportamos null.
  const exportedExercises = customRoutineExercises.map((e) => ({
    id: e.id,
    blockId: e.blockId,
    movementSlug: e.movementId ? movementSlugById.get(e.movementId) ?? null : null,
    name: e.name,
    description: e.description,
    sets: e.sets,
    reps: e.reps,
    durationSec: e.durationSec,
    restSec: e.restSec,
    notes: e.notes,
    order: e.order
  }))

  // SpotObstacleMovement: la relación es obligatoria a movement built-in.
  // Si no resolvemos el slug, descartamos la relación.
  const exportedObstacleMovements = spotObstacleMovements
    .map((sm) => {
      const slug = movementSlugById.get(sm.movementId)
      return slug ? { obstacleId: sm.obstacleId, movementSlug: slug } : null
    })
    .filter((x): x is { obstacleId: string; movementSlug: string } => x !== null)

  // SpotIdealMovement: idem que obstacleMovement, descartamos si no resuelve.
  const exportedSpotIdealMovements = spotIdealMovements
    .map((im) => {
      const slug = movementSlugById.get(im.movementId)
      return slug
        ? { spotId: im.spotId, movementSlug: slug, notes: im.notes }
        : null
    })
    .filter(
      (x): x is { spotId: string; movementSlug: string; notes: string | null } =>
        x !== null
    )

  // WorkoutMovement: relación obligatoria. Descartamos si no resuelve.
  const exportedWorkoutMovements = workoutMovements
    .map((wm) => {
      const slug = movementSlugById.get(wm.movementId)
      return slug
        ? {
            id: wm.id,
            sessionId: wm.sessionId,
            movementSlug: slug,
            attempts: wm.attempts,
            successful: wm.successful,
            notes: wm.notes,
            createdAt: wm.createdAt.toISOString()
          }
        : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // MovementProgress: relación obligatoria. Descartamos si no resuelve.
  const exportedProgress = movementProgress
    .map((mp) => {
      const slug = movementSlugById.get(mp.movementId)
      return slug
        ? {
            id: mp.id,
            profileId: mp.profileId,
            movementSlug: slug,
            status: mp.status,
            notes: mp.notes,
            lastPracticedAt: mp.lastPracticedAt
              ? mp.lastPracticedAt.toISOString()
              : null,
            createdAt: mp.createdAt.toISOString(),
            updatedAt: mp.updatedAt.toISOString()
          }
        : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // WorkoutSession: routineId puede ser null, custom (incluida en este
  // export) o built-in (resuelta por slug).
  const exportedSessions = workoutSessions.map((s) => {
    let builtInRoutineSlug: string | null = null
    let customRoutineId: string | null = null
    if (s.routineId) {
      if (customRoutineIds.has(s.routineId)) {
        customRoutineId = s.routineId
      } else {
        builtInRoutineSlug = builtInRoutineSlugById.get(s.routineId) ?? null
      }
    }
    return {
      id: s.id,
      profileId: s.profileId,
      builtInRoutineSlug,
      customRoutineId,
      spotId: s.spotId,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt ? s.endedAt.toISOString() : null,
      durationMin: s.durationMin,
      safetyTrafficLight: s.safetyTrafficLight,
      safetyOverridden: s.safetyOverridden,
      safetyNotes: s.safetyNotes,
      painBefore: s.painBefore,
      painAfter: s.painAfter,
      fatigueBefore: s.fatigueBefore,
      fatigueAfter: s.fatigueAfter,
      energyBefore: s.energyBefore,
      goalOfDay: s.goalOfDay,
      place: s.place,
      generalState: s.generalState,
      personalNotes: s.personalNotes,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString()
    }
  })

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profiles: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      parkourExperience: p.parkourExperience,
      previousSports: p.previousSports,
      dominantLeg: p.dominantLeg,
      weakSide: p.weakSide,
      daysAvailable: p.daysAvailable,
      sessionDurationMin: p.sessionDurationMin,
      mainGoal: p.mainGoal,
      preferredIntensity: p.preferredIntensity,
      level: p.level,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    })),
    injuries: injuries.map((i) => ({
      id: i.id,
      profileId: i.profileId,
      bodyPart: i.bodyPart,
      description: i.description,
      severity: i.severity,
      isActive: i.isActive,
      startedAt: i.startedAt.toISOString(),
      resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null,
      notes: i.notes,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString()
    })),
    assessments: assessments.map((a) => ({
      id: a.id,
      profileId: a.profileId,
      pushUps: a.pushUps,
      squats: a.squats,
      plankSeconds: a.plankSeconds,
      pullUps: a.pullUps,
      ankleMobility: a.ankleMobility,
      hipMobility: a.hipMobility,
      wristMobility: a.wristMobility,
      confidence: a.confidence,
      fear: a.fear,
      pain: a.pain,
      fatigue: a.fatigue,
      computedLevel: a.computedLevel,
      notes: a.notes,
      createdAt: a.createdAt.toISOString()
    })),
    movementProgress: exportedProgress,
    customRoutines: routines.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      goal: r.goal,
      level: r.level,
      estimatedMin: r.estimatedMin,
      suitableForFatigue: r.suitableForFatigue,
      avoidsInjuries: r.avoidsInjuries,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    })),
    routineBlocks: customRoutineBlocks.map((b) => ({
      id: b.id,
      routineId: b.routineId,
      type: b.type,
      order: b.order,
      createdAt: b.createdAt.toISOString()
    })),
    routineExercises: exportedExercises,
    spots: spots.map((s) => ({
      id: s.id,
      name: s.name,
      locationText: s.locationText,
      description: s.description,
      floorType: s.floorType,
      riskLevel: s.riskLevel,
      recommendedHours: s.recommendedHours,
      beginnerFriendly: s.beginnerFriendly,
      notes: s.notes,
      spotType: s.spotType,
      recommendedLevel: s.recommendedLevel,
      tags: s.tags,
      isFavorite: s.isFavorite,
      latitude: s.latitude,
      longitude: s.longitude,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString()
    })),
    spotObstacles: spotObstacles.map((o) => ({
      id: o.id,
      spotId: o.spotId,
      name: o.name,
      type: o.type,
      riskLevel: o.riskLevel,
      notes: o.notes,
      createdAt: o.createdAt.toISOString()
    })),
    spotObstacleMovements: exportedObstacleMovements,
    spotPhotos: spotPhotos.map((p) => ({
      id: p.id,
      spotId: p.spotId,
      filePath: p.filePath,
      fileName: p.fileName,
      caption: p.caption,
      order: p.order,
      createdAt: p.createdAt.toISOString()
    })),
    spotIdealMovements: exportedSpotIdealMovements,
    workoutSessions: exportedSessions,
    workoutMovements: exportedWorkoutMovements,
    videoEntries: videos.map((v) => ({
      id: v.id,
      filePath: v.filePath,
      fileName: v.fileName,
      thumbnailPath: v.thumbnailPath,
      durationSec: v.durationSec,
      recordedAt: v.recordedAt ? v.recordedAt.toISOString() : null,
      movementSlug: v.movementId
        ? movementSlugById.get(v.movementId) ?? null
        : null,
      spotId: v.spotId,
      sessionId: v.sessionId,
      notes: v.notes,
      whatWentWell: v.whatWentWell,
      whatWentWrong: v.whatWentWrong,
      reviewStatus: v.reviewStatus,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString()
    })),
    xpEvents: xpEvents.map((e) => ({
      id: e.id,
      profileId: e.profileId,
      source: e.source,
      sourceRefId: e.sourceRefId,
      amount: e.amount,
      createdAt: e.createdAt.toISOString()
    })),
    questAssignments: questAssignments.map((q) => ({
      id: q.id,
      profileId: q.profileId,
      templateSlug: q.templateSlug,
      title: q.title,
      description: q.description,
      type: q.type,
      metric: q.metric,
      target: q.target,
      progress: q.progress,
      xpReward: q.xpReward,
      status: q.status,
      startsAt: q.startsAt.toISOString(),
      expiresAt: q.expiresAt.toISOString(),
      completedAt: q.completedAt ? q.completedAt.toISOString() : null,
      claimedAt: q.claimedAt ? q.claimedAt.toISOString() : null,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString()
    })),
    achievementUnlocks: achievementUnlocks.map((a) => ({
      id: a.id,
      profileId: a.profileId,
      slug: a.slug,
      xpAwarded: a.xpAwarded,
      unlockedAt: a.unlockedAt.toISOString()
    })),
    dailyActivities: dailyActivities.map((d) => ({
      id: d.id,
      profileId: d.profileId,
      date: d.date.toISOString(),
      type: d.type,
      notes: d.notes,
      createdAt: d.createdAt.toISOString()
    }))
  }
}
