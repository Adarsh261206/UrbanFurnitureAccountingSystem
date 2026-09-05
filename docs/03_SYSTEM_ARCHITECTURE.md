# 03 — System Architecture

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Frozen Architecture Decisions  
> **Date:** 2026-09-05

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                        │   │
│  │  • Authentication (HttpOnly cookie ONLY)                │   │
│  │  • Role-based UI rendering                              │   │
│  │  • Form validation (client-side)                        │   │
│  │  • State management                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API SERVER (Node.js)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Express.js                            │   │
│  │  • JWT Authentication Middleware (HttpOnly cookie)      │   │
│  │  • Role-based Authorization Middleware                  │   │
│  │  • Input Validation (express-validator)                 │   │
│  │  • Rate Limiting                                        │   │
│  │  • CORS                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Business Logic                        │   │
│  │  • Accounting Engine                                    │   │
│  │  • State Machine Controllers                            │   │
│  │  • Report Generators                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ SQL (parameterized)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • UUID primary keys                                    │   │
│  │  • DECIMAL(15,2) for monetary values                    │   │
│  │  • CHECK constraints for data integrity                 │   │
│  │  • UNIQUE constraints                                   │   │
│  │  • Foreign key relationships                            │   │
│  │  • snake_case table/column names                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Technology Stack (Frozen)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React + TypeScript | Latest | UI framework |
| Frontend Build | Vite | Latest | Build tool |
| Frontend Generation | Lovable | Latest | AI-assisted generation |
| Backend | Node.js + Express | LTS | API server |
| ORM | Prisma | Latest | Database access (ONLY) |
| Database | PostgreSQL | 15+ | Data storage |
| Auth | JWT + HttpOnly cookie | — | Authentication |
| Validation | express-validator | Latest | Input validation |

**FROZEN:** Prisma is the ONLY ORM. Never use `pg` directly for queries. Never return JWT in response body.

## 3. Authentication Architecture (Frozen)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTH FLOW                                     │
│                                                                 │
│  1. Client sends POST /auth/login with {login_id, password}    │
│                                                                 │
│  2. Server validates credentials                                │
│                                                                 │
│  3. Server generates JWT (15 min expiry)                       │
│                                                                 │
│  4. Server sets HttpOnly cookie:                                │
│     Set-Cookie: auth_token=<jwt>;                              │
│                 HttpOnly=true;                                  │
│                 Secure=true;                                    │
│                 SameSite=Strict;                                │
│                 Path=/api;                                      │
│                 Max-Age=86400                                   │
│                                                                 │
│  5. Server returns user object (NO JWT in body)                │
│                                                                 │
│  6. Browser automatically sends cookie on subsequent requests  │
│                                                                 │
│  7. Server validates JWT from cookie on protected routes        │
│                                                                 │
│  8. Logout: Set-Cookie with Max-Age=0                          │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Database Architecture (Frozen)

### 4.1 Naming Convention

| Location | Convention | Example |
|----------|-----------|---------|
| PostgreSQL tables | snake_case | customer_invoices |
| PostgreSQL columns | snake_case | invoice_reference |
| Prisma schema | camelCase | customerInvoice |
| Prisma @map | snake_case | @map("customer_invoices") |
| API JSON responses | snake_case | invoice_reference |

### 4.2 Data Types

| Data Type | PostgreSQL | Prisma | Use |
|-----------|-----------|--------|-----|
| UUID | UUID | String @db.Uuid | All PKs, FKs |
| Money | DECIMAL(15,2) | Decimal @db.Decimal(15,2) | All monetary |
| Text | VARCHAR(n) | String | Names, emails |
| Boolean | BOOLEAN | Boolean | Flags |
| Date | DATE | DateTime @db.Date | Dates only |
| Timestamp | TIMESTAMPTZ | DateTime @db.Timestamptz | Timestamps |
| JSON | JSONB | Json | Flexible data |
| Enum | VARCHAR + CHECK | String | Status fields |

### 4.3 Table Count

**19 tables total:**
1. users
2. contacts
3. categories
4. products
5. chart_of_accounts
6. journals
7. journal_entries
8. journal_entry_lines
9. budgets
10. sales_orders
11. sales_order_lines
12. customer_invoices
13. customer_invoice_lines
14. purchase_orders
15. purchase_order_lines
16. vendor_bills
17. vendor_bill_lines
18. payments
19. analytical_accounts

## 5. API Architecture (Frozen)

### 5.1 Base URL

```
http://localhost:3000/api/v1
```

**FROZEN:** All endpoints under `/api/v1/`. No exceptions.

### 5.2 Endpoint Count

| Module | Endpoints |
|--------|-----------|
| Auth | 4 |
| Users | 1 |
| Contacts | 4 |
| Products | 4 |
| Categories | 2 |
| Accounts | 2 |
| Journals | 1 |
| Journal Entries | 2 |
| Budgets | 5 |
| Sales Orders | 4 |
| Invoices | 6 |
| Purchase Orders | 4 |
| Bills | 6 |
| Payments | 2 |
| Dashboard | 1 |
| Reports | 3 |
| Upload | 1 |
| **Total** | **52** |

### 5.3 Response Format

```json
// Success
{
  "id": "uuid",
  "name": "string",
  ...
}

// List
{
  "contacts": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}

// Error
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "field_name | null",
    "details": {}
  }
}
```

## 6. Security Architecture (Frozen)

### 6.1 CSRF Protection

- SameSite=Strict on all cookies
- No cross-origin form submissions allowed

### 6.2 IDOR Prevention

- Object-level authorization on all endpoints
- User can only access own invoices/bills/payments
- Accountant/Admin can access all

### 6.3 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 6/minute |
| POST /auth/signup | 4/hour |
| All other | 101/minute |

### 6.4 Password Security

- bcrypt hash (never plaintext)
- Minimum 8 characters
- Uppercase + lowercase + special character

## 7. Concurrency Architecture (Frozen)

### 7.1 Isolation Levels

| Operation | Isolation Level |
|-----------|----------------|
| Read operations | READ COMMITTED |
| Invoice confirmation | SERIALIZABLE |
| Bill confirmation | SERIALIZABLE |
| Payment processing | SERIALIZABLE |
| Budget revision | SERIALIZABLE |

### 7.2 Race Condition Prevention

- Optimistic locking (status check before update)
- Atomic payment processing (SELECT FOR UPDATE)
- PostgreSQL sequences for unique numbers

---

*Document generated from frozen architecture decisions on 2026-09-05*
