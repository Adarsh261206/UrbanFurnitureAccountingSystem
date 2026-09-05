# URBAN FURNITURE ACCOUNTING SYSTEM — FRONTEND EXECUTION PLAN V2 (RECONCILED)

> **24-Hour Hackathon**  
> **Author:** Lead Frontend Engineer  
> **Date:** 2026-09-05  
> **Status:** APPROVED FOR EXECUTION — ALL CONTRACTS RECONCILED  
> **Supersedes:** FRONTEND_EXECUTION_PLAN.md (V1)

---

## PART A — CONFLICT REGISTER & RESOLUTIONS

Every conflict found during reconciliation is listed here. Resolutions are binding for the frontend. Items marked `FLAG` must be confirmed with the backend engineer before integration — the frontend will NOT silently adapt.

### A1. User access to Vendor Bills (RESOLVED — STRICT)

| Source | Says |
|--------|------|
| 08_API_CONTRACTS §14 | GET /bills, GET /bills/:id, POST /bills/:id/pay — **user (own only)** |
| 06_FRONTEND §1 | /bills/:id, /bills/:id/pay — Admin, Accountant, **User (own)** |
| 18_RBAC §2.14, §3.2 | User: **✗ all bill features**; "USER: Cannot access bills (portal limitation)" |
| 23_MATRIX §11-13 | Bill screens — Visible To: **admin, accountant only** |

**RESOLUTION:** 18_RBAC and 23_MATRIX agree; both are authoritative for role behavior and screen visibility. **User has NO access to bills.** Frontend restricts /bills* routes to admin/accountant and never shows bill nav to user. `FLAG`: 08_API_CONTRACTS.md §14 lists user (own only) for bill endpoints — backend may implement it, but frontend will not expose it.

### A2. User access to Payments / Receipts (RESOLVED — OWN ONLY)

| Source | Says |
|--------|------|
| 08_API_CONTRACTS §15 | GET /payments — **user (own only)** |
| 18_RBAC §2.12 | Receipts (invoice payments) — user: **✓ (own)** |
| 18_RBAC §2.15 | Payments (bill payments) — user: ✗ |
| 23_MATRIX §3 | Payment/Receipt sub-menu — visible to admin, accountant only |

**RESOLUTION:** Single `/payments` route. admin/accountant = all payments; user = own invoice-linked payments only (backend ownership filter on GET /payments). User portal nav shows "My Invoices" only; Receipt/Payment sub-menu entries visible to admin/accountant only.

### A3. Dashboard access (RESOLVED — NO USER DASHBOARD)

| Source | Says |
|--------|------|
| 06_FRONTEND §1 | /dashboard — Authenticated (all roles) |
| 18_RBAC §2.17, §5 | User: ✗ dashboard. "User | No dashboard | Portal only (own invoices)" |
| 23_MATRIX §3 | Dashboard tabs — admin, accountant only |
| 08_API_CONTRACTS §16 | GET /dashboard — admin, accountant, **user** |

**RESOLUTION:** `/dashboard` route guard = **admin, accountant only**. User role: after login → redirect `/invoices`. User hitting /dashboard → redirect `/invoices`. Dashboard consumes **GET /dashboard** (defined in 08) — NOT client-side aggregation of list endpoints (V1 assumption removed).

### A4. Invoice/Bill cancellation endpoint (RESOLVED — POST cancel)

| Source | Says |
|--------|------|
| 17_STATE_MACHINES §2.3, §3.3 | `POST /invoices/:id/cancel`, `POST /bills/:id/cancel` (draft → cancelled) |
| 23_MATRIX §9, §12 | Cancel button → `DELETE /invoices/:id`, `DELETE /bills/:id` |
| 08_API_CONTRACTS, 19_CATALOG | **No cancel endpoint defined** |

**RESOLUTION:** 17_STATE_MACHINES is authoritative for state transitions and explicitly defines the cancel endpoints. **Frontend uses `POST /invoices/:id/cancel` and `POST /bills/:id/cancel`** (draft only). Cancel button visible only when status = draft. `FLAG`: 23_MATRIX references DELETE — backend must implement POST cancel per state machine.

### A5. "Reset to Draft" button (REMOVED — CONTRADICTS STATE MACHINE)

| Source | Says |
|--------|------|
| 23_MATRIX §10, §13 | "Reset to Draft" button → PUT /invoices/:id/reset, PUT /bills/:id/reset |
| 17_STATE_MACHINES §2.4, §3.4 | confirmed → draft is **FORBIDDEN** ("Cannot unconfirm") |
| 08/19 | No reset endpoint exists |

**RESOLUTION:** **Button removed from frontend.** The transition it performs is forbidden by the state machine. Documented as a 23_MATRIX error. No route, no button, no service call.

### A6. Receipt / Payment routes (RESOLVED — /payments only)

| Source | Says |
|--------|------|
| 23_MATRIX §3 | Receipt sub-menu → `/receipts`; Payment sub-menu → `/payments` |
| 06_FRONTEND §1 | **No /receipts route. No /payments route** |
| 08_API_CONTRACTS §15 | GET /payments exists |

**RESOLUTION:** Single `/payments` list route (admin, accountant, user-own). Nav label "Receipt" (Sales tab) and "Payment" (Purchase tab) both target `/payments` with the appropriate tab context. **No /receipts route** (not in 06). `FLAG`: if backend provides a distinct receipts endpoint, revisit.

### A7. Sales Order / Purchase Order request field names (RESOLVED — 08 WINS, FLAGGED)

| Field | 08_API_CONTRACTS (POST body) | 19_CATALOG / 14_SCHEMA |
|-------|------------------------------|------------------------|
| Order date | `order_date` | `invoice_date` + `due_date` (SO), `bill_date` + `due_date` (PO) |
| Account on line | `account_id` | `chart_of_account_id` |
| Analytic on line | `analytical_id` | `budget_analytic_id` |
| Quantity | `quantity` | `qty` |

**RESOLUTION:** Per user instruction, **08_API_CONTRACTS is authoritative for backend interaction.** Frontend sends 08 field names:
- `POST /sales-orders`: `{ customer_id, order_date, lines: [{ product_id, account_id, analytical_id, quantity, unit_price }] }`
- `POST /purchase-orders`: `{ vendor_id, order_date, lines: [{ product_id, account_id, analytical_id, quantity, unit_price }] }`
- `POST /invoices`: `{ customer_id, invoice_date, due_date, sales_order_id?, lines: [...] }` (same line fields)
- `POST /bills`: `{ vendor_id, bill_date, due_date, purchase_order_id?, lines: [...] }`

`FLAG (HIGH PRIORITY)`: 19_API_ENDPOINT_CATALOG.md and 14_DATABASE_SCHEMA.md use `chart_of_account_id`, `budget_analytic_id`, `qty`, `invoice_date`/`due_date` on SO/PO. **Backend engineer MUST confirm which contract is implemented.** If backend implements 19 names, frontend integration breaks until resolved. This is the single highest-risk integration point.

### A8. Login response shape (RESOLVED — NESTED user object)

| Source | Says |
|--------|------|
| 22_AUTH §3 | Response 200: `{ "user": { id, name, login_id, email, role } }` |
| 19_CATALOG AUTH-002 | Success Schema: `{ "user": {...} }` |
| 24_LOVABLE §4.1 | `setUser(response.data.user)` |
| 08_API_CONTRACTS §2 | Response 200: `{ id, name, login_id, email, role }` (flat) |

**RESOLUTION:** 22_AUTHENTICATION_AND_SESSION is authoritative for authentication. **Login response = `{ user: {...} }` (nested).** Frontend reads `response.data.user`. `FLAG`: 08 §2 flat shape is superseded.

### A9. `/auth/me` response shape (RESOLVED — FLAT)

**08 §2, 19 AUTH-004, 24 §4.3 all agree:** `GET /auth/me` returns the flat user object `{ id, name, login_id, email, role }`. No conflict. Frontend stores it directly.

### A10. Chart of Accounts path (RESOLVED — /chart-of-accounts)

| Source | Says |
|--------|------|
| 08_API_CONTRACTS §7 | GET/POST `/api/v1/accounts` |
| 19_CATALOG COA-001/002 | GET/POST `/api/v1/chart-of-accounts` |
| 06_FRONTEND §1 | Route `/chart-of-accounts` |

**RESOLUTION:** Path = **`/chart-of-accounts`** (19 catalog + 06 route agree). `FLAG`: 08 §7 `/accounts` is superseded.

### A11. Budget create body — responsible field (RESOLVED — responsible_id)

| Source | Says |
|--------|------|
| 08 §10 | `"responsible": "string"` |
| 19 BUDGET-002 | `"responsible_id": "uuid"` |
| 14_SCHEMA budgets | `responsible_id` UUID FK → contacts |

**RESOLUTION:** **`responsible_id: uuid`** (19 + 14 agree; 08 is a documentation error). Frontend budget form uses contact dropdown → responsible_id.

### A12. Budget list response fields (RESOLVED — 08 list + 21 detail)

**08 §10 list** = flat: `{ id, name, responsible, start_date, end_date, type, committed_amount, achieved_amount, achieved_percentage, amount_to_achieve, status, previous_budget_id, analytical_id, is_archived, created_at }`.
**21 detail** = nested: `responsible: {id, name}`, `analytical: {id, name}`.

**RESOLUTION:** List screen consumes 08 flat fields (includes all computed achievement fields — no client-side calculation). Detail page consumes 21 nested shape. Frontend normalizes defensively: `responsible` may be string (list) or object (detail) — display with `String(responsible?.name ?? responsible)`.

### A13. Invoice/Bill list vs detail response shapes (RESOLVED — 08 list, 21 detail)

**List (08 §12/§14):** flat `{ id, invoice_reference, invoice_number, customer_id, customer_name, invoice_date, due_date, status, total_amount, amount_paid, amount_due, sales_order_id, journal_entry_id, created_at }` (bills: bill_reference, vendor_id, vendor_name, bill_date, purchase_order_id).
**Detail (21):** nested `{ customer: {id, name}, partner: {id, name}, payment_type, payment_via, total, lines: [...] }`.

**RESOLUTION:** `InvoiceListRow` = 08 shape; `InvoiceDetail` = 21 shape. Line items appear in detail only. `total_amount` (list) vs `total` (detail) — frontend type per screen; no cross-normalization needed since each screen consumes one shape.

### A14. Journal Entry status enum (RESOLVED — DEFENSIVE DISPLAY)

**08 §9 list status:** `draft | posted | cancelled`. **17 §7 state machine:** `draft | posted` only.
**RESOLUTION:** StatusBadge maps `draft | posted | cancelled` defensively (unknown values render gray). Not blocking.

### A15. Sales Order / PO status enum (RESOLVED — DEFENSIVE DISPLAY)

**08 §11/§13:** `draft | confirmed | cancelled`. **17 §4/§5:** `draft | confirmed`.
**RESOLUTION:** Same defensive badge approach. SO/PO are admin/accountant-only; cancel not in state machine → SO/PO screens show Confirm action only (draft), no Cancel button.

### A16. Invoice payment request body (RESOLVED — 08 INCLUDES payment_date)

**08 §12 pay:** `{ amount, payment_via, payment_date }`. **19 INV-006:** `{ amount, payment_via }`. **06 §3.5 mockup:** shows Paid via + Amount only (no date field).
**RESOLUTION:** Send `{ amount, payment_via, payment_date }` with `payment_date` defaulting to today client-side (not rendered as a field per 06 mockup). `FLAG`: if backend requires user-entered date, add field.

### A17. Print / Send endpoints (RESOLVED — 19 CATALOG SHAPES)

**19 INV-007/008:** `POST /invoices/:id/print` (PDF binary stream), `POST /invoices/:id/send` `{ email_to, subject, body }`.
**23_MATRIX §9:** Print/Send buttons for invoices (admin, accountant, user-own); §12 same for bills.
**08:** Not defined.

**RESOLUTION:** Frontend implements Print (POST → download blob) and Send (POST with `{ email_to, subject, body }`) for invoices. Bills: same button contract per 23 §12 → `POST /bills/:id/print`, `POST /bills/:id/send`. `FLAG`: 19 catalog lists print/send for invoices only — bill print/send endpoints must be confirmed with backend.

### A18. Users screen route (RESOLVED — ADD /users, ADMIN ONLY)

| Source | Says |
|--------|------|
| 05_FEATURES S01 | "Create User" — SOURCE_REQUIRED screen |
| 08 §3, 19 USER-001/002 | POST /users, GET /users — admin only |
| 06_FRONTEND §1 | **No /users route defined** |
| 23_MATRIX | **No Users sub-menu defined** |

**RESOLUTION:** Add `/users` route (admin only) serving Create User (S01) + user list. Nav entry "Users" under Account tab, admin only. `FLAG`: not present in 06/23 — UI decision, not source-defined; backend endpoints exist.

### A19. Analytical accounts route (RESOLVED — KEEP 06 ROUTES)

**06 §1:** `/analyticals/new`, `/analyticals/:id` (no list route). **19 ANALYTICAL-001:** GET /analyticals (used for dropdowns in Budget form).
**RESOLUTION:** No `/analyticals` list route (06 authoritative). Budget/analytical forms fetch GET /analyticals data via service for dropdowns.

### A20. Budget routes (RESOLVED — FROM 23 MATRIX)

**06 §1:** No /budgets routes. **23_MATRIX §3:** "Analytical Budget Sub-menu → /budgets".
**RESOLUTION:** `/budgets` (list), `/budgets/new` (form), `/budgets/:id` (detail) — admin, accountant only. Flag as 06 omission; 23 matrix + BUDGET endpoints (19) justify.

### A21. Payment standalone POST (RESOLVED — SERVICE ONLY)

**08 §15:** POST /payments exists (admin, accountant, user-own). **No screen in 06/23 creates standalone payments** — the canonical flow is POST /invoices/:id/pay.
**RESOLUTION:** `paymentsService.create()` exists for future use; NO UI screen creates standalone payments. Payments list screen reads GET /payments only.

### A22. List response wrapper keys (RESOLVED — 08 WINS)

**08 lists:** `{ contacts: [...], total, page, limit }` (resource-named key). **21:** `{ data, total, page, limit, total_pages }`.
**RESOLUTION:** 08 shape (authoritative): `{ <resource>: [...], total, page, limit }`. `total_pages` computed client-side. Response types per endpoint (e.g., `{ invoices, total, page, limit }`).

### A23. Enum values (CONFIRMED CONSISTENT)

role: `admin | accountant | user`; product_type: `goods | service | combo`; account_type: `asset | liability | bank | capital | cash | income | expense`; budget_type: `income | expense`; budget_status: `draft | confirmed | revised | cancelled`; invoice_status: `draft | confirmed | paid`; payment_type: `receive | send`; payment_via: `bank | cash`; payment_status: `draft | confirmed | successful`. **No conflicts across 08/17/18/21/24.**

### A24. Forgot password (CONFIRMED)

**22 §12:** POST /auth/forgot-password, body `{ email }`, response `{ message }` — mock. Frontend form → generic success message. No rate-limit-specific UI beyond 429 handling.

---

## PART B — CANONICAL ENDPOINT INVENTORY (FRONTEND-CONSUMED)

Base: `VITE_API_URL` (e.g., `http://localhost:3000/api/v1`). All requests `withCredentials: true`. All bodies snake_case.

### B1. Auth
| Method | Path | Role | Request | Response (relevant) |
|--------|------|------|---------|---------------------|
| POST | /auth/signup | public | `{ login_id, email, password, confirm_password }` | 201 flat user |
| POST | /auth/login | public | `{ login_id, password }` | 200 `{ user: { id, name, login_id, email, role } }` |
| POST | /auth/logout | any | — | 200 `{ message }` |
| GET | /auth/me | any | — | 200 flat user |
| POST | /auth/forgot-password | public | `{ email }` | 200 `{ message }` |

### B2. Users (admin only)
| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | /users | ?page&limit&search | `{ users, total, page, limit }` |
| POST | /users | `{ name, login_id, email, role, password, confirm_password }` | 201 user |

### B3. Master data (admin, accountant)
| Method | Path | Notes |
|--------|------|-------|
| GET | /contacts | ?page&limit&search&sort&order → `{ contacts, total, page, limit }` |
| POST | /contacts | `{ name, email, phone?, street?, city?, state?, country?, pincode?, image_url? }` |
| GET | /contacts/:id | detail |
| PUT | /contacts/:id | partial update |
| GET | /products | ?page&limit&search&category_id → `{ products, total, page, limit }` |
| POST | /products | `{ name, product_type, category_id, category_name?, sales_price, cost, image_url? }` |
| GET | /products/:id | detail |
| PUT | /products/:id | partial update |
| GET | /categories | list |
| POST | /categories | `{ name }` |
| GET | /analyticals | list (dropdowns) |
| POST | /analyticals | `{ name, responsible_id, start_date, to_date, end_date, analytic_account }` |
| GET | /chart-of-accounts | list (A10) |
| POST | /chart-of-accounts | `{ name, account_type }` |
| GET | /journals | list |

### B4. Journal entries (admin, accountant)
| Method | Path | Notes |
|--------|------|-------|
| GET | /journal-entries | ?page&limit&journal_id&status&date_from&date_to |
| POST | /journal-entries | `{ journal_id, accounting_date, reference?, lines: [{ account_id, partner_id?, debit, credit }] }` — SUM(debit)=SUM(credit) |
| GET | /journal-entries/:id | with lines |

### B5. Budgets (admin, accountant)
| Method | Path | Notes |
|--------|------|-------|
| GET | /budgets | ?page&limit&type&status |
| POST | /budgets | `{ name, responsible_id, start_date, end_date, type, analytical_id }` (A11) |
| GET | /budgets/:id | detail |
| PUT | /budgets/:id | draft only |
| PUT | /budgets/:id/confirm | `{ committed_amount }` |
| POST | /budgets/:id/revise | creates new draft |
| PUT | /budgets/:id/cancel | is_archived=true |

### B6. Sales
| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | /sales-orders | admin, accountant | ?page&limit&status&search |
| POST | /sales-orders | admin, accountant | `{ customer_id, order_date, lines: [{ product_id, account_id, analytical_id?, quantity, unit_price }] }` (A7) |
| PUT | /sales-orders/:id/confirm | admin, accountant | draft only |
| GET | /invoices | admin, accountant, user(own) | ?page&limit&status&customer_id |
| POST | /invoices | admin, accountant | `{ customer_id, invoice_date, due_date, sales_order_id?, lines: [...] }` |
| GET | /invoices/:id | admin, accountant, user(own) | detail |
| PUT | /invoices/:id | admin, accountant | draft only |
| POST | /invoices/:id/confirm | admin, accountant | draft only, creates JE |
| POST | /invoices/:id/pay | admin, accountant, user(own) | `{ amount, payment_via, payment_date }` (A16) |
| POST | /invoices/:id/cancel | admin, accountant | draft only (A4) |
| POST | /invoices/:id/print | admin, accountant, user(own) | PDF blob (A17) |
| POST | /invoices/:id/send | admin, accountant, user(own) | `{ email_to, subject, body }` (A17) |

### B7. Purchase
| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | /purchase-orders | admin, accountant | ?page&limit&status&search |
| POST | /purchase-orders | admin, accountant | `{ vendor_id, order_date, lines: [...] }` (A7) |
| PUT | /purchase-orders/:id/confirm | admin, accountant | draft only |
| GET | /bills | admin, accountant | ?page&limit&status&vendor_id (A1) |
| POST | /bills | admin, accountant | `{ vendor_id, bill_date, due_date, purchase_order_id?, lines: [...] }` |
| GET | /bills/:id | admin, accountant | detail (A1) |
| PUT | /bills/:id | admin, accountant | draft only |
| POST | /bills/:id/confirm | admin, accountant | draft only, creates JE |
| POST | /bills/:id/pay | admin, accountant | `{ amount, payment_via, payment_date }` |
| POST | /bills/:id/cancel | admin, accountant | draft only (A4) |
| POST | /bills/:id/print | admin, accountant | PDF blob (A17, FLAG) |
| POST | /bills/:id/send | admin, accountant | `{ email_to, subject, body }` (A17, FLAG) |

### B8. Payments (list only)
| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | /payments | admin, accountant, user(own) | ?invoice_id&vendor_bill_id&page&limit (A2, A21) |

### B9. Dashboard & Reports
| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | /dashboard | admin, accountant | `{ sales: {draft,confirmed,total}, purchase: {...}, budgets: {...} }` (A3) |
| GET | /reports/profit-and-loss | admin, accountant | ?year |
| GET | /reports/balance-sheet | admin, accountant | ?year |
| GET | /reports/budget-report | admin, accountant | ?year&type |
| POST | /upload | any authenticated | multipart `file`, → `{ url }` |

---

## PART C — CANONICAL FRONTEND TYPES (snake_case, per endpoint)

```typescript
// Auth
interface User { id: string; name: string | null; login_id: string; email: string; role: Role; }
interface LoginResponse { user: User; }                    // A8 nested
interface SignupResponse extends User {}                    // flat
interface MeResponse extends User {}                        // flat
interface MessageResponse { message: string; }

// Master data (list = 08 flat)
interface Contact { id: string; name: string; email: string; phone: string | null; image_url: string | null;
  street: string | null; city: string | null; state: string | null; country: string | null;
  pincode: string | null; created_at: string; }
interface Category { id: string; name: string; }
interface Product { id: string; name: string; category_id: string; category_name: string;
  product_type: ProductType; sales_price: number; cost: number; image_url?: string | null; created_at: string; }
interface Analytical { id: string; name: string; responsible_id: string; start_date: string;
  to_date: string; end_date: string; analytic_account: string; }
interface ChartOfAccount { id: string; name: string; account_type: AccountType; journal_type?: string | null; }
interface Journal { id: string; name: string; journal_type: string; default_account_id: string; }

// Budgets
interface BudgetListRow { id: string; name: string; responsible: string; start_date: string; end_date: string;
  type: BudgetType; committed_amount: number | null; achieved_amount: number; achieved_percentage: number | null;
  amount_to_achieve: number | null; status: BudgetStatus; previous_budget_id: string | null;
  analytical_id: string; is_archived: boolean; created_at: string; }          // A12 08 list
interface BudgetDetail extends Omit<BudgetListRow, 'responsible' | 'analytical_id'> {
  responsible: { id: string; name: string } | null; analytical: { id: string; name: string } | null; }  // A12 21 detail

// Journal entries
interface JournalEntryRow { id: string; entry_number: string; journal_id: string; journal_name: string;
  accounting_date: string; reference: string | null; status: 'draft' | 'posted' | 'cancelled'; created_at: string; }
interface JournalEntryLine { id: string; account_id: string; partner_id: string | null; debit: number; credit: number; }
interface JournalEntryDetail extends JournalEntryRow { lines: JournalEntryLine[]; }

// Sales (list = 08 flat, detail = 21 nested)
interface SalesOrderRow { id: string; so_number: string; customer_id: string; customer_name: string;
  order_date: string; status: 'draft' | 'confirmed'; total_amount: number; created_at: string; }
interface SalesOrderLineInput { product_id: string; account_id: string; analytical_id?: string;
  quantity: number; unit_price: number; }                                      // A7 08 names
interface InvoiceListRow { id: string; invoice_reference: string; invoice_number: string; customer_id: string;
  customer_name: string; invoice_date: string; due_date: string; status: InvoiceStatus;
  total_amount: number; amount_paid: number; amount_due: number; sales_order_id: string | null;
  journal_entry_id: string | null; created_at: string; }                       // A13 08 list
interface InvoiceDetail { id: string; invoice_reference: string; invoice_number: string;
  sales_order_id: string | null; customer: { id: string; name: string }; date: string;
  invoice_date: string; due_date: string; payment_type: PaymentType; partner: { id: string; name: string } | null;
  payment_via: PaymentVia; total: number; amount_due: number; status: InvoiceStatus;
  journal_entry_id: string | null; lines: InvoiceLine[]; created_at: string; } // A13 21 detail
interface InvoiceLine { id: string; sr_no: number; product_id: string; product_name?: string;
  chart_of_account_id: string; budget_analytic_id: string | null; qty: number; unit_price: number; total: number; }

// Purchase
interface PurchaseOrderRow { id: string; po_number: string; vendor_id: string; vendor_name: string;
  order_date: string; status: 'draft' | 'confirmed'; total_amount: number; created_at: string; }
interface BillListRow { id: string; bill_reference: string; vendor_id: string; vendor_name: string;
  bill_date: string; due_date: string; status: InvoiceStatus; total_amount: number; amount_paid: number;
  amount_due: number; purchase_order_id: string | null; journal_entry_id: string | null; created_at: string; }
interface BillDetail { id: string; bill_reference: string; vendor_bill_no?: string | null;
  purchase_order_id: string | null; vendor: { id: string; name: string }; date: string; bill_date: string;
  due_date: string; payment_type: PaymentType; partner: { id: string; name: string } | null; payment_via: PaymentVia;
  total: number; amount_due: number; status: InvoiceStatus; journal_entry_id: string | null;
  lines: BillLine[]; created_at: string; }

// Payments
interface PaymentRow { id: string; payment_number: string; invoice_id: string | null;
  vendor_bill_id: string | null; amount: number; payment_via: PaymentVia; payment_date: string;
  status?: PaymentStatus; created_at: string; }

// Pay request (A16)
interface PayInvoiceRequest { amount: number; payment_via: PaymentVia; payment_date: string; }

// Dashboard (A3)
interface DashboardCounts { draft: number; confirmed: number; total: number; }
interface DashboardData { sales: DashboardCounts; purchase: DashboardCounts; budgets: DashboardCounts; }

// Reports (26_REPORTING_SPEC)
interface ReportItem { account_name: string; amount: number; }
interface ProfitAndLossReport { year: number; income: { items: ReportItem[]; total: number };
  expenses: { items: ReportItem[]; total: number }; net_income: number; }
interface BalanceSheetReport { year: number; assets: { items: ReportItem[]; total: number };
  liabilities: { items: ReportItem[]; total: number }; balance_check: boolean; }
interface BudgetReportRow { id: string; name: string; start_date: string; end_date: string; type: BudgetType;
  committed_amount: number; achieved_amount: number; achieved_percentage: number;
  amount_to_achieve: number; status: BudgetStatus; }
interface BudgetReport { budgets: BudgetReportRow[]; }

// Enums (A23)
type Role = 'admin' | 'accountant' | 'user';
type ProductType = 'goods' | 'service' | 'combo';
type AccountType = 'asset' | 'liability' | 'bank' | 'capital' | 'cash' | 'income' | 'expense';
type BudgetType = 'income' | 'expense';
type BudgetStatus = 'draft' | 'confirmed' | 'revised' | 'cancelled';
type InvoiceStatus = 'draft' | 'confirmed' | 'paid';
type PaymentType = 'receive' | 'send';
type PaymentVia = 'bank' | 'cash';
type PaymentStatus = 'draft' | 'confirmed' | 'successful';

// Pagination (A22)
interface Paginated<T> { total: number; page: number; limit: number; }
type ContactList = Paginated<Contact> & { contacts: Contact[] };
type ProductList = Paginated<Product> & { products: Product[] };
type InvoiceList = Paginated<InvoiceListRow> & { invoices: InvoiceListRow[] };
type BillList = Paginated<BillListRow> & { bills: BillListRow[] };
type SalesOrderList = Paginated<SalesOrderRow> & { sales_orders: SalesOrderRow[] };
type PurchaseOrderList = Paginated<PurchaseOrderRow> & { purchase_orders: PurchaseOrderRow[] };
type PaymentList = Paginated<PaymentRow> & { payments: PaymentRow[] };
type BudgetList = Paginated<BudgetListRow> & { budgets: BudgetListRow[] };
type UserList = Paginated<User> & { users: User[] };
type JournalEntryList = Paginated<JournalEntryRow> & { journal_entries: JournalEntryRow[] };

// Error (universal)
interface ApiError { error: { code: string; message: string; field: string | null; details: Record<string, unknown>; }; }
```

---

## PART D — ROUTE TABLE (EXACT ROLE PERMISSIONS)

| Route | Page | Admin | Accountant | User | Layout |
|-------|------|:-----:|:----------:|:----:|--------|
| /login | Login | ✓ | ✓ | ✓ | AuthLayout (redirect if authed) |
| /signup | Sign Up | ✓ | ✓ | ✓ | AuthLayout (redirect if authed) |
| /forgot-password | Forgot Password | ✓ | ✓ | ✓ | AuthLayout |
| /dashboard | Dashboard | ✓ | ✓ | ✗ → /invoices | AppLayout |
| /users | User List | ✓ | ✗ | ✗ | AppLayout |
| /users/new | Create User | ✓ | ✗ | ✗ | AppLayout |
| /contacts | Contact List | ✓ | ✓ | ✗ | AppLayout |
| /contacts/new | Contact Form | ✓ | ✓ | ✗ | AppLayout |
| /contacts/:id | Contact Detail/Edit | ✓ | ✓ | ✗ | AppLayout |
| /products | Product List | ✓ | ✓ | ✗ | AppLayout |
| /products/new | Product Form | ✓ | ✓ | ✗ | AppLayout |
| /products/:id | Product Detail/Edit | ✓ | ✓ | ✗ | AppLayout |
| /categories | Category List | ✓ | ✓ | ✗ | AppLayout |
| /analyticals/new | Analytical Form | ✓ | ✓ | ✗ | AppLayout |
| /analyticals/:id | Analytical Edit | ✓ | ✓ | ✗ | AppLayout |
| /chart-of-accounts | COA List | ✓ | ✓ | ✗ | AppLayout |
| /chart-of-accounts/new | COA Form | ✓ | ✓ | ✗ | AppLayout |
| /journals | Journals List | ✓ | ✓ | ✗ | AppLayout |
| /journal-entries | JE List | ✓ | ✓ | ✗ | AppLayout |
| /journal-entries/new | JE Form | ✓ | ✓ | ✗ | AppLayout |
| /budgets | Budget List | ✓ | ✓ | ✗ | AppLayout |
| /budgets/new | Budget Form | ✓ | ✓ | ✗ | AppLayout |
| /budgets/:id | Budget Detail | ✓ | ✓ | ✗ | AppLayout |
| /sales-orders | SO List | ✓ | ✓ | ✗ | AppLayout |
| /sales-orders/new | SO Form | ✓ | ✓ | ✗ | AppLayout |
| /invoices | Invoice List | ✓ | ✓ | ✓ (own) | AppLayout |
| /invoices/new | Invoice Form | ✓ | ✓ | ✗ | AppLayout |
| /invoices/:id | Invoice Detail | ✓ | ✓ | ✓ (own) | AppLayout |
| /invoices/:id/pay | Invoice Payment | ✓ | ✓ | ✓ (own) | AppLayout |
| /purchase-orders | PO List | ✓ | ✓ | ✗ | AppLayout |
| /purchase-orders/new | PO Form | ✓ | ✓ | ✗ | AppLayout |
| /bills | Bill List | ✓ | ✓ | ✗ (A1) | AppLayout |
| /bills/new | Bill Form | ✓ | ✓ | ✗ (A1) | AppLayout |
| /bills/:id | Bill Detail | ✓ | ✓ | ✗ (A1) | AppLayout |
| /bills/:id/pay | Bill Payment | ✓ | ✓ | ✗ (A1) | AppLayout |
| /payments | Payments List | ✓ | ✓ | ✓ (own) | AppLayout |
| /reports/profit-and-loss | P&L | ✓ | ✓ | ✗ | AppLayout |
| /reports/balance-sheet | Balance Sheet | ✓ | ✓ | ✗ | AppLayout |
| /reports/budget-report | Budget Report | ✓ | ✓ | ✗ | AppLayout |
| / | Root | redirect by role | | | |

**Route guard rules (V2):**
1. `RequireAuth` — no session → /login
2. `RequireRole(['admin','accountant'])` — admin/accountant pages
3. `RequireRole(['admin'])` — /users*
4. User role: any /bills*, /dashboard, master data, reports route → redirect /invoices
5. Backend remains the security boundary (ownership on user routes)

---

## PART E — NAVIGATION (per 23_MATRIX §3 + A18)

### Admin / Accountant
| Tab | Sub-menu | Target |
|-----|----------|--------|
| Account | Users | /users (A18, FLAG) |
| Account | Contact | /contacts |
| Account | Product | /products |
| Account | Analyticals | /analyticals/new |
| Account | Analytical Budget | /budgets |
| Account | Chart of Account | /chart-of-accounts |
| Account | Journals | /journals |
| Account | Journal Entries | /journal-entries |
| Sales | Sales Order | /sales-orders |
| Sales | Sale Invoice | /invoices |
| Sales | Receipt | /payments (A6) |
| Purchase | Purchase Order | /purchase-orders |
| Purchase | Purchase Bill | /bills |
| Purchase | Payment | /payments (A6) |
| Report | Balancesheet | /reports/balance-sheet |
| Report | Profit and Loss | /reports/profit-and-loss |
| Report | Budget Report | /reports/budget-report |

### User (portal)
- "My Invoices" → /invoices (own, per 18 §5 + A3)
- No tabs, no dashboard, no master data, no reports, no bills

---

## PART F — BUTTON CONTRACT (per 23_MATRIX, corrected by A4/A5)

### F1. Invoice Detail (/invoices/:id)
| Button | Roles | Visible When | Enabled When | Action |
|--------|-------|--------------|--------------|--------|
| New | admin, accountant | always | always | → /invoices/new |
| Confirm | admin, accountant | status = draft | lines valid | POST /invoices/:id/confirm |
| Cancel | admin, accountant | status = draft | always | POST /invoices/:id/cancel (A4) — with ConfirmationModal |
| Pay | admin, accountant, user(own) | status = confirmed, amount_due > 0 | always | → /invoices/:id/pay |
| Print | admin, accountant, user(own) | status != draft | always | POST /invoices/:id/print (blob download) |
| Send | admin, accountant, user(own) | status != draft | always | POST /invoices/:id/send (email modal) |
| Back | all | always | always | → /invoices |
| ~~Reset to Draft~~ | — | **REMOVED** (A5) | — | — |

### F2. Bill Detail (/bills/:id)
Same as F1 minus user visibility: New, Confirm, Cancel (POST /bills/:id/cancel), Pay, Print, Send, Back. User never sees this screen (A1).

### F3. Invoice Payment (/invoices/:id/pay)
| Element | Behavior |
|---------|----------|
| Total | read-only from detail (total / total_amount) |
| Amount Due | read-only from detail (amount_due) |
| Paid via | dropdown: bank | cash |
| Amount | number > 0, <= amount_due |
| Pay | POST /invoices/:id/pay `{ amount, payment_via, payment_date }` — disabled while submitting; success → /invoices/:id with toast |
| Back | → /invoices/:id |
| Overpayment error | show backend OVERPAYMENT_NOT_ALLOWED message inline |

### F4. Bill Payment (/bills/:id/pay)
Identical structure to F3, admin/accountant only (A1).

### F5. Budget Detail (/budgets/:id)
| Button | Visible When | Action |
|--------|--------------|--------|
| Confirm | status = draft | PUT /budgets/:id/confirm `{ committed_amount }` — requires amount input |
| Revise | status = confirmed | POST /budgets/:id/revise — disable while submitting (NOT idempotent, 17 §9) |
| Cancel | status != cancelled | PUT /budgets/:id/cancel — ConfirmationModal |

### F6. SO List (/sales-orders) & PO List (/purchase-orders)
| Button | Visible When | Action |
|--------|--------------|--------|
| New | always | → /sales-orders/new or /purchase-orders/new |
| Confirm (row action) | status = draft | PUT /sales-orders/:id/confirm or PUT /purchase-orders/:id/confirm |
| Back | always | → /dashboard |
| No Cancel button (A15 — not in state machine) | | |

### F7. JE Form (/journal-entries/new)
| Element | Behavior |
|---------|----------|
| Add Line | adds line row |
| Line account | dropdown from GET /chart-of-accounts |
| Line partner | dropdown from GET /contacts (optional) |
| Line debit / credit | number >= 0 |
| Total Debit / Total Credit | computed display |
| Balance indicator | "Balanced" / "Unbalanced (X.XX)" |
| Confirm | enabled ONLY when balanced && lines valid → POST /journal-entries — disabled while submitting (NOT idempotent, 17 §9) |
| Back | → /journal-entries |

### F8. Global
- Every form submit button: disabled while request in flight
- Confirm/Cancel/Pay/Revise: ConfirmationModal for destructive/irreversible actions where source requires

---

## PART G — SERVICE MODULES (one per domain)

```
src/services/
  apiClient.ts        // axios instance: VITE_API_URL, withCredentials, 401 → logout+redirect, error normalizer
  authService.ts      // signup, login, logout, me, forgotPassword
  usersService.ts     // list, create
  contactsService.ts  // list, get, create, update
  productsService.ts  // list, get, create, update
  categoriesService.ts// list, create
  analyticalsService.ts // list, create, update
  accountsService.ts  // chart-of-accounts list, create      (A10 path)
  journalsService.ts  // list
  journalEntriesService.ts // list, get, create
  salesOrdersService.ts   // list, create, confirm
  invoicesService.ts      // list, get, create, update, confirm, cancel, pay, print, send
  purchaseOrdersService.ts// list, create, confirm
  billsService.ts         // list, get, create, update, confirm, cancel, pay, print, send
  paymentsService.ts      // list (+ create reserved, A21)
  reportsService.ts       // profitAndLoss, balanceSheet, budgetReport
  dashboardService.ts     // get counts
  uploadService.ts        // file upload
```

**Service methods return typed responses (Part C). No raw fetch in components.**

---

## PART H — ERROR MAPPING (frontend)

| HTTP | Code | UI Behavior |
|------|------|-------------|
| 400 | VALIDATION_ERROR / field errors | inline field errors from `error.field` + message |
| 400 | UNBALANCED_JOURNAL | JE form: "Debit and credit totals do not match" |
| 400 | OVERPAYMENT_NOT_ALLOWED | payment form inline |
| 400 | ALREADY_CONFIRMED / ALREADY_PAID | toast + refetch current state |
| 400 | INVALID_TRANSITION / DRAFT_REQUIRED / CONFIRMED_REQUIRED | toast + refetch |
| 401 | UNAUTHORIZED / INVALID_CREDENTIALS / TOKEN_EXPIRED / INVALID_TOKEN | login page: message; elsewhere: clear session → /login |
| 403 | FORBIDDEN / OWNERSHIP_REQUIRED | "You do not have permission to perform this action" — NO redirect (24 §17) |
| 404 | NOT_FOUND | "Record not found" + Back |
| 409 | DUPLICATE_LOGIN_ID / DUPLICATE_EMAIL / ALREADY_EXISTS | inline field error |
| 429 | RATE_LIMITED | "Too many attempts. Please try again later." |
| 500 | INTERNAL_ERROR / DATABASE_ERROR | "An unexpected error occurred" (no details leak) |

---

## PART I — PHASES (EXECUTION ORDER)

### PHASE 1 — App Shell
**Screens:** none. **Routes:** `/` redirect.  
**Components:** AppLayout, AuthLayout, SidebarNav (role-aware), TopBar, ErrorBoundary, ToastProvider, LoadingProvider, Button, PageHeader, Card, Badge, StatusBadge, DataTable, SearchBar, ViewToggle, Pagination, FormField, SelectField, DateField, CurrencyField, LineItemsTable, ConfirmationModal, LoadingState, EmptyState, ErrorState, FileUpload, ReportTable, DashboardCard.  
**API:** GET /auth/me (session restore).  
**Roles:** all. **Dep:** scaffold.  
**CP-1:** boot, session restore, guards, toast, boundary.

### PHASE 2 — Authentication
**Screens:** Login, SignUp, ForgotPassword.  
**API:** login (A8 nested), signup, logout, me, forgot-password.  
**Roles:** public. **Dep:** P1.  
**CP-2:** full flow + 401/429 handling + role-based post-login redirect (admin/accountant → /dashboard, user → /invoices).

### PHASE 3 — Dashboard + Navigation
**Screens:** Dashboard. **API:** GET /dashboard (A3).  
**Roles:** admin, accountant. **Dep:** P1, P2.  
**CP-3:** tabs/sub-menus (Part E), kanban counts from /dashboard, user redirect.

### PHASE 4 — Master Data + Accounting Setup
**Screens:** Users, Contacts, Products, Categories, Analyticals, COA, Journals, Journal Entries, Budgets.  
**API:** Part B2-B5. **Roles:** admin, accountant (users: admin). **Dep:** P1, P2.  
**CP-4:** all CRUD + duplicate errors + JE balance gate (Flow 5) + budget transitions (F5) + revise double-click guard.

### PHASE 5 — Sales
**Screens:** SO List/Form, Invoice List/Form/Detail/Payment.  
**API:** Part B6. **Roles:** admin, accountant (+ user own on invoices). **Dep:** P1, P4 (contacts/products).  
**CP-5:** Flow 1 end-to-end; button contract F1/F3; amount_due reflects backend.

### PHASE 6 — Purchase
**Screens:** PO List/Form, Bill List/Form/Detail/Payment.  
**API:** Part B7. **Roles:** admin, accountant (A1). **Dep:** P1, P4.  
**CP-6:** Flow 2 end-to-end; F2/F4.

### PHASE 7 — Reports
**Screens:** P&L, Balance Sheet, Budget Report.  
**API:** Part B9 reports. **Roles:** admin, accountant. **Dep:** P4, P5, P6.  
**CP-7:** live data, balance_check display, year selector.

### PHASE 8 — User Portal
**Screens:** Own Invoices, Invoice Detail, Invoice Payment (reuse P5 screens with user guards).  
**API:** invoices + pay. **Roles:** user (own). **Dep:** P5.  
**CP-8:** Flow 4 — user login → own invoices → Pay Now → Paid.

### PHASE 9 — Integration + QA
**Tasks:** verify every endpoint vs Part B; flag mismatches (never silently adapt); responsive (06 §6 breakpoints); accessibility; remove all mock data.  
**CP-9:** full QA per 29_UI_CONTROL_TEST_MATRIX.

---

## PART J — INTEGRATION FLAGS (FOR BACKEND ENGINEER)

| # | Flag | Priority | Detail |
|---|------|----------|--------|
| F-01 | SO/PO/invoice/bill line field names | **HIGH** | Frontend sends 08 names (`account_id`, `analytical_id`, `quantity`, `order_date`). 19/14 use `chart_of_account_id`, `budget_analytic_id`, `qty`, `invoice_date`+`due_date`. MUST confirm. |
| F-02 | Cancel endpoints | HIGH | Frontend calls `POST /invoices/:id/cancel`, `POST /bills/:id/cancel` (17 state machine). Not in 08/19. |
| F-03 | Bill print/send | MEDIUM | Frontend calls `POST /bills/:id/print`, `POST /bills/:id/send`. Only invoice variants in 19. |
| F-04 | User bill access | MEDIUM | 08 lists user (own) for bills; frontend restricts to admin/accountant per 18/23. Backend may enforce either — frontend behavior unchanged. |
| F-05 | Login response shape | LOW | Frontend reads `{ user: {...} }` (22/19). 08 flat is superseded. |
| F-06 | COA path | LOW | Frontend uses `/chart-of-accounts` (19/06). 08 `/accounts` superseded. |
| F-07 | Budget create | LOW | Frontend sends `responsible_id` (19/14). 08 `responsible` string superseded. |
| F-08 | JE status enum | LOW | Frontend renders `draft | posted | cancelled` defensively (08). |
| F-09 | /users nav | LOW | Frontend adds Users nav under Account (admin). Not in 23 matrix. |
| F-10 | payment_date in pay body | LOW | Frontend sends `payment_date` (08), defaults to today (06 mockup has no date field). |

---

## PART K — SUCCESS CRITERIA (V2)

1. Every route in Part D matches exactly one canonical role set.
2. Every endpoint in Part B matches 08 (or documented flag).
3. Every field in Part C is snake_case and matches 08/21.
4. Every button in Part F has one defined backend action; none call non-existent endpoints.
5. No state transition contradicts 17_STATE_MACHINES (A4, A5 resolved).
6. No user-visible route contradicts 18_RBAC (A1, A2, A3 resolved).
7. Backend and frontend integrate without changing field names, endpoint names, status values, role names, request/response structures, auth model, or business rules.

---

*Reconciled by Lead Frontend Engineer on 2026-09-05*  
*Sources: 08_API_CONTRACTS.md, 06_FRONTEND.md, 18_RBAC_MATRIX.md, 17_STATE_MACHINES.md, 23_FRONTEND_SCREEN_CONTROL_MATRIX.md, 19_API_ENDPOINT_CATALOG.md, 21_API_SCHEMA_CATALOG.md, 22_AUTHENTICATION_AND_SESSION.md, 24_LOVABLE_INTEGRATION_GUIDE.md, 05_FEATURES.md, 26_REPORTING_SPEC.md*  
*Ready for execution — start with PHASE 1 (Application Shell)*