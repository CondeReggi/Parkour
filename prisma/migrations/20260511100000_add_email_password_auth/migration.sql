-- AlterTable: agregar passwordHash + currentAuthSessionId
ALTER TABLE "UserAccount" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "AppSettings" ADD COLUMN "currentAuthSessionId" TEXT;

-- CreateTable: AuthSession
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAccountId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    CONSTRAINT "AuthSession_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AuthSession_userAccountId_createdAt_idx" ON "AuthSession"("userAccountId", "createdAt");
