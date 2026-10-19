-- Existing email accounts remain valid; only accounts with a phone can use phone login.
ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(16);
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
ALTER TABLE "users" ADD CONSTRAINT "users_phone_format_check"
  CHECK ("phone" IS NULL OR "phone" ~ '^\+[1-9][0-9]{7,14}$');
