-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Movement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "requiredLevel" TEXT NOT NULL DEFAULT 'beginner',
    "risks" TEXT NOT NULL,
    "prerequisites" TEXT NOT NULL,
    "commonMistakes" TEXT NOT NULL,
    "goodExecutionCues" TEXT NOT NULL,
    "preparatoryDrills" TEXT NOT NULL,
    "musclesInvolved" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "technicalGoal" TEXT,
    "safetyChecklist" TEXT NOT NULL DEFAULT '[]',
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Movement" ("category", "commonMistakes", "createdAt", "description", "difficulty", "goodExecutionCues", "id", "isBuiltIn", "musclesInvolved", "name", "preparatoryDrills", "prerequisites", "requiredLevel", "risks", "slug", "tags", "updatedAt") SELECT "category", "commonMistakes", "createdAt", "description", "difficulty", "goodExecutionCues", "id", "isBuiltIn", "musclesInvolved", "name", "preparatoryDrills", "prerequisites", "requiredLevel", "risks", "slug", "tags", "updatedAt" FROM "Movement";
DROP TABLE "Movement";
ALTER TABLE "new_Movement" RENAME TO "Movement";
CREATE UNIQUE INDEX "Movement_slug_key" ON "Movement"("slug");
CREATE INDEX "Movement_category_difficulty_idx" ON "Movement"("category", "difficulty");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
