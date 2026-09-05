# FINAL_ROLE_MATRIX.md

> **Date:** 2026-09-05  
> **Source:** 18_RBAC_MATRIX.md (authoritative)  
> **Roles:** 3 (admin, accountant, user)

---

## Role Definitions

| Role | ID | Description | Creation |
|------|-----|-------------|----------|
| Administrator | `admin` | Full system access | Seed data only |
| Accountant | `accountant` | Master data, transactions, reports | Admin creates via POST /users |
| User (Invoicing) | `user` | Portal: own invoices, pay dues | Self-registration via POST /auth/signup |

---

## Permission Matrix

### Authentication

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| Login | ✓ | ✓ | ✓ |
| Sign Up | ✓ | ✓ | ✓ |
| Forgot Password | ✓ | ✓ | ✓ |

### User Management

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View Users | ✓ (all) | ✗ | ✗ |
| Create Users | ✓ | ✗ | ✗ |
| Update Users | ✓ | ✗ | ✗ |
| Delete Users | ✗ | ✗ | ✗ |

### Contacts

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| View Details | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |
| Update | ✓ | ✓ | ✗ |
| Delete | ✗ | ✗ | ✗ |

### Products

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| View Details | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |
| Update | ✓ | ✓ | ✗ |
| Delete | ✗ | ✗ | ✗ |

### Categories

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |

### Analytical Accounts

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |
| Update | ✓ | ✓ | ✗ |

### Budgets

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| View Details | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |
| Update (draft) | ✓ | ✓ | ✗ |
| Confirm | ✓ | ✓ | ✗ |
| Revise | ✓ | ✓ | ✗ |
| Cancel | ✓ | ✓ | ✗ |

### Chart of Accounts

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |
| Update | ✓ | ✓ | ✗ |
| Delete | ✗ | ✗ | ✗ |

### Journals

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View | ✓ | ✓ | ✗ |

### Journal Entries

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| View Details | ✓ | ✓ | ✗ |
| Create Manual | ✓ | ✓ | ✗ |

### Sales Orders

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |
| View Details | ✓ | ✓ | ✗ |
| Update (draft) | ✓ | ✓ | ✗ |
| Confirm | ✓ | ✓ | ✗ |

### Customer Invoices

| Action | Admin | Accountant | User (own) |
|--------|:-----:|:----------:|:----------:|
| View List | ✓ (all) | ✓ (all) | ✓ (own) |
| View Details | ✓ | ✓ | ✓ (own) |
| Create | ✓ | ✓ | ✗ |
| Update (draft) | ✓ | ✓ | ✗ |
| Confirm | ✓ | ✓ | ✗ |
| Cancel (draft) | ✓ | ✓ | ✗ |
| Pay | ✓ | ✓ | ✓ (own) |
| Print | ✓ | ✓ | ✓ (own) |
| Send | ✓ | ✓ | ✓ (own) |

### Receipts (Invoice Payments)

| Action | Admin | Accountant | User (own) |
|--------|:-----:|:----------:|:----------:|
| View List | ✓ | ✓ | ✓ (own) |
| View Details | ✓ | ✓ | ✓ (own) |

### Purchase Orders

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |
| View Details | ✓ | ✓ | ✗ |
| Update (draft) | ✓ | ✓ | ✗ |
| Confirm | ✓ | ✓ | ✗ |

### Vendor Bills

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| View Details | ✓ | ✓ | ✗ |
| Create | ✓ | ✓ | ✗ |
| Update (draft) | ✓ | ✓ | ✗ |
| Confirm | ✓ | ✓ | ✗ |
| Cancel (draft) | ✓ | ✓ | ✗ |
| Pay | ✓ | ✓ | ✗ |
| Print | ✓ | ✓ | ✗ |
| Send | ✓ | ✓ | ✗ |

### Payments (Bill Payments)

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View List | ✓ | ✓ | ✗ |
| View Details | ✓ | ✓ | ✗ |

### Reports

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| P&L Report | ✓ | ✓ | ✗ |
| Balance Sheet | ✓ | ✓ | ✗ |
| Budget Report | ✓ | ✓ | ✗ |
| Print Reports | ✓ | ✓ | ✗ |

### Dashboard

| Action | Admin | Accountant | User |
|--------|:-----:|:----------:|:----:|
| View Dashboard | ✓ | ✓ | ✗ |
| View Kanban | ✓ | ✓ | ✗ |

---

## Object-Level Authorization

| Resource | User Access Rule |
|----------|-----------------|
| Invoice | customer_id matches user's contact (resolved by email) |
| Invoice Payment | Linked to invoice that belongs to user |
| Bill | User CANNOT access |
| Budget | User CANNOT access |

### User-Contact Resolution

```typescript
// Find the contact record matching the logged-in user's email
const userContact = await prisma.contact.findFirst({
  where: { email: req.user.email }
});
// Use userContact.id to filter invoices: invoice.customer_id === userContact.id
```

---

*RBAC verified 2026-09-05 against 18_RBAC_MATRIX.md*
