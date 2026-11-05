CREATE UNIQUE INDEX "WorkoutPlan_one_active_per_client_key" ON "WorkoutPlan"("clientId")
    WHERE "clientId" IS NOT NULL AND "isActive" = true;
