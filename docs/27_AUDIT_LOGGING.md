# 27 — Audit Logging

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Audit Scope

### 1.1 Events to Audit

| Event | Priority | Entity | Action |
|-------|----------|--------|--------|
| Login success | High | user | login |
| Login failure | High | user | login_failed |
| User creation | High | user | create |
| Role change | High | user | role_change |
| Invoice confirmation | High | customer_invoice | confirm |
| Bill confirmation | High | vendor_bill | confirm |
| Invoice payment | High | payment | create |
| Bill payment | High | payment | create |
| Budget confirmation | Medium | budget | confirm |
| Budget revision | Medium | budget | revise |
| Budget cancellation | Medium | budget | cancel |
| Manual journal entry | Medium | journal_entry | create |
| Contact create/update | Low | contact | create/update |
| Product create/update | Low | product | create/update |

---

## 2. Audit Log Schema

### 2.1 audit_logs Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | NO | Primary key |
| user_id | UUID | NO | FK → users |
| action | VARCHAR(50) | NO | Action performed |
| entity_type | VARCHAR(50) | NO | Entity type |
| entity_id | UUID | NO | Entity ID |
| old_values | JSONB | YES | Previous state |
| new_values | JSONB | YES | New state |
| ip_address | INET | YES | Request IP |
| user_agent | TEXT | YES | Request user agent |
| created_at | TIMESTAMPTZ | NO | When |

---

## 3. Audit Entry Format

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "action": "confirm",
  "entity_type": "customer_invoice",
  "entity_id": "uuid",
  "old_values": {
    "status": "draft"
  },
  "new_values": {
    "status": "confirmed",
    "journal_entry_id": "uuid"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2026-09-05T10:30:00.000Z"
}
```

---

## 4. What NOT to Audit

| Data | Reason |
|------|--------|
| Passwords | Security |
| JWT tokens | Security |
| Full request bodies | Size, may contain sensitive data |
| Financial amounts | Already in transaction records |

---

## 5. Implementation

### 5.1 Middleware

```typescript
const auditLog = async (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Log successful action
      createAuditLog({
        user_id: req.user?.id,
        action: req.auditAction,
        entity_type: req.auditEntityType,
        entity_id: req.auditEntityId,
        old_values: req.auditOldValues,
        new_values: data,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    }
    return originalJson.call(this, data);
  };
  next();
};
```

### 5.2 Not Implemented in Hackathon

Audit logging is an ENGINEERING_RECOMMENDATION, not SOURCE_REQUIRED. For hackathon scope, implement only critical financial audits if time permits.

---

*Document generated from audit logging analysis on 2026-09-05*
