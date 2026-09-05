# 31 — Performance and Concurrency

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Performance Expectations

| Operation | Expected Response Time | Notes |
|-----------|----------------------|-------|
| Login | < 500ms | bcrypt verification |
| List (20 items) | < 300ms | With proper indexing |
| Detail view | < 200ms | Single record + relations |
| Create record | < 300ms | Single INSERT |
| Update record | < 300ms | Single UPDATE |
| Confirm invoice | < 1s | Transaction with JE creation |
| Confirm bill | < 1s | Transaction with JE creation |
| Process payment | < 1s | Transaction with JE creation |
| P&L Report | < 2s | Aggregation query |
| Balance Sheet | < 2s | Aggregation query |
| Budget Report | < 2s | Aggregation query |

---

## 2. Indexing Strategy

### 2.1 Required Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | idx_users_login_id | login_id | Login lookup |
| users | idx_users_email | email | Email lookup |
| contacts | idx_contacts_email | email | Email uniqueness |
| products | idx_products_category | category_id | Category filter |
| budgets | idx_budgets_type | type | Type filter |
| budgets | idx_budgets_status | status | Status filter |
| budgets | idx_budgets_analytical | analytical_id | Analytical lookup |
| chart_of_accounts | idx_coa_type | account_type | Type filter |
| journal_entries | idx_je_date | accounting_date | Date range |
| journal_entries | idx_je_journal | journal_id | Journal filter |
| journal_entries | idx_je_status | status | Status filter |
| journal_entry_lines | idx_jel_je | journal_entry_id | Entry lookup |
| journal_entry_lines | idx_jel_account | account_id | Account filter |
| sales_orders | idx_so_customer | customer_id | Customer filter |
| customer_invoices | idx_inv_customer | customer_id | Customer filter |
| customer_invoices | idx_inv_status | status | Status filter |
| purchase_orders | idx_po_vendor | vendor_id | Vendor filter |
| vendor_bills | idx_bill_vendor | vendor_id | Vendor filter |
| vendor_bills | idx_bill_status | status | Status filter |
| payments | idx_pay_invoice | invoice_id | Invoice lookup |
| payments | idx_pay_bill | vendor_bill_id | Bill lookup |

---

## 3. Transaction Isolation

| Operation | Isolation Level | Rationale |
|-----------|----------------|-----------|
| Read operations | READ COMMITTED | Default, sufficient |
| Invoice confirmation | SERIALIZABLE | Prevent race conditions |
| Bill confirmation | SERIALIZABLE | Prevent race conditions |
| Payment processing | SERIALIZABLE | Prevent overpayment |
| Budget revision | SERIALIZABLE | Prevent concurrent revisions |

---

## 4. Concurrency Control

### 4.1 Race Condition Prevention

| Scenario | Strategy |
|---------|----------|
| Two users confirm same invoice | Optimistic locking (status check) |
| Two payments on same invoice | Atomic amount_due check |
| Simultaneous budget revision | Serializable transaction |
| Duplicate sequence generation | PostgreSQL sequences |

### 4.2 Optimistic Locking

```typescript
// Before confirmation
const invoice = await prisma.customerInvoice.findUnique({
  where: { id: invoiceId },
  select: { status: true }
});

if (invoice.status !== 'draft') {
  throw new AppError('ALREADY_CONFIRMED', 'Invoice already confirmed');
}

// Update with status check
await prisma.customerInvoice.update({
  where: { id: invoiceId, status: 'draft' },
  data: { status: 'confirmed' }
});
```

### 4.3 Atomic Payment Processing

```typescript
await prisma.$transaction(async (tx) => {
  // Lock the invoice row
  const invoice = await tx.$queryRaw`
    SELECT * FROM customer_invoices 
    WHERE id = ${invoiceId} 
    FOR UPDATE
  `;
  
  if (invoice.amount_due < paymentAmount) {
    throw new AppError('OVERPAYMENT_NOT_ALLOWED');
  }
  
  // Process payment...
});
```

---

## 5. Pagination Strategy

| Parameter | Default | Maximum | Implementation |
|-----------|---------|---------|----------------|
| page | 1 | — | OFFSET/LIMIT |
| limit | 20 | 100 | Server-side |

---

## 6. Report Aggregation

### 6.1 P&L Report

- Aggregates from journal_entry_lines
- Filtered by account_type and date range
- No caching (hackathon scope)
- Production: Cache with invalidation on JE changes

### 6.2 Balance Sheet

- Aggregates from journal_entry_lines
- Filtered by account_type
- Computed as of date
- No caching (hackathon scope)

### 6.3 Budget Report

- Aggregates from invoice/bill lines
- Filtered by analytical account and date range
- Computed per budget
- No caching (hackathon scope)

---

## 7. Large Dataset Considerations

| Scenario | Strategy |
|---------|----------|
| > 1000 contacts | Server-side pagination |
| > 1000 products | Server-side pagination |
| > 1000 invoices | Server-side pagination |
| > 1000 journal entries | Server-side pagination |
| Year-long P&L | Aggregation query (may be slow for large datasets) |

---

## 8. Hackathon Optimizations

| Optimization | Rationale |
|-------------|-----------|
| No report caching | Simplest implementation |
| No connection pooling | Single-user demo |
| No query optimization | Sufficient for demo data |
| No CDN | Local development |

---

*Document generated from performance analysis on 2026-09-05*
