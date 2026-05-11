-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "heightCm" REAL,
    "weightKg" REAL,
    "parkourExperience" TEXT NOT NULL DEFAULT 'none',
    "previousSports" TEXT,
    "dominantLeg" TEXT NOT NULL DEFAULT 'right',
    "weakSide" TEXT,
    "daysAvailable" TEXT NOT NULL DEFAULT '[]',
    "sessionDurationMin" INTEGER NOT NULL DEFAULT 60,
    "mainGoal" TEXT NOT NULL DEFAULT 'technique',
    "preferredIntensity" TEXT NOT NULL DEFAULT 'moderate',
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Injury" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'mild',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Injury_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InitialAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "pushUps" INTEGER,
    "squats" INTEGER,
    "plankSeconds" INTEGER,
    "pullUps" INTEGER,
    "ankleMobility" INTEGER,
    "hipMobility" INTEGER,
    "wristMobility" INTEGER,
    "confidence" INTEGER,
    "fear" INTEGER,
    "pain" INTEGER,
    "fatigue" INTEGER,
    "computedLevel" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InitialAssessment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "requiredLevel" TEXT NOT NULL DEFAULT 'beginner',
    "risks" TEXT NOT NULL,
    "prerequisites" TEXT NOT NULL,
    "commonMistakes" TEXT NOT NULL,
    "goodExecutionCues" TEXT NOT NULL,
    "preparatoryDrills" TEXT NOT NULL,
    "musclesInvolved" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MovementProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_attempted',
    "notes" TEXT,
    "lastPracticedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MovementProgress_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MovementProgress_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "estimatedMin" INTEGER NOT NULL DEFAULT 45,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT true,
    "suitableForFatigue" TEXT NOT NULL DEFAULT 'any',
    "avoidsInjuries" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoutineBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routineId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoutineBlock_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoutineExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockId" TEXT NOT NULL,
    "movementId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sets" INTEGER,
    "reps" INTEGER,
    "durationSec" INTEGER,
    "restSec" INTEGER,
    "notes" TEXT,
    "order" INTEGER NOT NULL,
    CONSTRAINT "RoutineExercise_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "RoutineBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoutineExercise_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "routineId" TEXT,
    "spotId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "durationMin" INTEGER,
    "safetyTrafficLight" TEXT NOT NULL,
    "safetyOverridden" BOOLEAN NOT NULL DEFAULT false,
    "safetyNotes" TEXT,
    "painBefore" INTEGER,
    "painAfter" INTEGER,
    "fatigueBefore" INTEGER,
    "fatigueAfter" INTEGER,
    "generalState" TEXT,
    "personalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutSession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSession_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSession_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "attempts" INTEGER,
    "successful" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkoutMovement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutMovement_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Spot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "locationText" TEXT,
    "description" TEXT,
    "floorType" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'moderate',
    "recommendedHours" TEXT,
    "beginnerFriendly" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SpotObstacle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'moderate',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotObstacle_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotObstacleMovement" (
    "obstacleId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,

    PRIMARY KEY ("obstacleId", "movementId"),
    CONSTRAINT "SpotObstacleMovement_obstacleId_fkey" FOREIGN KEY ("obstacleId") REFERENCES "SpotObstacle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SpotObstacleMovement_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "durationSec" INTEGER,
    "recordedAt" DATETIME,
    "movementId" TEXT,
    "spotId" TEXT,
    "sessionId" TEXT,
    "notes" TEXT,
    "whatWentWell" TEXT,
    "whatWentWrong" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoEntry_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VideoEntry_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VideoEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "activeProfileId" TEXT,
    "lastBackupAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "filePath" TEXT,
    "succeeded" BOOLEAN NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Injury_profileId_isActive_idx" ON "Injury"("profileId", "isActive");

-- CreateIndex
CREATE INDEX "InitialAssessment_profileId_createdAt_idx" ON "InitialAssessment"("profileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_slug_key" ON "Movement"("slug");

-- CreateIndex
CREATE INDEX "Movement_category_difficulty_idx" ON "Movement"("category", "difficulty");

-- CreateIndex
CREATE INDEX "MovementProgress_profileId_status_idx" ON "MovementProgress"("profileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MovementProgress_profileId_movementId_key" ON "MovementProgress"("profileId", "movementId");

-- CreateIndex
CREATE UNIQUE INDEX "Routine_slug_key" ON "Routine"("slug");

-- CreateIndex
CREATE INDEX "RoutineBlock_routineId_order_idx" ON "RoutineBlock"("routineId", "order");

-- CreateIndex
CREATE INDEX "RoutineExercise_blockId_order_idx" ON "RoutineExercise"("blockId", "order");

-- CreateIndex
CREATE INDEX "WorkoutSession_profileId_startedAt_idx" ON "WorkoutSession"("profileId", "startedAt");

-- CreateIndex
CREATE INDEX "WorkoutMovement_sessionId_idx" ON "WorkoutMovement"("sessionId");

-- CreateIndex
CREATE INDEX "SpotObstacle_spotId_idx" ON "SpotObstacle"("spotId");

-- CreateIndex
CREATE INDEX "VideoEntry_movementId_idx" ON "VideoEntry"("movementId");

-- CreateIndex
CREATE INDEX "VideoEntry_sessionId_idx" ON "VideoEntry"("sessionId");
