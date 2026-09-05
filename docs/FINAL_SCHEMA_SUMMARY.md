# FINAL_SCHEMA_SUMMARY.md

> **Date:** 2026-09-05  
> **Source of Truth:** 14_DATABASE_SCHEMA.md  
> **Total:** 19 tables, 13 enums, 23 check constraints, 13 unique constraints, 37 indexes, 7 sequences

---

## Enums (13)

| Enum | Values | Used By |
|------|--------|---------|
| `user_role` | admin, accountant, user | users.role |
| `product_type` | goods, service, combo | products.product_type |
| `account_type` | asset, liability, bank, capital, cash, income, expense | chart_of_accounts.account_type |
| `journal_type` | sale, purchase, bank, cash | journals.journal_type |
| `budget_type` | income, expense | budgets.type |
| `budget_status` | draft, confirmed, revised, cancelled | budgets.status |
| `je_status` | draft, posted | journal_entries.status |
| `invoice_status` | draft, confirmed, paid | customer_invoices.status, vendor_bills.status |
| `payment_type` | receive, send | customer_invoices.payment_type, vendor_bills.payment_type |
| `payment_via` | bank, cash | customer_invoices.payment_via, vendor_bills.payment_via, payments.payment_via |
| `payment_status` | draft, confirmed, successful | payments.status |
| `so_status` | draft, confirmed | sales_orders.status |
| `po_status` | draft, confirmed | purchase_orders.status |

---

## Tables (19)

### 1. users

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL |
| login_id | VARCHAR(12) | NOT NULL, UNIQUE, LENGTH BETWEEN 6 AND 12 |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| role | user_role | NOT NULL, DEFAULT 'user' |
| is_active | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

### 2. contacts

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| phone | VARCHAR(50) | NULLABLE |
| image_url | TEXT | NULLABLE |
| street | VARCHAR(255) | NULLABLE |
| city | VARCHAR(100) | NULLABLE |
| state | VARCHAR(100) | NULLABLE |
| country | VARCHAR(100) | NULLABLE |
| pincode | VARCHAR(20) | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULLABLE (soft delete) |

### 3. categories

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL, UNIQUE |
| created_at | TIMESTAMPTZ | NOT NULL |

### 4. products

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| image_url | TEXT | NULLABLE |
| product_type | product_type | NOT NULL |
| category_id | UUID | FK → categories, NOT NULL |
| sales_price | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| cost | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULLABLE (soft delete) |

### 5. analyticals

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| responsible_id | UUID | FK → contacts, NOT NULL |
| start_date | DATE | NOT NULL |
| to_date | DATE | NOT NULL, ≥ start_date |
| end_date | DATE | NOT NULL, ≥ to_date |
| analytic_account | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 6. budgets

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| responsible_id | UUID | FK → contacts, NOT NULL |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL, ≥ start_date |
| type | budget_type | NOT NULL |
| analytical_id | UUID | FK → analyticals, NOT NULL |
| status | budget_status | NOT NULL, DEFAULT 'draft' |
| committed_amount | DECIMAL(15,2) | NULLABLE, ≥ 0 OR NULL |
| achieved_amount | DECIMAL(15,2) | NULLABLE, DEFAULT 0 |
| original_budget_id | UUID | FK → budgets, NULLABLE |
| is_archived | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 7. chart_of_accounts

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL, UNIQUE |
| account_type | account_type | NOT NULL |
| journal_type | VARCHAR(50) | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 8. journals

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| journal_type | journal_type | NOT NULL |
| default_account_id | UUID | FK → chart_of_accounts, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

### 9. journal_entries

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| entry_number | VARCHAR(50) | NOT NULL, UNIQUE |
| accounting_date | DATE | NOT NULL |
| journal_id | UUID | FK → journals, NOT NULL |
| source_document_type | VARCHAR(50) | NULLABLE |
| source_document_id | UUID | NULLABLE |
| status | je_status | NOT NULL, DEFAULT 'draft' |
| created_by | UUID | FK → users, NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 10. journal_entry_lines

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| journal_entry_id | UUID | FK → journal_entries, CASCADE, NOT NULL |
| account_id | UUID | FK → chart_of_accounts, NOT NULL |
| partner_id | UUID | FK → contacts, NULLABLE |
| debit | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| credit | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| created_at | TIMESTAMPTZ | NOT NULL |

CHECK: debit > 0 OR credit > 0

### 11. sales_orders

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| so_number | VARCHAR(50) | NOT NULL, UNIQUE |
| customer_id | UUID | FK → contacts, NOT NULL |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE |
| invoice_date | DATE | NOT NULL |
| due_date | DATE | NOT NULL |
| status | so_status | NOT NULL, DEFAULT 'draft' |
| total | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 12. sales_order_lines

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| sales_order_id | UUID | FK → sales_orders, CASCADE, NOT NULL |
| sr_no | INTEGER | NOT NULL |
| product_id | UUID | FK → products, NOT NULL |
| chart_of_account_id | UUID | FK → chart_of_accounts, NOT NULL |
| budget_analytic_id | UUID | FK → analyticals, NULLABLE |
| qty | DECIMAL(10,3) | NOT NULL, DEFAULT 1, > 0 |
| unit_price | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| total | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |

### 13. customer_invoices

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| invoice_reference | VARCHAR(50) | NOT NULL, UNIQUE |
| invoice_number | VARCHAR(50) | NOT NULL, UNIQUE |
| sales_order_id | UUID | FK → sales_orders, NULLABLE |
| customer_id | UUID | FK → contacts, NOT NULL |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE |
| invoice_date | DATE | NOT NULL |
| due_date | DATE | NOT NULL |
| payment_type | payment_type | NOT NULL, DEFAULT 'receive' |
| partner_id | UUID | FK → contacts, NOT NULL |
| payment_via | payment_via | NOT NULL, DEFAULT 'bank' |
| total | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |
| amount_due | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| status | invoice_status | NOT NULL, DEFAULT 'draft' |
| journal_entry_id | UUID | FK → journal_entries, NULLABLE |
| created_by | UUID | FK → users, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

CHECK: date ≤ invoice_date AND invoice_date ≤ due_date

### 14. customer_invoice_lines

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| invoice_id | UUID | FK → customer_invoices, CASCADE, NOT NULL |
| sr_no | INTEGER | NOT NULL |
| product_id | UUID | FK → products, NOT NULL |
| chart_of_account_id | UUID | FK → chart_of_accounts, NOT NULL |
| budget_analytic_id | UUID | FK → analyticals, NULLABLE |
| qty | DECIMAL(10,3) | NOT NULL, DEFAULT 1, > 0 |
| unit_price | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| total | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |

### 15. purchase_orders

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| po_number | VARCHAR(50) | NOT NULL, UNIQUE |
| vendor_id | UUID | FK → contacts, NOT NULL |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE |
| bill_date | DATE | NOT NULL |
| due_date | DATE | NOT NULL |
| status | po_status | NOT NULL, DEFAULT 'draft' |
| total | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 16. purchase_order_lines

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| purchase_order_id | UUID | FK → purchase_orders, CASCADE, NOT NULL |
| sr_no | INTEGER | NOT NULL |
| product_id | UUID | FK → products, NOT NULL |
| chart_of_account_id | UUID | FK → chart_of_accounts, NOT NULL |
| budget_analytic_id | UUID | FK → analyticals, NULLABLE |
| qty | DECIMAL(10,3) | NOT NULL, DEFAULT 1, > 0 |
| unit_price | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| total | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |

### 17. vendor_bills

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| bill_reference | VARCHAR(50) | NOT NULL, UNIQUE |
| vendor_bill_no | VARCHAR(50) | NULLABLE |
| purchase_order_id | UUID | FK → purchase_orders, NULLABLE |
| vendor_id | UUID | FK → contacts, NOT NULL |
| date | DATE | NOT NULL, DEFAULT CURRENT_DATE |
| bill_date | DATE | NOT NULL |
| due_date | DATE | NOT NULL |
| payment_type | payment_type | NOT NULL, DEFAULT 'send' |
| partner_id | UUID | FK → contacts, NOT NULL |
| payment_via | payment_via | NOT NULL, DEFAULT 'bank' |
| total | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |
| amount_due | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| status | invoice_status | NOT NULL, DEFAULT 'draft' |
| journal_entry_id | UUID | FK → journal_entries, NULLABLE |
| created_by | UUID | FK → users, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

CHECK: date ≤ bill_date AND bill_date ≤ due_date

### 18. vendor_bill_lines

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| vendor_bill_id | UUID | FK → vendor_bills, CASCADE, NOT NULL |
| sr_no | INTEGER | NOT NULL |
| product_id | UUID | FK → products, NOT NULL |
| chart_of_account_id | UUID | FK → chart_of_accounts, NOT NULL |
| budget_analytic_id | UUID | FK → analyticals, NULLABLE |
| qty | DECIMAL(10,3) | NOT NULL, DEFAULT 1, > 0 |
| unit_price | DECIMAL(15,2) | NOT NULL, DEFAULT 0, ≥ 0 |
| total | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |

### 19. payments

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| payment_number | VARCHAR(50) | NOT NULL, UNIQUE |
| invoice_id | UUID | FK → customer_invoices, NULLABLE |
| vendor_bill_id | UUID | FK → vendor_bills, NULLABLE |
| amount | DECIMAL(15,2) | NOT NULL, > 0 |
| payment_via | payment_via | NOT NULL |
| payment_date | DATE | NOT NULL, DEFAULT CURRENT_DATE |
| status | payment_status | NOT NULL, DEFAULT 'draft' |
| journal_entry_id | UUID | FK → journal_entries, NULLABLE |
| created_by | UUID | FK → users, NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

CHECK: (invoice_id IS NOT NULL AND vendor_bill_id IS NULL) OR (invoice_id IS NULL AND vendor_bill_id IS NOT NULL)

---

## Sequences (7)

| Sequence | Format | Year Reset |
|----------|--------|------------|
| so_number_seq | S{NNNNN} | No |
| po_number_seq | P{NNNNN} | No |
| invoice_number_seq | INV-{NNNNN} | No |
| invoice_reference_seq | INV/{YYYY}/{NNNN} | Yes |
| bill_reference_seq | Bill/{YYYY}/{NNNN} | Yes |
| je_entry_number_seq | JE/{YYYY}/{NNNN} | Yes |
| payment_number_seq | PAY/{YYYY}/{NNNN} | Yes |

---

## Cascade Rules

| Relationship | On Delete |
|-------------|-----------|
| journal_entry_lines.journal_entry_id | CASCADE |
| customer_invoice_lines.invoice_id | CASCADE |
| vendor_bill_lines.vendor_bill_id | CASCADE |
| sales_order_lines.sales_order_id | CASCADE |
| purchase_order_lines.purchase_order_id | CASCADE |
| All other FKs | RESTRICT |

---

*Schema verified 2026-09-05 against 14_DATABASE_SCHEMA.md*
