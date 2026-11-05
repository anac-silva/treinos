CREATE TABLE "WorkoutSheet" (
  "id" UUID PRIMARY KEY,
  "clientId" UUID REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" VARCHAR(100) NOT NULL,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "sourceSheetId" UUID REFERENCES "WorkoutSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "WorkoutSheet_clientId_isActive_createdAt_idx" ON "WorkoutSheet"("clientId", "isActive", "createdAt");
CREATE UNIQUE INDEX "WorkoutSheet_one_active_per_client_key" ON "WorkoutSheet"("clientId") WHERE "clientId" IS NOT NULL AND "isActive" = true;
ALTER TABLE "WorkoutPlan" ADD COLUMN "sheetId" UUID REFERENCES "WorkoutSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkoutPlan" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0 CHECK ("position" >= 0);
ALTER TABLE "WorkoutPlan" ADD COLUMN "focus" VARCHAR(100);
CREATE UNIQUE INDEX "WorkoutPlan_sheetId_position_key" ON "WorkoutPlan"("sheetId", "position");
-- Preserve each previous prescription as a one-block sheet, including its history.
INSERT INTO "WorkoutSheet" ("id", "clientId", "title", "notes", "isActive", "createdAt")
  SELECT "id", "clientId", "title", "notes", "isActive", "createdAt" FROM "WorkoutPlan" WHERE "clientId" IS NOT NULL;
UPDATE "WorkoutPlan" SET "sheetId" = "id" WHERE "clientId" IS NOT NULL;
UPDATE "WorkoutSheet" s SET "sourceSheetId" = p."sourcePlanId" FROM "WorkoutPlan" p
  WHERE s."id" = p."id" AND EXISTS (SELECT 1 FROM "WorkoutSheet" source WHERE source."id" = p."sourcePlanId");
DROP INDEX "WorkoutPlan_one_active_per_client_key";
