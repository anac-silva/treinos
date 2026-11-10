CREATE TABLE "AppSettings" (
  "id" SMALLINT NOT NULL DEFAULT 1,
  "assessmentIntervalDays" INTEGER NOT NULL DEFAULT 90,
  CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppSettings_singleton" CHECK ("id" = 1),
  CONSTRAINT "AppSettings_interval_positive" CHECK ("assessmentIntervalDays" BETWEEN 1 AND 3650)
);
