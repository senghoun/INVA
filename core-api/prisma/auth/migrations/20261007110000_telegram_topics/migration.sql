ALTER TABLE "telegram_settings" ADD COLUMN "message_thread_id" INTEGER;
ALTER TABLE "telegram_settings" ADD COLUMN "topic_routes" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "telegram_unblock_confirmations" ADD COLUMN "message_thread_id" INTEGER;
