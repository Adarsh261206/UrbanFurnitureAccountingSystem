# 22 — Authentication and Session

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Authentication Architecture

### 1.1 Canonical Approach

**HttpOnly Cookie Authentication ONLY**

- JWT is NEVER returned in response body
- Frontend stores only non-sensitive user state (id, name, role)
- Browser automatically sends cookie with requests

### 1.2 Flow

```
1. POST /auth/login { login_id, password }
2. Backend validates credentials
3. Backend generates JWT (15 min expiry)
4. Backend sets cookie:
   Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400
5. Response 200: { "user": { "id", "name", "login_id", "email", "role" } }
6. Frontend stores user object in state (NOT token)
7. Subsequent requests: browser sends cookie automatically
```

---

## 2. Signup

| Property | Value |
|----------|-------|
| Endpoint | POST /api/v1/auth/signup |
| Request | `{ "login_id", "email", "password", "confirm_password" }` |
| Response | 201: `{ "id", "name": null, "login_id", "email", "role": "user" }` |
| Validation | login_id unique (6-12 chars), email unique, password complexity, passwords match |
| Side Effects | Creates user with role='user', NO cookie set |
| Redirect | Frontend redirects to login page |

---

## 3. Login

| Property | Value |
|----------|-------|
| Endpoint | POST /api/v1/auth/login |
| Request | `{ "login_id", "password" }` |
| Response | 200: `{ "user": { "id", "name", "login_id", "email", "role" } }` |
| Cookie | Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400 |
| Error | 401: `{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid Login Id or Password" } }` |
| Rate Limit | 5 attempts per minute per IP |

---

## 4. Logout

| Property | Value |
|----------|-------|
| Endpoint | POST /api/v1/auth/logout |
| Response | 200: `{ "message": "Logged out successfully" }` |
| Side Effects | Clears auth_token cookie (Max-Age=0) |

---

## 5. Session Validation

| Property | Value |
|----------|-------|
| Endpoint | GET /api/v1/auth/me |
| Cookie | auth_token required |
| Response | 200: User object |
| Error | 401 if no cookie or invalid/expired JWT |

---

## 6. JWT Configuration

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Secret | Process.env.JWT_SECRET (≥32 chars) |
| Expiry | 15 minutes |
| Payload | `{ sub: user_id, role, iat, exp }` |

---

## 7. Cookie Configuration

| Setting | Value |
|---------|-------|
| Name | auth_token |
| HttpOnly | true |
| Secure | true (production) |
| SameSite | Strict |
| Path | /api |
| Max-Age | 86400 (24 hours) |
| Domain | Same as backend |

---

## 8. Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum length | 8 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Special character | At least 1 |
| Storage | bcrypt hash (cost factor ≥ 12) |
| Uniqueness | NOT enforced (per ED-003) |

---

## 9. CSRF Protection

| Mechanism | SameSite=Strict cookie attribute |
|-----------|----------------------------------|
| Additional | None required for SameSite=Strict |
| Token | Not needed (cookie-based, SameSite protects) |

---

## 10. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 attempts | 1 minute per IP |
| POST /auth/signup | 3 attempts | 1 hour per IP |
| POST /auth/forgot-password | 3 attempts | 1 hour per IP |
| General API | 100 requests | 1 minute per user |

---

## 11. Brute Force Protection

| Mechanism | Implementation |
|-----------|----------------|
| Rate limiting | 5 login attempts per minute per IP |
| Account lockout | NOT implemented (hackathon) |
| Progressive delay | NOT implemented (hackathon) |

---

## 12. Forgot Password

| Property | Value |
|----------|-------|
| Endpoint | POST /api/v1/auth/forgot-password |
| Request | `{ "email": "string" }` |
| Response | 200: `{ "message": "If the email exists, a reset link has been sent" }` |
| Implementation | Mock (no actual email sent) |
| Token generation | NOT implemented (hackathon) |

---

## 13. Token Revocation

| Scenario | Behavior |
|----------|----------|
| Logout | Cookie cleared (Max-Age=0) |
| Password change | All sessions invalidated (post-hackathon) |
| Account deactivation | All sessions invalidated (post-hackathon) |
| JWT expiry | Automatic (15 min) |

---

## 14. Frontend Integration

### 14.1 API Client Configuration

```javascript
const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,  // CRITICAL: sends cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 14.2 Response Interceptor

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 14.3 What Frontend Stores

```javascript
// After login
const [user, setUser] = useState(null);

// User object (NO token)
{
  id: "uuid",
  name: "string",
  login_id: "string",
  email: "string",
  role: "admin | accountant | user"
}
```

### 14.4 What Frontend NEVER Stores

- JWT token
- Authorization header
- Password

---

*Document generated from authentication analysis on 2026-09-05*
