-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "age" INTEGER,
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "goal" VARCHAR(100),
    "experienceLevel" VARCHAR(50),
    "notes" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementType" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameKey" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MeasurementType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "assessedOn" DATE NOT NULL,
    "weightKg" DECIMAL(7,3) NOT NULL,
    "heightCm" DECIMAL(6,2),
    "bodyFatPercent" DECIMAL(5,2),
    "notes" TEXT,
    "nextAssessmentOn" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentMeasurement" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "typeId" UUID NOT NULL,
    "typeName" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "value" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "AssessmentMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCorrection" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "version" INTEGER NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPhoto" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" VARCHAR(50) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClientPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_status_name_idx" ON "Client"("status", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementType_nameKey_key" ON "MeasurementType"("nameKey");

-- CreateIndex
CREATE INDEX "Assessment_clientId_assessedOn_createdAt_idx" ON "Assessment"("clientId", "assessedOn", "createdAt");

-- CreateIndex
CREATE INDEX "AssessmentMeasurement_typeId_assessmentId_idx" ON "AssessmentMeasurement"("typeId", "assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentMeasurement_assessmentId_typeId_key" ON "AssessmentMeasurement"("assessmentId", "typeId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCorrection_assessmentId_version_key" ON "AssessmentCorrection"("assessmentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPhoto_storageKey_key" ON "ClientPhoto"("storageKey");

-- CreateIndex
CREATE INDEX "ClientPhoto_clientId_principal_idx" ON "ClientPhoto"("clientId", "principal");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMeasurement" ADD CONSTRAINT "AssessmentMeasurement_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMeasurement" ADD CONSTRAINT "AssessmentMeasurement_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCorrection" ADD CONSTRAINT "AssessmentCorrection_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCorrection" ADD CONSTRAINT "AssessmentCorrection_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPhoto" ADD CONSTRAINT "ClientPhoto_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invariantes adicionais preservadas em SQL (não representáveis no schema Prisma).
CREATE UNIQUE INDEX "ClientPhoto_one_principal_idx" ON "ClientPhoto"("clientId") WHERE "principal" = true;
ALTER TABLE "Client" ADD CONSTRAINT "Client_age_check" CHECK ("age" IS NULL OR "age" BETWEEN 0 AND 150);
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_values_check" CHECK (
    "weightKg" > 0 AND ("heightCm" IS NULL OR "heightCm" > 0)
    AND ("bodyFatPercent" IS NULL OR "bodyFatPercent" BETWEEN 0 AND 100)
    AND ("nextAssessmentOn" IS NULL OR "nextAssessmentOn" >= "assessedOn")
    AND "version" >= 1
);
ALTER TABLE "AssessmentMeasurement" ADD CONSTRAINT "AssessmentMeasurement_value_check" CHECK ("value" >= 0);
ALTER TABLE "AssessmentCorrection" ADD CONSTRAINT "AssessmentCorrection_reason_check" CHECK (length(btrim("reason")) > 0 AND "version" >= 2);
ALTER TABLE "ClientPhoto" ADD CONSTRAINT "ClientPhoto_valid_file_check" CHECK (
    "mimeType" IN ('image/jpeg', 'image/png', 'image/webp') AND "sizeBytes" > 0 AND "sizeBytes" <= 5242880
);

