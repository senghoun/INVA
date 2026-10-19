CREATE TABLE "password_reset_challenges" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "channel" VARCHAR(16) NOT NULL,
  "destination" VARCHAR(320) NOT NULL,
  "password_version" VARCHAR(64) NOT NULL,
  "code_hash" VARCHAR(64) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "verified_at" TIMESTAMP(3),
  "reset_token_hash" VARCHAR(64),
  "reset_expires_at" TIMESTAMP(3),
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_challenges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "password_reset_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "password_reset_challenges_user_id_created_at_idx" ON "password_reset_challenges"("user_id", "created_at");

ALTER TABLE "users" ADD COLUMN "telegram_chat_id" VARCHAR(32);
CREATE UNIQUE INDEX "users_telegram_chat_id_key" ON "users"("telegram_chat_id");
CREATE TABLE "telegram_recovery_links" (
  "password_version" VARCHAR(64) NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3)
);
CREATE INDEX "telegram_recovery_links_user_id_idx" ON "telegram_recovery_links"("user_id");
