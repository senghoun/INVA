-- Reconcile the existing schema contract with the recorded migration history.
-- Existing roles remain active; no grants are added or removed.
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
