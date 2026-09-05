# URBAN FURNITURE ACCOUNTING SYSTEM — BACKEND EXECUTION PLAN

> **24-Hour Hackathon**  
> **Author:** Principal Backend Engineer  
> **Date:** 2026-09-05  
> **Status:** APPROVED FOR EXECUTION

---

## PHASE 0 — PRE-CODING CONTRACT FREEZE

### 0.1 Implementation Assumptions

| # | Assumption | Source | Confidence |
|---|-----------|--------|------------|
| A1 | PostgreSQL 15+ available locally | Standard dev setup | HIGH |
| A2 | Node.js 18+ LTS available | Standard dev setup | HIGH |
| A3 | Prisma schema IS the source of truth for DB | 14_DATABASE_SCHEMA.md | HIGH |
| A4 | Frontend is separate Lovable project, will consume our API | User context | HIGH |
| A5 | No email service needed (mock only) | 01_PRD.md out-of-scope | HIGH |
| A6 | No PDF generation needed for hackathon | SHOULD priority | MEDIUM |
| A7 | No cloud file storage (local only) | 01_PRD.md out-of-scope | HIGH |
| A8 | User deactivation NOT implemented | Hackathon scope | HIGH |
| A9 | Forgot password is mock only | 22_AUTHENTICATION_AND_SESSION.md | HIGH |
| A10 | All 19 tables must exist | 14_DATABASE_SCHEMA.md | HIGH |
| A11 | All 7 PostgreSQL sequences must exist | 25_SEQUENCE_RULES.md | HIGH |
| A12 | All 44+ API endpoints must be implemented | 08_API_CONTRACTS.md | HIGH |

### 0.2 Unresolved Conflicts — NONE

All 10 conflicts are resolved in 12_REQUIREMENTS_CONFLICTS_AND_DECISIONS.md.  
All 8 engineering decisions are frozen.  
No blocking unresolved decisions.

### 0.3 Critical Implementation Details

| Detail | Value | Source |
|--------|-------|--------|
| Cookie name | auth_token | 22_AUTHENTICATION_AND_SESSION.md |
| Cookie HttpOnly | true | FROZEN |
| Cookie Secure | true | FROZEN |
| Cookie SameSite | Strict | FROZEN |
| Cookie Path | /api | FROZEN |
| Cookie Max-Age | 86400 | FROZEN |
| JWT expiry | 15 minutes | FROZEN |
| JWT algorithm | HS256 | FROZEN |
| bcrypt rounds | 12 | FROZEN |
| Login rate limit | 5 per minute per IP | 22_AUTHENTICATION_AND_SESSION.md |
| Signup rate limit | 3 per hour per IP | 22_AUTHENTICATION_AND_SESSION.md |
| API rate limit | 100 per minute per user | 22_AUTHENTICATION_AND_SESSION.md |

---

## DEPENDENCY GRAPH

```
PHASE 0 (Contract Freeze) — no dependencies
    ↓
PHASE 1 (Repo + Env) — depends on: nothing
    ↓
PHASE 2 (Prisma + DB) — depends on: PHASE 1
    ↓
PHASE 3 (Master Data) — depends on: PHASE 2
    ↓
PHASE 4 (Auth) — depends on: PHASE 2, PHASE 3 (needs User table)
    ↓
PHASE 5 (RBAC) — depends on: PHASE 4 (needs auth middleware)
    ↓
PHASE 6 (API Foundation) — depends on: PHASE 1 (can run parallel with 2-5)
    ↓
PHASE 7 (Master APIs) — depends on: PHASE 3, PHASE 5, PHASE 6
    ↓
PHASE 8 (Accounting Core) — depends on: PHASE 2 (needs Journal/COA tables)
    ↓
PHASE 9 (Sequences) — depends on: PHASE 2
    ↓
PHASE 10 (Sales Flow) — depends on: PHASE 7, PHASE 8, PHASE 9
    ↓
PHASE 11 (Purchase Flow) — depends on: PHASE 7, PHASE 8, PHASE 9
    ↓
PHASE 12 (Budget Engine) — depends on: PHASE 7, PHASE 8
    ↓
PHASE 13 (Reports) — depends on: PHASE 8, PHASE 12
    ↓
PHASE 14 (Portal Access) — depends on: PHASE 10, PHASE 11
    ↓
PHASE 15 (PDF/Email) — depends on: PHASE 10, PHASE 11 (can be stubs)
    ↓
PHASE 16 (Audit) — depends on: PHASE 4-13 (cross-cutting)
    ↓
PHASE 17 (Security) — depends on: all above
    ↓
PHASE 18 (Contract Test) — depends on: all above
    ↓
PHASE 19 (E2E Tests) — depends on: all above
    ↓
PHASE 20 (Automated Tests) — depends on: all above
    ↓
PHASE 21 (Frontend Handoff) — depends on: PHASE 18
    ↓
PHASE 22 (Deployment) — depends on: PHASE 20
    ↓
PHASE 23 (Quality Gate) — depends on: all above
```

---

## CRITICAL PATH

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
                                                            ↓
Phase 8 ← Phase 2                                        Phase 7
   ↓                                                      ↓
Phase 9 ← Phase 2                                   Phase 10 + Phase 11
   ↓                                                      ↓
Phase 10 + Phase 11 → Phase 12 → Phase 13               Phase 14
                                   ↓
                              Phase 18 → Phase 21 → Phase 23
```

**Critical path:** Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 10 → 13 → 18 → 23

---

## PARALLELIZABLE TASKS

| Phase | Can Parallelize With | Why |
|-------|---------------------|-----|
| Phase 1 (Repo) | Nothing | Must be first |
| Phase 2 (Prisma) | Nothing | Must be first |
| Phase 6 (API Foundation) | Phases 3, 4, 5 | Utility code, no DB dependency |
| Phase 9 (Sequences) | Phases 3, 4, 5, 6 | Standalone SQL + utility |
| Phase 10 (Sales) | Phase 11 (Purchase) | Independent business flows |
| Phase 15 (PDF/Email) | Phases 12, 13, 14 | Mock implementation |
| Phase 16 (Audit) | Phases 12, 13, 14 | Cross-cutting, can be added last |
| Phase 17 (Security) | Phases 12, 13, 14 | Cross-cutting, can be added last |
| Phase 19 (E2E Tests) | Phase 20 (Unit Tests) | Different test levels |

## TASKS THAT MUST NOT BE PARALLELIZED

| Phase | Why |
|-------|-----|
| Phase 0 → Phase 1 | Must freeze contract before coding |
| Phase 1 → Phase 2 | Must have project before Prisma |
| Phase 2 → Phase 3 | Must have schema before seeding |
| Phase 3 → Phase 4 | Auth needs User table |
| Phase 4 → Phase 5 | RBAC needs auth middleware |
| Phase 8 → Phase 10 | Sales flow needs accounting engine |
| Phase 8 → Phase 11 | Purchase flow needs accounting engine |
| Phase 10/11 → Phase 13 | Reports need transactions |
| Phase 13 → Phase 18 | Contract tests need all endpoints |

---

## TIME ESTIMATES

### First 60 Minutes (HOUR 1)

| Minute | Task | Owner | Output |
|--------|------|-------|--------|
| 0-5 | Phase 0: Final contract review | You + Me | Agreement |
| 5-15 | Phase 1: Initialize Node.js project, install deps | Me | package.json, tsconfig |
| 15-25 | Phase 1: Create directory structure | Me | All directories |
| 25-35 | Phase 1: Create .env, .env.example | Me | Environment config |
| 35-45 | Phase 2: Write Prisma schema (all 19 tables) | Me | schema.prisma |
| 45-55 | Phase 2: Run migration | Me | Migration files |
| 55-60 | Phase 2: Create seed.ts (admin, accountant, user, COA, journals) | Me | Seed data |

**Checkpoint:** Database is live, schema is correct, seed works.

### First 4 Hours (HOURS 1-4)

| Hour | Task | Output |
|------|------|--------|
| 1 | Phase 0-2: Contract, Repo, Prisma, Seed | Working DB |
| 2 | Phase 3: User, Contact, Category, Product models + services | Master data ready |
| 3 | Phase 4: Auth (signup, login, logout, me, forgot-password) | Auth working |
| 4 | Phase 5: RBAC + object auth middleware | Authorization working |

**Checkpoint:** Login flow works end-to-end. Frontend can signup → login → /me.

### First 8 Hours (HOURS 4-8)

| Hour | Task | Output |
|------|------|--------|
| 5 | Phase 6: API foundation (errors, validation, pagination, middleware) | Reusable infra |
| 6 | Phase 7: Master APIs (contacts, products, categories, analyticals, COA, journals) | 16 endpoints |
| 7 | Phase 8: Accounting engine (JE creation, balance validation, account resolution) | Accounting core |
| 8 | Phase 9: Sequence generation (7 sequences) | Number generation |

**Checkpoint:** All master data APIs work. Accounting engine validated independently.

### First 12 Hours (HOURS 8-12)

| Hour | Task | Output |
|------|------|--------|
| 9 | Phase 10: Sales flow (SO, Invoice, confirm, pay) | Sales cycle complete |
| 10 | Phase 11: Purchase flow (PO, Bill, confirm, pay) | Purchase cycle complete |
| 11 | Phase 12: Budget engine (CRUD, confirm, revise, cancel, achievement) | Budget working |
| 12 | Phase 13: Reports (P&L, Balance Sheet, Budget Report) | Reports working |

**Checkpoint:** Full business flow works. Invoices and bills create journal entries.

### Final 4 Hours (HOURS 12-16 effective, compress to 24 with rest)

| Hour | Task | Output |
|------|------|--------|
| 13 | Phase 14-15: Portal access + PDF/Email stubs | User portal |
| 14 | Phase 16-17: Audit logging + security hardening | Security complete |
| 15 | Phase 18: Frontend contract test (smoke test every endpoint) | API verified |
| 16 | Phase 19-20: E2E tests + unit tests | Tests passing |

**Checkpoint:** All endpoints work. Frontend can integrate.

### Remaining 8 Hours (HOURS 16-24)

| Hour | Task | Output |
|------|------|--------|
| 17-18 | Phase 21: Frontend handoff document | Handoff complete |
| 19-20 | Phase 22: Deployment prep (Docker, env, migrations) | Deployable |
| 21-22 | Phase 23: Final quality gate (all checks) | Quality verified |
| 23-24 | Buffer for bug fixes | Stable system |

---

## DETAILED PHASE SPECIFICATIONS

---

### PHASE 0 — PRE-CODING CONTRACT FREEZE

**Objective:** Verify all documentation is consistent before writing code.

**Dependencies:** None.

**Tasks:**
1. Review 14_DATABASE_SCHEMA.md — verify 19 tables, all columns, all constraints
2. Review 08_API_CONTRACTS.md — verify all 44+ endpoints
3. Review 18_RBAC_MATRIX.md — verify all role permissions
4. Review 16_ACCOUNTING_RULES.md — verify all 5 accounting transactions
5. Review 17_STATE_MACHINES.md — verify all entity transitions
6. Review 20_API_ERROR_CATALOG.md — verify all error codes
7. Review 25_SEQUENCE_RULES.md — verify all 7 sequences

**Files to Create:** None  
**Database Impact:** None  
**API Impact:** None  
**Frontend Dependency:** None  
**Tests:** None  
**Definition of Done:** All documentation reviewed, no contradictions found.  
**Blockers:** If contradictions found, STOP and resolve before Phase 1.

---

### PHASE 1 — REPOSITORY & ENVIRONMENT

**Objective:** Initialize the backend project with all tooling.

**Dependencies:** Phase 0 complete.

**Tasks:**
1. `npm init` in backend/
2. Install dependencies:
   - express, cors, cookie-parser, helmet
   - @prisma/client, prisma
   - jsonwebtoken, bcryptjs
   - express-validator, express-rate-limit
   - multer (file upload)
   - uuid
   - dotenv
   - TypeScript, ts-node, tsx
   - Jest, supertest, @types/*
3. Create tsconfig.json
4. Create directory structure:
   ```
   backend/
   ├── src/
   │   ├── config/
   │   ├── middleware/
   │   ├── routes/
   │   ├── controllers/
   │   ├── services/
   │   ├── validators/
   │   ├── utils/
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
5. Create .env with:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/urban_furniture
   JWT_SECRET=your-32-char-secret-here-change-in-production
   JWT_EXPIRY=15m
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```
6. Create health check endpoint: GET /api/v1/health

**Files to Create:**
- backend/package.json
- backend/tsconfig.json
- backend/.env
- backend/.env.example
- backend/src/app.ts (minimal Express server)
- backend/src/config/database.ts (Prisma client)
- backend/src/config/auth.ts (JWT config)

**Database Impact:** None yet  
**API Impact:** GET /api/v1/health  
**Frontend Dependency:** None  
**Tests:** Health check returns 200  
**Definition of Done:** `npm run dev` boots server, health check returns 200.  
**Blockers:** None.

---

### PHASE 2 — POSTGRESQL + PRISMA

**Objective:** Create the complete database schema with all 19 tables.

**Dependencies:** Phase 1 complete.

**Tasks:**
1. Write schema.prisma with ALL 19 models:
   - User, Contact, Category, Product
   - Analytical, Budget
   - ChartOfAccount, Journal, JournalEntry, JournalEntryLine
   - SalesOrder, SalesOrderLine
   - CustomerInvoice, CustomerInvoiceLine
   - PurchaseOrder, PurchaseOrderLine
   - VendorBill, VendorBillLine
   - Payment

2. Include ALL enums:
   - user_role, product_type, account_type, journal_type
   - budget_type, budget_status, je_status
   - invoice_status, payment_type, payment_via, payment_status
   - so_status, po_status

3. Include ALL constraints via @check directives or raw SQL:
   - login_id length 6-12
   - sales_price >= 0, cost >= 0
   - qty > 0, unit_price >= 0
   - amount_due >= 0
   - amount > 0
   - debit >= 0, credit >= 0
   - end_date >= start_date
   - to_date >= start_date
   - end_date >= to_date
   - Payment target check (invoice_id XOR vendor_bill_id)

4. Include ALL indexes (37 total)

5. Include ALL @map and @@map directives for snake_case

6. Run: `npx prisma migrate dev --name init`

7. Create seed.ts with:
   - Admin user (login: admin, password: Admin@123)
   - Accountant user (login: accountant, password: Accountant@123)
   - User (login: user1, password: User@123)
   - 7 Chart of Accounts
   - 4 Journals
   - 1 sample contact (customer)
   - 1 sample contact (vendor)
   - 1 sample category
   - 1 sample product

8. Create PostgreSQL sequences (in seed or migration):
   ```sql
   CREATE SEQUENCE IF NOT EXISTS so_number_seq START 1;
   CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
   CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
   CREATE SEQUENCE IF NOT EXISTS invoice_reference_seq START 1;
   CREATE SEQUENCE IF NOT EXISTS bill_reference_seq START 1;
   CREATE SEQUENCE IF NOT EXISTS je_entry_number_seq START 1;
   CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1;
   ```

**Files to Create:**
- backend/prisma/schema.prisma
- backend/prisma/seed.ts

**Database Impact:** 19 tables, 13 enums, 37 indexes, 7 sequences  
**API Impact:** None yet  
**Frontend Dependency:** None  
**Tests:** Migration runs clean, seed runs clean, Prisma client generates  
**Definition of Done:** `npx prisma migrate dev` succeeds. `npx prisma db seed` succeeds. All tables exist.  
**Blockers:** None.

**SCHEMA SANITY CHECK:**
- [ ] Every FK exists and points to correct table
- [ ] Every relation is valid (one-to-many, many-to-many)
- [ ] Every enum is defined
- [ ] Unique constraints on: login_id, email, so_number, po_number, invoice_reference, invoice_number, bill_reference, entry_number, payment_number, category.name, chart_of_accounts.name, journals.name
- [ ] Check constraints on all monetary fields
- [ ] Timestamps consistent (created_at, updated_at)
- [ ] Soft delete only on: contacts, products
- [ ] CASCADE on line tables, RESTRICT on parent tables

---

### PHASE 3 — MASTER / REFERENCE DATA

**Objective:** Implement foundational entities with full CRUD.

**Dependencies:** Phase 2 complete.

**Dependency Chain:**
```
User (already in seed)
↓
Contact (independent)
↓
Category (independent)
↓
Product (depends on Category)
↓
AnalyticalAccount (depends on Contact)
↓
ChartOfAccount (independent)
↓
Journal (depends on ChartOfAccount)
↓
Budget (depends on Contact, AnalyticalAccount)
```

**For EACH entity implement:**
1. Prisma model (already done in Phase 2)
2. Service (business logic)
3. Validator (express-validator rules)
4. Controller (HTTP handling)
5. Route (Express router)
6. Authorization (role check)

**Files to Create:**
- src/services/contact.service.ts
- src/services/category.service.ts
- src/services/product.service.ts
- src/services/analytical.service.ts
- src/services/chartOfAccount.service.ts
- src/services/journal.service.ts
- src/services/budget.service.ts
- src/validators/contact.validator.ts
- src/validators/product.validator.ts
- src/validators/budget.validator.ts
- src/controllers/contact.controller.ts
- src/controllers/category.controller.ts
- src/controllers/product.controller.ts
- src/controllers/analytical.controller.ts
- src/controllers/chartOfAccount.controller.ts
- src/controllers/journal.controller.ts
- src/controllers/budget.controller.ts
- src/routes/contacts.routes.ts
- src/routes/products.routes.ts
- src/routes/categories.routes.ts
- src/routes/analyticals.routes.ts
- src/routes/chartOfAccounts.routes.ts
- src/routes/journals.routes.ts
- src/routes/budgets.routes.ts

**Database Impact:** Seed data inserted  
**API Impact:** 16 master data endpoints  
**Frontend Dependency:** Frontend needs contacts and products for invoice/bill forms  
**Tests:** CRUD operations work for each entity  
**Definition of Done:** All master data endpoints work with correct RBAC.  
**Blockers:** None.

---

### PHASE 4 — AUTHENTICATION

**Objective:** Implement complete auth flow with HttpOnly cookies.

**Dependencies:** Phase 2 (User table), Phase 3 (User service pattern).

**Tasks:**
1. Create auth middleware (reads cookie, verifies JWT)
2. Create authorize middleware (role check)
3. Create signup endpoint
4. Create login endpoint (set HttpOnly cookie)
5. Create logout endpoint (clear cookie)
6. Create /me endpoint (validate session)
7. Create forgot-password endpoint (mock)
8. Implement rate limiting on login/signup
9. Implement password hashing (bcrypt)
10. Implement validation (login_id length, password complexity, email uniqueness)

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
- src/utils/errors.ts (AppError class)
- src/utils/helpers.ts

**Cookie Implementation:**
```typescript
// In login controller
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api',
  maxAge: 86400 // 24 hours
});
```

**Database Impact:** None (User table exists)  
**API Impact:** 6 auth endpoints + 2 user endpoints  
**Frontend Dependency:** Frontend needs these for login/signup flow  
**Tests:** All 20 auth tests must pass  
**Definition of Done:** Frontend can signup → login → /me → authenticated request → logout.  
**Blockers:** None.

**CRITICAL VALIDATION:**
- [ ] JWT NEVER in response body
- [ ] Cookie HttpOnly = true
- [ ] Cookie Secure = true (production)
- [ ] Cookie SameSite = Strict
- [ ] Cookie Path = /api
- [ ] Cookie Max-Age = 86400
- [ ] Generic error message on login failure
- [ ] Rate limiting: 5 login/min, 3 signup/hour

---

### PHASE 5 — RBAC + OBJECT AUTHORIZATION

**Objective:** Enforce server-side authorization on all endpoints.

**Dependencies:** Phase 4 (auth middleware).

**Tasks:**
1. Create role authorization middleware
2. Create object ownership helper
3. Create user-contact resolution (email match for user role)
4. Apply to all protected routes
5. Test every role against every resource

**Files to Create:**
- src/middleware/authorize.ts (enhance with object-level)
- src/utils/ownership.ts

**Authorization Rules:**
```typescript
// Role check
const requireRole = (...roles: string[]) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
  }
  next();
};

// Object ownership check
const checkOwnership = (resourceType: string) => async (req, res, next) => {
  if (req.user.role === 'user') {
    const userContact = await prisma.contact.findFirst({ where: { email: req.user.email } });
    if (!userContact) return res.status(403).json({ error: { code: 'OWNERSHIP_REQUIRED' } });
    
    if (resourceType === 'invoice') {
      const invoice = await prisma.customerInvoice.findUnique({ where: { id: req.params.id } });
      if (invoice.customer_id !== userContact.id) {
        return res.status(403).json({ error: { code: 'OWNERSHIP_REQUIRED' } });
      }
    }
    // Similar for payments
  }
  next();
};
```

**Database Impact:** None  
**API Impact:** All endpoints now enforce RBAC  
**Frontend Dependency:** None  
**Tests:** All 13 authz tests + 4 IDOR tests must pass  
**Definition of Done:** No protected endpoint is accessible without correct permission.  
**Blockers:** None.

---

### PHASE 6 — GENERIC API FOUNDATION

**Objective:** Create reusable backend infrastructure.

**Dependencies:** Phase 1 (can run parallel with Phases 2-5).

**Tasks:**
1. AppError class with error codes
2. Global error handler middleware
3. Validation middleware wrapper
4. Pagination utility
5. Filtering/sorting/search utilities
6. Database transaction wrapper
7. UUID validation helper
8. Date validation helper
9. Decimal/money handling
10. Async error handler wrapper
11. Request logging
12. Response transformer (snake_case)

**Files to Create:**
- src/utils/errors.ts (AppError class)
- src/utils/pagination.ts
- src/utils/filters.ts
- src/utils/transactions.ts (Prisma transaction wrapper)
- src/utils/validators.ts (UUID, date, decimal)
- src/utils/transformers.ts (camelCase to snake_case)
- src/middleware/errorHandler.ts (global)
- src/middleware/validate.ts (express-validator wrapper)

**AppError Class:**
```typescript
class AppError extends Error {
  code: string;
  statusCode: number;
  field?: string;
  details?: any;
  
  constructor(code: string, message: string, statusCode: number = 400, field?: string, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
    this.details = details;
  }
}
```

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

**Database Impact:** None  
**API Impact:** All endpoints now use consistent error handling  
**Frontend Dependency:** Frontend can rely on consistent error format  
**Tests:** Error handling works correctly  
**Definition of Done:** All error responses follow canonical format.  
**Blockers:** None.

---

### PHASE 7 — MASTER APIs

**Objective:** Implement and test all master data endpoints.

**Dependencies:** Phase 3, Phase 5, Phase 6.

**Endpoints to Implement:**
| # | Method | Path | Role |
|---|--------|------|------|
| 1 | GET | /api/v1/contacts | admin, accountant |
| 2 | POST | /api/v1/contacts | admin, accountant |
| 3 | GET | /api/v1/contacts/:id | admin, accountant |
| 4 | PUT | /api/v1/contacts/:id | admin, accountant |
| 5 | GET | /api/v1/products | admin, accountant |
| 6 | POST | /api/v1/products | admin, accountant |
| 7 | GET | /api/v1/products/:id | admin, accountant |
| 8 | PUT | /api/v1/products/:id | admin, accountant |
| 9 | GET | /api/v1/categories | admin, accountant |
| 10 | POST | /api/v1/categories | admin, accountant |
| 11 | GET | /api/v1/analyticals | admin, accountant |
| 12 | POST | /api/v1/analyticals | admin, accountant |
| 13 | GET | /api/v1/chart-of-accounts | admin, accountant |
| 14 | POST | /api/v1/chart-of-accounts | admin, accountant |
| 15 | GET | /api/v1/journals | admin, accountant |

**For EACH endpoint verify:**
- [ ] Request fields match API contract
- [ ] Response fields match API contract
- [ ] Status codes correct
- [ ] Role enforcement correct
- [ ] Validation works
- [ ] Error codes correct
- [ ] Pagination works (where applicable)

**Database Impact:** None  
**API Impact:** 15 master data endpoints  
**Frontend Dependency:** Frontend needs contacts, products, COA, journals for forms  
**Tests:** All CRUD tests pass  
**Definition of Done:** All master data endpoints match API contract exactly.  
**Blockers:** None.

---

### PHASE 8 — JOURNAL / ACCOUNTING CORE

**Objective:** Build the accounting engine as isolated business logic.

**Dependencies:** Phase 2 (Journal, JournalEntry, JournalEntryLine, COA tables).

**Tasks:**
1. Create accounting service with:
   - createJournalEntry()
   - createJournalEntryLines()
   - validateJournalBalance()
   - resolveAccount()
   - resolveJournal()
   - postAccountingEntry()
   - linkSourceDocument()
   - preventDuplicatePosting()

2. Create journal entry controller (manual entries)

3. Create journal entry routes

**Core Invariant:**
```typescript
function verifyJournalBalance(lines: { debit: number; credit: number }[]): void {
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError('UNBALANCED_JOURNAL', `Debit ${totalDebit} ≠ Credit ${totalCredit}`);
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

**Files to Create:**
- src/services/accounting.service.ts
- src/services/journalEntry.service.ts
- src/controllers/journalEntry.controller.ts
- src/routes/journalEntries.routes.ts
- src/validators/journalEntry.validator.ts

**Database Impact:** None  
**API Impact:** 3 journal entry endpoints  
**Frontend Dependency:** Frontend needs journal entries for manual entry form  
**Tests:** Balance validation works, atomic transactions work  
**Definition of Done:** Accounting engine works independently. Balanced entries accepted, unbalanced rejected.  
**Blockers:** None.

**CRITICAL TESTS:**
- [ ] Valid balanced entry accepted
- [ ] Unbalanced entry rejected
- [ ] Zero amounts rejected
- [ ] Negative amounts rejected
- [ ] Transaction rollback on failure
- [ ] Duplicate posting prevented

---

### PHASE 9 — SEQUENCE GENERATION

**Objective:** Implement server-side document numbering.

**Dependencies:** Phase 2 (PostgreSQL sequences).

**Tasks:**
1. Create sequence utility functions:
   - generateSONumber()
   - generateInvoiceReference()
   - generateInvoiceNumber()
   - generatePONumber()
   - generateBillReference()
   - generateJENumber()
   - generatePaymentNumber()

2. Test concurrent generation

**Files to Create:**
- src/utils/sequences.ts

**Sequence Implementation:**
```typescript
async function generateSONumber(): Promise<string> {
  const result = await prisma.$queryRaw`SELECT nextval('so_number_seq') as next`;
  return `S${String(result[0].next).padStart(5, '0')}`;
}

async function generateInvoiceReference(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await prisma.$queryRaw`SELECT nextval('invoice_reference_seq') as next`;
  return `INV/${year}/${String(result[0].next).padStart(4, '0')}`;
}

async function generateInvoiceNumber(): Promise<string> {
  const result = await prisma.$queryRaw`SELECT nextval('invoice_number_seq') as next`;
  return `INV-${String(result[0].next).padStart(5, '0')}`;
}

async function generatePONumber(): Promise<string> {
  const result = await prisma.$queryRaw`SELECT nextval('po_number_seq') as next`;
  return `P${String(result[0].next).padStart(5, '0')}`;
}

async function generateBillReference(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await prisma.$queryRaw`SELECT nextval('bill_reference_seq') as next`;
  return `Bill/${year}/${String(result[0].next).padStart(4, '0')}`;
}

async function generateJENumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await prisma.$queryRaw`SELECT nextval('je_entry_number_seq') as next`;
  return `JE/${year}/${String(result[0].next).padStart(4, '0')}`;
}

async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await prisma.$queryRaw`SELECT nextval('payment_number_seq') as next`;
  return `PAY/${year}/${String(result[0].next).padStart(4, '0')}`;
}
```

**Database Impact:** Sequences already created in Phase 2  
**API Impact:** Number generation available for all document types  
**Frontend Dependency:** None (server generates numbers)  
**Tests:** Concurrent generation produces unique numbers  
**Definition of Done:** All 7 sequence generators work correctly.  
**Blockers:** None.

---

### PHASE 10 — SALES FLOW

**Objective:** Implement complete sales cycle.

**Dependencies:** Phase 7 (Master APIs), Phase 8 (Accounting), Phase 9 (Sequences).

**Flow:**
```
Sales Order → Invoice → Confirm → JE Created → Payment → Paid
```

**Endpoints:**
| # | Method | Path | Notes |
|---|--------|------|-------|
| 1 | GET | /api/v1/sales-orders | List with pagination |
| 2 | POST | /api/v1/sales-orders | Create with lines |
| 3 | PUT | /api/v1/sales-orders/:id/confirm | Confirm SO |
| 4 | GET | /api/v1/invoices | List with filters |
| 5 | POST | /api/v1/invoices | Create with lines |
| 6 | GET | /api/v1/invoices/:id | Detail with lines |
| 7 | PUT | /api/v1/invoices/:id | Update (draft only) |
| 8 | POST | /api/v1/invoices/:id/confirm | ATOMIC: Confirm + JE |
| 9 | POST | /api/v1/invoices/:id/pay | ATOMIC: Payment + JE |
| 10 | POST | /api/v1/invoices/:id/print | PDF stub |
| 11 | POST | /api/v1/invoices/:id/send | Email stub |

**Invoice Confirmation (ATOMIC TRANSACTION):**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock and validate
  const invoice = await tx.customerInvoice.findUnique({ where: { id } });
  if (invoice.status !== 'draft') throw new AppError('ALREADY_CONFIRMED');
  
  // 2. Calculate total server-side
  const lines = await tx.customerInvoiceLine.findMany({ where: { invoice_id: id } });
  const total = lines.reduce((sum, l) => sum + Number(l.qty) * Number(l.unit_price), 0);
  
  // 3. Create JE
  const je = await tx.journalEntry.create({
    data: {
      entry_number: await generateJENumber(),
      accounting_date: invoice.invoice_date,
      journal_id: salesJournal.id,
      source_document_type: 'invoice',
      source_document_id: invoice.id,
      status: 'posted',
      created_by: req.user.id
    }
  });
  
  // 4. Create JE lines
  await tx.journalEntryLine.createMany({
    data: [
      { journal_entry_id: je.id, account_id: debtorsAccount.id, debit: total, credit: 0, partner_id: invoice.customer_id },
      { journal_entry_id: je.id, account_id: salesIncomeAccount.id, debit: 0, credit: total }
    ]
  });
  
  // 5. Update invoice
  await tx.customerInvoice.update({
    where: { id },
    data: { status: 'confirmed', total, amount_due: total, journal_entry_id: je.id }
  });
});
```

**Invoice Payment (ATOMIC TRANSACTION):**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock and validate
  const invoice = await tx.customerInvoice.findUnique({ where: { id } });
  if (invoice.status !== 'confirmed') throw new AppError('CONFIRMED_REQUIRED');
  if (Number(invoice.amount_due) < paymentAmount) throw new AppError('OVERPAYMENT_NOT_ALLOWED');
  
  // 2. Create payment
  const payment = await tx.payment.create({
    data: {
      payment_number: await generatePaymentNumber(),
      invoice_id: id,
      amount: paymentAmount,
      payment_via: paymentVia,
      payment_date,
      status: 'successful',
      created_by: req.user.id
    }
  });
  
  // 3. Create JE
  const je = await tx.journalEntry.create({
    data: {
      entry_number: await generateJENumber(),
      accounting_date: paymentDate,
      journal_id: bankJournal.id,
      source_document_type: 'payment',
      source_document_id: payment.id,
      status: 'posted',
      created_by: req.user.id
    }
  });
  
  // 4. Create JE lines (Bank debit, Debtors credit)
  await tx.journalEntryLine.createMany({
    data: [
      { journal_entry_id: je.id, account_id: bankAccount.id, debit: paymentAmount, credit: 0 },
      { journal_entry_id: je.id, account_id: debtorsAccount.id, debit: 0, credit: paymentAmount, partner_id: invoice.customer_id }
    ]
  });
  
  // 5. Update invoice
  const newAmountDue = Number(invoice.amount_due) - paymentAmount;
  await tx.customerInvoice.update({
    where: { id },
    data: {
      amount_due: newAmountDue,
      status: newAmountDue === 0 ? 'paid' : 'confirmed'
    }
  });
});
```

**Files to Create:**
- src/services/salesOrder.service.ts
- src/services/invoice.service.ts
- src/controllers/salesOrder.controller.ts
- src/controllers/invoice.controller.ts
- src/routes/salesOrders.routes.ts
- src/routes/invoices.routes.ts
- src/validators/invoice.validator.ts

**Database Impact:** None  
**API Impact:** 11 sales endpoints  
**Frontend Dependency:** Frontend needs these for sales screens  
**Tests:** All invoice tests (15) must pass  
**Definition of Done:** Full sales cycle works: SO → Invoice → Confirm → JE → Payment → Paid.  
**Blockers:** None.

---

### PHASE 11 — PURCHASE FLOW

**Objective:** Implement complete purchase cycle.

**Dependencies:** Phase 7, Phase 8, Phase 9.

**Flow:**
```
Purchase Order → Bill → Confirm → JE Created → Payment → Paid
```

**Endpoints:**
| # | Method | Path | Notes |
|---|--------|------|-------|
| 1 | GET | /api/v1/purchase-orders | List with pagination |
| 2 | POST | /api/v1/purchase-orders | Create with lines |
| 3 | PUT | /api/v1/purchase-orders/:id/confirm | Confirm PO |
| 4 | GET | /api/v1/bills | List with filters |
| 5 | POST | /api/v1/bills | Create with lines |
| 6 | GET | /api/v1/bills/:id | Detail with lines |
| 7 | POST | /api/v1/bills/:id/confirm | ATOMIC: Confirm + JE |
| 8 | POST | /api/v1/bills/:id/pay | ATOMIC: Payment + JE |
| 9 | POST | /api/v1/bills/:id/print | PDF stub |
| 10 | POST | /api/v1/bills/:id/send | Email stub |

**Bill Confirmation (ATOMIC TRANSACTION):**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock and validate
  const bill = await tx.vendorBill.findUnique({ where: { id } });
  if (bill.status !== 'draft') throw new AppError('ALREADY_CONFIRMED');
  
  // 2. Calculate total
  const lines = await tx.vendorBillLine.findMany({ where: { vendor_bill_id: id } });
  const total = lines.reduce((sum, l) => sum + Number(l.qty) * Number(l.unit_price), 0);
  
  // 3. Create JE
  const je = await tx.journalEntry.create({
    data: {
      entry_number: await generateJENumber(),
      accounting_date: bill.bill_date,
      journal_id: purchaseJournal.id,
      source_document_type: 'bill',
      source_document_id: bill.id,
      status: 'posted',
      created_by: req.user.id
    }
  });
  
  // 4. Create JE lines (Purchase debit, Creditors credit)
  await tx.journalEntryLine.createMany({
    data: [
      { journal_entry_id: je.id, account_id: purchaseExpenseAccount.id, debit: total, credit: 0 },
      { journal_entry_id: je.id, account_id: creditorsAccount.id, debit: 0, credit: total, partner_id: bill.vendor_id }
    ]
  });
  
  // 5. Update bill
  await tx.vendorBill.update({
    where: { id },
    data: { status: 'confirmed', total, amount_due: total, journal_entry_id: je.id }
  });
});
```

**Files to Create:**
- src/services/purchaseOrder.service.ts
- src/services/bill.service.ts
- src/controllers/purchaseOrder.controller.ts
- src/controllers/bill.controller.ts
- src/routes/purchaseOrders.routes.ts
- src/routes/bills.routes.ts
- src/validators/bill.validator.ts

**Database Impact:** None  
**API Impact:** 10 purchase endpoints  
**Frontend Dependency:** Frontend needs these for purchase screens  
**Tests:** All bill tests (15) must pass  
**Definition of Done:** Full purchase cycle works.  
**Blockers:** None.

---

### PHASE 12 — BUDGET ENGINE

**Objective:** Implement budget lifecycle with achievement calculation.

**Dependencies:** Phase 7 (Master APIs), Phase 8 (Accounting).

**Endpoints:**
| # | Method | Path | Notes |
|---|--------|------|-------|
| 1 | GET | /api/v1/budgets | List with filters |
| 2 | POST | /api/v1/budgets | Create (draft) |
| 3 | GET | /api/v1/budgets/:id | Detail |
| 4 | PUT | /api/v1/budgets/:id | Update (draft only) |
| 5 | PUT | /api/v1/budgets/:id/confirm | Confirm (sets committed_amount) |
| 6 | POST | /api/v1/budgets/:id/revise | Revise (creates new draft) |
| 7 | PUT | /api/v1/budgets/:id/cancel | Cancel (is_archived=true) |

**Achievement Calculation:**
```typescript
async function calculateAchievement(budget: Budget) {
  if (budget.type === 'income') {
    const result = await prisma.customerInvoiceLine.aggregate({
      where: {
        budget_analytic_id: budget.analytical_id,
        invoice: {
          status: { in: ['confirmed', 'paid'] },
          invoice_date: { gte: budget.start_date, lte: budget.end_date }
        }
      },
      _sum: { total: true }
    });
    return Number(result._sum.total || 0);
  } else {
    const result = await prisma.vendorBillLine.aggregate({
      where: {
        budget_analytic_id: budget.analytical_id,
        vendor_bill: {
          status: { in: ['confirmed', 'paid'] },
          bill_date: { gte: budget.start_date, lte: budget.end_date }
        }
      },
      _sum: { total: true }
    });
    return Number(result._sum.total || 0);
  }
}
```

**Files to Create:**
- src/services/budget.service.ts (enhance with achievement)
- src/controllers/budget.controller.ts (enhance with transitions)
- src/routes/budgets.routes.ts (enhance with transition endpoints)

**Database Impact:** None  
**API Impact:** 7 budget endpoints  
**Frontend Dependency:** Frontend needs budgets for budget screens  
**Tests:** All budget tests (7) must pass  
**Definition of Done:** Budget lifecycle works with achievement calculation.  
**Blockers:** None.

---

### PHASE 13 — REPORT ENGINE

**Objective:** Implement all financial reports.

**Dependencies:** Phase 8 (Accounting), Phase 12 (Budgets).

**Endpoints:**
| # | Method | Path | Notes |
|---|--------|------|-------|
| 1 | GET | /api/v1/reports/profit-and-loss?year= | P&L report |
| 2 | GET | /api/v1/reports/balance-sheet?year= | Balance sheet |
| 3 | GET | /api/v1/reports/budget-report?year=&type= | Budget report |
| 4 | GET | /api/v1/dashboard | Kanban counts |

**P&L Query:**
```typescript
async function getProfitAndLoss(year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const income = await prisma.journalEntryLine.groupBy({
    by: ['account_id'],
    where: {
      account: { account_type: 'income' },
      journal_entry: { accounting_date: { gte: startDate, lte: endDate } }
    },
    _sum: { credit: true }
  });
  
  const expenses = await prisma.journalEntryLine.groupBy({
    by: ['account_id'],
    where: {
      account: { account_type: 'expense' },
      journal_entry: { accounting_date: { gte: startDate, lte: endDate } }
    },
    _sum: { debit: true }
  });
  
  // Format response
  return {
    year,
    income: {
      items: income.map(i => ({ account_name: getAccountName(i.account_id), amount: Number(i._sum.credit) })),
      total: income.reduce((sum, i) => sum + Number(i._sum.credit), 0)
    },
    expenses: {
      items: expenses.map(e => ({ account_name: getAccountName(e.account_id), amount: Number(e._sum.debit) })),
      total: expenses.reduce((sum, e) => sum + Number(e._sum.debit), 0)
    },
    net_income: incomeTotal - expensesTotal
  };
}
```

**Balance Sheet Query:**
```typescript
async function getBalanceSheet(year: number) {
  const endDate = new Date(year, 11, 31);
  
  const assets = await prisma.journalEntryLine.aggregate({
    where: {
      account: { account_type: { in: ['asset', 'bank', 'cash'] } },
      journal_entry: { accounting_date: { lte: endDate } }
    },
    _sum: { debit: true, credit: true }
  });
  
  const liabilities = await prisma.journalEntryLine.aggregate({
    where: {
      account: { account_type: { in: ['liability', 'capital', 'income'] } },
      journal_entry: { accounting_date: { lte: endDate } }
    },
    _sum: { debit: true, credit: true }
  });
  
  const totalAssets = Number(assets._sum.debit || 0) - Number(assets._sum.credit || 0);
  const totalLiabilities = Number(liabilities._sum.credit || 0) - Number(liabilities._sum.debit || 0);
  
  return {
    year,
    assets: { items: [...], total: totalAssets },
    liabilities: { items: [...], total: totalLiabilities },
    balance_check: Math.abs(totalAssets - totalLiabilities) < 0.01
  };
}
```

**Files to Create:**
- src/services/report.service.ts
- src/controllers/report.controller.ts
- src/routes/reports.routes.ts
- src/controllers/dashboard.controller.ts
- src/routes/dashboard.routes.ts

**Database Impact:** None  
**API Impact:** 4 report endpoints  
**Frontend Dependency:** Frontend needs reports for report screens  
**Tests:** All report tests (10) must pass  
**Definition of Done:** Reports return correct data from live transactions.  
**Blockers:** None.

---

### PHASE 14 — PORTAL / USER ACCESS

**Objective:** Implement user-specific visibility.

**Dependencies:** Phase 10, Phase 11.

**Tasks:**
1. Filter invoices by customer_id (user role)
2. Filter payments by invoice_id (user role)
3. Enforce ownership on pay endpoint
4. Test IDOR prevention

**Files to Modify:**
- src/controllers/invoice.controller.ts (add ownership filter)
- src/controllers/payment.controller.ts (add ownership filter)

**Database Impact:** None  
**API Impact:** Existing endpoints now filter by ownership  
**Frontend Dependency:** User can see own invoices  
**Tests:** IDOR tests pass  
**Definition of Done:** User A cannot read User B's records.  
**Blockers:** None.

---

### PHASE 15 — PDF / EMAIL / EXTERNAL SIDE EFFECTS

**Objective:** Implement source-required external effects (stubs).

**Dependencies:** Phase 10, Phase 11.

**Tasks:**
1. PDF generation stub (returns placeholder)
2. Email send stub (logs to console)
3. Ensure external failures don't corrupt financial data

**Files to Create:**
- src/services/pdf.service.ts (stub)
- src/services/email.service.ts (stub)

**Database Impact:** None  
**API Impact:** Print/send endpoints return success  
**Frontend Dependency:** Frontend can call print/send  
**Tests:** Stubs return success  
**Definition of Done:** Print/send work as stubs.  
**Blockers:** None.

---

### PHASE 16 — AUDIT LOGGING

**Objective:** Implement audit trail for financial actions.

**Dependencies:** Phases 4-13.

**Tasks:**
1. Create audit_logs table (if required by final scope)
2. Log: login, signup, invoice confirm, bill confirm, payment
3. Never log: passwords, tokens, secrets

**Files to Create:**
- src/middleware/audit.ts (if implementing)

**Database Impact:** Optional audit_logs table  
**API Impact:** None  
**Frontend Dependency:** None  
**Tests:** Audit logs created for financial actions  
**Definition of Done:** Financial actions are auditable.  
**Blockers:** None.

---

### PHASE 17 — SECURITY HARDENING

**Objective:** Apply security best practices.

**Dependencies:** All above phases.

**Tasks:**
1. Helmet security headers
2. CORS configuration
3. CSRF protection (SameSite=Strict already)
4. Secure cookies (already implemented)
5. Rate limiting (already implemented)
6. Input validation (already implemented)
7. SQL injection protection (Prisma handles)
8. XSS protection (JSON responses only)
9. Mass assignment protection (explicit field selection)
10. IDOR protection (already implemented)
11. UUID validation
12. File upload validation (MIME type, size)
13. Secrets management (env vars)
14. Sanitized production errors

**Files to Modify:**
- src/app.ts (add helmet, cors config)
- src/middleware/errorHandler.ts (sanitize in production)

**Database Impact:** None  
**API Impact:** All endpoints now secure  
**Frontend Dependency:** None  
**Tests:** Security tests pass  
**Definition of Done:** Security checklist complete.  
**Blockers:** None.

---

### PHASE 18 — FRONTEND INTEGRATION CONTRACT TEST

**Objective:** Verify every endpoint against API contract.

**Dependencies:** All above phases.

**Tasks:**
1. Create smoke test collection for ALL endpoints
2. Test every endpoint with:
   - Valid request
   - Authentication
   - Authorization
   - Response schema
   - Error responses
   - Status codes
3. Document any deviations

**Files to Create:**
- tests/contract/smoke.test.ts

**Database Impact:** None  
**API Impact:** None  
**Frontend Dependency:** Frontend can rely on API contract  
**Tests:** All smoke tests pass  
**Definition of Done:** Every endpoint matches API contract.  
**Blockers:** None.

---

### PHASE 19 — FULL E2E BUSINESS TESTS

**Objective:** Execute complete business scenarios.

**Dependencies:** All above phases.

**Scenarios:**
```
Scenario A: Sales Cycle
Login → Create Contact → Create Product → Create SO → Create Invoice → Confirm → Check JE → Pay → Check P&L

Scenario B: Purchase Cycle
Login → Create Contact → Create Product → Create PO → Create Bill → Confirm → Check JE → Pay → Check P&L

Scenario C: User Portal
User Login → View Own Invoice → Pay → Check Paid Status

Scenario D: Budget
Create Analytical → Create Budget → Confirm → Create matching Invoice → Check Achievement

Scenario E: Invalid Journal
Create unbalanced JE → Verify rejected → Verify no partial mutation
```

**Files to Create:**
- tests/e2e/sales.test.ts
- tests/e2e/purchase.test.ts
- tests/e2e/portal.test.ts
- tests/e2e/budget.test.ts
- tests/e2e/accounting.test.ts

**Database Impact:** Test data created and cleaned up  
**API Impact:** None  
**Frontend Dependency:** None  
**Tests:** All E2E scenarios pass  
**Definition of Done:** Complete business flows work end-to-end.  
**Blockers:** None.

---

### PHASE 20 — AUTOMATED TESTING

**Objective:** Implement comprehensive test suite.

**Dependencies:** All above phases.

**Test Categories:**
1. Unit tests (validators, utilities)
2. Service tests (business logic)
3. API integration tests (Supertest)
4. Authorization tests
5. Security tests

**Files to Create:**
- tests/unit/validators.test.ts
- tests/unit/sequences.test.ts
- tests/services/accounting.test.ts
- tests/integration/auth.test.ts
- tests/integration/contacts.test.ts
- tests/integration/products.test.ts
- tests/integration/invoices.test.ts
- tests/integration/bills.test.ts
- tests/integration/budgets.test.ts
- tests/integration/reports.test.ts
- tests/authorization/rbac.test.ts
- tests/security/idor.test.ts

**Database Impact:** Test database required  
**API Impact:** None  
**Frontend Dependency:** None  
**Tests:** All test suites pass  
**Definition of Done:** Test coverage > 80% for critical paths.  
**Blockers:** None.

---

### PHASE 21 — FRONTEND HANDOFF

**Objective:** Produce frontend integration guide.

**Dependencies:** Phase 18 complete.

**Deliverables:**
1. Base URL
2. Auth model (cookie-based)
3. Cookie behavior
4. Endpoint status (all working)
5. Seed credentials
6. Sample workflows
7. Environment variables
8. Integration smoke tests

**Files to Create:**
- docs/FRONTEND_HANDOFF.md

**Database Impact:** None  
**API Impact:** None  
**Frontend Dependency:** Frontend can integrate  
**Tests:** None  
**Definition of Done:** Frontend developer can integrate without asking questions.  
**Blockers:** None.

---

### PHASE 22 — DEPLOYMENT

**Objective:** Prepare for production deployment.

**Dependencies:** Phase 20 complete.

**Tasks:**
1. Production build script
2. Environment configuration
3. PostgreSQL production connection
4. Migration strategy
5. Seed strategy
6. CORS configuration
7. HTTPS assumptions
8. Health check
9. Logging
10. Backup/recovery basics
11. Smoke tests

**Files to Create:**
- Dockerfile
- docker-compose.yml
- scripts/deploy.sh
- scripts/seed-production.sh

**Database Impact:** Production database setup  
**API Impact:** None  
**Frontend Dependency:** None  
**Tests:** Deployment smoke tests  
**Definition of Done:** System deployable to production.  
**Blockers:** None.

---

### PHASE 23 — FINAL QUALITY GATE

**Objective:** Verify complete system quality.

**Dependencies:** All above phases.

**Checklist:**

#### DATABASE CHECK
- [ ] Schema matches 14_DATABASE_SCHEMA.md exactly
- [ ] All constraints enforced
- [ ] All migrations clean
- [ ] All indexes exist
- [ ] Seed data correct

#### AUTH CHECK
- [ ] Signup works
- [ ] Login works
- [ ] Logout works
- [ ] Session validation works
- [ ] Password hashing works
- [ ] Rate limiting works
- [ ] CSRF protection works

#### RBAC CHECK
- [ ] Admin access correct
- [ ] Accountant access correct
- [ ] User access correct
- [ ] Object ownership enforced

#### ACCOUNTING CHECK
- [ ] Invoice posting creates balanced JE
- [ ] Bill posting creates balanced JE
- [ ] Payment posting creates balanced JE
- [ ] Manual JE validates balance
- [ ] Rollback on failure
- [ ] Duplicate posting prevented

#### BUSINESS CHECK
- [ ] Sales cycle complete
- [ ] Purchase cycle complete
- [ ] Budget lifecycle complete
- [ ] Reports accurate
- [ ] Portal access correct

#### API CHECK
- [ ] All 44+ endpoints working
- [ ] All schemas match contract
- [ ] All error codes correct
- [ ] All role rules enforced

#### SECURITY CHECK
- [ ] IDOR prevented
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (JSON only)
- [ ] CSRF prevented (SameSite=Strict)
- [ ] Brute force prevented (rate limiting)
- [ ] Privilege escalation prevented
- [ ] Secrets not in Git
- [ ] File uploads validated

#### INTEGRATION CHECK
- [ ] Frontend can call every endpoint
- [ ] Field names identical (snake_case)
- [ ] Enums identical
- [ ] Dates identical (ISO 8601)
- [ ] Money format identical (DECIMAL(15,2))

**Database Impact:** None  
**API Impact:** None  
**Frontend Dependency:** Integration verified  
**Tests:** All quality checks pass  
**Definition of Done:** System meets all requirements.  
**Blockers:** None.

---

## INTEGRATION CHECKPOINTS

| Checkpoint | Time | Verify | Go/No-Go |
|-----------|------|--------|----------|
| CP1 | Hour 2 | DB schema, seed, auth middleware | Must pass |
| CP2 | Hour 4 | Login/signup/logout/me flow | Must pass |
| CP3 | Hour 6 | Master data CRUD | Must pass |
| CP4 | Hour 8 | Accounting engine isolated | Must pass |
| CP5 | Hour 10 | Invoice confirm creates JE | Must pass |
| CP6 | Hour 12 | Bill confirm creates JE | Must pass |
| CP7 | Hour 14 | Reports return correct data | Must pass |
| CP8 | Hour 16 | All endpoints contract-tested | Must pass |
| CP9 | Hour 18 | E2E scenarios pass | Must pass |
| CP10 | Hour 20 | Security checklist complete | Must pass |
| CP11 | Hour 22 | Frontend handoff ready | Must pass |
| CP12 | Hour 24 | Final quality gate | Must pass |

---

## DEPLOYMENT CHECKLIST

- [ ] PostgreSQL production database created
- [ ] Environment variables set (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Prisma migrations applied
- [ ] Seed data inserted (admin user, COA, journals)
- [ ] CORS_ORIGIN configured for frontend domain
- [ ] HTTPS enabled (or assumed behind proxy)
- [ ] Health check endpoint responds
- [ ] Logging configured
- [ ] Rate limiting active
- [ ] No secrets in Git

---

## RISKS AND MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF unreadable | Requirements gaps | Use Excalidraw annotations only |
| Time overrun | Incomplete features | Prioritize: Auth → Sales → Purchase → Reports |
| Complex budgets | Implementation delay | Simplify achievement if needed |
| Report accuracy | Wrong numbers | Verify with manual calculations |
| Frontend integration | Broken screens | Test each endpoint independently |
| Concurrency issues | Race conditions | Use SERIALIZABLE for financial writes |
| Sequence conflicts | Duplicate numbers | PostgreSQL sequences are atomic |

---

*Execution plan created by Principal Backend Engineer on 2026-09-05*
*Ready for execution — NO CODING UNTIL PHASE 0 APPROVED*
