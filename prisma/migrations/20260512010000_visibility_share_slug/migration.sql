-- Entidades compartibles: agregar timestamp de publicación + slug
-- estable para links no listados.
--
-- visibility ya existía desde Fase 0. Estos campos completan la base de
-- "shareable": sharedAt marca cuándo el usuario lo expuso, shareSlug es
-- la URL pública/no-listada estable que sobrevive a re-privatizaciones.

-- Spot
ALTER TABLE "Spot" ADD COLUMN "sharedAt" DATETIME;
ALTER TABLE "Spot" ADD COLUMN "shareSlug" TEXT;
CREATE UNIQUE INDEX "Spot_shareSlug_key" ON "Spot"("shareSlug");

-- Routine
ALTER TABLE "Routine" ADD COLUMN "sharedAt" DATETIME;
ALTER TABLE "Routine" ADD COLUMN "shareSlug" TEXT;
CREATE UNIQUE INDEX "Routine_shareSlug_key" ON "Routine"("shareSlug");

-- VideoEntry
ALTER TABLE "VideoEntry" ADD COLUMN "sharedAt" DATETIME;
ALTER TABLE "VideoEntry" ADD COLUMN "shareSlug" TEXT;
CREATE UNIQUE INDEX "VideoEntry_shareSlug_key" ON "VideoEntry"("shareSlug");
