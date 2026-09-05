# 21 — API Schema Catalog

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Reusable Schemas

### 1.1 Error Response

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "field": "string | null",
    "details": "object"
  }
}
```

### 1.2 Pagination Response

```json
{
  "data": "array",
  "total": "number",
  "page": "number",
  "limit": "number",
  "total_pages": "number"
}
```

### 1.3 User Object

```json
{
  "id": "uuid",
  "name": "string",
  "login_id": "string",
  "email": "string",
  "role": "admin | accountant | user",
  "is_active": "boolean",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.4 Contact Object

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string | null",
  "image_url": "string | null",
  "street": "string | null",
  "city": "string | null",
  "state": "string | null",
  "country": "string | null",
  "pincode": "string | null",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.5 Product Object

```json
{
  "id": "uuid",
  "name": "string",
  "image_url": "string | null",
  "product_type": "goods | service | combo",
  "category": {
    "id": "uuid",
    "name": "string"
  },
  "sales_price": "number",
  "cost": "number",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.6 Category Object

```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "ISO8601"
}
```

### 1.7 AnalyticalAccount Object

```json
{
  "id": "uuid",
  "name": "string",
  "responsible": {
    "id": "uuid",
    "name": "string"
  },
  "start_date": "YYYY-MM-DD",
  "to_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "analytic_account": "string",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.8 Budget Object

```json
{
  "id": "uuid",
  "name": "string",
  "responsible": {
    "id": "uuid",
    "name": "string"
  },
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "type": "income | expense",
  "analytical": {
    "id": "uuid",
    "name": "string"
  },
  "status": "draft | confirmed | revised | cancelled",
  "committed_amount": "number | null",
  "achieved_amount": "number",
  "achieved_percentage": "number",
  "amount_to_achieve": "number",
  "original_budget_id": "uuid | null",
  "is_archived": "boolean",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.9 ChartOfAccount Object

```json
{
  "id": "uuid",
  "name": "string",
  "account_type": "asset | liability | bank | capital | cash | income | expense",
  "journal_type": "string | null",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.10 Journal Object

```json
{
  "id": "uuid",
  "name": "string",
  "journal_type": "sale | purchase | bank | cash",
  "default_account": {
    "id": "uuid",
    "name": "string"
  },
  "created_at": "ISO8601"
}
```

### 1.11 JournalEntry Object

```json
{
  "id": "uuid",
  "entry_number": "JE/2026/0001",
  "accounting_date": "YYYY-MM-DD",
  "journal": {
    "id": "uuid",
    "name": "string"
  },
  "source_document_type": "invoice | bill | manual | null",
  "source_document_id": "uuid | null",
  "status": "draft | posted",
  "total_debit": "number",
  "total_credit": "number",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.12 JournalEntryLine Object

```json
{
  "id": "uuid",
  "account": {
    "id": "uuid",
    "name": "string"
  },
  "partner": {
    "id": "uuid",
    "name": "string"
  } | null,
  "debit": "number",
  "credit": "number"
}
```

### 1.13 SalesOrder Object

```json
{
  "id": "uuid",
  "so_number": "S00001",
  "customer": {
    "id": "uuid",
    "name": "string"
  },
  "date": "YYYY-MM-DD",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "status": "draft | confirmed",
  "total": "number",
  "lines": ["SalesOrderLine"],
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.14 SalesOrderLine Object

```json
{
  "id": "uuid",
  "sr_no": "number",
  "product": {
    "id": "uuid",
    "name": "string"
  },
  "chart_of_account": {
    "id": "uuid",
    "name": "string"
  },
  "budget_analytic": {
    "id": "uuid",
    "name": "string"
  } | null,
  "qty": "number",
  "unit_price": "number",
  "total": "number"
}
```

### 1.15 CustomerInvoice Object

```json
{
  "id": "uuid",
  "invoice_reference": "INV/2026/0001",
  "invoice_number": "string",
  "sales_order_id": "uuid | null",
  "customer": {
    "id": "uuid",
    "name": "string"
  },
  "date": "YYYY-MM-DD",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "payment_type": "receive | send",
  "partner": {
    "id": "uuid",
    "name": "string"
  },
  "payment_via": "bank | cash",
  "total": "number",
  "amount_due": "number",
  "status": "draft | confirmed | paid",
  "journal_entry_id": "uuid | null",
  "lines": ["CustomerInvoiceLine"],
  "created_by": "uuid",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.16 CustomerInvoiceLine Object

```json
{
  "id": "uuid",
  "sr_no": "number",
  "product": {
    "id": "uuid",
    "name": "string"
  },
  "chart_of_account": {
    "id": "uuid",
    "name": "string"
  },
  "budget_analytic": {
    "id": "uuid",
    "name": "string"
  } | null,
  "qty": "number",
  "unit_price": "number",
  "total": "number"
}
```

### 1.17 PurchaseOrder Object

```json
{
  "id": "uuid",
  "po_number": "P00001",
  "vendor": {
    "id": "uuid",
    "name": "string"
  },
  "date": "YYYY-MM-DD",
  "bill_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "status": "draft | confirmed",
  "total": "number",
  "lines": ["PurchaseOrderLine"],
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.18 PurchaseOrderLine Object

```json
{
  "id": "uuid",
  "sr_no": "number",
  "product": {
    "id": "uuid",
    "name": "string"
  },
  "chart_of_account": {
    "id": "uuid",
    "name": "string"
  },
  "budget_analytic": {
    "id": "uuid",
    "name": "string"
  } | null,
  "qty": "number",
  "unit_price": "number",
  "total": "number"
}
```

### 1.19 VendorBill Object

```json
{
  "id": "uuid",
  "bill_reference": "Bill/2026/0001",
  "vendor_bill_no": "string | null",
  "purchase_order_id": "uuid | null",
  "vendor": {
    "id": "uuid",
    "name": "string"
  },
  "date": "YYYY-MM-DD",
  "bill_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "payment_type": "receive | send",
  "partner": {
    "id": "uuid",
    "name": "string"
  },
  "payment_via": "bank | cash",
  "total": "number",
  "amount_due": "number",
  "status": "draft | confirmed | paid",
  "journal_entry_id": "uuid | null",
  "lines": ["VendorBillLine"],
  "created_by": "uuid",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.20 VendorBillLine Object

```json
{
  "id": "uuid",
  "sr_no": "number",
  "product": {
    "id": "uuid",
    "name": "string"
  },
  "chart_of_account": {
    "id": "uuid",
    "name": "string"
  },
  "budget_analytic": {
    "id": "uuid",
    "name": "string"
  } | null,
  "qty": "number",
  "unit_price": "number",
  "total": "number"
}
```

### 1.21 Payment Object

```json
{
  "id": "uuid",
  "payment_number": "PAY/2026/0001",
  "invoice_id": "uuid | null",
  "vendor_bill_id": "uuid | null",
  "amount": "number",
  "payment_via": "bank | cash",
  "payment_date": "YYYY-MM-DD",
  "status": "draft | confirmed | successful",
  "journal_entry_id": "uuid | null",
  "created_by": "uuid",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### 1.22 Report Schemas

**P&L Report:**
```json
{
  "year": "number",
  "income": {
    "items": [
      { "account_name": "string", "amount": "number" }
    ],
    "total": "number"
  },
  "expenses": {
    "items": [
      { "account_name": "string", "amount": "number" }
    ],
    "total": "number"
  },
  "net_income": "number"
}
```

**Balance Sheet:**
```json
{
  "year": "number",
  "assets": {
    "items": [
      { "account_name": "string", "amount": "number" }
    ],
    "total": "number"
  },
  "liabilities": {
    "items": [
      { "account_name": "string", "amount": "number" }
    ],
    "total": "number"
  },
  "balance_check": "boolean"
}
```

**Budget Report:**
```json
{
  "budgets": [
    {
      "id": "uuid",
      "name": "string",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "type": "income | expense",
      "committed_amount": "number",
      "achieved_amount": "number",
      "achieved_percentage": "number",
      "amount_to_achieve": "number",
      "status": "draft | confirmed | revised | cancelled"
    }
  ]
}
```

---

*Document generated from API schema analysis on 2026-09-05*
