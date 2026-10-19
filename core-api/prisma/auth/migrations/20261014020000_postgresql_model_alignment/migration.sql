-- DropForeignKey
ALTER TABLE "auth_challenges" DROP CONSTRAINT "auth_challenges_user_id_fkey";

-- DropForeignKey
ALTER TABLE "mfa_credentials" DROP CONSTRAINT "mfa_credentials_user_id_fkey";

-- AlterTable
ALTER TABLE "security_policies" ALTER COLUMN "ip_restriction_mode" SET DATA TYPE VARCHAR(32);

-- AddForeignKey
ALTER TABLE "mfa_credentials" ADD CONSTRAINT "mfa_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_challenges" ADD CONSTRAINT "auth_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

