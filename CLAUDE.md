# Antigravity Gym

Full-stack gym management app: coaches create and assign workout plans to members; members track exercise completions and weight history. React SPA + Express.js API + MongoDB Atlas, deployed on Vercel.

## Quick Reference

- **Stack**: JavaScript (ESM), React 19.2.0, Express 5.2.1, Mongoose 9.0.1, MongoDB Atlas, Vite (rolldown-vite 7.2.5)
- **Architecture**: Monorepo — React SPA (`src/`) + Express API (`server/`) + Vercel adapter (`api/`)
- **Docs**: See `docs/architecture/INDEX.md` for full architecture documentation

## Build & Run

- `npm install` — Install dependencies
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
| Express API | `server/index.js` | All REST routes (~415 lines) |
| Vercel adapter | `api/index.js` | Re-exports Express app for serverless |
| DB connection | `server/db.js` | Mongoose + dotenv MONGO_URI |
| Models | `server/models/` | User, Plan, Exercise (Mongoose schemas) |
| Mobile app | `mobile/` | React Native Android (experimental, no package.json) |

## Code Patterns

- **All routes in one file**: `server/index.js` contains every API endpoint. Each handler calls `await connectDB()` at the top (required for serverless cold start).
- **Numeric ID field**: Documents use a `Date.now()` numeric `id` field (legacy from JSON-file era) alongside MongoDB's `_id`. Always use `id` for API lookups, not `_id`.
- **Auth is client-side only**: `AuthContext.jsx` stores user in `localStorage` as `gym_user`. The API has **no auth middleware** — all endpoints are publicly callable.
- **Weight dual-unit**: Exercises store `weightKg` and `weightLbs` (preferred) plus legacy `weight`. Always prefer the `Kg`/`Lbs` fields; the legacy field is for backwards compat.
- **CSS custom properties**: Global design tokens live in `src/index.css` (:root). Use `var(--primary)`, `var(--bg-dark)`, `var(--text-main)` etc. — never hardcode colors.

## Security

- **Auth**: Custom bcrypt username/password login only. No JWT issued; session is localStorage JSON.
- **Secrets**: `MONGO_URI` in `.env` (git-ignored) locally; Vercel Environment Variables in production.
- **Critical**: No API-level authorization. Role enforcement is React-only. Do not add sensitive server logic assuming roles are enforced.
- **Default admin**: `ensureAdmin()` creates `admin`/`admin` on first run. Change this password immediately after deploy.

## Anti-Patterns (Do NOT)

- Do NOT add `type: "module"` scripts under `docs/` or `server/scripts/` — they must be `.cjs` or use `--input-type=commonjs` since the root `package.json` has `"type": "module"`
- Do NOT use MongoDB `_id` for API route params — the app uses the numeric `id` field throughout
- Do NOT assume API routes are protected — there is no auth middleware; never return sensitive data without adding middleware first
- Do NOT hardcode colors in component CSS — always use CSS variables from `src/index.css`
- Do NOT create new standalone JS files in `server/` that use `require()` — use ES module `import` syntax

## Task-Specific Docs

- `docs/architecture/SYSTEM_ARCHITECTURE.md` — System design, ADRs, tech stack matrix
- `docs/architecture/API_SPECIFICATIONS.md` — All REST endpoints with contracts
- `docs/architecture/DATA_ARCHITECTURE.md` — MongoDB schemas and data flows
- `docs/architecture/SECURITY_ARCHITECTURE.md` — Auth flows, STRIDE model, known gaps
- `docs/architecture/DEPLOYMENT_GUIDE.md` — Vercel deploy steps and checklist
- `docs/architecture/INFRASTRUCTURE.md` — Local dev setup, environment matrix
