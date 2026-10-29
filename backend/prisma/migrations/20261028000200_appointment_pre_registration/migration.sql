ALTER TABLE "Appointment" ALTER COLUMN "clientId" DROP NOT NULL;
ALTER TABLE "Appointment" ADD COLUMN "guestName" VARCHAR(100);
ALTER TABLE "Appointment" ADD COLUMN "guestPhone" VARCHAR(40);

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_contact_check" CHECK (
    ("clientId" IS NOT NULL AND "guestName" IS NULL AND "guestPhone" IS NULL)
    OR (
        "clientId" IS NULL
        AND "guestName" IS NOT NULL AND length(btrim("guestName")) > 0
        AND "guestPhone" IS NOT NULL AND length(btrim("guestPhone")) > 0
    )
);
