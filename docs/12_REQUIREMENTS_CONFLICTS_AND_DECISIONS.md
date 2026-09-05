# 12 — Requirements Conflicts and Decisions

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Conflict Registry

### CONFLICT-001: Role Count Discrepancy

**Conflicting statements:**
- Create User form mockup shows 2 role options: "User" and "Administrator"
- Excalidraw annotations define 3 roles: Admin, User, Accountant

**Source references:**
- Excalidraw Screen 1 (Create User form) — shows radio buttons for 2 roles
- Excalidraw annotation block — lists 3 roles explicitly

**Why conflict exists:** Mockup designer may have simplified the UI or omitted Accountant from the form mockup

**Impact:** High — affects entire RBAC model, all API authorization, all UI rendering

**Chosen interpretation:** Follow annotations (3 roles) — annotations are the authoritative source requirement text; mockup is a visual approximation

**Reason:** Annotations explicitly describe role capabilities; mockup radio buttons are a UI representation, not a requirements statement

**What changes in implementation:** Create User form must have 3 role options: Admin, Accountant, User

**What changes in API:** Role field accepts `admin`, `accountant`, `user`

**What changes in DB:** Enum has 3 values

**What changes in frontend:** Dropdown/radio with 3 options

**What changes in tests:** Test all 3 roles in authorization tests

---

### CONFLICT-002: Sign Up Button Label

**Conflicting statements:**
- Sign Up page button is labeled "SIGN OUT" in mockup

**Source references:**
- Excalidraw Screen 2 (Sign Up page)

**Why conflict exists:** Likely a mockup labeling error — "SIGN OUT" makes no contextual sense on a registration form

**Impact:** Low — UI label only

**Chosen interpretation:** Button label is "SIGN UP" (the action being performed)

**Reason:** Context makes "SIGN OUT" nonsensical on a registration form; this is clearly a mockup typo

**What changes in implementation:** Button text = "SIGN UP"

**What changes in API:** None

**What changes in DB:** None

**What changes in frontend:** Button text = "SIGN UP"

**What changes in tests:** Verify button text

---

### CONFLICT-003: Password Uniqueness Requirement

**Conflicting statements:**
- Excalidraw annotation says "Password must be unique"

**Source references:**
- Excalidraw annotation on Create User form

**Why conflict exists:** Password uniqueness is cryptographically impractical and would require storing plaintext or reversible encryption — directly conflicts with bcrypt hashing requirement

**Impact:** Critical — would break password security model

**Chosen interpretation:** IGNORE password uniqueness requirement — only enforce password complexity

**Reason:** 
1. Bcrypt is a one-way hash — you cannot check if a password was used before
2. Password uniqueness across users is not a standard security practice
3. Would require storing passwords in reversible format, violating security best practices
4. This is likely a mockup misstatement meaning "passwords must be complex"

**What changes in implementation:** No password uniqueness check

**What changes in API:** No uniqueness validation on password

**What changes in DB:** No password uniqueness constraint (only hash stored)

**What changes in frontend:** No password uniqueness messaging

**What changes in tests:** Remove any password uniqueness tests

---

### CONFLICT-004: Create User Role Field Values

**Conflicting statements:**
- Mockup shows "User" and "Administrator" as role options
- Annotations define "User", "Admin", and "Accountant"

**Source references:**
- Excalidraw Screen 1 radio buttons
- Excalidraw annotation text

**Why conflict exists:** Same as CONFLICT-001 but specifically about field values/naming

**Impact:** Medium — naming convention

**Chosen interpretation:** Internal enum values: `admin`, `accountant`, `user`. Display labels: "Administrator", "Accountant", "User (Invoicing)"

**Reason:** Matches annotation descriptions; display labels should be user-friendly

**What changes in implementation:** Dropdown shows friendly names, internal values are lowercase enum

**What changes in API:** Accept `admin`, `accountant`, `user`

**What changes in DB:** ENUM('admin', 'accountant', 'user')

**What changes in frontend:** Display "Administrator" for admin, "Accountant" for accountant, "User (Invoicing)" for user

**What changes in tests:** Test with internal enum values

---

### CONFLICT-005: Authentication Token Delivery

**Conflicting statements:**
- Existing docs show both: (a) JWT returned in response body AND stored in httpOnly cookie, (b) Frontend stores user info in state

**Source references:**
- 03_SYSTEM_ARCHITECTURE.md Section 5.1
- ENGINEERING_ANALYSIS.md Phase 13

**Why conflict exists:** Previous engineering pass didn't fully commit to one auth architecture

**Impact:** Critical — affects entire frontend-backend integration contract

**Chosen interpretation:** USE HttpOnly COOKIE ONLY. JWT is NEVER returned in response body. Frontend stores only non-sensitive user state (id, name, role) obtained from a dedicated `/auth/me` endpoint or from the initial login response's user object (excluding token).

**Reason:**
1. HttpOnly cookies prevent XSS token theft
2. Browser automatically sends cookies — no manual Authorization header needed
3. Simpler frontend code — no token management
4. Industry best practice for web applications

**What changes in implementation:** Login response sets `Set-Cookie` header. No `token` field in response body.

**What changes in API:** 
- Login response: `{ "user": { "id", "name", "login_id", "email", "role" } }` (NO token field)
- Cookie: `auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api`

**What changes in DB:** None

**What changes in frontend:** 
- No localStorage/token storage
- API client uses `credentials: 'include'` 
- No Authorization header needed

**What changes in tests:** Test cookie-based auth, not header-based

---

### CONFLICT-006: ORM Ambiguity

**Conflicting statements:**
- 03_SYSTEM_ARCHITECTURE.md says "pg / Prisma"

**Source references:**
- 03_SYSTEM_ARCHITECTURE.md Section 2

**Why conflict exists:** Previous engineering pass left ORM choice ambiguous

**Impact:** Medium — affects code structure and type safety

**Chosen interpretation:** Prisma ONLY — remove "pg / Prisma" ambiguity

**Reason:** 
1. Prisma provides type-safe database access
2. Automatic migration generation
3. Better developer experience
4. Consistent with Node.js ecosystem

**What changes in implementation:** Use Prisma Client for all database access

**What changes in API:** None (Prisma is implementation detail)

**What changes in DB:** Prisma schema as source of truth, SQL migrations generated

**What changes in frontend:** None

**What changes in tests:** Use Prisma for test setup/teardown

---

### CONFLICT-007: camelCase vs snake_case in Prisma Schema

**Conflicting statements:**
- Existing Prisma schema uses camelCase: `loginId`, `passwordHash`, `createdAt`
- API and DB conventions say snake_case everywhere

**Source references:**
- 07_BACKEND.md Prisma schema example
- MANDATORY ENGINEERING CONVENTIONS section

**Why conflict exists:** Prisma convention is camelCase in schema, but DB should be snake_case

**Impact:** Medium — naming consistency

**Chosen interpretation:** 
- Prisma schema uses camelCase (Prisma convention)
- Prisma `@@map` and `@map` directives map to snake_case in database
- API JSON uses snake_case
- Frontend receives snake_case

**Reason:** Prisma requires camelCase in schema code; `@map` handles DB column naming; API response transformation handles JSON naming

**What changes in implementation:** Add `@map` directives to all fields, `@@map` to all models

**What changes in API:** Response always uses snake_case

**What changes in DB:** All columns are snake_case

**What changes in frontend:** Receives snake_case

**What changes in tests:** Assert snake_case in API responses

---

### CONFLICT-008: Invoice/Bill Cancellation Behavior

**Conflicting statements:**
- Source doesn't explicitly define what happens when a confirmed invoice/bill is cancelled
- Source shows "Cancel" button on invoice/bill forms

**Source references:**
- Excalidraw Screen 12 (Invoice buttons)
- Excalidraw Screen 10 (Bill buttons)

**Why conflict exists:** Cancel button exists but behavior for confirmed documents is not specified

**Impact:** High — accounting implications

**Chosen interpretation:** 
- Draft documents: Cancel = delete/discard
- Confirmed documents: Cancel NOT ALLOWED (would require reversing journal entries)
- Paid documents: Cancel NOT ALLOWED

**Reason:**
1. Source does not define journal entry reversal
2. Reversing accounting entries is complex and error-prone
3. For hackathon scope, only allow cancellation of draft documents
4. If a confirmed document needs correction, create a credit note (post-hackathon)

**What changes in implementation:** Cancel button only enabled for draft status

**What changes in API:** `POST /invoices/:id/cancel` only works when status = 'draft'

**What changes in DB:** None

**What changes in frontend:** Cancel button disabled when status != 'draft'

**What changes in tests:** Test cancel on draft (success), cancel on confirmed (400 error)

---

### CONFLICT-009: Analytical Account vs Budget Structure

**Conflicting statements:**
- Excalidraw shows "Analyticals" and "Analytical Budget" as separate menu items
- Budget form includes "Analytic Account" as a field
- Budget report shows achieved amounts linked to analytics

**Source references:**
- Excalidraw Screen 3 (menu items)
- Excalidraw Screen 8 (budget form)

**Why conflict exists:** Unclear relationship between Analyticals entity and Budget entity

**Impact:** Medium — data model

**Chosen interpretation:**
- `analyticals` table: Represents a cost center/profit center with a responsible person and date range
- `budgets` table: Links to an analytical account, has its own type (Income/Expense), tracks committed and achieved amounts
- Relationship: One analytical account can have multiple budgets (income budget, expense budget)

**Reason:** 
1. Menu shows both as separate items — they are separate entities
2. Budget references analytical for achieved calculation
3. This matches standard accounting practice (analytical accounts track dimensions, budgets track plans)

**What changes in implementation:** Two separate CRUD flows

**What changes in API:** Separate `/analyticals` and `/budgets` endpoints

**What changes in DB:** Separate tables with FK from budgets to analyticals

**What changes in frontend:** Two menu items, two screens

**What changes in tests:** Test both entities independently

---

### CONFLICT-010: Receipt vs Payment Naming

**Conflicting statements:**
- Sales module has "Receipt" sub-item
- Purchase module has "Payment" sub-item
- Both represent the same concept (money movement)

**Source references:**
- Excalidraw Screen 3 (menu items)

**Why conflict exists:** Different terminology for same concept on different sides

**Impact:** Low — naming convention

**Chosen interpretation:**
- Sales side: "Receipt" = money received from customer (payment against invoice)
- Purchase side: "Payment" = money sent to vendor (payment against bill)
- Database table: `payments` (unified)
- API: `/invoices/:id/pay` and `/bills/:id/pay`

**Reason:** 
1. Follows source terminology exactly
2. Unified payment table simplifies accounting
3. Different API endpoints for different contexts

**What changes in implementation:** Sales menu shows "Receipt", Purchase menu shows "Payment"

**What changes in API:** `POST /invoices/:id/pay` (receipt), `POST /bills/:id/pay` (payment)

**What changes in DB:** Single `payments` table with `invoice_id` or `vendor_bill_id`

**What changes in frontend:** Sales → Receipt menu, Purchase → Payment menu

**What changes in tests:** Test both invoice payment and bill payment

---

## 2. ENGINEERING DECISIONS Registry

### ED-001: Primary Key Strategy

**Decision:** UUID for all primary keys

**Reason:**
1. No sequential guessing
2. API-friendly (no exposure of record counts)
3. Distributed-safe
4. Prisma native support

**Applies to:** All tables

---

### ED-002: Monetary Precision

**Decision:** `DECIMAL(15,2)` for all monetary fields

**Reason:**
1. Supports amounts up to 999,999,999,999.99
2. 2 decimal places sufficient for INR
3. Never use floating-point for financial data

**Applies to:** All price, amount, total, debit, credit fields

---

### ED-003: API Versioning

**Decision:** All endpoints under `/api/v1/`

**Reason:**
1. Future compatibility
2. Clear version boundary
3. Industry standard

**Applies to:** All API endpoints

---

### ED-004: Soft Delete vs Hard Delete

**Decision:** 
- Financial records (invoices, bills, payments, journal entries): NEVER delete, only status transitions
- Master data (contacts, products): Soft delete with `deleted_at` timestamp
- Draft documents: Can be hard deleted

**Reason:**
1. Financial audit trail must be preserved
2. Master data may be referenced by historical transactions
3. Draft documents have no accounting impact

**Applies to:** All entities

---

### ED-005: Transaction Isolation

**Decision:**
- READ COMMITTED for general operations
- SERIALIZABLE for financial transaction creation (invoice/bill confirmation + journal entry)

**Reason:**
1. SERIALIZABLE prevents race conditions in financial posting
2. READ COMMITTED sufficient for reads
3. Balance between performance and safety

**Applies to:** All financial write operations

---

### ED-006: CSRF Protection Strategy

**Decision:** SameSite=Strict cookie attribute for CSRF protection

**Reason:**
1. Simplest implementation
2. Modern browser support
3. No additional token management needed

**Applies to:** Authentication cookie

---

### ED-007: Single Payment Table

**Decision:** Unified `payments` table for both invoice receipts and bill payments

**Reason:**
1. Same data structure for both
2. Simplifies accounting queries
3. Differentiated by `invoice_id` vs `vendor_bill_id`

**Applies to:** Payment entity

---

### ED-008: Budget Committed Amount Source

**Decision:** Committed Amount is set by the user when confirming a budget (not computed from lines)

**Reason:**
1. Source says "Committed Amount: Only visible at Confirmed stage"
2. No budget line items defined in source
3. Budget is a planning document — committed amount is a user-entered target

**Applies to:** Budget entity

---

*Document generated from conflict analysis on 2026-09-05*
