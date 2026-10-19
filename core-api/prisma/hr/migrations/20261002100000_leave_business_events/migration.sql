CREATE TABLE "hr_leave_events" (
  "id" UUID NOT NULL,
  "company_id" UUID,
  "employee_id" UUID NOT NULL,
  "resource_id" UUID NOT NULL,
  "action" VARCHAR(64) NOT NULL,
  "actor" VARCHAR(128),
  "metadata" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_leave_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_leave_events_company_id_created_at_idx" ON "hr_leave_events"("company_id", "created_at");
CREATE INDEX "hr_leave_events_resource_id_created_at_idx" ON "hr_leave_events"("resource_id", "created_at");
-- Audit records are append-only through the application and survive employee deletion.
CREATE FUNCTION reject_hr_leave_event_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'HR leave events are append-only';
END;
$$;
CREATE TRIGGER hr_leave_events_immutable BEFORE UPDATE OR DELETE ON "hr_leave_events"
FOR EACH ROW EXECUTE FUNCTION reject_hr_leave_event_changes();
