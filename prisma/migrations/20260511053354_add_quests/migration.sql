-- CreateTable
CREATE TABLE "QuestAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "templateSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startsAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "claimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestAssignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "QuestAssignment_profileId_type_expiresAt_idx" ON "QuestAssignment"("profileId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "QuestAssignment_profileId_status_idx" ON "QuestAssignment"("profileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestAssignment_profileId_templateSlug_startsAt_key" ON "QuestAssignment"("profileId", "templateSlug", "startsAt");
