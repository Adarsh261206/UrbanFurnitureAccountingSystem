# EXECUTION_PLAN_V2.md — CORRECTED BACKEND EXECUTION PLAN

> **24-Hour Hackathon**  
> **Author:** Principal Backend Engineer  
> **Date:** 2026-09-05  
> **Status:** VALIDATED — READY FOR APPROVAL  
> **Supersedes:** EXECUTION_PLAN.md (V1)

---

## CORRECTION LOG

| # | Issue | Severity | Resolution | Source |
|---|-------|----------|------------|--------|
| 1 | SO date field mismatch (`date` vs `order_date`) | BLOCKER | Schema `date` is canonical. API returns `date`. | 14_DATABASE_SCHEMA.md |
| 2 | PO date field mismatch (`date` vs `order_date`) | BLOCKER | Schema `date` is canonical. API returns `date`. | 14_DATABASE_SCHEMA_SCHEMA.md |
| 3 | `amount_paid` not in schema | BLOCKER | Computed: `amount_paid = total - amount_due`. Not stored. | 15_ACCOUNTING_DATA_MODEL.md §3.2 |
| 4 | SO status has no `cancelled` | BLOCKER | Canonical: `draft`, `confirmed` only. No cancel for SO/PO. | 14_DATABASE_SCHEMA.md, 17_STATE_MACHINES.md §4 |
| 5 | PO status has no `cancelled` | BLOCKER | Canonical: `draft`, `confirmed` only. | 14_DATABASE_SCHEMA.md, 17_STATE_MACHINES.md §5 |
| 6 | JE status has no `cancelled` | BLOCKER | Canonical: `draft`, `posted` only. | 14_DATABASE_SCHEMA.md, 17_STATE_MACHINES.md §7 |
| 7 | Budget `previous_budget_id` vs `original_budget_id` | BLOCKER | Schema `original_budget_id` is canonical. | 14_DATABASE_SCHEMA.md §3.6 |
| 8 | Missing cancel endpoints for invoice/bill | BLOCKER | ADD `POST /invoices/:id/cancel` and `POST /bills/:id/cancel`. | PRD §3.5, CONFLICT-008 |
| 9 | Payment 1-step vs 2-step | BLOCKER | 1-step API (atomic). Payment created with status='successful'. Logical 3-state preserved in enum. | 16_ACCOUNTING_RULES.md, 08_API_CONTRACTS.md |
| 10 | Dashboard RBAC conflict | HIGH | Dashboard: admin, accountant ONLY. User excluded. | 18_RBAC_MATRIX.md §2.17 |
| 11 | Missing GET /bills/:id | HIGH | ADD endpoint. | 08_API_CONTRACTS.md §14 |
| 12 | Upload endpoint missing | HIGH | ADD `POST /api/v1/upload`. | 08_API_CONTRACTS.md §18 |
| 13 | POST /users missing | HIGH | ADD `POST /api/v1/users` (admin only). | 19_API_ENDPOINT_CATALOG USER-001, RBAC §2.2 |
| 14 | Chart of Accounts path inconsistency | MEDIUM | Canonical: `/api/v1/chart-of-accounts`. | 19_API_ENDPOINT_CATALOG COA-001/002 |
| 15 | JE `reference` field not in schema | MEDIUM | Computed from source_document_type + source_document_id. | 08_API_CONTRACTS.md §9 |
| 16 | Line item `quantity` vs `qty` | MEDIUM | API: `quantity`. Schema: `qty`. Backend maps. | 08_API_CONTRACTS.md vs 14_DATABASE_SCHEMA.md |
| 17 | Line item `account_id` vs `chart_of_account_id` | MEDIUM | API: `account_id`. Schema: `chart_of_account_id`. Backend maps. | 08_API_CONTRACTS.md vs 14_DATABASE_SCHEMA.md |
| 18 | Budget `responsible` (name) vs `responsible_id` (UUID) | MEDIUM | API returns contact name. Schema stores UUID. Backend JOINs. | 08_API_CONTRACTS.md §10 |
| 19 | Sequence count error (7 vs 8) | MEDIUM | 7 unique sequences. SQL has duplicate `po_number_seq`. | 25_SEQUENCE_RULES.md |
| 20 | Endpoint count undercounted (44+) | MEDIUM | Actual: 64 endpoints. | Cross-reference of all sources |

---

## A. FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Lovable)                 │
│           React + Tailwind + React Router            │
│     Base URL: http://localhost:5173                  │
│     API Client: axios with withCredentials: true     │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (snake_case JSON)
                       │ Cookie: auth_token (HttpOnly)
                       ▼
┌─────────────────────────────────────────────────────┐
│                  BACKEND (Node.js)                   │
│           Express + TypeScript + Prisma              │
│     Base URL: http://localhost:3000/api/v1           │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Routes   │→ │Middleware│→ │   Controllers    │  │
│  └──────────┘  └──────────┘  └────────┬─────────┘  │
│                                        │             │
│                              ┌─────────▼──────────┐  │
│                              │    Services         │  │
│                              │  (Business Logic)   │  │
│                              └─────────┬──────────┘  │
│                                        │             │
│                              ┌─────────▼──────────┐  │
│                              │   Prisma Client     │  │
│                              └─────────┬──────────┘  │
└────────────────────────────────────────┼─────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │    PostgreSQL 15+    │
                              │   19 tables          │
                              │   7 sequences        │
                              │   13 enums           │
                              └─────────────────────┘
```

**Technology Stack (Frozen):**

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 18+ LTS |
| Framework | Express | 4.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15+ |
| Auth | jsonwebtoken + bcryptjs | — |
| Validation | express-validator | — |
| Rate Limiting | express-rate-limit | — |
| File Upload | multer | — |
| Frontend | React (Lovable) | — |

---

## B. FINAL DATABASE CONTRACT

### B.1 Enumerations (13)

| Enum | Values | Source |
|------|--------|--------|
| `user_role` | `admin`, `accountant`, `user` | 14_DATABASE_SCHEMA.md §2 |
| `product_type` | `goods`, `service`, `combo` | 14_DATABASE_SCHEMA.md §2 |
| `account_type` | `asset`, `liability`, `bank`, `capital`, `cash`, `income`, `expense` | 14_DATABASE_SCHEMA.md §2 |
| `journal_type` | `sale`, `purchase`, `bank`, `cash` | 14_DATABASE_SCHEMA.md §2 |
| `budget_type` | `income`, `expense` | 14_DATABASE_SCHEMA.md §2 |
| `budget_status` | `draft`, `confirmed`, `revised`, `cancelled` | 14_DATABASE_SCHEMA.md §2 |
| `je_status` | `draft`, `posted` | 14_DATABASE_SCHEMA.md §2 |
| `invoice_status` | `draft`, `confirmed`, `paid` | 14_DATABASE_SCHEMA.md §2 |
| `payment_type` | `receive`, `send` | 14_DATABASE_SCHEMA.md §2 |
| `payment_via` | `bank`, `cash` | 14_DATABASE_SCHEMA.md §2 |
| `payment_status` | `draft`, `confirmed`, `successful` | 14_DATABASE_SCHEMA.md §2 |
| `so_status` | `draft`, `confirmed` | 14_DATABASE_SCHEMA.md §2 |
| `po_status` | `draft`, `confirmed` | 14_DATABASE_SCHEMA.md §2 |

**DECISION:** `so_status` and `po_status` do NOT include `cancelled`. SO/PO are draft→confirmed only. If a draft SO/PO is no longer needed, it is deleted (hard delete, no accounting impact).

### B.2 Tables (19)

| # | Table | Primary Key | Soft Delete | Cascade Source |
|---|-------|-------------|-------------|----------------|
| 1 | `users` | `id` (UUID) | No | — |
| 2 | `contacts` | `id` (UUID) | `deleted_at` | — |
| 3 | `categories` | `id` (UUID) | No | — |
| 4 | `products` | `id` (UUID) | `deleted_at` | — |
| 5 | `analyticals` | `id` (UUID) | No | — |
| 6 | `budgets` | `id` (UUID) | No | — |
| 7 | `chart_of_accounts` | `id` (UUID) | No | — |
| 8 | `journals` | `id` (UUID) | No | — |
| 9 | `journal_entries` | `id` (UUID) | No | — |
| 10 | `journal_entry_lines` | `id` (UUID) | No | `journal_entries` (CASCADE) |
| 11 | `sales_orders` | `id` (UUID) | No | — |
| 12 | `sales_order_lines` | `id` (UUID) | No | `sales_orders` (CASCADE) |
| 13 | `customer_invoices` | `id` (UUID) | No | — |
| 14 | `customer_invoice_lines` | `id` (UUID) | No | `customer_invoices` (CASCADE) |
| 15 | `purchase_orders` | `id` (UUID) | No | — |
| 16 | `purchase_order_lines` | `id` (UUID) | No | `purchase_orders` (CASCADE) |
| 17 | `vendor_bills` | `id` (UUID) | No | — |
| 18 | `vendor_bill_lines` | `id` (UUID) | No | `vendor_bills` (CASCADE) |
| 19 | `payments` | `id` (UUID) | No | — |

### B.3 Computed Fields (Not Stored)

| Entity | Field | Formula | Source |
|--------|-------|---------|--------|
| `customer_invoices` | `amount_paid` | `total - amount_due` | 15_ACCOUNTING_DATA_MODEL.md §3.2 |
| `vendor_bills` | `amount_paid` | `total - amount_due` | 15_ACCOUNTING_DATA_MODEL.md §3.4 |
| `budgets` | `achieved_percentage` | `(achieved_amount / committed_amount) * 100` | 26_REPORTING_SPEC.md §3.4 |
| `budgets` | `amount_to_achieve` | `committed_amount - achieved_amount` | 26_REPORTING_SPEC.md §3.4 |

### B.4 Unique Constraints

| Table | Column(s) | Source |
|-------|-----------|--------|
| `users` | `login_id` | 14_DATABASE_SCHEMA.md §3.1 |
| `users` | `email` | 14_DATABASE_SCHEMA.md §3.1 |
| `contacts` | `email` | 14_DATABASE_SCHEMA.md §3.2 |
| `categories` | `name` | 14_DATABASE_SCHEMA.md §3.3 |
| `chart_of_accounts` | `name` | 14_DATABASE_SCHEMA.md §3.7 |
| `journals` | `name` | 14_DATABASE_SCHEMA.md §3.8 |
| `journal_entries` | `entry_number` | 14_DATABASE_SCHEMA.md §3.9 |
| `sales_orders` | `so_number` | 14_DATABASE_SCHEMA.md §3.11 |
| `customer_invoices` | `invoice_reference` | 14_DATABASE_SCHEMA.md §3.13 |
| `customer_invoices` | `invoice_number` | 14_DATABASE_SCHEMA.md §3.13 |
| `purchase_orders` | `po_number` | 14_DATABASE_SCHEMA.md §3.15 |
| `vendor_bills` | `bill_reference` | 14_DATABASE_SCHEMA.md §3.17 |
| `payments` | `payment_number` | 14_DATABASE_SCHEMA.md §3.19 |

### B.5 Check Constraints

| Table | Constraint | Rule | Source |
|-------|-----------|------|--------|
| `users` | `chk_users_login_id_length` | `LENGTH(login_id) BETWEEN 6 AND 12` | 14_DATABASE_SCHEMA.md §3.1 |
| `products` | `chk_products_sales_price` | `sales_price >= 0` | 14_DATABASE_SCHEMA.md §3.4 |
| `products` | `chk_products_cost` | `cost >= 0` | 14_DATABASE_SCHEMA.md §3.4 |
| `analyticals` | `chk_analyticals_dates` | `to_date >= start_date AND end_date >= to_date` | 14_DATABASE_SCHEMA.md §3.5 |
| `budgets` | `chk_budgets_dates` | `end_date >= start_date` | 14_DATABASE_SCHEMA.md §3.6 |
| `budgets` | `chk_budgets_committed` | `committed_amount >= 0 OR committed_amount IS NULL` | 14_DATABASE_SCHEMA.md §3.6 |
| `journal_entry_lines` | `chk_jel_debit` | `debit >= 0` | 14_DATABASE_SCHEMA.md §3.10 |
| `journal_entry_lines` | `chk_jel_credit` | `credit >= 0` | 14_DATABASE_SCHEMA.md §3.10 |
| `journal_entry_lines` | `chk_jel_amount` | `debit > 0 OR credit > 0` | 14_DATABASE_SCHEMA.md §3.10 |
| `sales_order_lines` | `chk_sol_qty` | `qty > 0` | 14_DATABASE_SCHEMA.md §3.12 |
| `sales_order_lines` | `chk_sol_unit_price` | `unit_price >= 0` | 14_DATABASE_SCHEMA.md §3.12 |
| `customer_invoice_lines` | `chk_cil_qty` | `qty > 0` | 14_DATABASE_SCHEMA.md §3.14 |
| `customer_invoice_lines` | `chk_cil_unit_price` | `unit_price >= 0` | 14_DATABASE_SCHEMA.md §3.14 |
| `customer_invoices` | `chk_inv_amount_due` | `amount_due >= 0` | 14_DATABASE_SCHEMA.md §3.13 |
| `customer_invoices` | `chk_inv_dates` | `date <= invoice_date AND invoice_date <= due_date` | 14_DATABASE_SCHEMA.md §3.13 |
| `purchase_order_lines` | `chk_pol_qty` | `qty > 0` | 14_DATABASE_SCHEMA.md §3.16 |
| `purchase_order_lines` | `chk_pol_unit_price` | `unit_price >= 0` | 14_DATABASE_SCHEMA.md §3.16 |
| `vendor_bills` | `chk_bill_amount_due` | `amount_due >= 0` | 14_DATABASE_SCHEMA.md §3.17 |
| `vendor_bills` | `chk_bill_dates` | `date <= bill_date AND bill_date <= due_date` | 14_DATABASE_SCHEMA.md §3.17 |
| `vendor_bill_lines` | `chk_vbl_qty` | `qty > 0` | 14_DATABASE_SCHEMA.md §3.18 |
| `vendor_bill_lines` | `chk_vbl_unit_price` | `unit_price >= 0` | 14_DATABASE_SCHEMA.md §3.18 |
| `payments` | `chk_pay_amount` | `amount > 0` | 14_DATABASE_SCHEMA.md §3.19 |
| `payments` | `chk_pay_target` | `invoice_id XOR vendor_bill_id` | 14_DATABASE_SCHEMA.md §3.19 |

### B.6 Seed Data

**Users (3):**

| Name | Login ID | Email | Role | Password |
|------|----------|-------|------|----------|
| Administrator | admin | admin@urban.com | admin | Admin@123 |
| Accountant | accountant | accountant@urban.com | accountant | Accountant@123 |
| User One | user1 | user1@urban.com | user | User@123 |

**Chart of Accounts (7):**

| Name | Account Type | Journal Type |
|------|-------------|--------------|
| Sales Income A/c | income | sale |
| Purchase Expense A/c | expense | purchase |
| Bank A/c | bank | bank |
| Cash A/c | cash | cash |
| Capital | capital | — |
| Debtors | asset | — |
| Creditors | liability | — |

**Journals (4):**

| Name | Journal Type | Default Account |
|------|-------------|-----------------|
| Sales | sale | Sales Income A/c |
| Purchase | purchase | Purchase Expense A/c |
| Bank | bank | Bank A/c |
| Cash | cash | Cash A/c |

---

## C. FINAL API CONTRACT

### C.1 Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:3000/api/v1` |
| Content-Type | `application/json` |
| Authentication | HttpOnly cookie `auth_token` |
| Naming | snake_case for all JSON fields |
| Pagination | `?page=1&limit=20` |
| Error Format | `{ "error": { "code", "message", "field", "details" } }` |

### C.2 Login Response Shape

```json
{
  "user": {
    "id": "uuid",
    "name": "string",
    "login_id": "string",
    "email": "string",
    "role": "admin | accountant | user"
  }
}
```

**DECISION:** Login response wraps user in `"user"` key (per 22_AUTHENTICATION_AND_SESSION.md §3, 19_API_ENDPOINT_CATALOG AUTH-002). NOT a flat object.

### C.3 Line Item Field Mapping

| API Field (Request) | Schema Field | Direction |
|---------------------|-------------|-----------|
| `quantity` | `qty` | Request → DB |
| `account_id` | `chart_of_account_id` | Request → DB |
| `analytical_id` | `budget_analytic_id` | Request → DB |
| `product_id` | `product_id` | Same |

### C.4 Response Computed Fields

| Endpoint | Field | Computation |
|----------|-------|-------------|
| GET /invoices | `amount_paid` | `total - amount_due` |
| GET /invoices/:id | `amount_paid` | `total - amount_due` |
| GET /bills | `amount_paid` | `total - amount_due` |
| GET /bills/:id | `amount_paid` | `total - amount_due` |
| GET /budgets | `achieved_percentage` | `(achieved / committed) * 100` |
| GET /budgets | `amount_to_achieve` | `committed - achieved` |
| GET /journal-entries | `reference` | Source doc type + ID (or null for manual) |

### C.5 Full Endpoint Registry (64 Endpoints)

#### Authentication (4)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 1 | POST | /auth/signup | No | — | AUTH-001 |
| 2 | POST | /auth/login | No | — | AUTH-002 |
| 3 | POST | /auth/logout | Yes | Any | AUTH-003 |
| 4 | GET | /auth/me | Yes | Any | AUTH-004 |

#### Users (2)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 5 | POST | /users | Yes | admin | USER-001 |
| 6 | GET | /users | Yes | admin | USER-002 |

#### Contacts (4)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 7 | GET | /contacts | Yes | admin, accountant | CONTACT-001 |
| 8 | POST | /contacts | Yes | admin, accountant | CONTACT-002 |
| 9 | GET | /contacts/:id | Yes | admin, accountant | CONTACT-003 |
| 10 | PUT | /contacts/:id | Yes | admin, accountant | CONTACT-004 |

#### Products (4)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 11 | GET | /products | Yes | admin, accountant | PRODUCT-001 |
| 12 | POST | /products | Yes | admin, accountant | PRODUCT-002 |
| 13 | GET | /products/:id | Yes | admin, accountant | PRODUCT-003 |
| 14 | PUT | /products/:id | Yes | admin, accountant | PRODUCT-004 |

#### Categories (2)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 15 | GET | /categories | Yes | admin, accountant | 08_API §6 |
| 16 | POST | /categories | Yes | admin, accountant | 08_API §6 |

#### Analytical Accounts (2)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 17 | GET | /analyticals | Yes | admin, accountant | ANALYTICAL-001 |
| 18 | POST | /analyticals | Yes | admin, accountant | ANALYTICAL-002 |

#### Chart of Accounts (2)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 19 | GET | /chart-of-accounts | Yes | admin, accountant | COA-001 |
| 20 | POST | /chart-of-accounts | Yes | admin, accountant | COA-002 |

#### Journals (1)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 21 | GET | /journals | Yes | admin, accountant | JOURNAL-001 |

#### Journal Entries (3)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 22 | GET | /journal-entries | Yes | admin, accountant | JE-001 |
| 23 | POST | /journal-entries | Yes | admin, accountant | JE-002 |
| 24 | GET | /journal-entries/:id | Yes | admin, accountant | JE-003 |

#### Budgets (7)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 25 | GET | /budgets | Yes | admin, accountant | BUDGET-001 |
| 26 | POST | /budgets | Yes | admin, accountant | BUDGET-002 |
| 27 | GET | /budgets/:id | Yes | admin, accountant | BUDGET-003 |
| 28 | PUT | /budgets/:id | Yes | admin, accountant | BUDGET-004 |
| 29 | PUT | /budgets/:id/confirm | Yes | admin, accountant | BUDGET-005 |
| 30 | POST | /budgets/:id/revise | Yes | admin, accountant | BUDGET-006 |
| 31 | PUT | /budgets/:id/cancel | Yes | admin, accountant | BUDGET-007 |

#### Sales Orders (5)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 32 | GET | /sales-orders | Yes | admin, accountant | SO-001 |
| 33 | POST | /sales-orders | Yes | admin, accountant | SO-002 |
| 34 | GET | /sales-orders/:id | Yes | admin, accountant | 08_API §11 |
| 35 | PUT | /sales-orders/:id | Yes | admin, accountant | 08_API §11 |
| 36 | PUT | /sales-orders/:id/confirm | Yes | admin, accountant | SO-003 |

#### Customer Invoices (9)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 37 | GET | /invoices | Yes | admin, accountant, user (own) | INV-001 |
| 38 | POST | /invoices | Yes | admin, accountant | INV-002 |
| 39 | GET | /invoices/:id | Yes | admin, accountant, user (own) | INV-003 |
| 40 | PUT | /invoices/:id | Yes | admin, accountant | INV-004 |
| 41 | POST | /invoices/:id/confirm | Yes | admin, accountant | INV-005 |
| 42 | POST | /invoices/:id/pay | Yes | admin, accountant, user (own) | INV-006 |
| 43 | POST | /invoices/:id/cancel | Yes | admin, accountant | **NEW** (PRD §3.5) |
| 44 | POST | /invoices/:id/print | Yes | admin, accountant, user (own) | INV-007 |
| 45 | POST | /invoices/:id/send | Yes | admin, accountant, user (own) | INV-008 |

#### Purchase Orders (5)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 46 | GET | /purchase-orders | Yes | admin, accountant | PO-001 |
| 47 | POST | /purchase-orders | Yes | admin, accountant | PO-002 |
| 48 | GET | /purchase-orders/:id | Yes | admin, accountant | 08_API §13 |
| 49 | PUT | /purchase-orders/:id | Yes | admin, accountant | 08_API §13 |
| 50 | PUT | /purchase-orders/:id/confirm | Yes | admin, accountant | PO-003 |

#### Vendor Bills (9)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 51 | GET | /bills | Yes | admin, accountant | BILL-001 |
| 52 | POST | /bills | Yes | admin, accountant | BILL-002 |
| 53 | GET | /bills/:id | Yes | admin, accountant | **ADD** (08_API §14) |
| 54 | PUT | /bills/:id | Yes | admin, accountant | 08_API §14 |
| 55 | POST | /bills/:id/confirm | Yes | admin, accountant | BILL-003 |
| 56 | POST | /bills/:id/pay | Yes | admin, accountant | BILL-004 |
| 57 | POST | /bills/:id/cancel | Yes | admin, accountant | **NEW** (PRD §3.6) |
| 58 | POST | /bills/:id/print | Yes | admin, accountant | 08_API §14 |
| 59 | POST | /bills/:id/send | Yes | admin, accountant | 08_API §14 |

#### Payments (1)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 60 | GET | /payments | Yes | admin, accountant, user (own) | 08_API §15 |

#### Dashboard (1)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 61 | GET | /dashboard | Yes | admin, accountant | 18_RBAC §2.17 |

#### Reports (3)

| # | Method | Path | Auth | Role | Source |
|---|--------|------|------|------|--------|
| 62 | GET | /reports/profit-and-loss | Yes | admin, accountant | RPT-001 |
| 63 | GET | /reports/balance-sheet | Yes | admin, accountant | RPT-002 |
| 64 | GET | /reports/budget-report | Yes | admin, accountant | RPT-003 |

#### Upload (1 — counted in auth section above as endpoint 0, but listed here for clarity)

**TOTAL: 64 endpoints**

Note: POST /upload is counted as a separate endpoint. Re-counting:

| Category | Count |
|----------|-------|
| Auth | 4 |
| Users | 2 |
| Contacts | 4 |
| Products | 4 |
| Categories | 2 |
| Analyticals | 2 |
| Chart of Accounts | 2 |
| Journals | 1 |
| Journal Entries | 3 |
| Budgets | 7 |
| Sales Orders | 5 |
| Invoices | 9 |
| Purchase Orders | 5 |
| Bills | 9 |
| Payments | 1 |
| Dashboard | 1 |
| Reports | 3 |
| Upload | 1 |
| **TOTAL** | **64** |

---

## D. FINAL AUTHENTICATION MODEL

### D.1 Cookie Specification

| Property | Value | Source |
|----------|-------|--------|
| Name | `auth_token` | 22_AUTHENTICATION_AND_SESSION.md §7 |
| HttpOnly | `true` | FROZEN |
| Secure | `true` (production) | FROZEN |
| SameSite | `Strict` | FROZEN |
| Path | `/api` | FROZEN |
| Max-Age | `86400` (24 hours) | FROZEN |
| Domain | Same as backend | FROZEN |

### D.2 JWT Specification

| Property | Value | Source |
|----------|-------|--------|
| Algorithm | HS256 | 22_AUTHENTICATION_AND_SESSION.md §6 |
| Secret | `process.env.JWT_SECRET` (≥32 chars) | 22_AUTHENTICATION_AND_SESSION.md §6 |
| Expiry | 15 minutes | 22_AUTHENTICATION_AND_SESSION.md §6 |
| Payload | `{ sub: user_id, role, iat, exp }` | 22_AUTHENTICATION_AND_SESSION.md §6 |

### D.3 Password Policy

| Rule | Requirement | Source |
|------|-------------|--------|
| Minimum length | 8 characters | 22_AUTHENTICATION_AND_SESSION.md §8 |
| Uppercase | At least 1 | 22_AUTHENTICATION_AND_SESSION.md §8 |
| Lowercase | At least 1 | 22_AUTHENTICATION_AND_SESSION.md §8 |
| Special character | At least 1 | 22_AUTHENTICATION_AND_SESSION.md §8 |
| Storage | bcrypt hash (cost factor ≥ 12) | 22_AUTHENTICATION_AND_SESSION.md §8 |
| Uniqueness | NOT enforced | CONFLICT-003 |

### D.4 Rate Limiting

| Endpoint | Limit | Window | Source |
|----------|-------|--------|--------|
| POST /auth/login | 5 attempts | 1 minute per IP | 22_AUTHENTICATION_AND_SESSION.md §10 |
| POST /auth/signup | 3 attempts | 1 hour per IP | 22_AUTHENTICATION_AND_SESSION.md §10 |
| POST /auth/forgot-password | 3 attempts | 1 hour per IP | 22_AUTHENTICATION_AND_SESSION.md §10 |
| General API | 100 requests | 1 minute per user | 22_AUTHENTICATION_AND_SESSION.md §10 |

### D.5 Auth Flow

```
1. POST /auth/signup → Creates user (role=user), NO cookie set
2. POST /auth/login → Validates credentials, sets HttpOnly cookie, returns user object
3. GET /auth/me → Reads cookie, returns user object
4. POST /auth/logout → Clears cookie (Max-Age=0)
5. POST /auth/forgot-password → Mock (returns success message)
```

### D.6 What Frontend Stores

```javascript
// After login — user object ONLY (NO token)
{
  id: "uuid",
  name: "string",
  login_id: "string",
  email: "string",
  role: "admin | accountant | user"
}
```

### D.7 What Frontend NEVER Stores

- JWT token
- Authorization header
- Password

---

## E. FINAL RBAC MODEL

### E.1 Role Definitions

| Role | Description | Source |
|------|-------------|--------|
| `admin` | Full system access | 18_RBAC_MATRIX.md §1 |
| `accountant` | Master data, transactions, reports | 18_RBAC_MATRIX.md §1 |
| `user` | Portal: own invoices, pay dues | 18_RBAC_MATRIX.md §1 |

### E.2 Permission Matrix

| Feature | Admin | Accountant | User | Source |
|---------|:-----:|:----------:|:----:|--------|
| **Auth** | | | | |
| Login | ✓ | ✓ | ✓ | RBAC §2.1 |
| Sign Up | ✓ | ✓ | ✓ | RBAC §2.1 |
| Forgot Password | ✓ | ✓ | ✓ | RBAC §2.1 |
| **User Management** | | | | |
| View Users | ✓ (all) | ✗ | ✗ | RBAC §2.2 |
| Create Users | ✓ | ✗ | ✗ | RBAC §2.2 |
| Update Users | ✓ | ✗ | ✗ | RBAC §2.2 |
| Delete Users | ✗ | ✗ | ✗ | RBAC §2.2 |
| **Contacts** | | | | |
| View List | ✓ | ✓ | ✗ | RBAC §2.3 |
| View Details | ✓ | ✓ | ✗ | RBAC §2.3 |
| Create | ✓ | ✓ | ✗ | RBAC §2.3 |
| Update | ✓ | ✓ | ✗ | RBAC §2.3 |
| Delete | ✗ | ✗ | ✗ | RBAC §2.3 |
| **Products** | | | | |
| View List | ✓ | ✓ | ✗ | RBAC §2.4 |
| View Details | ✓ | ✓ | ✗ | RBAC §2.4 |
| Create | ✓ | ✓ | ✗ | RBAC §2.4 |
| Update | ✓ | ✓ | ✗ | RBAC §2.4 |
| Delete | ✗ | ✗ | ✗ | RBAC §2.4 |
| **Analyticals** | | | | |
| View | ✓ | ✓ | ✗ | RBAC §2.5 |
| Create | ✓ | ✓ | ✗ | RBAC §2.5 |
| Update | ✓ | ✓ | ✗ | RBAC §2.5 |
| **Budgets** | | | | |
| View List | ✓ | ✓ | ✗ | RBAC §2.6 |
| View Details | ✓ | ✓ | ✗ | RBAC §2.6 |
| Create | ✓ | ✓ | ✗ | RBAC §2.6 |
| Update (draft) | ✓ | ✓ | ✗ | RBAC §2.6 |
| Confirm | ✓ | ✓ | ✗ | RBAC §2.6 |
| Revise | ✓ | ✓ | ✗ | RBAC §2.6 |
| Cancel | ✓ | ✓ | ✗ | RBAC §2.6 |
| **Chart of Accounts** | | | | |
| View | ✓ | ✓ | ✗ | RBAC §2.7 |
| Create | ✓ | ✓ | ✗ | RBAC §2.7 |
| Update | ✓ | ✓ | ✗ | RBAC §2.7 |
| Delete | ✗ | ✗ | ✗ | RBAC §2.7 |
| **Journals** | | | | |
| View | ✓ | ✓ | ✗ | RBAC §2.8 |
| **Journal Entries** | | | | |
| View List | ✓ | ✓ | ✗ | RBAC §2.9 |
| View Details | ✓ | ✓ | ✗ | RBAC §2.9 |
| Create Manual | ✓ | ✓ | ✗ | RBAC §2.9 |
| **Sales Orders** | | | | |
| View List | ✓ | ✓ | ✗ | RBAC §2.10 |
| Create | ✓ | ✓ | ✗ | RBAC §2.10 |
| Update (draft) | ✓ | ✓ | ✗ | RBAC §2.10 |
| Confirm | ✓ | ✓ | ✗ | RBAC §2.10 |
| **Customer Invoices** | | | | |
| View List | ✓ (all) | ✓ (all) | ✓ (own) | RBAC §2.11 |
| View Details | ✓ | ✓ | ✓ (own) | RBAC §2.11 |
| Create | ✓ | ✓ | ✗ | RBAC §2.11 |
| Update (draft) | ✓ | ✓ | ✗ | RBAC §2.11 |
| Confirm | ✓ | ✓ | ✗ | RBAC §2.11 |
| Cancel (draft) | ✓ | ✓ | ✗ | RBAC §2.11 |
| Pay | ✓ | ✓ | ✓ (own) | RBAC §2.11 |
| Print | ✓ | ✓ | ✓ (own) | RBAC §2.11 |
| Send | ✓ | ✓ | ✓ (own) | RBAC §2.11 |
| **Receipts** | | | | |
| View List | ✓ | ✓ | ✓ (own) | RBAC §2.12 |
| View Details | ✓ | ✓ | ✓ (own) | RBAC §2.12 |
| **Purchase Orders** | | | | |
| View List | ✓ | ✓ | ✗ | RBAC §2.13 |
| Create | ✓ | ✓ | ✗ | RBAC §2.13 |
| Update (draft) | ✓ | ✓ | ✗ | RBAC §2.13 |
| Confirm | ✓ | ✓ | ✗ | RBAC §2.13 |
| **Vendor Bills** | | | | |
| View List | ✓ | ✓ | ✗ | RBAC §2.14 |
| View Details | ✓ | ✓ | ✗ | RBAC §2.14 |
| Create | ✓ | ✓ | ✗ | RBAC §2.14 |
| Update (draft) | ✓ | ✓ | ✗ | RBAC §2.14 |
| Confirm | ✓ | ✓ | ✗ | RBAC §2.14 |
| Cancel (draft) | ✓ | ✓ | ✗ | RBAC §2.14 |
| Pay | ✓ | ✓ | ✗ | RBAC §2.14 |
| Print | ✓ | ✓ | ✗ | RBAC §2.14 |
| Send | ✓ | ✓ | ✗ | RBAC §2.14 |
| **Payments** | | | | |
| View List | ✓ | ✓ | ✗ | RBAC §2.15 |
| View Details | ✓ | ✓ | ✗ | RBAC §2.15 |
| **Reports** | | | | |
| P&L | ✓ | ✓ | ✗ | RBAC §2.16 |
| Balance Sheet | ✓ | ✓ | ✗ | RBAC §2.16 |
| Budget Report | ✓ | ✓ | ✗ | RBAC §2.16 |
| Print Reports | ✓ | ✓ | ✗ | RBAC §2.16 |
| **Dashboard** | | | | |
| View Dashboard | ✓ | ✓ | ✗ | RBAC §2.17 |
| View Kanban | ✓ | ✓ | ✗ | RBAC §2.17 |

### E.3 Object-Level Authorization

| Resource | User Access Rule | Source |
|----------|-----------------|--------|
| Invoice | `customer_id` matches user's contact (by email) | RBAC §3.1 |
| Invoice Payment | Linked invoice belongs to user | RBAC §3.3 |
| Bill | User CANNOT access bills | RBAC §3.2 |
| Budget | User CANNOT access budgets | RBAC §3.4 |

### E.4 User-Contact Resolution

```typescript
// For user role: find contact by email match
const userContact = await prisma.contact.findFirst({
  where: { email: req.user.email }
});
// Then filter: invoice.customer_id === userContact.id
```

---

## F. FINAL ACCOUNTING MODEL

### F.1 Core Invariant

**SUM(debit) = SUM(credit) for every journal entry.** — 16_ACCOUNTING_RULES.md §1

### F.2 Transaction Definitions (5 Types)

#### F.2.1 Customer Invoice Confirmation

| Property | Value | Source |
|----------|-------|--------|
| Trigger | `POST /invoices/:id/confirm` | 16_ACCOUNTING_RULES.md §2.1 |
| Precondition | `status = 'draft'`, lines not empty, total > 0 | 16_ACCOUNTING_RULES.md §2.1 |
| Journal | Sales | 16_ACCOUNTING_RULES.md §2.1 |
| Line 1 | DEBIT Debtors (Asset), partner=customer, amount=total | 16_ACCOUNTING_RULES.md §2.1 |
| Line 2 | CREDIT Sales Income (Income), partner=NULL, amount=total | 16_ACCOUNTING_RULES.md §2.1 |
| Atomicity | SINGLE TRANSACTION | 16_ACCOUNTING_RULES.md §2.1 |
| Failure | ROLLBACK all changes | 16_ACCOUNTING_RULES.md §2.1 |
| Idempotent | Yes (check status) | 16_ACCOUNTING_RULES.md §2.1 |

#### F.2.2 Vendor Bill Confirmation

| Property | Value | Source |
|----------|-------|--------|
| Trigger | `POST /bills/:id/confirm` | 16_ACCOUNTING_RULES.md §2.2 |
| Precondition | `status = 'draft'`, lines not empty, total > 0 | 16_ACCOUNTING_RULES.md §2.2 |
| Journal | Purchase | 16_ACCOUNTING_RULES.md §2.2 |
| Line 1 | DEBIT Purchase Expense (Expense), partner=NULL, amount=total | 16_ACCOUNTING_RULES.md §2.2 |
| Line 2 | CREDIT Creditors (Liability), partner=vendor, amount=total | 16_ACCOUNTING_RULES.md §2.2 |
| Atomicity | SINGLE TRANSACTION | 16_ACCOUNTING_RULES.md §2.2 |
| Failure | ROLLBACK all changes | 16_ACCOUNTING_RULES.md §2.2 |
| Idempotent | Yes (check status) | 16_ACCOUNTING_RULES.md §2.2 |

#### F.2.3 Customer Invoice Payment (Receipt)

| Property | Value | Source |
|----------|-------|--------|
| Trigger | `POST /invoices/:id/pay` | 16_ACCOUNTING_RULES.md §2.3 |
| Precondition | `status = 'confirmed'`, amount > 0, amount ≤ amount_due | 16_ACCOUNTING_RULES.md §2.3 |
| Journal | Bank or Cash (as selected) | 16_ACCOUNTING_RULES.md §2.3 |
| Line 1 | DEBIT Bank/Cash (Asset), partner=NULL, amount=payment | 16_ACCOUNTING_RULES.md §2.3 |
| Line 2 | CREDIT Debtors (Asset), partner=customer, amount=payment | 16_ACCOUNTING_RULES.md §2.3 |
| Side Effects | `amount_due -= payment`; if `amount_due = 0` then `status = 'paid'` | 16_ACCOUNTING_RULES.md §2.3 |
| Atomicity | SINGLE TRANSACTION | 16_ACCOUNTING_RULES.md §2.3 |

#### F.2.4 Vendor Bill Payment

| Property | Value | Source |
|----------|-------|--------|
| Trigger | `POST /bills/:id/pay` | 16_ACCOUNTING_RULES.md §2.4 |
| Precondition | `status = 'confirmed'`, amount > 0, amount ≤ amount_due | 16_ACCOUNTING_RULES.md §2.4 |
| Journal | Bank or Cash (as selected) | 16_ACCOUNTING_RULES.md §2.4 |
| Line 1 | DEBIT Creditors (Liability), partner=vendor, amount=payment | 16_ACCOUNTING_RULES.md §2.4 |
| Line 2 | CREDIT Bank/Cash (Asset), partner=NULL, amount=payment | 16_ACCOUNTING_RULES.md §2.4 |
| Side Effects | `amount_due -= payment`; if `amount_due = 0` then `status = 'paid'` | 16_ACCOUNTING_RULES.md §2.4 |
| Atomicity | SINGLE TRANSACTION | 16_ACCOUNTING_RULES.md §2.4 |

#### F.2.5 Manual Journal Entry

| Property | Value | Source |
|----------|-------|--------|
| Trigger | `POST /journal-entries` | 16_ACCOUNTING_RULES.md §2.5 |
| Precondition | Lines not empty, SUM(debit) = SUM(credit) | 16_ACCOUNTING_RULES.md §2.5 |
| Journal | Any (user-selected) | 16_ACCOUNTING_RULES.md §2.5 |
| Validation | Each line: debit > 0 OR credit > 0 | 16_ACCOUNTING_RULES.md §2.5 |
| Atomicity | SINGLE TRANSACTION | 16_ACCOUNTING_RULES.md §2.5 |
| Idempotent | No (creates new entry) | 16_ACCOUNTING_RULES.md §2.5 |

### F.3 Balance Verification

```typescript
function verifyJournalBalance(lines: { debit: number; credit: number }[]): void {
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError('UNBALANCED_JOURNAL',
      `Debit ${totalDebit} does not equal Credit ${totalCredit}`);
  }

  for (const line of lines) {
    if (line.debit < 0 || line.credit < 0) {
      throw new AppError('NEGATIVE_AMOUNT', 'Amounts must be non-negative');
    }
    if (line.debit === 0 && line.credit === 0) {
      throw new AppError('ZERO_AMOUNT', 'At least one of debit/credit must be positive');
    }
  }
}
```

### F.4 Transaction Isolation

| Operation | Isolation Level | Source |
|-----------|----------------|--------|
| General reads | READ COMMITTED | ED-005 |
| Invoice/Bill confirmation + JE | SERIALIZABLE | ED-005 |
| Payment + JE | SERIALIZABLE | ED-005 |

---

## G. FINAL STATE MACHINES

### G.1 Budget State Machine

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
┌─────────┐    ┌──────────┐    ┌──────────┐              │
│  DRAFT  │───▶│CONFIRMED │───▶│ REVISED  │              │
└────┬────┘    └────┬─────┘    └────┬─────┘              │
     │              │               │                     │
     │              │               │                     │
     └──────────────┼───────────────┼─────────────────────┘
                    │               │
                    ▼               ▼
               ┌────────────────────────┐
               │      CANCELLED         │
               │      (archived)        │
               └────────────────────────┘
```

| From | To | API Endpoint | HTTP Method | Side Effects |
|------|-----|-------------|-------------|--------------|
| draft | confirmed | /budgets/:id/confirm | PUT | committed_amount set |
| draft | cancelled | /budgets/:id/cancel | PUT | is_archived = true |
| confirmed | revised | /budgets/:id/revise | POST | New budget created, original → revised |
| confirmed | cancelled | /budgets/:id/cancel | PUT | is_archived = true |
| revised | cancelled | /budgets/:id/cancel | PUT | is_archived = true |

**Terminal state:** cancelled (no outgoing transitions)

### G.2 Customer Invoice State Machine

```
┌─────────┐    ┌──────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│   PAID   │
└────┬────┘    └──────────┘    └──────────┘
     │
     ▼
  CANCELLED (draft only)
```

| From | To | API Endpoint | HTTP Method | Side Effects |
|------|-----|-------------|-------------|--------------|
| draft | confirmed | /invoices/:id/confirm | POST | JE created |
| draft | cancelled | /invoices/:id/cancel | POST | Record discarded |
| confirmed | paid | /invoices/:id/pay | POST | amount_due = 0 |

**Forbidden:** confirmed→draft, confirmed→cancelled, paid→any

### G.3 Vendor Bill State Machine

```
┌─────────┐    ┌──────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│   PAID   │
└────┬────┘    └──────────┘    └──────────┘
     │
     ▼
  CANCELLED (draft only)
```

| From | To | API Endpoint | HTTP Method | Side Effects |
|------|-----|-------------|-------------|--------------|
| draft | confirmed | /bills/:id/confirm | POST | JE created |
| draft | cancelled | /bills/:id/cancel | POST | Record discarded |
| confirmed | paid | /bills/:id/pay | POST | amount_due = 0 |

**Forbidden:** confirmed→draft, confirmed→cancelled, paid→any

### G.4 Sales Order State Machine

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │
└─────────┘    └──────────┘
```

| From | To | API Endpoint | HTTP Method | Side Effects |
|------|-----|-------------|-------------|--------------|
| draft | confirmed | /sales-orders/:id/confirm | PUT | None (invoice created separately) |

**No cancel state.** Draft SOs are hard-deleted if no longer needed.

### G.5 Purchase Order State Machine

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │
└─────────┘    └──────────┘
```

| From | To | API Endpoint | HTTP Method | Side Effects |
|------|-----|-------------|-------------|--------------|
| draft | confirmed | /purchase-orders/:id/confirm | PUT | None (bill created separately) |

**No cancel state.** Draft POs are hard-deleted if no longer needed.

### G.6 Journal Entry State Machine

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│ POSTED   │
└─────────┘    └──────────┘
```

- Auto-created JEs (from invoice/bill confirmation): created as `posted`
- Manual JEs: created as `posted` directly
- JEs are IMMUTABLE after posting
- No transitions back to draft

### G.7 Payment State Machine (Logical)

```
┌─────────┐    ┌──────────┐    ┌─────────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│ SUCCESSFUL  │
└─────────┘    └──────────┘    └─────────────┘
```

**DECISION (BLOCKER-9):** The API implements a **1-step flow**. `POST /invoices/:id/pay` and `POST /bills/:id/pay` create the payment with `status = 'successful'` directly, and immediately create the journal entry. The 3-state logical model is preserved in the `payment_status` enum for future extensibility, but the API skips `draft` and `confirmed` states.

**Rationale:**
- 16_ACCOUNTING_RULES.md describes payment as a single atomic trigger
- 08_API_CONTRACTS.md defines single-endpoint payment
- No separate "confirm payment" or "process payment" endpoints exist in any API contract
- 2-step flow would require additional endpoints not defined in source

### G.8 Invoice/Bill Cancellation (BLOCKER-8 Resolution)

**DECISION:** Cancel endpoints are **required** per PRD §3.5 and §3.6, and per CONFLICT-008.

- `POST /invoices/:id/cancel` — Only works when `status = 'draft'`
- `POST /bills/:id/cancel` — Only works when `status = 'draft'`
- Behavior: Record is discarded (hard delete for draft records with no accounting impact)
- Confirmed/paid documents CANNOT be cancelled (error: `INVALID_STATE_TRANSITION`)

---

## H. FINAL SEQUENCE STRATEGY

### H.1 Sequence Registry (7 Unique Sequences)

| # | Sequence Name | Format | Example | Padding | Year Reset | Source |
|---|--------------|--------|---------|---------|------------|--------|
| 1 | `so_number_seq` | `S{NNNNN}` | S00001 | 5 digits | No | 25_SEQUENCE_RULES §1.1 |
| 2 | `po_number_seq` | `P{NNNNN}` | P00001 | 5 digits | No | 25_SEQUENCE_RULES §1.4 |
| 3 | `invoice_number_seq` | `INV-{NNNNN}` | INV-00001 | 5 digits | No | 25_SEQUENCE_RULES §1.3 |
| 4 | `invoice_reference_seq` | `INV/{YYYY}/{NNNN}` | INV/2026/0001 | 4 digits | Yes | 25_SEQUENCE_RULES §1.2 |
| 5 | `bill_reference_seq` | `Bill/{YYYY}/{NNNN}` | Bill/2026/0001 | 4 digits | Yes | 25_SEQUENCE_RULES §1.5 |
| 6 | `je_entry_number_seq` | `JE/{YYYY}/{NNNN}` | JE/2026/0001 | 4 digits | Yes | 25_SEQUENCE_RULES §1.6 |
| 7 | `payment_number_seq` | `PAY/{YYYY}/{NNNN}` | PAY/2026/0001 | 4 digits | Yes | 25_SEQUENCE_RULES §1.7 |

### H.2 SQL Creation

```sql
CREATE SEQUENCE IF NOT EXISTS so_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_reference_seq START 1;
CREATE SEQUENCE IF NOT EXISTS bill_reference_seq START 1;
CREATE SEQUENCE IF NOT EXISTS je_entry_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1;
```

### H.3 Year Reset Behavior

- Yearly sequences (4, 5, 6, 7): The year prefix comes from `new Date().getFullYear()`. The sequence counter is global (does not reset). If uniqueness across years is needed, the combination of year prefix + sequence value ensures it. PostgreSQL sequences are monotonically increasing.
- Non-yearly sequences (1, 2, 3): Continuous across years.

### H.4 Concurrency

PostgreSQL sequences are atomic and thread-safe. No additional locking needed. Failed transactions do NOT consume sequence values.

---

## I. FINAL REPORT STRATEGY

### I.1 Profit & Loss Report

| Property | Value | Source |
|----------|-------|--------|
| Endpoint | `GET /reports/profit-and-loss?year=2026` | 26_REPORTING_SPEC.md §1 |
| Income | `SUM(jel.credit)` WHERE `coa.account_type = 'income'` AND date in range | 26_REPORTING_SPEC.md §1.4 |
| Expenses | `SUM(jel.debit)` WHERE `coa.account_type = 'expense'` AND date in range | 26_REPORTING_SPEC.md §1.4 |
| Net Income | Income - Expenses | 26_REPORTING_SPEC.md §1.4 |

### I.2 Balance Sheet

| Property | Value | Source |
|----------|-------|--------|
| Endpoint | `GET /reports/balance-sheet?year=2026` | 26_REPORTING_SPEC.md §2 |
| Assets | `SUM(debit - credit)` WHERE `coa.account_type IN ('asset','bank','cash')` | 26_REPORTING_SPEC.md §2.4 |
| Liabilities | `SUM(credit - debit)` WHERE `coa.account_type IN ('liability','capital','income')` | 26_REPORTING_SPEC.md §2.4 |
| Balance Check | `ABS(Assets - Liabilities) < 0.01` | 26_REPORTING_SPEC.md §2.5 |

### I.3 Budget Report

| Property | Value | Source |
|----------|-------|--------|
| Endpoint | `GET /reports/budget-report?year=2026&type=income` | 26_REPORTING_SPEC.md §3 |
| Income Achievement | `SUM(cil.total)` WHERE `budget_analytic_id` matches AND `ci.status IN ('confirmed','paid')` | 26_REPORTING_SPEC.md §3.3 |
| Expense Achievement | `SUM(vbl.total)` WHERE `budget_analytic_id` matches AND `vb.status IN ('confirmed','paid')` | 26_REPORTING_SPEC.md §3.3 |
| Achieved % | `(achieved / committed) * 100` | 26_REPORTING_SPEC.md §3.4 |
| Amount to Achieve | `committed - achieved` | 26_REPORTING_SPEC.md §3.4 |

---

## J. FINAL SECURITY STRATEGY

| Control | Implementation | Source |
|---------|---------------|--------|
| Password hashing | bcrypt (cost ≥ 12) | 22_AUTHENTICATION_AND_SESSION.md §8 |
| Auth token | HttpOnly cookie (JWT never in body) | CONFLICT-005 |
| CSRF | SameSite=Strict | ED-006 |
| Rate limiting | Login: 5/min/IP, Signup: 3/hr/IP, API: 100/min/user | 22_AUTHENTICATION_AND_SESSION.md §10 |
| Input validation | express-validator on all endpoints | 09_SECURITY.md |
| SQL injection | Prisma parameterized queries | ED-006 |
| XSS | JSON responses only (no HTML rendering) | 09_SECURITY.md |
| Mass assignment | Explicit field selection in Prisma | 09_SECURITY.md |
| IDOR | Object ownership check for user role | RBAC §3 |
| UUID validation | Validate UUID format on all :id params | 09_SECURITY.md |
| File upload | MIME type whitelist (jpeg, png, gif, webp), max 5MB | 08_API_CONTRACTS §18 |
| Secrets | Environment variables only, never in Git | 09_SECURITY.md |
| Production errors | Sanitized (no stack traces) | 09_SECURITY.md |
| Security headers | Helmet middleware | 07_BACKEND.md |

---

## K. FINAL BACKEND IMPLEMENTATION ORDER

### K.1 Dependency Graph

```
Phase 0 (Contract Freeze) ─── no dependencies
    │
    ▼
Phase 1 (Repo + Env) ─── depends on: nothing
    │
    ▼
Phase 2 (Prisma + DB) ─── depends on: Phase 1
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3 (Master Data)  Phase 6 (API Foundation) ← can parallel with 3,4,5
    │
    ▼
Phase 4 (Auth) ─── depends on: Phase 2, Phase 3
    │
    ▼
Phase 5 (RBAC) ─── depends on: Phase 4
    │
    ▼
Phase 7 (Master APIs) ─── depends on: Phase 3, Phase 5, Phase 6
    │
    ├──────────────────┐
    ▼                  ▼
Phase 8 (Accounting)   Phase 9 (Sequences) ← can parallel with 8
    │                  │
    └────────┬─────────┘
             │
    ┌────────┴────────┐
    ▼                  ▼
Phase 10 (Sales)     Phase 11 (Purchase) ← parallel
    │                  │
    └────────┬─────────┘
             │
    ┌────────┴────────┐
    ▼                  ▼
Phase 12 (Budget)    Phase 13 (Reports) ← sequential
    │
    ▼
Phase 14 (Portal) ─── depends on: Phase 10, 11
    │
    ▼
Phase 15 (Upload + PDF/Email stubs) ─── depends on: Phase 10, 11
    │
    ▼
Phase 16 (Audit) ─── cross-cutting, added last
    │
    ▼
Phase 17 (Security) ─── cross-cutting, added last
    │
    ▼
Phase 18 (Contract Tests) ─── depends on: all above
    │
    ▼
Phase 19 (E2E Tests) ─── depends on: all above
    │
    ▼
Phase 20 (Unit Tests) ─── depends on: all above
    │
    ▼
Phase 21 (Frontend Handoff) ─── depends on: Phase 18
    │
    ▼
Phase 22 (Deployment) ─── depends on: Phase 20
    │
    ▼
Phase 23 (Quality Gate) ─── depends on: all above
```

### K.2 Phase Specifications

For each phase: dependency, backend output, API output, frontend dependency, test gate, definition of done, blocker conditions.

---

#### Phase 0 — Contract Freeze

| Property | Value |
|----------|-------|
| Dependency | None |
| Backend Output | None |
| API Output | None |
| Frontend Dependency | None |
| Test Gate | All documentation reviewed |
| Definition of Done | This document approved |
| Blocker Conditions | If contradictions found, STOP |

---

#### Phase 1 — Repository & Environment

| Property | Value |
|----------|-------|
| Dependency | Phase 0 |
| Backend Output | package.json, tsconfig.json, .env, app.ts, database.ts, auth.ts |
| API Output | GET /api/v1/health → 200 |
| Frontend Dependency | None |
| Test Gate | Health check returns 200 |
| Definition of Done | `npm run dev` boots server, health check works |
| Blocker Conditions | None |

**Directory Structure:**
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts        (Prisma client)
│   │   └── auth.ts            (JWT config)
│   ├── middleware/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   │   ├── errors.ts          (AppError class)
│   │   ├── pagination.ts
│   │   ├── filters.ts
│   │   ├── sequences.ts
│   │   ├── validators.ts      (UUID, date, decimal)
│   │   └── helpers.ts
│   └── app.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
├── scripts/
├── uploads/
├── .env
├── .env.example
└── package.json
```

**Dependencies to install:**
- express, cors, cookie-parser, helmet
- @prisma/client, prisma
- jsonwebtoken, bcryptjs
- express-validator, express-rate-limit
- multer, uuid
- dotenv
- TypeScript, ts-node, tsx
- Jest, supertest, @types/*

---

#### Phase 2 — PostgreSQL + Prisma

| Property | Value |
|----------|-------|
| Dependency | Phase 1 |
| Backend Output | schema.prisma (19 models, 13 enums), seed.ts |
| API Output | None |
| Frontend Dependency | None |
| Test Gate | Migration runs clean, seed runs clean, Prisma client generates |
| Definition of Done | All 19 tables exist, all 7 sequences exist, seed data loaded |
| Blocker Conditions | Schema must match 14_DATABASE_SCHEMA.md exactly |

**Schema Sanity Checklist:**
- [ ] Every FK exists and points to correct table
- [ ] Every relation valid (1:N, N:M)
- [ ] Every enum defined with correct values
- [ ] All 13 unique constraints present
- [ ] All 23 check constraints present
- [ ] Timestamps consistent (created_at, updated_at)
- [ ] Soft delete only on: contacts, products
- [ ] CASCADE on line tables, RESTRICT on parent tables
- [ ] All @map and @@map directives for snake_case

---

#### Phase 3 — Master Data

| Property | Value |
|----------|-------|
| Dependency | Phase 2 |
| Backend Output | Services, controllers, routes, validators for: contacts, products, categories, analyticals, chart_of_accounts, journals |
| API Output | 13 endpoints (contacts:4, products:4, categories:2, analyticals:2, coa:2, journals:1) minus 1 = 13 |
| Frontend Dependency | Frontend needs contacts and products for invoice/bill forms |
| Test Gate | CRUD operations work for each entity with correct RBAC |
| Definition of Done | All 13 master data endpoints work |
| Blocker Conditions | None |

**Files to Create:**
- src/services/contact.service.ts
- src/services/category.service.ts
- src/services/product.service.ts
- src/services/analytical.service.ts
- src/services/chartOfAccount.service.ts
- src/services/journal.service.ts
- src/validators/contact.validator.ts
- src/validators/product.validator.ts
- src/controllers/contact.controller.ts
- src/controllers/category.controller.ts
- src/controllers/product.controller.ts
- src/controllers/analytical.controller.ts
- src/controllers/chartOfAccount.controller.ts
- src/controllers/journal.controller.ts
- src/routes/contacts.routes.ts
- src/routes/products.routes.ts
- src/routes/categories.routes.ts
- src/routes/analyticals.routes.ts
- src/routes/chartOfAccounts.routes.ts
- src/routes/journals.routes.ts

---

#### Phase 4 — Authentication

| Property | Value |
|----------|-------|
| Dependency | Phase 2, Phase 3 |
| Backend Output | Auth middleware, auth service, auth controller, auth routes, user service, user controller, user routes |
| API Output | 6 endpoints (signup, login, logout, me, POST users, GET users) |
| Frontend Dependency | Frontend needs these for login/signup flow |
| Test Gate | All auth flows work end-to-end |
| Definition of Done | Frontend can signup → login → /me → authenticated request → logout |
| Blocker Conditions | JWT NEVER in response body, cookie settings exact |

**Critical Validation Checklist:**
- [ ] JWT NEVER in response body
- [ ] Cookie HttpOnly = true
- [ ] Cookie Secure = true (production)
- [ ] Cookie SameSite = Strict
- [ ] Cookie Path = /api
- [ ] Cookie Max-Age = 86400
- [ ] Generic error message on login failure
- [ ] Rate limiting: 5 login/min, 3 signup/hour

**Files to Create:**
- src/middleware/auth.ts
- src/middleware/authorize.ts
- src/middleware/validate.ts
- src/middleware/errorHandler.ts
- src/middleware/rateLimiter.ts
- src/services/auth.service.ts
- src/services/user.service.ts
- src/controllers/auth.controller.ts
- src/controllers/user.controller.ts
- src/routes/auth.routes.ts
- src/routes/users.routes.ts
- src/validators/auth.validator.ts
- src/utils/errors.ts
- src/utils/helpers.ts

---

#### Phase 5 — RBAC + Object Authorization

| Property | Value |
|----------|-------|
| Dependency | Phase 4 |
| Backend Output | Enhanced authorize middleware, ownership helper |
| API Output | All endpoints now enforce RBAC |
| Frontend Dependency | None |
| Test Gate | No protected endpoint accessible without correct permission |
| Definition of Done | RBAC matrix fully enforced |
| Blocker Conditions | None |

---

#### Phase 6 — API Foundation (Parallel with 3-5)

| Property | Value |
|----------|-------|
| Dependency | Phase 1 |
| Backend Output | AppError class, global error handler, validation wrapper, pagination, filtering, transaction wrapper |
| API Output | Consistent error format on all endpoints |
| Frontend Dependency | Frontend can rely on consistent error format |
| Test Gate | Error handling works correctly |
| Definition of Done | All error responses follow canonical format |
| Blocker Conditions | None |

**Error Response Format:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "field_name | null",
    "details": {}
  }
}
```

---

#### Phase 7 — Master APIs

| Property | Value |
|----------|-------|
| Dependency | Phase 3, Phase 5, Phase 6 |
| Backend Output | All 13 master data endpoints fully tested |
| API Output | 13 endpoints verified against API contract |
| Frontend Dependency | Frontend needs contacts, products, COA, journals for forms |
| Test Gate | All CRUD tests pass, all schemas match contract |
| Definition of Done | All master data endpoints match API contract exactly |
| Blocker Conditions | None |

---

#### Phase 8 — Journal / Accounting Core

| Property | Value |
|----------|-------|
| Dependency | Phase 2 |
| Backend Output | Accounting service, journal entry service, journal entry controller, routes, validators |
| API Output | 3 endpoints (GET list, POST create, GET by id) |
| Frontend Dependency | Frontend needs journal entries for manual entry form |
| Test Gate | Balance validation works, atomic transactions work |
| Definition of Done | Accounting engine works independently |
| Blocker Conditions | None |

**Critical Tests:**
- [ ] Valid balanced entry accepted
- [ ] Unbalanced entry rejected (UNBALANCED_JOURNAL)
- [ ] Zero amounts rejected (ZERO_AMOUNT)
- [ ] Negative amounts rejected (NEGATIVE_AMOUNT)
- [ ] Transaction rollback on failure
- [ ] Each line has debit > 0 OR credit > 0

---

#### Phase 9 — Sequence Generation (Parallel with 8)

| Property | Value |
|----------|-------|
| Dependency | Phase 2 |
| Backend Output | src/utils/sequences.ts with 7 generators |
| API Output | Number generation available |
| Frontend Dependency | None (server generates numbers) |
| Test Gate | Concurrent generation produces unique numbers |
| Definition of Done | All 7 sequence generators work correctly |
| Blocker Conditions | None |

---

#### Phase 10 — Sales Flow

| Property | Value |
|----------|-------|
| Dependency | Phase 7, Phase 8, Phase 9 |
| Backend Output | Sales order service/controller/routes, invoice service/controller/routes |
| API Output | 14 endpoints (SO:5 + Invoice:9) |
| Frontend Dependency | Frontend needs these for sales screens |
| Test Gate | Full sales cycle works: SO → Invoice → Confirm → JE → Payment → Paid |
| Definition of Done | All invoice tests pass |
| Blocker Conditions | None |

**Sales Flow:**
```
Sales Order (draft) → Confirm SO → Create Invoice (draft) → Confirm Invoice → JE Created → Pay Invoice → Paid
```

---

#### Phase 11 — Purchase Flow (Parallel with 10)

| Property | Value |
|----------|-------|
| Dependency | Phase 7, Phase 8, Phase 9 |
| Backend Output | Purchase order service/controller/routes, bill service/controller/routes |
| API Output | 14 endpoints (PO:5 + Bill:9) |
| Frontend Dependency | Frontend needs these for purchase screens |
| Test Gate | Full purchase cycle works: PO → Bill → Confirm → JE → Payment → Paid |
| Definition of Done | All bill tests pass |
| Blocker Conditions | None |

---

#### Phase 12 — Budget Engine

| Property | Value |
|----------|-------|
| Dependency | Phase 7, Phase 8 |
| Backend Output | Enhanced budget service with transitions and achievement calculation |
| API Output | 7 budget endpoints |
| Frontend Dependency | Frontend needs budgets for budget screens |
| Test Gate | All budget lifecycle tests pass |
| Definition of Done | Budget lifecycle works with achievement calculation |
| Blocker Conditions | None |

---

#### Phase 13 — Report Engine

| Property | Value |
|----------|-------|
| Dependency | Phase 8, Phase 12 |
| Backend Output | Report service, report controller, report routes, dashboard controller/routes |
| API Output | 4 endpoints (P&L, Balance Sheet, Budget Report, Dashboard) |
| Frontend Dependency | Frontend needs reports for report screens |
| Test Gate | All report tests pass with correct data |
| Definition of Done | Reports return correct data from live transactions |
| Blocker Conditions | None |

---

#### Phase 14 — Portal Access

| Property | Value |
|----------|-------|
| Dependency | Phase 10, Phase 11 |
| Backend Output | Ownership filters on invoice/bill endpoints |
| API Output | Existing endpoints now filter by ownership for user role |
| Frontend Dependency | User can see own invoices |
| Test Gate | IDOR tests pass |
| Definition of Done | User A cannot read User B's records |
| Blocker Conditions | None |

---

#### Phase 15 — Upload + PDF/Email Stubs

| Property | Value |
|----------|-------|
| Dependency | Phase 10, Phase 11 |
| Backend Output | Upload endpoint, PDF stub, email stub |
| API Output | POST /upload, print/send endpoints return success |
| Frontend Dependency | Frontend can call upload/print/send |
| Test Gate | Stubs return success |
| Definition of Done | Upload, print, send work |
| Blocker Conditions | None |

**Upload Specification:**
- Endpoint: `POST /api/v1/upload`
- Content-Type: `multipart/form-data`
- Allowed MIME: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Max size: 5MB
- Storage: Local `uploads/` directory
- Response: `{ "url": "/uploads/filename.jpg" }`

---

#### Phase 16 — Audit Logging

| Property | Value |
|----------|-------|
| Dependency | Phases 4-13 |
| Backend Output | Audit middleware (optional, engineering recommendation) |
| API Output | None |
| Frontend Dependency | None |
| Test Gate | Audit logs created for financial actions |
| Definition of Done | Financial actions are auditable |
| Blocker Conditions | Out of scope per PRD §5 (engineering recommendation only) |

---

#### Phase 17 — Security Hardening

| Property | Value |
|----------|-------|
| Dependency | All above |
| Backend Output | Helmet, CORS, sanitized errors |
| API Output | All endpoints secured |
| Frontend Dependency | None |
| Test Gate | Security checklist complete |
| Definition of Done | Security checklist passed |
| Blocker Conditions | None |

---

#### Phase 18 — Contract Tests

| Property | Value |
|----------|-------|
| Dependency | All above |
| Backend Output | Smoke test collection for ALL 64 endpoints |
| API Output | Every endpoint verified against contract |
| Frontend Dependency | Frontend can rely on API contract |
| Test Gate | All smoke tests pass |
| Definition of Done | Every endpoint matches API contract |
| Blocker Conditions | None |

---

#### Phase 19-20 — Tests

| Property | Value |
|----------|-------|
| Dependency | All above |
| Backend Output | E2E scenarios + unit tests |
| API Output | None |
| Frontend Dependency | None |
| Test Gate | All tests pass, coverage > 80% for critical paths |
| Definition of Done | Test suite complete |
| Blocker Conditions | None |

---

#### Phase 21 — Frontend Handoff

| Property | Value |
|----------|-------|
| Dependency | Phase 18 |
| Backend Output | FRONTEND_HANDOFF.md |
| API Output | All endpoints documented |
| Frontend Dependency | Frontend can integrate |
| Test Gate | None |
| Definition of Done | Frontend developer can integrate without questions |
| Blocker Conditions | None |

---

#### Phase 22 — Deployment

| Property | Value |
|----------|-------|
| Dependency | Phase 20 |
| Backend Output | Dockerfile, docker-compose.yml, deploy scripts |
| API Output | Production-ready |
| Frontend Dependency | None |
| Test Gate | Deployment smoke tests pass |
| Definition of Done | System deployable to production |
| Blocker Conditions | None |

---

#### Phase 23 — Quality Gate

| Property | Value |
|----------|-------|
| Dependency | All above |
| Backend Output | None |
| API Output | None |
| Frontend Dependency | None |
| Test Gate | All quality checks pass |
| Definition of Done | System meets all requirements |
| Blocker Conditions | None |

---

## L. FINAL FRONTEND INTEGRATION POINTS

### L.1 API Client Configuration

```javascript
const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});
```

### L.2 Key Integration Rules

| Rule | Detail |
|------|--------|
| Cookie | Browser sends `auth_token` automatically with `withCredentials: true` |
| No Token Storage | Frontend stores user object only, NEVER the JWT |
| 401 Handling | Redirect to `/login` on any 401 response |
| Snake Case | All API fields are snake_case |
| Pagination | All list endpoints return `{ items: [], total, page, limit }` |
| Errors | All errors follow `{ error: { code, message, field, details } }` |

### L.3 Frontend Route Dependencies

| Frontend Route | Backend Endpoints Required | Minimum Backend Phase |
|---------------|---------------------------|----------------------|
| /login | POST /auth/login | Phase 4 |
| /signup | POST /auth/signup | Phase 4 |
| /dashboard | GET /dashboard | Phase 13 |
| /contacts | GET/POST /contacts | Phase 7 |
| /products | GET/POST /products | Phase 7 |
| /categories | GET/POST /categories | Phase 7 |
| /analyticals | GET/POST /analyticals | Phase 7 |
| /budgets | GET/POST /budgets, PUT confirm/revise/cancel | Phase 12 |
| /chart-of-accounts | GET/POST /chart-of-accounts | Phase 7 |
| /journals | GET /journals | Phase 7 |
| /journal-entries | GET/POST /journal-entries | Phase 8 |
| /sales-orders | GET/POST /sales-orders, PUT confirm | Phase 10 |
| /invoices | GET/POST /invoices, POST confirm/pay/cancel | Phase 10 |
| /purchase-orders | GET/POST /purchase-orders, PUT confirm | Phase 11 |
| /bills | GET/POST /bills, POST confirm/pay/cancel | Phase 11 |
| /reports/* | GET /reports/profit-and-loss, balance-sheet, budget-report | Phase 13 |
| /portal/invoices | GET /invoices (own), POST /invoices/:id/pay (own) | Phase 14 |

---

## M. FINAL TESTING GATES

### M.1 Contract Test Matrix (64 Endpoints)

Every endpoint must pass:

| Check | Description |
|-------|-------------|
| Request Schema | Fields match API contract |
| Response Schema | Fields match API contract |
| Status Code | Correct HTTP status |
| Role Enforcement | Correct role can access |
| Validation | Invalid input rejected with correct error |
| Error Format | Error follows canonical format |
| Pagination | List endpoints return paginated results |

### M.2 Business Scenario Tests

| Scenario | Steps | Validates |
|----------|-------|-----------|
| A: Sales Cycle | Login → Create Contact → Create Product → Create SO → Create Invoice → Confirm → Check JE → Pay → Check P&L | Full sales flow |
| B: Purchase Cycle | Login → Create Contact → Create Product → Create PO → Create Bill → Confirm → Check JE → Pay → Check P&L | Full purchase flow |
| C: User Portal | User Login → View Own Invoice → Pay → Check Paid Status | Portal access + IDOR |
| D: Budget | Create Analytical → Create Budget → Confirm → Create matching Invoice → Check Achievement | Budget engine |
| E: Invalid Journal | Create unbalanced JE → Verify rejected → Verify no partial mutation | Accounting invariant |

### M.3 Security Test Matrix

| Test | Description |
|------|-------------|
| IDOR Prevention | User A cannot access User B's invoices |
| Role Escalation | User cannot access admin endpoints |
| JWT Prevention | JWT never in response body |
| Cookie Security | HttpOnly, Secure, SameSite flags correct |
| Rate Limiting | Login rate limit enforced |
| Input Validation | SQL injection, XSS attempts rejected |
| UUID Validation | Invalid UUIDs rejected |

---

## N. FINAL 24-HOUR TWO-LANE SCHEDULE

### LANE A: Backend/DB/Security (Primary)

| Hour | Phase | Task | Output |
|------|-------|------|--------|
| 0-1 | 0-1 | Contract freeze, repo init, deps, health check | Working server |
| 1-2 | 2 | Prisma schema (19 tables, 13 enums), seed, migrations | Database live |
| 2-3 | 4 | Auth (signup, login, logout, me, forgot-password, rate limiting) | Auth working |
| 3-4 | 5 | RBAC middleware, object authorization, ownership checks | Authorization working |
| 3-4 | 6 | API foundation (errors, validation, pagination) — PARALLEL | Reusable infra |
| 4-6 | 7 | Master APIs (contacts, products, categories, analyticals, COA, journals) | 13 endpoints |
| 6-7 | 8 | Accounting engine (JE creation, balance validation) | Accounting core |
| 6-7 | 9 | Sequence generation (7 sequences) — PARALLEL | Number generation |
| 7-9 | 10 | Sales flow (SO, Invoice, confirm, pay, cancel) | Sales cycle |
| 7-9 | 11 | Purchase flow (PO, Bill, confirm, pay, cancel) — PARALLEL | Purchase cycle |
| 9-10 | 12 | Budget engine (CRUD, confirm, revise, cancel, achievement) | Budget working |
| 10-11 | 13 | Reports (P&L, Balance Sheet, Budget Report, Dashboard) | Reports working |
| 11-12 | 14-15 | Portal access + Upload + PDF/Email stubs | User portal |
| 12-13 | 16-17 | Audit logging + Security hardening (Helmet, CORS, sanitized errors) | Security complete |
| 13-15 | 18-20 | Contract tests (64 endpoints) + E2E scenarios + unit tests | Tests passing |
| 15-17 | 21-22 | Frontend handoff doc + Deployment prep | Handoff ready |
| 17-18 | 23 | Final quality gate + bug fixes | Quality verified |
| 18-24 | — | Buffer for overflow | Stability |

### LANE B: Frontend/Lovable (Dependent on Backend)

| Hour | Task | Backend Dependency |
|------|------|-------------------|
| 0-4 | UI scaffolding, routing, auth pages (mock API) | None |
| 4-7 | Master data screens (contacts, products, categories, analyticals, COA, journals) | Phase 7 |
| 7-9 | Transaction screens (SO, Invoice, PO, Bill) | Phase 10-11 |
| 9-10 | Budget screens | Phase 12 |
| 10-11 | Report screens (P&L, Balance Sheet, Budget Report) | Phase 13 |
| 11-12 | Portal screens, Dashboard | Phase 14 |
| 12-16 | Integration testing with live backend | All backend |
| 16-20 | Bug fixes, polish, responsive design | All backend |
| 20-24 | Buffer + final testing | All |

### LANE Integration Checkpoints

| Checkpoint | Hour | Lane A Status | Lane B Status | Go/No-Go |
|-----------|------|---------------|---------------|----------|
| CP1 | 4 | Auth + RBAC working | Auth pages built | Must pass |
| CP2 | 7 | Master APIs working | Master data screens built | Must pass |
| CP3 | 9 | Sales/Purchase flows working | Transaction screens built | Must pass |
| CP4 | 11 | Reports + Budget working | Report + Budget screens built | Must pass |
| CP5 | 13 | All endpoints working | All screens built | Must pass |
| CP6 | 15 | Tests passing | Integration started | Must pass |
| CP7 | 18 | Quality gate passed | Integration complete | Must pass |
| CP8 | 24 | Deployment ready | Final testing done | FINAL |

---

## CONSISTENCY AUDIT

### Roles

| Source | Roles | Match? |
|--------|-------|--------|
| 01_PRD.md | admin, accountant, user | ✓ |
| 14_DATABASE_SCHEMA.md | user_role enum: admin, accountant, user | ✓ |
| 18_RBAC_MATRIX.md | admin, accountant, user | ✓ |
| 22_AUTHENTICATION_AND_SESSION.md | admin, accountant, user | ✓ |
| EXECUTION_PLAN_V2.md | admin, accountant, user | ✓ |

### API Paths

| Source | Path for COA | Match? |
|--------|-------------|--------|
| 08_API_CONTRACTS.md | /api/v1/accounts | ✗ (uses /accounts) |
| 19_API_ENDPOINT_CATALOG.md | /api/v1/chart-of-accounts | ✓ |
| EXECUTION_PLAN_V2.md | /api/v1/chart-of-accounts | ✓ |

**Resolution:** /api/v1/chart-of-accounts is canonical. 08_API_CONTRACTS.md §7 has a typo.

### Status Enums

| Entity | Source | Values | Match? |
|--------|--------|--------|--------|
| SO | Schema + State Machine | draft, confirmed | ✓ |
| PO | Schema + State Machine | draft, confirmed | ✓ |
| Invoice | Schema + State Machine | draft, confirmed, paid | ✓ |
| Bill | Schema + State Machine | draft, confirmed, paid | ✓ |
| JE | Schema + State Machine | draft, posted | ✓ |
| Payment | Schema + State Machine | draft, confirmed, successful | ✓ |
| Budget | Schema + State Machine | draft, confirmed, revised, cancelled | ✓ |

### Accounting Formulas

| Formula | Source 1 | Source 2 | Match? |
|---------|----------|----------|--------|
| Invoice confirmation: DEBIT Debtors, CREDIT Sales Income | 16_ACCOUNTING_RULES §2.1 | 04_SYSTEM_DESIGN §2.1 | ✓ |
| Bill confirmation: DEBIT Purchase Expense, CREDIT Creditors | 16_ACCOUNTING_RULES §2.2 | 04_SYSTEM_DESIGN §2.3 | ✓ |
| Invoice payment: DEBIT Bank/Cash, CREDIT Debtors | 16_ACCOUNTING_RULES §2.3 | 04_SYSTEM_DESIGN §2.2 | ✓ |
| Bill payment: DEBIT Creditors, CREDIT Bank/Cash | 16_ACCOUNTING_RULES §2.4 | 04_SYSTEM_DESIGN §2.4 | ✓ |
| P&L: Income = SUM(credit) WHERE income, Expenses = SUM(debit) WHERE expense | 26_REPORTING_SPEC §1.4 | 16_ACCOUNTING_RULES §3.1 | ✓ |
| Balance Sheet: Assets = SUM(debit-credit) WHERE asset/bank/cash | 26_REPORTING_SPEC §2.4 | 16_ACCOUNTING_RULES §3.2 | ✓ |

### Authentication

| Property | 22_AUTH | EXECUTION_PLAN_V2 | Match? |
|----------|--------|-------------------|--------|
| Cookie name | auth_token | auth_token | ✓ |
| HttpOnly | true | true | ✓ |
| Secure | true | true | ✓ |
| SameSite | Strict | Strict | ✓ |
| Path | /api | /api | ✓ |
| Max-Age | 86400 | 86400 | ✓ |
| JWT in body | NEVER | NEVER | ✓ |
| JWT algorithm | HS256 | HS256 | ✓ |
| JWT expiry | 15 min | 15 min | ✓ |

### Naming Convention

| Layer | Convention | Source |
|-------|-----------|--------|
| Database | snake_case | 14_DATABASE_SCHEMA §1 |
| API JSON | snake_case | CR-006 |
| Frontend data | snake_case | CR-006 |
| FK | <entity>_id | 14_DATABASE_SCHEMA §1 |
| PK | id (UUID) | ED-001 |
| Prisma schema | camelCase with @map | CR-007 |

---

*Execution plan V2 created 2026-09-05*  
*All BLOCKER and HIGH issues resolved*  
*Awaiting GO approval before Phase 1*
