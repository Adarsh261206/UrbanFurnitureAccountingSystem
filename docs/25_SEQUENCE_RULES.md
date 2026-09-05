# 25 — Sequence Rules

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Sequence Registry

### 1.1 Sales Order Number (SO No.)

| Property | Value |
|----------|-------|
| Entity | sales_orders |
| Field | so_number |
| Format | S{NNNNN} |
| Example | S00001, S00002, ... S99999 |
| Prefix | S |
| Padding | 5 digits |
| Generation Timing | On SO creation |
| Uniqueness | UNIQUE constraint |
| Database Mechanism | PostgreSQL sequence: so_number_seq |
| Transaction Behavior | Generated within same transaction as record creation |
| Frontend Control | None (server-generated) |

---

### 1.2 Invoice Reference

| Property | Value |
|----------|-------|
| Entity | customer_invoices |
| Field | invoice_reference |
| Format | INV/{YYYY}/{NNNN} |
| Example | INV/2026/0001, INV/2026/0002, ... |
| Prefix | INV |
| Year | Current year |
| Padding | 4 digits |
| Generation Timing | On invoice creation |
| Uniqueness | UNIQUE constraint |
| Database Mechanism | PostgreSQL sequence: invoice_reference_seq (per year) |
| Transaction Behavior | Generated within same transaction |
| Frontend Control | None (server-generated) |

---

### 1.3 Invoice Number

| Property | Value |
|----------|-------|
| Entity | customer_invoices |
| Field | invoice_number |
| Format | INV-{NNNNN} |
| Example | INV-00001, INV-00002, ... |
| Generation Timing | On invoice creation |
| Uniqueness | UNIQUE constraint |
| Database Mechanism | PostgreSQL sequence: invoice_number_seq |
| Transaction Behavior | Generated within same transaction |
| Frontend Control | None (server-generated) |

---

### 1.4 Purchase Order Number (PO No.)

| Property | Value |
|----------|-------|
| Entity | purchase_orders |
| Field | po_number |
| Format | P{NNNNN} |
| Example | P00001, P00002, ... |
| Prefix | P |
| Padding | 5 digits |
| Generation Timing | On PO creation |
| Uniqueness | UNIQUE constraint |
| Database Mechanism | PostgreSQL sequence: po_number_seq |
| Transaction Behavior | Generated within same transaction |
| Frontend Control | None (server-generated) |

---

### 1.5 Bill Reference

| Property | Value |
|----------|-------|
| Entity | vendor_bills |
| Field | bill_reference |
| Format | Bill/{YYYY}/{NNNN} |
| Example | Bill/2026/0001, Bill/2026/0002, ... |
| Prefix | Bill |
| Year | Current year |
| Padding | 4 digits |
| Generation Timing | On bill creation |
| Uniqueness | UNIQUE constraint |
| Database Mechanism | PostgreSQL sequence: bill_reference_seq (per year) |
| Transaction Behavior | Generated within same transaction |
| Frontend Control | None (server-generated) |

---

### 1.6 Journal Entry Number

| Property | Value |
|----------|-------|
| Entity | journal_entries |
| Field | entry_number |
| Format | JE/{YYYY}/{NNNN} |
| Example | JE/2026/0001, JE/2026/0002, ... |
| Prefix | JE |
| Year | Current year |
| Padding | 4 digits |
| Generation Timing | On JE creation |
| Uniqueness | UNIQUE constraint |
| Database Mechanism | PostgreSQL sequence: je_entry_number_seq (per year) |
| Transaction Behavior | Generated within same transaction |
| Frontend Control | None (server-generated) |

---

### 1.7 Payment Number

| Property | Value |
|----------|-------|
| Entity | payments |
| Field | payment_number |
| Format | PAY/{YYYY}/{NNNN} |
| Example | PAY/2026/0001, PAY/2026/0002, ... |
| Prefix | PAY |
| Year | Current year |
| Padding | 4 digits |
| Generation Timing | On payment creation |
| Uniqueness | UNIQUE constraint |
| Database Mechanism | PostgreSQL sequence: payment_number_seq (per year) |
| Transaction Behavior | Generated within same transaction |
| Frontend Control | None (server-generated) |

---

## 2. Sequence Strategy

### 2.1 PostgreSQL Sequences

```sql
-- Create sequences
CREATE SEQUENCE so_number_seq START 1;
CREATE SEQUENCE po_number_seq START 1;
CREATE SEQUENCE invoice_number_seq START 1;
CREATE SEQUENCE invoice_reference_seq START 1;
CREATE SEQUENCE po_number_seq START 1;
CREATE SEQUENCE bill_reference_seq START 1;
CREATE SEQUENCE je_entry_number_seq START 1;
CREATE SEQUENCE payment_number_seq START 1;
```

### 2.2 Generation Code

```typescript
async function generateSONumber(): Promise<string> {
  const result = await prisma.$queryRaw`
    SELECT nextval('so_number_seq') as next
  `;
  const nextNum = result[0].next;
  return `S${String(nextNum).padStart(5, '0')}`;
}

async function generateInvoiceReference(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await prisma.$queryRaw`
    SELECT nextval('invoice_reference_seq') as next
  `;
  const nextNum = result[0].next;
  return `INV/${year}/${String(nextNum).padStart(4, '0')}`;
}
```

---

## 3. Concurrency Handling

- PostgreSQL sequences are atomic and thread-safe
- No additional locking needed
- Sequence values are unique even under concurrent access
- Failed transactions do NOT consume sequence values (PostgreSQL behavior)

---

## 4. Year Reset

- Yearly sequences (INV, Bill, JE, PAY) reset automatically when year changes
- Non-yearly sequences (S, P) are continuous across years

---

*Document generated from sequence rules analysis on 2026-09-05*
