# 16 — Accounting Rules

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Core Invariant

**DEBIT = CREDIT for every journal entry.**

This invariant is verified:
1. Before transaction: Application validates SUM(debit) = SUM(credit)
2. Inside transaction: Application re-validates after line creation
3. If violated: Entire transaction ROLLS BACK

---

## 2. Transaction Definitions

### 2.1 Customer Invoice Confirmation

| Property | Value |
|----------|-------|
| Trigger | `POST /api/v1/invoices/:id/confirm` |
| Preconditions | Status = 'draft', lines not empty, total > 0 |
| Journal | Sales |
| Debit Account | Debtors (Asset) |
| Credit Account | Sales Income (Income) |
| Partner | Customer (from invoice.customer_id) |
| Date | invoice_date |
| Amount | invoice.total |
| Reference | invoice.invoice_reference |
| Source Document | invoice.id |
| Resulting Records | 1 JournalEntry + 2 JournalEntryLines |
| Validation | SUM(debit) = SUM(credit) |
| Atomicity | SINGLE TRANSACTION |
| Failure Behavior | ROLLBACK all changes |
| Idempotency | Idempotent (check status before processing) |
| Concurrency | Optimistic locking (status check) |

**Journal Entry Lines:**
```
Line 1: DEBIT  Debtors account        partner=customer  amount=invoice.total
Line 2: CREDIT Sales Income account   partner=NULL      amount=invoice.total
```

---

### 2.2 Vendor Bill Confirmation

| Property | Value |
|----------|-------|
| Trigger | `POST /api/v1/bills/:id/confirm` |
| Preconditions | Status = 'draft', lines not empty, total > 0 |
| Journal | Purchase |
| Debit Account | Purchase Expense (Expense) |
| Credit Account | Creditors (Liability) |
| Partner | Vendor (from bill.vendor_id) |
| Date | bill_date |
| Amount | bill.total |
| Reference | bill.bill_reference |
| Source Document | bill.id |
| Resulting Records | 1 JournalEntry + 2 JournalEntryLines |
| Validation | SUM(debit) = SUM(credit) |
| Atomicity | SINGLE TRANSACTION |
| Failure Behavior | ROLLBACK all changes |
| Idempotency | Idempotent (check status before processing) |
| Concurrency | Optimistic locking (status check) |

**Journal Entry Lines:**
```
Line 1: DEBIT  Purchase Expense account  partner=NULL      amount=bill.total
Line 2: CREDIT Creditors account         partner=vendor    amount=bill.total
```

---

### 2.3 Customer Invoice Payment (Receipt)

| Property | Value |
|----------|-------|
| Trigger | `POST /api/v1/invoices/:id/pay` |
| Preconditions | Status = 'confirmed', amount <= amount_due, amount > 0 |
| Journal | Bank or Cash (as selected) |
| Debit Account | Bank/Cash (Asset) |
| Credit Account | Debtors (Asset) |
| Partner | Customer (from invoice.customer_id) |
| Date | payment_date |
| Amount | payment.amount |
| Reference | payment.payment_number |
| Source Document | payment.id |
| Resulting Records | 1 Payment + 1 JournalEntry + 2 JournalEntryLines |
| Validation | amount > 0, amount <= amount_due |
| Atomicity | SINGLE TRANSACTION |
| Failure Behavior | ROLLBACK all changes |
| Idempotency | Idempotent (check payment status) |
| Concurrency | Optimistic locking (amount_due check) |

**Journal Entry Lines:**
```
Line 1: DEBIT  Bank/Cash account    partner=NULL      amount=payment.amount
Line 2: CREDIT Debtors account      partner=customer  amount=payment.amount
```

**Side Effects:**
- invoice.amount_due -= payment.amount
- IF invoice.amount_due = 0 THEN invoice.status = 'paid'

---

### 2.4 Vendor Bill Payment

| Property | Value |
|----------|-------|
| Trigger | `POST /api/v1/bills/:id/pay` |
| Preconditions | Status = 'confirmed', amount <= amount_due, amount > 0 |
| Journal | Bank or Cash (as selected) |
| Debit Account | Creditors (Liability) |
| Credit Account | Bank/Cash (Asset) |
| Partner | Vendor (from bill.vendor_id) |
| Date | payment_date |
| Amount | payment.amount |
| Reference | payment.payment_number |
| Source Document | payment.id |
| Resulting Records | 1 Payment + 1 JournalEntry + 2 JournalEntryLines |
| Validation | amount > 0, amount <= amount_due |
| Atomicity | SINGLE TRANSACTION |
| Failure Behavior | ROLLBACK all changes |
| Idempotency | Idempotent (check payment status) |
| Concurrency | Optimistic locking (amount_due check) |

**Journal Entry Lines:**
```
Line 1: DEBIT  Creditors account    partner=vendor    amount=payment.amount
Line 2: CREDIT Bank/Cash account    partner=NULL      amount=payment.amount
```

**Side Effects:**
- bill.amount_due -= payment.amount
- IF bill.amount_due = 0 THEN bill.status = 'paid'

---

### 2.5 Manual Journal Entry

| Property | Value |
|----------|-------|
| Trigger | `POST /api/v1/journal-entries` |
| Preconditions | Lines not empty, SUM(debit) = SUM(credit) |
| Journal | Any (user-selected) |
| Debit Account | User-selected |
| Credit Account | User-selected |
| Partner | Optional per line |
| Date | accounting_date |
| Amount | SUM of debits (= SUM of credits) |
| Reference | entry_number (auto-generated) |
| Source Document | None (manual) |
| Resulting Records | 1 JournalEntry + N JournalEntryLines |
| Validation | SUM(debit) = SUM(credit), each line has debit > 0 OR credit > 0 |
| Atomicity | SINGLE TRANSACTION |
| Failure Behavior | ROLLBACK all changes |
| Idempotency | Not idempotent (each submission creates new entry) |
| Concurrency | No special handling needed |

---

## 3. Report Formulas

### 3.1 Profit & Loss Report

```
Income = SUM(journal_entry_lines.credit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type = 'income'
    AND je.accounting_date BETWEEN :year_start AND :year_end

Expenses = SUM(journal_entry_lines.debit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type IN ('expense')
    AND je.accounting_date BETWEEN :year_start AND :year_end

Net_Income = Income - Expenses
```

### 3.2 Balance Sheet

```
Assets = SUM(debit - credit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type IN ('asset', 'bank', 'cash')
    AND je.accounting_date <= :year_end

Liabilities = SUM(credit - debit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type IN ('liability', 'capital', 'income')
    AND je.accounting_date <= :year_end

INVARIANT: Assets = Liabilities
```

### 3.3 Budget Report

```
For each budget:
  IF budget.type = 'income':
    achieved = SUM(cil.total)
      FROM customer_invoice_lines cil
      JOIN customer_invoices ci ON ci.id = cil.invoice_id
      WHERE cil.budget_analytic_id = budget.analytical_id
        AND ci.status IN ('confirmed', 'paid')
        AND ci.invoice_date BETWEEN budget.start_date AND budget.end_date

  IF budget.type = 'expense':
    achieved = SUM(vbl.total)
      FROM vendor_bill_lines vbl
      JOIN vendor_bills vb ON vb.id = vbl.vendor_bill_id
      WHERE vbl.budget_analytic_id = budget.analytical_id
        AND vb.status IN ('confirmed', 'paid')
        AND vb.bill_date BETWEEN budget.start_date AND budget.end_date

  achieved_percentage = (achieved / budget.committed_amount) * 100
  amount_to_achieve = budget.committed_amount - achieved
```

---

## 4. Balance Verification

### 4.1 Application-Level Check

```typescript
function verifyJournalBalance(lines: JournalEntryLine[]): void {
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  
  if (totalDebit !== totalCredit) {
    throw new AppError('UNBALANCED_JOURNAL', 
      `Debit total ${totalDebit} does not equal credit total ${totalCredit}`);
  }
  
  for (const line of lines) {
    if (line.debit < 0 || line.credit < 0) {
      throw new AppError('NEGATIVE_AMOUNT', 
        'Debit and credit amounts must be non-negative');
    }
    if (line.debit === 0 && line.credit === 0) {
      throw new AppError('ZERO_AMOUNT', 
        'At least one of debit or credit must be positive');
    }
  }
}
```

### 4.2 Database-Level Check

```sql
-- Constraint on journal_entry_lines
CHECK (debit >= 0)
CHECK (credit >= 0)
CHECK (debit > 0 OR credit > 0)
```

---

*Document generated from accounting rules analysis on 2026-09-05*
