-- CreateTable
CREATE TABLE "security_policies" (
    "id" UUID NOT NULL,
    "rate_limit_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit_max_attempts" INTEGER NOT NULL DEFAULT 5,
    "rate_limit_window_seconds" INTEGER NOT NULL DEFAULT 900,
    "rate_limit_lockout_seconds" INTEGER NOT NULL DEFAULT 900,
    "ip_restriction_mode" TEXT NOT NULL DEFAULT 'DISABLED',
    "ip_allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ip_blocklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domain_restriction_enabled" BOOLEAN NOT NULL DEFAULT false,
    "allowed_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "service_domain_map" JSONB,
    "access_token_ttl_seconds" INTEGER NOT NULL DEFAULT 900,
    "refresh_token_ttl_seconds" INTEGER NOT NULL DEFAULT 604800,
    "max_concurrent_sessions" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(320),

    CONSTRAINT "security_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_email" VARCHAR(320),
    "action" VARCHAR(64) NOT NULL,
    "outcome" VARCHAR(32) NOT NULL,
    "ip" VARCHAR(64) NOT NULL,
    "country" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "details" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_user_email_idx" ON "audit_logs"("user_email");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

