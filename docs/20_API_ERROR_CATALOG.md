# 20 — API Error Catalog

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "field_name | null",
    "details": {}
  }
}
```

---

## 2. Error Catalog

### 2.1 Authentication Errors

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| INVALID_CREDENTIALS | 401 | Invalid Login Id or Password | Login with wrong credentials |
| UNAUTHORIZED | 401 | Authentication required | No cookie or invalid cookie |
| TOKEN_EXPIRED | 401 | Session expired | JWT expired |
| INVALID_TOKEN | 401 | Invalid session | JWT malformed or invalid |

---

### 2.2 Authorization Errors

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| FORBIDDEN | 403 | Insufficient permissions | Role not allowed |
| OWNERSHIP_REQUIRED | 403 | Access denied | User accessing non-own record |

---

### 2.3 Validation Errors

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| VALIDATION_ERROR | 400 | Validation failed | Field-level validation |
| DUPLICATE_LOGIN_ID | 409 | Login ID already exists | Sign up or create user |
| DUPLICATE_EMAIL | 409 | Email already exists | Sign up, create user, or create contact |
| WEAK_PASSWORD | 400 | Password must contain uppercase, lowercase, special character and be >8 characters | Password validation |
| PASSWORD_MISMATCH | 400 | Passwords do not match | confirm_password != password |
| INVALID_LOGIN_LENGTH | 400 | Login ID must be between 6-12 characters | Login ID validation |
| REQUIRED_FIELD | 400 | Field is required | Missing required field |
| INVALID_FORMAT | 400 | Invalid format | Email, date, UUID format |
| INVALID_ENUM | 400 | Invalid value | Invalid enum value |

---

### 2.4 Resource Errors

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| NOT_FOUND | 404 | Record not found | Invalid ID |
| ALREADY_EXISTS | 409 | Record already exists | Duplicate creation |

---

### 2.5 Business Logic Errors

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| INVALID_STATE_TRANSITION | 400 | Cannot transition from {current} to {target} | Invalid status change |
| ALREADY_CONFIRMED | 400 | Document already confirmed | Double confirmation |
| ALREADY_PAID | 400 | Document already fully paid | Payment on paid document |
| OVERPAYMENT_NOT_ALLOWED | 400 | Payment amount exceeds amount due | Payment > amount_due |
| INVALID_PAYMENT_AMOUNT | 400 | Payment amount must be greater than zero | amount <= 0 |
| DRAFT_REQUIRED | 400 | Document must be in draft status | Action on non-draft |
| CONFIRMED_REQUIRED | 400 | Document must be confirmed | Action on non-confirmed |
| LINES_REQUIRED | 400 | At least one line item is required | Confirm with no lines |

---

### 2.6 Accounting Errors

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| UNBALANCED_JOURNAL | 400 | Debit and credit totals do not match | Manual JE with SUM(debit) != SUM(credit) |
| JOURNAL_ENTRY_REQUIRED | 400 | Journal entry is required for this operation | Missing accounting entry |
| NEGATIVE_AMOUNT | 400 | Amount must be non-negative | Negative debit/credit |
| ZERO_AMOUNT | 400 | At least one of debit or credit must be positive | Both zero |

---

### 2.7 Concurrency Errors

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| CONCURRENT_MODIFICATION | 409 | Record was modified by another user. Please refresh and try again | Optimistic lock failure |
| DUPLICATE_CONFIRMATION | 409 | This document has already been confirmed | Race condition on confirm |

---

### 2.8 Rate Limiting

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| RATE_LIMITED | 429 | Too many requests. Please try again later | Rate limit exceeded |

---

### 2.9 Server Errors

| Code | HTTP Status | Message | When |
|------|------------|---------|------|
| INTERNAL_ERROR | 500 | An unexpected error occurred | Unhandled exception |
| DATABASE_ERROR | 500 | Database operation failed | DB connection or query error |

---

## 3. Error Response Examples

### 3.1 Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "field": "email",
    "details": {
      "rule": "unique",
      "value": "test@example.com"
    }
  }
}
```

### 3.2 Business Logic Error

```json
{
  "error": {
    "code": "OVERPAYMENT_NOT_ALLOWED",
    "message": "Payment amount exceeds amount due",
    "field": "amount",
    "details": {
      "amount": 15000,
      "amount_due": 10000
    }
  }
}
```

### 3.3 State Transition Error

```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition from paid to draft",
    "field": "status",
    "details": {
      "current_status": "paid",
      "target_status": "draft"
    }
  }
}
```

---

*Document generated from error catalog analysis on 2026-09-05*
