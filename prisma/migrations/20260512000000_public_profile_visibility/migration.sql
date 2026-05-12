-- Perfil público: toggles de privacidad granulares.
-- isPublicProfile (master switch) ya existe desde Fase 0. Estos cuatro
-- flags habilitan/ocultan secciones dentro del perfil público.
ALTER TABLE "UserAccount" ADD COLUMN "showLevel" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserAccount" ADD COLUMN "showStats" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserAccount" ADD COLUMN "showDominatedMovements" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserAccount" ADD COLUMN "showSharedSpots" BOOLEAN NOT NULL DEFAULT true;
