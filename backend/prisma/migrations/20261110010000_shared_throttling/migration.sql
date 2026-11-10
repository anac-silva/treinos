CREATE TABLE "ThrottleBucket" (
  "key" VARCHAR(128) NOT NULL PRIMARY KEY,
  "hits" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "blockedUntil" TIMESTAMPTZ(3)
);
CREATE INDEX "ThrottleBucket_expiresAt_idx" ON "ThrottleBucket"("expiresAt");
