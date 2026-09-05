# 32 — 24-Hour Implementation Plan

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Phase Overview

| Phase | Time | Focus | Output |
|-------|------|-------|--------|
| 1 | 0-2h | Project Setup | Dev environment, DB, Prisma, seed |
| 2 | 2-6h | Core Auth + Users | Login, signup, RBAC, user CRUD |
| 3 | 6-10h | Master Data | Contacts, Products, Categories |
| 4 | 10-14h | Financial Documents | Invoices, Bills, Payments |
| 5 | 14-18h | Budgets + Reports | Budget CRUD, P&L, Balance Sheet |
| 6 | 18-22h | Frontend Integration | Connect all screens to backend |
| 7 | 22-24h | Testing + Polish | QA, bug fixes, deployment prep |

---

## 2. Phase 1: Project Setup (0-2h)

### 2.1 Tasks

| Task | Owner | Time | Dependency |
|------|-------|------|------------|
| Initialize Node.js project | Backend | 10min | — |
| Install dependencies | Backend | 10min | Task 1 |
| Configure Prisma | Backend | 15min | Task 2 |
| Create schema | Backend | 30min | Task 3 |
| Run migrations | Backend | 10min | Task 4 |
| Create seed data | Backend | 30min | Task 5 |
| Setup Express server | Backend | 15min | Task 2 |

### 2.2 Deliverables

- Working Prisma schema with all 19 tables
- Seed data: admin, accountant, user accounts
- Express server running on localhost:3000
- Database connected and migrated

---

## 3. Phase 2: Core Auth + Users (2-6h)

### 3.1 Tasks

| Task | Owner | Time | Dependency |
|------|-------|------|------------|
| Auth middleware (JWT) | Backend | 30min | Phase 1 |
| Login endpoint | Backend | 30min | Auth middleware |
| Signup endpoint | Backend | 30min | Auth middleware |
| Session check endpoint | Backend | 15min | Auth middleware |
| Logout endpoint | Backend | 10min | Auth middleware |
| User CRUD (admin only) | Backend | 1h | Auth middleware |
| RBAC middleware | Backend | 30min | Auth middleware |
| Test auth flow | QA | 30min | All above |

### 3.2 Deliverables

- JWT authentication working
- Role-based access control
- User management (admin only)
- All 3 roles functional

---

## 4. Phase 3: Master Data (6-10h)

### 4.1 Tasks

| Task | Owner | Time | Dependency |
|------|-------|------|------------|
| Contact CRUD | Backend | 1h | Auth |
| Product CRUD | Backend | 1h | Auth |
| Category CRUD | Backend | 30min | Auth |
| Dashboard endpoints | Backend | 1h | Contacts, Products |
| Frontend: Login/Signup | Frontend | 1h | Auth API |
| Frontend: Dashboard | Frontend | 1h | Dashboard API |

### 4.2 Deliverables

- Contact management working
- Product management working
- Category management working
- Dashboard showing counts

---

## 5. Phase 4: Financial Documents (10-14h)

### 5.1 Tasks

| Task | Owner | Time | Dependency |
|------|-------|------|------------|
| Sales Order CRUD | Backend | 1h | Contacts, Products |
| Customer Invoice CRUD | Backend | 1h | Sales Orders |
| Invoice confirmation (JE) | Backend | 1h | Invoices |
| Invoice payment | Backend | 1h | Invoices |
| Purchase Order CRUD | Backend | 1h | Contacts, Products |
| Vendor Bill CRUD | Backend | 1h | Purchase Orders |
| Bill confirmation (JE) | Backend | 1h | Bills |
| Bill payment | Backend | 1h | Bills |

### 5.2 Deliverables

- Invoice workflow complete
- Bill workflow complete
- Journal entries auto-generated
- Payments processing correctly

---

## 6. Phase 5: Budgets + Reports (14-18h)

### 6.1 Tasks

| Task | Owner | Time | Dependency |
|------|-------|------|------------|
| Budget CRUD | Backend | 1h | Accounts |
| Budget confirm/revise/cancel | Backend | 1h | Budgets |
| Budget achievement calc | Backend | 1h | Invoices, Bills |
| P&L Report | Backend | 1h | Journal Entries |
| Balance Sheet | Backend | 1h | Journal Entries |
| Budget Report | Backend | 1h | Budgets |
| Frontend: Budget screens | Frontend | 1h | Budget API |
| Frontend: Report screens | Frontend | 1h | Report API |

### 6.2 Deliverables

- Budget workflow complete
- All 3 reports working
- Reports matching mockups

---

## 7. Phase 6: Frontend Integration (18-22h)

### 7.1 Tasks

| Task | Owner | Time | Dependency |
|------|-------|------|------------|
| Contact list/form | Frontend | 1h | Contact API |
| Product list/form | Frontend | 1h | Product API |
| Invoice list/form | Frontend | 1h | Invoice API |
| Invoice payment screen | Frontend | 1h | Payment API |
| Bill list/form | Frontend | 1h | Bill API |
| Bill payment screen | Frontend | 1h | Payment API |
| Journal entry form | Frontend | 1h | JE API |
| Accounts screen | Frontend | 1h | Account API |

### 7.2 Deliverables

- All screens connected to backend
- CRUD operations working
- Navigation complete
- Responsive layout

---

## 8. Phase 7: Testing + Polish (22-24h)

### 8.1 Tasks

| Task | Owner | Time | Dependency |
|------|-------|------|------------|
| Auth testing | QA | 15min | All |
| RBAC testing | QA | 15min | All |
| Invoice workflow testing | QA | 15min | All |
| Bill workflow testing | QA | 15min | All |
| Budget workflow testing | QA | 15min | All |
| Report accuracy testing | QA | 15min | All |
| Bug fixes | Dev | 30min | Testing |
| Deployment prep | Dev | 15min | All |

### 8.2 Deliverables

- All critical bugs fixed
- Demo ready
- Deployment configuration

---

## 9. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF unreadable | Requirements gaps | Use Excalidraw annotations only |
| Time overrun | Incomplete features | Prioritize core workflows |
| Complex budgets | Implementation delay | Simplify achievement calculation |
| Report accuracy | Wrong numbers | Verify with manual calculations |
| Frontend integration | Broken screens | Test each screen individually |

---

## 10. Success Criteria

| Criteria | Target |
|----------|--------|
| Login/Logout | Working for all 3 roles |
| Contact CRUD | Create, Read, Update, Delete |
| Product CRUD | Create, Read, Update, Delete |
| Invoice workflow | Draft → Confirmed → Paid |
| Bill workflow | Draft → Confirmed → Paid |
| Budget workflow | Draft → Confirmed → Revised → Cancelled |
| P&L Report | Accurate numbers |
| Balance Sheet | Balances check |
| Budget Report | Achievement calculated |
| All screens | Connected and functional |

---

*Document generated from 24-hour implementation planning on 2026-09-05*
