# 15 — Accounting Data Model

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Relationship Map

### 1.1 Contact Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| SalesOrder | customer_id | 1:N | NO | NO | RESTRICT |
| PurchaseOrder | vendor_id | 1:N | NO | NO | RESTRICT |
| CustomerInvoice | customer_id | 1:N | NO | NO | RESTRICT |
| CustomerInvoice | partner_id | 1:N | NO | YES (on draft) | RESTRICT |
| VendorBill | vendor_id | 1:N | NO | NO | RESTRICT |
| VendorBill | partner_id | 1:N | NO | YES (on draft) | RESTRICT |
| JournalEntryLine | partner_id | 1:N | YES | NO | RESTRICT |
| AnalyticalAccount | responsible_id | 1:N | NO | YES | RESTRICT |
| Budget | responsible_id | 1:N | NO | YES | RESTRICT |

### 1.2 Product Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| SalesOrderLine | product_id | 1:N | NO | YES (on draft) | RESTRICT |
| CustomerInvoiceLine | product_id | 1:N | NO | NO | RESTRICT |
| PurchaseOrderLine | product_id | 1:N | NO | YES (on draft) | RESTRICT |
| VendorBillLine | product_id | 1:N | NO | NO | RESTRICT |

### 1.3 AnalyticalAccount Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| Budget | analytical_id | 1:N | NO | YES (on draft) | RESTRICT |
| SalesOrderLine | budget_analytic_id | 1:N | YES | YES (on draft) | SET NULL |
| CustomerInvoiceLine | budget_analytic_id | 1:N | YES | NO | SET NULL |
| PurchaseOrderLine | budget_analytic_id | 1:N | YES | YES (on draft) | SET NULL |
| VendorBillLine | budget_analytic_id | 1:N | YES | NO | SET NULL |

### 1.4 ChartOfAccount Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| Journal | default_account_id | 1:N | NO | NO | RESTRICT |
| JournalEntryLine | account_id | 1:N | NO | NO | RESTRICT |
| SalesOrderLine | chart_of_account_id | 1:N | NO | YES (on draft) | RESTRICT |
| CustomerInvoiceLine | chart_of_account_id | 1:N | NO | NO | RESTRICT |
| PurchaseOrderLine | chart_of_account_id | 1:N | NO | YES (on draft) | RESTRICT |
| VendorBillLine | chart_of_account_id | 1:N | NO | NO | RESTRICT |

### 1.5 Journal Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| JournalEntry | journal_id | 1:N | NO | NO | RESTRICT |

### 1.6 JournalEntry Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| JournalEntryLine | journal_entry_id | 1:N | NO | NO | CASCADE |
| CustomerInvoice | journal_entry_id | 1:1 | YES | NO | RESTRICT |
| VendorBill | journal_entry_id | 1:1 | YES | NO | RESTRICT |
| Payment | journal_entry_id | 1:1 | YES | NO | RESTRICT |

### 1.7 SalesOrder Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| SalesOrderLine | sales_order_id | 1:N | NO | NO | CASCADE |
| CustomerInvoice | sales_order_id | 1:1 | YES | NO | RESTRICT |

### 1.8 CustomerInvoice Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| CustomerInvoiceLine | invoice_id | 1:N | NO | NO | CASCADE |
| Payment | invoice_id | 1:N | YES | NO | RESTRICT |

### 1.9 PurchaseOrder Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| PurchaseOrderLine | purchase_order_id | 1:N | NO | NO | CASCADE |
| VendorBill | purchase_order_id | 1:1 | YES | NO | RESTRICT |

### 1.10 VendorBill Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| VendorBillLine | vendor_bill_id | 1:N | NO | NO | CASCADE |
| Payment | vendor_bill_id | 1:N | YES | NO | RESTRICT |

### 1.11 Budget Relationships

| Target Entity | Relationship | Cardinality | Nullable | Can Change | On Parent Archive |
|--------------|-------------|-------------|----------|------------|-------------------|
| Budget | original_budget_id | 1:N | YES | NO | RESTRICT |

---

## 2. Ownership Rules

| Entity | Owner | Can Be Accessed By |
|--------|-------|-------------------|
| User | System | Admin (all), Self (profile) |
| Contact | System | Admin, Accountant |
| Category | System | Admin, Accountant |
| Product | System | Admin, Accountant |
| AnalyticalAccount | System | Admin, Accountant |
| Budget | Responsible (Contact) | Admin, Accountant |
| ChartOfAccount | System | Admin, Accountant |
| Journal | System | Admin, Accountant |
| JournalEntry | System | Admin, Accountant |
| JournalEntryLine | Parent JournalEntry | Admin, Accountant |
| SalesOrder | System | Admin, Accountant |
| SalesOrderLine | Parent SalesOrder | Admin, Accountant |
| CustomerInvoice | Created By (User) | Admin, Accountant, User (own only) |
| CustomerInvoiceLine | Parent Invoice | Admin, Accountant, User (own only) |
| PurchaseOrder | System | Admin, Accountant |
| PurchaseOrderLine | Parent PO | Admin, Accountant |
| VendorBill | Created By (User) | Admin, Accountant |
| VendorBillLine | Parent Bill | Admin, Accountant |
| Payment | Created By (User) | Admin, Accountant, User (own invoice payments) |

---

## 3. Financial Data Integrity

### 3.1 Invoice Total Computation

```
customer_invoices.total = SUM(customer_invoice_lines.total)
WHERE customer_invoice_lines.invoice_id = customer_invoices.id
```

### 3.2 Invoice Amount Due Computation

```
customer_invoices.amount_due = customer_invoices.total - SUM(payments.amount)
WHERE payments.invoice_id = customer_invoices.id
AND payments.status = 'successful'
```

### 3.3 Bill Total Computation

```
vendor_bills.total = SUM(vendor_bill_lines.total)
WHERE vendor_bill_lines.vendor_bill_id = vendor_bills.id
```

### 3.4 Bill Amount Due Computation

```
vendor_bills.amount_due = vendor_bills.total - SUM(payments.amount)
WHERE payments.vendor_bill_id = vendor_bills.id
AND payments.status = 'successful'
```

### 3.5 Sales Order Total Computation

```
sales_orders.total = SUM(sales_order_lines.total)
WHERE sales_order_lines.sales_order_id = sales_orders.id
```

### 3.6 Purchase Order Total Computation

```
purchase_orders.total = SUM(purchase_order_lines.total)
WHERE purchase_order_lines.purchase_order_id = purchase_orders.id
```

---

## 4. Accounting Entry Sources

| Source Document | Source Type | Journal | Debit Account | Credit Account | Partner |
|----------------|-------------|---------|---------------|----------------|---------|
| Customer Invoice (confirm) | invoice | Sales | Debtors (Asset) | Sales Income (Income) | Customer |
| Vendor Bill (confirm) | bill | Purchase | Purchase Expense (Expense) | Creditors (Liability) | Vendor |
| Invoice Payment | payment | Bank/Cash | Bank/Cash (Asset) | Debtors (Asset) | Customer |
| Bill Payment | payment | Bank/Cash | Creditors (Liability) | Bank/Cash (Asset) | Vendor |
| Manual Journal Entry | manual | Any | Any | Any | Optional |

---

## 5. Budget Achievement Calculation

### 5.1 Income Budget Achievement

```sql
SELECT SUM(cil.total) as achieved_amount
FROM customer_invoice_lines cil
JOIN customer_invoices ci ON ci.id = cil.invoice_id
WHERE cil.budget_analytic_id = :budget_analytical_id
  AND ci.status IN ('confirmed', 'paid')
  AND ci.invoice_date BETWEEN :budget_start_date AND :budget_end_date
```

### 5.2 Expense Budget Achievement

```sql
SELECT SUM(vbl.total) as achieved_amount
FROM vendor_bill_lines vbl
JOIN vendor_bills vb ON vb.id = vbl.vendor_bill_id
WHERE vbl.budget_analytic_id = :budget_analytical_id
  AND vb.status IN ('confirmed', 'paid')
  AND vb.bill_date BETWEEN :budget_start_date AND :budget_end_date
```

### 5.3 Budget Metrics

```
achieved_amount = (computed from above)
achieved_percentage = (achieved_amount / committed_amount) * 100
amount_to_achieve = committed_amount - achieved_amount
```

---

*Document generated from accounting data model analysis on 2026-09-05*
