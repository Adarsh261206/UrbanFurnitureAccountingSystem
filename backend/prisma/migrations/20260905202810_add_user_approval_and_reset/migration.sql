-- CreateEnum
CREATE TYPE "approval_status" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approval_status" "approval_status" NOT NULL DEFAULT 'approved',
ADD COLUMN     "reset_token_expiry" TIMESTAMPTZ,
ADD COLUMN     "reset_token_hash" VARCHAR(255);
