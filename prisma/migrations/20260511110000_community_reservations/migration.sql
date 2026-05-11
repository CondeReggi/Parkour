-- =====  Fase 0: campos reservados para comunidad futura  =====
-- Sólo agrega columnas. Nada de UI ni lógica nueva todavía.

-- UserAccount: identidad pública futura
ALTER TABLE "UserAccount" ADD COLUMN "username" TEXT;
ALTER TABLE "UserAccount" ADD COLUMN "bio" TEXT;
ALTER TABLE "UserAccount" ADD COLUMN "coverImageUrl" TEXT;
ALTER TABLE "UserAccount" ADD COLUMN "isPublicProfile" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "UserAccount_username_key" ON "UserAccount"("username");

-- Entidades shareables: autor + visibilidad. Default 'private'.

-- Spot
ALTER TABLE "Spot" ADD COLUMN "authorAccountId" TEXT REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Spot" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private';

-- Routine
ALTER TABLE "Routine" ADD COLUMN "authorAccountId" TEXT REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Routine" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private';

-- VideoEntry
ALTER TABLE "VideoEntry" ADD COLUMN "authorAccountId" TEXT REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VideoEntry" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private';
