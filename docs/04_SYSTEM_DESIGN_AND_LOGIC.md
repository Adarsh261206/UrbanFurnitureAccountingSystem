# 04 — System Design and Logic

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Frozen Accounting Rules + Engineering Decisions  
> **Date:** 2026-09-05

---

## 1. Accounting Engine

### 1.1 Core Accounting Rules

| Rule ID | Rule | Classification | Frozen Decision |
|---------|------|----------------|-----------------|
| ACCT-001 | All accounts are pre-configured | SOURCE_REQUIRED | Seed data |
| ACCT-002 | Journal entries must be balanced (debit = credit) | SOURCE_REQUIRED | INVARIANT |
| ACCT-003 | Invoice confirmation creates journal entry (Sales) | SOURCE_REQUIRED | Automated |
| ACCT-004 | Bill confirmation creates journal entry (Purchase) | SOURCE_REQUIRED | Automated |
| ACCT-005 | Balance Sheet: Total Assets = Total Liabilities | SOURCE_REQUIRED | INVARIANT |
| ACCT-006 | Account type determines report placement | SOURCE_REQUIRED | Mapping |

### 1.2 Chart of Accounts Types

| Account Type | Report Section | Example Accounts |
|--------------|----------------|------------------|
| Asset | Balance Sheet (Assets) | Debtors |
| Liability | Balance Sheet (Liabilities) | Creditors |
| Bank | Balance Sheet (Assets) | Bank A/c |
| Cash | Balance Sheet (Assets) | Cash A/c |
| Capital | Balance Sheet (Liabilities) | Capital |
| Income | P&L (Income) | Sales Income A/c |
| Expense | P&L (Expenses) | Purchase Expense A/c |

### 1.3 Pre-configured Journals

| Journal Name | Type | Default Account |
|--------------|------|-----------------|
| Sales | Sale | Sales Income A/c |
| Purchase | Purchase | Purchase Expense A/c |
| Bank | Bank | Bank A/c |
| Cash | Cash | Cash A/c |
| Capital A/c | Capital | Capital |

---

## 2. Accounting Transactions

### 2.1 Customer Invoice Confirmation

```
JOURNAL:    Sales
DATE:       Invoice Date
PARTNER:    Customer (from invoice)
REFERENCE:  Invoice Reference (INV/YYYY/NNNN)

LINES:
  Line 1:
    ACCOUNT:    Debtors (Asset)
    DEBIT:      Invoice Total
    CREDIT:     0
    PARTNER:    Customer ID

  Line 2:
    ACCOUNT:    Sales Income (Income)
    DEBIT:      0
    CREDIT:     Invoice Total

INVARIANT: DEBIT = CREDIT
```

### 2.2 Customer Invoice Payment

```
JOURNAL:    Bank (or Cash)
DATE:       Payment Date
PARTNER:    Customer (from invoice)
REFERENCE:  Payment Number (PAY/YYYY/NNNN)

LINES:
  Line 1:
    ACCOUNT:    Bank (or Cash)
    DEBIT:      Payment Amount
    CREDIT:     0
    PARTNER:    Customer ID

  Line 2:
    ACCOUNT:    Debtors (Asset)
    DEBIT:      0
    CREDIT:     Payment Amount

INVARIANT: DEBIT = CREDIT
```

### 2.3 Vendor Bill Confirmation

```
JOURNAL:    Purchase
DATE:       Bill Date
PARTNER:    Vendor (from bill)
REFERENCE:  Bill Reference (Bill/YYYY/NNNN)

LINES:
  Line 1:
    ACCOUNT:    Purchase Expense (Expense)
    DEBIT:      Bill Total
    CREDIT:     0

  Line 2:
    ACCOUNT:    Creditors (Liability)
    DEBIT:      0
    CREDIT:     Bill Total
    PARTNER:    Vendor ID

INVARIANT: DEBIT = CREDIT
```

### 2.4 Vendor Bill Payment

```
JOURNAL:    Bank (or Cash)
DATE:       Payment Date
PARTNER:    Vendor (from bill)
REFERENCE:  Payment Number (PAY/YYYY/NNNN)

LINES:
  Line 1:
    ACCOUNT:    Creditors (Liability)
    DEBIT:      Payment Amount
    CREDIT:     0
    PARTNER:    Vendor ID

  Line 2:
    ACCOUNT:    Bank (or Cash)
    DEBIT:      0
    CREDIT:     Payment Amount

INVARIANT: DEBIT = CREDIT
```

### 2.5 Manual Journal Entry

```
JOURNAL:    User-selected
DATE:       User-specified
PARTNER:    Optional
REFERENCE:  User-specified

LINES:
  Line 1..N:
    ACCOUNT:    User-selected
    DEBIT:      User-specified
    CREDIT:     User-specified
    PARTNER:    Optional

INVARIANT: SUM(DEBIT) = SUM(CREDIT)
WARNING:   Show blocking warning if unbalanced
```

---

## 3. State Machines

### 3.1 Budget State Machine

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
      ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
      │ CONFIRMED │ │REVISED │ │ CANCELLED│
      └─────┬─────┘ └───▲────┘ └──────────┘
            │            │
            └────────────┘
```

**Transitions:**
- Draft → Confirmed (confirm)
- Draft → Revised (revise)
- Draft → Cancelled (cancel)
- Confirmed → Revised (revise)

**Forbidden:**
- Confirmed → Draft
- Cancelled → any
- Revised → any

### 3.2 Invoice State Machine

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
      ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
      │ CONFIRMED │ │ PAID   │ │ CANCELLED│
      └─────┬─────┘ └────────┘ └──────────┘
            │
            │
      ┌─────▼─────┐
      │   PAID    │
      └───────────┘
```

**Transitions:**
- Draft → Confirmed (confirm)
- Draft → Cancelled (cancel)
- Confirmed → Paid (pay)

**Forbidden:**
- Confirmed → Draft
- Paid → any
- Cancelled → any

### 3.3 Bill State Machine

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
      ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
      │ CONFIRMED │ │ PAID   │ │ CANCELLED│
      └─────┬─────┘ └────────┘ └──────────┘
            │
            │
      ┌─────▼─────┐
      │   PAID    │
      └───────────┘
```

**Transitions:**
- Draft → Confirmed (confirm)
- Draft → Cancelled (cancel)
- Confirmed → Paid (pay)

**Forbidden:**
- Confirmed → Draft
- Paid → any
- Cancelled → any

---

## 4. Budget Achievement Calculation

### 4.1 Income Budget

```
achieved_amount = SUM(cil.total)
  FROM customer_invoice_lines cil
  JOIN customer_invoices ci ON ci.id = cil.invoice_id
  WHERE cil.budget_analytic_id = budget.analytical_id
    AND ci.status IN ('confirmed', 'paid')
    AND ci.invoice_date BETWEEN budget.start_date AND budget.end_date
```

### 4.2 Expense Budget

```
achieved_amount = SUM(vbl.total)
  FROM vendor_bill_lines vbl
  JOIN vendor_bills vb ON vb.id = vbl.vendor_bill_id
  WHERE vbl.budget_analytic_id = budget.analytical_id
    AND vb.status IN ('confirmed', 'paid')
    AND vb.bill_date BETWEEN budget.start_date AND budget.end_date
```

### 4.3 Metrics

```
achieved_percentage = (achieved_amount / budget.committed_amount) * 100
amount_to_achieve = budget.committed_amount - achieved_amount
```

---

## 5. Report Calculations

### 5.1 Profit & Loss

```
Income = SUM(jel.credit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type = 'income'
    AND je.accounting_date BETWEEN {year}-01-01 AND {year}-12-31

Expenses = SUM(jel.debit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type = 'expense'
    AND je.accounting_date BETWEEN {year}-01-01 AND {year}-12-31

Net_Income = Income - Expenses
```

### 5.2 Balance Sheet

```
Assets = SUM(debit - credit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type IN ('asset', 'bank', 'cash')
    AND je.accounting_date <= {year}-12-31

Liabilities = SUM(credit - debit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type IN ('liability', 'capital', 'income')
    AND je.accounting_date <= {year}-12-31

INVARIANT: ABS(Assets - Liabilities) < 0.01
```

---

## 6. Validation Rules

### 6.1 Invoice Validation

| Field | Rule | Error |
|-------|------|-------|
| customer_id | Required | CUSTOMER_REQUIRED |
| invoice_date | Required | DATE_REQUIRED |
| due_date | Required, >= invoice_date | INVALID_DUE_DATE |
| lines | At least 1 | LINES_REQUIRED |
| line.product_id | Required | PRODUCT_REQUIRED |
| line.quantity | > 0 | INVALID_QUANTITY |
| line.unit_price | >= 0 | INVALID_PRICE |
| payment.amount | <= amount_due | OVERPAYMENT_NOT_ALLOWED |
| payment.amount | > 0 | INVALID_AMOUNT |

### 6.2 Bill Validation

| Field | Rule | Error |
|-------|------|-------|
| vendor_id | Required | VENDOR_REQUIRED |
| bill_date | Required | DATE_REQUIRED |
| due_date | Required, >= bill_date | INVALID_DUE_DATE |
| lines | At least 1 | LINES_REQUIRED |
| line.product_id | Required | PRODUCT_REQUIRED |
| line.quantity | > 0 | INVALID_QUANTITY |
| line.unit_price | >= 0 | INVALID_PRICE |
| payment.amount | <= amount_due | OVERPAYMENT_NOT_ALLOWED |
| payment.amount | > 0 | INVALID_AMOUNT |

### 6.3 Budget Validation

| Field | Rule | Error |
|-------|------|-------|
| name | Required | NAME_REQUIRED |
| type | Required (income/expense) | TYPE_REQUIRED |
| start_date | Required | DATE_REQUIRED |
| end_date | Required, >= start_date | INVALID_END_DATE |
| committed_amount | Required on confirm | AMOUNT_REQUIRED |

---

*Document generated from frozen accounting rules on 2026-09-05*
