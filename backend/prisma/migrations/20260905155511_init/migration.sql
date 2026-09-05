-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'accountant', 'user');

-- CreateEnum
CREATE TYPE "product_type" AS ENUM ('goods', 'service', 'combo');

-- CreateEnum
CREATE TYPE "account_type" AS ENUM ('asset', 'liability', 'bank', 'capital', 'cash', 'income', 'expense');

-- CreateEnum
CREATE TYPE "journal_type" AS ENUM ('sale', 'purchase', 'bank', 'cash');

-- CreateEnum
CREATE TYPE "budget_type" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "budget_status" AS ENUM ('draft', 'confirmed', 'revised', 'cancelled');

-- CreateEnum
CREATE TYPE "je_status" AS ENUM ('draft', 'posted');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'confirmed', 'paid');

-- CreateEnum
CREATE TYPE "payment_type" AS ENUM ('receive', 'send');

-- CreateEnum
CREATE TYPE "payment_via" AS ENUM ('bank', 'cash');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('draft', 'confirmed', 'successful');

-- CreateEnum
CREATE TYPE "so_status" AS ENUM ('draft', 'confirmed');

-- CreateEnum
CREATE TYPE "po_status" AS ENUM ('draft', 'confirmed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),
    "login_id" VARCHAR(12) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "image_url" TEXT,
    "street" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "pincode" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "image_url" TEXT,
    "product_type" "product_type" NOT NULL,
    "category_id" UUID NOT NULL,
    "sales_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyticals" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "responsible_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "analytic_account" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyticals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "responsible_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "type" "budget_type" NOT NULL,
    "analytical_id" UUID NOT NULL,
    "status" "budget_status" NOT NULL DEFAULT 'draft',
    "committed_amount" DECIMAL(15,2),
    "achieved_amount" DECIMAL(15,2) DEFAULT 0,
    "original_budget_id" UUID,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "account_type" "account_type" NOT NULL,
    "journal_type" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journals" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "journal_type" "journal_type" NOT NULL,
    "default_account_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "entry_number" VARCHAR(50) NOT NULL,
    "accounting_date" DATE NOT NULL,
    "journal_id" UUID NOT NULL,
    "source_document_type" VARCHAR(50),
    "source_document_id" UUID,
    "status" "je_status" NOT NULL DEFAULT 'draft',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "sr_no" INTEGER NOT NULL,
    "account_id" UUID NOT NULL,
    "partner_id" UUID,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" UUID NOT NULL,
    "so_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "so_status" NOT NULL DEFAULT 'draft',
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_lines" (
    "id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "sr_no" INTEGER NOT NULL,
    "product_id" UUID NOT NULL,
    "chart_of_account_id" UUID NOT NULL,
    "budget_analytic_id" UUID,
    "qty" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "sales_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_invoices" (
    "id" UUID NOT NULL,
    "invoice_reference" VARCHAR(50) NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "sales_order_id" UUID,
    "customer_id" UUID NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "payment_type" "payment_type" NOT NULL DEFAULT 'receive',
    "partner_id" UUID NOT NULL,
    "payment_via" "payment_via" NOT NULL DEFAULT 'bank',
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "journal_entry_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_invoice_lines" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "sr_no" INTEGER NOT NULL,
    "product_id" UUID NOT NULL,
    "chart_of_account_id" UUID NOT NULL,
    "budget_analytic_id" UUID,
    "qty" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "customer_invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "po_number" VARCHAR(50) NOT NULL,
    "vendor_id" UUID NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bill_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "po_status" NOT NULL DEFAULT 'draft',
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "sr_no" INTEGER NOT NULL,
    "product_id" UUID NOT NULL,
    "chart_of_account_id" UUID NOT NULL,
    "budget_analytic_id" UUID,
    "qty" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bills" (
    "id" UUID NOT NULL,
    "bill_reference" VARCHAR(50) NOT NULL,
    "vendor_bill_no" VARCHAR(50),
    "purchase_order_id" UUID,
    "vendor_id" UUID NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bill_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "payment_type" "payment_type" NOT NULL DEFAULT 'send',
    "partner_id" UUID NOT NULL,
    "payment_via" "payment_via" NOT NULL DEFAULT 'bank',
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "journal_entry_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bill_lines" (
    "id" UUID NOT NULL,
    "vendor_bill_id" UUID NOT NULL,
    "sr_no" INTEGER NOT NULL,
    "product_id" UUID NOT NULL,
    "chart_of_account_id" UUID NOT NULL,
    "budget_analytic_id" UUID,
    "qty" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "vendor_bill_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "payment_number" VARCHAR(50) NOT NULL,
    "invoice_id" UUID,
    "vendor_bill_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_via" "payment_via" NOT NULL,
    "payment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "payment_status" NOT NULL DEFAULT 'draft',
    "journal_entry_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequences" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "prefix" VARCHAR(20) NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "year_scope" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_id_key" ON "users"("login_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_budgets_type" ON "budgets"("type");

-- CreateIndex
CREATE INDEX "idx_budgets_status" ON "budgets"("status");

-- CreateIndex
CREATE INDEX "idx_budgets_analytical" ON "budgets"("analytical_id");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_name_key" ON "chart_of_accounts"("name");

-- CreateIndex
CREATE INDEX "idx_coa_type" ON "chart_of_accounts"("account_type");

-- CreateIndex
CREATE UNIQUE INDEX "journals_name_key" ON "journals"("name");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "journal_entries"("entry_number");

-- CreateIndex
CREATE INDEX "idx_je_entry_number" ON "journal_entries"("entry_number");

-- CreateIndex
CREATE INDEX "idx_je_date" ON "journal_entries"("accounting_date");

-- CreateIndex
CREATE INDEX "idx_je_journal" ON "journal_entries"("journal_id");

-- CreateIndex
CREATE INDEX "idx_je_status" ON "journal_entries"("status");

-- CreateIndex
CREATE INDEX "idx_je_source" ON "journal_entries"("source_document_type", "source_document_id");

-- CreateIndex
CREATE INDEX "idx_jel_je" ON "journal_entry_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "idx_jel_account" ON "journal_entry_lines"("account_id");

-- CreateIndex
CREATE INDEX "idx_jel_partner" ON "journal_entry_lines"("partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_so_number_key" ON "sales_orders"("so_number");

-- CreateIndex
CREATE INDEX "idx_so_number" ON "sales_orders"("so_number");

-- CreateIndex
CREATE INDEX "idx_so_customer" ON "sales_orders"("customer_id");

-- CreateIndex
CREATE INDEX "idx_so_status" ON "sales_orders"("status");

-- CreateIndex
CREATE INDEX "idx_sol_so" ON "sales_order_lines"("sales_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_invoices_invoice_reference_key" ON "customer_invoices"("invoice_reference");

-- CreateIndex
CREATE UNIQUE INDEX "customer_invoices_invoice_number_key" ON "customer_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "idx_inv_ref" ON "customer_invoices"("invoice_reference");

-- CreateIndex
CREATE INDEX "idx_inv_number" ON "customer_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "idx_inv_so" ON "customer_invoices"("sales_order_id");

-- CreateIndex
CREATE INDEX "idx_inv_customer" ON "customer_invoices"("customer_id");

-- CreateIndex
CREATE INDEX "idx_inv_status" ON "customer_invoices"("status");

-- CreateIndex
CREATE INDEX "idx_cil_inv" ON "customer_invoice_lines"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "idx_po_number" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "idx_po_vendor" ON "purchase_orders"("vendor_id");

-- CreateIndex
CREATE INDEX "idx_po_status" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "idx_pol_po" ON "purchase_order_lines"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bills_bill_reference_key" ON "vendor_bills"("bill_reference");

-- CreateIndex
CREATE INDEX "idx_bill_ref" ON "vendor_bills"("bill_reference");

-- CreateIndex
CREATE INDEX "idx_bill_po" ON "vendor_bills"("purchase_order_id");

-- CreateIndex
CREATE INDEX "idx_bill_vendor" ON "vendor_bills"("vendor_id");

-- CreateIndex
CREATE INDEX "idx_bill_status" ON "vendor_bills"("status");

-- CreateIndex
CREATE INDEX "idx_vbl_bill" ON "vendor_bill_lines"("vendor_bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "idx_pay_number" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "idx_pay_invoice" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_pay_bill" ON "payments"("vendor_bill_id");

-- CreateIndex
CREATE INDEX "idx_pay_status" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sequences_name_year_key" ON "sequences"("name", "year");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyticals" ADD CONSTRAINT "analyticals_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_analytical_id_fkey" FOREIGN KEY ("analytical_id") REFERENCES "analyticals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_original_budget_id_fkey" FOREIGN KEY ("original_budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_default_account_id_fkey" FOREIGN KEY ("default_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_budget_analytic_id_fkey" FOREIGN KEY ("budget_analytic_id") REFERENCES "analyticals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoice_lines" ADD CONSTRAINT "customer_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "customer_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoice_lines" ADD CONSTRAINT "customer_invoice_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoice_lines" ADD CONSTRAINT "customer_invoice_lines_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_invoice_lines" ADD CONSTRAINT "customer_invoice_lines_budget_analytic_id_fkey" FOREIGN KEY ("budget_analytic_id") REFERENCES "analyticals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_budget_analytic_id_fkey" FOREIGN KEY ("budget_analytic_id") REFERENCES "analyticals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_lines" ADD CONSTRAINT "vendor_bill_lines_vendor_bill_id_fkey" FOREIGN KEY ("vendor_bill_id") REFERENCES "vendor_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_lines" ADD CONSTRAINT "vendor_bill_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_lines" ADD CONSTRAINT "vendor_bill_lines_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_bill_lines" ADD CONSTRAINT "vendor_bill_lines_budget_analytic_id_fkey" FOREIGN KEY ("budget_analytic_id") REFERENCES "analyticals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "customer_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_vendor_bill_id_fkey" FOREIGN KEY ("vendor_bill_id") REFERENCES "vendor_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
