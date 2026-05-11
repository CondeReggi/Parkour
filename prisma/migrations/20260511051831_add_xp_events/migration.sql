-- CreateTable
CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRefId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "XpEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "XpEvent_profileId_createdAt_idx" ON "XpEvent"("profileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "XpEvent_profileId_source_sourceRefId_key" ON "XpEvent"("profileId", "source", "sourceRefId");
