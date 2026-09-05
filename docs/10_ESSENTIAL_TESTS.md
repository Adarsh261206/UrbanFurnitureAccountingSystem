# 10 — Essential Tests

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Frozen Test Strategy  
> **Date:** 2026-09-05

---

## 1. Test Strategy

### 1.1 Test Categories

| Category | Scope | Framework | Priority |
|---------|-------|-----------|----------|
| Unit Tests | Individual functions, validations | Jest/Vitest | MUST |
| Backend Integration | API endpoint tests | Supertest + Jest | MUST |
| API Contract | Request/response shape | Jest + Zod | MUST |
| Database | Constraint, migration tests | pgTAP or Jest | MUST |
| Business Logic | Workflow, state machine | Jest | MUST |
| Authorization | Role-based access | Jest + Supertest | MUST |
| Security | Injection, auth bypass | OWASP ZAP / manual | SHOULD |
| Frontend Component | Component rendering | React Testing Library | SHOULD |
| E2E | Full workflow tests | Playwright/Cypress | SHOULD |
| Responsive | Mobile/tablet viewports | Playwright | CAN DEFER |
| Accessibility | ARIA, keyboard nav | axe-core | CAN DEFER |

### 1.2 Test Environment

```typescript
// jest.config.ts
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterSetup: ['./tests/setup.ts'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
};
```

## 2. Authentication Tests

### 2.1 Sign Up Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-AUTH-001 | Sign up with valid data | 201, user created with role='user' |
| TC-AUTH-002 | Sign up with duplicate login_id | 409 DUPLICATE_LOGIN_ID |
| TC-AUTH-003 | Sign up with duplicate email | 409 DUPLICATE_EMAIL |
| TC-AUTH-004 | Sign up with login_id < 6 chars | 400 VALIDATION_ERROR |
| TC-AUTH-005 | Sign up with login_id > 12 chars | 400 VALIDATION_ERROR |
| TC-AUTH-006 | Sign up with weak password | 400 WEAK_PASSWORD |
| TC-AUTH-007 | Sign up with mismatched passwords | 400 VALIDATION_ERROR |

### 2.2 Login Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-AUTH-008 | Login with valid credentials | 200, HttpOnly cookie set |
| TC-AUTH-009 | Login with invalid password | 401 INVALID_CREDENTIALS |
| TC-AUTH-010 | Login with non-existent user | 401 INVALID_CREDENTIALS |
| TC-AUTH-011 | Login sets HttpOnly cookie | cookie.httpOnly = true |
| TC-AUTH-012 | Login sets Secure flag | cookie.secure = true |
| TC-AUTH-013 | Login sets SameSite=Strict | cookie.sameSite = 'strict' |
| TC-AUTH-014 | JWT not in response body | body does not contain token |

### 2.3 Session Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-AUTH-015 | GET /auth/me with valid cookie | 200, user object |
| TC-AUTH-016 | GET /auth/me without cookie | 401 UNAUTHORIZED |
| TC-AUTH-017 | GET /auth/me with expired JWT | 401 UNAUTHORIZED |
| TC-AUTH-018 | GET /auth/me with malformed JWT | 401 UNAUTHORIZED |

### 2.4 Logout Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-AUTH-019 | POST /auth/logout | 200, cookie cleared |
| TC-AUTH-020 | Cookie Max-Age = 0 | cookie.maxAge = 0 |

## 3. Authorization Tests

### 3.1 RBAC Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-AUTHZ-001 | Admin access /users | 200 |
| TC-AUTHZ-002 | Accountant access /users | 403 FORBIDDEN |
| TC-AUTHZ-003 | User access /users | 403 FORBIDDEN |
| TC-AUTHZ-004 | Admin access /contacts | 200 |
| TC-AUTHZ-005 | Accountant access /contacts | 200 |
| TC-AUTHZ-006 | User access /contacts | 403 FORBIDDEN |
| TC-AUTHZ-007 | Admin access /invoices | 200 |
| TC-AUTHZ-008 | Accountant access /invoices | 200 |
| TC-AUTHZ-009 | User access /invoices (own) | 200 |
| TC-AUTHZ-010 | User access /invoices (other) | 403 FORBIDDEN |
| TC-AUTHZ-011 | Admin confirm invoice | 200 |
| TC-AUTHZ-012 | Accountant confirm invoice | 200 |
| TC-AUTHZ-013 | User confirm invoice | 403 FORBIDDEN |

### 3.2 IDOR Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-IDOR-001 | User access own invoice | 200 |
| TC-IDOR-002 | User access other's invoice | 403 FORBIDDEN |
| TC-IDOR-003 | User access own payment | 200 |
| TC-IDOR-004 | User access other's payment | 403 FORBIDDEN |

## 4. Contact Tests

### 4.1 CRUD Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-CON-001 | Create contact with valid data | 201 |
| TC-CON-002 | Create contact with duplicate email | 409 DUPLICATE_EMAIL |
| TC-CON-003 | Create contact without name | 400 VALIDATION_ERROR |
| TC-CON-004 | List contacts with pagination | 200, paginated |
| TC-CON-005 | Get contact by ID | 200 |
| TC-CON-006 | Update contact | 200 |
| TC-CON-007 | Update contact with duplicate email | 409 DUPLICATE_EMAIL |

## 5. Product Tests

### 5.1 CRUD Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-PRD-001 | Create product with valid data | 201 |
| TC-PRD-002 | Create product with negative price | 400 VALIDATION_ERROR |
| TC-PRD-003 | Create product with on-the-fly category | 201 |
| TC-PRD-004 | List products with pagination | 200, paginated |
| TC-PRD-005 | Get product by ID | 200 |
| TC-PRD-006 | Update product | 200 |

## 6. Budget Tests

### 6.1 State Machine Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-BUD-001 | Create budget (draft) | 201, status=draft |
| TC-BUD-002 | Confirm budget with committed amount | 200, status=confirmed |
| TC-BUD-003 | Confirm budget without committed amount | 400 AMOUNT_REQUIRED |
| TC-BUD-004 | Revise confirmed budget | 201, new budget (draft) |
| TC-BUD-005 | Cancel draft budget | 200, status=cancelled |
| TC-BUD-006 | Cannot confirm already confirmed budget | 400 INVALID_TRANSITION |
| TC-BUD-007 | Cannot cancel already cancelled budget | 400 INVALID_TRANSITION |

## 7. Invoice Tests

### 7.1 CRUD Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-INV-001 | Create invoice with valid data | 201 |
| TC-INV-002 | Create invoice without customer | 400 CUSTOMER_REQUIRED |
| TC-INV-003 | Create invoice without lines | 400 LINES_REQUIRED |
| TC-INV-004 | List invoices with pagination | 200, paginated |

### 7.2 State Machine Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-INV-005 | Confirm draft invoice | 200, status=confirmed, JE created |
| TC-INV-006 | Confirm already confirmed invoice | 400 ALREADY_CONFIRMED |
| TC-INV-007 | Cancel draft invoice | 200, status=cancelled |
| TC-INV-008 | Cancel confirmed invoice | 400 INVALID_TRANSITION |
| TC-INV-009 | Pay confirmed invoice | 200, amount_due reduced |
| TC-INV-010 | Pay with amount > amount_due | 400 OVERPAYMENT_NOT_ALLOWED |
| TC-INV-011 | Pay with amount <= 0 | 400 INVALID_AMOUNT |
| TC-INV-012 | Full payment sets status=paid | 200, status=paid |

### 7.3 Journal Entry Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-INV-013 | Confirm creates balanced JE | debit = credit |
| TC-INV-014 | JE lines: Debtor (debit) + Sales (credit) | Correct accounts |
| TC-INV-015 | JE linked to invoice | journal_entry_id set |

## 8. Bill Tests

### 8.1 CRUD Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-BIL-001 | Create bill with valid data | 201 |
| TC-BIL-002 | Create bill without vendor | 400 VENDOR_REQUIRED |
| TC-BIL-003 | Create bill without lines | 400 LINES_REQUIRED |
| TC-BIL-004 | List bills with pagination | 200, paginated |

### 8.2 State Machine Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-BIL-005 | Confirm draft bill | 200, status=confirmed, JE created |
| TC-BIL-006 | Confirm already confirmed bill | 400 ALREADY_CONFIRMED |
| TC-BIL-007 | Cancel draft bill | 200, status=cancelled |
| TC-BIL-008 | Cancel confirmed bill | 400 INVALID_TRANSITION |
| TC-BIL-009 | Pay confirmed bill | 200, amount_due reduced |
| TC-BIL-010 | Pay with amount > amount_due | 400 OVERPAYMENT_NOT_ALLOWED |
| TC-BIL-011 | Pay with amount <= 0 | 400 INVALID_AMOUNT |
| TC-BIL-012 | Full payment sets status=paid | 200, status=paid |

### 8.3 Journal Entry Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-BIL-013 | Confirm creates balanced JE | debit = credit |
| TC-BIL-014 | JE lines: Purchase (debit) + Creditor (credit) | Correct accounts |
| TC-BIL-015 | JE linked to bill | journal_entry_id set |

## 9. Journal Entry Tests

### 9.1 Validation Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-JE-001 | Create balanced JE | 201 |
| TC-JE-002 | Create unbalanced JE | 400 UNBALANCED_JOURNAL |
| TC-JE-003 | JE with lines | Lines created |
| TC-JE-004 | JE without lines | 400 LINES_REQUIRED |

## 10. Report Tests

### 10.1 P&L Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-RPT-001 | P&L with no transactions | Income=0, Expenses=0 |
| TC-RPT-002 | P&L with transactions | Correct totals |
| TC-RPT-003 | P&L by year filter | Correct date range |

### 10.2 Balance Sheet Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-RPT-004 | BS with no transactions | Assets=0, Liabilities=0 |
| TC-RPT-005 | BS with transactions | Correct totals |
| TC-RPT-006 | BS balances | Assets = Liabilities |
| TC-RPT-007 | BS by year filter | Correct date range |

### 10.3 Budget Report Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-RPT-008 | Budget report with no budgets | Empty list |
| TC-RPT-009 | Budget report with budgets | Correct achievement |
| TC-RPT-010 | Budget achievement calculation | Correct percentage |

## 11. Security Tests

### 11.1 Authentication Security

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-SEC-001 | Password stored as hash | Not plaintext |
| TC-SEC-002 | JWT in HttpOnly cookie | Not in response body |
| TC-SEC-003 | Cookie Secure flag | true in production |
| TC-SEC-004 | Cookie SameSite | Strict |

### 11.2 Rate Limiting

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| TC-SEC-005 | 6 login attempts in 1 minute | 429 RATE_LIMITED |
| TC-SEC-006 | 4 signups in 1 hour | 429 RATE_LIMITED |

---

*Document generated from frozen test strategy on 2026-09-05*
