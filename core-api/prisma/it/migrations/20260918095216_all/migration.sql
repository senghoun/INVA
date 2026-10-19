-- CreateTable
CREATE TABLE "asset_records" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "assigned_to" UUID,
    "category" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_records_pkey" PRIMARY KEY ("id")
);
