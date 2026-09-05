# 30 — Security Test Matrix

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Authentication Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-AUTH-001 | Login with valid credentials | 200, cookie set | High |
| SEC-AUTH-002 | Login with invalid password | 401, generic error | High |
| SEC-AUTH-003 | Login with non-existent user | 401, generic error | High |
| SEC-AUTH-004 | Access protected endpoint without cookie | 401 | High |
| SEC-AUTH-005 | Access protected endpoint with expired JWT | 401 | High |
| SEC-AUTH-006 | Access protected endpoint with malformed JWT | 401 | High |
| SEC-AUTH-007 | Logout clears cookie | Cookie Max-Age=0 | High |
| SEC-AUTH-008 | Password stored as hash | Not plaintext in DB | High |

---

## 2. Authorization Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-AUTHZ-001 | Admin access to /users | 200 | High |
| SEC-AUTHZ-002 | Accountant access to /users | 403 | High |
| SEC-AUTHZ-003 | User access to /users | 403 | High |
| SEC-AUTHZ-004 | Accountant access to /contacts | 200 | High |
| SEC-AUTHZ-005 | User access to /contacts | 403 | High |
| SEC-AUTHZ-006 | User access to own invoice | 200 | High |
| SEC-AUTHZ-007 | User access to other's invoice | 403 | High |
| SEC-AUTHZ-008 | User access to budgets | 403 | High |
| SEC-AUTHZ-009 | Accountant confirm invoice | 200 | High |
| SEC-AUTHZ-010 | User confirm invoice | 403 | High |

---

## 3. IDOR Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-IDOR-001 | User access invoice with known UUID | 200 (own) or 403 (other) | High |
| SEC-IDOR-002 | User access bill with known UUID | 403 (user cannot access bills) | High |
| SEC-IDOR-003 | User access payment with known UUID | 200 (own) or 403 (other) | High |
| SEC-IDOR-004 | Sequential UUID enumeration | Cannot access other's records | High |

---

## 4. Input Validation Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-INPUT-001 | SQL injection in login | Blocked | High |
| SEC-INPUT-002 | SQL injection in search | Blocked | High |
| SEC-INPUT-003 | XSS in contact name | Blocked/encoded | High |
| SEC-INPUT-004 | XSS in product name | Blocked/encoded | High |
| SEC-INPUT-005 | Invalid email format | 400 VALIDATION_ERROR | Medium |
| SEC-INPUT-006 | Negative amount | 400 VALIDATION_ERROR | Medium |
| SEC-INPUT-007 | Extremely long input | 400 or truncated | Medium |
| SEC-INPUT-008 | Null bytes in input | Blocked | Medium |

---

## 5. Rate Limiting Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-RATE-001 | 6 login attempts in 1 minute | 429 RATE_LIMITED | High |
| SEC-RATE-002 | 4 signups in 1 hour | 429 RATE_LIMITED | Medium |
| SEC-RATE-003 | 101 API requests in 1 minute | 429 RATE_LIMITED | Medium |

---

## 6. CSRF Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-CSRF-001 | Cross-origin form submission | Blocked by SameSite=Strict | High |
| SEC-CSRF-002 | Cross-origin AJAX | Blocked by CORS | High |

---

## 7. Concurrency Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-CONC-001 | Two users confirm same invoice | One succeeds, one fails | High |
| SEC-CONC-002 | Two payments on same invoice | Second blocked (amount check) | High |
| SEC-CONC-003 | Simultaneous budget revision | One succeeds, one fails | Medium |
| SEC-CONC-004 | Duplicate sequence generation | Unique constraint prevents | Medium |

---

## 8. Financial Security Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-FIN-001 | Overpayment on invoice | 400 OVERPAYMENT_NOT_ALLOWED | High |
| SEC-FIN-002 | Overpayment on bill | 400 OVERPAYMENT_NOT_ALLOWED | High |
| SEC-FIN-003 | Unbalanced journal entry | 400 UNBALANCED_JOURNAL | High |
| SEC-FIN-004 | Double confirmation of invoice | 400 ALREADY_CONFIRMED | High |
| SEC-FIN-005 | Payment on paid invoice | 400 ALREADY_PAID | High |
| SEC-FIN-006 | Negative payment amount | 400 VALIDATION_ERROR | High |

---

## 9. Session Security Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-SESSION-001 | Cookie HttpOnly flag | true | High |
| SEC-SESSION-002 | Cookie Secure flag | true (production) | High |
| SEC-SESSION-003 | Cookie SameSite | Strict | High |
| SEC-SESSION-004 | Cookie expiry | 24 hours max | Medium |
| SEC-SESSION-005 | JWT expiry | 15 minutes | High |

---

## 10. CORS Tests

| Test ID | Test | Expected | Priority |
|---------|------|----------|----------|
| SEC-CORS-001 | Request from allowed origin | 200 | High |
| SEC-CORS-002 | Request from disallowed origin | Blocked | High |
| SEC-CORS-003 | Credentials from allowed origin | Accepted | High |

---

*Document generated from security test analysis on 2026-09-05*
