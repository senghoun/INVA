CREATE TABLE "mfa_credentials" (
 "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
 "secret_encrypted" TEXT NOT NULL, "verified_at" TIMESTAMP(3), "setup_expires_at" TIMESTAMP(3) NOT NULL,
 "last_counter" BIGINT NOT NULL DEFAULT -1, "recovery_hashes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);
CREATE TABLE "auth_challenges" (
 "id" UUID PRIMARY KEY, "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
 "purpose" VARCHAR(32) NOT NULL, "attempts" INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
 "expires_at" TIMESTAMP(3) NOT NULL, "used_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "auth_challenges_user_id_purpose_expires_at_idx" ON "auth_challenges"("user_id", "purpose", "expires_at");

ALTER TABLE "refresh_tokens" ADD COLUMN "mfa_verified" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "authentication_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
