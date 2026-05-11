/**
 * Shape del archivo JSON que produce/consume export e import.
 *
 * Convenciones:
 *  - Sólo se incluyen tablas de "datos del usuario". Movements y Routines
 *    built-in se asume que están presentes en el destino (vía seed).
 *  - Toda relación a entidad built-in (Movement, Routine built-in) se exporta
 *    como `*Slug` en lugar del id, para sobrevivir a re-seeds que generan
 *    nuevos cuids.
 *  - Las refs a entidades del propio export (Routine custom, Spot, Session)
 *    se mantienen por id; al importar se borra todo primero, así no hay
 *    colisiones.
 *  - Si al importar un slug built-in no se resuelve, los registros con
 *    relación obligatoria a ese slug se descartan; los que tienen relación
 *    opcional quedan con la ref en null.
 */

export const EXPORT_VERSION = 1

export interface ExportedProfile {
  id: string
  name: string
  age: number | null
  heightCm: number | null
  weightKg: number | null
  parkourExperience: string
  previousSports: string | null
  dominantLeg: string
  weakSide: string | null
  daysAvailable: string
  sessionDurationMin: number
  mainGoal: string
  preferredIntensity: string
  level: string
  createdAt: string
  updatedAt: string
}

export interface ExportedInjury {
  id: string
  profileId: string
  bodyPart: string
  description: string | null
  severity: string
  isActive: boolean
  startedAt: string
  resolvedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ExportedAssessment {
  id: string
  profileId: string
  pushUps: number | null
  squats: number | null
  plankSeconds: number | null
  pullUps: number | null
  ankleMobility: number | null
  hipMobility: number | null
  wristMobility: number | null
  confidence: number | null
  fear: number | null
  pain: number | null
  fatigue: number | null
  computedLevel: string
  notes: string | null
  createdAt: string
}

export interface ExportedMovementProgress {
  id: string
  profileId: string
  movementSlug: string
  status: string
  notes: string | null
  lastPracticedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ExportedCustomRoutine {
  id: string
  slug: string | null
  name: string
  description: string | null
  goal: string
  level: string
  estimatedMin: number
  suitableForFatigue: string
  avoidsInjuries: string
  /** Reservado Fase 0. Por ahora siempre null en export (no exportamos
   *  identidad de auth) y se rehidrata como null al importar. */
  visibility: string
  createdAt: string
  updatedAt: string
}

export interface ExportedRoutineBlock {
  id: string
  routineId: string
  type: string
  order: number
  createdAt: string
}

export interface ExportedRoutineExercise {
  id: string
  blockId: string
  movementSlug: string | null
  name: string
  description: string | null
  sets: number | null
  reps: number | null
  durationSec: number | null
  restSec: number | null
  notes: string | null
  order: number
}

export interface ExportedSpot {
  id: string
  name: string
  locationText: string | null
  description: string | null
  floorType: string | null
  riskLevel: string
  recommendedHours: string | null
  beginnerFriendly: boolean
  notes: string | null
  /** Tipo principal del spot. Null si nunca se setea. */
  spotType: string | null
  recommendedLevel: string | null
  /** JSON-string del array de tags (igual que en la DB). */
  tags: string
  isFavorite: boolean
  /** Coordenadas opcionales del spot. */
  latitude: number | null
  longitude: number | null
  /** Reservado Fase 0. La identidad de auth NO se exporta — el
   *  authorAccountId se rehidrata como null en el destino. */
  visibility: string
  createdAt: string
  updatedAt: string
}

export interface ExportedSpotObstacle {
  id: string
  spotId: string
  name: string
  type: string
  riskLevel: string
  notes: string | null
  createdAt: string
}

export interface ExportedSpotObstacleMovement {
  obstacleId: string
  movementSlug: string
}

export interface ExportedSpotPhoto {
  id: string
  spotId: string
  filePath: string
  fileName: string
  caption: string | null
  order: number
  createdAt: string
}

export interface ExportedSpotIdealMovement {
  spotId: string
  movementSlug: string
  notes: string | null
}

export interface ExportedWorkoutSession {
  id: string
  profileId: string
  /** Si la sesión referencia una routine built-in. */
  builtInRoutineSlug: string | null
  /** Si la sesión referencia una routine custom presente en este mismo export. */
  customRoutineId: string | null
  spotId: string | null
  startedAt: string
  endedAt: string | null
  durationMin: number | null
  safetyTrafficLight: string
  safetyOverridden: boolean
  safetyNotes: string | null
  painBefore: number | null
  painAfter: number | null
  fatigueBefore: number | null
  fatigueAfter: number | null
  energyBefore: number | null
  goalOfDay: string | null
  place: string | null
  generalState: string | null
  personalNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface ExportedWorkoutMovement {
  id: string
  sessionId: string
  movementSlug: string
  attempts: number | null
  successful: number | null
  notes: string | null
  createdAt: string
}

export interface ExportedXpEvent {
  id: string
  profileId: string
  source: string
  sourceRefId: string
  amount: number
  createdAt: string
}

export interface ExportedDailyActivity {
  id: string
  profileId: string
  date: string
  type: string
  notes: string | null
  createdAt: string
}

export interface ExportedAchievementUnlock {
  id: string
  profileId: string
  slug: string
  xpAwarded: number
  unlockedAt: string
}

export interface ExportedQuestAssignment {
  id: string
  profileId: string
  templateSlug: string
  title: string
  description: string
  type: string
  metric: string
  target: number
  progress: number
  xpReward: number
  status: string
  startsAt: string
  expiresAt: string
  completedAt: string | null
  claimedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ExportedVideoEntry {
  id: string
  filePath: string
  fileName: string
  thumbnailPath: string | null
  durationSec: number | null
  recordedAt: string | null
  movementSlug: string | null
  spotId: string | null
  sessionId: string | null
  notes: string | null
  whatWentWell: string | null
  whatWentWrong: string | null
  reviewStatus: string
  /** Reservado Fase 0. */
  visibility: string
  createdAt: string
  updatedAt: string
}

export interface ExportPayload {
  version: typeof EXPORT_VERSION
  exportedAt: string
  profiles: ExportedProfile[]
  injuries: ExportedInjury[]
  assessments: ExportedAssessment[]
  movementProgress: ExportedMovementProgress[]
  customRoutines: ExportedCustomRoutine[]
  routineBlocks: ExportedRoutineBlock[]
  routineExercises: ExportedRoutineExercise[]
  spots: ExportedSpot[]
  spotObstacles: ExportedSpotObstacle[]
  spotObstacleMovements: ExportedSpotObstacleMovement[]
  spotPhotos: ExportedSpotPhoto[]
  spotIdealMovements: ExportedSpotIdealMovement[]
  workoutSessions: ExportedWorkoutSession[]
  workoutMovements: ExportedWorkoutMovement[]
  videoEntries: ExportedVideoEntry[]
  xpEvents: ExportedXpEvent[]
  questAssignments: ExportedQuestAssignment[]
  achievementUnlocks: ExportedAchievementUnlock[]
  dailyActivities: ExportedDailyActivity[]
}
