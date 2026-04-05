# Antigravity Gym

Full-stack gym management app: coaches create and assign workout plans to members; members track exercise completions and weight history. React SPA + Express.js API + PostgreSQL (Supabase), deployed on Vercel.

## Quick Reference

- **Stack**: JavaScript (ESM), React 19.2.0, Express 5.2.1, pg 8.x, PostgreSQL (Supabase), Vite (rolldown-vite 7.2.5)
- **Architecture**: Monorepo — React SPA (`src/`) + Express API (`server/`) + Vercel adapter (`api/`)
- **Docs**: See `docs/architecture/INDEX.md` for full architecture documentation

## Build & Run

- `npm install` — Install dependencies
- `npm run migrate` — Create/update database tables (run once after first clone or schema changes)
- `npm run dev` — Start Vite dev server (port 5173; proxies /api/* → localhost:3000)
- `node server/index.js` — Start Express API server (port 3000)
- `npm run build` — Build React SPA to `dist/`
- `npm run validate` — Build + node syntax check
- `npm test` — Run Vitest tests
- `npm run lint` — ESLint

## Architecture Quick Map

| Layer | Path | Purpose |
|---|---|---|
| React SPA | `src/` | All UI components and routing |
| Express API | `server/index.js` | All REST routes |
| Vercel adapter | `api/index.js` | Re-exports Express app for serverless |
| DB connection | `server/db.js` | pg Pool + dotenv DATABASE_URL |
| Models | `server/models/` | User, Plan, Exercise (SQL query modules) |
| Migrations | `server/migrations/` | SQL migration files (code-first) |
| Migration runner | `server/migrate.js` | Runs pending migrations idempotently |
| Mobile app | `mobile/` | React Native Android (experimental, no package.json) |

## Database Schema

Four tables (all use `BIGINT id = Date.now()` as primary key, matching legacy numeric id pattern):

- **users** — id, username, password (bcrypt), role, is_active, timestamps
- **exercises** — id, name, video_url (exercise library)
- **plans** — id, user_id, title, date, status, timestamps
- **plan_exercises** — id (serial), plan_id (FK→plans), exercise_order (0-based index), name, sets, reps, video_url, done, completed_at, weight, weight_kg, weight_lbs, coach_note, user_note, superset_id

`plan_exercises` normalises what was MongoDB's embedded array. The `exercise_order` column maps 1:1 to the `exerciseIndex` used by `PATCH /api/plans/:planId`.

## Code Patterns

- **All routes in one file**: `server/index.js` contains every API endpoint.
- **Numeric ID field**: All rows use a `Date.now()` BIGINT `id` as PK. Always use this `id` for API lookups.
- **Auth is client-side only**: `AuthContext.jsx` stores user in `localStorage` as `gym_user`. The API has **no auth middleware** — all endpoints are publicly callable.
- **Weight dual-unit**: Exercises store `weightKg` and `weightLbs` (preferred) plus legacy `weight`. Always prefer the `Kg`/`Lbs` fields; the legacy field is for backwards compat.
- **CSS custom properties**: Global design tokens live in `src/index.css` (:root). Use `var(--primary)`, `var(--bg-dark)`, `var(--text-main)` etc. — never hardcode colors.
- **Model modules**: `server/models/*.js` export plain objects (`User`, `Plan`, `Exercise`) with async methods backed by SQL — no ORM.

## Security

- **Auth**: Custom bcrypt username/password login only. No JWT issued; session is localStorage JSON.
- **Secrets**: `DATABASE_URL` in `.env` (git-ignored) locally; Vercel Environment Variables in production.
- **Critical**: No API-level authorization. Role enforcement is React-only. Do not add sensitive server logic assuming roles are enforced.
- **Default admin**: `ensureAdmin()` creates `admin`/`admin` on first run. Change this password immediately after deploy.

## Anti-Patterns (Do NOT)

- Do NOT add `type: "module"` scripts under `docs/` or `server/scripts/` — they must be `.cjs` or use `--input-type=commonjs` since the root `package.json` has `"type": "module"`
- Do NOT use `_id` for API route params — the app uses the numeric `id` BIGINT field throughout
- Do NOT assume API routes are protected — there is no auth middleware; never return sensitive data without adding middleware first
- Do NOT hardcode colors in component CSS — always use CSS variables from `src/index.css`
- Do NOT create new standalone JS files in `server/` that use `require()` — use ES module `import` syntax
- Do NOT use snake_case field names in API responses — model methods alias DB columns to camelCase (e.g. `is_active` → `isActive`, `video_url` → `videoUrl`)

## Task-Specific Docs

- `docs/architecture/SYSTEM_ARCHITECTURE.md` — System design, ADRs, tech stack matrix
- `docs/architecture/API_SPECIFICATIONS.md` — All REST endpoints with contracts
- `docs/architecture/DATA_ARCHITECTURE.md` — MongoDB schemas and data flows
- `docs/architecture/SECURITY_ARCHITECTURE.md` — Auth flows, STRIDE model, known gaps
- `docs/architecture/DEPLOYMENT_GUIDE.md` — Vercel deploy steps and checklist
- `docs/architecture/INFRASTRUCTURE.md` — Local dev setup, environment matrix
