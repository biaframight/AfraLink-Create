# AfraLink

AfraLink is a transportation and logistics marketplace PWA for Southern Nigeria that connects customers with drivers, car rental owners, and logistics operators — no payment processing, customers contact providers directly.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/afralink run dev` — run the frontend (port 19602)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, paths `/api`)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Wouter routing, TanStack Query
- Auth: Replit OpenID Connect via `@workspace/replit-auth-web`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/auth.ts` — **single source of truth** for `usersTable` (includes AfraLink fields: role, fullName, phone, state, city, etc.)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for API shape)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `artifacts/api-server/src/routes/` — all route handlers
- `artifacts/afralink/src/pages/` — all frontend pages
- `artifacts/afralink/src/index.css` — green+slate palette CSS variables

## Architecture decisions

- **No payment processing** — customers contact drivers/owners via phone or WhatsApp directly from the app
- **Four roles**: customer, driver, rental_owner, admin — stored on `usersTable.role`
- **usersTable** is ONLY in `lib/db/src/schema/auth.ts` (users.ts was deleted to avoid duplicate export conflicts)
- **WhatsApp links**: `https://wa.me/234${phone.replace(/^(\+234|0)/, "")}?text=...`
- **Orval mutation signatures**: creates → `mutate({data:{...}})`, updates → `mutate({id, data:{...}})`, approvals → `mutate({id})`
- **File uploads**: `useRequestUploadUrl().mutateAsync({data:{name,size,contentType}})` → `{uploadURL, objectPath}` → PUT file to uploadURL
- **States/cities API** returns `{name, id}` objects (not `{state}` or `{city}` strings)
- **SelectItem** cannot have empty string value — use sentinel values or omit

## Product

- **Home**: Hero search (state/city/type), category grid, featured drivers, how-it-works, CTA
- **Find Drivers** (`/drivers`): Filterable grid with state/city/vehicle-type filters, pagination, call/WhatsApp/view buttons
- **Driver Detail** (`/drivers/:id`): Profile, vehicle info, reviews, booking request form
- **Car Rentals** (`/rentals`): Photo gallery grid, filterable, pricing, contact
- **Rental Detail** (`/rentals/:id`): Photo carousel, specs, pricing, contact owner, reviews
- **Customer Dashboard** (`/dashboard`): Booking history with tabs, cancel pending, stats
- **Driver Dashboard** (`/driver-dashboard`): Toggle availability, incoming requests (accept/reject), profile completeness
- **Become a Driver** (`/become-driver`): 3-step form (personal info → vehicle info → document uploads)
- **List a Vehicle** (`/list-vehicle`): Full rental listing form with photo upload (up to 5), pricing tiers
- **Profile** (`/profile`): Edit profile, photo upload, role selector, state/city picker
- **Admin** (`/admin`): Stats dashboard, pending drivers/rentals approval queue with accept/reject
- **Auth**: Replit OIDC, all protected routes require login

## Gotchas

- `identity` columns in DB schema must NOT be in `.omit({id:true})` in createInsertSchema calls
- Do NOT add non-composite libs (`replit-auth-web`, `object-storage-web`) to `references` in `afralink/tsconfig.json`
- `framer-motion` and `recharts` are imported in pages — both are installed
- Vite `resolve.dedupe: ["react","react-dom"]` is already set
- Southern Nigeria location data (17 states, ~130 cities) is seeded in the DB

## User preferences

_Populate as you build._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
