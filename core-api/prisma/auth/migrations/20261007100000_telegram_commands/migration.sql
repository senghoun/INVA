ALTER TABLE "telegram_settings"
ADD COLUMN "commands_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "admin_user_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "next_update_offset" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "telegram_unblock_confirmations" (
  "id" VARCHAR(32) NOT NULL PRIMARY KEY,
  "policy_id" UUID NOT NULL,
  "rule" VARCHAR(64) NOT NULL,
  "actor_id" VARCHAR(20) NOT NULL,
  "chat_id" VARCHAR(32) NOT NULL,
  "bot_fingerprint" VARCHAR(64) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "telegram_unblock_confirmations_expires_at_idx" ON "telegram_unblock_confirmations"("expires_at");
