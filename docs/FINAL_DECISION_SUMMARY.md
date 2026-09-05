# FINAL_DECISION_SUMMARY.md

> **Date:** 2026-09-05  
> **Supersedes:** All prior decision documents  
> **Status:** FROZEN — No changes allowed without re-validation

---

## BLOCKER Decisions (Resolved)

### B1: Sales Order Date Field
- **Issue:** API contract says `order_date`, schema says `date`
- **Decision:** Schema `date` is canonical. API returns `date`.
- **Source:** 14_DATABASE_SCHEMA.md §3.11

### B2: Purchase Order Date Field
- **Issue:** API contract says `order_date`, schema says `date`
- **Decision:** Schema `date` is canonical. API returns `date`.
- **Source:** 14_DATABASE_SCHEMA.md §3.15

### B3: Invoice/Bill amount_paid
- **Issue:** `amount_paid` not a schema column
- **Decision:** Computed: `amount_paid = total - amount_due`. Not stored. Returned in API responses only.
- **Source:** 15_ACCOUNTING_DATA_MODEL.md §3.2, §3.4

### B4: SO/PO Status Enum — No `cancelled`
- **Issue:** API contract allows `cancelled` for SO/PO, schema does not
- **Decision:** SO/PO have only `draft` and `confirmed`. No cancel state. Draft SO/PO are hard-deleted if no longer needed.
- **Source:** 14_DATABASE_SCHEMA.md §2 (so_status, po_status), 17_STATE_MACHINES.md §4, §5

### B5: JE Status Enum — No `cancelled`
- **Issue:** API contract allows `cancelled` for JE, schema does not
- **Decision:** JE has only `draft` and `posted`. No cancel state.
- **Source:** 14_DATABASE_SCHEMA.md §2 (je_status), 17_STATE_MACHINES.md §7

### B6: Budget Response Field Name
- **Issue:** API says `previous_budget_id`, schema says `original_budget_id`
- **Decision:** Schema `original_budget_id` is canonical. API returns `original_budget_id`.
- **Source:** 14_DATABASE_SCHEMA.md §3.6, PRD REQ-BUD-007

### B7: Invoice/Bill Cancel Endpoints
- **Issue:** State machines define cancel, API contracts do not list endpoints
- **Decision:** ADD `POST /invoices/:id/cancel` and `POST /bills/:id/cancel`. Only works when status = 'draft'. Hard-deletes the record (no accounting impact).
- **Source:** PRD §3.5, §3.6, CONFLICT-008

### B8: Payment State Machine (1-step vs 2-step)
- **Issue:** State machine shows 3 states (draft→confirmed→successful), API shows 1-step
- **Decision:** 1-step API. `POST /invoices/:id/pay` creates payment with `status='successful'` and JE atomically. 3-state enum preserved for future extensibility.
- **Source:** 16_ACCOUNTING_RULES.md §2.3, 08_API_CONTRACTS.md §12

---

## HIGH Decisions (Resolved)

### H1: Dashboard Access
- **Issue:** API contract says admin+accountant+user, RBAC matrix says admin+accountant only
- **Decision:** Dashboard: admin, accountant ONLY. User excluded.
- **Source:** 18_RBAC_MATRIX.md §2.17

### H2: Missing GET /bills/:id
- **Decision:** ADD endpoint. GET /bills/:id (admin, accountant).
- **Source:** 08_API_CONTRACTS.md §14

### H3: Missing GET /payments/:id
- **Decision:** NOT added. Not required by any source document.
- **Source:** Cross-reference of all sources

### H4: Upload Endpoint
- **Decision:** ADD `POST /api/v1/upload`. MIME: jpeg/png/gif/webp. Max: 5MB. Local storage.
- **Source:** 08_API_CONTRACTS.md §18

### H5: POST /users Endpoint
- **Decision:** ADD `POST /api/v1/users` (admin only). Required by PRD REQ-AUTH-005 and RBAC §2.2.
- **Source:** 19_API_ENDPOINT_CATALOG USER-001, PRD §3.1

### H6: Budget Responsible Field
- **Decision:** Schema stores `responsible_id` (UUID). API returns `responsible` (contact name via JOIN).
- **Source:** 08_API_CONTRACTS.md §10, 14_DATABASE_SCHEMA.md §3.6

---

## MEDIUM Decisions (Resolved)

### M1: Chart of Accounts Path
- **Decision:** Canonical: `/api/v1/chart-of-accounts`
- **Source:** 19_API_ENDPOINT_CATALOG COA-001/002

### M2: JE Reference Field
- **Decision:** Computed from `source_document_type` + `source_document_id`. Null for manual entries.
- **Source:** 08_API_CONTRACTS.md §9

### M3: Line Item Field Names
- **Decision:** API uses `quantity`, `account_id`, `analytical_id`. Schema uses `qty`, `chart_of_account_id`, `budget_analytic_id`. Backend maps between them.
- **Source:** 08_API_CONTRACTS.md vs 14_DATABASE_SCHEMA.md

### M4: Login Response Shape
- **Decision:** `{ "user": { "id", "name", "login_id", "email", "role" } }`. User wrapped in key.
- **Source:** 22_AUTHENTICATION_AND_SESSION.md §3, 19_API_ENDPOINT_CATALOG AUTH-002

### M5: Sequence Count
- **Decision:** 7 unique sequences. SQL in 25_SEQUENCE_RULES.md has duplicate `po_number_seq` (typo).
- **Source:** 25_SEQUENCE_RULES.md

### M6: Endpoint Count
- **Decision:** 64 total endpoints (not 44+ as originally estimated).
- **Source:** Cross-reference of 08_API_CONTRACTS.md + 19_API_ENDPOINT_CATALOG.md + State Machines + PRD

---

## Pre-existing Frozen Decisions (Unchanged)

| ID | Decision | Source |
|----|----------|--------|
| ED-001 | UUID for all PKs | 12_CONFLICTS |
| ED-002 | DECIMAL(15,2) for money | 12_CONFLICTS |
| ED-003 | /api/v1/ for all endpoints | 12_CONFLICTS |
| ED-004 | Soft delete on contacts/products only | 12_CONFLICTS |
| ED-005 | SERIALIZABLE for financial writes | 12_CONFLICTS |
| ED-006 | SameSite=Strict for CSRF | 12_CONFLICTS |
| ED-007 | Single payments table | 12_CONFLICTS |
| ED-008 | Budget committed amount user-entered on confirm | 12_CONFLICTS |
| CR-001 | 3 roles (admin, accountant, user) | 12_CONFLICTS |
| CR-005 | HttpOnly cookie only, JWT never in body | 12_CONFLICTS |
| CR-006 | DB: snake_case, API: snake_case, Prisma: camelCase | 12_CONFLICTS |
| CR-007 | Prisma camelCase with @map to snake_case | 12_CONFLICTS |
| CR-008 | Only draft invoices/bills can be cancelled | 12_CONFLICTS |
| CR-010 | Single payments table, different API endpoints | 12_CONFLICTS |

---

*All decisions frozen. No changes without re-validation.*
