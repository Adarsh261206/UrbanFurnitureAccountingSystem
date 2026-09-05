-- AlterTable
ALTER TABLE "customer_invoice_lines" ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "customer_invoices" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "vendor_bill_lines" ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "vendor_bills" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;
