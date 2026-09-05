# 06 — Frontend Specification

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Excalidraw Annotations + Frozen Decisions  
> **Date:** 2026-09-05

---

## 1. Route Table

| Route | Access | Layout | Page |
|-------|--------|--------|------|
| /login | Public | AuthLayout | Login Page |
| /signup | Public | AuthLayout | Sign Up Page |
| /forgot-password | Public | AuthLayout | Forgot Password |
| /dashboard | Authenticated | AppLayout | Dashboard |
| /contacts | Admin, Accountant | AppLayout | Contact List |
| /contacts/new | Admin, Accountant | AppLayout | Contact Form (new) |
| /contacts/:id | Admin, Accountant | AppLayout | Contact Form (edit) |
| /products | Admin, Accountant | AppLayout | Product List |
| /products/new | Admin, Accountant | AppLayout | Product Form (new) |
| /products/:id | Admin, Accountant | AppLayout | Product Form (edit) |
| /analyticals/new | Admin, Accountant | AppLayout | Analytical Form |
| /analyticals/:id | Admin, Accountant | AppLayout | Analytical Form |
| /chart-of-accounts | Admin, Accountant | AppLayout | Chart of Accounts List |
| /chart-of-accounts/new | Admin, Accountant | AppLayout | COA Form |
| /journals | Admin, Accountant | AppLayout | Journals List |
| /journal-entries | Admin, Accountant | AppLayout | JE List |
| /journal-entries/new | Admin, Accountant | AppLayout | JE Form |
| /sales-orders | Admin, Accountant | AppLayout | SO List |
| /sales-orders/new | Admin, Accountant | AppLayout | SO Form |
| /invoices | Admin, Accountant | AppLayout | Invoice List |
| /invoices/new | Admin, Accountant | AppLayout | Invoice Form |
| /invoices/:id | Admin, Accountant, User (own) | AppLayout | Invoice Detail |
| /invoices/:id/pay | Admin, Accountant, User (own) | AppLayout | Invoice Payment |
| /purchase-orders | Admin, Accountant | AppLayout | PO List |
| /purchase-orders/new | Admin, Accountant | AppLayout | PO Form |
| /bills | Admin, Accountant | AppLayout | Bill List |
| /bills/new | Admin, Accountant | AppLayout | Bill Form |
| /bills/:id | Admin, Accountant, User (own) | AppLayout | Bill Detail |
| /bills/:id/pay | Admin, Accountant, User (own) | AppLayout | Bill Payment |
| /reports/profit-and-loss | Admin, Accountant | AppLayout | P&L Report |
| /reports/balance-sheet | Admin, Accountant | AppLayout | Balance Sheet |
| /reports/budget-report | Admin, Accountant | AppLayout | Budget Report |

## 2. Layout Specifications

### 2.1 Auth Layout

- Full-screen centered card
- App logo/name
- Form fields
- Submit button
- Navigation links

### 2.2 App Layout

- Left sidebar navigation (collapsible)
- Top bar with user info + Sign Out
- Main content area
- Responsive (stacked on mobile)

## 3. Component Specifications

### 3.1 Login Page (S02)

```
┌─────────────────────────────────────────┐
│                                         │
│         ┌─────────────────────┐         │
│         │     App Logo        │         │
│         │                     │         │
│         │  Login Id           │         │
│         │  [________]         │         │
│         │                     │         │
│         │  Password           │         │
│         │  [________]         │         │
│         │                     │         │
│         │  [ SIGN IN ]        │         │
│         │                     │         │
│         │  Forgot Password    │         │
│         │  Sign Up            │         │
│         └─────────────────────┘         │
│                                         │
└─────────────────────────────────────────┘
```

**Controls:**
- Login ID input (6-12 chars)
- Password input (masked)
- SIGN IN button
- Forgot Password link
- Sign Up link

### 3.2 Dashboard (S05)

```
┌─────────────────────────────────────────┐
│  Account  Sales  Purchase  Report       │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────┐ ┌───────────┐ ┌────────┐│
│  │  Sales    │ │ Purchase  │ │ Budget ││
│  │           │ │           │ │        ││
│  │  Draft: 5 │ │ Draft: 3  │ │ D: 2   ││
│  │  Conf: 10 │ │ Conf: 7   │ │ C: 5   ││
│  │  All: 15  │ │ All: 10   │ │ A: 7   ││
│  └───────────┘ └───────────┘ └────────┘│
│                                         │
└─────────────────────────────────────────┘
```

**Controls:**
- Module tabs (Account, Sales, Purchase, Report)
- Sub-menu items
- Kanban cards with counts

### 3.3 Contact Form (S08)

```
┌─────────────────────────────────────────┐
│  [Back]  Contacts  [New]                │
├─────────────────────────────────────────┤
│                                         │
│  Name *                                 │
│  [________________]                     │
│                                         │
│  Email *                                │
│  [________________]                     │
│                                         │
│  Phone                                  │
│  [________________]                     │
│                                         │
│  Image                                  │
│  [Choose File] No file chosen           │
│                                         │
│  Street                                 │
│  [________________]                     │
│                                         │
│  City          State                    │
│  [________]    [________]               │
│                                         │
│  Country       Pincode                  │
│  [________]    [________]               │
│                                         │
│  [Confirm]                              │
│                                         │
└─────────────────────────────────────────┘
```

### 3.4 Invoice Form (S24)

```
┌─────────────────────────────────────────┐
│  [Back]  Invoices  [New]                │
├─────────────────────────────────────────┤
│                                         │
│  Customer *                             │
│  [Select Customer ▼]                    │
│                                         │
│  Invoice Date *    Due Date *           │
│  [________]        [________]           │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Product │ Qty │ Price │ Total │ Del ││
│  ├─────────┼─────┼───────┼───────┼─────┤│
│  │ [___▼]  │ [__]│ [__]  │ [__]  │ [x] ││
│  └─────────────────────────────────────┘│
│  [+ Add Line]                           │
│                                         │
│  Total: 10,000.00                       │
│  Amount Due: 10,000.00                  │
│                                         │
│  [Confirm] [Cancel] [Pay] [Print] [Send]│
│                                         │
└─────────────────────────────────────────┘
```

### 3.5 Invoice Payment (S25)

```
┌─────────────────────────────────────────┐
│  Invoice Payment                        │
├─────────────────────────────────────────┤
│                                         │
│  Total: 10,000.00                       │
│  Amount Due: 10,000.00                  │
│                                         │
│  Paid via *                             │
│  [Bank ▼]                               │
│                                         │
│  Amount *                               │
│  [________]                             │
│                                         │
│  [Pay]  [Back]                          │
│                                         │
└─────────────────────────────────────────┘
```

## 4. State Management

### 4.1 Auth State

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}
```

### 4.2 UI State

```typescript
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentModule: string;
  setCurrentModule: (module: string) => void;
}
```

## 5. API Integration

### 5.1 Client Configuration

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});
```

### 5.2 Error Handling

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 6. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Desktop | > 1024px | Full layout |
| Tablet | 768-1024px | Adjusted layout |
| Mobile | < 768px | Stacked layout |

---

*Document generated from Excalidraw annotations + frozen decisions on 2026-09-05*
