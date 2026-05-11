/**
 * Importa un payload de export reemplazando los datos del usuario.
 *
 * Pasos:
 *  1. Validar el shape (zod).
 *  2. Construir mapeo slug → id para Movement y Routine built-in en destino.
 *  3. Borrar datos del usuario (orden de FKs respetando cascadas).
 *  4. Insertar registros del payload en orden de FKs, traduciendo slugs.
 *
 * Decisiones:
 *  - Si un slug built-in no existe en destino, los registros con relación
 *    obligatoria se descartan; los opcionales quedan con la ref en null.
 *  - Todo se hace en una sola transacción: si algo falla, revertimos.
 */

import { z } from 'zod'
import { prisma } from '../db/client'
import {
  EXPORT_VERSION,
  type ExportPayload
} from '@shared/types/portability'

const isoString = z.string()
const nullableIso = isoString.nullable()
const nullableId = z.string().nullable()
const nullableStr = z.string().nullable()
const nullableInt = z.number().int().nullable()

export const exportPayloadSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  exportedAt: isoString,
  profiles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      age: nullableInt,
      heightCm: z.number().nullable(),
      weightKg: z.number().nullable(),
      parkourExperience: z.string(),
      previousSports: nullableStr,
      dominantLeg: z.string(),
      weakSide: nullableStr,
      daysAvailable: z.string(),
      sessionDurationMin: z.number().int(),
      mainGoal: z.string(),
      preferredIntensity: z.string(),
      level: z.string(),
      createdAt: isoString,
      updatedAt: isoString
    })
  ),
  injuries: z.array(
    z.object({
      id: z.string(),
      profileId: z.string(),
      bodyPart: z.string(),
      description: nullableStr,
      severity: z.string(),
      isActive: z.boolean(),
      startedAt: isoString,
      resolvedAt: nullableIso,
      notes: nullableStr,
      createdAt: isoString,
      updatedAt: isoString
    })
  ),
  assessments: z.array(
    z.object({
      id: z.string(),
      profileId: z.string(),
      pushUps: nullableInt,
      squats: nullableInt,
      plankSeconds: nullableInt,
      pullUps: nullableInt,
      ankleMobility: nullableInt,
      hipMobility: nullableInt,
      wristMobility: nullableInt,
      confidence: nullableInt,
      fear: nullableInt,
      pain: nullableInt,
      fatigue: nullableInt,
      computedLevel: z.string(),
      notes: nullableStr,
      createdAt: isoString
    })
  ),
  movementProgress: z.array(
    z.object({
      id: z.string(),
      profileId: z.string(),
      movementSlug: z.string(),
      status: z.string(),
      notes: nullableStr,
      lastPracticedAt: nullableIso,
      createdAt: isoString,
      updatedAt: isoString
    })
  ),
  customRoutines: z.array(
    z.object({
      id: z.string(),
      slug: nullableStr,
      name: z.string(),
      description: nullableStr,
      goal: z.string(),
      level: z.string(),
      estimatedMin: z.number().int(),
      suitableForFatigue: z.string(),
      avoidsInjuries: z.string(),
      createdAt: isoString,
      updatedAt: isoString
    })
  ),
  routineBlocks: z.array(
    z.object({
      id: z.string(),
      routineId: z.string(),
      type: z.string(),
      order: z.number().int(),
      createdAt: isoString
    })
  ),
  routineExercises: z.array(
    z.object({
      id: z.string(),
      blockId: z.string(),
      movementSlug: nullableStr,
      name: z.string(),
      description: nullableStr,
      sets: nullableInt,
      reps: nullableInt,
      durationSec: nullableInt,
      restSec: nullableInt,
      notes: nullableStr,
      order: z.number().int()
    })
  ),
  spots: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      locationText: nullableStr,
      description: nullableStr,
      floorType: nullableStr,
      riskLevel: z.string(),
      recommendedHours: nullableStr,
      beginnerFriendly: z.boolean(),
      notes: nullableStr,
      // Campos personales del spot. Defaults para tolerar exports
      // anteriores a esta feature.
      spotType: nullableStr.optional().default(null),
      recommendedLevel: nullableStr.optional().default(null),
      tags: z.string().optional().default('[]'),
      isFavorite: z.boolean().optional().default(false),
      createdAt: isoString,
      updatedAt: isoString
    })
  ),
  spotObstacles: z.array(
    z.object({
      id: z.string(),
      spotId: z.string(),
      name: z.string(),
      type: z.string(),
      riskLevel: z.string(),
      notes: nullableStr,
      createdAt: isoString
    })
  ),
  spotObstacleMovements: z.array(
    z.object({
      obstacleId: z.string(),
      movementSlug: z.string()
    })
  ),
  // Fotos del spot. Si vienen vacías (export viejo), simplemente no se
  // reinsertan; los path absolutos pueden no existir en la máquina destino
  // y eso se refleja como fileMissing en la UI.
  spotPhotos: z
    .array(
      z.object({
        id: z.string(),
        spotId: z.string(),
        filePath: z.string(),
        fileName: z.string(),
        caption: nullableStr,
        order: z.number().int(),
        createdAt: isoString
      })
    )
    .default([]),
  spotIdealMovements: z
    .array(
      z.object({
        spotId: z.string(),
        movementSlug: z.string(),
        notes: nullableStr
      })
    )
    .default([]),
  workoutSessions: z.array(
    z.object({
      id: z.string(),
      profileId: z.string(),
      builtInRoutineSlug: nullableStr,
      customRoutineId: nullableId,
      spotId: nullableId,
      startedAt: isoString,
      endedAt: nullableIso,
      durationMin: nullableInt,
      safetyTrafficLight: z.string(),
      safetyOverridden: z.boolean(),
      safetyNotes: nullableStr,
      painBefore: nullableInt,
      painAfter: nullableInt,
      fatigueBefore: nullableInt,
      fatigueAfter: nullableInt,
      // Campos del check-in del coach guiado. Defaults para tolerar
      // exports anteriores al cambio.
      energyBefore: nullableInt.optional().default(null),
      goalOfDay: nullableStr.optional().default(null),
      place: nullableStr.optional().default(null),
      generalState: nullableStr,
      personalNotes: nullableStr,
      createdAt: isoString,
      updatedAt: isoString
    })
  ),
  workoutMovements: z.array(
    z.object({
      id: z.string(),
      sessionId: z.string(),
      movementSlug: z.string(),
      attempts: nullableInt,
      successful: nullableInt,
      notes: nullableStr,
      createdAt: isoString
    })
  ),
  videoEntries: z.array(
    z.object({
      id: z.string(),
      filePath: z.string(),
      fileName: z.string(),
      thumbnailPath: nullableStr,
      durationSec: nullableInt,
      recordedAt: nullableIso,
      movementSlug: nullableStr,
      spotId: nullableId,
      sessionId: nullableId,
      notes: nullableStr,
      whatWentWell: nullableStr,
      whatWentWrong: nullableStr,
      reviewStatus: z.string(),
      createdAt: isoString,
      updatedAt: isoString
    })
  ),
  // Eventos de XP del perfil. Si vienen vacíos (export viejo sin
  // gamificación), el backfill lazy los regenera la primera vez que el
  // dashboard pida el estado.
  xpEvents: z
    .array(
      z.object({
        id: z.string(),
        profileId: z.string(),
        source: z.string(),
        sourceRefId: z.string(),
        amount: z.number().int(),
        createdAt: isoString
      })
    )
    .default([]),
  // Misiones del perfil. Si vienen vacías (export anterior a quests), no
  // se reinsertan y se generan automáticamente al primer listForActive.
  questAssignments: z
    .array(
      z.object({
        id: z.string(),
        profileId: z.string(),
        templateSlug: z.string(),
        title: z.string(),
        description: z.string(),
        type: z.string(),
        metric: z.string(),
        target: z.number().int(),
        progress: z.number().int(),
        xpReward: z.number().int(),
        status: z.string(),
        startsAt: isoString,
        expiresAt: isoString,
        completedAt: nullableIso,
        claimedAt: nullableIso,
        createdAt: isoString,
        updatedAt: isoString
      })
    )
    .default([]),
  // Logros desbloqueados. Si vienen vacíos (export anterior a logros),
  // se vuelven a evaluar automáticamente la próxima vez que un repo
  // dispare evaluateAndUnlockForActive.
  achievementUnlocks: z
    .array(
      z.object({
        id: z.string(),
        profileId: z.string(),
        slug: z.string(),
        xpAwarded: z.number().int(),
        unlockedAt: isoString
      })
    )
    .default([]),
  // Días marcados como recuperación activa. Si el export es anterior a
  // las rachas inteligentes, viene vacío y la racha se calcula sólo con
  // sesiones (compatible).
  dailyActivities: z
    .array(
      z.object({
        id: z.string(),
        profileId: z.string(),
        date: isoString,
        type: z.string(),
        notes: nullableStr,
        createdAt: isoString
      })
    )
    .default([])
})

export async function applyImportPayload(
  payload: ExportPayload
): Promise<{ recordCount: number }> {
  // Mapeo de slug → id en la DB destino para entidades built-in.
  const [movements, builtInRoutines] = await Promise.all([
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.routine.findMany({
      where: { isBuiltIn: true, slug: { not: null } },
      select: { id: true, slug: true }
    })
  ])
  const movementIdBySlug = new Map(movements.map((m) => [m.slug, m.id]))
  const builtInRoutineIdBySlug = new Map(
    builtInRoutines
      .filter((r): r is { id: string; slug: string } => r.slug !== null)
      .map((r) => [r.slug, r.id])
  )

  return prisma.$transaction(async (tx) => {
    // === 1. Borrar datos del usuario en orden de FKs ===
    // VideoEntry no tiene cascada hacia él; lo borramos primero.
    await tx.videoEntry.deleteMany({})
    // WorkoutSession cascada → WorkoutMovement.
    await tx.workoutSession.deleteMany({})
    // Spot cascada → SpotObstacle → SpotObstacleMovement.
    await tx.spot.deleteMany({})
    // Routine cascada → RoutineBlock → RoutineExercise. Sólo borramos custom.
    await tx.routine.deleteMany({ where: { isBuiltIn: false } })
    // UserProfile cascada → Injury, InitialAssessment, MovementProgress,
    // y también WorkoutSession (ya borradas). Sin perfiles activos:
    await tx.userProfile.deleteMany({})

    let count = 0

    // === 2. Insertar en orden de FKs ===
    for (const p of payload.profiles) {
      await tx.userProfile.create({
        data: {
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
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }
      })
      count++
    }

    for (const i of payload.injuries) {
      await tx.injury.create({
        data: {
          id: i.id,
          profileId: i.profileId,
          bodyPart: i.bodyPart,
          description: i.description,
          severity: i.severity,
          isActive: i.isActive,
          startedAt: new Date(i.startedAt),
          resolvedAt: i.resolvedAt ? new Date(i.resolvedAt) : null,
          notes: i.notes,
          createdAt: new Date(i.createdAt),
          updatedAt: new Date(i.updatedAt)
        }
      })
      count++
    }

    for (const a of payload.assessments) {
      await tx.initialAssessment.create({
        data: {
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
          createdAt: new Date(a.createdAt)
        }
      })
      count++
    }

    for (const r of payload.customRoutines) {
      await tx.routine.create({
        data: {
          id: r.id,
          slug: r.slug,
          name: r.name,
          description: r.description,
          goal: r.goal,
          level: r.level,
          estimatedMin: r.estimatedMin,
          isBuiltIn: false,
          suitableForFatigue: r.suitableForFatigue,
          avoidsInjuries: r.avoidsInjuries,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }
      })
      count++
    }

    for (const b of payload.routineBlocks) {
      await tx.routineBlock.create({
        data: {
          id: b.id,
          routineId: b.routineId,
          type: b.type,
          order: b.order,
          createdAt: new Date(b.createdAt)
        }
      })
      count++
    }

    for (const e of payload.routineExercises) {
      const movementId = e.movementSlug
        ? movementIdBySlug.get(e.movementSlug) ?? null
        : null
      await tx.routineExercise.create({
        data: {
          id: e.id,
          blockId: e.blockId,
          movementId,
          name: e.name,
          description: e.description,
          sets: e.sets,
          reps: e.reps,
          durationSec: e.durationSec,
          restSec: e.restSec,
          notes: e.notes,
          order: e.order
        }
      })
      count++
    }

    for (const s of payload.spots) {
      await tx.spot.create({
        data: {
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
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }
      })
      count++
    }

    for (const o of payload.spotObstacles) {
      await tx.spotObstacle.create({
        data: {
          id: o.id,
          spotId: o.spotId,
          name: o.name,
          type: o.type,
          riskLevel: o.riskLevel,
          notes: o.notes,
          createdAt: new Date(o.createdAt)
        }
      })
      count++
    }

    for (const sm of payload.spotObstacleMovements) {
      const movementId = movementIdBySlug.get(sm.movementSlug)
      if (!movementId) continue
      await tx.spotObstacleMovement.create({
        data: { obstacleId: sm.obstacleId, movementId }
      })
      count++
    }

    for (const p of payload.spotPhotos) {
      await tx.spotPhoto.create({
        data: {
          id: p.id,
          spotId: p.spotId,
          filePath: p.filePath,
          fileName: p.fileName,
          caption: p.caption,
          order: p.order,
          createdAt: new Date(p.createdAt)
        }
      })
      count++
    }

    for (const im of payload.spotIdealMovements) {
      const movementId = movementIdBySlug.get(im.movementSlug)
      if (!movementId) continue
      await tx.spotIdealMovement.create({
        data: {
          spotId: im.spotId,
          movementId,
          notes: im.notes
        }
      })
      count++
    }

    for (const mp of payload.movementProgress) {
      const movementId = movementIdBySlug.get(mp.movementSlug)
      if (!movementId) continue
      await tx.movementProgress.create({
        data: {
          id: mp.id,
          profileId: mp.profileId,
          movementId,
          status: mp.status,
          notes: mp.notes,
          lastPracticedAt: mp.lastPracticedAt
            ? new Date(mp.lastPracticedAt)
            : null,
          createdAt: new Date(mp.createdAt),
          updatedAt: new Date(mp.updatedAt)
        }
      })
      count++
    }

    for (const s of payload.workoutSessions) {
      let routineId: string | null = null
      if (s.customRoutineId) {
        routineId = s.customRoutineId
      } else if (s.builtInRoutineSlug) {
        routineId = builtInRoutineIdBySlug.get(s.builtInRoutineSlug) ?? null
      }
      await tx.workoutSession.create({
        data: {
          id: s.id,
          profileId: s.profileId,
          routineId,
          spotId: s.spotId,
          startedAt: new Date(s.startedAt),
          endedAt: s.endedAt ? new Date(s.endedAt) : null,
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
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }
      })
      count++
    }

    for (const wm of payload.workoutMovements) {
      const movementId = movementIdBySlug.get(wm.movementSlug)
      if (!movementId) continue
      await tx.workoutMovement.create({
        data: {
          id: wm.id,
          sessionId: wm.sessionId,
          movementId,
          attempts: wm.attempts,
          successful: wm.successful,
          notes: wm.notes,
          createdAt: new Date(wm.createdAt)
        }
      })
      count++
    }

    for (const v of payload.videoEntries) {
      const movementId = v.movementSlug
        ? movementIdBySlug.get(v.movementSlug) ?? null
        : null
      await tx.videoEntry.create({
        data: {
          id: v.id,
          filePath: v.filePath,
          fileName: v.fileName,
          thumbnailPath: v.thumbnailPath,
          durationSec: v.durationSec,
          recordedAt: v.recordedAt ? new Date(v.recordedAt) : null,
          movementId,
          spotId: v.spotId,
          sessionId: v.sessionId,
          notes: v.notes,
          whatWentWell: v.whatWentWell,
          whatWentWrong: v.whatWentWrong,
          reviewStatus: v.reviewStatus,
          createdAt: new Date(v.createdAt),
          updatedAt: new Date(v.updatedAt)
        }
      })
      count++
    }

    // XpEvent: cascadeados en el delete de UserProfile. Reinsertamos los
    // eventos asociados a un profileId que vino en este mismo payload;
    // descartamos los que apuntan a profiles que no se importaron.
    const importedProfileIds = new Set(payload.profiles.map((p) => p.id))
    for (const e of payload.xpEvents) {
      if (!importedProfileIds.has(e.profileId)) continue
      await tx.xpEvent.create({
        data: {
          id: e.id,
          profileId: e.profileId,
          source: e.source,
          sourceRefId: e.sourceRefId,
          amount: e.amount,
          createdAt: new Date(e.createdAt)
        }
      })
      count++
    }

    // QuestAssignment: igual que XpEvent, cascadea en el delete de UserProfile.
    for (const q of payload.questAssignments) {
      if (!importedProfileIds.has(q.profileId)) continue
      await tx.questAssignment.create({
        data: {
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
          startsAt: new Date(q.startsAt),
          expiresAt: new Date(q.expiresAt),
          completedAt: q.completedAt ? new Date(q.completedAt) : null,
          claimedAt: q.claimedAt ? new Date(q.claimedAt) : null,
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt)
        }
      })
      count++
    }

    // AchievementUnlock: idem, cascade en el delete de UserProfile.
    for (const a of payload.achievementUnlocks) {
      if (!importedProfileIds.has(a.profileId)) continue
      await tx.achievementUnlock.create({
        data: {
          id: a.id,
          profileId: a.profileId,
          slug: a.slug,
          xpAwarded: a.xpAwarded,
          unlockedAt: new Date(a.unlockedAt)
        }
      })
      count++
    }

    // DailyActivity: idem.
    for (const d of payload.dailyActivities) {
      if (!importedProfileIds.has(d.profileId)) continue
      await tx.dailyActivity.create({
        data: {
          id: d.id,
          profileId: d.profileId,
          date: new Date(d.date),
          type: d.type,
          notes: d.notes,
          createdAt: new Date(d.createdAt)
        }
      })
      count++
    }

    // El AppSettings.activeProfileId puede haber quedado apuntando a un
    // profile que ya no existe (lo borramos). Si los profiles importados
    // no incluyen al activo previo, lo dejamos en null.
    const settings = await tx.appSettings.findUnique({ where: { id: 1 } })
    if (settings?.activeProfileId) {
      const stillExists = payload.profiles.some(
        (p) => p.id === settings.activeProfileId
      )
      if (!stillExists) {
        await tx.appSettings.update({
          where: { id: 1 },
          data: { activeProfileId: null }
        })
      }
    }

    return { recordCount: count }
  })
}
