# Urban Furniture Accounting Management System

A full-featured accounting management system for urban furniture businesses, providing role-based access to financial operations including invoicing, bill management, journal entries, budgeting, and financial reporting.

## Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (HttpOnly Cookie)
- **Frontend:** React (via Lovable)

## Features

- Role-based access (Admin, Accountant, User)
- Customer/Vendor management
- Sales Order → Invoice → Payment workflow
- Purchase Order → Bill → Payment workflow
- Budget tracking with achievement calculation
- Financial reports (P&L, Balance Sheet, Budget Report)
- Double-entry accounting with automatic journal entries

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

## Documentation

All engineering documents are in the `docs/` folder.

## License

MIT
