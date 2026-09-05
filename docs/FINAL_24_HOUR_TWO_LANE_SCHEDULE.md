# FINAL_24_HOUR_TWO_LANE_SCHEDULE.md

> **Date:** 2026-09-05  
> **Model:** Two parallel lanes (Backend + Frontend)  
> **Total Duration:** 24 hours

---

## LANE A: Backend/DB/Security (Primary Lane)

| Hour | Phase | Task | Output | Checkpoint |
|------|-------|------|--------|------------|
| 0:00-0:05 | 0 | Contract freeze — read and approve EXECUTION_PLAN_V2.md | Agreement | — |
| 0:05-0:30 | 1 | npm init, install deps, create tsconfig, .env, directory structure | package.json, tsconfig.json, .env | — |
| 0:30-0:50 | 1 | Create app.ts (minimal Express), database.ts (Prisma), auth.ts (JWT config) | Working server skeleton | — |
| 0:50-1:00 | 1 | Create health check endpoint: GET /api/v1/health → 200 | Health check works | — |
| 1:00-1:45 | 2 | Write schema.prisma (19 models, 13 enums, all constraints) | schema.prisma | — |
| 1:45-2:00 | 2 | Run npx prisma migrate dev, generate client, create seed.ts | Database live | **CP1** |
| 2:00-2:15 | 2 | Run seed, verify 3 users + 7 COA + 4 journals + 7 sequences | Seed data loaded | — |
| 2:15-3:00 | 4 | Auth middleware (cookie reading, JWT verify), authorize middleware (role check) | Auth middleware working | — |
| 3:00-3:30 | 4 | Auth service + controller: signup, login, logout, me | Auth endpoints working | — |
| 3:30-3:45 | 4 | Rate limiting (login: 5/min, signup: 3/hr), forgot-password mock | Rate limiting working | — |
| 3:45-4:00 | 4 | User service + controller: GET /users, POST /users (admin) | User endpoints working | **CP2** |
| 4:00-4:30 | 5 | Object authorization middleware (ownership check for user role) | RBAC complete | — |
| 4:00-4:30 | 6 | AppError class, global error handler, validation wrapper — PARALLEL | API foundation | — |
| 4:30-5:00 | 6 | Pagination utility, filter/sort/search utilities, transaction wrapper | Reusable infra | — |
| 5:00-6:00 | 7 | Contacts service/controller/routes (GET/POST/GET/:id/PUT/:id) | 4 contact endpoints | — |
| 5:00-6:00 | 7 | Products service/controller/routes — PARALLEL | 4 product endpoints | — |
| 6:00-6:15 | 7 | Categories service/controller/routes | 2 category endpoints | — |
| 6:15-6:30 | 7 | Analyticals service/controller/routes | 2 analytical endpoints | — |
| 6:30-6:45 | 7 | Chart of Accounts service/controller/routes | 2 COA endpoints | — |
| 6:45-7:00 | 7 | Journals service/controller/routes | 1 journal endpoint | **CP3** |
| 7:00-7:30 | 8 | Accounting service (verifyJournalBalance, createJournalEntry, createLines) | Accounting engine | — |
| 7:00-7:30 | 9 | Sequence generators (7 functions) — PARALLEL | Sequence utils | — |
| 7:30-8:00 | 8 | Journal Entry service/controller/routes (GET list, POST create, GET by id) | 3 JE endpoints | **CP4** |
| 8:00-9:00 | 10 | Sales Order service/controller/routes (GET/POST/GET/:id/PUT/:id/PUT confirm) | 5 SO endpoints | — |
| 8:00-9:00 | 11 | Purchase Order service/controller/routes — PARALLEL | 5 PO endpoints | — |
| 9:00-9:30 | 10 | Invoice service/controller/routes (GET/POST/GET/:id/PUT/:id) | 4 invoice CRUD endpoints | — |
| 9:00-9:30 | 11 | Bill service/controller/routes (GET/POST/GET/:id/PUT/:id) — PARALLEL | 4 bill CRUD endpoints | — |
| 9:30-10:00 | 10 | Invoice confirm + pay + cancel (atomic transactions with JE) | 3 invoice action endpoints | — |
| 9:30-10:00 | 11 | Bill confirm + pay + cancel (atomic transactions with JE) — PARALLEL | 3 bill action endpoints | — |
| 10:00-10:15 | 10 | Invoice print + send stubs | 2 invoice stub endpoints | — |
| 10:00-10:15 | 11 | Bill print + send stubs — PARALLEL | 2 bill stub endpoints | **CP5** |
| 10:15-11:00 | 12 | Budget service/controller/routes (GET/POST/GET/:id/PUT/:id/confirm/revise/cancel) | 7 budget endpoints | — |
| 11:00-12:00 | 13 | Report service (P&L, Balance Sheet, Budget Report) + controller + routes | 3 report endpoints | — |
| 11:00-12:00 | 13 | Dashboard controller + route — PARALLEL | 1 dashboard endpoint | **CP6** |
| 12:00-12:30 | 14 | Portal access (ownership filters on invoice/bill endpoints for user role) | IDOR protection | — |
| 12:00-12:30 | 15 | Upload endpoint (multer, MIME validation, 5MB limit) — PARALLEL | Upload working | — |
| 12:30-13:00 | 15 | Print/send stubs return success, payments GET endpoint | All stubs done | **CP7** |
| 13:00-13:30 | 16 | Audit logging middleware (optional, engineering recommendation) | Audit trail | — |
| 13:00-13:30 | 17 | Helmet, CORS config, sanitized production errors — PARALLEL | Security headers | — |
| 13:30-14:00 | 17 | Input sanitization, UUID validation on all :id params | Security hardening | — |
| 14:00-16:00 | 18 | Contract tests (smoke test all 64 endpoints) | All endpoints verified | **CP8** |
| 16:00-18:00 | 19 | E2E scenarios (sales, purchase, portal, budget, accounting) | Business flows verified | **CP9** |
| 18:00-19:00 | 20 | Unit tests (validators, sequences, accounting service) | Test coverage | — |
| 19:00-20:00 | 20 | Authorization tests, security tests | Security verified | **CP10** |
| 20:00-21:00 | 21 | FRONTEND_HANDOFF.md (base URL, auth model, endpoints, credentials) | Handoff doc | — |
| 21:00-22:00 | 22 | Dockerfile, docker-compose.yml, deploy scripts | Deployment ready | **CP11** |
| 22:00-24:00 | 23 | Final quality gate, bug fixes, buffer | Stable system | **CP12** |

---

## LANE B: Frontend/Lovable (Dependent Lane)

| Hour | Task | Backend Dependency | Notes |
|------|------|-------------------|-------|
| 0:00-2:00 | React project init, Tailwind, routing, API client config | None | Mock API responses |
| 2:00-4:00 | Login page, Signup page, auth state management | Phase 4 (CP2) | Switch to live API at CP2 |
| 4:00-6:00 | Contact list/create/edit, Product list/create/edit | Phase 7 (CP3) | Switch to live API at CP3 |
| 6:00-7:00 | Category dropdown, Analytical list/create, COA list/create | Phase 7 (CP3) | — |
| 7:00-8:00 | Journal list/create, Budget list/create/edit | Phase 8 (CP4) | — |
| 8:00-10:00 | SO list/create/edit, Invoice list/create/edit/confirm/pay | Phase 10 (CP5) | Switch to live API at CP5 |
| 10:00-12:00 | PO list/create/edit, Bill list/create/edit/confirm/pay | Phase 11 (CP5) | — |
| 12:00-13:00 | Budget confirm/revise/cancel, Budget report | Phase 12 (CP6) | — |
| 13:00-14:00 | P&L report, Balance Sheet, Budget Report pages | Phase 13 (CP6) | — |
| 14:00-15:00 | Dashboard (kanban counts), Portal pages (user role) | Phase 14 (CP7) | — |
| 15:00-16:00 | Navigation, sidebar, responsive layout polish | All backend | — |
| 16:00-20:00 | Integration testing with live backend, bug fixes | All backend | Full integration |
| 20:00-22:00 | Error handling, loading states, edge cases | All backend | Polish |
| 22:00-24:00 | Final testing, responsive design, deployment prep | All | Buffer |

---

## Critical Path

```
Phase 0 → Phase 1 → Phase 2 → Phase 4 → Phase 5 → Phase 7
                                                    ↓
Phase 8 ← Phase 2                              Phase 10 + Phase 11
   ↓                                              ↓
Phase 9 ← Phase 2                          Phase 12 → Phase 13
                                                    ↓
                                              Phase 14 → Phase 18
                                                          ↓
                                                      Phase 23
```

**Critical Path Duration:** 18 hours (with 6-hour buffer)

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Schema migration fails | Low | High | Validate schema before coding |
| Auth cookie issues | Medium | High | Test early (CP2), use HTTPS in production |
| JE balance validation bugs | Medium | High | Unit test accounting service independently |
| Sequence concurrency issues | Low | Medium | PostgreSQL sequences are atomic |
| Frontend-backend field mismatch | High | Medium | Contract tests (CP8) catch all mismatches |
| Time overrun on reports | Medium | Medium | Reports are read-only, simpler than transactions |
| Payment state machine confusion | Medium | Low | 1-step API is simpler, document clearly |

---

*Schedule defined 2026-09-05*
