-- CreateEnum
CREATE TYPE "contact_type" AS ENUM ('customer', 'vendor', 'both');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "contact_type" "contact_type" NOT NULL DEFAULT 'both',
ADD COLUMN     "gstin" VARCHAR(50),
ADD COLUMN     "pan" VARCHAR(20);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "barcode" VARCHAR(100),
ADD COLUMN     "brand_id" UUID,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "hsn_code" VARCHAR(20),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sku" VARCHAR(100);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "idx_pimg_product" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "idx_products_brand" ON "products"("brand_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
