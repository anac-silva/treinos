ALTER TABLE "Client" ADD COLUMN "sex" VARCHAR(10);
ALTER TABLE "Client" ADD CONSTRAINT "Client_sex_check" CHECK ("sex" IN ('FEMALE', 'MALE'));
