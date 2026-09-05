# 14 — Database Schema

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Conventions

| Convention | Value |
|------------|-------|
| Database | PostgreSQL |
| ORM | Prisma ONLY |
| Naming | snake_case everywhere |
| Primary Key | `id` (UUID) |
| Foreign Keys | `<entity>_id` |
| Timestamps | `created_at`, `updated_at` |
| Status Fields | `status` |
| Monetary | `DECIMAL(15,2)` |
| Soft Delete | `deleted_at` (TIMESTAMPTZ, nullable) |

---

## 2. Enum Definitions

```sql
CREATE TYPE user_role AS ENUM ('admin', 'accountant', 'user');
CREATE TYPE product_type AS ENUM ('goods', 'service', 'combo');
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'bank', 'capital', 'cash', 'income', 'expense');
CREATE TYPE journal_type AS ENUM ('sale', 'purchase', 'bank', 'cash');
CREATE TYPE budget_type AS ENUM ('income', 'expense');
CREATE TYPE budget_status AS ENUM ('draft', 'confirmed', 'revised', 'cancelled');
CREATE TYPE je_status AS ENUM ('draft', 'posted');
CREATE TYPE invoice_status AS ENUM ('draft', 'confirmed', 'paid');
CREATE TYPE payment_type AS ENUM ('receive', 'send');
CREATE TYPE payment_via AS ENUM ('bank', 'cash');
CREATE TYPE payment_status AS ENUM ('draft', 'confirmed', 'successful');
CREATE TYPE so_status AS ENUM ('draft', 'confirmed');
CREATE TYPE po_status AS ENUM ('draft', 'confirmed');
```

---

## 3. Table Definitions

### 3.1 users

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| name | VARCHAR(255) | NO | — | — | — | — | — | — | Full name | SOURCE_REQUIRED |
| login_id | VARCHAR(12) | NO | — | — | — | YES | idx_users_login_id | LENGTH(login_id) BETWEEN 6 AND 12 | Login identifier | SOURCE_REQUIRED |
| email | VARCHAR(255) | NO | — | — | — | YES | idx_users_email | — | Email address | SOURCE_REQUIRED |
| password_hash | VARCHAR(255) | NO | — | — | — | — | — | — | bcrypt hash | ENGINEERING_DECISION |
| role | user_role | NO | 'user' | — | — | — | — | — | User role | SOURCE_REQUIRED |
| is_active | BOOLEAN | NO | true | — | — | — | — | — | Account active flag | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

**Constraints:**
- `chk_users_login_id_length`: CHECK (LENGTH(login_id) BETWEEN 6 AND 12)

---

### 3.2 contacts

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| name | VARCHAR(255) | NO | — | — | — | — | — | — | Contact name | SOURCE_REQUIRED |
| email | VARCHAR(255) | NO | — | — | — | YES | idx_contacts_email | — | Email address | SOURCE_REQUIRED |
| phone | VARCHAR(50) | YES | — | — | — | — | — | — | Phone number | SOURCE_REQUIRED |
| image_url | TEXT | YES | — | — | — | — | — | — | Profile image URL | SOURCE_REQUIRED |
| street | VARCHAR(255) | YES | — | — | — | — | — | — | Address street | SOURCE_REQUIRED |
| city | VARCHAR(100) | YES | — | — | — | — | — | — | Address city | SOURCE_REQUIRED |
| state | VARCHAR(100) | YES | — | — | — | — | — | — | Address state | SOURCE_REQUIRED |
| country | VARCHAR(100) | YES | — | — | — | — | — | — | Address country | SOURCE_REQUIRED |
| pincode | VARCHAR(20) | YES | — | — | — | — | — | — | Address pincode | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |
| deleted_at | TIMESTAMPTZ | YES | — | — | — | — | — | — | Soft delete timestamp | ED-004 |

---

### 3.3 categories

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| name | VARCHAR(255) | NO | — | — | — | YES | — | — | Category name | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |

---

### 3.4 products

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| name | VARCHAR(255) | NO | — | — | — | — | — | — | Product name | SOURCE_REQUIRED |
| image_url | TEXT | YES | — | — | — | — | — | — | Product image URL | SOURCE_REQUIRED |
| product_type | product_type | NO | — | — | — | — | — | — | Goods/Service/Combo | SOURCE_REQUIRED |
| category_id | UUID | NO | — | — | FK → categories | — | idx_products_category | — | Product category | SOURCE_REQUIRED |
| sales_price | DECIMAL(15,2) | NO | 0 | — | — | — | — | sales_price >= 0 | Selling price | SOURCE_REQUIRED |
| cost | DECIMAL(15,2) | NO | 0 | — | — | — | — | cost >= 0 | Cost price | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |
| deleted_at | TIMESTAMPTZ | YES | — | — | — | — | — | — | Soft delete timestamp | ED-004 |

**Constraints:**
- `chk_products_sales_price`: CHECK (sales_price >= 0)
- `chk_products_cost`: CHECK (cost >= 0)

---

### 3.5 analyticals

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| name | VARCHAR(255) | NO | — | — | — | — | — | — | Budget name | SOURCE_REQUIRED |
| responsible_id | UUID | NO | — | — | FK → contacts | — | — | — | Responsible person | SOURCE_REQUIRED |
| start_date | DATE | NO | — | — | — | — | — | — | Period start date | SOURCE_REQUIRED |
| to_date | DATE | NO | — | — | — | — | — | CHECK (to_date >= start_date) | Period middle date | SOURCE_REQUIRED |
| end_date | DATE | NO | — | — | — | — | — | CHECK (end_date >= to_date) | Period end date | SOURCE_REQUIRED |
| analytic_account | VARCHAR(255) | NO | — | — | — | — | — | — | Analytic account identifier | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

**Constraints:**
- `chk_analyticals_dates`: CHECK (to_date >= start_date AND end_date >= to_date)

---

### 3.6 budgets

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| name | VARCHAR(255) | NO | — | — | — | — | — | — | Budget name | SOURCE_REQUIRED |
| responsible_id | UUID | NO | — | — | FK → contacts | — | — | — | Responsible person | SOURCE_REQUIRED |
| start_date | DATE | NO | — | — | — | — | — | — | Budget period start | SOURCE_REQUIRED |
| end_date | DATE | NO | — | — | — | — | — | CHECK (end_date >= start_date) | Budget period end | SOURCE_REQUIRED |
| type | budget_type | NO | — | — | — | — | idx_budgets_type | — | Income or Expense | SOURCE_REQUIRED |
| analytical_id | UUID | NO | — | — | FK → analyticals | — | idx_budgets_analytical | — | Linked analytical account | SOURCE_REQUIRED |
| status | budget_status | NO | 'draft' | — | — | — | idx_budgets_status | — | Budget status | SOURCE_REQUIRED |
| committed_amount | DECIMAL(15,2) | YES | NULL | — | — | — | — | committed_amount >= 0 OR NULL | Committed amount (set on confirm) | SOURCE_REQUIRED |
| achieved_amount | DECIMAL(15,2) | YES | 0 | — | — | — | — | — | Computed from invoices/bills | SOURCE_REQUIRED |
| original_budget_id | UUID | YES | NULL | — | FK → budgets | — | — | — | Link to original budget (revisions) | SOURCE_REQUIRED |
| is_archived | BOOLEAN | NO | false | — | — | — | — | — | Archive flag (cancelled budgets) | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

**Constraints:**
- `chk_budgets_dates`: CHECK (end_date >= start_date)
- `chk_budgets_committed`: CHECK (committed_amount >= 0 OR committed_amount IS NULL)

---

### 3.7 chart_of_accounts

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| name | VARCHAR(255) | NO | — | — | — | YES | — | — | Account name | SOURCE_REQUIRED |
| account_type | account_type | NO | — | — | — | — | idx_coa_type | — | Account type | SOURCE_REQUIRED |
| journal_type | VARCHAR(50) | YES | — | — | — | — | — | — | Default journal type | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

---

### 3.8 journals

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| name | VARCHAR(100) | NO | — | — | — | YES | — | — | Journal name | SOURCE_REQUIRED |
| journal_type | journal_type | NO | — | — | — | — | — | — | Journal type | SOURCE_REQUIRED |
| default_account_id | UUID | NO | — | — | FK → chart_of_accounts | — | — | — | Default account for this journal | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |

---

### 3.9 journal_entries

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| entry_number | VARCHAR(50) | NO | — | — | — | YES | idx_je_entry_number | — | Auto-generated entry number | SOURCE_REQUIRED |
| accounting_date | DATE | NO | — | — | — | — | idx_je_date | — | Accounting date | SOURCE_REQUIRED |
| journal_id | UUID | NO | — | — | FK → journals | — | idx_je_journal | — | Journal reference | SOURCE_REQUIRED |
| source_document_type | VARCHAR(50) | YES | — | — | — | — | — | — | 'invoice', 'bill', 'manual' | ENGINEERING_DECISION |
| source_document_id | UUID | YES | — | — | — | — | idx_je_source | — | Polymorphic reference | ENGINEERING_DECISION |
| status | je_status | NO | 'draft' | — | — | — | idx_je_status | — | Entry status | SOURCE_REQUIRED |
| created_by | UUID | YES | — | — | FK → users | — | — | — | Creator user ID | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

---

### 3.10 journal_entry_lines

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| journal_entry_id | UUID | NO | — | — | FK → journal_entries ON DELETE CASCADE | — | idx_jel_je | — | Parent journal entry | SOURCE_REQUIRED |
| account_id | UUID | NO | — | — | FK → chart_of_accounts | — | idx_jel_account | — | Account reference | SOURCE_REQUIRED |
| partner_id | UUID | YES | — | — | FK → contacts | — | idx_jel_partner | — | Partner (customer/vendor) | SOURCE_REQUIRED |
| debit | DECIMAL(15,2) | NO | 0 | — | — | — | — | debit >= 0 | Debit amount | SOURCE_REQUIRED |
| credit | DECIMAL(15,2) | NO | 0 | — | — | — | — | credit >= 0 | Credit amount | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |

**Constraints:**
- `chk_jel_debit`: CHECK (debit >= 0)
- `chk_jel_credit`: CHECK (credit >= 0)
- `chk_jel_amount`: CHECK (debit > 0 OR credit > 0)
- Balance constraint enforced at application level: SUM(debit) = SUM(credit) per journal_entry_id

---

### 3.11 sales_orders

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| so_number | VARCHAR(50) | NO | — | — | — | YES | idx_so_number | — | Auto-generated SO number | SOURCE_REQUIRED |
| customer_id | UUID | NO | — | — | FK → contacts | — | idx_so_customer | — | Customer reference | SOURCE_REQUIRED |
| date | DATE | NO | CURRENT_DATE | — | — | — | — | — | Order date | SOURCE_REQUIRED |
| invoice_date | DATE | NO | — | — | — | — | — | — | Invoice date | SOURCE_REQUIRED |
| due_date | DATE | NO | — | — | — | — | — | — | Due date | SOURCE_REQUIRED |
| status | so_status | NO | 'draft' | — | — | — | idx_so_status | — | Order status | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | — | — | — | — | — | Computed total | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

---

### 3.12 sales_order_lines

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| sales_order_id | UUID | NO | — | — | FK → sales_orders ON DELETE CASCADE | — | idx_sol_so | — | Parent sales order | SOURCE_REQUIRED |
| sr_no | INTEGER | NO | — | — | — | — | — | — | Serial number | SOURCE_REQUIRED |
| product_id | UUID | NO | — | — | FK → products | — | — | — | Product reference | SOURCE_REQUIRED |
| chart_of_account_id | UUID | NO | — | — | FK → chart_of_accounts | — | — | — | Account reference (default: Sales) | SOURCE_REQUIRED |
| budget_analytic_id | UUID | YES | — | — | FK → analyticals | — | — | — | Analytical account reference | SOURCE_REQUIRED |
| qty | DECIMAL(10,3) | NO | 1 | — | — | — | — | qty > 0 | Quantity | SOURCE_REQUIRED |
| unit_price | DECIMAL(15,2) | NO | 0 | — | — | — | — | unit_price >= 0 | Unit price | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | — | — | — | — | — | Computed: qty * unit_price | SOURCE_REQUIRED |

**Constraints:**
- `chk_sol_qty`: CHECK (qty > 0)
- `chk_sol_unit_price`: CHECK (unit_price >= 0)

---

### 3.13 customer_invoices

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| invoice_reference | VARCHAR(50) | NO | — | — | — | YES | idx_inv_ref | — | Auto-generated: INV/YYYY/NNNN | SOURCE_REQUIRED |
| invoice_number | VARCHAR(50) | NO | — | — | — | YES | idx_inv_number | — | Auto-generated invoice number | SOURCE_REQUIRED |
| sales_order_id | UUID | YES | — | — | FK → sales_orders | — | idx_inv_so | — | Source sales order | SOURCE_REQUIRED |
| customer_id | UUID | NO | — | — | FK → contacts | — | idx_inv_customer | — | Customer reference | SOURCE_REQUIRED |
| date | DATE | NO | CURRENT_DATE | — | — | — | — | — | Invoice date | SOURCE_REQUIRED |
| invoice_date | DATE | NO | — | — | — | — | — | — | Invoice date (for aging) | SOURCE_REQUIRED |
| due_date | DATE | NO | — | — | — | — | — | — | Due date | SOURCE_REQUIRED |
| payment_type | payment_type | NO | 'receive' | — | — | — | — | — | Receive or Send | SOURCE_REQUIRED |
| partner_id | UUID | NO | — | — | FK → contacts | — | — | — | Partner (autofill from customer) | SOURCE_REQUIRED |
| payment_via | payment_via | NO | 'bank' | — | — | — | — | — | Payment method | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | — | — | — | — | — | Computed from lines | ENGINEERING_DECISION |
| amount_due | DECIMAL(15,2) | NO | 0 | — | — | — | — | amount_due >= 0 | Remaining amount | ENGINEERING_DECISION |
| status | invoice_status | NO | 'draft' | — | — | — | idx_inv_status | — | Invoice status | SOURCE_REQUIRED |
| journal_entry_id | UUID | YES | — | — | FK → journal_entries | — | — | — | Auto-created journal entry | ENGINEERING_DECISION |
| created_by | UUID | NO | — | — | FK → users | — | — | — | Creator user ID | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

**Constraints:**
- `chk_inv_amount_due`: CHECK (amount_due >= 0)
- `chk_inv_dates`: CHECK (date <= invoice_date AND invoice_date <= due_date)

---

### 3.14 customer_invoice_lines

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| invoice_id | UUID | NO | — | — | FK → customer_invoices ON DELETE CASCADE | — | idx_cil_inv | — | Parent invoice | SOURCE_REQUIRED |
| sr_no | INTEGER | NO | — | — | — | — | — | — | Serial number | SOURCE_REQUIRED |
| product_id | UUID | NO | — | — | FK → products | — | — | — | Product reference | SOURCE_REQUIRED |
| chart_of_account_id | UUID | NO | — | — | FK → chart_of_accounts | — | — | — | Account reference (default: Sales) | SOURCE_REQUIRED |
| budget_analytic_id | UUID | YES | — | — | FK → analyticals | — | — | — | Analytical account reference | SOURCE_REQUIRED |
| qty | DECIMAL(10,3) | NO | 1 | — | — | — | — | qty > 0 | Quantity | SOURCE_REQUIRED |
| unit_price | DECIMAL(15,2) | NO | 0 | — | — | — | — | unit_price >= 0 | Unit price | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | — | — | — | — | — | Computed: qty * unit_price | SOURCE_REQUIRED |

**Constraints:**
- `chk_cil_qty`: CHECK (qty > 0)
- `chk_cil_unit_price`: CHECK (unit_price >= 0)

---

### 3.15 purchase_orders

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| po_number | VARCHAR(50) | NO | — | — | — | YES | idx_po_number | — | Auto-generated: P00001+1 | SOURCE_REQUIRED |
| vendor_id | UUID | NO | — | — | FK → contacts | — | idx_po_vendor | — | Vendor reference | SOURCE_REQUIRED |
| date | DATE | NO | CURRENT_DATE | — | — | — | — | — | Order date | SOURCE_REQUIRED |
| bill_date | DATE | NO | — | — | — | — | — | — | Bill date | SOURCE_REQUIRED |
| due_date | DATE | NO | — | — | — | — | — | — | Due date | SOURCE_REQUIRED |
| status | po_status | NO | 'draft' | — | — | — | idx_po_status | — | Order status | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | — | — | — | — | — | Computed total | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

---

### 3.16 purchase_order_lines

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| purchase_order_id | UUID | NO | — | — | FK → purchase_orders ON DELETE CASCADE | — | idx_pol_po | — | Parent purchase order | SOURCE_REQUIRED |
| sr_no | INTEGER | NO | — | — | — | — | — | — | Serial number | SOURCE_REQUIRED |
| product_id | UUID | NO | — | — | FK → products | — | — | — | Product reference | SOURCE_REQUIRED |
| chart_of_account_id | UUID | NO | — | — | FK → chart_of_accounts | — | — | — | Account reference (default: Purchase) | SOURCE_REQUIRED |
| budget_analytic_id | UUID | YES | — | — | FK → analyticals | — | — | — | Analytical account reference | SOURCE_REQUIRED |
| qty | DECIMAL(10,3) | NO | 1 | — | — | — | — | qty > 0 | Quantity | SOURCE_REQUIRED |
| unit_price | DECIMAL(15,2) | NO | 0 | — | — | — | — | unit_price >= 0 | Unit price | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | — | — | — | — | — | Computed: qty * unit_price | SOURCE_REQUIRED |

**Constraints:**
- `chk_pol_qty`: CHECK (qty > 0)
- `chk_pol_unit_price`: CHECK (unit_price >= 0)

---

### 3.17 vendor_bills

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| bill_reference | VARCHAR(50) | NO | — | — | — | YES | idx_bill_ref | — | Auto-generated: Bill/YYYY/NNNN | SOURCE_REQUIRED |
| vendor_bill_no | VARCHAR(50) | YES | — | — | — | — | — | — | Vendor's bill number | SOURCE_REQUIRED |
| purchase_order_id | UUID | YES | — | — | FK → purchase_orders | — | idx_bill_po | — | Source purchase order | SOURCE_REQUIRED |
| vendor_id | UUID | NO | — | — | FK → contacts | — | idx_bill_vendor | — | Vendor reference | SOURCE_REQUIRED |
| date | DATE | NO | CURRENT_DATE | — | — | — | — | — | Bill date | SOURCE_REQUIRED |
| bill_date | DATE | NO | — | — | — | — | — | — | Bill date (for aging) | SOURCE_REQUIRED |
| due_date | DATE | NO | — | — | — | — | — | — | Due date | SOURCE_REQUIRED |
| payment_type | payment_type | NO | 'send' | — | — | — | — | — | Receive or Send | SOURCE_REQUIRED |
| partner_id | UUID | NO | — | — | FK → contacts | — | — | — | Partner (autofill from vendor) | SOURCE_REQUIRED |
| payment_via | payment_via | NO | 'bank' | — | — | — | — | — | Payment method | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | — | — | — | — | — | Computed from lines | ENGINEERING_DECISION |
| amount_due | DECIMAL(15,2) | NO | 0 | — | — | — | — | amount_due >= 0 | Remaining amount | ENGINEERING_DECISION |
| status | invoice_status | NO | 'draft' | — | — | — | idx_bill_status | — | Bill status | SOURCE_REQUIRED |
| journal_entry_id | UUID | YES | — | — | FK → journal_entries | — | — | — | Auto-created journal entry | ENGINEERING_DECISION |
| created_by | UUID | NO | — | — | FK → users | — | — | — | Creator user ID | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

**Constraints:**
- `chk_bill_amount_due`: CHECK (amount_due >= 0)
- `chk_bill_dates`: CHECK (date <= bill_date AND bill_date <= due_date)

---

### 3.18 vendor_bill_lines

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| vendor_bill_id | UUID | NO | — | — | FK → vendor_bills ON DELETE CASCADE | — | idx_vbl_bill | — | Parent vendor bill | SOURCE_REQUIRED |
| sr_no | INTEGER | NO | — | — | — | — | — | — | Serial number | SOURCE_REQUIRED |
| product_id | UUID | NO | — | — | FK → products | — | — | — | Product reference | SOURCE_REQUIRED |
| chart_of_account_id | UUID | NO | — | — | FK → chart_of_accounts | — | — | — | Account reference (default: Purchase) | SOURCE_REQUIRED |
| budget_analytic_id | UUID | YES | — | — | FK → analyticals | — | — | — | Analytical account reference | SOURCE_REQUIRED |
| qty | DECIMAL(10,3) | NO | 1 | — | — | — | — | qty > 0 | Quantity | SOURCE_REQUIRED |
| unit_price | DECIMAL(15,2) | NO | 0 | — | — | — | — | unit_price >= 0 | Unit price | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | — | — | — | — | — | Computed: qty * unit_price | SOURCE_REQUIRED |

**Constraints:**
- `chk_vbl_qty`: CHECK (qty > 0)
- `chk_vbl_unit_price`: CHECK (unit_price >= 0)

---

### 3.19 payments

| Column | Type | Nullable | Default | PK | FK | Unique | Index | Check | Description | Source |
|--------|------|----------|---------|----|----|--------|-------|-------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | YES | — | — | — | — | Primary key | ED-001 |
| payment_number | VARCHAR(50) | NO | — | — | — | YES | idx_pay_number | — | Auto-generated: PAY/YYYY/NNNN | ED-007 |
| invoice_id | UUID | YES | — | — | FK → customer_invoices | — | idx_pay_invoice | — | Invoice reference (receipt) | SOURCE_REQUIRED |
| vendor_bill_id | UUID | YES | — | — | FK → vendor_bills | — | idx_pay_bill | — | Bill reference (payment) | SOURCE_REQUIRED |
| amount | DECIMAL(15,2) | NO | — | — | — | — | — | amount > 0 | Payment amount | SOURCE_REQUIRED |
| payment_via | payment_via | NO | — | — | — | — | — | — | Bank or Cash | SOURCE_REQUIRED |
| payment_date | DATE | NO | CURRENT_DATE | — | — | — | — | — | Payment date | SOURCE_REQUIRED |
| status | payment_status | NO | 'draft' | — | — | — | idx_pay_status | — | Payment status | ENGINEERING_DECISION |
| journal_entry_id | UUID | YES | — | — | FK → journal_entries | — | — | — | Auto-created journal entry | ENGINEERING_DECISION |
| created_by | UUID | NO | — | — | FK → users | — | — | — | Creator user ID | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Creation timestamp | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | — | — | — | — | Last update timestamp | ENGINEERING_DECISION |

**Constraints:**
- `chk_pay_amount`: CHECK (amount > 0)
- `chk_pay_target`: CHECK ((invoice_id IS NOT NULL AND vendor_bill_id IS NULL) OR (invoice_id IS NULL AND vendor_bill_id IS NOT NULL))

---

## 4. Foreign Key Graph

```
users
  └──▶ customer_invoices.created_by
  └──▶ vendor_bills.created_by
  └──▶ payments.created_by
  └──▶ journal_entries.created_by

contacts
  └──▶ sales_orders.customer_id
  └──▶ purchase_orders.vendor_id
  └──▶ customer_invoices.customer_id
  └──▶ customer_invoices.partner_id
  └──▶ vendor_bills.vendor_id
  └──▶ vendor_bills.partner_id
  └──▶ journal_entry_lines.partner_id
  └──▶ analyticals.responsible_id
  └──▶ budgets.responsible_id

categories
  └──▶ products.category_id

products
  └──▶ sales_order_lines.product_id
  └──▶ customer_invoice_lines.product_id
  └──▶ purchase_order_lines.product_id
  └──▶ vendor_bill_lines.product_id

analyticals
  └──▶ budgets.analytical_id
  └──▶ sales_order_lines.budget_analytic_id
  └──▶ customer_invoice_lines.budget_analytic_id
  └──▶ purchase_order_lines.budget_analytic_id
  └──▶ vendor_bill_lines.budget_analytic_id

budgets
  └──▶ budgets.original_budget_id (self)

chart_of_accounts
  └──▶ journals.default_account_id
  └──▶ journal_entry_lines.account_id
  └──▶ sales_order_lines.chart_of_account_id
  └──▶ customer_invoice_lines.chart_of_account_id
  └──▶ purchase_order_lines.chart_of_account_id
  └──▶ vendor_bill_lines.chart_of_account_id

journals
  └──▶ journal_entries.journal_id

journal_entries
  └──▶ journal_entry_lines.journal_entry_id (CASCADE)
  └──▶ customer_invoices.journal_entry_id
  └──▶ vendor_bills.journal_entry_id
  └──▶ payments.journal_entry_id

sales_orders
  └──▶ sales_order_lines.sales_order_id (CASCADE)
  └──▶ customer_invoices.sales_order_id

customer_invoices
  └──▶ customer_invoice_lines.invoice_id (CASCADE)
  └──▶ payments.invoice_id

purchase_orders
  └──▶ purchase_order_lines.purchase_order_id (CASCADE)
  └──▶ vendor_bills.purchase_order_id

vendor_bills
  └──▶ vendor_bill_lines.vendor_bill_id (CASCADE)
  └──▶ payments.vendor_bill_id
```

---

## 5. Cascade Behavior

| Relationship | On Delete | On Update |
|-------------|-----------|-----------|
| journal_entry_lines.journal_entry_id | CASCADE | CASCADE |
| customer_invoice_lines.invoice_id | CASCADE | CASCADE |
| vendor_bill_lines.vendor_bill_id | CASCADE | CASCADE |
| sales_order_lines.sales_order_id | CASCADE | CASCADE |
| purchase_order_lines.purchase_order_id | CASCADE | CASCADE |
| All other FKs | RESTRICT | CASCADE |

**RESTRICT** means: Cannot delete parent if children exist. This prevents accidental data loss.

---

## 6. Seed Data

### 6.1 Chart of Accounts (Pre-configured)

| Name | Account Type | Journal Type |
|------|-------------|--------------|
| Sales Income A/c | income | sale |
| Purchase Expense A/c | expense | purchase |
| Bank A/c | bank | bank |
| Cash A/c | cash | cash |
| Capital | capital | — |
| Debtors | asset | — |
| Creditors | liability | — |

### 6.2 Journals (Pre-configured)

| Name | Journal Type | Default Account |
|------|-------------|-----------------|
| Sales | sale | Sales Income A/c |
| Purchase | purchase | Purchase Expense A/c |
| Bank | bank | Bank A/c |
| Cash | cash | Cash A/c |

---

## 7. Indexes Summary

| Table | Index Name | Columns | Purpose |
|-------|-----------|---------|---------|
| users | idx_users_login_id | login_id | Unique login lookup |
| users | idx_users_email | email | Unique email lookup |
| contacts | idx_contacts_email | email | Unique email lookup |
| products | idx_products_category | category_id | Category filter |
| budgets | idx_budgets_type | type | Type filter |
| budgets | idx_budgets_status | status | Status filter |
| budgets | idx_budgets_analytical | analytical_id | Analytical lookup |
| chart_of_accounts | idx_coa_type | account_type | Type filter |
| journal_entries | idx_je_entry_number | entry_number | Entry lookup |
| journal_entries | idx_je_date | accounting_date | Date range queries |
| journal_entries | idx_je_journal | journal_id | Journal filter |
| journal_entries | idx_je_status | status | Status filter |
| journal_entries | idx_je_source | source_document_type, source_document_id | Source lookup |
| journal_entry_lines | idx_jel_je | journal_entry_id | Entry lines lookup |
| journal_entry_lines | idx_jel_account | account_id | Account filter |
| journal_entry_lines | idx_jel_partner | partner_id | Partner filter |
| sales_orders | idx_so_number | so_number | SO lookup |
| sales_orders | idx_so_customer | customer_id | Customer filter |
| sales_orders | idx_so_status | status | Status filter |
| customer_invoices | idx_inv_ref | invoice_reference | Reference lookup |
| customer_invoices | idx_inv_number | invoice_number | Number lookup |
| customer_invoices | idx_inv_so | sales_order_id | SO lookup |
| customer_invoices | idx_inv_customer | customer_id | Customer filter |
| customer_invoices | idx_inv_status | status | Status filter |
| customer_invoice_lines | idx_cil_inv | invoice_id | Invoice lines lookup |
| purchase_orders | idx_po_number | po_number | PO lookup |
| purchase_orders | idx_po_vendor | vendor_id | Vendor filter |
| purchase_orders | idx_po_status | status | Status filter |
| vendor_bills | idx_bill_ref | bill_reference | Reference lookup |
| vendor_bills | idx_bill_po | purchase_order_id | PO lookup |
| vendor_bills | idx_bill_vendor | vendor_id | Vendor filter |
| vendor_bills | idx_bill_status | status | Status filter |
| vendor_bill_lines | idx_vbl_bill | vendor_bill_id | Bill lines lookup |
| payments | idx_pay_number | payment_number | Payment lookup |
| payments | idx_pay_invoice | invoice_id | Invoice payment lookup |
| payments | idx_pay_bill | vendor_bill_id | Bill payment lookup |
| payments | idx_pay_status | status | Status filter |

---

*Document generated from database design on 2026-09-05*
