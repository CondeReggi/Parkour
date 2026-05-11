-- CreateTable
CREATE TABLE "AchievementUnlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AchievementUnlock_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AchievementUnlock_profileId_unlockedAt_idx" ON "AchievementUnlock"("profileId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementUnlock_profileId_slug_key" ON "AchievementUnlock"("profileId", "slug");
