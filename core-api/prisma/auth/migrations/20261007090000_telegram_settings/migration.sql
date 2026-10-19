CREATE TABLE "telegram_settings" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "bot_token_encrypted" TEXT,
  "bot_username" VARCHAR(64),
  "chat_id" VARCHAR(32) NOT NULL DEFAULT '',
  "cooldown_seconds" INTEGER NOT NULL DEFAULT 60,
  "max_per_minute" INTEGER NOT NULL DEFAULT 20,
  "failure_threshold" INTEGER NOT NULL DEFAULT 10,
  "failure_window_seconds" INTEGER NOT NULL DEFAULT 60,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "updated_by" VARCHAR(320),
  CONSTRAINT "telegram_settings_pkey" PRIMARY KEY ("id")
);
