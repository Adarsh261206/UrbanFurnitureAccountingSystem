# Project Notes

## Tech Stack

- TanStack Start (file-based routing in `src/routes/`) + React + TypeScript
- Tailwind CSS v4, shadcn-style UI primitives in `src/components/ui/`
- Axios API client (`src/lib/api/client.ts`) + TanStack Query
- Backend: Express + Prisma + PostgreSQL (see `../backend`)

## Conventions

- API types live in `src/types/api.ts` (snake_case, backend contract).
- All API calls go through `src/services/*` — components never call axios directly.
- Financial values are backend-authoritative; the frontend only formats them.
- Role checks are centralized in `src/components/guards/RouteGuards.tsx`.