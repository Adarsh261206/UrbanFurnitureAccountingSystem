# 17 — State Machines

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Budget State Machine

### 1.1 States

| State | Meaning | Display |
|-------|---------|---------|
| draft | Created, editable, not committed | "Draft" |
| confirmed | Committed, achieved calculation active | "Confirmed" |
| revised | Replaced by a new revision | "Revised" |
| cancelled | Archived, no longer active | "Cancelled" |

### 1.2 Transitions

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
┌─────────┐    ┌──────────┐    ┌──────────┐              │
│  DRAFT  │───▶│CONFIRMED │───▶│ REVISED  │              │
└────┬────┘    └────┬─────┘    └────┬─────┘              │
     │              │               │                     │
     │              │               │                     │
     └──────────────┼───────────────┼─────────────────────┘
                    │               │
                    ▼               ▼
               ┌────────────────────────┐
               │      CANCELLED         │
               │      (archived)        │
               └────────────────────────┘
```

### 1.3 Transition Rules

| From | To | Allowed Roles | UI Action | API Endpoint | Side Effects |
|------|-----|---------------|-----------|--------------|--------------|
| draft | confirmed | Admin, Accountant | "Confirm" button | `PUT /budgets/:id/confirm` | committed_amount set |
| draft | cancelled | Admin, Accountant | "Cancel" button | `PUT /budgets/:id/cancel` | is_archived = true |
| confirmed | revised | Admin, Accountant | "Revise" button | `POST /budgets/:id/revise` | New budget created, original status = revised |
| confirmed | cancelled | Admin, Accountant | "Cancel" button | `PUT /budgets/:id/cancel` | is_archived = true |
| revised | cancelled | Admin, Accountant | "Cancel" button | `PUT /budgets/:id/cancel` | is_archived = true |
| cancelled | — | — | — | — | Terminal state |

### 1.4 Forbidden Transitions

| From | To | Reason |
|------|-----|--------|
| draft | revised | Must confirm first |
| draft | paid | Not applicable |
| confirmed | draft | Cannot unconfirm |
| confirmed | confirmed | Already confirmed |
| revised | draft | Cannot revert |
| revised | confirmed | Cannot reconfirm |
| cancelled | any | Terminal state |

### 1.5 Editing Rules

| State | Editable Fields | Can Add Lines | Can Delete |
|-------|----------------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |
| revised | None | No | No |
| cancelled | None | No | No |

---

## 2. Customer Invoice State Machine

### 2.1 States

| State | Meaning | Display |
|-------|---------|---------|
| draft | Created, editable, no accounting entry | "Draft" |
| confirmed | Accounting entry created, payment expected | "Confirmed" |
| paid | Fully paid, no amount due | "Paid" |

### 2.2 Transitions

```
┌─────────┐    ┌──────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│   PAID   │
└────┬────┘    └──────────┘    └──────────┘
     │
     ▼
  CANCELLED (draft only)
```

### 2.3 Transition Rules

| From | To | Allowed Roles | UI Action | API Endpoint | Side Effects |
|------|-----|---------------|-----------|--------------|--------------|
| draft | confirmed | Admin, Accountant | "Confirm" button | `POST /invoices/:id/confirm` | JournalEntry created |
| draft | cancelled | Admin, Accountant | "Cancel" button | `POST /invoices/:id/cancel` | Record discarded |
| confirmed | paid | System (on full payment) | — | `POST /invoices/:id/pay` | amount_due = 0 |

### 2.4 Forbidden Transitions

| From | To | Reason |
|------|-----|--------|
| draft | paid | Must confirm first |
| confirmed | draft | Cannot unconfirm (accounting entry exists) |
| confirmed | cancelled | Cannot cancel confirmed (accounting entry exists) |
| paid | any | Terminal state |

### 2.5 Editing Rules

| State | Editable Fields | Can Add Lines | Can Delete |
|-------|----------------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |
| paid | None | No | No |

---

## 3. Vendor Bill State Machine

### 3.1 States

| State | Meaning | Display |
|-------|---------|---------|
| draft | Created, editable, no accounting entry | "Draft" |
| confirmed | Accounting entry created, payment expected | "Confirmed" |
| paid | Fully paid, no amount due | "Paid" |

### 3.2 Transitions

```
┌─────────┐    ┌──────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│   PAID   │
└────┬────┘    └──────────┘    └──────────┘
     │
     ▼
  CANCELLED (draft only)
```

### 3.3 Transition Rules

| From | To | Allowed Roles | UI Action | API Endpoint | Side Effects |
|------|-----|---------------|-----------|--------------|--------------|
| draft | confirmed | Admin, Accountant | "Confirm" button | `POST /bills/:id/confirm` | JournalEntry created |
| draft | cancelled | Admin, Accountant | "Cancel" button | `POST /bills/:id/cancel` | Record discarded |
| confirmed | paid | System (on full payment) | — | `POST /bills/:id/pay` | amount_due = 0 |

### 3.4 Forbidden Transitions

| From | To | Reason |
|------|-----|--------|
| draft | paid | Must confirm first |
| confirmed | draft | Cannot unconfirm (accounting entry exists) |
| confirmed | cancelled | Cannot cancel confirmed (accounting entry exists) |
| paid | any | Terminal state |

### 3.5 Editing Rules

| State | Editable Fields | Can Add Lines | Can Delete |
|-------|----------------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |
| paid | None | No | No |

---

## 4. Sales Order State Machine

### 4.1 States

| State | Meaning |
|-------|---------|
| draft | Created, editable |
| confirmed | Finalized, triggers invoice creation |

### 4.2 Transitions

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │
└─────────┘    └──────────┘
```

### 4.3 Transition Rules

| From | To | Allowed Roles | UI Action | API Endpoint | Side Effects |
|------|-----|---------------|-----------|--------------|--------------|
| draft | confirmed | Admin, Accountant | "Confirm" button | `PUT /sales-orders/:id/confirm` | None (invoice created separately) |

### 4.4 Editing Rules

| State | Editable Fields | Can Add Lines | Can Delete |
|-------|----------------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |

---

## 5. Purchase Order State Machine

### 5.1 States

| State | Meaning |
|-------|---------|
| draft | Created, editable |
| confirmed | Finalized, triggers bill creation |

### 5.2 Transitions

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │
└─────────┘    └──────────┘
```

### 5.3 Transition Rules

| From | To | Allowed Roles | UI Action | API Endpoint | Side Effects |
|------|-----|---------------|-----------|--------------|--------------|
| draft | confirmed | Admin, Accountant | "Confirm" button | `PUT /purchase-orders/:id/confirm` | None (bill created separately) |

### 5.4 Editing Rules

| State | Editable Fields | Can Add Lines | Can Delete |
|-------|----------------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |

---

## 6. Payment State Machine

### 6.1 States

| State | Meaning |
|-------|---------|
| draft | Created, not yet processed |
| confirmed | Payment initiated |
| successful | Payment completed, accounting entry created |

### 6.2 Transitions

```
┌─────────┐    ┌──────────┐    ┌─────────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│ SUCCESSFUL  │
└─────────┘    └──────────┘    └─────────────┘
```

### 6.3 Transition Rules

| From | To | Allowed Roles | UI Action | API Endpoint | Side Effects |
|------|-----|---------------|-----------|--------------|--------------|
| draft | confirmed | Admin, Accountant | "Confirm" | `PUT /payments/:id/confirm` | None |
| confirmed | successful | Admin, Accountant | "Process" | `PUT /payments/:id/process` | JournalEntry created, invoice/bill amount_due updated |

### 6.4 Editing Rules

| State | Editable Fields |
|-------|----------------|
| draft | amount, payment_via, payment_date |
| confirmed | None |
| successful | None |

---

## 7. Journal Entry State Machine

### 7.1 States

| State | Meaning |
|-------|---------|
| draft | Created but not posted |
| posted | Finalized, immutable |

### 7.2 Transitions

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│ POSTED   │
└─────────┘    └──────────┘
```

### 7.3 Rules

- Auto-created journal entries (from invoice/bill confirmation) are created as 'posted'
- Manual journal entries are created as 'posted' directly
- Journal entries are IMMUTABLE after posting
- No transitions back to draft

---

## 8. User State Machine

### 8.1 States

| State | Meaning |
|-------|---------|
| active | Can authenticate and access system |
| inactive | Cannot authenticate |

### 8.2 Transitions

| From | To | Allowed Roles | Side Effects |
|------|-----|---------------|--------------|
| active | inactive | Admin | Session invalidated |
| inactive | active | Admin | None |

### 8.3 Note

User deactivation is NOT implemented in hackathon scope. All users remain active.

---

## 9. API Retry Behavior

| Entity | Action | Idempotent | Retry Behavior |
|--------|--------|------------|----------------|
| Budget | Confirm | Yes | Check status, return current state |
| Budget | Revise | No | Creates new revision each time (prevent double-click) |
| Budget | Cancel | Yes | Check status, return current state |
| Invoice | Confirm | Yes | Check status, return current state |
| Invoice | Pay | Yes | Check payment exists, return existing payment |
| Bill | Confirm | Yes | Check status, return current state |
| Bill | Pay | Yes | Check payment exists, return existing payment |
| Payment | Process | Yes | Check status, return current state |
| Journal Entry | Create | No | Creates new entry each time |

---

*Document generated from state machine analysis on 2026-09-05*
