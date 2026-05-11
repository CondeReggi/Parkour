-- AlterTable: coordenadas geográficas opcionales del spot
ALTER TABLE "Spot" ADD COLUMN "latitude" REAL;
ALTER TABLE "Spot" ADD COLUMN "longitude" REAL;
