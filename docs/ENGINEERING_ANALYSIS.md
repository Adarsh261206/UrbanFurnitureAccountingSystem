# Urban Furniture Accounting System — Complete Engineering Analysis

> **Project:** Urban Furniture OS — Accounting Management System
> **Hackathon Duration:** 24 Hours
> **Source Materials:** Official Problem Statement PDF + Excalidraw Mockup/Specification
> **Classification:** SOURCE_REQUIRED unless otherwise noted

---

## PHASE 1 — EXHAUSTIVE SOURCE ANALYSIS

### 1.1 Complete Screen Inventory

| # | Screen Name | Source Reference | Classification |
|---|------------|-----------------|----------------|
| S01 | Create User | Excalidraw Screen 1 (Y: -367 to 227) | SOURCE_REQUIRED |
| S02 | Login Page | Excalidraw Screen 2 (Y: 406-1195) | SOURCE_REQUIRED |
| S03 | Sign Up Page | Excalidraw Screen 2 (Y: 406-1195) | SOURCE_REQUIRED |
| S04 | Forgot Password | Excalidraw Screen 2 (link mentioned) | SOURCE_REQUIRED |
| S05 | App Dashboard | Excalidraw Screen 3 (Y: 1584-2385) | SOURCE_REQUIRED |
| S06 | Contact List View | Excalidraw Screen 4 (Y: 2695-3573) | SOURCE_REQUIRED |
| S07 | Contact Kanban View | Excalidraw Screen 4 (Y: 2695-3573) | SOURCE_REQUIRED |
| S08 | Contact Master Form View | Excalidraw Screen 4 (Y: 2695-3573) | SOURCE_REQUIRED |
| S09 | Product Master List View | Excalidraw Screen 5 (Y: 3874-4499) | SOURCE_REQUIRED |
| S10 | Product Master Kanban View | Excalidraw Screen 5 (Y: 3874-4499) | SOURCE_REQUIRED |
| S11 | Product Master Form View | Excalidraw Screen 5 (Y: 3874-4499) | SOURCE_REQUIRED |
| S12 | Analyticals Form View | Excalidraw Screen 8 (Y: 7392-7985) | SOURCE_REQUIRED |
| S13 | Analytical Budget Form View | Excalidraw Screen 8 (Y: 7392-7985) | SOURCE_REQUIRED |
| S14 | Chart of Accounts List View | Excalidraw Screen 6 (Y: 4971-6316) | SOURCE_REQUIRED |
| S15 | Chart of Account Form View | Excalidraw Screen 6 (Y: 4971-6316) | SOURCE_REQUIRED |
| S16 | Journals List View | Excalidraw Screen 6 (Y: 4971-6316) | SOURCE_REQUIRED |
| S17 | Journal Entry Form View | Excalidraw Screen 6 (Y: 4971-6316) | SOURCE_REQUIRED |
| S18 | Journal Entries List View | Excalidraw Screen 6 (Y: 4971-6316) | SOURCE_REQUIRED |
| S19 | Budget Report List View | Excalidraw Screen 8 (Y: 7392-7985) | SOURCE_REQUIRED |
| S20 | Budget Report Kanban View | Excalidraw Screen 8 (Y: 7392-7985) | SOURCE_REQUIRED |
| S21 | Budget Form View (Original) | Excalidraw Screen 8 (Y: 7392-7985) | SOURCE_REQUIRED |
| S22 | Budget Form View (Revised) | Excalidraw Screen 8 (Y: 7392-7985) | SOURCE_REQUIRED |
| S23 | Sales Order Form View | Excalidraw Screen 12 (Y: 12302-13061) | SOURCE_REQUIRED |
| S24 | Customer Invoice Form View | Excalidraw Screen 12 (Y: 12302-13061) | SOURCE_REQUIRED |
| S25 | Customer Invoice Payment View | Excalidraw Screen 13 (Y: 13304-13655) | SOURCE_REQUIRED |
| S26 | Purchase Order Form View | Excalidraw Screen 10 (Y: 10008-11101) | SOURCE_REQUIRED |
| S27 | Vendor Bill Form View | Excalidraw Screen 10 (Y: 10008-11101) | SOURCE_REQUIRED |
| S28 | Vendor Bill Payment View | Excalidraw Screen 11 (Y: 11318-11838) | SOURCE_REQUIRED |
| S29 | Profit and Loss Report | Excalidraw Screen 14 (Y: 14323-14889) | SOURCE_REQUIRED |
| S30 | Balance Sheet Report | Excalidraw Screen 14 (Y: 14323-14889) | SOURCE_REQUIRED |

### 1.2 Module Inventory

| Module | Menu Label | Sub-items | Classification |
|--------|-----------|-----------|----------------|
| Account | Account | Contact, Product, Analyticals, Analytical Budget, Chart of Account, Journals, Journal Entries | SOURCE_REQUIRED |
| Sales | Sales | Sales Order, Sale Invoice, Receipt | SOURCE_REQUIRED |
| Purchase | Purchase | Purchase Order, Purchase Bill, Payment | SOURCE_REQUIRED |
| Report | Report | Balancesheet, Profit and Loss, Budget Report | SOURCE_REQUIRED |

### 1.3 Role Definitions (from Excalidraw annotations)

**SOURCE_REQUIRED:**

| Role | Description |
|------|-------------|
| Admin / Administrator | Have all access rights |
| User / Invoicing User | Can only see his invoices/bills in paid/unpaid status and can directly pay his dues from portal |
| Accountant | Create Master data, record Transactions and View reports. Can manage customers/vendors, access accounting dashboard, create journal entries, Can create and manage invoices, bills, and payments |

**EXCALIDRAW ANNOTATION (verbatim):**
> "Role
> Admin - Have all access rights
> User - can only see his invoices/bills in paid/unpaid status and can directly pay his dues from portal
> Accountant - Create Master data, record Transactions and View reports. Can manage customers/vendors, access accounting dashboard, create journal entries, Can create and manage invoices, bills, and payments"

### 1.4 Button Inventory

| Screen | Button | Action | Classification |
|--------|--------|--------|----------------|
| Create User | Create | Create user record | SOURCE_REQUIRED |
| Create User | Cancel | Return to previous | SOURCE_REQUIRED |
| Login Page | SIGN IN | Authenticate | SOURCE_REQUIRED |
| Login Page | Forgot Password | Navigate to Forgot Password | SOURCE_REQUIRED |
| Login Page | Sign Up | Navigate to Sign Up | SOURCE_REQUIRED |
| Sign Up Page | SIGN OUT | (unclear - label says SIGN OUT but context suggests SUBMIT/CREATE) | SOURCE_AMBIGUOUS |
| Dashboard | New | Open blank form for context | SOURCE_REQUIRED |
| Contact List | New | Open blank contact form | SOURCE_REQUIRED |
| Contact List | Back | Return to dashboard | SOURCE_REQUIRED |
| Contact Form | New | Open blank form | SOURCE_REQUIRED |
| Contact Form | Confirm | Save/confirm record | SOURCE_REQUIRED |
| Contact Form | Back | Return to list | SOURCE_REQUIRED |
| Contact Form | Search | Search contacts | SOURCE_REQUIRED |
| Product List | New | Open blank product form | SOURCE_REQUIRED |
| Product Form | Confirm | Save/confirm record | SOURCE_REQUIRED |
| Product Form | Back | Return to list | SOURCE_REQUIRED |
| Budget Form | New | Create new budget | SOURCE_REQUIRED |
| Budget Form | Confirm | Confirm budget | SOURCE_REQUIRED |
| Budget Form | Revise | Create revised budget | SOURCE_REQUIRED |
| Budget Form | Cancel | Cancel/archive budget | SOURCE_REQUIRED |
| Invoice Form | Create Invoice | Create invoice from SO | SOURCE_REQUIRED |
| Invoice Form | Confirm | Confirm invoice | SOURCE_REQUIRED |
| Invoice Form | Cancel | Cancel invoice | SOURCE_REQUIRED |
| Invoice Form | Back | Return to list | SOURCE_REQUIRED |
| Invoice Form | Pay | Make payment | SOURCE_REQUIRED |
| Invoice Form | Print | Print invoice | SOURCE_REQUIRED |
| Invoice Form | Send | Send via email | SOURCE_REQUIRED |
| Bill Form | Create Bill | Create bill from PO | SOURCE_REQUIRED |
| Bill Form | Confirm | Confirm bill | SOURCE_REQUIRED |
| Bill Form | Cancel | Cancel bill | SOURCE_REQUIRED |
| Bill Form | Back | Return to list | SOURCE_REQUIRED |
| Bill Form | Pay | Make payment | SOURCE_REQUIRED |
| Bill Form | Print | Print bill | SOURCE_REQUIRED |
| Bill Form | Send | Send via email | SOURCE_REQUIRED |
| P&L Report | Back | Return to dashboard | SOURCE_REQUIRED |
| P&L Report | Print | Print/download PDF | SOURCE_REQUIRED |
| Balance Sheet | Back | Return to dashboard | SOURCE_REQUIRED |
| Balance Sheet | Print | Print/download PDF | SOURCE_REQUIRED |
| Payment View | Pay | Process payment | SOURCE_REQUIRED |
| Payment View | Back | Return | SOURCE_REQUIRED |
| Payment View | Reset to Draft | Reset status | SOURCE_REQUIRED |

### 1.5 Form Field Inventory

#### Create User Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Name | Text | — | Yes | SOURCE_REQUIRED |
| Login Id | Text | Unique, 6-12 characters | Yes | SOURCE_REQUIRED |
| E-mail id | Email | Unique, not duplicate in DB | Yes | SOURCE_REQUIRED |
| Role | Dropdown (User/Administrator) | Must be valid role | Yes | SOURCE_REQUIRED |
| Password | Password | Must contain uppercase, lowercase, special char, >8 chars | Yes | SOURCE_REQUIRED |
| Re-Enter Password | Password | Must match Password | Yes | SOURCE_REQUIRED |

#### Login Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Login Id | Text | — | Yes | SOURCE_REQUIRED |
| Password | Password | — | Yes | SOURCE_REQUIRED |

#### Sign Up Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Login Id | Text | Unique, 6-12 characters | Yes | SOURCE_REQUIRED |
| Email Id | Email | Unique, not duplicate | Yes | SOURCE_REQUIRED |
| Password | Password | Uppercase + lowercase + special char, >8 chars | Yes | SOURCE_REQUIRED |
| Re-Enter Password | Password | Must match Password | Yes | SOURCE_REQUIRED |

#### Contact Master Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Contact Name | Text | — | Yes | SOURCE_REQUIRED |
| Email | Email | Unique | Yes | SOURCE_REQUIRED |
| Phone | Text | — | Yes | SOURCE_REQUIRED |
| Upload Image | File upload | Image only | No | SOURCE_REQUIRED |
| Address - Street | Text | — | No | SOURCE_REQUIRED |
| Address - City | Text | — | No | SOURCE_REQUIRED |
| Address - State | Text | — | No | SOURCE_REQUIRED |
| Address - Country | Text | — | No | SOURCE_REQUIRED |
| Address - Pincode | Text | — | No | SOURCE_REQUIRED |

#### Product Master Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Product Name | Text | — | Yes | SOURCE_REQUIRED |
| Image | File upload | Image only | No | SOURCE_REQUIRED |
| Product Type | Dropdown (Goods/Service/Combo) | Must be valid type | Yes | SOURCE_REQUIRED |
| Category | Many2one (created on the fly) | — | Yes | SOURCE_REQUIRED |
| Sales Price | Monetary (Rs.) | Non-negative | Yes | SOURCE_REQUIRED |
| Cost | Monetary (Rs.) | Non-negative | Yes | SOURCE_REQUIRED |

#### Analyticals Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Budget Name | Text | — | Yes | SOURCE_REQUIRED |
| Responsible | Many2one (Contact) | Must be valid contact | Yes | SOURCE_REQUIRED |
| Start Date | Date | — | Yes | SOURCE_REQUIRED |
| To | Date | Must be after Start Date | Yes | SOURCE_REQUIRED |
| End Date | Date | Must be after To | Yes | SOURCE_REQUIRED |
| Analytic Account | Many2one | — | Yes | SOURCE_REQUIRED |

#### Budget Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Budget Name | Text | Alpha Numeric | Yes | SOURCE_REQUIRED |
| Responsible | Many2one (Contact) | Must be valid contact | Yes | SOURCE_REQUIRED |
| Start Date | Date | — | Yes | SOURCE_REQUIRED |
| End Date | Date | After Start Date | Yes | SOURCE_REQUIRED |
| Type | Dropdown (Income/Expenses) | — | Yes | SOURCE_REQUIRED |
| Analytic Account | Many2one | — | Yes | SOURCE_REQUIRED |
| Committed Amount | Monetary | Only visible at Confirmed stage | Auto | SOURCE_REQUIRED |
| Achieved Amount | Monetary | Computed from invoices/bills | Auto | SOURCE_REQUIRED |
| Achieved % | Percentage | (Achieved/Committed)*100 | Auto | SOURCE_REQUIRED |
| Amount To Achieve | Monetary | Committed - Achieved | Auto | SOURCE_REQUIRED |

#### Chart of Account Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Account Name | Text | — | Yes | SOURCE_REQUIRED |
| Type | Dropdown (Asset/Liability/Bank/Capital/Cash) | — | Yes | SOURCE_REQUIRED |

#### Journal Entry Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Accounting Date | Date | — | Yes | SOURCE_REQUIRED |
| Journal | Many2one (Journals) | Must be valid journal | Yes | SOURCE_REQUIRED |
| Lines: Account | Many2one (Chart of Accounts) | — | Yes | SOURCE_REQUIRED |
| Lines: Partner | Many2one (Contacts) | — | Yes | SOURCE_REQUIRED |
| Lines: Debit | Monetary | Non-negative | Yes | SOURCE_REQUIRED |
| Lines: Credit | Monetary | Non-negative | Yes | SOURCE_REQUIRED |

#### Customer Invoice / Sales Order Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Invoice Reference | Text (auto-generated) | Auto: INV/YYYY/NNNN | Auto | SOURCE_REQUIRED |
| Customer Invoice No. | Text | Auto-generated | Auto | SOURCE_REQUIRED |
| SO No. | Text | Auto-generated | Auto | SOURCE_REQUIRED |
| Date | Date | Default: Today | Auto | SOURCE_REQUIRED |
| Invoice Date | Date | — | Yes | SOURCE_REQUIRED |
| Customer Name | Many2one (Contact) | — | Yes | SOURCE_REQUIRED |
| Due Date | Date | After Invoice Date | Yes | SOURCE_REQUIRED |
| Payment Type | Dropdown (Receive/Send) | — | Yes | SOURCE_REQUIRED |
| Partner | Many2one (Contact) | Autofill from Customer | Auto | SOURCE_REQUIRED |
| Payment Via | Dropdown (Bank/Cash) | Default: Bank | Yes | SOURCE_REQUIRED |
| Amount | Monetary | Autofill from lines | Auto | SOURCE_REQUIRED |
| Lines: Sr. No. | Auto | Sequential | Auto | SOURCE_REQUIRED |
| Lines: Product | Many2one (Product Master) | — | Yes | SOURCE_REQUIRED |
| Lines: Chart of Account | Many2one | Default: Sales | Yes | SOURCE_REQUIRED |
| Lines: Budget Analytics | Many2one (Analyticals) | — | Yes | SOURCE_REQUIRED |
| Lines: Qty | Numeric | Positive | Yes | SOURCE_REQUIRED |
| Lines: Unit Price | Monetary | Non-negative | Yes | SOURCE_REQUIRED |
| Lines: Total | Monetary | Qty * Unit Price | Auto | SOURCE_REQUIRED |

#### Purchase Order / Vendor Bill Form
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Bill Reference | Text (auto-generated) | Auto: Bill/YYYY/NNNN | Auto | SOURCE_REQUIRED |
| Vendor Bill No. | Text | e.g. ABC-26-001 | Yes | SOURCE_REQUIRED |
| PO No. | Text | Auto-generated P00001+1 | Auto | SOURCE_REQUIRED |
| Date | Date | Default: Today | Auto | SOURCE_REQUIRED |
| Bill Date | Date | — | Yes | SOURCE_REQUIRED |
| Vendor Name | Many2one (Contact) | — | Yes | SOURCE_REQUIRED |
| Due Date | Date | After Bill Date | Yes | SOURCE_REQUIRED |
| Payment Type | Dropdown (Receive/Send) | — | Yes | SOURCE_REQUIRED |
| Partner | Many2one (Contact) | Autofill from Vendor | Auto | SOURCE_REQUIRED |
| Payment Via | Dropdown (Bank/Cash) | Default: Bank | Yes | SOURCE_REQUIRED |
| Amount | Monetary | Autofill from lines | Auto | SOURCE_REQUIRED |
| Lines: Product | Many2one (Product Master) | — | Yes | SOURCE_REQUIRED |
| Lines: Chart of Account | Many2one | Default: Purchase | Yes | SOURCE_REQUIRED |
| Lines: Budget Analytics | Many2one (Analyticals) | — | Yes | SOURCE_REQUIRED |
| Lines: Qty | Numeric | Positive | Yes | SOURCE_REQUIRED |
| Lines: Unit Price | Monetary | Non-negative | Yes | SOURCE_REQUIRED |
| Lines: Total | Monetary | Qty * Unit Price | Auto | SOURCE_REQUIRED |

#### Vendor Bill Payment View
| Field | Type | Validation | Required | Classification |
|-------|------|-----------|----------|----------------|
| Total | Monetary | — | Auto | SOURCE_REQUIRED |
| Paid Via | Dropdown (Cash/Bank) | — | Yes | SOURCE_REQUIRED |
| Amount Due | Monetary | Shows remaining | Auto | SOURCE_REQUIRED |

### 1.6 Dashboard Kanban Cards

The dashboard shows three card groups with counts:

| Group | Card | Count | Classification |
|-------|------|-------|----------------|
| Sales | All | 12 | SOURCE_REQUIRED |
| Sales | Confirmed | 10 | SOURCE_REQUIRED |
| Sales | Draft | 2 | SOURCE_REQUIRED |
| Purchase | All | 12 | SOURCE_REQUIRED |
| Purchase | Confirmed | 10 | SOURCE_REQUIRED |
| Purchase | Draft | 2 | SOURCE_REQUIRED |
| Budget Reports | Achieved | 3 | SOURCE_REQUIRED |
| Budget Reports | Committed | 4 | SOURCE_REQUIRED |
| Budget Reports | Budget | 2 | SOURCE_REQUIRED |

### 1.7 Navigation Structure

```
Login Page
├── Forgot Password (link)
├── Sign Up (link)
└── Dashboard (after login)
    ├── Account (tab)
    │   ├── Contact
    │   ├── Product
    │   ├── Analyticals
    │   ├── Analytical Budget
    │   ├── Chart of Account
    │   ├── Journals
    │   └── Journal Entries
    ├── Sales (tab)
    │   ├── Sales Order
    │   ├── Sale Invoice
    │   └── Receipt
    ├── Purchase (tab)
    │   ├── Purchase Order
    │   ├── Purchase Bill
    │   └── Payment
    └── Report (tab)
        ├── Balancesheet
        ├── Profit and Loss
        └── Budget Report
```

### 1.8 Pre-configured Chart of Accounts (SOURCE_REQUIRED)

| Journal Name | Type | Default Account |
|-------------|------|----------------|
| Sales | Sales | Sales Income A/c |
| Purchase | Purchase | Purchase Expense A/c |
| Bank | Bank | Bank A/c |
| Cash | Cash | Cash A/c |
| Capital A/c | Capital | Capital |

### 1.9 Budget Report Types (from P&L annotations)

- Income
- Expenses
- Other Expenses

### 1.10 Key Business Rules Extracted from Excalidraw Annotations

**RULE-BR-001** (SOURCE_REQUIRED): "All accounts are to be pre configured"

**RULE-BR-002** (SOURCE_REQUIRED): "Blocking warning if the debit and credit amount don't match" — Journal entries must be balanced.

**RULE-BR-003** (SOURCE_REQUIRED): "As soon as the Customer Invoice is confirmed a journal entry would be created... For Customer Invoice always Sales chart of account would be set by default"

**RULE-BR-004** (SOURCE_REQUIRED): "As soon as the vendor bill is confirmed a journal entry would be created... For Vendor bill always purchase chart of account would be set by default"

**RULE-BR-005** (SOURCE_REQUIRED): "The Journal Entry should always be balanced (debit and credit totals need to match)"

**RULE-BR-006** (SOURCE_REQUIRED): "The Total of All asset and liability would always match" (Balance Sheet)

**RULE-BR-007** (SOURCE_REQUIRED): "Each account is assigned an Account Type, which would further be used for how the account to be treated and where it appears in reports."

**RULE-BR-008** (SOURCE_REQUIRED): "All Master will have list view as default and clicking on New button it will open blank form view to enter new record, Clicking on already saved record - it will open form view with saved details."

**RULE-BR-009** (SOURCE_REQUIRED): "Allow user to shift to Kanban View" / "Allow User to shift to List View" — View toggle between List and Kanban.

**RULE-BR-010** (SOURCE_REQUIRED): Budget Achieved Amount Computation:
- **Income**: Search Analytical in Sales Invoice, consider budget period, compute total
- **Expense**: Search Analytical in Vendor Bills, consider budget period, compute total
- Clicking Achieved Amount → list view of all Invoices/Bills with same analytical for budget period

**RULE-BR-011** (SOURCE_REQUIRED): "Revised: Only Visible for Confirmed Budget (user can revise confirmed budget, e.g. change 2,00,000 to 3,50,000)"

**RULE-BR-012** (SOURCE_REQUIRED): "On Clicking Revise — new Budget appears, old moves to Revised state, links between original and revised"

**RULE-BR-013** (SOURCE_REQUIRED): "Cancelled: Archive existing budget"

**RULE-BR-014** (SOURCE_REQUIRED): For Sign Up: "Create a 'user' database into the system on signup"

**RULE-BR-015** (SOURCE_REQUIRED): Login error message: "Invalid Login Id or Password"

---

## PHASE 2 — COMPLETE USER & ROLE MODEL

### 2.1 Role Definitions

| Role ID | Role Name | Source Classification | Description |
|---------|-----------|----------------------|-------------|
| ROLE_ADMIN | Administrator | SOURCE_REQUIRED | Have all access rights |
| ROLE_ACCOUNTANT | Accountant | SOURCE_REQUIRED | Create Master data, record Transactions and View reports |
| ROLE_USER | User / Invoicing User | SOURCE_REQUIRED | Can only see his invoices/bills in paid/unpaid status, can pay dues from portal |

### 2.2 Permission Matrix

| Module / Action | Administrator | Accountant | User (Invoicing) |
|----------------|:---:|:---:|:---:|
| **Authentication** | | | |
| Login | ✅ | ✅ | ✅ |
| Sign Up (create invoicing user) | ✅ | ✅ | ✅ |
| Forgot Password | ✅ | ✅ | ✅ |
| Create User (Admin form) | ✅ | ❌ | ❌ |
| **Dashboard** | | | |
| View Dashboard | ✅ | ✅ | ❌ (portal only) |
| View Kanban Counts | ✅ | ✅ | ❌ |
| **Master Data - Contact** | | | |
| View Contact List | ✅ | ✅ | ❌ |
| Create Contact | ✅ | ✅ | ❌ |
| Edit Contact | ✅ | ✅ | ❌ |
| Delete/Archive Contact | ✅ | ❌ (NOT_SPECIFIED) | ❌ |
| **Master Data - Product** | | | |
| View Product List | ✅ | ✅ | ❌ |
| Create Product | ✅ | ✅ | ❌ |
| Edit Product | ✅ | ✅ | ❌ |
| **Master Data - Analyticals** | | | |
| View Analyticals | ✅ | ✅ | ❌ |
| Create Analytical Account | ✅ | ✅ | ❌ |
| **Master Data - Budget** | | | |
| View Budget Report List | ✅ | ✅ | ❌ |
| Create Budget | ✅ | ✅ | ❌ |
| Confirm Budget | ✅ | ✅ | ❌ |
| Revise Budget | ✅ | ✅ | ❌ |
| Cancel Budget | ✅ | ✅ | ❌ |
| **Chart of Accounts** | | | |
| View Chart of Accounts | ✅ | ✅ | ❌ |
| Create Account | ✅ | ✅ | ❌ |
| **Journals** | | | |
| View Journals | ✅ | ✅ | ❌ |
| **Journal Entries** | | | |
| View Journal Entries | ✅ | ✅ | ❌ |
| Create Journal Entry | ✅ | ✅ | ❌ |
| **Sales** | | | |
| View Sales Orders | ✅ | ✅ | ❌ |
| Create Sales Order | ✅ | ✅ | ❌ |
| Confirm Sales Order | ✅ | ✅ | ❌ |
| View Customer Invoices | ✅ | ✅ | ✅ (own only) |
| Create Customer Invoice | ✅ | ✅ | ❌ |
| Confirm Customer Invoice | ✅ | ✅ | ❌ |
| Print Invoice | ✅ | ✅ | ✅ (own only) |
| Send Invoice | ✅ | ✅ | ✅ (own only) |
| View Receipts | ✅ | ✅ | ✅ (own only) |
| **Purchase** | | | |
| View Purchase Orders | ✅ | ✅ | ❌ |
| Create Purchase Order | ✅ | ✅ | ❌ |
| Confirm Purchase Order | ✅ | ✅ | ❌ |
| View Vendor Bills | ✅ | ✅ | ✅ (own only) |
| Create Vendor Bill | ✅ | ✅ | ❌ |
| Confirm Vendor Bill | ✅ | ✅ | ❌ |
| Print Bill | ✅ | ✅ | ✅ (own only) |
| Send Bill | ✅ | ✅ | ✅ (own only) |
| View Payments | ✅ | ✅ | ✅ (own only) |
| **Payments** | | | |
| Pay Invoice (from portal) | ❌ | ❌ | ✅ (own invoices only) |
| Pay Vendor Bill | ❌ | ✅ | ❌ |
| **Reports** | | | |
| View P&L Report | ✅ | ✅ | ❌ |
| View Balance Sheet | ✅ | ✅ | ❌ |
| View Budget Report | ✅ | ✅ | ❌ |
| Print Reports | ✅ | ✅ | ❌ |
| **User Management** | | | |
| Create Users | ✅ | ❌ | ❌ |
| View Users | ✅ | ❌ | ❌ |

### 2.3 Role Clarification

**CONFLICT IDENTIFIED:**
- The Create User form shows "Role" dropdown with options: "User" and "Administrator" (radio buttons in mockup)
- The Excalidraw annotations define THREE roles: Admin, User, Accountant
- The Sign Up page note says: "only invoicing user will be create"

**ENGINEERING DECISION:**
- The system shall have exactly THREE roles: `admin`, `accountant`, `user`
- The Create User form (accessible only by Admin) should allow selecting any of the three roles
- Sign Up creates users with the `user` role only (invoicing user)
- Admin and Accountant roles are created by the Administrator

---

## PHASE 3 — FULL SCREEN MAP

### 3.1 Application Sitemap

```
Authentication
├── Login (/login)
├── Sign Up (/signup)
└── Forgot Password (/forgot-password)

Application (authenticated)
├── Dashboard (/dashboard)
│
├── Account Module
│   ├── Contact
│   │   ├── List View (/contacts)
│   │   ├── Kanban View (/contacts?view=kanban)
│   │   └── Form View (/contacts/new, /contacts/:id)
│   ├── Product
│   │   ├── List View (/products)
│   │   ├── Kanban View (/products?view=kanban)
│   │   └── Form View (/products/new, /products/:id)
│   ├── Analyticals
│   │   └── Form View (/analyticals/new, /analyticals/:id)
│   ├── Analytical Budget
│   │   └── Form View (/budgets/new, /budgets/:id)
│   ├── Chart of Account
│   │   ├── List View (/chart-of-accounts)
│   │   └── Form View (/chart-of-accounts/new, /chart-of-accounts/:id)
│   ├── Journals
│   │   └── List View (/journals)
│   └── Journal Entries
│       ├── List View (/journal-entries)
│       └── Form View (/journal-entries/new, /journal-entries/:id)
│
├── Sales Module
│   ├── Sales Order
│   │   ├── List View (/sales-orders)
│   │   └── Form View (/sales-orders/new, /sales-orders/:id)
│   ├── Customer Invoice
│   │   ├── List View (/invoices)
│   │   └── Form View (/invoices/new, /invoices/:id)
│   └── Receipt
│       ├── List View (/receipts)
│       └── Payment View (/receipts/:id/pay)
│
├── Purchase Module
│   ├── Purchase Order
│   │   ├── List View (/purchase-orders)
│   │   └── Form View (/purchase-orders/new, /purchase-orders/:id)
│   ├── Vendor Bill
│   │   ├── List View (/bills)
│   │   └── Form View (/bills/new, /bills/:id)
│   └── Payment
│       ├── List View (/payments)
│       └── Payment View (/payments/:id/pay)
│
├── Report Module
│   ├── Profit and Loss (/reports/profit-and-loss)
│   ├── Balance Sheet (/reports/balance-sheet)
│   └── Budget Report (/reports/budget-report)
│
└── Portal (User role only)
    ├── My Invoices (/portal/invoices)
    ├── My Bills (/portal/bills)
    └── Pay Dues (/portal/invoices/:id/pay)
```

### 3.2 Navigation Matrix

| From Screen | Navigation Options | Next Screens |
|------------|-------------------|-------------|
| Login | Forgot Password, Sign Up | Forgot Password, Sign Up, Dashboard |
| Sign Up | Back to Login | Login |
| Forgot Password | Back to Login | Login |
| Dashboard | All tabs and sub-menus | Any module screen |
| Any Module | Back button, other tabs | Dashboard, other modules |
| List View | New button, row click | Form View (new/existing) |
| Form View | Back button, Confirm/Save | List View |
| Form View | Pay button | Payment View |
| Payment View | Back button | Form View |

### 3.3 Deep-Link Requirements (ENGINEERING_DECISION)

All major screens must be deep-linkable:
- `/contacts/:id` — Direct access to specific contact
- `/products/:id` — Direct access to specific product
- `/invoices/:id` — Direct access to specific invoice
- `/bills/:id` — Direct access to specific bill
- `/journal-entries/:id` — Direct access to specific journal entry
- `/budgets/:id` — Direct access to specific budget

### 3.4 Unauthorized Access Behavior (ENGINEERING_DECISION)

- Unauthenticated users → Redirect to `/login`
- User role accessing restricted pages → Show 403 Forbidden
- Accountant role accessing admin-only pages → Show 403 Forbidden

---

## PHASE 4 — COMPLETE BUSINESS WORKFLOWS

### Workflow 1: User Registration (Sign Up)
**Trigger:** User clicks "Sign Up" on Login page
→ **Preconditions:** User is not authenticated
→ **User action:** Fills in Login Id, Email, Password, Re-Enter Password
→ **API request:** `POST /api/v1/auth/signup`
→ **Backend validation:**
  - Login Id: unique, 6-12 characters
  - Email: unique in database
  - Password: contains uppercase, lowercase, special char, >8 chars
  - Password === Re-Enter Password
→ **Database transaction:** INSERT INTO users (role = 'user')
→ **Business logic:** Create user with role 'user' (invoicing user only)
→ **API response:** `{ "id": "...", "status": "created" }`
→ **Frontend:** Redirect to Login page
→ **Failure scenarios:** Duplicate login_id → error; Duplicate email → error; Weak password → validation error
→ **Rollback:** None needed (single insert)

### Workflow 2: Authentication (Login)
**Trigger:** User clicks "SIGN IN"
→ **Preconditions:** User is on Login page
→ **User action:** Enters Login Id and Password
→ **API request:** `POST /api/v1/auth/login`
→ **Backend validation:** Check credentials against database
→ **Business logic:** If credentials match → create session/token; If not → error "Invalid Login Id or Password"
→ **API response:** `{ "token": "...", "user": { "id": "...", "role": "...", "name": "..." } }`
→ **Frontend:** Store token, redirect to Dashboard
→ **Failure scenarios:** Invalid credentials → 401 "Invalid Login Id or Password"

### Workflow 3: Create User (Admin only)
**Trigger:** Admin clicks "Create" on Create User page
→ **Preconditions:** Authenticated as Administrator
→ **User action:** Fills Name, Login Id, Email, Role, Password, Re-Enter Password
→ **API request:** `POST /api/v1/users`
→ **Backend validation:** Same as Sign Up + valid role selection
→ **Database transaction:** INSERT INTO users
→ **API response:** `{ "id": "...", "status": "created" }`

### Workflow 4: Contact Creation
**Trigger:** User clicks "New" on Contact list, fills form, clicks "Confirm"
→ **Preconditions:** Authenticated as Admin or Accountant
→ **User action:** Fills Contact Name, Email (unique), Phone, optional Address fields, optional Image
→ **API request:** `POST /api/v1/contacts`
→ **Backend validation:** Email uniqueness
→ **Database transaction:** INSERT INTO contacts
→ **API response:** `{ "id": "...", "status": "confirmed" }`

### Workflow 5: Product Creation
**Trigger:** User clicks "New" on Product list, fills form, clicks "Confirm"
→ **Preconditions:** Authenticated as Admin or Accountant
→ **User action:** Fills Product Name, Category (can create on fly), Product Type, Sales Price, Cost
→ **API request:** `POST /api/v1/products`
→ **Backend validation:** Non-negative prices, valid product type
→ **Database transaction:** INSERT INTO products (and optionally INSERT INTO categories)
→ **API response:** `{ "id": "...", "status": "confirmed" }`

### Workflow 6: Analytic Account Creation
**Trigger:** User creates new analytical account
→ **API request:** `POST /api/v1/analyticals`
→ **Fields:** Budget Name, Responsible (Contact), Start Date, To, End Date, Analytic Account
→ **Database transaction:** INSERT INTO analyticals

### Workflow 7: Budget Creation
**Trigger:** User creates new budget
→ **API request:** `POST /api/v1/budgets`
→ **Fields:** Budget Name, Responsible, Period, Type (Income/Expense), Analytic Account
→ **Initial status:** Draft

### Workflow 8: Budget Confirmation
**Trigger:** User clicks "Confirm" on draft budget
→ **API request:** `PUT /api/v1/budgets/:id/confirm`
→ **Backend validation:** Status must be 'draft'
→ **State transition:** Draft → Confirmed
→ **Side effects:** Committed Amount becomes visible

### Workflow 9: Budget Revision
**Trigger:** User clicks "Revise" on confirmed budget
→ **API request:** `POST /api/v1/budgets/:id/revise`
→ **Business logic:**
  1. Create new budget (copy of original, name += "Revised")
  2. Link new budget to original via `original_budget_id`
  3. Original budget status → Revised
  4. New budget status → Draft
→ **Database transaction:** INSERT new budget + UPDATE original budget

### Workflow 10: Budget Cancellation
**Trigger:** User clicks "Cancel"
→ **API request:** `PUT /api/v1/budgets/:id/cancel`
→ **Business logic:** Archive the budget record
→ **State transition:** Draft/Confirmed → Cancelled (archived)

### Workflow 11: Sales Order Creation
**Trigger:** User creates new sales order
→ **API request:** `POST /api/v1/sales_orders`
→ **Fields:** Customer, Invoice Date, Due Date, Lines (Product, Chart of Account default Sales, Budget Analytics, Qty, Unit Price)
→ **Auto-generated:** SO No. (S00001+1)
→ **Initial status:** Draft

### Workflow 12: Sales Order Confirmation → Customer Invoice Creation
**Trigger:** User clicks "Create Invoice" or "Confirm"
→ **API request:** `POST /api/v1/invoices` (from SO) or `PUT /api/v1/sales_orders/:id/confirm`
→ **Business logic:**
  1. Fetch Customer Name, Product, Price, Quantity from SO
  2. Link to SO
  3. Auto-generate Invoice Reference: INV/YYYY/NNNN
  4. Default Chart of Account: Sales
→ **State transition:** SO Draft → Confirmed

### Workflow 13: Customer Invoice Confirmation
**Trigger:** User clicks "Confirm" on invoice
→ **API request:** `PUT /api/v1/invoices/:id/confirm`
→ **Backend validation:** Status must be 'draft', lines not empty, amounts valid
→ **Database transaction (ATOMIC):**
  1. UPDATE invoices SET status = 'confirmed'
  2. INSERT INTO journal_entries (journal = 'Sales', date = invoice_date)
  3. INSERT INTO journal_entry_lines:
     - DEBIT: Debtor account (partner = customer, amount = total)
     - CREDIT: Sales Income account (amount = total)
  4. Verify: SUM(debit) = SUM(credit) — FAIL ENTIRE TRANSACTION IF NOT BALANCED
→ **Business logic:** Auto-create balanced journal entry
→ **Side effects:** Amount Due = Invoice Total

### Workflow 14: Customer Invoice Payment
**Trigger:** User clicks "Pay"
→ **API request:** `POST /api/v1/invoices/:id/pay`
→ **Fields:** Payment Via (Bank/Cash), Amount
→ **Database transaction (ATOMIC):**
  1. INSERT INTO payments (invoice_id, amount, payment_via, date)
  2. UPDATE invoices SET amount_due = amount_due - payment_amount
  3. IF amount_due = 0 THEN UPDATE invoices SET status = 'paid'
  4. INSERT INTO journal_entries (journal = relevant cash/bank)
  5. INSERT INTO journal_entry_lines:
     - DEBIT: Bank/Cash account
     - CREDIT: Debtor account
  6. Verify balance
→ **Failure scenarios:** Overpayment blocked, duplicate payment blocked

### Workflow 15: Purchase Order Creation
**Trigger:** User creates new purchase order
→ **API request:** `POST /api/v1/purchase_orders`
→ **Auto-generated:** PO No. (P00001+1)
→ **Initial status:** Draft

### Workflow 16: Vendor Bill Creation from PO
**Trigger:** User creates bill from confirmed PO
→ **Business logic:** Fetch Vendor Name, Product, Price, Quantity from PO
→ **Link:** Bill references PO (visible only if created from PO)
→ **Auto-generated:** Bill Reference: Bill/YYYY/NNNN

### Workflow 17: Vendor Bill Confirmation
**Trigger:** User clicks "Confirm" on bill
→ **API request:** `PUT /api/v1/bills/:id/confirm`
→ **Database transaction (ATOMIC):**
  1. UPDATE bills SET status = 'confirmed'
  2. INSERT INTO journal_entries (journal = 'Purchase', date = bill_date)
  3. INSERT INTO journal_entry_lines:
     - DEBIT: Purchase Expense account (amount = total)
     - CREDIT: Creditor account (partner = vendor, amount = total)
  4. Verify balance
→ **Business logic:** For Vendor bill, always Purchase chart of account set by default

### Workflow 18: Vendor Bill Payment
**Trigger:** User clicks "Pay"
→ **API request:** `POST /api/v1/bills/:id/pay`
→ **Database transaction (ATOMIC):** Similar to invoice payment but reversed

### Workflow 19: Journal Entry Creation (Manual)
**Trigger:** Accountant creates manual journal entry
→ **API request:** `POST /api/v1/journal_entries`
→ **Backend validation:** SUM(debit) MUST equal SUM(credit) — BLOCKING WARNING if not
→ **Database transaction:** Atomic insert of entry + lines
→ **BALANCE REQUIREMENT:** Total debits = Total credits, ELSE reject

### Workflow 20: P&L Report Generation
**Trigger:** User navigates to P&L report
→ **API request:** `GET /api/v1/reports/profit-and-loss?year=YYYY`
→ **Business logic:**
  - Income = SUM of all accounts with type = 'Income' from journal entry lines
  - Expenses = SUM of accounts with type = 'Expense' or 'Other Expense'
  - Net Income = Income - Expenses

### Workflow 21: Balance Sheet Generation
**Trigger:** User navigates to Balance Sheet
→ **API request:** `GET /api/v1/reports/balance-sheet?year=YYYY`
→ **Business logic:**
  - Assets = Bank (type=Bank) + Cash (type=Cash) + Debtors (type=Asset)
  - Liabilities = Creditors (type=Liability) + Capital (type=Capital) + Income from Sales
  - Total Assets MUST equal Total Liabilities (ACCOUNTING EQUATION)

### Workflow 22: Budget Achieved Calculation
**Trigger:** User views budget or clicks on Achieved Amount
→ **Business logic:**
  - **Income type budget:** Query sales invoices with matching Analytic Account, within budget period, sum amounts
  - **Expense type budget:** Query vendor bills with matching Analytic Account, within budget period, sum amounts
  - Achieved % = (Achieved Amount / Committed Amount) × 100
  - Amount To Achieve = Committed Amount - Achieved Amount

---

## PHASE 5 — DATA MODEL

### Naming Convention (ENGINEERING_DECISION)
- **Database:** snake_case
- **Tables:** snake_case
- **Columns:** snake_case
- **Foreign Keys:** `<entity>_id`
- **Primary Keys:** `id`
- **API JSON:** snake_case (consistent with database)
- **Timestamps:** `created_at`, `updated_at` (UTC)

### Entity: users

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| name | VARCHAR(255) | NO | — | — | SOURCE_REQUIRED |
| login_id | VARCHAR(12) | NO | — | UNIQUE, 6-12 chars | SOURCE_REQUIRED |
| email | VARCHAR(255) | NO | — | UNIQUE | SOURCE_REQUIRED |
| password_hash | VARCHAR(255) | NO | — | — | ENGINEERING_DECISION |
| role | ENUM('admin','accountant','user') | NO | 'user' | — | SOURCE_REQUIRED |
| is_active | BOOLEAN | NO | true | — | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: contacts

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| name | VARCHAR(255) | NO | — | — | SOURCE_REQUIRED |
| email | VARCHAR(255) | NO | — | UNIQUE | SOURCE_REQUIRED |
| phone | VARCHAR(50) | YES | — | — | SOURCE_REQUIRED |
| image_url | TEXT | YES | — | — | SOURCE_REQUIRED |
| street | VARCHAR(255) | YES | — | — | SOURCE_REQUIRED |
| city | VARCHAR(100) | YES | — | — | SOURCE_REQUIRED |
| state | VARCHAR(100) | YES | — | — | SOURCE_REQUIRED |
| country | VARCHAR(100) | YES | — | — | SOURCE_REQUIRED |
| pincode | VARCHAR(20) | YES | — | — | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: categories

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| name | VARCHAR(255) | NO | — | UNIQUE | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: products

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| name | VARCHAR(255) | NO | — | — | SOURCE_REQUIRED |
| image_url | TEXT | YES | — | — | SOURCE_REQUIRED |
| product_type | ENUM('goods','service','combo') | NO | — | — | SOURCE_REQUIRED |
| category_id | UUID | NO | — | FK → categories | SOURCE_REQUIRED |
| sales_price | DECIMAL(15,2) | NO | 0 | CHECK >= 0 | SOURCE_REQUIRED |
| cost | DECIMAL(15,2) | NO | 0 | CHECK >= 0 | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: analyticals

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| name | VARCHAR(255) | NO | — | — | SOURCE_REQUIRED |
| responsible_id | UUID | NO | — | FK → contacts | SOURCE_REQUIRED |
| start_date | DATE | NO | — | — | SOURCE_REQUIRED |
| to_date | DATE | NO | — | CHECK >= start_date | SOURCE_REQUIRED |
| end_date | DATE | NO | — | CHECK >= to_date | SOURCE_REQUIRED |
| analytic_account | VARCHAR(255) | NO | — | — | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: budgets

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| name | VARCHAR(255) | NO | — | — | SOURCE_REQUIRED |
| responsible_id | UUID | NO | — | FK → contacts | SOURCE_REQUIRED |
| start_date | DATE | NO | — | — | SOURCE_REQUIRED |
| end_date | DATE | NO | — | CHECK >= start_date | SOURCE_REQUIRED |
| type | ENUM('income','expense') | NO | — | — | SOURCE_REQUIRED |
| analytical_id | UUID | NO | — | FK → analyticals | SOURCE_REQUIRED |
| status | ENUM('draft','confirmed','revised','cancelled') | NO | 'draft' | — | SOURCE_REQUIRED |
| committed_amount | DECIMAL(15,2) | YES | NULL | Only set on confirm | SOURCE_REQUIRED |
| original_budget_id | UUID | YES | NULL | FK → budgets (self-ref) | SOURCE_REQUIRED |
| is_archived | BOOLEAN | NO | false | — | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: chart_of_accounts

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| name | VARCHAR(255) | NO | — | — | SOURCE_REQUIRED |
| account_type | ENUM('asset','liability','bank','capital','cash','income','expense') | NO | — | — | SOURCE_REQUIRED |
| journal_type | VARCHAR(50) | YES | — | — | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: journals

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| name | VARCHAR(100) | NO | — | UNIQUE | SOURCE_REQUIRED |
| journal_type | ENUM('sale','purchase','bank','cash') | NO | — | — | SOURCE_REQUIRED |
| default_account_id | UUID | NO | — | FK → chart_of_accounts | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: journal_entries

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| entry_number | VARCHAR(50) | NO | — | UNIQUE, auto-generated | SOURCE_REQUIRED |
| accounting_date | DATE | NO | — | — | SOURCE_REQUIRED |
| journal_id | UUID | NO | — | FK → journals | SOURCE_REQUIRED |
| source_document_type | VARCHAR(50) | YES | — | ('invoice','bill','manual') | ENGINEERING_DECISION |
| source_document_id | UUID | YES | — | polymorphic ref | ENGINEERING_DECISION |
| status | ENUM('draft','posted') | NO | 'draft' | — | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: journal_entry_lines

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| journal_entry_id | UUID | NO | — | FK → journal_entries, ON DELETE CASCADE | ENGINEERING_DECISION |
| account_id | UUID | NO | — | FK → chart_of_accounts | SOURCE_REQUIRED |
| partner_id | UUID | YES | — | FK → contacts | SOURCE_REQUIRED |
| debit | DECIMAL(15,2) | NO | 0 | CHECK >= 0 | SOURCE_REQUIRED |
| credit | DECIMAL(15,2) | NO | 0 | CHECK >= 0 | SOURCE_REQUIRED |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

**CONSTRAINT:** `CHECK (debit > 0 OR credit > 0)` — at least one must be positive
**CONSTRAINT:** SUM(debit) = SUM(credit) per journal entry (enforced at application + DB level)

### Entity: sales_orders

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| so_number | VARCHAR(50) | NO | — | UNIQUE, auto-generated S00001+1 | SOURCE_REQUIRED |
| customer_id | UUID | NO | — | FK → contacts | SOURCE_REQUIRED |
| date | DATE | NO | CURRENT_DATE | — | SOURCE_REQUIRED |
| invoice_date | DATE | NO | — | — | SOURCE_REQUIRED |
| due_date | DATE | NO | — | — | SOURCE_REQUIRED |
| status | ENUM('draft','confirmed') | NO | 'draft' | — | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | computed | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: sales_order_lines

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| sales_order_id | UUID | NO | — | FK → sales_orders, ON DELETE CASCADE | ENGINEERING_DECISION |
| sr_no | INTEGER | NO | — | — | SOURCE_REQUIRED |
| product_id | UUID | NO | — | FK → products | SOURCE_REQUIRED |
| chart_of_account_id | UUID | NO | — | FK → chart_of_accounts (default: Sales) | SOURCE_REQUIRED |
| budget_analytic_id | UUID | YES | — | FK → analyticals | SOURCE_REQUIRED |
| qty | DECIMAL(10,3) | NO | 1 | CHECK > 0 | SOURCE_REQUIRED |
| unit_price | DECIMAL(15,2) | NO | 0 | CHECK >= 0 | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | qty * unit_price | SOURCE_REQUIRED |

### Entity: customer_invoices

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| invoice_reference | VARCHAR(50) | NO | — | UNIQUE, auto-generated INV/YYYY/NNNN | SOURCE_REQUIRED |
| invoice_number | VARCHAR(50) | NO | — | UNIQUE, auto-generated | SOURCE_REQUIRED |
| sales_order_id | UUID | YES | — | FK → sales_orders (nullable if fresh) | SOURCE_REQUIRED |
| customer_id | UUID | NO | — | FK → contacts | SOURCE_REQUIRED |
| date | DATE | NO | CURRENT_DATE | — | SOURCE_REQUIRED |
| invoice_date | DATE | NO | — | — | SOURCE_REQUIRED |
| due_date | DATE | NO | — | — | SOURCE_REQUIRED |
| payment_type | ENUM('receive','send') | NO | 'receive' | — | SOURCE_REQUIRED |
| partner_id | UUID | NO | — | FK → contacts (autofill from customer) | SOURCE_REQUIRED |
| payment_via | ENUM('bank','cash') | NO | 'bank' | — | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | computed from lines | ENGINEERING_DECISION |
| amount_due | DECIMAL(15,2) | NO | 0 | computed | ENGINEERING_DECISION |
| status | ENUM('draft','confirmed','paid') | NO | 'draft' | — | SOURCE_REQUIRED |
| journal_entry_id | UUID | YES | — | FK → journal_entries | ENGINEERING_DECISION |
| created_by | UUID | NO | — | FK → users | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: customer_invoice_lines

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| invoice_id | UUID | NO | — | FK → customer_invoices, ON DELETE CASCADE | ENGINEERING_DECISION |
| sr_no | INTEGER | NO | — | — | SOURCE_REQUIRED |
| product_id | UUID | NO | — | FK → products | SOURCE_REQUIRED |
| chart_of_account_id | UUID | NO | — | FK → chart_of_accounts (default: Sales) | SOURCE_REQUIRED |
| budget_analytic_id | UUID | YES | — | FK → analyticals | SOURCE_REQUIRED |
| qty | DECIMAL(10,3) | NO | 1 | CHECK > 0 | SOURCE_REQUIRED |
| unit_price | DECIMAL(15,2) | NO | 0 | CHECK >= 0 | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | qty * unit_price | SOURCE_REQUIRED |

### Entity: purchase_orders

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| po_number | VARCHAR(50) | NO | — | UNIQUE, auto-generated P00001+1 | SOURCE_REQUIRED |
| vendor_id | UUID | NO | — | FK → contacts | SOURCE_REQUIRED |
| date | DATE | NO | CURRENT_DATE | — | SOURCE_REQUIRED |
| bill_date | DATE | NO | — | — | SOURCE_REQUIRED |
| due_date | DATE | NO | — | — | SOURCE_REQUIRED |
| status | ENUM('draft','confirmed') | NO | 'draft' | — | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | computed | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: purchase_order_lines

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| purchase_order_id | UUID | NO | — | FK → purchase_orders, ON DELETE CASCADE | ENGINEERING_DECISION |
| sr_no | INTEGER | NO | — | — | SOURCE_REQUIRED |
| product_id | UUID | NO | — | FK → products | SOURCE_REQUIRED |
| chart_of_account_id | UUID | NO | — | FK → chart_of_accounts (default: Purchase) | SOURCE_REQUIRED |
| budget_analytic_id | UUID | YES | — | FK → analyticals | SOURCE_REQUIRED |
| qty | DECIMAL(10,3) | NO | 1 | CHECK > 0 | SOURCE_REQUIRED |
| unit_price | DECIMAL(15,2) | NO | 0 | CHECK >= 0 | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | qty * unit_price | SOURCE_REQUIRED |

### Entity: vendor_bills

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| bill_reference | VARCHAR(50) | NO | — | UNIQUE, auto-generated Bill/YYYY/NNNN | SOURCE_REQUIRED |
| vendor_bill_no | VARCHAR(50) | YES | — | e.g. ABC-26-001 | SOURCE_REQUIRED |
| purchase_order_id | UUID | YES | — | FK → purchase_orders (nullable if fresh) | SOURCE_REQUIRED |
| vendor_id | UUID | NO | — | FK → contacts | SOURCE_REQUIRED |
| date | DATE | NO | CURRENT_DATE | — | SOURCE_REQUIRED |
| bill_date | DATE | NO | — | — | SOURCE_REQUIRED |
| due_date | DATE | NO | — | — | SOURCE_REQUIRED |
| payment_type | ENUM('receive','send') | NO | 'send' | — | SOURCE_REQUIRED |
| partner_id | UUID | NO | — | FK → contacts (autofill from vendor) | SOURCE_REQUIRED |
| payment_via | ENUM('bank','cash') | NO | 'bank' | — | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | computed from lines | ENGINEERING_DECISION |
| amount_due | DECIMAL(15,2) | NO | 0 | computed | ENGINEERING_DECISION |
| status | ENUM('draft','confirmed','paid') | NO | 'draft' | — | SOURCE_REQUIRED |
| journal_entry_id | UUID | YES | — | FK → journal_entries | ENGINEERING_DECISION |
| created_by | UUID | NO | — | FK → users | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |
| updated_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

### Entity: vendor_bill_lines

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| vendor_bill_id | UUID | NO | — | FK → vendor_bills, ON DELETE CASCADE | ENGINEERING_DECISION |
| sr_no | INTEGER | NO | — | — | SOURCE_REQUIRED |
| product_id | UUID | NO | — | FK → products | SOURCE_REQUIRED |
| chart_of_account_id | UUID | NO | — | FK → chart_of_accounts (default: Purchase) | SOURCE_REQUIRED |
| budget_analytic_id | UUID | YES | — | FK → analyticals | SOURCE_REQUIRED |
| qty | DECIMAL(10,3) | NO | 1 | CHECK > 0 | SOURCE_REQUIRED |
| unit_price | DECIMAL(15,2) | NO | 0 | CHECK >= 0 | SOURCE_REQUIRED |
| total | DECIMAL(15,2) | NO | 0 | qty * unit_price | SOURCE_REQUIRED |

### Entity: payments

| Column | Type | Nullable | Default | Constraints | Source |
|--------|------|----------|---------|-------------|--------|
| id | UUID | NO | gen_random_uuid() | PK | ENGINEERING_DECISION |
| payment_number | VARCHAR(50) | NO | — | UNIQUE, auto-generated | ENGINEERING_DECISION |
| invoice_id | UUID | YES | — | FK → customer_invoices | SOURCE_REQUIRED |
| vendor_bill_id | UUID | YES | — | FK → vendor_bills | SOURCE_REQUIRED |
| amount | DECIMAL(15,2) | NO | — | CHECK > 0 | SOURCE_REQUIRED |
| payment_via | ENUM('bank','cash') | NO | — | — | SOURCE_REQUIRED |
| payment_date | DATE | NO | CURRENT_DATE | — | SOURCE_REQUIRED |
| status | ENUM('draft','confirmed','successful') | NO | 'draft' | — | ENGINEERING_DECISION |
| journal_entry_id | UUID | YES | — | FK → journal_entries | ENGINEERING_DECISION |
| created_by | UUID | NO | — | FK → users | ENGINEERING_DECISION |
| created_at | TIMESTAMPTZ | NO | NOW() | — | ENGINEERING_DECISION |

---

## PHASE 6 — DATABASE INTEGRITY

### 6.1 Constraints Summary

| Constraint | Level | Rule | Classification |
|-----------|-------|------|----------------|
| users.login_id UNIQUE | Database | No duplicate login IDs | SOURCE_REQUIRED |
| users.email UNIQUE | Database | No duplicate emails | SOURCE_REQUIRED |
| contacts.email UNIQUE | Database | No duplicate contact emails | SOURCE_REQUIRED |
| users.login_id length | Application + DB | 6-12 characters | SOURCE_REQUIRED |
| users.password complexity | Application | Uppercase + lowercase + special char + >8 chars | SOURCE_REQUIRED |
| products.sales_price >= 0 | Database | Non-negative | ENGINEERING_DECISION |
| products.cost >= 0 | Database | Non-negative | ENGINEERING_DECISION |
| journal_entry_lines.debit >= 0 | Database | Non-negative | ENGINEERING_DECISION |
| journal_entry_lines.credit >= 0 | Database | Non-negative | ENGINEERING_DECISION |
| journal_entry_lines (debit > 0 OR credit > 0) | Database | At least one positive | ENGINEERING_DECISION |
| SUM(debit) = SUM(credit) per JE | Application + DB | Balanced journal | SOURCE_REQUIRED |
| invoices.amount_due >= 0 | Database | Non-negative | ENGINEERING_DECISION |
| bills.amount_due >= 0 | Database | Non-negative | ENGINEERING_DECISION |
| budgets.status valid transitions | Application | State machine enforcement | SOURCE_REQUIRED |
| invoice.status valid transitions | Application | State machine enforcement | SOURCE_REQUIRED |
| bill.status valid transitions | Application | State machine enforcement | SOURCE_REQUIRED |
| SO date, invoice_date, due_date ordering | Application | Business logic | SOURCE_REQUIRED |
| PO date, bill_date, due_date ordering | Application | Business logic | SOURCE_REQUIRED |
| budget start_date < end_date | Database | CHECK constraint | SOURCE_REQUIRED |
| overpayment prevention | Application | amount_paid + payment_amount <= total | ENGINEERING_DECISION |
| duplicate confirmation prevention | Application | Idempotency check | ENGINEERING_DECISION |
| concurrent confirmation prevention | Application | Optimistic locking | ENGINEERING_DECISION |

### 6.2 Validation Layer Distribution

| Validation | Frontend | Backend | Database |
|-----------|----------|---------|----------|
| Login ID length (6-12) | ✅ Client-side | ✅ Server-side | ✅ CHECK constraint |
| Email format | ✅ | ✅ | — |
| Email uniqueness | — | ✅ | ✅ UNIQUE INDEX |
| Password complexity | ✅ | ✅ | — (hashed) |
| Non-negative amounts | ✅ | ✅ | ✅ CHECK >= 0 |
| Balanced journal | ✅ Warning | ✅ Block | ✅ Transaction |
| Status transitions | — | ✅ Block | — |
| Required fields | ✅ | ✅ | ✅ NOT NULL |
| Overpayment prevention | ✅ | ✅ | — |
| Duplicate confirmation | — | ✅ Block | — |

---

## PHASE 7 — ACCOUNTING ENGINE

### 7.1 Accounting Transactions

#### Customer Invoice Confirmation
```
TRIGGER:    PUT /api/v1/invoices/:id/confirm
JOURNAL:    Sales
ENTRIES:
  DEBIT:    Debtor account (partner = customer) — Amount = invoice total
  CREDIT:   Sales Income account — Amount = invoice total
PARTNER:    Customer
DATE:       Invoice date
REFERENCE:  Invoice number
SOURCE:     Customer invoice
```

#### Vendor Bill Confirmation
```
TRIGGER:    PUT /api/v1/bills/:id/confirm
JOURNAL:    Purchase
ENTRIES:
  DEBIT:    Purchase Expense account — Amount = bill total
  CREDIT:   Creditor account (partner = vendor) — Amount = bill total
PARTNER:    Vendor
DATE:       Bill date
REFERENCE:  Bill number
SOURCE:     Vendor bill
```

#### Invoice Payment (Receive)
```
TRIGGER:    POST /api/v1/invoices/:id/pay
JOURNAL:    Bank or Cash (as selected)
ENTRIES:
  DEBIT:    Bank/Cash account — Amount = payment amount
  CREDIT:   Debtor account — Amount = payment amount
PARTNER:    Customer
DATE:       Payment date
REFERENCE:  Payment number
```

#### Bill Payment (Send)
```
TRIGGER:    POST /api/v1/bills/:id/pay
JOURNAL:    Bank or Cash (as selected)
ENTRIES:
  DEBIT:    Creditor account — Amount = payment amount
  CREDIT:   Bank/Cash account — Amount = payment amount
PARTNER:    Vendor
DATE:       Payment date
REFERENCE:  Payment number
```

### 7.2 Atomicity Requirement

Every document confirmation that creates accounting entries MUST be atomic:
- Either ALL required records are committed (document status update + journal entry + journal entry lines)
- Or NONE are committed
- Use database transactions with proper isolation level (READ COMMITTED minimum, SERIALIZABLE recommended for financial operations)

### 7.3 Balance Requirement

Journal entries MUST be balanced at all times:
- SUM(debit) of all lines = SUM(credit) of all lines
- If unbalanced → REJECT the entire journal entry creation
- This applies to both auto-generated and manual journal entries

---

## PHASE 8 — STATE MACHINES

### 8.1 Budget State Machine

```
DRAFT ──→ CONFIRMED ──→ REVISED
  │            │
  │            ↓
  └─────→ CANCELLED ←──── CONFIRMED
```

| Current State | Allowed Transitions | Forbidden |
|--------------|--------------------|-----------| 
| draft | confirmed, cancelled | revised |
| confirmed | revised, cancelled | draft, confirmed |
| revised | cancelled | draft, confirmed |
| cancelled | (terminal) | all |

**Actions available per state:**
- Draft: New (edit), Confirm, Cancel
- Confirmed: Revise, Cancel (buttons visible)
- Revised: Cancel (budget is now archived/old)
- Cancelled: (no actions, archived)

### 8.2 Customer Invoice State Machine

```
DRAFT ──→ CONFIRMED ──→ PAID
```

| Current State | Allowed Transitions | Forbidden |
|--------------|--------------------|-----------| 
| draft | confirmed, cancelled | paid |
| confirmed | paid | draft |
| paid | (terminal) | all |

### 8.3 Vendor Bill State Machine

```
DRAFT ──→ CONFIRMED ──→ PAID
```

| Current State | Allowed Transitions | Forbidden |
|--------------|--------------------|-----------| 
| draft | confirmed, cancelled | paid |
| confirmed | paid | draft |
| paid | (terminal) | all |

### 8.4 Sales Order State Machine

```
DRAFT ──→ CONFIRMED
```

| Current State | Allowed Transitions |
|--------------|--------------------|
| draft | confirmed |
| confirmed | (terminal — triggers invoice creation) |

### 8.5 Purchase Order State Machine

```
DRAFT ──→ CONFIRMED
```

| Current State | Allowed Transitions |
|--------------|--------------------|
| draft | confirmed |
| confirmed | (terminal — triggers bill creation) |

### 8.6 Payment State Machine

```
DRAFT ──→ CONFIRMED ──→ SUCCESSFUL
```

| Current State | Allowed Transitions |
|--------------|--------------------|
| draft | confirmed |
| confirmed | successful |
| successful | (terminal) |

---

## PHASE 9 — API CONTRACTS

### 9.1 Authentication Endpoints

#### POST /api/v1/auth/signup
```
Request:
{
  "login_id": "string (6-12 chars, unique)",
  "email": "string (unique)",
  "password": "string (complexity rules)",
  "confirm_password": "string (must match)"
}

Response 201:
{
  "id": "uuid",
  "name": null,
  "login_id": "string",
  "email": "string",
  "role": "user"
}

Errors:
400: { "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "login_id" } }
409: { "error": { "code": "DUPLICATE_LOGIN_ID", "message": "Login ID already exists" } }
409: { "error": { "code": "DUPLICATE_EMAIL", "message": "Email already exists" } }
400: { "error": { "code": "WEAK_PASSWORD", "message": "Password does not meet requirements" } }
```

#### POST /api/v1/auth/login
```
Request:
{
  "login_id": "string",
  "password": "string"
}

Response 200:
{
  "token": "jwt_token_string",
  "user": {
    "id": "uuid",
    "name": "string",
    "login_id": "string",
    "email": "string",
    "role": "admin|accountant|user"
  }
}

Errors:
401: { "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid Login Id or Password" } }
```

#### POST /api/v1/auth/logout
```
Headers: Authorization: Bearer <token>
Response 200: { "message": "Logged out successfully" }
```

#### POST /api/v1/auth/forgot-password
```
Request:
{
  "email": "string"
}

Response 200: { "message": "If the email exists, a reset link has been sent" }
```

### 9.2 User Management Endpoints (Admin only)

#### POST /api/v1/users
```
Headers: Authorization: Bearer <admin_token>
Request:
{
  "name": "string",
  "login_id": "string (6-12 chars)",
  "email": "string",
  "role": "admin|accountant|user",
  "password": "string",
  "confirm_password": "string"
}

Response 201: { "id": "uuid", "name": "string", "login_id": "string", "email": "string", "role": "string" }
```

#### GET /api/v1/users
```
Headers: Authorization: Bearer <admin_token>
Query: ?page=1&limit=20&search=string
Response 200: { "users": [...], "total": 100, "page": 1, "limit": 20 }
```

### 9.3 Contact Endpoints

#### GET /api/v1/contacts
```
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20&search=string&sort=name&order=asc
Response 200: { "contacts": [...], "total": 100, "page": 1, "limit": 20 }
Each contact: { "id", "name", "email", "phone", "image_url", "street", "city", "state", "country", "pincode", "created_at" }
```

#### POST /api/v1/contacts
```
Headers: Authorization: Bearer <token> (admin|accountant)
Request:
{
  "name": "string (required)",
  "email": "string (required, unique)",
  "phone": "string (optional)",
  "image_url": "string (optional)",
  "street": "string (optional)",
  "city": "string (optional)",
  "state": "string (optional)",
  "country": "string (optional)",
  "pincode": "string (optional)"
}

Response 201: { "id": "uuid", "name": "...", ... }
Errors: 409 DUPLICATE_EMAIL
```

#### GET /api/v1/contacts/:id
```
Response 200: { "id": "uuid", "name": "...", ... full contact object }
```

#### PUT /api/v1/contacts/:id
```
Request: Same as POST (partial update)
Response 200: Updated contact object
```

### 9.4 Product Endpoints

#### GET /api/v1/products
```
Query: ?page=1&limit=20&search=string&category_id=uuid
Response 200: { "products": [...], "total": 100 }
Each product: { "id", "name", "image_url", "product_type", "category": { "id", "name" }, "sales_price", "cost" }
```

#### POST /api/v1/products
```
Request:
{
  "name": "string (required)",
  "product_type": "goods|service|combo (required)",
  "category_id": "uuid (required)",
  "category_name": "string (if creating new category on the fly)",
  "sales_price": 100.00,
  "cost": 50.00,
  "image_url": "string (optional)"
}
```

### 9.5 Analyticals Endpoints

#### GET /api/v1/analyticals
```
Response: { "analyticals": [...] }
Each: { "id", "name", "responsible": { "id", "name" }, "start_date", "to_date", "end_date", "analytic_account" }
```

#### POST /api/v1/analyticals
```
Request:
{
  "name": "string",
  "responsible_id": "uuid",
  "start_date": "YYYY-MM-DD",
  "to_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "analytic_account": "string"
}
```

### 9.6 Chart of Accounts Endpoints

#### GET /api/v1/chart-of-accounts
```
Response: { "accounts": [...] }
Each: { "id", "name", "account_type", "journal_type" }
```

#### POST /api/v1/chart-of-accounts
```
Request:
{
  "name": "string",
  "account_type": "asset|liability|bank|capital|cash|income|expense"
}
```

### 9.7 Journal Endpoints

#### GET /api/v1/journals
```
Response: { "journals": [...] }
Each: { "id", "name", "journal_type", "default_account": { "id", "name" } }
```

### 9.8 Journal Entry Endpoints

#### GET /api/v1/journal-entries
```
Query: ?page=1&limit=20&journal_id=uuid&status=draft|posted&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
Response: { "entries": [...], "total": 100 }
Each: { "id", "entry_number", "accounting_date", "journal": {...}, "status", "total_debit", "total_credit" }
```

#### GET /api/v1/journal-entries/:id
```
Response: {
  "id", "entry_number", "accounting_date", "journal": {...}, "status",
  "lines": [
    { "id", "account": { "id", "name" }, "partner": { "id", "name" }, "debit": 10000, "credit": 0 },
    { "id", "account": { "id", "name" }, "partner": { "id", "name" }, "debit": 0, "credit": 10000 }
  ]
}
```

#### POST /api/v1/journal-entries
```
Request:
{
  "accounting_date": "YYYY-MM-DD",
  "journal_id": "uuid",
  "lines": [
    { "account_id": "uuid", "partner_id": "uuid (optional)", "debit": 10000, "credit": 0 },
    { "account_id": "uuid", "partner_id": "uuid (optional)", "debit": 0, "credit": 10000 }
  ]
}

Validation: SUM(debit) MUST equal SUM(credit)
Response 201: Created journal entry with lines
Error 400: UNBALANCED_JOURNAL if debits != credits
```

### 9.9 Budget Endpoints

#### GET /api/v1/budgets
```
Query: ?page=1&limit=20&status=draft|confirmed|revised|cancelled&type=income|expense
Response: { "budgets": [...], "total": 100 }
Each: { "id", "name", "responsible": {...}, "start_date", "end_date", "type", "status", "committed_amount", "achieved_amount", "achieved_percentage", "amount_to_achieve" }
```

#### GET /api/v1/budgets/:id
```
Response: Full budget object with lines, status, links to original/revised budgets
```

#### POST /api/v1/budgets
```
Request:
{
  "name": "string",
  "responsible_id": "uuid",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "type": "income|expense",
  "analytical_id": "uuid"
}
Response 201: { "id": "...", "status": "draft" }
```

#### PUT /api/v1/budgets/:id/confirm
```
Validation: status must be 'draft'
Side effect: committed_amount = sum of line amounts (or as specified)
Response 200: { "id": "...", "status": "confirmed", "committed_amount": 200000 }
```

#### POST /api/v1/budgets/:id/revise
```
Validation: status must be 'confirmed'
Business logic:
  1. Create new budget (copy), name += " Revised"
  2. Link original → revised (original_budget_id)
  3. Original status → 'revised'
  4. New budget status → 'draft'
Response 201: New budget object
```

#### PUT /api/v1/budgets/:id/cancel
```
Validation: status must not be 'cancelled'
Side effect: is_archived = true
Response 200: { "id": "...", "status": "cancelled" }
```

### 9.10 Sales Order Endpoints

#### GET /api/v1/sales-orders
```
Query: ?page=1&limit=20&status=draft|confirmed&search=string
Response: { "sales_orders": [...], "total": 100 }
```

#### POST /api/v1/sales-orders
```
Request:
{
  "customer_id": "uuid",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "lines": [
    {
      "product_id": "uuid",
      "chart_of_account_id": "uuid (default: Sales account)",
      "budget_analytic_id": "uuid (optional)",
      "qty": 3,
      "unit_price": 2000.00
    }
  ]
}
Response 201: { "id": "uuid", "so_number": "S00001", "status": "draft" }
```

### 9.11 Customer Invoice Endpoints

#### GET /api/v1/invoices
```
Query: ?page=1&limit=20&status=draft|confirmed|paid&customer_id=uuid
Response: { "invoices": [...], "total": 100 }
Each: { "id", "invoice_reference", "invoice_number", "customer": {...}, "date", "invoice_date", "due_date", "total", "amount_due", "status" }
```

#### GET /api/v1/invoices/:id
```
Response: Full invoice with lines, journal entry reference
```

#### POST /api/v1/invoices
```
Request:
{
  "customer_id": "uuid",
  "sales_order_id": "uuid (optional)",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "lines": [
    {
      "product_id": "uuid",
      "chart_of_account_id": "uuid (default: Sales)",
      "budget_analytic_id": "uuid (optional)",
      "qty": 3,
      "unit_price": 2000.00
    }
  ]
}
Response 201: { "id": "uuid", "invoice_reference": "INV/2026/0001", "status": "draft" }
```

#### POST /api/v1/invoices/:id/confirm
```
Validation: status must be 'draft', lines not empty
Atomic operation:
  1. Update invoice status → 'confirmed'
  2. Create journal entry (Sales journal):
     DEBIT: Debtor account (partner = customer) = total
     CREDIT: Sales Income account = total
  3. Verify balance
Response 200: { "id": "...", "status": "confirmed", "journal_entry_id": "..." }
```

#### POST /api/v1/invoices/:id/pay
```
Request:
{
  "amount": 6000.00,
  "payment_via": "bank|cash"
}
Validation: amount > 0, amount <= amount_due
Atomic operation:
  1. Create payment record
  2. Update invoice: amount_due -= amount; if amount_due == 0 → status = 'paid'
  3. Create journal entry:
     DEBIT: Bank/Cash = amount
     CREDIT: Debtor account = amount
Response 200: { "payment_id": "...", "amount_due": 0 }
```

#### POST /api/v1/invoices/:id/print
```
Response 200: PDF binary stream (Content-Type: application/pdf)
```

#### POST /api/v1/invoices/:id/send
```
Request: { "email_to": "string", "subject": "string", "body": "string" }
Response 200: { "message": "Invoice sent successfully" }
```

### 9.12 Purchase Order Endpoints

#### POST /api/v1/purchase-orders
```
Request:
{
  "vendor_id": "uuid",
  "bill_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "lines": [
    {
      "product_id": "uuid",
      "chart_of_account_id": "uuid (default: Purchase)",
      "budget_analytic_id": "uuid (optional)",
      "qty": 3,
      "unit_price": 2000.00
    }
  ]
}
Response 201: { "id": "uuid", "po_number": "P00001", "status": "draft" }
```

### 9.13 Vendor Bill Endpoints

#### POST /api/v1/bills
```
Request:
{
  "vendor_id": "uuid",
  "purchase_order_id": "uuid (optional)",
  "vendor_bill_no": "string (optional)",
  "bill_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "lines": [...]
}
Response 201: { "id": "uuid", "bill_reference": "Bill/2026/0001", "status": "draft" }
```

#### POST /api/v1/bills/:id/confirm
```
Atomic operation (same pattern as invoice):
  1. Update bill status → 'confirmed'
  2. Create journal entry (Purchase journal):
     DEBIT: Purchase Expense account = total
     CREDIT: Creditor account (partner = vendor) = total
Response 200: { "id": "...", "status": "confirmed" }
```

#### POST /api/v1/bills/:id/pay
```
Same pattern as invoice payment but with reversed entries
```

### 9.14 Report Endpoints

#### GET /api/v1/reports/profit-and-loss
```
Query: ?year=2026
Response 200:
{
  "year": 2026,
  "income": {
    "items": [
      { "account_name": "Income from Sales", "amount": 10000 }
    ],
    "total": 10000
  },
  "expenses": {
    "items": [
      { "account_name": "Purchase Expense", "amount": 6000 },
      { "account_name": "Other Expense", "amount": 1000 }
    ],
    "total": 7000
  },
  "net_income": 3000
}
```

#### GET /api/v1/reports/balance-sheet
```
Query: ?year=2026
Response 200:
{
  "year": 2026,
  "assets": {
    "items": [
      { "account_name": "Bank", "amount": 10000 },
      { "account_name": "Debtors", "amount": 7000 }
    ],
    "total": 17000
  },
  "liabilities": {
    "items": [
      { "account_name": "Creditors", "amount": 10000 },
      { "account_name": "Capital", "amount": 10000 },
      { "account_name": "Income from Sales", "amount": 10000 }
    ],
    "total": 30000
  },
  "balance_check": true
}
```

#### GET /api/v1/reports/budget-report
```
Query: ?year=2026&type=income|expense
Response 200:
{
  "budgets": [
    {
      "id": "...",
      "name": "January 2026",
      "start_date": "2026-01-01",
      "end_date": "2026-01-31",
      "committed_amount": 200000,
      "achieved_amount": 10000,
      "achieved_percentage": 5.00,
      "amount_to_achieve": 190000,
      "status": "confirmed"
    }
  ]
}
```

---

## PHASE 10 — ERROR CONTRACT

### 10.1 Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "field_name (if field-level error)",
    "details": {}
  }
}
```

### 10.2 Error Catalog

| Code | HTTP Status | Category | Message |
|------|------------|----------|---------|
| INVALID_CREDENTIALS | 401 | Auth | Invalid Login Id or Password |
| UNAUTHORIZED | 401 | Auth | Authentication required |
| FORBIDDEN | 403 | Auth | Insufficient permissions |
| DUPLICATE_LOGIN_ID | 409 | Validation | Login ID already exists |
| DUPLICATE_EMAIL | 409 | Validation | Email already exists |
| VALIDATION_ERROR | 400 | Validation | Field-level validation message |
| WEAK_PASSWORD | 400 | Validation | Password must contain uppercase, lowercase, special character and be >8 characters |
| PASSWORD_MISMATCH | 400 | Validation | Passwords do not match |
| INVALID_LOGIN_LENGTH | 400 | Validation | Login ID must be between 6-12 characters |
| NOT_FOUND | 404 | Resource | Record not found |
| DUPLICATE_RECORD | 409 | Resource | Record already exists |
| INVALID_STATE_TRANSITION | 400 | Business | Cannot transition from {current} to {target} |
| ALREADY_CONFIRMED | 400 | Business | Document already confirmed |
| ALREADY_PAID | 400 | Business | Document already fully paid |
| OVERPAYMENT_NOT_ALLOWED | 400 | Business | Payment amount exceeds amount due |
| UNBALANCED_JOURNAL | 400 | Accounting | Debit and credit totals do not match |
| JOURNAL_ENTRY_REQUIRED | 400 | Accounting | Journal entry is required for this operation |
| INSUFFICIENT_DATA | 400 | Business | Required data missing for this operation |
| DUPLICATE_CONFIRMATION | 409 | Concurrency | This document has already been confirmed |
| CONCURRENT_MODIFICATION | 409 | Concurrency | Record was modified by another user. Please refresh and try again |
| RATE_LIMITED | 429 | Security | Too many requests. Please try again later |
| INTERNAL_ERROR | 500 | Server | An unexpected error occurred |
| DATABASE_ERROR | 500 | Server | Database operation failed |

---

## PHASE 11 — FRONTEND SPECIFICATION

### 11.1 Route Table

| Route | Access | Layout | Page |
|-------|--------|--------|------|
| /login | Public | AuthLayout | Login Page |
| /signup | Public | AuthLayout | Sign Up Page |
| /forgot-password | Public | AuthLayout | Forgot Password |
| /dashboard | Authenticated | AppLayout | Dashboard |
| /contacts | Admin, Accountant | AppLayout | Contact List |
| /contacts/new | Admin, Accountant | AppLayout | Contact Form (new) |
| /contacts/:id | Admin, Accountant | AppLayout | Contact Form (edit) |
| /products | Admin, Accountant | AppLayout | Product List |
| /products/new | Admin, Accountant | AppLayout | Product Form (new) |
| /products/:id | Admin, Accountant | AppLayout | Product Form (edit) |
| /analyticals/new | Admin, Accountant | AppLayout | Analytical Form |
| /analyticals/:id | Admin, Accountant | AppLayout | Analytical Form |
| /chart-of-accounts | Admin, Accountant | AppLayout | Chart of Accounts List |
| /chart-of-accounts/new | Admin, Accountant | AppLayout | COA Form |
| /journals | Admin, Accountant | AppLayout | Journals List |
| /journal-entries | Admin, Accountant | AppLayout | JE List |
| /journal-entries/new | Admin, Accountant | AppLayout | JE Form |
| /sales-orders | Admin, Accountant | AppLayout | SO List |
| /sales-orders/new | Admin, Accountant | AppLayout | SO Form |
| /invoices | Admin, Accountant | AppLayout | Invoice List |
| /invoices/new | Admin, Accountant | AppLayout | Invoice Form |
| /invoices/:id | Admin, Accountant, User (own) | AppLayout | Invoice Detail |
| /invoices/:id/pay | Admin, Accountant, User (own) | AppLayout | Invoice Payment |
| /purchase-orders | Admin, Accountant | AppLayout | PO List |
| /purchase-orders/new | Admin, Accountant | AppLayout | PO Form |
| /bills | Admin, Accountant | AppLayout | Bill List |
| /bills/new | Admin, Accountant | AppLayout | Bill Form |
| /bills/:id | Admin, Accountant, User (own) | AppLayout | Bill Detail |
| /bills/:id/pay | Admin, Accountant, User (own) | AppLayout | Bill Payment |
| /reports/profit-and-loss | Admin, Accountant | AppLayout | P&L Report |
| /reports/balance-sheet | Admin, Accountant | AppLayout | Balance Sheet |
| /reports/budget-report | Admin, Accountant | AppLayout | Budget Report |

### 11.2 Component Specifications

#### Login Page Components
- **AppLogo**: Placeholder for company logo
- **LoginForm**: Fields (Login Id, Password), SIGN IN button
- **Links**: Forgot Password | Sign Up

#### Dashboard Components
- **TabBar**: Account | Sales | Purchase | Report
- **SubMenu**: Shows sub-items based on active tab
- **KanbanCards**: Shows counts per status (Draft, Confirmed, All) for Sales, Purchase, Budget
- **NewButton**: Opens context-relevant blank form

#### List View Components (Contact, Product, etc.)
- **SearchBar**: Text input with search icon
- **ViewToggle**: List view | Kanban view toggle
- **DataTable**: Columns per entity type, rows with clickable links to form
- **NewButton**: "New" button → opens blank form
- **BackButton**: "Back" button → returns to dashboard
- **Pagination**: Page navigation

#### Kanban View Components (Contact, Product)
- **KanbanBoard**: Cards showing entity summary (Image, Name, Email, Phone)
- **ViewToggle**: Switch to list view

#### Form View Components (Contact, Product, etc.)
- **FormHeader**: "New" label or entity name
- **FormFields**: Input fields with labels, underlines
- **ImageUpload**: For contact/product images
- **ActionButtons**: New | Confirm | Back | Search (context-dependent)

#### Invoice/Bill Form Components
- **DocumentHeader**: Reference numbers, dates, customer/vendor selection
- **LineItemsTable**: Editable table with product, account, analytics, qty, price, total
- **TotalsSection**: Total amount, amount due
- **ActionButtons**: Create Invoice/Bill | Confirm | Cancel | Back | Pay | Print | Send

#### Payment View Components
- **PaymentSummary**: Total, Amount Due
- **PaymentMethod**: Bank/Cash selection
- **PaymentAmount**: Input amount
- **ActionButtons**: Pay | Back | Reset to Draft

---

## PHASE 12 — UI/UX QUALITY ANALYSIS

### 12.1 Layout Patterns from Excalidraw

1. **Auth Pages**: Centered card layout, app logo at top, form fields with underline style (not bordered inputs)
2. **Dashboard**: Full-width with tab navigation at top, card-based kanban view below
3. **List Views**: Table with header row, data rows with checkboxes and image thumbnails
4. **Form Views**: Full-width form with labeled fields, action buttons in gray rounded rectangles at top
5. **Kanban Views**: Grid of cards with image, name, email, phone

### 12.2 Button Styling from Mockup
- **Action buttons**: Rounded rectangle, gray background (#e9ecef), dark text
- **"New" buttons on Dashboard**: Blue background (#a5d8ff)
- **"Report" buttons on Dashboard**: Blue background (#a5d8ff)
- **Confirm/Create buttons**: Same gray rounded style

### 12.3 Interactive Element States

| Element | Default | Hover | Active | Disabled | Loading | Error |
|---------|---------|-------|--------|----------|---------|-------|
| Button | Gray bg | Darker gray | Pressed | Muted gray | Spinner | Red border |
| Input | Underline | — | Focused underline | Grayed out | — | Red underline + message |
| Row click | — | Highlight | Selected | — | — | — |
| Kanban card | White bg | Shadow | — | — | Skeleton | — |

---

## PHASE 13 — SECURITY

### 13.1 Authentication
- Passwords stored with bcrypt (cost factor >= 12)
- JWT tokens with short expiry (15 min access, 7 day refresh)
- Token stored in httpOnly cookie (not localStorage) — ENGINEERING_DECISION

### 13.2 Authorization
- Every protected endpoint validates JWT and checks role server-side
- UI hiding buttons is NOT sufficient — backend must enforce
- Role-based middleware on every route

### 13.3 Input Validation
- All inputs sanitized server-side (SQL injection, XSS prevention)
- Parameterized queries only — no string concatenation
- Output encoding on all rendered data

### 13.4 Rate Limiting
- Login: 5 attempts per minute per IP
- API endpoints: 100 requests per minute per user
- Sign up: 3 attempts per IP per hour

### 13.5 Security Headers
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security
- X-XSS-Protection

### 13.6 CORS
- Allow only frontend origin
- Credentials: true for cookie-based auth

### 13.7 Secrets Management
- Database credentials, JWT secrets in environment variables
- No secrets in code or version control

---

## PHASE 14 — AUDITABILITY

### 14.1 Audit Log (ENGINEERING_RECOMMENDATION)

| Column | Type | Source |
|--------|------|--------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| action | VARCHAR(50) | create/update/delete/confirm/cancel/pay |
| entity_type | VARCHAR(50) | invoice/bill/budget/journal_entry |
| entity_id | UUID | Record ID |
| old_values | JSONB | Previous state |
| new_values | JSONB | New state |
| ip_address | INET | Request IP |
| created_at | TIMESTAMPTZ | When |

**Classified as ENGINEERING_RECOMMENDATION — not explicitly required by source.**

---

## PHASE 15 — PERFORMANCE

### 15.1 Indexing Strategy

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | idx_users_login_id | login_id | Unique login lookup |
| users | idx_users_email | email | Unique email lookup |
| contacts | idx_contacts_email | email | Unique email lookup |
| customer_invoices | idx_invoices_status | status | Filter by status |
| customer_invoices | idx_invoices_customer | customer_id | Filter by customer |
| vendor_bills | idx_bills_status | status | Filter by status |
| vendor_bills | idx_bills_vendor | vendor_id | Filter by vendor |
| journal_entries | idx_je_date | accounting_date | Date range queries |
| journal_entries | idx_je_journal | journal_id | Filter by journal |
| budgets | idx_budgets_status | status | Filter by status |
| budgets | idx_budgets_analytical | analytical_id | Budget achieved calculation |
| payments | idx_payments_invoice | invoice_id | Payment lookup |
| payments | idx_payments_bill | vendor_bill_id | Payment lookup |

### 15.2 Pagination
- All list endpoints support server-side pagination
- Default page size: 20
- Maximum page size: 100
- Response includes total count for frontend pagination

### 15.3 Report Generation
- Reports are computed on-demand from journal entry lines
- No caching initially — ENGINEERING_DECISION for hackathon scope
- For production: cache reports with invalidation on journal entry changes

---

## PHASE 16 — CONCURRENCY & TRANSACTIONS

### 16.1 Race Condition Prevention

| Scenario | Prevention Strategy | Classification |
|---------|-------------------|----------------|
| Two users confirm same invoice | Optimistic locking with status check + unique constraint | ENGINEERING_DECISION |
| Two payments on same invoice | Database transaction with amount_due check | ENGINEERING_DECISION |
| Simultaneous budget revision | Serializable transaction isolation | ENGINEERING_DECISION |
| Duplicate sequence generation | Database sequence with unique constraint | ENGINEERING_DECISION |
| Browser refresh during confirmation | Idempotent confirm endpoint (check status first) | ENGINEERING_DECISION |
| Network timeout after success | Idempotent payment endpoint | ENGINEERING_DECISION |

### 16.2 Transaction Isolation
- Use `READ COMMITTED` for most operations
- Use `SERIALIZABLE` for financial transaction creation (invoice/bill confirmation + journal entry)
- All financial operations wrapped in explicit transactions

---

## PHASE 17 — SEQUENCES & NUMBER GENERATION

| Entity | Prefix | Format | Example | Generation Timing |
|--------|--------|--------|---------|-------------------|
| Sales Order | S | S00001, S00002, ... | S00001 | On SO creation |
| Invoice | INV | INV/YYYY/NNNN | INV/2026/0001 | On invoice creation |
| Purchase Order | P | P00001, P00002, ... | P00001 | On PO creation |
| Bill | Bill | Bill/YYYY/NNNN | Bill/2026/0001 | On bill creation |
| Journal Entry | JE | JE/YYYY/NNNN | JE/2026/0001 | On JE creation |
| Payment | PAY | PAY/YYYY/NNNN | PAY/2026/0001 | On payment creation |

**Generation Rules:**
- Use PostgreSQL sequences for concurrency safety
- Generated on the backend — NEVER on frontend
- Unique constraint on all reference/number fields
- Transaction-safe generation (within same transaction as record creation)

---

## PHASE 18 — REPORTING

### 18.1 Profit & Loss Report

**Inputs:** Year
**Filters:** Date range (start of year to end of year)
**Query Logic:**
- Income = SUM of all journal entry line credits WHERE account.type = 'income' AND entry.accounting_date WITHIN year
- Expenses = SUM of all journal entry line debits WHERE account.type IN ('expense') AND entry.accounting_date WITHIN year
- Net Income = Income - Expenses

**Display:**
```
Profit and Loss Report
Year: [2026] [Back] [Print]

Income:
  Income from Sales    Rs. 10,000
  Total of Income      Rs. 10,000

Expenses:
  Purchase Expense     Rs. 6,000
  Other Expense        Rs. 1,000
  Total of All Expenses Rs. 7,000

Net Income            Rs. 3,000
```

### 18.2 Balance Sheet

**Inputs:** Year
**Query Logic:**
- Assets:
  - Bank = SUM where account.type = 'bank'
  - Cash = SUM where account.type = 'cash'
  - Debtors = SUM where account.type = 'asset'
- Liabilities:
  - Creditors = SUM where account.type = 'liability'
  - Capital = SUM where account.type = 'capital'
  - Income from Sales = SUM where account.type = 'income'

**CRITICAL RULE:** Total Assets MUST equal Total Liabilities (ACCOUNTING EQUATION)

### 18.3 Budget Report

**Inputs:** Year, Type filter
**Query Logic:**
- For each budget in confirmed/revised status within period:
  - Achieved (Income) = SUM invoice lines WHERE analytics match AND date within budget period
  - Achieved (Expense) = SUM bill lines WHERE analytics match AND date within budget period
  - Achieved % = (Achieved / Committed) * 100
  - Amount To Achieve = Committed - Achieved

---

## PHASE 19 — TEST STRATEGY

### 19.1 Test Categories

| Category | Scope | Framework |
|---------|-------|-----------|
| Unit Tests | Individual functions, validations | Jest/Vitest |
| Backend Integration | API endpoint tests | Supertest + Jest |
| API Contract | Request/response shape validation | Jest + schema validation |
| Database | Constraint, migration tests | pgTAP or Jest |
| Business Logic | Workflow, state machine tests | Jest |
| Authorization | Role-based access tests | Jest + Supertest |
| Security | Injection, auth bypass | OWASP ZAP / manual |
| Frontend Component | Component rendering, interaction | React Testing Library |
| E2E | Full workflow tests | Playwright/Cypress |
| Responsive | Mobile/tablet viewports | Playwright |
| Accessibility | ARIA, keyboard nav | axe-core |

### 19.2 Critical Test Cases

#### Authentication
- Login with valid credentials → success
- Login with invalid credentials → "Invalid Login Id or Password"
- Sign up with duplicate login ID → error
- Sign up with weak password → validation error
- Access protected endpoint without token → 401
- Access admin endpoint as accountant → 403

#### Invoice Workflow
- Create invoice → status draft
- Confirm invoice → status confirmed, journal entry created
- Confirm already confirmed invoice → ALREADY_CONFIRMED error
- Pay invoice full amount → status paid, amount_due = 0
- Attempt overpayment → OVERPAYMENT_NOT_ALLOWED
- Duplicate payment → blocked

#### Journal Entry Balance
- Balanced entry → created successfully
- Unbalanced entry → UNBALANCED_JOURNAL error
- Auto-generated entry from invoice confirmation → always balanced

#### Budget
- Create budget → status draft
- Confirm budget → committed_amount set
- Revise budget → new budget created, original status = revised
- Cancel budget → archived

#### Financial Reports
- P&L shows correct income/expenses/net
- Balance Sheet: Total Assets = Total Liabilities
- Budget achieved calculation with matching analytics

---

## PHASE 20 — CRITICAL ACCOUNTING TEST CASES

| Test Case | Expected Result |
|-----------|----------------|
| Invoice confirmation creates balanced JE | DEBIT = CREDIT = invoice total |
| Bill confirmation creates balanced JE | DEBIT = CREDIT = bill total |
| Payment creates balanced JE | DEBIT = CREDIT = payment amount |
| Double confirmation of same invoice | Rejected with ALREADY_CONFIRMED |
| Overpayment on invoice | Rejected with OVERPAYMENT_NOT_ALLOWED |
| Budget achieved with matching analytics | Correct sum computed |
| P&L net income = income - expenses | Mathematical correctness |
| Balance sheet: assets = liabilities | Accounting equation holds |
| Unbalanced manual journal entry | Rejected with UNBALANCED_JOURNAL |

---

## PHASE 21 — REQUIREMENTS TRACEABILITY

| Req ID | Requirement | Feature | Screen | API | DB Table | Test |
|--------|------------|---------|--------|-----|----------|------|
| REQ-AUTH-001 | Login with credentials | Authentication | S02 | POST /auth/login | users | TC-AUTH-001 |
| REQ-AUTH-002 | Sign up creates invoicing user | Registration | S03 | POST /auth/signup | users | TC-AUTH-002 |
| REQ-AUTH-003 | Login ID unique 6-12 chars | Validation | S01,S03 | POST /auth/signup | users.login_id | TC-AUTH-003 |
| REQ-AUTH-004 | Password complexity | Validation | S01,S03 | POST /auth/signup | — | TC-AUTH-004 |
| REQ-AUTH-005 | Admin-only user creation | Authorization | S01 | POST /users | users | TC-AUTH-005 |
| REQ-CON-001 | Contact CRUD | Master Data | S06-S08 | /contacts | contacts | TC-CON-001 |
| REQ-CON-002 | Email unique per contact | Validation | S08 | POST /contacts | contacts.email | TC-CON-002 |
| REQ-PRD-001 | Product CRUD | Master Data | S09-S11 | /products | products | TC-PRD-001 |
| REQ-PRD-002 | Category created on fly | Feature | S11 | POST /products | categories | TC-PRD-002 |
| REQ-BUD-001 | Budget CRUD | Budget | S19-S22 | /budgets | budgets | TC-BUD-001 |
| REQ-BUD-002 | Budget state transitions | State Machine | S21 | PUT /budgets/:id/* | budgets.status | TC-BUD-002 |
| REQ-BUD-003 | Budget achieved calculation | Business Logic | S22 | GET /budgets/:id | — | TC-BUD-003 |
| REQ-BUD-004 | Budget revision creates new | Business Logic | S22 | POST /budgets/:id/revise | budgets | TC-BUD-004 |
| REQ-INV-001 | Invoice CRUD | Sales | S24 | /invoices | customer_invoices | TC-INV-001 |
| REQ-INV-002 | Invoice confirmation | Accounting | S24 | PUT /invoices/:id/confirm | invoices, je | TC-INV-002 |
| REQ-INV-003 | Invoice payment | Accounting | S25 | POST /invoices/:id/pay | payments | TC-INV-003 |
| REQ-INV-004 | Auto-generate invoice ref | Sequence | S24 | POST /invoices | invoices.invoice_reference | TC-INV-004 |
| REQ-BIL-001 | Bill CRUD | Purchase | S27 | /bills | vendor_bills | TC-BIL-001 |
| REQ-BIL-002 | Bill confirmation | Accounting | S27 | PUT /bills/:id/confirm | bills, je | TC-BIL-002 |
| REQ-BIL-003 | Bill payment | Accounting | S28 | POST /bills/:id/pay | payments | TC-BIL-003 |
| REQ-JE-001 | Journal entry balanced | Accounting | S17 | POST /journal_entries | journal_entry_lines | TC-JE-001 |
| REQ-JE-002 | Unbalanced JE blocked | Validation | S17 | POST /journal_entries | — | TC-JE-002 |
| REQ-RPT-001 | P&L report | Reports | S29 | GET /reports/profit-and-loss | — | TC-RPT-001 |
| REQ-RPT-002 | Balance sheet equality | Reports | S30 | GET /reports/balance-sheet | — | TC-RPT-002 |
| REQ-RPT-003 | Budget report | Reports | S20 | GET /reports/budget-report | — | TC-RPT-003 |

---

## PHASE 22 — FINAL GAP ANALYSIS

### 22.1 Confirmed Requirements (SOURCE_REQUIRED)
1. Three roles: Admin, Accountant, User
2. Sign up creates invoicing user only
3. Login with credentials, error on invalid
4. Contact CRUD with unique email
5. Product CRUD with category on-the-fly
6. Analytical account creation
7. Budget CRUD with Draft → Confirmed → Revised → Cancelled states
8. Budget achieved computation from invoices/bills with matching analytics
9. Sales Order → Customer Invoice → Payment workflow
10. Purchase Order → Vendor Bill → Payment workflow
11. Auto journal entry on invoice/bill confirmation
12. Journal entries must be balanced (debit = credit)
13. P&L, Balance Sheet, Budget Report
14. Balance Sheet: Total Assets = Total Liabilities
15. List view as default for all masters
16. Kanban view toggle
17. Pre-configured chart of accounts
18. Print and Send actions on invoices/bills
19. Invoice/Bill number auto-generation
20. Dashboard with kanban cards and counts

### 22.2 Ambiguous Requirements (SOURCE_AMBIGUOUS)
1. **Sign Up page button labeled "SIGN OUT"** — Likely should be "SIGN UP" or "CREATE". Recommendation: Use "SIGN UP"
2. **"Role" field on Create User shows only User and Administrator** — But annotations define 3 roles. Resolution: Use all 3 roles
3. **"Invoicing user" terminology** — Used interchangeably with "User" role. Resolution: They are the same role
4. **Budget analytical_id relationship** — Unclear if analyticals table is separate from budgets. Resolution: Separate table, budget references it
5. **Receipt vs Payment naming** — Sales side calls it "Receipt", Purchase side calls it "Payment". Resolution: Use receipts for sales, payments for purchases in API naming

### 22.3 Conflicting Requirements
1. **Create User form shows only 2 role options** vs **3 roles defined in annotations**
   - Resolution: Follow annotations (3 roles)
2. **"Password must be unique"** — Annotation says password must be unique. This is impractical (should not check password uniqueness). Resolution: Ignore uniqueness requirement for passwords — only enforce complexity

### 22.4 Missing Requirements (NOT_SPECIFIED)
1. Forgot Password implementation details (email flow, reset token)
2. User profile editing
3. User deletion/deactivation
4. Contact deletion/archiving
5. Product deletion/archiving
6. Soft delete vs hard delete strategy
7. Session management (refresh tokens, concurrent sessions)
8. Email service configuration for Send functionality
9. PDF generation library choice
10. Image upload/storage strategy (local, S3, etc.)
11. Budget line items (budgets seem to reference analytics but don't have explicit line items in form)
12. Receipt list view details (columns not shown)
13. Payment list view details (columns not shown)
14. Journals list view details (only Chart of Accounts shown with 4 entries)
15. Currency handling (Rs. shown — but multi-currency?)
16. Tax handling (no tax fields visible)
17. Void/cancel payment workflow

### 22.5 Engineering Decisions Required
1. UUID vs SERIAL for primary keys → **Decision: UUID** (better for distributed, API-friendly)
2. JWT vs session-based auth → **Decision: JWT** (stateless, works with separate frontend)
3. Soft delete vs hard delete → **Decision: Soft delete** for financial records, hard delete for drafts only
4. Monetary precision → **Decision: DECIMAL(15,2)** (supports large amounts with 2 decimal places)
5. API versioning → **Decision: /api/v1/ prefix** for future compatibility
6. JSON convention → **Decision: snake_case** (consistent with database)

### 22.6 24-Hour Hackathon Priorities

**MUST HAVE (Core):**
1. Authentication (login, sign up, role-based access)
2. Contact CRUD
3. Product CRUD
4. Budget CRUD with state machine
5. Customer Invoice creation and confirmation
6. Vendor Bill creation and confirmation
7. Auto journal entry on confirmation
8. Payment processing
9. P&L Report
10. Balance Sheet Report

**SHOULD HAVE:**
11. Dashboard with kanban counts
12. List/Kanban view toggle
13. Budget Report
14. Print/PDF for invoices and bills
15. Send via email (mock if needed)

**CAN DEFER:**
16. Forgot Password flow
17. Analytical accounts as separate module
18. Budget revision workflow
19. Sales Order → Invoice chain
20. Purchase Order → Bill chain
21. Kanban views for all modules
22. Advanced search/filtering

### 22.7 Integration Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Lovable frontend may not match API contract exactly | High | Document API contract precisely, use OpenAPI spec |
| Frontend may implement business logic instead of relying on backend | Critical | Enforce ALL business rules on backend, frontend as display only |
| Database schema mismatch | High | Use migration scripts, shared schema documentation |
| CORS/authentication issues between separate deployments | High | Document auth flow, test integration early |
| PDF generation timing | Medium | Use a simple HTML-to-PDF approach |

### 22.8 Database Risks
- Concurrent sequence generation → Use PostgreSQL sequences
- Transaction deadlocks on financial operations → Use consistent lock ordering
- Large report queries → Proper indexing on date ranges and account types

### 22.9 API Risks
- Inconsistent error formats → Standardize error contract
- Missing validation on backend → Test all validation server-side
- Pagination inconsistencies → Use consistent pagination format

### 22.10 Security Risks
- Password storage → bcrypt required
- SQL injection → Parameterized queries only
- IDOR → Validate record ownership on every request
- Missing authorization → Middleware on every protected route

### 22.11 Testing Risks
- Limited time for comprehensive testing → Prioritize business-critical path tests
- Manual testing may miss edge cases → Focus on automated API tests

---

## FUTURE DOCUMENT MAPPING

| Document | Purpose | Scope | Dependencies | Key Contents |
|----------|---------|-------|-------------|-------------|
| 01_PRD.md | Product Requirements | All features | This analysis | All SOURCE_REQUIRED items |
| 02_SYSTEM_FLOW.md | System Flows | Workflows | Phase 4 | All 22 workflows |
| 03_SYSTEM_ARCHITECTURE.md | Architecture | Tech stack, deployment | — | Frontend/backend separation, DB |
| 04_SYSTEM_DESIGN_AND_LOGIC.md | Business Logic | All rules | Phase 7, 8 | Accounting engine, state machines |
| 05_FEATURES.md | Feature List | All features | Phase 1 | Screen inventory, modules |
| 06_FRONTEND.md | Frontend Spec | UI components | Phase 11, 12 | Routes, components, states |
| 07_BACKEND.md | Backend Spec | API implementation | Phase 9 | Endpoints, middleware |
| 08_API_CONTRACTS.md | API Contract | All endpoints | Phase 9 | Full request/response specs |
| 09_SECURITY.md | Security Plan | All security | Phase 13 | Auth, authz, encryption |
| 10_ESSENTIAL_TESTS.md | Test Plan | All tests | Phase 19, 20 | Test cases, assertions |
