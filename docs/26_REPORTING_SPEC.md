# 26 — Reporting Spec

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Profit & Loss Report

### 1.1 Input Filters

| Filter | Type | Required | Default |
|--------|------|----------|---------|
| year | number | Yes | Current year |

### 1.2 Period Logic

```
period_start = {year}-01-01
period_end = {year}-12-31
```

### 1.3 Account Classification

| Section | Account Types |
|---------|---------------|
| Income | income |
| Expenses | expense |

### 1.4 Aggregation

```
Income = SUM(journal_entry_lines.credit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type = 'income'
    AND je.accounting_date BETWEEN period_start AND period_end

Expenses = SUM(journal_entry_lines.debit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type = 'expense'
    AND je.accounting_date BETWEEN period_start AND period_end

Net_Income = Income - Expenses
```

### 1.5 Response Format

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

### 1.6 Empty Behavior

- If no transactions: return empty items arrays with totals = 0
- Never return null for items

### 1.7 PDF/Print Behavior

- Generate PDF from same data
- Include year in header
- Include date generated

---

## 2. Balance Sheet

### 2.1 Input Filters

| Filter | Type | Required | Default |
|--------|------|----------|---------|
| year | number | Yes | Current year |

### 2.2 Period Logic

```
period_end = {year}-12-31
```

### 2.3 Account Classification

| Section | Account Types |
|---------|---------------|
| Assets | asset, bank, cash |
| Liabilities | liability, capital, income |

### 2.4 Aggregation

```
Assets = SUM(debit - credit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type IN ('asset', 'bank', 'cash')
    AND je.accounting_date <= period_end

Liabilities = SUM(credit - debit)
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.account_type IN ('liability', 'capital', 'income')
    AND je.accounting_date <= period_end
```

### 2.5 Balance Check

```
balance_check = (ABS(Assets - Liabilities) < 0.01)
```

### 2.6 Response Format

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

### 2.7 INVARIANT

**Total Assets MUST equal Total Liabilities.**

If not balanced, `balance_check` = false. This indicates an accounting error that must be investigated.

---

## 3. Budget Report

### 3.1 Input Filters

| Filter | Type | Required | Default |
|--------|------|----------|---------|
| year | number | Yes | Current year |
| type | string | No | All |

### 3.2 Period Logic

```
For each budget:
  period_start = budget.start_date
  period_end = budget.end_date
```

### 3.3 Achievement Calculation

```
IF budget.type = 'income':
  achieved_amount = SUM(cil.total)
    FROM customer_invoice_lines cil
    JOIN customer_invoices ci ON ci.id = cil.invoice_id
    WHERE cil.budget_analytic_id = budget.analytical_id
      AND ci.status IN ('confirmed', 'paid')
      AND ci.invoice_date BETWEEN budget.start_date AND budget.end_date

IF budget.type = 'expense':
  achieved_amount = SUM(vbl.total)
    FROM vendor_bill_lines vbl
    JOIN vendor_bills vb ON vb.id = vbl.vendor_bill_id
    WHERE vbl.budget_analytic_id = budget.analytical_id
      AND vb.status IN ('confirmed', 'paid')
      AND vb.bill_date BETWEEN budget.start_date AND budget.end_date
```

### 3.4 Metrics

```
achieved_percentage = (achieved_amount / budget.committed_amount) * 100
amount_to_achieve = budget.committed_amount - achieved_amount
```

### 3.5 Response Format

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

### 3.6 Empty Behavior

- If no budgets match filters: return empty budgets array
- If committed_amount is null: return null for computed fields

---

## 4. Report Dependencies

| Report | Depends On |
|--------|------------|
| P&L | journal_entries, journal_entry_lines, chart_of_accounts |
| Balance Sheet | journal_entries, journal_entry_lines, chart_of_accounts |
| Budget Report | budgets, customer_invoices, customer_invoice_lines, vendor_bills, vendor_bill_lines |

---

*Document generated from reporting spec analysis on 2026-09-05*
