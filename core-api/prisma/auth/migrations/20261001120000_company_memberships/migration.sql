CREATE TABLE "company_memberships" (
 "id" UUID PRIMARY KEY, "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "company_id" UUID NOT NULL, "branch_ids" UUID[] DEFAULT ARRAY[]::UUID[], "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
 "is_active" BOOLEAN NOT NULL DEFAULT true, "granted_by" UUID NOT NULL,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "company_memberships_user_id_company_id_key" ON "company_memberships"("user_id", "company_id");
CREATE INDEX "company_memberships_company_id_idx" ON "company_memberships"("company_id");
