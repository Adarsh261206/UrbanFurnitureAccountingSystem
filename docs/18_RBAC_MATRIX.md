# 18 — RBAC Matrix

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Role Definitions

| Role ID | Display Name | Description | Source |
|---------|-------------|-------------|--------|
| admin | Administrator | Full system access | SOURCE_REQUIRED |
| accountant | Accountant | Master data, transactions, reports | SOURCE_REQUIRED |
| user | User (Invoicing) | Portal access, own invoices/bills, pay dues | SOURCE_REQUIRED |

---

## 2. Feature Permission Matrix

### 2.1 Authentication

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| Login | ✓ | ✓ | ✓ |
| Sign Up | ✓ | ✓ | ✓ |
| Forgot Password | ✓ | ✓ | ✓ |

### 2.2 User Management

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Users | ✓ (all) | ✗ | ✗ |
| Create Users | ✓ | ✗ | ✗ |
| Update Users | ✓ | ✗ | ✗ |
| Delete Users | ✗ | ✗ | ✗ |

### 2.3 Contact Management

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Contact List | ✓ | ✓ | ✗ |
| View Contact Details | ✓ | ✓ | ✗ |
| Create Contact | ✓ | ✓ | ✗ |
| Update Contact | ✓ | ✓ | ✗ |
| Delete Contact | ✗ | ✗ | ✗ |

### 2.4 Product Management

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Product List | ✓ | ✓ | ✗ |
| View Product Details | ✓ | ✓ | ✗ |
| Create Product | ✓ | ✓ | ✗ |
| Update Product | ✓ | ✓ | ✗ |
| Delete Product | ✗ | ✗ | ✗ |

### 2.5 Analytical Accounts

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Analyticals | ✓ | ✓ | ✗ |
| Create Analytical | ✓ | ✓ | ✗ |
| Update Analytical | ✓ | ✓ | ✗ |
| Delete Analytical | ✗ | ✗ | ✗ |

### 2.6 Budget Management

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Budget List | ✓ | ✓ | ✗ |
| View Budget Details | ✓ | ✓ | ✗ |
| Create Budget | ✓ | ✓ | ✗ |
| Update Budget (draft) | ✓ | ✓ | ✗ |
| Confirm Budget | ✓ | ✓ | ✗ |
| Revise Budget | ✓ | ✓ | ✗ |
| Cancel Budget | ✓ | ✓ | ✗ |

### 2.7 Chart of Accounts

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Chart of Accounts | ✓ | ✓ | ✗ |
| Create Account | ✓ | ✓ | ✗ |
| Update Account | ✓ | ✓ | ✗ |
| Delete Account | ✗ | ✗ | ✗ |

### 2.8 Journals

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Journals | ✓ | ✓ | ✗ |

### 2.9 Journal Entries

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Journal Entries | ✓ | ✓ | ✗ |
| View Journal Entry Details | ✓ | ✓ | ✗ |
| Create Manual Journal Entry | ✓ | ✓ | ✗ |

### 2.10 Sales Orders

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Sales Orders | ✓ | ✓ | ✗ |
| Create Sales Order | ✓ | ✓ | ✗ |
| Update Sales Order (draft) | ✓ | ✓ | ✗ |
| Confirm Sales Order | ✓ | ✓ | ✗ |

### 2.11 Customer Invoices

| Feature | Admin | Accountant | User (own) |
|---------|:-----:|:----------:|:----------:|
| View Invoice List | ✓ (all) | ✓ (all) | ✓ (own) |
| View Invoice Details | ✓ | ✓ | ✓ (own) |
| Create Invoice | ✓ | ✓ | ✗ |
| Update Invoice (draft) | ✓ | ✓ | ✗ |
| Confirm Invoice | ✓ | ✓ | ✗ |
| Cancel Invoice (draft) | ✓ | ✓ | ✗ |
| Pay Invoice | ✓ | ✓ | ✓ (own) |
| Print Invoice | ✓ | ✓ | ✓ (own) |
| Send Invoice | ✓ | ✓ | ✓ (own) |

### 2.12 Receipts (Invoice Payments)

| Feature | Admin | Accountant | User (own) |
|---------|:-----:|:----------:|:----------:|
| View Receipt List | ✓ | ✓ | ✓ (own) |
| View Receipt Details | ✓ | ✓ | ✓ (own) |

### 2.13 Purchase Orders

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Purchase Orders | ✓ | ✓ | ✗ |
| Create Purchase Order | ✓ | ✓ | ✗ |
| Update Purchase Order (draft) | ✓ | ✓ | ✗ |
| Confirm Purchase Order | ✓ | ✓ | ✗ |

### 2.14 Vendor Bills

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Bill List | ✓ | ✓ | ✗ |
| View Bill Details | ✓ | ✓ | ✗ |
| Create Bill | ✓ | ✓ | ✗ |
| Update Bill (draft) | ✓ | ✓ | ✗ |
| Confirm Bill | ✓ | ✓ | ✗ |
| Cancel Bill (draft) | ✓ | ✓ | ✗ |
| Pay Bill | ✓ | ✓ | ✗ |
| Print Bill | ✓ | ✓ | ✗ |
| Send Bill | ✓ | ✓ | ✗ |

### 2.15 Payments (Bill Payments)

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Payment List | ✓ | ✓ | ✗ |
| View Payment Details | ✓ | ✓ | ✗ |

### 2.16 Reports

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View P&L Report | ✓ | ✓ | ✗ |
| View Balance Sheet | ✓ | ✓ | ✗ |
| View Budget Report | ✓ | ✓ | ✗ |
| Print Reports | ✓ | ✓ | ✗ |

### 2.17 Dashboard

| Feature | Admin | Accountant | User |
|---------|:-----:|:----------:|:----:|
| View Dashboard | ✓ | ✓ | ✗ |
| View Kanban Counts | ✓ | ✓ | ✗ |

---

## 3. Object-Level Authorization Rules

### 3.1 Invoice Access

| Rule | Description |
|------|-------------|
| ADMIN | Can access all invoices |
| ACCOUNTANT | Can access all invoices |
| USER | Can only access invoices where customer_id matches user's contact |

**Implementation:**
```typescript
// Backend middleware
if (user.role === 'user') {
  const userContact = await prisma.contact.findFirst({
    where: { email: user.email }
  });
  if (invoice.customer_id !== userContact.id) {
    throw new AppError('FORBIDDEN', 'Access denied');
  }
}
```

### 3.2 Bill Access

| Rule | Description |
|------|-------------|
| ADMIN | Can access all bills |
| ACCOUNTANT | Can access all bills |
| USER | Cannot access bills (portal limitation) |

### 3.3 Payment Access

| Rule | Description |
|------|-------------|
| ADMIN | Can access all payments |
| ACCOUNTANT | Can access all payments |
| USER | Can only access payments linked to their invoices |

### 3.4 Budget Access

| Rule | Description |
|------|-------------|
| ADMIN | Can access all budgets |
| ACCOUNTANT | Can access all budgets |
| USER | Cannot access budgets |

---

## 4. Authorization Enforcement Layers

| Layer | Purpose | Implementation |
|-------|---------|----------------|
| UI Visibility | Hide buttons/links user cannot use | Frontend role check |
| API Authorization | Reject unauthorized API calls | Middleware role check |
| Object Authorization | Verify record ownership | Service layer ownership check |
| Database | Prevent data corruption | Constraints, foreign keys |

**CRITICAL:** UI hiding is NOT sufficient. Backend must enforce all authorization.

---

## 5. Dashboard Visibility by Role

| Role | Dashboard Access | Tabs Visible |
|------|-----------------|--------------|
| Admin | Full dashboard | Account, Sales, Purchase, Report |
| Accountant | Full dashboard | Account, Sales, Purchase, Report |
| User | No dashboard | Portal only (own invoices/bills) |

---

*Document generated from RBAC analysis on 2026-09-05*
