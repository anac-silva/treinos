-- Turn existing guest contacts into clients without changing appointment history.
DO $$
DECLARE contact RECORD;
DECLARE contact_id UUID;
BEGIN
  FOR contact IN
    SELECT lower(btrim("guestName")) AS name_key,
      COALESCE(NULLIF(regexp_replace("guestPhone", '[^0-9]', '', 'g'), ''), btrim("guestPhone")) AS phone_key,
      min(btrim("guestName")) AS name
    FROM "Appointment" WHERE "clientId" IS NULL
    GROUP BY 1, 2
  LOOP
    contact_id := gen_random_uuid();
    INSERT INTO "Client" ("id", "name", "phone", "status", "updatedAt")
      VALUES (contact_id, contact.name, contact.phone_key, 'PRE_REGISTERED', CURRENT_TIMESTAMP);
    UPDATE "Appointment" SET "clientId" = contact_id, "guestName" = NULL, "guestPhone" = NULL
      WHERE "clientId" IS NULL AND lower(btrim("guestName")) = contact.name_key
        AND COALESCE(NULLIF(regexp_replace("guestPhone", '[^0-9]', '', 'g'), ''), btrim("guestPhone")) = contact.phone_key;
  END LOOP;
END $$;
