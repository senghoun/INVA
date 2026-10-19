ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users"
  ADD COLUMN "first_name" VARCHAR(100),
  ADD COLUMN "last_name" VARCHAR(100),
  ADD COLUMN "gender" VARCHAR(16),
  ADD COLUMN "image" VARCHAR(2048),
  ADD COLUMN "language" VARCHAR(10) NOT NULL DEFAULT 'en',
  ADD COLUMN "legacy_user_id" INTEGER,
  ADD COLUMN "legacy_metadata" JSONB;
CREATE UNIQUE INDEX "users_legacy_user_id_key" ON "users"("legacy_user_id");
ALTER TABLE "users" ADD CONSTRAINT "users_gender_check" CHECK ("gender" IN ('MALE', 'FEMALE', 'OTHER'));
