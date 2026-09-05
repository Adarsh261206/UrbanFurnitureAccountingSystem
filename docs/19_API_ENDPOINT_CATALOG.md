# 19 — API Endpoint Catalog

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Endpoint Registry

### AUTH-001: POST /api/v1/auth/signup

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/auth/signup |
| Purpose | Register new invoicing user |
| Authentication | None (public) |
| Required Role | None |
| Ownership Rule | N/A |
| Request Body | `{ "login_id": "string", "email": "string", "password": "string", "confirm_password": "string" }` |
| Required Fields | login_id, email, password, confirm_password |
| Optional Fields | None |
| Field Types | login_id: string (6-12 chars), email: string, password: string, confirm_password: string |
| Validation | login_id unique, email unique, password complexity, passwords match |
| Success Status | 201 |
| Success Schema | `{ "id": "uuid", "name": null, "login_id": "string", "email": "string", "role": "user" }` |
| Error Statuses | 400, 409 |
| Error Schema | `{ "error": { "code": "string", "message": "string", "field": "string\|null" } }` |
| Pagination | N/A |
| Sorting | N/A |
| Filtering | N/A |
| Search | N/A |
| Idempotency | No (creates new record) |
| Concurrency | None |
| Database Transaction | Single INSERT |
| Side Effects | None |

---

### AUTH-002: POST /api/v1/auth/login

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/auth/login |
| Purpose | Authenticate user and set session |
| Authentication | None (public) |
| Required Role | None |
| Ownership Rule | N/A |
| Request Body | `{ "login_id": "string", "password": "string" }` |
| Required Fields | login_id, password |
| Optional Fields | None |
| Field Types | login_id: string, password: string |
| Validation | Credentials match database |
| Success Status | 200 |
| Success Schema | `{ "user": { "id": "uuid", "name": "string", "login_id": "string", "email": "string", "role": "admin\|accountant\|user" } }` |
| Error Statuses | 401 |
| Error Schema | `{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid Login Id or Password" } }` |
| Pagination | N/A |
| Sorting | N/A |
| Filtering | N/A |
| Search | N/A |
| Idempotency | Yes (same credentials = same result) |
| Concurrency | None |
| Database Transaction | SELECT only |
| Side Effects | Sets HttpOnly cookie `auth_token` |
| Cookie Settings | Name: auth_token, HttpOnly: true, Secure: true, SameSite: Strict, Path: /api, Max-Age: 86400 |

---

### AUTH-003: POST /api/v1/auth/logout

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/auth/logout |
| Purpose | End session |
| Authentication | Required (cookie) |
| Required Role | Any authenticated |
| Ownership Rule | N/A |
| Request Body | None |
| Success Status | 200 |
| Success Schema | `{ "message": "Logged out successfully" }` |
| Side Effects | Clears auth_token cookie |

---

### AUTH-004: GET /api/v1/auth/me

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/auth/me |
| Purpose | Get current user profile |
| Authentication | Required (cookie) |
| Required Role | Any authenticated |
| Ownership Rule | Returns current user |
| Success Status | 200 |
| Success Schema | `{ "id": "uuid", "name": "string", "login_id": "string", "email": "string", "role": "admin\|accountant\|user" }` |

---

### USER-001: POST /api/v1/users

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/users |
| Purpose | Create new user (Admin only) |
| Authentication | Required (cookie) |
| Required Role | admin |
| Ownership Rule | N/A |
| Request Body | `{ "name": "string", "login_id": "string", "email": "string", "role": "admin\|accountant\|user", "password": "string", "confirm_password": "string" }` |
| Required Fields | name, login_id, email, role, password, confirm_password |
| Success Status | 201 |
| Success Schema | `{ "id": "uuid", "name": "string", "login_id": "string", "email": "string", "role": "string" }` |
| Error Statuses | 400, 409 |

---

### USER-002: GET /api/v1/users

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/users |
| Purpose | List all users |
| Authentication | Required (cookie) |
| Required Role | admin |
| Query Params | page (default 1), limit (default 20), search |
| Success Schema | `{ "users": [...], "total": "number", "page": "number", "limit": "number" }` |

---

### CONTACT-001: GET /api/v1/contacts

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/contacts |
| Purpose | List contacts |
| Authentication | Required (cookie) |
| Required Role | admin, accountant |
| Query Params | page, limit, search, sort, order |
| Success Schema | `{ "contacts": [...], "total": "number", "page": "number", "limit": "number" }` |

---

### CONTACT-002: POST /api/v1/contacts

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/contacts |
| Purpose | Create contact |
| Authentication | Required (cookie) |
| Required Role | admin, accountant |
| Request Body | `{ "name": "string", "email": "string", "phone": "string?", "image_url": "string?", "street": "string?", "city": "string?", "state": "string?", "country": "string?", "pincode": "string?" }` |
| Required Fields | name, email |
| Success Status | 201 |

---

### CONTACT-003: GET /api/v1/contacts/:id

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/contacts/:id |
| Purpose | Get contact details |
| Authentication | Required (cookie) |
| Required Role | admin, accountant |
| Path Params | id (UUID) |

---

### CONTACT-004: PUT /api/v1/contacts/:id

| Property | Value |
|----------|-------|
| Method | PUT |
| Path | /api/v1/contacts/:id |
| Purpose | Update contact |
| Authentication | Required (cookie) |
| Required Role | admin, accountant |
| Path Params | id (UUID) |

---

### PRODUCT-001: GET /api/v1/products

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/products |
| Purpose | List products |
| Authentication | Required (cookie) |
| Required Role | admin, accountant |
| Query Params | page, limit, search, category_id |

---

### PRODUCT-002: POST /api/v1/products

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/products |
| Purpose | Create product |
| Authentication | Required (cookie) |
| Required Role | admin, accountant |
| Request Body | `{ "name": "string", "product_type": "goods\|service\|combo", "category_id": "uuid", "category_name": "string?", "sales_price": "number", "cost": "number", "image_url": "string?" }` |

---

### PRODUCT-003: GET /api/v1/products/:id

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/products/:id |
| Purpose | Get product details |

---

### PRODUCT-004: PUT /api/v1/products/:id

| Property | Value |
|----------|-------|
| Method | PUT |
| Path | /api/v1/products/:id |
| Purpose | Update product |

---

### ANALYTICAL-001: GET /api/v1/analyticals

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/analyticals |
| Purpose | List analytical accounts |
| Required Role | admin, accountant |

---

### ANALYTICAL-002: POST /api/v1/analyticals

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/analyticals |
| Purpose | Create analytical account |
| Required Role | admin, accountant |
| Request Body | `{ "name": "string", "responsible_id": "uuid", "start_date": "YYYY-MM-DD", "to_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "analytic_account": "string" }` |

---

### BUDGET-001: GET /api/v1/budgets

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/budgets |
| Purpose | List budgets |
| Required Role | admin, accountant |
| Query Params | page, limit, status, type |

---

### BUDGET-002: POST /api/v1/budgets

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/budgets |
| Purpose | Create budget |
| Required Role | admin, accountant |
| Request Body | `{ "name": "string", "responsible_id": "uuid", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "type": "income\|expense", "analytical_id": "uuid" }` |
| Success Status | 201 |
| Success Schema | `{ "id": "uuid", "status": "draft" }` |

---

### BUDGET-003: GET /api/v1/budgets/:id

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/budgets/:id |
| Purpose | Get budget details |

---

### BUDGET-004: PUT /api/v1/budgets/:id

| Property | Value |
|----------|-------|
| Method | PUT |
| Path | /api/v1/budgets/:id |
| Purpose | Update budget (draft only) |
| Validation | status must be 'draft' |

---

### BUDGET-005: PUT /api/v1/budgets/:id/confirm

| Property | Value |
|----------|-------|
| Method | PUT |
| Path | /api/v1/budgets/:id/confirm |
| Purpose | Confirm budget |
| Validation | status must be 'draft' |
| Side Effects | committed_amount set |

---

### BUDGET-006: POST /api/v1/budgets/:id/revise

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/budgets/:id/revise |
| Purpose | Create revised budget |
| Validation | status must be 'confirmed' |
| Side Effects | New budget created, original status = 'revised' |
| Success Status | 201 |

---

### BUDGET-007: PUT /api/v1/budgets/:id/cancel

| Property | Value |
|----------|-------|
| Method | PUT |
| Path | /api/v1/budgets/:id/cancel |
| Purpose | Cancel/archive budget |
| Side Effects | is_archived = true, status = 'cancelled' |

---

### COA-001: GET /api/v1/chart-of-accounts

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/chart-of-accounts |
| Purpose | List chart of accounts |
| Required Role | admin, accountant |

---

### COA-002: POST /api/v1/chart-of-accounts

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/chart-of-accounts |
| Purpose | Create account |
| Request Body | `{ "name": "string", "account_type": "asset\|liability\|bank\|capital\|cash\|income\|expense" }` |

---

### JOURNAL-001: GET /api/v1/journals

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/journals |
| Purpose | List journals |
| Required Role | admin, accountant |

---

### JE-001: GET /api/v1/journal-entries

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/journal-entries |
| Purpose | List journal entries |
| Required Role | admin, accountant |
| Query Params | page, limit, journal_id, status, date_from, date_to |

---

### JE-002: POST /api/v1/journal-entries

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/journal-entries |
| Purpose | Create manual journal entry |
| Required Role | admin, accountant |
| Request Body | `{ "accounting_date": "YYYY-MM-DD", "journal_id": "uuid", "lines": [{ "account_id": "uuid", "partner_id": "uuid?", "debit": "number", "credit": "number" }] }` |
| Validation | SUM(debit) = SUM(credit) |
| Error: Unbalanced | 400 UNBALANCED_JOURNAL |

---

### JE-003: GET /api/v1/journal-entries/:id

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/journal-entries/:id |
| Purpose | Get journal entry with lines |

---

### SO-001: GET /api/v1/sales-orders

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/sales-orders |
| Purpose | List sales orders |
| Required Role | admin, accountant |
| Query Params | page, limit, status, search |

---

### SO-002: POST /api/v1/sales-orders

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/sales-orders |
| Purpose | Create sales order |
| Request Body | `{ "customer_id": "uuid", "invoice_date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD", "lines": [{ "product_id": "uuid", "chart_of_account_id": "uuid", "budget_analytic_id": "uuid?", "qty": "number", "unit_price": "number" }] }` |
| Success Schema | `{ "id": "uuid", "so_number": "S00001", "status": "draft" }` |

---

### SO-003: PUT /api/v1/sales-orders/:id/confirm

| Property | Value |
|----------|-------|
| Method | PUT |
| Path | /api/v1/sales-orders/:id/confirm |
| Purpose | Confirm sales order |
| Validation | status must be 'draft' |

---

### INV-001: GET /api/v1/invoices

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/invoices |
| Purpose | List customer invoices |
| Required Role | admin, accountant (all), user (own) |
| Query Params | page, limit, status, customer_id |
| Ownership Filter | user: WHERE customer_id = user's contact |

---

### INV-002: POST /api/v1/invoices

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/invoices |
| Purpose | Create customer invoice |
| Required Role | admin, accountant |
| Request Body | `{ "customer_id": "uuid", "sales_order_id": "uuid?", "invoice_date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD", "lines": [{ "product_id": "uuid", "chart_of_account_id": "uuid", "budget_analytic_id": "uuid?", "qty": "number", "unit_price": "number" }] }` |
| Success Schema | `{ "id": "uuid", "invoice_reference": "INV/2026/0001", "status": "draft" }` |

---

### INV-003: GET /api/v1/invoices/:id

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/invoices/:id |
| Purpose | Get invoice details |
| Ownership Check | user: customer_id must match |

---

### INV-004: PUT /api/v1/invoices/:id

| Property | Value |
|----------|-------|
| Method | PUT |
| Path | /api/v1/invoices/:id |
| Purpose | Update invoice (draft only) |
| Validation | status must be 'draft' |

---

### INV-005: POST /api/v1/invoices/:id/confirm

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/invoices/:id/confirm |
| Purpose | Confirm invoice and create journal entry |
| Required Role | admin, accountant |
| Validation | status = 'draft', lines not empty |
| Atomicity | SINGLE TRANSACTION |
| Side Effects | JournalEntry + 2 JournalEntryLines created |
| Idempotent | Yes |

---

### INV-006: POST /api/v1/invoices/:id/pay

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/invoices/:id/pay |
| Purpose | Pay invoice |
| Required Role | admin, accountant, user (own) |
| Request Body | `{ "amount": "number", "payment_via": "bank\|cash" }` |
| Validation | amount > 0, amount <= amount_due, status = 'confirmed' |
| Atomicity | SINGLE TRANSACTION |
| Side Effects | Payment created, amount_due updated, JournalEntry created |
| Ownership Check | user: customer_id must match |

---

### INV-007: POST /api/v1/invoices/:id/print

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/invoices/:id/print |
| Purpose | Generate PDF |
| Response | PDF binary stream |

---

### INV-008: POST /api/v1/invoices/:id/send

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/invoices/:id/send |
| Purpose | Send invoice via email |
| Request Body | `{ "email_to": "string", "subject": "string", "body": "string" }` |

---

### PO-001: GET /api/v1/purchase-orders

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/purchase-orders |
| Purpose | List purchase orders |
| Required Role | admin, accountant |

---

### PO-002: POST /api/v1/purchase-orders

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/purchase-orders |
| Purpose | Create purchase order |
| Success Schema | `{ "id": "uuid", "po_number": "P00001", "status": "draft" }` |

---

### PO-003: PUT /api/v1/purchase-orders/:id/confirm

| Property | Value |
|----------|-------|
| Method | PUT |
| Path | /api/v1/purchase-orders/:id/confirm |
| Purpose | Confirm purchase order |

---

### BILL-001: GET /api/v1/bills

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/bills |
| Purpose | List vendor bills |
| Required Role | admin, accountant |

---

### BILL-002: POST /api/v1/bills

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/bills |
| Purpose | Create vendor bill |
| Success Schema | `{ "id": "uuid", "bill_reference": "Bill/2026/0001", "status": "draft" }` |

---

### BILL-003: POST /api/v1/bills/:id/confirm

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/bills/:id/confirm |
| Purpose | Confirm bill and create journal entry |
| Atomicity | SINGLE TRANSACTION |

---

### BILL-004: POST /api/v1/bills/:id/pay

| Property | Value |
|----------|-------|
| Method | POST |
| Path | /api/v1/bills/:id/pay |
| Purpose | Pay bill |
| Request Body | `{ "amount": "number", "payment_via": "bank\|cash" }` |
| Validation | amount > 0, amount <= amount_due |

---

### RPT-001: GET /api/v1/reports/profit-and-loss

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/reports/profit-and-loss |
| Purpose | Generate P&L report |
| Required Role | admin, accountant |
| Query Params | year |
| Success Schema | `{ "year": "number", "income": { "items": [...], "total": "number" }, "expenses": { "items": [...], "total": "number" }, "net_income": "number" }` |

---

### RPT-002: GET /api/v1/reports/balance-sheet

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/reports/balance-sheet |
| Purpose | Generate Balance Sheet |
| Required Role | admin, accountant |
| Query Params | year |
| Success Schema | `{ "year": "number", "assets": { "items": [...], "total": "number" }, "liabilities": { "items": [...], "total": "number" }, "balance_check": "boolean" }` |

---

### RPT-003: GET /api/v1/reports/budget-report

| Property | Value |
|----------|-------|
| Method | GET |
| Path | /api/v1/reports/budget-report |
| Purpose | Generate Budget Report |
| Required Role | admin, accountant |
| Query Params | year, type |

---

*Document generated from API endpoint analysis on 2026-09-05*
