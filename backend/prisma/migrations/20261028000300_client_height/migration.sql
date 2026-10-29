ALTER TABLE "Client" ADD COLUMN "heightCm" DECIMAL(6,2);

-- Preserve heights previously collected through assessments.
UPDATE "Client" AS c
SET "heightCm" = latest."heightCm"
FROM (
  SELECT DISTINCT ON ("clientId") "clientId", "heightCm"
  FROM "Assessment"
  WHERE "heightCm" IS NOT NULL
  ORDER BY "clientId", "assessedOn" DESC, "createdAt" DESC, "id" DESC
) AS latest
WHERE c."id" = latest."clientId";
