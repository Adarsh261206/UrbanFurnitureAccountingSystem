# FINAL_ENDPOINT_COUNT.md

> **Date:** 2026-09-05  
> **Total Endpoints:** 64  
> **Sources:** 08_API_CONTRACTS.md + 19_API_ENDPOINT_CATALOG.md + 17_STATE_MACHINES.md + PRD

---

## Count by Category

| Category | Endpoints | Range |
|----------|-----------|-------|
| Authentication | 4 | #1-4 |
| Users | 2 | #5-6 |
| Contacts | 4 | #7-10 |
| Products | 4 | #11-14 |
| Categories | 2 | #15-16 |
| Analytical Accounts | 2 | #17-18 |
| Chart of Accounts | 2 | #19-20 |
| Journals | 1 | #21 |
| Journal Entries | 3 | #22-24 |
| Budgets | 7 | #25-31 |
| Sales Orders | 5 | #32-36 |
| Customer Invoices | 9 | #37-45 |
| Purchase Orders | 5 | #46-50 |
| Vendor Bills | 9 | #51-59 |
| Payments | 1 | #60 |
| Dashboard | 1 | #61 |
| Reports | 3 | #62-64 |
| Upload | 0 | (counted in auth section as supplementary) |
| **TOTAL** | **64** | |

---

## Full Endpoint List

### Authentication (4)

| # | Method | Path | Role |
|---|--------|------|------|
| 1 | POST | /api/v1/auth/signup | Public |
| 2 | POST | /api/v1/auth/login | Public |
| 3 | POST | /api/v1/auth/logout | Any authenticated |
| 4 | GET | /api/v1/auth/me | Any authenticated |

### Users (2)

| # | Method | Path | Role |
|---|--------|------|------|
| 5 | POST | /api/v1/users | admin |
| 6 | GET | /api/v1/users | admin |

### Contacts (4)

| # | Method | Path | Role |
|---|--------|------|------|
| 7 | GET | /api/v1/contacts | admin, accountant |
| 8 | POST | /api/v1/contacts | admin, accountant |
| 9 | GET | /api/v1/contacts/:id | admin, accountant |
| 10 | PUT | /api/v1/contacts/:id | admin, accountant |

### Products (4)

| # | Method | Path | Role |
|---|--------|------|------|
| 11 | GET | /api/v1/products | admin, accountant |
| 12 | POST | /api/v1/products | admin, accountant |
| 13 | GET | /api/v1/products/:id | admin, accountant |
| 14 | PUT | /api/v1/products/:id | admin, accountant |

### Categories (2)

| # | Method | Path | Role |
|---|--------|------|------|
| 15 | GET | /api/v1/categories | admin, accountant |
| 16 | POST | /api/v1/categories | admin, accountant |

### Analytical Accounts (2)

| # | Method | Path | Role |
|---|--------|------|------|
| 17 | GET | /api/v1/analyticals | admin, accountant |
| 18 | POST | /api/v1/analyticals | admin, accountant |

### Chart of Accounts (2)

| # | Method | Path | Role |
|---|--------|------|------|
| 19 | GET | /api/v1/chart-of-accounts | admin, accountant |
| 20 | POST | /api/v1/chart-of-accounts | admin, accountant |

### Journals (1)

| # | Method | Path | Role |
|---|--------|------|------|
| 21 | GET | /api/v1/journals | admin, accountant |

### Journal Entries (3)

| # | Method | Path | Role |
|---|--------|------|------|
| 22 | GET | /api/v1/journal-entries | admin, accountant |
| 23 | POST | /api/v1/journal-entries | admin, accountant |
| 24 | GET | /api/v1/journal-entries/:id | admin, accountant |

### Budgets (7)

| # | Method | Path | Role |
|---|--------|------|------|
| 25 | GET | /api/v1/budgets | admin, accountant |
| 26 | POST | /api/v1/budgets | admin, accountant |
| 27 | GET | /api/v1/budgets/:id | admin, accountant |
| 28 | PUT | /api/v1/budgets/:id | admin, accountant |
| 29 | PUT | /api/v1/budgets/:id/confirm | admin, accountant |
| 30 | POST | /api/v1/budgets/:id/revise | admin, accountant |
| 31 | PUT | /api/v1/budgets/:id/cancel | admin, accountant |

### Sales Orders (5)

| # | Method | Path | Role |
|---|--------|------|------|
| 32 | GET | /api/v1/sales-orders | admin, accountant |
| 33 | POST | /api/v1/sales-orders | admin, accountant |
| 34 | GET | /api/v1/sales-orders/:id | admin, accountant |
| 35 | PUT | /api/v1/sales-orders/:id | admin, accountant |
| 36 | PUT | /api/v1/sales-orders/:id/confirm | admin, accountant |

### Customer Invoices (9)

| # | Method | Path | Role |
|---|--------|------|------|
| 37 | GET | /api/v1/invoices | admin, accountant, user (own) |
| 38 | POST | /api/v1/invoices | admin, accountant |
| 39 | GET | /api/v1/invoices/:id | admin, accountant, user (own) |
| 40 | PUT | /api/v1/invoices/:id | admin, accountant |
| 41 | POST | /api/v1/invoices/:id/confirm | admin, accountant |
| 42 | POST | /api/v1/invoices/:id/pay | admin, accountant, user (own) |
| 43 | POST | /api/v1/invoices/:id/cancel | admin, accountant |
| 44 | POST | /api/v1/invoices/:id/print | admin, accountant, user (own) |
| 45 | POST | /api/v1/invoices/:id/send | admin, accountant, user (own) |

### Purchase Orders (5)

| # | Method | Path | Role |
|---|--------|------|------|
| 46 | GET | /api/v1/purchase-orders | admin, accountant |
| 47 | POST | /api/v1/purchase-orders | admin, accountant |
| 48 | GET | /api/v1/purchase-orders/:id | admin, accountant |
| 49 | PUT | /api/v1/purchase-orders/:id | admin, accountant |
| 50 | PUT | /api/v1/purchase-orders/:id/confirm | admin, accountant |

### Vendor Bills (9)

| # | Method | Path | Role |
|---|--------|------|------|
| 51 | GET | /api/v1/bills | admin, accountant |
| 52 | POST | /api/v1/bills | admin, accountant |
| 53 | GET | /api/v1/bills/:id | admin, accountant |
| 54 | PUT | /api/v1/bills/:id | admin, accountant |
| 55 | POST | /api/v1/bills/:id/confirm | admin, accountant |
| 56 | POST | /api/v1/bills/:id/pay | admin, accountant |
| 57 | POST | /api/v1/bills/:id/cancel | admin, accountant |
| 58 | POST | /api/v1/bills/:id/print | admin, accountant |
| 59 | POST | /api/v1/bills/:id/send | admin, accountant |

### Payments (1)

| # | Method | Path | Role |
|---|--------|------|------|
| 60 | GET | /api/v1/payments | admin, accountant, user (own invoice payments) |

### Dashboard (1)

| # | Method | Path | Role |
|---|--------|------|------|
| 61 | GET | /api/v1/dashboard | admin, accountant |

### Reports (3)

| # | Method | Path | Role |
|---|--------|------|------|
| 62 | GET | /api/v1/reports/profit-and-loss | admin, accountant |
| 63 | GET | /api/v1/reports/balance-sheet | admin, accountant |
| 64 | GET | /api/v1/reports/budget-report | admin, accountant |

---

## Endpoints NOT Implemented (Out of Scope)

| Endpoint | Reason |
|----------|--------|
| POST /auth/forgot-password | Mock only (22_AUTH §12), returns static success |
| POST /upload | Included in plan but counted separately if needed |
| DELETE /anything | Not implemented per ED-004 and RBAC |

---

*Count verified 2026-09-05. 64 endpoints total.*
