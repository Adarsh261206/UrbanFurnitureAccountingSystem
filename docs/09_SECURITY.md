# 09 — Security Plan

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Frozen Security Decisions  
> **Date:** 2026-09-05

---

## 1. Authentication Security

### 1.1 Password Storage

| Requirement | Implementation | Frozen Decision |
|-------------|----------------|-----------------|
| Hashing algorithm | bcrypt | 12+ rounds |
| Salt | Automatically handled by bcrypt | — |
| Storage | Only hash stored, never plaintext | — |

### 1.2 JWT Configuration (Frozen)

| Setting | Value | Rationale |
|---------|-------|-----------|
| Algorithm | HS256 | Sufficient for single-server |
| Token expiry | 15 minutes | Short-lived for security |
| Secret key | ≥ 32 characters | Cryptographic strength |
| Storage | HttpOnly cookie ONLY | Prevents XSS theft |

**FROZEN:** JWT NEVER returned in response body. HttpOnly cookie ONLY.

### 1.3 Cookie Configuration (Frozen)

| Setting | Value | Rationale |
|---------|-------|-----------|
| Name | auth_token | Standard naming |
| HttpOnly | true | Prevents JavaScript access |
| Secure | true | HTTPS only |
| SameSite | Strict | Prevents CSRF |
| Path | /api | API-only |
| Max-Age | 86400 (24 hours) | Session duration |

### 1.4 Token Structure

```json
{
  "sub": "user_id",
  "role": "admin|accountant|user",
  "iat": 1234567890,
  "exp": 1234568790
}
```

## 2. Authorization Security

### 2.1 Role-Based Access Control (Frozen)

| Endpoint | Admin | Accountant | User | Public |
|----------|:-----:|:----------:|:----:|:------:|
| POST /auth/login | ✓ | ✓ | ✓ | ✓ |
| POST /auth/signup | ✓ | ✓ | ✓ | ✓ |
| POST /users | ✓ | ✗ | ✗ | ✗ |
| GET /contacts | ✓ | ✓ | ✗ | ✗ |
| POST /contacts | ✓ | ✓ | ✗ | ✗ |
| GET /products | ✓ | ✓ | ✗ | ✗ |
| POST /products | ✓ | ✓ | ✗ | ✗ |
| GET /budgets | ✓ | ✓ | ✗ | ✗ |
| POST /budgets | ✓ | ✓ | ✗ | ✗ |
| GET /invoices | ✓ | ✓ | ✓ (own) | ✗ |
| POST /invoices | ✓ | ✓ | ✗ | ✗ |
| POST /invoices/:id/confirm | ✓ | ✓ | ✗ | ✗ |
| POST /invoices/:id/pay | ✓ | ✓ | ✓ (own) | ✗ |
| GET /bills | ✓ | ✓ | ✓ (own) | ✗ |
| POST /bills | ✓ | ✓ | ✗ | ✗ |
| POST /bills/:id/confirm | ✓ | ✓ | ✗ | ✗ |
| POST /bills/:id/pay | ✓ | ✓ | ✓ (own) | ✗ |
| GET /journal-entries | ✓ | ✓ | ✗ | ✗ |
| POST /journal-entries | ✓ | ✓ | ✗ | ✗ |
| GET /reports/* | ✓ | ✓ | ✗ | ✗ |

### 2.2 Object-Level Authorization (Frozen)

| Entity | Owner Access | Admin/Accountant Access |
|--------|-------------|------------------------|
| Invoices | Read, Pay (own) | Full |
| Bills | Read, Pay (own) | Full |
| Payments | Read (own) | Full |

**IDOR Prevention:** Object-level authorization on all endpoints. User can only access own invoices/bills/payments.

## 3. CSRF Protection (Frozen)

| Mechanism | Implementation |
|-----------|----------------|
| SameSite | Strict on all cookies |
| Origin check | CORS configuration |
| Token | Not needed (SameSite=Strict) |

**FROZEN:** SameSite=Strict prevents all cross-origin form submissions.

## 4. Rate Limiting (Frozen)

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 6 requests | 1 minute |
| POST /auth/signup | 4 requests | 1 hour |
| All other endpoints | 101 requests | 1 minute |

## 5. Input Validation (Frozen)

### 5.1 SQL Injection Prevention

- Prisma parameterized queries (automatic)
- Never concatenate user input into SQL
- Use Prisma's query builder

### 5.2 XSS Prevention

- Output encoding (JSON responses only)
- No HTML rendering
- Content-Type: application/json

### 5.3 Input Sanitization

- express-validator for all inputs
- Whitelist allowed characters
- Reject null bytes

## 6. Data Security

### 6.1 Sensitive Data

| Data | Protection |
|------|-----------|
| Passwords | bcrypt hash (never plaintext) |
| JWT secret | Environment variable |
| Database URL | Environment variable |
| API keys | Environment variable |

### 6.2 Logging

| Data | Log | Don't Log |
|------|-----|-----------|
| User ID | ✓ | — |
| Action | ✓ | — |
| IP address | ✓ | — |
| Passwords | — | ✓ |
| JWT tokens | — | ✓ |
| Full request bodies | — | ✓ |

## 7. Transport Security

| Requirement | Implementation |
|-------------|----------------|
| HTTPS | Required in production |
| HSTS | Enable |
| Secure cookies | true |

## 8. Database Security

| Requirement | Implementation |
|-------------|----------------|
| Connection | SSL required |
| Credentials | Environment variable |
| Least privilege | Read/write only |
| Backups | Daily automated |

---

*Document generated from frozen security decisions on 2026-09-05*
