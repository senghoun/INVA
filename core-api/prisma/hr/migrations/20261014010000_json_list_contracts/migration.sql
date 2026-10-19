BEGIN;
-- Preserve the current application JSON list contracts when restoring PostgreSQL.
ALTER TABLE "working_schedules" ALTER COLUMN "working_days" DROP DEFAULT;
ALTER TABLE "working_schedules" ALTER COLUMN "working_days" TYPE JSONB USING COALESCE(to_jsonb("working_days"), '[]'::jsonb);
UPDATE "working_schedules" SET "working_days" = '[]'::jsonb WHERE "working_days" IS NULL;
ALTER TABLE "working_schedules" ALTER COLUMN "working_days" SET DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb;
ALTER TABLE "working_schedules" ALTER COLUMN "working_days" SET NOT NULL;
ALTER TABLE "hr_configs" ALTER COLUMN "work_days" DROP DEFAULT;
ALTER TABLE "hr_configs" ALTER COLUMN "work_days" TYPE JSONB USING COALESCE(to_jsonb("work_days"), '[]'::jsonb);
UPDATE "hr_configs" SET "work_days" = '[]'::jsonb WHERE "work_days" IS NULL;
ALTER TABLE "hr_configs" ALTER COLUMN "work_days" SET DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb;
ALTER TABLE "hr_configs" ALTER COLUMN "work_days" SET NOT NULL;
ALTER TABLE "hr_roles" ALTER COLUMN "permissions" DROP DEFAULT;
ALTER TABLE "hr_roles" ALTER COLUMN "permissions" TYPE JSONB USING COALESCE(to_jsonb("permissions"), '[]'::jsonb);
UPDATE "hr_roles" SET "permissions" = '[]'::jsonb WHERE "permissions" IS NULL;
ALTER TABLE "hr_roles" ALTER COLUMN "permissions" SET DEFAULT '[]'::jsonb;
ALTER TABLE "hr_roles" ALTER COLUMN "permissions" SET NOT NULL;
COMMIT;
