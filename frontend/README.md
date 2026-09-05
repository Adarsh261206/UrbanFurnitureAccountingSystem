# Urban Furniture Accounting System — Frontend

Accounting ERP frontend for Urban Furniture: sales, purchase, journal entries,
payments and financial reports.

## Stack

- TanStack Start + React + TypeScript
- Tailwind CSS v4
- Axios + TanStack Query
- Backend: Express + Prisma + PostgreSQL (see `../backend`)

## Development

```sh
npm install
npm run dev
```

The app runs at the URL printed by Vite (default `http://localhost:5173`).
The backend must be running on `http://localhost:3000` (see `../backend/.env`).

## Structure

```
src/
├── components/   shared UI (common, layout, domain, ui primitives)
├── routes/       TanStack file-based routes
├── services/     typed API clients (single axios instance in lib/api/client.ts)
├── lib/          api client, error normalization, auth context, formatting
└── types/        canonical API types (snake_case backend contract)
```

## Build

```sh
npm run build       # production build
npm run lint        # eslint
```