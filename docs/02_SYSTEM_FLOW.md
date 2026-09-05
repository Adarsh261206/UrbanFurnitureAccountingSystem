# 02 — System Flows

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Excalidraw Annotations + Frozen Decisions  
> **Date:** 2026-09-05

---

## 1. Authentication Flows

### Flow 1: User Registration (Sign Up)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Fill form   │────▶│  Submit     │
│  "Sign Up"   │     │  (Login ID,  │     │  POST /auth │
│              │     │   Email,     │     │  /signup    │
│              │     │   Password)  │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐     ┌──────▼──────┐
                    │  Redirect   │◀────│  Create     │
                    │  to Login   │     │  user with  │
                    │  page       │     │  role=user  │
                    └─────────────┘     └─────────────┘
```

**Preconditions:** User is not authenticated  
**Validation:** Login ID unique (6-12 chars), Email unique, Password complexity  
**Database:** INSERT INTO users (role = 'user')  
**Failure:** Duplicate login_id → 409; Duplicate email → 409; Weak password → 400

### Flow 2: Authentication (Login)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User enters │────▶│  POST       │────▶│  Validate   │
│  Login ID +  │     │  /auth/login│     │  credentials│
│  Password    │     │             │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                        ┌─────▼─────┐   ┌──────▼──────┐   ┌────▼────┐
                        │  Success  │   │  Invalid    │   │  Error  │
                        │  Set      │   │  credentials│   │  500    │
                        │  HttpOnly │   │  401 error  │   │         │
                        │  cookie   │   │             │   │         │
                        └─────┬─────┘   └─────────────┘   └─────────┘
                              │
                        ┌─────▼─────┐
                        │  Return   │
                        │  user     │
                        │  object   │
                        │  (no JWT  │
                        │  in body) │
                        └───────────┘
```

**Frozen Decisions:**
- JWT NEVER returned in response body
- HttpOnly cookie ONLY (name=auth_token)
- Cookie: HttpOnly=true, Secure=true, SameSite=Strict, Path=/api, Max-Age=86400
- Login failure: "Invalid Login Id or Password" (generic)

### Flow 3: Session Check

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Request     │────▶│  Check      │────▶│  Valid JWT? │
│  GET /auth   │     │  cookie     │     │             │
│  /me         │     │             │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                        ┌─────▼─────┐   ┌──────▼──────┐
                        │  Valid    │   │  Invalid    │
                        │  Return   │   │  401 error  │
                        │  user     │   │             │
                        └───────────┘   └─────────────┘
```

### Flow 4: Logout

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  POST       │────▶│  Clear      │
│  "Sign Out"  │     │  /auth/logout│    │  cookie     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌─────────────┐
                        │  Redirect   │
                        │  to Login   │
                        │  page       │
                        └─────────────┘
```

**Cookie Behavior:** Set cookie with Max-Age=0 to clear immediately.

---

## 2. Contact Management Flows

### Flow 5: Create Contact

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Fill form   │────▶│  Submit     │
│  "New"       │     │  (Name,      │     │  POST       │
│              │     │   Email,     │     │  /contacts  │
│              │     │   Phone)     │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌─────────────┐     ┌───▼─────────┐
                        │  Redirect   │◀────│  Create     │
                        │  to list    │     │  contact    │
                        └─────────────┘     └─────────────┘
```

**Validation:** Email unique, Name required  
**RBAC:** Admin, Accountant can create

### Flow 6: Edit Contact

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click on    │────▶│  Load form  │────▶│  Edit and   │
│  contact     │     │  with data  │     │  Submit     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌─────────────┐     ┌───▼─────────┐
                        │  Redirect   │◀────│  Update     │
                        │  to list    │     │  contact    │
                        └─────────────┘     └─────────────┘
```

**RBAC:** Admin, Accountant can edit. User can view only.

---

## 3. Product Management Flows

### Flow 7: Create Product

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Fill form   │────▶│  Submit     │
│  "New"       │     │  (Name,      │     │  POST       │
│              │     │   Category,  │     │  /products  │
│              │     │   Type,      │     │             │
│              │     │   Price)     │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Category   │◀───────│  Create     │
                    │  on-the-fly │        │  product    │
                    └─────────────┘        └─────────────┘
```

**Validation:** Sales Price >= 0, Name required, Category required  
**RBAC:** Admin, Accountant can create

---

## 4. Budget Management Flows

### Flow 8: Create Budget

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Fill form   │────▶│  Submit     │
│  "New"       │     │  (Name,      │     │  POST       │
│              │     │   Type,      │     │  /budgets   │
│              │     │   Period)    │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌─────────────┐     ┌───▼─────────┐
                        │  Redirect   │◀────│  Create     │
                        │  to detail  │     │  budget     │
                        │  page       │     │  (draft)    │
                        └─────────────┘     └─────────────┘
```

**Validation:** Name required, Type required, Period required  
**RBAC:** Admin, Accountant can create

### Flow 9: Confirm Budget

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click       │────▶│  Enter      │────▶│  Submit     │
│  "Confirm"   │     │  Committed  │     │  PUT        │
│              │     │  Amount     │     │  /budgets/  │
│              │     │             │     │  :id/confirm│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌─────────────┐     ┌───▼─────────┐
                        │  Status =   │◀────│  Update     │
                        │  confirmed  │     │  status     │
                        └─────────────┘     └─────────────┘
```

**Input:** committed_amount (user-entered)  
**Output:** status = confirmed, committed_amount visible

### Flow 10: Revise Budget

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click       │────▶│  Confirm    │────▶│  Submit     │
│  "Revise"    │     │  revision   │     │  POST       │
│              │     │             │     │  /budgets/  │
│              │     │             │     │  :id/revise │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  New budget │◀───────│  Create     │
                    │  created    │        │  new budget │
                    │  (draft)    │        │  (draft)    │
                    └─────────────┘        └─────────────┘
```

**Output:** New budget created (draft), linked via previous_budget_id

### Flow 11: Cancel Budget

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click       │────▶│  Confirm    │────▶│  Submit     │
│  "Cancel"    │     │  cancellation│    │  PUT        │
│              │     │             │     │  /budgets/  │
│              │     │             │     │  :id/cancel │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌─────────────┐     ┌───▼─────────┐
                        │  Status =   │◀────│  Archive    │
                        │  cancelled  │     │  budget     │
                        │  archived   │     │             │
                        └─────────────┘     └─────────────┘
```

**Output:** is_archived = true, status = cancelled

---

## 5. Sales & Invoice Flows

### Flow 12: Create Sales Order

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Fill form   │────▶│  Submit     │
│  "New"       │     │  (Customer,  │     │  POST       │
│              │     │   Lines)     │     │  /sales-    │
│              │     │             │     │  orders     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌─────────────┐     ┌───▼─────────┐
                        │  Auto-gen   │◀────│  Create SO  │
                        │  SO Number  │     │  with lines │
                        │  (S00001)   │     │             │
                        └─────────────┘     └─────────────┘
```

**Auto-generation:** SO No. = S + 5-digit sequence

### Flow 13: Create Customer Invoice

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  From SO or  │────▶│  Fill form   │────▶│  Submit     │
│  directly    │     │  (Customer,  │     │  POST       │
│              │     │   Lines)     │     │  /invoices  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Auto-gen   │◀───────│  Create     │
                    │  INV Ref    │        │  invoice    │
                    │  (INV/2026/ │        │  (draft)    │
                    │   0001)     │        │             │
                    └─────────────┘        └─────────────┘
```

**Auto-generation:** INV/YYYY/NNNN sequence

### Flow 14: Confirm Invoice

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click       │────▶│  Validate   │────▶│  Create     │
│  "Confirm"   │     │  lines      │     │  JE + Lines │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Status =   │◀───────│  Update     │
                    │  confirmed  │        │  status     │
                    └─────────────┘        └─────────────┘
```

**JE Creation:**
- DEBIT: Debtor (partner=customer_id) — total_amount
- CREDIT: Sales Income (account=Sales) — total_amount

**Status Check:** Only draft invoices can be confirmed.

### Flow 15: Pay Invoice

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click       │────▶│  Enter      │────▶│  Submit     │
│  "Pay"       │     │  payment    │     │  POST       │
│              │     │  amount     │     │  /invoices/ │
│              │     │             │     │  :id/pay    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Create     │◀───────│  Validate   │
                    │  payment    │        │  amount     │
                    │  record     │        │             │
                    └─────────────┘        └─────────────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  If amount  │◀───────│  Update     │
                    │  due = 0,   │        │  amount_due │
                    │  status =   │        │             │
                    │  paid       │        │             │
                    └─────────────┘        └─────────────┘
```

**Validation:** amount_paid <= amount_due, amount_paid > 0  
**Status Check:** Only confirmed invoices can be paid.

---

## 6. Purchase & Bill Flows

### Flow 16: Create Purchase Order

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Fill form   │────▶│  Submit     │
│  "New"       │     │  (Vendor,    │     │  POST       │
│              │     │   Lines)     │     │  /purchase- │
│              │     │             │     │  orders     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌─────────────┐     ┌───▼─────────┐
                        │  Auto-gen   │◀────│  Create PO  │
                        │  PO Number  │     │  with lines │
                        │  (P00001)   │     │             │
                        └─────────────┘     └─────────────┘
```

**Auto-generation:** PO No. = P + 5-digit sequence

### Flow 17: Create Vendor Bill

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  From PO or  │────▶│  Fill form   │────▶│  Submit     │
│  directly    │     │  (Vendor,    │     │  POST       │
│              │     │   Lines)     │     │  /bills     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Auto-gen   │◀───────│  Create     │
                    │  Bill Ref   │        │  bill       │
                    │  (Bill/2026/│        │  (draft)    │
                    │   0001)     │        │             │
                    └─────────────┘        └─────────────┘
```

**Auto-generation:** Bill/YYYY/NNNN sequence

### Flow 18: Confirm Bill

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click       │────▶│  Validate   │────▶│  Create     │
│  "Confirm"   │     │  lines      │     │  JE + Lines │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Status =   │◀───────│  Update     │
                    │  confirmed  │        │  status     │
                    └─────────────┘        └─────────────┘
```

**JE Creation:**
- DEBIT: Purchase Expense (account=Purchase) — total_amount
- CREDIT: Creditor (partner=vendor_id) — total_amount

**Status Check:** Only draft bills can be confirmed.

### Flow 19: Pay Bill

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Click       │────▶│  Enter      │────▶│  Submit     │
│  "Pay"       │     │  payment    │     │  POST       │
│              │     │  amount     │     │  /bills/    │
│              │     │             │     │  :id/pay    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Create     │◀───────│  Validate   │
                    │  payment    │        │  amount     │
                    │  record     │        │             │
                    └─────────────┘        └─────────────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  If amount  │◀───────│  Update     │
                    │  due = 0,   │        │  amount_due │
                    │  status =   │        │             │
                    │  paid       │        │             │
                    └─────────────┘        └─────────────┘
```

**Validation:** amount_paid <= amount_due, amount_paid > 0  
**Status Check:** Only confirmed bills can be paid.

---

## 7. Journal Entry Flow

### Flow 20: Manual Journal Entry

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Admin/      │────▶│  Fill form   │────▶│  Submit     │
│  Accountant  │     │  (Date,      │     │  POST       │
│  clicks      │     │   Lines)     │     │  /journal-  │
│  "New JE"    │     │             │     │  entries    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Validate   │◀───────│  Check      │
                    │  balanced   │        │  debit =    │
                    │  (warning)  │        │  credit     │
                    └─────────────┘        └─────────────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Create     │◀───────│  Create     │
                    │  JE + Lines │        │  JE record  │
                    └─────────────┘        └─────────────┘
```

**INVARIANT:** debit MUST equal credit (with rounding tolerance < 0.01)  
**Warning:** Unbalanced entries show blocking warning message

---

## 8. Report Flows

### Flow 21: Profit & Loss Report

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Select     │────▶│  Display    │
│  "P&L"       │     │  year       │     │  report     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Income =   │◀───────│  Aggregate  │
                    │  SUM(credit)│        │  from JE    │
                    │  Expenses = │        │  lines      │
                    │  SUM(debit) │        │             │
                    └─────────────┘        └─────────────┘
```

### Flow 22: Balance Sheet Report

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Select     │────▶│  Display    │
│  "BS"        │     │  year       │     │  report     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  Assets =   │◀───────│  Aggregate  │
                    │  SUM(debit- │        │  from JE    │
                    │  credit)    │        │  lines      │
                    │  Liabilities│        │             │
                    │  = SUM(cred-│        │             │
                    │  it-debit)  │        │             │
                    └─────────────┘        └─────────────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  INVARIANT: │        │  Verify     │
                    │  Assets =   │        │  balance    │
                    │  Liabilities│        │             │
                    └─────────────┘        └─────────────┘
```

### Flow 23: Budget Report

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User clicks │────▶│  Select     │────▶│  Display    │
│  "Budget"    │     │  filters    │     │  report     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐        ┌───▼─────────┐
                    │  For each   │◀───────│  Compute    │
                    │  budget:    │        │  achieved   │
                    │  achieved = │        │  from       │
                    │  SUM(lines) │        │  invoices/  │
                    └─────────────┘        │  bills      │
                                           └─────────────┘
```

---

*Document generated from Excalidraw annotations + frozen decisions on 2026-09-05*
