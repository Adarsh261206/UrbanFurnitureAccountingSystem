# 08 — API Contracts

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Frozen API Decisions  
> **Date:** 2026-09-05

---

## 1. Base URL

```
http://localhost:3000/api/v1
```

**FROZEN:** All endpoints under `/api/v1/`. No exceptions.

## 2. Authentication

### POST /api/v1/auth/signup

**Request:**
```json
{
  "login_id": "string (6-12 chars, unique)",
  "email": "string (unique)",
  "password": "string (complexity rules)",
  "confirm_password": "string (must match)"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": null,
  "login_id": "string",
  "email": "string",
  "role": "user"
}
```

**Errors:**
- 400: `VALIDATION_ERROR`
- 409: `DUPLICATE_LOGIN_ID`
- 409: `DUPLICATE_EMAIL`
- 400: `WEAK_PASSWORD`

---

### POST /api/v1/auth/login

**Request:**
```json
{
  "login_id": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "name": "string",
  "login_id": "string",
  "email": "string",
  "role": "admin | accountant | user"
}
```

**Cookie Set:**
```
Set-Cookie: auth_token=<jwt>; HttpOnly=true; Secure=true; SameSite=Strict; Path=/api; Max-Age=86400
```

**FROZEN:** JWT NEVER returned in response body. HttpOnly cookie ONLY.

**Errors:**
- 401: `INVALID_CREDENTIALS` — "Invalid Login Id or Password"
- 429: `RATE_LIMITED` — Too many login attempts

---

### GET /api/v1/auth/me

**Headers:**
```
Cookie: auth_token=<jwt>
```

**Response 200:**
```json
{
  "id": "uuid",
  "name": "string",
  "login_id": "string",
  "email": "string",
  "role": "admin | accountant | user"
}
```

**Errors:**
- 401: `UNAUTHORIZED`

---

### POST /api/v1/auth/logout

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

**Cookie Cleared:**
```
Set-Cookie: auth_token=; Max-Age=0
```

---

## 3. Users

### GET /api/v1/users

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin only

**Response 200:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "string",
      "login_id": "string",
      "email": "string",
      "role": "admin | accountant | user",
      "created_at": "timestamp"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

## 4. Contacts

### GET /api/v1/contacts

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Query Params:** `?page=1&limit=20&search=keyword`

**Response 200:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string",
      "street": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "pincode": "string",
      "image_url": "string | null",
      "created_at": "timestamp"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/contacts

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "name": "string (required)",
  "email": "string (required, unique)",
  "phone": "string",
  "street": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "pincode": "string"
}
```

**Response 201:** Contact object

**Errors:**
- 400: `VALIDATION_ERROR`
- 409: `DUPLICATE_EMAIL`

---

### GET /api/v1/contacts/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:** Contact object

---

### PUT /api/v1/contacts/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:** Partial contact object

**Response 200:** Updated contact object

---

## 5. Products

### GET /api/v1/products

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "string",
      "category_id": "uuid",
      "category_name": "string",
      "product_type": "goods | service | combo",
      "sales_price": 1000.00,
      "cost": 500.00,
      "created_at": "timestamp"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/products

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "name": "string (required)",
  "category_id": "uuid",
  "category_name": "string (for on-the-fly creation)",
  "product_type": "goods | service | combo (required)",
  "sales_price": 1000.00 (required, >= 0),
  "cost": 500.00 (>= 0)
}
```

**Response 201:** Product object

---

### GET /api/v1/products/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:** Product object

---

### PUT /api/v1/products/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:** Partial product object

**Response 200:** Updated product object

---

## 6. Categories

### GET /api/v1/categories

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "string"
    }
  ]
}
```

---

### POST /api/v1/categories

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "name": "string (required)"
}
```

**Response 201:** Category object

---

## 7. Accounts

### GET /api/v1/accounts

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "name": "string",
      "account_type": "asset | liability | bank | capital | cash | income | expense",
      "is_active": true
    }
  ]
}
```

---

### POST /api/v1/accounts

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "name": "string (required)",
  "account_type": "asset | liability | bank | capital | cash | income | expense (required)"
}
```

**Response 201:** Account object

---

## 8. Journals

### GET /api/v1/journals

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:**
```json
{
  "journals": [
    {
      "id": "uuid",
      "name": "string",
      "journal_type": "sale | purchase | bank | cash | capital",
      "default_account_id": "uuid"
    }
  ]
}
```

---

## 9. Journal Entries

### GET /api/v1/journal-entries

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:**
```json
{
  "journal_entries": [
    {
      "id": "uuid",
      "entry_number": "JE/2026/0001",
      "journal_id": "uuid",
      "journal_name": "string",
      "accounting_date": "date",
      "reference": "string",
      "status": "draft | posted | cancelled",
      "created_at": "timestamp"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/journal-entries

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "journal_id": "uuid (required)",
  "accounting_date": "date (required)",
  "reference": "string",
  "lines": [
    {
      "account_id": "uuid (required)",
      "debit": 1000.00,
      "credit": 0,
      "partner_id": "uuid (optional)"
    },
    {
      "account_id": "uuid (required)",
      "debit": 0,
      "credit": 1000.00,
      "partner_id": "uuid (optional)"
    }
  ]
}
```

**INVARIANT:** SUM(debit) = SUM(credit)

**Response 201:** Journal entry with lines

**Errors:**
- 400: `UNBALANCED_JOURNAL` — Debit ≠ Credit

---

## 10. Budgets

### GET /api/v1/budgets

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Query Params:** `?type=income|expense&status=draft|confirmed|revised|cancelled`

**Response 200:**
```json
{
  "budgets": [
    {
      "id": "uuid",
      "name": "string",
      "responsible": "string",
      "start_date": "date",
      "end_date": "date",
      "type": "income | expense",
      "committed_amount": 200000.00,
      "achieved_amount": 10000.00,
      "achieved_percentage": 5.00,
      "amount_to_achieve": 190000.00,
      "status": "draft | confirmed | revised | cancelled",
      "previous_budget_id": "uuid | null",
      "analytical_id": "uuid",
      "is_archived": false,
      "created_at": "timestamp"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/budgets

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "name": "string (required)",
  "responsible": "string",
  "start_date": "date (required)",
  "end_date": "date (required)",
  "type": "income | expense (required)",
  "analytical_id": "uuid (required)"
}
```

**Response 201:** Budget object (status = draft)

---

### PUT /api/v1/budgets/:id/confirm

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "committed_amount": 200000.00 (required, user-entered)
}
```

**Response 200:** Updated budget (status = confirmed)

**Errors:**
- 400: `INVALID_TRANSITION`
- 400: `AMOUNT_REQUIRED`

---

### POST /api/v1/budgets/:id/revise

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 201:** New budget (draft, linked via previous_budget_id)

---

### PUT /api/v1/budgets/:id/cancel

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:** Updated budget (status = cancelled, is_archived = true)

---

## 11. Sales Orders

### GET /api/v1/sales-orders

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:**
```json
{
  "sales_orders": [
    {
      "id": "uuid",
      "so_number": "S00001",
      "customer_id": "uuid",
      "customer_name": "string",
      "order_date": "date",
      "status": "draft | confirmed | cancelled",
      "total_amount": 10000.00,
      "created_at": "timestamp"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/sales-orders

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "customer_id": "uuid (required)",
  "order_date": "date (required)",
  "lines": [
    {
      "product_id": "uuid (required)",
      "account_id": "uuid (default: Sales)",
      "analytical_id": "uuid (optional)",
      "quantity": 10 (required, > 0),
      "unit_price": 1000.00 (required, >= 0)
    }
  ]
}
```

**Response 201:** Sales order with auto-generated SO number

---

### GET /api/v1/sales-orders/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:** Sales order with lines

---

### PUT /api/v1/sales-orders/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:** Partial sales order object

**Response 200:** Updated sales order

---

## 12. Customer Invoices

### GET /api/v1/invoices

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user (own only)

**Query Params:** `?status=draft|confirmed|paid&customer_id=uuid`

**Response 200:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoice_reference": "INV/2026/0001",
      "invoice_number": "INV-00001",
      "customer_id": "uuid",
      "customer_name": "string",
      "invoice_date": "date",
      "due_date": "date",
      "status": "draft | confirmed | paid",
      "total_amount": 10000.00,
      "amount_paid": 5000.00,
      "amount_due": 5000.00,
      "sales_order_id": "uuid | null",
      "journal_entry_id": "uuid | null",
      "created_at": "timestamp"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/invoices

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "customer_id": "uuid (required)",
  "invoice_date": "date (required)",
  "due_date": "date (required)",
  "sales_order_id": "uuid (optional)",
  "lines": [
    {
      "product_id": "uuid (required)",
      "account_id": "uuid (default: Sales)",
      "analytical_id": "uuid (optional)",
      "quantity": 10 (required, > 0),
      "unit_price": 1000.00 (required, >= 0)
    }
  ]
}
```

**Response 201:** Invoice with auto-generated reference

---

### GET /api/v1/invoices/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user (own only)

**Response 200:** Invoice with lines

---

### PUT /api/v1/invoices/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:** Partial invoice object (only draft)

**Response 200:** Updated invoice

---

### POST /api/v1/invoices/:id/confirm

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:** Confirmed invoice with journal entry

**Errors:**
- 400: `ALREADY_CONFIRMED`
- 400: `INVALID_TRANSITION`

---

### POST /api/v1/invoices/:id/pay

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user (own only)

**Request:**
```json
{
  "amount": 5000.00 (required, > 0, <= amount_due),
  "payment_via": "bank | cash (required)",
  "payment_date": "date (required)"
}
```

**Response 200:** Payment record

**Errors:**
- 400: `OVERPAYMENT_NOT_ALLOWED`
- 400: `INVALID_AMOUNT`

---

## 13. Purchase Orders

### GET /api/v1/purchase-orders

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:**
```json
{
  "purchase_orders": [
    {
      "id": "uuid",
      "po_number": "P00001",
      "vendor_id": "uuid",
      "vendor_name": "string",
      "order_date": "date",
      "status": "draft | confirmed | cancelled",
      "total_amount": 10000.00,
      "created_at": "timestamp"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/purchase-orders

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "vendor_id": "uuid (required)",
  "order_date": "date (required)",
  "lines": [
    {
      "product_id": "uuid (required)",
      "account_id": "uuid (default: Purchase)",
      "analytical_id": "uuid (optional)",
      "quantity": 10 (required, > 0),
      "unit_price": 1000.00 (required, >= 0)
    }
  ]
}
```

**Response 201:** Purchase order with auto-generated PO number

---

### GET /api/v1/purchase-orders/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:** Purchase order with lines

---

### PUT /api/v1/purchase-orders/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:** Partial purchase order object

**Response 200:** Updated purchase order

---

## 14. Vendor Bills

### GET /api/v1/bills

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user (own only)

**Query Params:** `?status=draft|confirmed|paid&vendor_id=uuid`

**Response 200:**
```json
{
  "bills": [
    {
      "id": "uuid",
      "bill_reference": "Bill/2026/0001",
      "vendor_id": "uuid",
      "vendor_name": "string",
      "bill_date": "date",
      "due_date": "date",
      "status": "draft | confirmed | paid",
      "total_amount": 10000.00,
      "amount_paid": 5000.00,
      "amount_due": 5000.00,
      "purchase_order_id": "uuid | null",
      "journal_entry_id": "uuid | null",
      "created_at": "timestamp"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/bills

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:**
```json
{
  "vendor_id": "uuid (required)",
  "bill_date": "date (required)",
  "due_date": "date (required)",
  "purchase_order_id": "uuid (optional)",
  "lines": [
    {
      "product_id": "uuid (required)",
      "account_id": "uuid (default: Purchase)",
      "analytical_id": "uuid (optional)",
      "quantity": 10 (required, > 0),
      "unit_price": 1000.00 (required, >= 0)
    }
  ]
}
```

**Response 201:** Bill with auto-generated reference

---

### GET /api/v1/bills/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user (own only)

**Response 200:** Bill with lines

---

### PUT /api/v1/bills/:id

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Request:** Partial bill object (only draft)

**Response 200:** Updated bill

---

### POST /api/v1/bills/:id/confirm

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Response 200:** Confirmed bill with journal entry

**Errors:**
- 400: `ALREADY_CONFIRMED`
- 400: `INVALID_TRANSITION`

---

### POST /api/v1/bills/:id/pay

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user (own only)

**Request:**
```json
{
  "amount": 5000.00 (required, > 0, <= amount_due),
  "payment_via": "bank | cash (required)",
  "payment_date": "date (required)"
}
```

**Response 200:** Payment record

**Errors:**
- 400: `OVERPAYMENT_NOT_ALLOWED`
- 400: `INVALID_AMOUNT`

---

## 15. Payments

### GET /api/v1/payments

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user (own only)

**Query Params:** `?invoice_id=uuid&vendor_bill_id=uuid`

**Response 200:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "payment_number": "PAY/2026/0001",
      "invoice_id": "uuid | null",
      "vendor_bill_id": "uuid | null",
      "amount": 5000.00,
      "payment_via": "bank | cash",
      "payment_date": "date",
      "created_at": "timestamp"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### POST /api/v1/payments

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user (own only)

**Request:**
```json
{
  "invoice_id": "uuid (optional)",
  "vendor_bill_id": "uuid (optional)",
  "amount": 5000.00 (required, > 0),
  "payment_via": "bank | cash (required)",
  "payment_date": "date (required)"
}
```

**Response 201:** Payment record

---

## 16. Dashboard

### GET /api/v1/dashboard

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant, user

**Response 200:**
```json
{
  "sales": {
    "draft": 5,
    "confirmed": 10,
    "total": 15
  },
  "purchase": {
    "draft": 3,
    "confirmed": 7,
    "total": 10
  },
  "budgets": {
    "draft": 2,
    "confirmed": 5,
    "total": 7
  }
}
```

---

## 17. Reports

### GET /api/v1/reports/profit-and-loss

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Query Params:** `?year=2026`

**Response 200:**
```json
{
  "year": 2026,
  "income": {
    "items": [
      { "account_name": "Income from Sales", "amount": 10000.00 }
    ],
    "total": 10000.00
  },
  "expenses": {
    "items": [
      { "account_name": "Purchase Expense", "amount": 6000.00 },
      { "account_name": "Other Expense", "amount": 1000.00 }
    ],
    "total": 7000.00
  },
  "net_income": 3000.00
}
```

---

### GET /api/v1/reports/balance-sheet

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Query Params:** `?year=2026`

**Response 200:**
```json
{
  "year": 2026,
  "assets": {
    "items": [
      { "account_name": "Bank", "amount": 10000.00 },
      { "account_name": "Debtors", "amount": 7000.00 }
    ],
    "total": 17000.00
  },
  "liabilities": {
    "items": [
      { "account_name": "Creditors", "amount": 10000.00 },
      { "account_name": "Capital", "amount": 10000.00 },
      { "account_name": "Income from Sales", "amount": 10000.00 }
    ],
    "total": 30000.00
  },
  "balance_check": true
}
```

**INVARIANT:** Total Assets MUST equal Total Liabilities.

---

### GET /api/v1/reports/budget-report

**Headers:** `Cookie: auth_token=<jwt>`  
**RBAC:** admin, accountant

**Query Params:** `?year=2026&type=income|expense`

**Response 200:**
```json
{
  "budgets": [
    {
      "id": "uuid",
      "name": "January 2026",
      "start_date": "2026-01-01",
      "end_date": "2026-01-31",
      "type": "income",
      "committed_amount": 200000.00,
      "achieved_amount": 10000.00,
      "achieved_percentage": 5.00,
      "amount_to_achieve": 190000.00,
      "status": "confirmed"
    }
  ]
}
```

---

## 18. Upload

### POST /api/v1/upload

**Headers:** `Cookie: auth_token=<jwt>`  
**Content-Type:** multipart/form-data

**Request:**
```
file: <binary>
```

**Response 200:**
```json
{
  "url": "/uploads/filename.jpg"
}
```

**Allowed MIME types:** image/jpeg, image/png, image/gif, image/webp  
**Max file size:** 5MB

---

## 19. Error Response Format

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

---

*Document generated from frozen API decisions on 2026-09-05*
