-- Comunidad: publicaciones (posts). Soft-delete, indexes para feed.
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorAccountId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'active',
    "relatedMovementId" TEXT,
    "relatedSpotId" TEXT,
    "relatedRoutineId" TEXT,
    "relatedVideoId" TEXT,
    "relatedSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Post_authorAccountId_fkey" FOREIGN KEY ("authorAccountId") REFERENCES "UserAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_relatedMovementId_fkey" FOREIGN KEY ("relatedMovementId") REFERENCES "Movement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_relatedSpotId_fkey" FOREIGN KEY ("relatedSpotId") REFERENCES "Spot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_relatedRoutineId_fkey" FOREIGN KEY ("relatedRoutineId") REFERENCES "Routine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_relatedVideoId_fkey" FOREIGN KEY ("relatedVideoId") REFERENCES "VideoEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_relatedSessionId_fkey" FOREIGN KEY ("relatedSessionId") REFERENCES "WorkoutSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Post_authorAccountId_createdAt_idx" ON "Post"("authorAccountId", "createdAt");
CREATE INDEX "Post_status_visibility_createdAt_idx" ON "Post"("status", "visibility", "createdAt");
CREATE INDEX "Post_type_createdAt_idx" ON "Post"("type", "createdAt");
