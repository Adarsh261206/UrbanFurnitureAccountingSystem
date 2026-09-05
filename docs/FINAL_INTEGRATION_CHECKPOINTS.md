# FINAL_INTEGRATION_CHECKPOINTS.md

> **Date:** 2026-09-05  
> **Total Checkpoints:** 12  
> **Cadence:** Every 2 hours

---

## Checkpoint Schedule

| CP | Hour | Lane A (Backend) | Lane B (Frontend) | Gate |
|----|------|------------------|-------------------|------|
| CP1 | 2 | DB schema + seed + auth middleware | UI scaffolding | Schema correct, auth middleware boots |
| CP2 | 4 | Login/signup/logout/me flow works | Auth pages built | End-to-end auth works |
| CP3 | 6 | Master data CRUD (contacts, products, categories, analyticals, COA, journals) | Master data screens built | All 13 master endpoints work |
| CP4 | 8 | Accounting engine isolated + sequences | Transaction screen scaffolding | JE balance validation works, sequences generate |
| CP5 | 10 | Invoice confirm creates JE + Bill confirm creates JE | Sales/Purchase screens built | Full accounting flow verified |
| CP6 | 12 | Reports return correct data + Budget lifecycle works | Report + Budget screens built | P&L, Balance Sheet, Budget Report correct |
| CP7 | 14 | All 64 endpoints working | All screens built | Every endpoint responds correctly |
| CP8 | 16 | Contract tests passing | Integration testing started | 64/64 smoke tests pass |
| CP9 | 18 | E2E scenarios passing | Integration testing complete | Full business flows work |
| CP10 | 20 | Security checklist complete | Bug fixes | Security tests pass |
| CP11 | 22 | Frontend handoff ready | Final polish | Handoff document complete |
| CP12 | 24 | Final quality gate | Final testing done | ALL checks pass → GO |

---

## Detailed Checkpoint Specifications

### CP1 — Schema & Auth Foundation (Hour 2)

**Lane A Must Pass:**
- [ ] `npx prisma migrate dev` succeeds
- [ ] All 19 tables created
- [ ] All 13 enums created
- [ ] `npx prisma db seed` succeeds
- [ ] 3 users exist (admin, accountant, user1)
- [ ] 7 chart of accounts exist
- [ ] 4 journals exist
- [ ] 7 sequences created
- [ ] Auth middleware reads cookie, verifies JWT
- [ ] Health check returns 200

**Lane B Must Pass:**
- [ ] React project initialized
- [ ] Tailwind configured
- [ ] React Router configured
- [ ] API client configured with `withCredentials: true`
- [ ] Login page UI built
- [ ] Signup page UI built

**Go/No-Go:** If schema is wrong, STOP. Fix before proceeding.

---

### CP2 — Auth Flow End-to-End (Hour 4)

**Lane A Must Pass:**
- [ ] POST /auth/signup creates user (role=user)
- [ ] POST /auth/login sets HttpOnly cookie
- [ ] GET /auth/me returns user from cookie
- [ ] POST /auth/logout clears cookie
- [ ] JWT NEVER in response body
- [ ] Cookie settings correct (HttpOnly, Secure, SameSite, Path, Max-Age)
- [ ] Rate limiting works (5 login/min, 3 signup/hr)
- [ ] Generic error on invalid credentials

**Lane B Must Pass:**
- [ ] Signup form submits to backend
- [ ] Login form submits to backend
- [ ] Cookie-based auth works (withCredentials)
- [ ] /me endpoint called on app load
- [ ] Redirect to /login on 401
- [ ] User state stored (id, name, role — NO token)

**Go/No-Go:** Auth must work before any protected endpoint.

---

### CP3 — Master Data CRUD (Hour 6)

**Lane A Must Pass:**
- [ ] GET/POST /contacts works (admin, accountant)
- [ ] GET/PUT /contacts/:id works
- [ ] GET/POST /products works (admin, accountant)
- [ ] GET/PUT /products/:id works
- [ ] GET/POST /categories works
- [ ] GET/POST /analyticals works
- [ ] GET/POST /chart-of-accounts works
- [ ] GET /journals works
- [ ] RBAC enforced (user gets 403)
- [ ] Validation works (required fields, email uniqueness)

**Lane B Must Pass:**
- [ ] Contact list page shows data
- [ ] Contact create/edit forms work
- [ ] Product list page shows data
- [ ] Product create/edit forms work
- [ ] Category dropdown populated
- [ ] COA list page shows data

**Go/No-Go:** Master data must work for transaction forms.

---

### CP4 — Accounting Engine (Hour 8)

**Lane A Must Pass:**
- [ ] POST /journal-entries with balanced lines → 201
- [ ] POST /journal-entries with unbalanced lines → 400 UNBALANCED_JOURNAL
- [ ] POST /journal-entries with zero amounts → 400 ZERO_AMOUNT
- [ ] POST /journal-entries with negative amounts → 400 NEGATIVE_AMOUNT
- [ ] Transaction rollback on failure
- [ ] All 7 sequences generate correct format
- [ ] Concurrent sequence generation produces unique values

**Lane B Must Pass:**
- [ ] Journal entry form built
- [ ] Journal entry list page built

**Go/No-Go:** Accounting engine must work for invoice/bill confirmation.

---

### CP5 — Sales & Purchase Flows (Hour 10)

**Lane A Must Pass:**
- [ ] POST /sales-orders creates SO with lines, SO number generated
- [ ] PUT /sales-orders/:id/confirm confirms SO
- [ ] POST /invoices creates invoice with lines, reference generated
- [ ] POST /invoices/:id/confirm creates JE (atomic), invoice status → confirmed
- [ ] POST /invoices/:id/pay creates payment + JE, amount_due decreases
- [ ] POST /invoices/:id/cancel discards draft invoice
- [ ] PUT /purchase-orders creates PO, PUT confirm works
- [ ] POST /bills creates bill with lines, reference generated
- [ ] POST /bills/:id/confirm creates JE (atomic), bill status → confirmed
- [ ] POST /bills/:id/pay creates payment + JE, amount_due decreases
- [ ] POST /bills/:id/cancel discards draft bill
- [ ] Idempotency: confirming already-confirmed returns current state

**Lane B Must Pass:**
- [ ] SO form creates SO with lines
- [ ] Invoice form creates invoice with lines
- [ ] Invoice confirm button works
- [ ] Invoice pay form works
- [ ] PO form creates PO with lines
- [ ] Bill form creates bill with lines
- [ ] Bill confirm button works
- [ ] Bill pay form works

**Go/No-Go:** Full business cycle must work.

---

### CP6 — Reports & Budgets (Hour 12)

**Lane A Must Pass:**
- [ ] GET /reports/profit-and-loss?year=2026 returns correct income/expenses
- [ ] GET /reports/balance-sheet?year=2026 returns correct assets/liabilities
- [ ] Balance check: ABS(assets - liabilities) < 0.01
- [ ] GET /reports/budget-report?year=2026 returns budgets with achievement
- [ ] Budget CRUD works (create, update draft)
- [ ] Budget confirm sets committed_amount
- [ ] Budget revise creates new draft
- [ ] Budget cancel sets is_archived=true
- [ ] Achievement calculation correct (income/expense budgets)

**Lane B Must Pass:**
- [ ] P&L report page shows data
- [ ] Balance Sheet page shows data
- [ ] Budget Report page shows data
- [ ] Budget list/create/edit pages work
- [ ] Dashboard shows kanban counts

**Go/No-Go:** Reports must be accurate.

---

### CP7 — All Endpoints (Hour 14)

**Lane A Must Pass:**
- [ ] All 64 endpoints respond correctly
- [ ] All responses match API contract (field names, types)
- [ ] All error responses follow canonical format
- [ ] Upload endpoint works (POST /upload)
- [ ] Print/send endpoints return success (stubs)
- [ ] Payment list endpoint works (GET /payments)

**Lane B Must Pass:**
- [ ] All frontend screens built
- [ ] All forms functional
- [ ] All tables show data
- [ ] Navigation complete

**Go/No-Go:** All endpoints must exist.

---

### CP8 — Contract Tests (Hour 16)

**Lane A Must Pass:**
- [ ] Smoke test for all 64 endpoints
- [ ] Each test: valid request, auth, authz, response schema, error responses
- [ ] All tests green

**Lane B Must Pass:**
- [ ] Integration testing started
- [ ] Auth flow tested with live backend

**Go/No-Go:** All smoke tests must pass.

---

### CP9 — E2E Scenarios (Hour 18)

**Lane A Must Pass:**
- [ ] Scenario A: Sales cycle end-to-end
- [ ] Scenario B: Purchase cycle end-to-end
- [ ] Scenario C: User portal (own invoices only)
- [ ] Scenario D: Budget with achievement
- [ ] Scenario E: Invalid journal rejected

**Lane B Must Pass:**
- [ ] Integration testing complete for all screens

**Go/No-Go:** All E2E scenarios must pass.

---

### CP10 — Security (Hour 20)

**Lane A Must Pass:**
- [ ] IDOR prevention verified
- [ ] Role escalation prevented
- [ ] JWT never in response body
- [ ] Cookie security flags correct
- [ ] Rate limiting enforced
- [ ] Input validation on all endpoints
- [ ] No secrets in Git
- [ ] File upload validated (MIME, size)

**Lane B Must Pass:**
- [ ] Bug fixes from integration testing

**Go/No-Go:** Security checklist complete.

---

### CP11 — Handoff (Hour 22)

**Lane A Must Pass:**
- [ ] FRONTEND_HANDOFF.md complete
- [ ] All endpoints documented
- [ ] Seed credentials documented
- [ ] Environment variables documented

**Lane B Must Pass:**
- [ ] Final polish complete
- [ ] Responsive design verified

**Go/No-Go:** Handoff document ready.

---

### CP12 — Final Quality Gate (Hour 24)

**ALL Must Pass:**
- [ ] Database schema matches spec exactly
- [ ] All 64 endpoints working
- [ ] All RBAC rules enforced
- [ ] All accounting invariants verified
- [ ] All reports accurate
- [ ] All security checks passed
- [ ] All tests passing
- [ ] Frontend integration complete
- [ ] No blocking bugs

**Final Status:** GO / READY WITH CONDITIONS / NO-GO

---

*Checkpoints defined 2026-09-05*
