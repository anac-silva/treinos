ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING_CONFIRMATION';
ALTER TABLE "Appointment" ADD COLUMN "sourceAssessmentId" UUID;
CREATE UNIQUE INDEX "Appointment_sourceAssessmentId_key" ON "Appointment"("sourceAssessmentId");
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_sourceAssessmentId_fkey"
  FOREIGN KEY ("sourceAssessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
