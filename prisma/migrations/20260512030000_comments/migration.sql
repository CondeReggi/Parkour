-- Comentarios polimórficos sobre posts, spots o movimientos.
-- "Exactly one of postId/spotId/movementId" se valida en el repo.
-- Nesting de 1 nivel: parentCommentId opcional, self-FK con CASCADE.

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorAccountId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "postId" TEXT,
    "spotId" TEXT,
    "movementId" TEXT,
    "parentCommentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Comment_authorAccountId_fkey" FOREIGN KEY ("authorAccountId") REFERENCES "UserAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");
CREATE INDEX "Comment_spotId_createdAt_idx" ON "Comment"("spotId", "createdAt");
CREATE INDEX "Comment_movementId_createdAt_idx" ON "Comment"("movementId", "createdAt");
CREATE INDEX "Comment_parentCommentId_createdAt_idx" ON "Comment"("parentCommentId", "createdAt");
CREATE INDEX "Comment_authorAccountId_createdAt_idx" ON "Comment"("authorAccountId", "createdAt");
