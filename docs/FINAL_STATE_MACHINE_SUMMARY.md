# FINAL_STATE_MACHINE_SUMMARY.md

> **Date:** 2026-09-05  
> **Source:** 17_STATE_MACHINES.md (authoritative) + CORRECTIONS from validation

---

## 1. Budget State Machine

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

| From | To | Endpoint | Method | Side Effects | Roles |
|------|-----|----------|--------|--------------|-------|
| draft | confirmed | /budgets/:id/confirm | PUT | committed_amount set | admin, accountant |
| draft | cancelled | /budgets/:id/cancel | PUT | is_archived = true | admin, accountant |
| confirmed | revised | /budgets/:id/revise | POST | New draft budget created; original → revised | admin, accountant |
| confirmed | cancelled | /budgets/:id/cancel | PUT | is_archived = true | admin, accountant |
| revised | cancelled | /budgets/:id/cancel | PUT | is_archived = true | admin, accountant |

**Terminal:** cancelled

**Forbidden:**
- draft → revised (must confirm first)
- confirmed → draft (cannot unconfirm)
- cancelled → any
- revised → any except cancelled

**Editing Rules:**
| State | Editable | Can Add Lines | Can Delete |
|-------|----------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |
| revised | None | No | No |
| cancelled | None | No | No |

---

## 2. Customer Invoice State Machine

```
┌─────────┐    ┌──────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│   PAID   │
└────┬────┘    └──────────┘    └──────────┘
     │
     ▼
  CANCELLED (draft only)
```

| From | To | Endpoint | Method | Side Effects | Roles |
|------|-----|----------|--------|--------------|-------|
| draft | confirmed | /invoices/:id/confirm | POST | JE created (Sales: DEBIT Debtors, CREDIT Sales Income) | admin, accountant |
| draft | cancelled | /invoices/:id/cancel | POST | Record discarded (hard delete) | admin, accountant |
| confirmed | paid | /invoices/:id/pay | POST | amount_due -= payment; if 0 → status='paid'; JE created | admin, accountant, user (own) |

**Terminal:** paid

**Forbidden:**
- draft → paid (must confirm first)
- confirmed → draft (accounting entry exists)
- confirmed → cancelled (accounting entry exists)
- paid → any

**Editing Rules:**
| State | Editable | Can Add Lines | Can Delete |
|-------|----------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |
| paid | None | No | No |

---

## 3. Vendor Bill State Machine

```
┌─────────┐    ┌──────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│   PAID   │
└────┬────┘    └──────────┘    └──────────┘
     │
     ▼
  CANCELLED (draft only)
```

| From | To | Endpoint | Method | Side Effects | Roles |
|------|-----|----------|--------|--------------|-------|
| draft | confirmed | /bills/:id/confirm | POST | JE created (Purchase: DEBIT Purchase Expense, CREDIT Creditors) | admin, accountant |
| draft | cancelled | /bills/:id/cancel | POST | Record discarded (hard delete) | admin, accountant |
| confirmed | paid | /bills/:id/pay | POST | amount_due -= payment; if 0 → status='paid'; JE created | admin, accountant |

**Terminal:** paid

**Forbidden:**
- draft → paid (must confirm first)
- confirmed → draft (accounting entry exists)
- confirmed → cancelled (accounting entry exists)
- paid → any

**Editing Rules:**
| State | Editable | Can Add Lines | Can Delete |
|-------|----------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |
| paid | None | No | No |

---

## 4. Sales Order State Machine

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │
└─────────┘    └──────────┘
```

| From | To | Endpoint | Method | Side Effects | Roles |
|------|-----|----------|--------|--------------|-------|
| draft | confirmed | /sales-orders/:id/confirm | PUT | None (invoice created separately) | admin, accountant |

**No cancel state.** Draft SOs are hard-deleted if no longer needed.

**Editing Rules:**
| State | Editable | Can Add Lines | Can Delete |
|-------|----------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |

---

## 5. Purchase Order State Machine

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│CONFIRMED │
└─────────┘    └──────────┘
```

| From | To | Endpoint | Method | Side Effects | Roles |
|------|-----|----------|--------|--------------|-------|
| draft | confirmed | /purchase-orders/:id/confirm | PUT | None (bill created separately) | admin, accountant |

**No cancel state.** Draft POs are hard-deleted if no longer needed.

**Editing Rules:**
| State | Editable | Can Add Lines | Can Delete |
|-------|----------|---------------|------------|
| draft | All fields | Yes | Yes |
| confirmed | None | No | No |

---

## 6. Payment State Machine (Logical Model)

```
┌─────────┐    ┌──────────┐    ┌─────────────┐
│  DRAFT  │───▶│CONFIRMED │───▶│ SUCCESSFUL  │
└─────────┘    └──────────┘    └─────────────┘
```

**DECISION:** The API implements a **1-step flow**. Payments are created directly with `status = 'successful'`. The 3-state logical model is preserved in the `payment_status` enum for future extensibility.

| State | Meaning | API Behavior |
|-------|---------|-------------|
| draft | Created, not yet processed | Skipped by API |
| confirmed | Payment initiated | Skipped by API |
| successful | Completed, JE created | Default status on POST /pay |

---

## 7. Journal Entry State Machine

```
┌─────────┐    ┌──────────┐
│  DRAFT  │───▶│ POSTED   │
└─────────┘    └──────────┘
```

- Auto-created JEs (from invoice/bill confirmation): created as `posted`
- Manual JEs: created as `posted` directly
- JEs are IMMUTABLE after posting
- No transitions back to draft

---

## 8. User State Machine

```
┌──────────┐    ┌──────────┐
│  ACTIVE  │───▶│INACTIVE  │
└──────────┘    └──────────┘
```

- User deactivation NOT implemented in hackathon scope
- All users remain active
- is_active field exists for future use

---

## 9. Idempotency Matrix

| Entity | Action | Idempotent | Behavior |
|--------|--------|------------|----------|
| Budget | Confirm | Yes | Check status, return current |
| Budget | Revise | No | Creates new revision each time |
| Budget | Cancel | Yes | Check status, return current |
| Invoice | Confirm | Yes | Check status, return current |
| Invoice | Pay | Yes | Check payment exists, return existing |
| Invoice | Cancel | Yes | Check status, return current |
| Bill | Confirm | Yes | Check status, return current |
| Bill | Pay | Yes | Check payment exists, return existing |
| Bill | Cancel | Yes | Check status, return current |
| Journal Entry | Create | No | Creates new entry each time |

---

*State machines verified 2026-09-05 against 17_STATE_MACHINES.md + corrections*
