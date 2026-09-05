# 13 — Canonical Domain Model

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Entity Inventory

| # | Entity | Purpose | Source Required |
|---|--------|---------|-----------------|
| E01 | User | System authentication and authorization | Yes |
| E02 | Contact | Customer/vendor master data | Yes |
| E03 | Category | Product classification | Yes |
| E04 | Product | Goods/services sold/purchased | Yes |
| E05 | AnalyticalAccount | Cost center/profit center for budget tracking | Yes |
| E06 | Budget | Financial plan linked to analytical account | Yes |
| E07 | ChartOfAccount | Chart of accounts for double-entry bookkeeping | Yes |
| E08 | Journal | Accounting journal type definition | Yes |
| E09 | JournalEntry | Double-entry bookkeeping header | Yes |
| E10 | JournalEntryLine | Individual debit/credit line in journal entry | Yes |
| E11 | SalesOrder | Customer sales order | Yes |
| E12 | SalesOrderLine | Line item in sales order | Yes |
| E13 | CustomerInvoice | Invoice to customer | Yes |
| E14 | CustomerInvoiceLine | Line item in customer invoice | Yes |
| E15 | PurchaseOrder | Vendor purchase order | Yes |
| E16 | PurchaseOrderLine | Line item in purchase order | Yes |
| E17 | VendorBill | Bill from vendor | Yes |
| E18 | VendorBillLine | Line item in vendor bill | Yes |
| E19 | Payment | Payment against invoice or bill | Yes |

---

## 2. Entity Definitions

### E01: User

**Purpose:** System authentication and role-based authorization

**Ownership:** Administrator only (create/delete); self (update password)

**Lifecycle:** Created → Active → (Deactivated — post-hackathon)

**Relationships:**
- Created by: User (admin)
- Has many: CustomerInvoices (created_by)
- Has many: VendorBills (created_by)
- Has many: Payments (created_by)
- Has many: JournalEntries (created_by — if audit enabled)

**Required fields:** name, login_id, email, password_hash, role

**Optional fields:** is_active

**Derived fields:** none

**Mutable fields:** name, email, role (admin only), is_active

**Immutable-after-creation:** login_id, password_hash (separate change flow)

**Source requirements:** AUTH-001 through AUTH-010, ROLE-001 through ROLE-008

**Constraints:**
- login_id: UNIQUE, 6-12 characters
- email: UNIQUE
- role: ENUM('admin', 'accountant', 'user')

**Permissions:**
- Create: Admin only
- Read: Admin (all users), self (own profile)
- Update: Admin (any user), self (name, email only)
- Delete: Not implemented (hackathon)

---

### E02: Contact

**Purpose:** Customer and vendor master data

**Ownership:** System (shared entity — customers and vendors are the same)

**Lifecycle:** Created → Active → (Archived — post-hackathon)

**Relationships:**
- Referenced by: CustomerInvoice (customer_id, partner_id)
- Referenced by: VendorBill (vendor_id, partner_id)
- Referenced by: JournalEntryLine (partner_id)
- Referenced by: SalesOrder (customer_id)
- Referenced by: PurchaseOrder (vendor_id)
- Referenced by: AnalyticalAccount (responsible_id)
- Referenced by: Budget (responsible_id)

**Required fields:** name, email

**Optional fields:** phone, image_url, street, city, state, country, pincode

**Derived fields:** none

**Mutable fields:** all fields

**Immutable-after-creation:** none

**Source requirements:** CON-001 through CON-008

**Constraints:**
- email: UNIQUE
- Referenced by financial records: cannot be hard deleted

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant
- Update: Admin, Accountant
- Delete: Not implemented (hackathon)

---

### E03: Category

**Purpose:** Product classification

**Ownership:** System

**Lifecycle:** Created → Active

**Relationships:**
- Has many: Products

**Required fields:** name

**Optional fields:** none

**Derived fields:** none

**Mutable fields:** name

**Immutable-after-creation:** none

**Source requirements:** PRD-005

**Constraints:**
- name: UNIQUE

**Permissions:**
- Create: Admin, Accountant (on-the-fly during product creation)
- Read: Admin, Accountant
- Update: Admin, Accountant
- Delete: Not implemented

---

### E04: Product

**Purpose:** Goods/services sold to customers or purchased from vendors

**Ownership:** System

**Lifecycle:** Created → Active

**Relationships:**
- Belongs to: Category
- Has many: SalesOrderLine
- Has many: CustomerInvoiceLine
- Has many: PurchaseOrderLine
- Has many: VendorBillLine

**Required fields:** name, product_type, category_id, sales_price, cost

**Optional fields:** image_url

**Derived fields:** none

**Mutable fields:** all fields

**Immutable-after-creation:** none

**Source requirements:** PRD-001 through PRD-007

**Constraints:**
- product_type: ENUM('goods', 'service', 'combo')
- sales_price >= 0
- cost >= 0

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant
- Update: Admin, Accountant
- Delete: Not implemented

---

### E05: AnalyticalAccount

**Purpose:** Cost center/profit center for budget tracking and achievement calculation

**Ownership:** System

**Lifecycle:** Created → Active

**Relationships:**
- Belongs to: Contact (responsible_id)
- Has many: Budgets
- Referenced by: CustomerInvoiceLine (budget_analytic_id)
- Referenced by: VendorBillLine (budget_analytic_id)
- Referenced by: SalesOrderLine (budget_analytic_id)
- Referenced by: PurchaseOrderLine (budget_analytic_id)

**Required fields:** name, responsible_id, start_date, to_date, end_date, analytic_account

**Optional fields:** none

**Derived fields:** none

**Mutable fields:** all fields

**Immutable-after-creation:** none (but budget references may limit edits)

**Source requirements:** ANA-001 through ANA-003

**Constraints:**
- start_date < to_date < end_date
- responsible_id → contacts.id

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant
- Update: Admin, Accountant
- Delete: Not implemented

---

### E06: Budget

**Purpose:** Financial plan tracking committed vs achieved amounts

**Ownership:** Responsible person (Contact)

**Lifecycle:** Draft → Confirmed → Revised → Cancelled

**Relationships:**
- Belongs to: Contact (responsible_id)
- Belongs to: AnalyticalAccount (analytical_id)
- Self-referential: original_budget_id (for revisions)

**Required fields:** name, responsible_id, start_date, end_date, type, analytical_id

**Optional fields:** committed_amount, original_budget_id

**Derived fields:** achieved_amount, achieved_percentage, amount_to_achieve

**Mutable fields:** name, responsible_id, start_date, end_date, type, analytical_id (draft only)

**Immutable-after-creation:** committed_amount (set on confirm, read-only after)

**Source requirements:** BUD-001 through BUD-011

**Constraints:**
- type: ENUM('income', 'expense')
- status: ENUM('draft', 'confirmed', 'revised', 'cancelled')
- start_date < end_date
- committed_amount: SET on confirmation, not editable
- is_archived: SET on cancellation

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant
- Update: Admin, Accountant (draft only)
- Confirm: Admin, Accountant
- Revise: Admin, Accountant (confirmed only)
- Cancel: Admin, Accountant

---

### E07: ChartOfAccount

**Purpose:** Chart of accounts for double-entry bookkeeping

**Ownership:** System (pre-configured)

**Lifecycle:** Created (seed) → Active

**Relationships:**
- Has many: Journal (default_account_id)
- Has many: JournalEntryLine (account_id)
- Has many: SalesOrderLine (chart_of_account_id)
- Has many: CustomerInvoiceLine (chart_of_account_id)
- Has many: PurchaseOrderLine (chart_of_account_id)
- Has many: VendorBillLine (chart_of_account_id)

**Required fields:** name, account_type

**Optional fields:** journal_type

**Derived fields:** none

**Mutable fields:** name (but rarely changed)

**Immutable-after-creation:** account_type (changing would break reports)

**Source requirements:** COA-001 through COA-004, BR-001

**Constraints:**
- account_type: ENUM('asset', 'liability', 'bank', 'capital', 'cash', 'income', 'expense')
- Pre-configured via seed data

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant
- Update: Admin only
- Delete: Not allowed (pre-configured)

---

### E08: Journal

**Purpose:** Accounting journal type definition (Sales, Purchase, Bank, Cash)

**Ownership:** System (pre-configured)

**Lifecycle:** Created (seed) → Active

**Relationships:**
- Belongs to: ChartOfAccount (default_account_id)
- Has many: JournalEntry (journal_id)

**Required fields:** name, journal_type, default_account_id

**Optional fields:** none

**Derived fields:** none

**Mutable fields:** none (pre-configured)

**Immutable-after-creation:** all fields

**Source requirements:** JNL-001, JNL-002, BR-001

**Constraints:**
- journal_type: ENUM('sale', 'purchase', 'bank', 'cash')
- Pre-configured via seed data

**Permissions:**
- Read: Admin, Accountant
- No create/update/delete (pre-configured)

---

### E09: JournalEntry

**Purpose:** Double-entry bookkeeping header

**Ownership:** System (auto-created) or Accountant (manual)

**Lifecycle:** Draft → Posted

**Relationships:**
- Belongs to: Journal (journal_id)
- Has many: JournalEntryLine
- Referenced by: CustomerInvoice (journal_entry_id)
- Referenced by: VendorBill (journal_entry_id)
- Referenced by: Payment (journal_entry_id)

**Required fields:** entry_number, accounting_date, journal_id

**Optional fields:** source_document_type, source_document_id

**Derived fields:** total_debit, total_credit (computed from lines)

**Mutable fields:** none after posting

**Immutable-after-creation:** all fields (journal entries are immutable)

**Source requirements:** JNL-003 through JNL-006, BR-002 through BR-004

**Constraints:**
- entry_number: UNIQUE, auto-generated
- status: ENUM('draft', 'posted')
- SUM(debit) = SUM(credit) for all lines

**Permissions:**
- Create: Admin, Accountant (manual); System (auto)
- Read: Admin, Accountant
- Update: Not allowed (immutable)
- Delete: Not allowed

---

### E10: JournalEntryLine

**Purpose:** Individual debit/credit line in journal entry

**Ownership:** Parent JournalEntry

**Lifecycle:** Created with parent → Immutable

**Relationships:**
- Belongs to: JournalEntry (journal_entry_id)
- Belongs to: ChartOfAccount (account_id)
- Belongs to: Contact (partner_id — optional)

**Required fields:** journal_entry_id, account_id, debit, credit

**Optional fields:** partner_id

**Derived fields:** none

**Mutable fields:** none

**Immutable-after-creation:** all fields

**Source requirements:** JNL-004, JNL-006

**Constraints:**
- debit >= 0
- credit >= 0
- debit > 0 OR credit > 0 (at least one positive)
- SUM(debit) = SUM(credit) per journal entry

**Permissions:**
- Inherited from parent JournalEntry

---

### E11: SalesOrder

**Purpose:** Customer sales order

**Ownership:** System (created by accountant)

**Lifecycle:** Draft → Confirmed → (generates CustomerInvoice)

**Relationships:**
- Belongs to: Contact (customer_id)
- Has many: SalesOrderLine
- Has one: CustomerInvoice (via sales_order_id)

**Required fields:** so_number, customer_id, date, invoice_date, due_date

**Optional fields:** none

**Derived fields:** total (sum of line totals)

**Mutable fields:** customer_id, date, invoice_date, due_date, lines (draft only)

**Immutable-after-creation:** so_number, status

**Source requirements:** SO-001 through SO-003

**Constraints:**
- so_number: UNIQUE, auto-generated
- status: ENUM('draft', 'confirmed')
- date <= invoice_date <= due_date

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant
- Update: Admin, Accountant (draft only)
- Confirm: Admin, Accountant

---

### E12: SalesOrderLine

**Purpose:** Line item in sales order

**Ownership:** Parent SalesOrder

**Lifecycle:** Created with parent → Immutable after confirmation

**Relationships:**
- Belongs to: SalesOrder (sales_order_id)
- Belongs to: Product (product_id)
- Belongs to: ChartOfAccount (chart_of_account_id)
- Belongs to: AnalyticalAccount (budget_analytic_id — optional)

**Required fields:** sr_no, product_id, chart_of_account_id, qty, unit_price

**Optional fields:** budget_analytic_id

**Derived fields:** total (qty * unit_price)

**Mutable fields:** all (draft only)

**Immutable-after-creation:** all (after SO confirmation)

**Source requirements:** SO-003, INV-002

**Constraints:**
- qty > 0
- unit_price >= 0
- total = qty * unit_price

**Permissions:**
- Inherited from parent SalesOrder

---

### E13: CustomerInvoice

**Purpose:** Invoice to customer for goods/services

**Ownership:** Created by accountant; owned by customer (for portal access)

**Lifecycle:** Draft → Confirmed → Paid

**Relationships:**
- Belongs to: Contact (customer_id, partner_id)
- Belongs to: SalesOrder (sales_order_id — optional)
- Has many: CustomerInvoiceLine
- Has many: Payment (invoice_id)
- Has one: JournalEntry (journal_entry_id)
- Created by: User (created_by)

**Required fields:** invoice_reference, customer_id, date, invoice_date, due_date, payment_type, partner_id, payment_via

**Optional fields:** sales_order_id

**Derived fields:** total (sum of line totals), amount_due (total - sum of payments)

**Mutable fields:** customer_id, date, invoice_date, due_date, payment_type, partner_id, payment_via, lines (draft only)

**Immutable-after-creation:** invoice_reference, invoice_number, status, journal_entry_id

**Source requirements:** INV-001 through INV-010

**Constraints:**
- invoice_reference: UNIQUE, auto-generated (INV/YYYY/NNNN)
- invoice_number: UNIQUE, auto-generated
- status: ENUM('draft', 'confirmed', 'paid')
- payment_type: ENUM('receive', 'send')
- payment_via: ENUM('bank', 'cash')
- amount_due >= 0
- date <= invoice_date <= due_date

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant, User (own invoices only)
- Update: Admin, Accountant (draft only)
- Confirm: Admin, Accountant
- Pay: Admin, Accountant, User (own invoices only)

---

### E14: CustomerInvoiceLine

**Purpose:** Line item in customer invoice

**Ownership:** Parent CustomerInvoice

**Lifecycle:** Created with parent → Immutable after confirmation

**Relationships:**
- Belongs to: CustomerInvoice (invoice_id)
- Belongs to: Product (product_id)
- Belongs to: ChartOfAccount (chart_of_account_id)
- Belongs to: AnalyticalAccount (budget_analytic_id — optional)

**Required fields:** sr_no, product_id, chart_of_account_id, qty, unit_price

**Optional fields:** budget_analytic_id

**Derived fields:** total (qty * unit_price)

**Mutable fields:** all (draft only)

**Immutable-after-creation:** all (after invoice confirmation)

**Source requirements:** INV-002

**Constraints:**
- qty > 0
- unit_price >= 0
- total = qty * unit_price

**Permissions:**
- Inherited from parent CustomerInvoice

---

### E15: PurchaseOrder

**Purpose:** Vendor purchase order

**Ownership:** System (created by accountant)

**Lifecycle:** Draft → Confirmed → (generates VendorBill)

**Relationships:**
- Belongs to: Contact (vendor_id)
- Has many: PurchaseOrderLine
- Has one: VendorBill (via purchase_order_id)

**Required fields:** po_number, vendor_id, date, bill_date, due_date

**Optional fields:** none

**Derived fields:** total (sum of line totals)

**Mutable fields:** vendor_id, date, bill_date, due_date, lines (draft only)

**Immutable-after-creation:** po_number, status

**Source requirements:** PO-001, PO-002

**Constraints:**
- po_number: UNIQUE, auto-generated
- status: ENUM('draft', 'confirmed')
- date <= bill_date <= due_date

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant
- Update: Admin, Accountant (draft only)
- Confirm: Admin, Accountant

---

### E16: PurchaseOrderLine

**Purpose:** Line item in purchase order

**Ownership:** Parent PurchaseOrder

**Lifecycle:** Created with parent → Immutable after confirmation

**Relationships:**
- Belongs to: PurchaseOrder (purchase_order_id)
- Belongs to: Product (product_id)
- Belongs to: ChartOfAccount (chart_of_account_id)
- Belongs to: AnalyticalAccount (budget_analytic_id — optional)

**Required fields:** sr_no, product_id, chart_of_account_id, qty, unit_price

**Optional fields:** budget_analytic_id

**Derived fields:** total (qty * unit_price)

**Mutable fields:** all (draft only)

**Immutable-after-creation:** all (after PO confirmation)

**Source requirements:** PO-002

**Constraints:**
- qty > 0
- unit_price >= 0
- total = qty * unit_price

**Permissions:**
- Inherited from parent PurchaseOrder

---

### E17: VendorBill

**Purpose:** Bill from vendor for goods/services purchased

**Ownership:** Created by accountant; owned by vendor (for portal access)

**Lifecycle:** Draft → Confirmed → Paid

**Relationships:**
- Belongs to: Contact (vendor_id, partner_id)
- Belongs to: PurchaseOrder (purchase_order_id — optional)
- Has many: VendorBillLine
- Has many: Payment (vendor_bill_id)
- Has one: JournalEntry (journal_entry_id)
- Created by: User (created_by)

**Required fields:** bill_reference, vendor_id, date, bill_date, due_date, payment_type, partner_id, payment_via

**Optional fields:** purchase_order_id, vendor_bill_no

**Derived fields:** total (sum of line totals), amount_due (total - sum of payments)

**Mutable fields:** vendor_id, date, bill_date, due_date, payment_type, partner_id, payment_via, lines (draft only)

**Immutable-after-creation:** bill_reference, status, journal_entry_id

**Source requirements:** BIL-001 through BIL-008

**Constraints:**
- bill_reference: UNIQUE, auto-generated (Bill/YYYY/NNNN)
- status: ENUM('draft', 'confirmed', 'paid')
- payment_type: ENUM('receive', 'send')
- payment_via: ENUM('bank', 'cash')
- amount_due >= 0
- date <= bill_date <= due_date

**Permissions:**
- Create: Admin, Accountant
- Read: Admin, Accountant
- Update: Admin, Accountant (draft only)
- Confirm: Admin, Accountant
- Pay: Admin, Accountant

---

### E18: VendorBillLine

**Purpose:** Line item in vendor bill

**Ownership:** Parent VendorBill

**Lifecycle:** Created with parent → Immutable after confirmation

**Relationships:**
- Belongs to: VendorBill (vendor_bill_id)
- Belongs to: Product (product_id)
- Belongs to: ChartOfAccount (chart_of_account_id)
- Belongs to: AnalyticalAccount (budget_analytic_id — optional)

**Required fields:** sr_no, product_id, chart_of_account_id, qty, unit_price

**Optional fields:** budget_analytic_id

**Derived fields:** total (qty * unit_price)

**Mutable fields:** all (draft only)

**Immutable-after-creation:** all (after bill confirmation)

**Source requirements:** BIL-002

**Constraints:**
- qty > 0
- unit_price >= 0
- total = qty * unit_price

**Permissions:**
- Inherited from parent VendorBill

---

### E19: Payment

**Purpose:** Payment against invoice (receipt) or bill (payment)

**Ownership:** Created by accountant/user; linked to invoice or bill

**Lifecycle:** Draft → Confirmed → Successful

**Relationships:**
- Belongs to: CustomerInvoice (invoice_id — optional)
- Belongs to: VendorBill (vendor_bill_id — optional)
- Has one: JournalEntry (journal_entry_id)
- Created by: User (created_by)

**Required fields:** payment_number, amount, payment_via, payment_date

**Optional fields:** invoice_id, vendor_bill_id

**Derived fields:** none

**Mutable fields:** amount, payment_via, payment_date (draft only)

**Immutable-after-creation:** payment_number, status, journal_entry_id

**Source requirements:** PAY-001 through PAY-004

**Constraints:**
- payment_number: UNIQUE, auto-generated
- status: ENUM('draft', 'confirmed', 'successful')
- Exactly one of invoice_id or vendor_bill_id must be non-null
- amount > 0
- amount <= amount_due of linked invoice/bill

**Permissions:**
- Create: Admin, Accountant, User (own invoices only for invoice payment)
- Read: Admin, Accountant, User (own payments)
- Confirm: Admin, Accountant
- Reset: Admin, Accountant (draft only)

---

## 3. Entity Relationship Summary

```
User ──creates──▶ CustomerInvoice
User ──creates──▶ VendorBill
User ──creates──▶ Payment
User ──creates──▶ JournalEntry (manual)

Contact ◀──referenced── CustomerInvoice (customer_id, partner_id)
Contact ◀──referenced── VendorBill (vendor_id, partner_id)
Contact ◀──referenced── JournalEntryLine (partner_id)
Contact ◀──referenced── SalesOrder (customer_id)
Contact ◀──referenced── PurchaseOrder (vendor_id)
Contact ◀──referenced── AnalyticalAccount (responsible_id)
Contact ◀──referenced── Budget (responsible_id)

Category ◀──has── Product

Product ◀──referenced── SalesOrderLine
Product ◀──referenced── CustomerInvoiceLine
Product ◀──referenced── PurchaseOrderLine
Product ◀──referenced── VendorBillLine

AnalyticalAccount ◀──has── Budget
AnalyticalAccount ◀──referenced── SalesOrderLine
AnalyticalAccount ◀──referenced── CustomerInvoiceLine
AnalyticalAccount ◀──referenced── PurchaseOrderLine
AnalyticalAccount ◀──referenced── VendorBillLine

ChartOfAccount ◀──referenced── JournalEntryLine
ChartOfAccount ◀──has── Journal
ChartOfAccount ◀──referenced── SalesOrderLine
ChartOfAccount ◀──referenced── CustomerInvoiceLine
ChartOfAccount ◀──referenced── PurchaseOrderLine
ChartOfAccount ◀──referenced── VendorBillLine

Journal ◀──has── JournalEntry

JournalEntry ◀──has── JournalEntryLine
JournalEntry ◀──referenced── CustomerInvoice
JournalEntry ◀──referenced── VendorBill
JournalEntry ◀──referenced── Payment

SalesOrder ◀──has── SalesOrderLine
SalesOrder ◀──generates── CustomerInvoice

CustomerInvoice ◀──has── CustomerInvoiceLine
CustomerInvoice ◀──has── Payment

PurchaseOrder ◀──has── PurchaseOrderLine
PurchaseOrder ◀──generates── VendorBill

VendorBill ◀──has── VendorBillLine
VendorBill ◀──has── Payment
```

---

*Document generated from domain analysis on 2026-09-05*
