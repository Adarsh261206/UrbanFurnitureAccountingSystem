# 24 — Lovable Integration Guide

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Overview

This guide defines how a Lovable-generated frontend must consume the backend API. The frontend must NOT guess API behavior — all contracts are defined in this document.

---

## 2. Environment Variables

```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 3. API Client Configuration

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // CRITICAL: sends cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## 4. Authentication Behavior

### 4.1 Login

```typescript
// POST /auth/login
// Request: { login_id, password }
// Response: { user: { id, name, login_id, email, role } }
// Cookie: auth_token set automatically by browser

const login = async (loginId: string, password: string) => {
  const response = await api.post('/auth/login', { login_id: loginId, password });
  setUser(response.data.user);  // Store user object, NOT token
};
```

### 4.2 Logout

```typescript
// POST /auth/logout
// Response: { message: "Logged out successfully" }
// Cookie: auth_token cleared automatically

const logout = async () => {
  await api.post('/auth/logout');
  setUser(null);
};
```

### 4.3 Check Session

```typescript
// GET /auth/me
// Response: { id, name, login_id, email, role }

const checkSession = async () => {
  try {
    const response = await api.get('/auth/me');
    setUser(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      setUser(null);
    }
  }
};
```

---

## 5. Request Headers

| Header | Value | When |
|--------|-------|------|
| Content-Type | application/json | Always |
| Cookie | auth_token=<jwt> | Automatic (browser sends) |

**DO NOT set Authorization header.** Cookie-based auth only.

---

## 6. Response Format

### 6.1 Success Response

```json
{
  "id": "uuid",
  "name": "string",
  ...
}
```

### 6.2 List Response

```json
{
  "contacts": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### 6.3 Error Response

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

## 7. Date Handling

- All dates in API responses use ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`
- Date inputs should be sent as `YYYY-MM-DD`
- Timestamps include time zone information

---

## 8. Money Handling

- All monetary values are numbers with 2 decimal places
- Example: `10000.00` not `10000` or `10000.0`
- Display with locale formatting: `₹10,000.00`

---

## 9. Enum Handling

All enums are lowercase strings:

| Field | Values |
|-------|--------|
| role | admin, accountant, user |
| product_type | goods, service, combo |
| account_type | asset, liability, bank, capital, cash, income, expense |
| budget_type | income, expense |
| budget_status | draft, confirmed, revised, cancelled |
| invoice_status | draft, confirmed, paid |
| payment_type | receive, send |
| payment_via | bank, cash |
| payment_status | draft, confirmed, successful |

---

## 10. Pagination

```typescript
// Query params
?page=1&limit=20

// Response
{
  "contacts": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## 11. Filtering

```typescript
// Status filter
?status=draft

// Type filter
?type=income

// Search
?search=keyword

// Customer filter
?customer_id=uuid
```

---

## 12. Sorting

```typescript
?sort=name&order=asc
?sort=created_at&order=desc
```

---

## 13. Optimistic UI Rules

- **DO NOT** optimistically update UI for financial operations
- **DO** wait for server response before updating UI
- **DO** show loading state during API calls
- **DO** show error state on failure

---

## 14. Cache Invalidation

| Action | Invalidate |
|--------|------------|
| Create entity | List endpoint for that entity |
| Update entity | List endpoint + detail endpoint |
| Delete entity | List endpoint |
| Confirm document | List endpoint + detail endpoint |
| Pay document | List endpoint + detail endpoint + report endpoints |

---

## 15. Retry Rules

| Operation | Retryable | Behavior |
|-----------|-----------|----------|
| GET | Yes | Safe to retry |
| POST (create) | No | May create duplicate |
| PUT (update) | Yes | Idempotent |
| POST (confirm) | Yes | Idempotent (check status) |
| POST (pay) | Yes | Idempotent (check payment) |

---

## 16. Unauthorized Behavior

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid
      setUser(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 17. Forbidden Behavior

```typescript
if (error.response?.status === 403) {
  // Show "Access Denied" message
  // Do NOT redirect
  showError('You do not have permission to perform this action');
}
```

---

## 18. File Upload

```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data.url;
};
```

**Allowed MIME types:** image/jpeg, image/png, image/gif, image/webp
**Max file size:** 5MB

---

## 19. IDOR Prevention

- Frontend MUST NOT construct URLs with arbitrary UUIDs
- Frontend MUST use IDs returned from previous API calls
- Example: Use customer_id from invoice response, not user-input UUID

---

*Document generated from Lovable integration analysis on 2026-09-05*
