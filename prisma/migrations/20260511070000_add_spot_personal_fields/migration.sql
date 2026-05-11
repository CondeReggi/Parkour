-- AlterTable: campos personales del spot
ALTER TABLE "Spot" ADD COLUMN "spotType" TEXT;
ALTER TABLE "Spot" ADD COLUMN "recommendedLevel" TEXT;
ALTER TABLE "Spot" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Spot" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: fotos del spot
CREATE TABLE "SpotPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotPhoto_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SpotPhoto_spotId_order_idx" ON "SpotPhoto"("spotId", "order");

-- CreateTable: movimientos ideales del spot
CREATE TABLE "SpotIdealMovement" (
    "spotId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("spotId", "movementId"),
    CONSTRAINT "SpotIdealMovement_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SpotIdealMovement_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SpotIdealMovement_spotId_idx" ON "SpotIdealMovement"("spotId");
