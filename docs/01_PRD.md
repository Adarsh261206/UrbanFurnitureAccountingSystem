# 01 — Product Requirements Document (PRD)

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Excalidraw Annotations + 10 Conflict Resolutions + 8 Engineering Decisions  
> **Date:** 2026-09-05

---

## 1. Product Overview

A full-featured accounting management system for urban furniture businesses, providing role-based access to financial operations including invoicing, bill management, journal entries, budgeting, and financial reporting.

**Frozen Architecture:** Backend = Node.js/Express + Prisma + PostgreSQL. Frontend = React via Lovable. Auth = HttpOnly cookie (JWT never in response body).

## 2. Target Users

| Role | Description | Primary Tasks |
|------|-------------|---------------|
| Administrator | System owner with full access | User management, all operations |
| Accountant | Financial operator | Master data, transactions, reports |
| User (Invoicing User) | Customer/vendor portal user | View own invoices/bills, pay dues |

**3 roles confirmed.** Sign Up creates only invoicing user role.

## 3. Functional Requirements

### 3.1 Authentication & User Management

| Req ID | Requirement | Priority | Frozen Decision |
|--------|------------|----------|-----------------|
| REQ-AUTH-001 | Users can log in with Login ID and Password | MUST | Cookie-based auth |
| REQ-AUTH-002 | Sign Up creates only invoicing user role | MUST | Role = user |
| REQ-AUTH-003 | Login ID must be unique, 6–12 characters | MUST | Unique constraint |
| REQ-AUTH-004 | Password requires uppercase + lowercase + special char + >8 chars | MUST | bcrypt hash |
| REQ-AUTH-005 | Only Administrator can create new users | MUST | RBAC enforced |
| REQ-AUTH-006 | Invalid login shows "Invalid Login Id or Password" | MUST | Generic error |
| REQ-AUTH-007 | Forgot Password functionality | SHOULD | Defer to post-hackathon |

**Cookie Spec:** Name=auth_token, HttpOnly=true, Secure=true, SameSite=Strict, Path=/api, Max-Age=86400. JWT NEVER returned in response body.

### 3.2 Master Data Management

| Req ID | Requirement | Priority | Frozen Decision |
|--------|------------|----------|-----------------|
| REQ-CON-001 | Contact CRUD (Create, Read, Update) | MUST | No soft delete |
| REQ-CON-002 | Contact email must be unique | MUST | Unique constraint |
| REQ-CON-003 | Contact supports image upload | SHOULD | Local storage only |
| REQ-CON-004 | Contact address fields (Street, City, State, Country, Pincode) | MUST | JSONB field |
| REQ-PRD-001 | Product CRUD | MUST | No soft delete |
| REQ-PRD-002 | Product types: Goods, Service, Combo | MUST | Enum |
| REQ-PRD-003 | Product category can be created on-the-fly | MUST | Inline category creation |
| REQ-PRD-004 | Product has Sales Price and Cost (Rs., non-negative) | MUST | DECIMAL(15,2) |
| REQ-ANA-001 | Analytical account creation | MUST | Part of chart_of_accounts |
| REQ-ANA-002 | Analytical account has Responsible, Date Range, Analytic Account | MUST | Fields on chart_of_accounts |

### 3.3 Chart of Accounts & Journals

| Req ID | Requirement | Priority | Frozen Decision |
|--------|------------|----------|-----------------|
| REQ-COA-001 | Pre-configured chart of accounts (Sales, Purchase, Bank, Cash, Capital) | MUST | Seed data |
| REQ-COA-002 | Account types: Asset, Liability, Bank, Capital, Cash, Income, Expense | MUST | Enum |
| REQ-JNL-001 | Pre-configured journals: Sales, Purchase, Bank, Cash | MUST | Seed data |
| REQ-JNL-002 | Journal entry lines must be balanced (debit = credit) | MUST | INVARIANT |
| REQ-JNL-003 | Manual journal entry creation | MUST | Admin/Accountant only |

### 3.4 Budget Management

| Req ID | Requirement | Priority | Frozen Decision |
|--------|------------|----------|-----------------|
| REQ-BUD-001 | Budget CRUD with fields: Name, Responsible, Period, Type, Analytic Account | MUST | User-entered committed amount |
| REQ-BUD-002 | Budget states: Draft → Confirmed → Revised / Cancelled | MUST | See STATE_MACHINES.md |
| REQ-BUD-003 | Committed Amount visible only after confirmation | MUST | User-entered on confirm |
| REQ-BUD-004 | Achieved Amount computed from matching invoices/bills | MUST | See REPORTING_SPEC.md |
| REQ-BUD-005 | Achieved % = (Achieved / Committed) × 100 | MUST | Computed |
| REQ-BUD-006 | Amount To Achieve = Committed - Achieved | MUST | Computed |
| REQ-BUD-007 | Revision creates new budget, links to original | MUST | previous_budget_id FK |
| REQ-BUD-008 | Cancel archives the budget | MUST | is_archived = true |

### 3.5 Sales & Customer Invoicing

| Req ID | Requirement | Priority | Frozen Decision |
|--------|------------|----------|-----------------|
| REQ-SO-001 | Sales Order creation with auto-generated SO No. (S00001+1) | MUST | PostgreSQL sequence |
| REQ-SO-002 | SO lines: Product, Chart of Account (default: Sales), Analytics, Qty, Unit Price | MUST | Line items |
| REQ-INV-001 | Customer Invoice auto-generated from SO or directly | MUST | Optional SO link |
| REQ-INV-002 | Invoice Reference format: INV/YYYY/NNNN | MUST | PostgreSQL sequence |
| REQ-INV-003 | Invoice confirmation creates balanced journal entry | MUST | Automated JE |
| REQ-INV-004 | Journal entry: DEBIT Debtor (partner=customer), CREDIT Sales Income | MUST | Two lines |
| REQ-INV-005 | Invoice states: Draft → Confirmed → Paid | MUST | See STATE_MACHINES.md |
| REQ-INV-006 | Invoice payment reduces amount_due | MUST | Atomic update |
| REQ-INV-007 | Full payment sets status to Paid | MUST | amount_due = 0 |
| REQ-INV-008 | Print invoice as PDF | SHOULD | PDF generation |
| REQ-INV-009 | Send invoice via email | SHOULD | Mock email |

**Cancellation:** Only draft invoices can be cancelled. Confirmed/paid invoices cannot be cancelled.

### 3.6 Purchase & Vendor Bills

| Req ID | Requirement | Priority | Frozen Decision |
|--------|------------|----------|-----------------|
| REQ-PO-001 | Purchase Order creation with auto-generated PO No. (P00001+1) | MUST | PostgreSQL sequence |
| REQ-PO-002 | PO lines: Product, Chart of Account (default: Purchase), Analytics, Qty, Unit Price | MUST | Line items |
| REQ-BIL-001 | Vendor Bill auto-generated from PO or directly | MUST | Optional PO link |
| REQ-BIL-002 | Bill Reference format: Bill/YYYY/NNNN | MUST | PostgreSQL sequence |
| REQ-BIL-003 | Bill confirmation creates balanced journal entry | MUST | Automated JE |
| REQ-BIL-004 | Journal entry: DEBIT Purchase Expense, CREDIT Creditor (partner=vendor) | MUST | Two lines |
| REQ-BIL-005 | Bill states: Draft → Confirmed → Paid | MUST | See STATE_MACHINES.md |
| REQ-BIL-006 | Bill payment reduces amount_due | MUST | Atomic update |
| REQ-BIL-007 | Print bill as PDF | SHOULD | PDF generation |
| REQ-BIL-008 | Send bill via email | SHOULD | Mock email |

**Cancellation:** Only draft bills can be cancelled. Confirmed/paid bills cannot be cancelled.

### 3.7 Financial Reports

| Req ID | Requirement | Priority | Frozen Decision |
|--------|------------|----------|-----------------|
| REQ-RPT-001 | Profit & Loss Report (by year) | MUST | See REPORTING_SPEC.md |
| REQ-RPT-002 | Balance Sheet (by year) | MUST | See REPORTING_SPEC.md |
| REQ-RPT-003 | Balance Sheet: Total Assets = Total Liabilities | MUST | INVARIANT |
| REQ-RPT-004 | Budget Report with achieved amounts | MUST | See REPORTING_SPEC.md |
| REQ-RPT-005 | Print/download reports | SHOULD | PDF export |

### 3.8 Dashboard

| Req ID | Requirement | Priority | Frozen Decision |
|--------|------------|----------|-----------------|
| REQ-DAS-001 | Dashboard with module tabs: Account, Sales, Purchase, Report | MUST | Navigation |
| REQ-DAS-002 | Kanban cards showing counts: Draft, Confirmed, All for Sales, Purchase, Budget | SHOULD | Aggregation queries |

## 4. Non-Functional Requirements

| Category | Requirement | Priority | Frozen Decision |
|----------|------------|----------|-----------------|
| Security | Passwords hashed with bcrypt | MUST | bcrypt |
| Security | JWT-based authentication | MUST | HttpOnly cookie only |
| Security | Role-based access control on all endpoints | MUST | See RBAC_MATRIX.md |
| Security | CSRF protection via SameSite=Strict | MUST | SameSite=Strict |
| Performance | Server-side pagination on all lists | MUST | OFFSET/LIMIT |
| Performance | Proper indexing on frequently queried columns | MUST | See PERFORMANCE.md |
| Data Integrity | All financial operations atomic | MUST | SERIALIZABLE |
| Data Integrity | Journal entries always balanced | MUST | INVARIANT |
| Auditability | Track created_at / updated_at on all records | SHOULD | Timestamps |

## 5. Out of Scope (for 24-hour hackathon)

- Multi-currency support
- Tax calculation
- Advanced reporting (cash flow, trial balance)
- Inventory management
- User deactivation/deletion workflows
- Email service integration (mock only)
- Image upload to cloud storage (local only)
- Audit logging (engineering recommendation, not source required)

## 6. Success Criteria

1. User can sign up and log in with correct role-based access
2. Contact and Product master data can be managed
3. Invoice and Bill workflows complete end-to-end
4. Journal entries are automatically created and always balanced
5. P&L and Balance Sheet reports display correctly
6. Balance Sheet balances (assets = liabilities)
7. Budget workflow complete with achievement calculation

## 7. Conflict Resolutions

| ID | Conflict | Resolution |
|----|----------|------------|
| CR-001 | 2 roles vs 3 roles | 3 roles (Admin, Accountant, User) |
| CR-002 | SIGN OUT label on Sign Up | Label = SIGN UP |
| CR-003 | Password uniqueness | Passwords NOT unique |
| CR-004 | ORM ambiguity (pg vs Prisma) | Prisma ONLY |
| CR-005 | Auth token delivery | HttpOnly cookie ONLY |
| CR-006 | camelCase vs snake_case | DB: snake_case, API: snake_case, Prisma: camelCase |
| CR-007 | Invoice cancellation | Only draft can cancel |
| CR-008 | Analytical vs Budget structure | Separate structures |
| CR-009 | Receipt vs Payment naming | Single payments table |
| CR-010 | Budget committed amount | User-entered on confirm |

---

*Document generated from Excalidraw annotations + conflict resolutions on 2026-09-05*
