# 28 — Test Traceability Matrix

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Requirement → Test Mapping

### 1.1 Authentication Requirements

| Requirement | Feature | Screen | API | DB Table | Test |
|-------------|---------|--------|-----|----------|------|
| AUTH-001 | Login | Login Page | POST /auth/login | users | TC-AUTH-001 |
| AUTH-002 | Login ID 6-12 chars | Create User, Sign Up | POST /auth/signup | users.login_id | TC-AUTH-002 |
| AUTH-003 | Password complexity | Create User, Sign Up | POST /auth/signup | — | TC-AUTH-003 |
| AUTH-005 | Error message | Login Page | POST /auth/login | — | TC-AUTH-004 |
| AUTH-009 | Admin-only user creation | Create User | POST /users | users | TC-AUTHZ-001 |
| AUTH-010 | Create User fields | Create User | POST /users | users | TC-AUTH-005 |

### 1.2 Contact Requirements

| Requirement | Feature | Screen | API | DB Table | Test |
|-------------|---------|--------|-----|----------|------|
| CON-001 | Contact CRUD | Contact List/Form | /contacts | contacts | TC-CON-001 |
| CON-002 | Email unique | Contact Form | POST /contacts | contacts.email | TC-CON-002 |
| CON-004 | Address fields | Contact Form | POST /contacts | contacts | TC-CON-003 |

### 1.3 Product Requirements

| Requirement | Feature | Screen | API | DB Table | Test |
|-------------|---------|--------|-----|----------|------|
| PRD-001 | Product CRUD | Product List/Form | /products | products | TC-PRD-001 |
| PRD-003 | Category on fly | Product Form | POST /products | categories | TC-PRD-002 |
| PRD-006 | Sales Price >= 0 | Product Form | POST /products | products.sales_price | TC-PRD-003 |

### 1.4 Budget Requirements

| Requirement | Feature | Screen | API | DB Table | Test |
|-------------|---------|--------|-----|----------|------|
| BUD-001 | Budget CRUD | Budget Form | /budgets | budgets | TC-BUD-001 |
| BUD-002 | Budget states | Budget Form | PUT /budgets/:id/* | budgets.status | TC-BUD-002 |
| BUD-003 | Committed on confirm | Budget Form | PUT /budgets/:id/confirm | budgets.committed_amount | TC-BUD-003 |
| BUD-004 | Achieved computed | Budget Report | GET /budgets/:id | budgets.achieved_amount | TC-BUD-004 |
| BUD-007 | Revision creates new | Budget Form | POST /budgets/:id/revise | budgets | TC-BUD-005 |
| BUD-008 | Cancel archives | Budget Form | PUT /budgets/:id/cancel | budgets.is_archived | TC-BUD-006 |

### 1.5 Invoice Requirements

| Requirement | Feature | Screen | API | DB Table | Test |
|-------------|---------|--------|-----|----------|------|
| INV-001 | Invoice CRUD | Invoice Form | /invoices | customer_invoices | TC-INV-001 |
| INV-003 | Confirm creates JE | Invoice Form | POST /invoices/:id/confirm | journal_entries | TC-INV-002 |
| INV-005 | Invoice states | Invoice Form | PUT /invoices/:id/confirm | customer_invoices.status | TC-INV-003 |
| INV-006 | Payment reduces due | Invoice Payment | POST /invoices/:id/pay | customer_invoices.amount_due | TC-INV-004 |
| INV-007 | Full payment = paid | Invoice Payment | POST /invoices/:id/pay | customer_invoices.status | TC-INV-005 |
| INV-008 | Print PDF | Invoice Form | POST /invoices/:id/print | — | TC-INV-006 |

### 1.6 Bill Requirements

| Requirement | Feature | Screen | API | DB Table | Test |
|-------------|---------|--------|-----|----------|------|
| BIL-001 | Bill CRUD | Bill Form | /bills | vendor_bills | TC-BIL-001 |
| BIL-003 | Confirm creates JE | Bill Form | POST /bills/:id/confirm | journal_entries | TC-BIL-002 |
| BIL-005 | Bill states | Bill Form | POST /bills/:id/confirm | vendor_bills.status | TC-BIL-003 |
| BIL-006 | Payment reduces due | Bill Payment | POST /bills/:id/pay | vendor_bills.amount_due | TC-BIL-004 |

### 1.7 Journal Entry Requirements

| Requirement | Feature | Screen | API | DB Table | Test |
|-------------|---------|--------|-----|----------|------|
| JNL-002 | Balanced entries | JE Form | POST /journal-entries | journal_entry_lines | TC-JE-001 |
| JNL-005 | Blocking warning | JE Form | POST /journal-entries | — | TC-JE-002 |

### 1.8 Report Requirements

| Requirement | Feature | Screen | API | DB Table | Test |
|-------------|---------|--------|-----|----------|------|
| RPT-001 | P&L report | P&L Screen | GET /reports/profit-and-loss | — | TC-RPT-001 |
| RPT-002 | Balance Sheet | BS Screen | GET /reports/balance-sheet | — | TC-RPT-002 |
| RPT-003 | BS balances | BS Screen | GET /reports/balance-sheet | — | TC-RPT-003 |

---

## 2. Test Coverage Summary

| Category | Requirements | Tests | Coverage |
|----------|-------------|-------|----------|
| Authentication | 6 | 5 | 83% |
| Contacts | 3 | 3 | 100% |
| Products | 3 | 3 | 100% |
| Budgets | 6 | 6 | 100% |
| Invoices | 6 | 6 | 100% |
| Bills | 4 | 4 | 100% |
| Journal Entries | 2 | 2 | 100% |
| Reports | 3 | 3 | 100% |
| **Total** | **33** | **32** | **97%** |

---

*Document generated from test traceability analysis on 2026-09-05*
