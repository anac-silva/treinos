CREATE TYPE "WorkoutLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

CREATE TABLE "Exercise" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameKey" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkoutPlan" (
    "id" UUID NOT NULL,
    "clientId" UUID,
    "sourcePlanId" UUID,
    "title" VARCHAR(100) NOT NULL,
    "level" "WorkoutLevel" NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkoutExercise" (
    "id" UUID NOT NULL,
    "workoutPlanId" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "repetitions" VARCHAR(40) NOT NULL,
    "restSeconds" INTEGER,
    "notes" TEXT,
    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkoutExercise_sets_check" CHECK ("sets" BETWEEN 1 AND 30),
    CONSTRAINT "WorkoutExercise_rest_check" CHECK ("restSeconds" IS NULL OR "restSeconds" BETWEEN 0 AND 3600),
    CONSTRAINT "WorkoutExercise_position_check" CHECK ("position" >= 0),
    CONSTRAINT "WorkoutExercise_repetitions_check" CHECK (length(btrim("repetitions")) > 0)
);

CREATE UNIQUE INDEX "Exercise_nameKey_key" ON "Exercise"("nameKey");
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");
CREATE INDEX "WorkoutPlan_clientId_isActive_createdAt_idx" ON "WorkoutPlan"("clientId", "isActive", "createdAt");
CREATE INDEX "WorkoutPlan_level_createdAt_idx" ON "WorkoutPlan"("level", "createdAt");
CREATE UNIQUE INDEX "WorkoutExercise_workoutPlanId_position_key" ON "WorkoutExercise"("workoutPlanId", "position");
CREATE INDEX "WorkoutExercise_exerciseId_idx" ON "WorkoutExercise"("exerciseId");

ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_sourcePlanId_fkey"
    FOREIGN KEY ("sourcePlanId") REFERENCES "WorkoutPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutPlanId_fkey"
    FOREIGN KEY ("workoutPlanId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey"
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
