# 07 — Backend Specification

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Frozen Architecture Decisions  
> **Date:** 2026-09-05

---

## 1. Technology Stack

| Component | Technology | Version | Frozen Decision |
|-----------|-----------|---------|-----------------|
| Runtime | Node.js | 18+ | LTS |
| Framework | Express.js | 4.x | REST API |
| Database | PostgreSQL | 15+ | Primary DB |
| ORM | Prisma | Latest | ONLY ORM |
| Auth | JWT | jsonwebtoken | HttpOnly cookie |
| Validation | express-validator | Latest | Input validation |
| Security | bcrypt | 12+ rounds | Password hashing |

**FROZEN:** Prisma is the ONLY ORM. Never use `pg` directly. Never return JWT in response body.

## 2. Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts         # Prisma client
│   │   └── auth.ts             # JWT config
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification (HttpOnly cookie)
│   │   ├── authorize.ts        # Role-based access
│   │   ├── validate.ts         # Input validation
│   │   └── errorHandler.ts     # Global error handler
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── contacts.routes.ts
│   │   ├── products.routes.ts
│   │   ├── analyticals.routes.ts
│   │   ├── budgets.routes.ts
│   │   ├── chartOfAccounts.routes.ts
│   │   ├── journals.routes.ts
│   │   ├── journalEntries.routes.ts
│   │   ├── salesOrders.routes.ts
│   │   ├── invoices.routes.ts
│   │   ├── purchaseOrders.routes.ts
│   │   ├── bills.routes.ts
│   │   ├── payments.routes.ts
│   │   └── reports.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── contacts.controller.ts
│   │   ├── products.controller.ts
│   │   ├── analyticals.controller.ts
│   │   ├── budgets.controller.ts
│   │   ├── chartOfAccounts.controller.ts
│   │   ├── journals.controller.ts
│   │   ├── journalEntries.controller.ts
│   │   ├── salesOrders.controller.ts
│   │   ├── invoices.controller.ts
│   │   ├── purchaseOrders.controller.ts
│   │   ├── bills.controller.ts
│   │   ├── payments.controller.ts
│   │   └── reports.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── contacts.service.ts
│   │   ├── products.service.ts
│   │   ├── analyticals.service.ts
│   │   ├── budgets.service.ts
│   │   ├── chartOfAccounts.service.ts
│   │   ├── journals.service.ts
│   │   ├── journalEntries.service.ts
│   │   ├── salesOrders.service.ts
│   │   ├── invoices.service.ts
│   │   ├── purchaseOrders.service.ts
│   │   ├── bills.service.ts
│   │   ├── payments.service.ts
│   │   └── reports.service.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── contacts.validator.ts
│   │   ├── products.validator.ts
│   │   ├── budgets.validator.ts
│   │   ├── invoices.validator.ts
│   │   ├── bills.validator.ts
│   │   └── journalEntries.validator.ts
│   ├── utils/
│   │   ├── errors.ts           # AppError classes
│   │   ├── sequences.ts        # Number generation
│   │   └── helpers.ts          # Utility functions
│   └── app.ts                  # Express app setup
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
├── package.json
└── tsconfig.json
```

## 3. Middleware

### 3.1 Auth Middleware (Frozen)

```typescript
// Reads JWT from HttpOnly cookie ONLY
const authenticate = (req, res, next) => {
  const token = req.cookies.auth_token;  // NEVER from header
  
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};
```

### 3.2 Authorization Middleware (Frozen)

```typescript
const authorize = (...roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
};
```

### 3.3 Validation Middleware

```typescript
const validate = (schema) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() } });
    }
    next();
  };
};
```

## 4. Controllers

### 4.1 Auth Controller

```typescript
// POST /auth/login
const login = async (req, res) => {
  const { login_id, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { login_id } });
  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid Login Id or Password');
  }
  
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/api',
    maxAge: 86400
  });
  
  res.json({ id: user.id, name: user.name, login_id: user.login_id, email: user.email, role: user.role });
};
```

### 4.2 Invoice Controller

```typescript
// POST /invoices/:id/confirm
const confirmInvoice = async (req, res) => {
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.customerInvoice.findUnique({ where: { id: req.params.id } });
    
    if (invoice.status !== 'draft') {
      throw new AppError('ALREADY_CONFIRMED', 'Invoice already confirmed');
    }
    
    // Create journal entry
    const je = await tx.journalEntry.create({
      data: {
        journal_id: salesJournal.id,
        accounting_date: invoice.invoice_date,
        entry_number: await generateJENumber(),
        reference: invoice.invoice_reference,
        status: 'posted'
      }
    });
    
    // Create JE lines
    await tx.journalEntryLine.createMany({
      data: [
        { journal_entry_id: je.id, account_id: debtorsAccount.id, debit: invoice.total_amount, credit: 0, partner_id: invoice.customer_id },
        { journal_entry_id: je.id, account_id: salesIncomeAccount.id, debit: 0, credit: invoice.total_amount }
      ]
    });
    
    // Update invoice status
    await tx.customerInvoice.update({
      where: { id: req.params.id },
      data: { status: 'confirmed', journal_entry_id: je.id }
    });
  });
  
  res.json({ message: 'Invoice confirmed' });
};
```

## 5. Services

### 5.1 Sequence Generation (Frozen)

```typescript
async function generateSONumber(): Promise<string> {
  const result = await prisma.$queryRaw`SELECT nextval('so_number_seq') as next`;
  return `S${String(result[0].next).padStart(5, '0')}`;
}

async function generateInvoiceReference(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await prisma.$queryRaw`SELECT nextval('invoice_reference_seq') as next`;
  return `INV/${year}/${String(result[0].next).padStart(4, '0')}`;
}
```

## 6. Error Handling

### 6.1 AppError Classes

```typescript
class AppError extends Error {
  code: string;
  statusCode: number;
  field?: string;
  
  constructor(code: string, message: string, statusCode: number = 400, field?: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
  }
}
```

### 6.2 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "field": "email",
    "details": {}
  }
}
```

## 7. Database Connection

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

export default prisma;
```

## 8. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/urban_furniture

# Auth
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=15m

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

*Document generated from frozen architecture decisions on 2026-09-05*
