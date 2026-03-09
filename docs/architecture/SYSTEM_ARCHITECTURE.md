# System Architecture

## Executive Summary

Antigravity Gym is a coach-member workout management platform. Coaches create and assign exercise plans to members; members track completions, log weights, and review their progress history. The system is a monolithic full-stack JavaScript application: a React SPA frontend served by Vercel's CDN, backed by a single Express.js API deployed as a Vercel serverless function, connected to a MongoDB Atlas cloud database.

## C4 Level 1 — System Context

```
┌─────────────────────────────────────────────────────────────┐
│                      Antigravity Gym                        │
│                                                             │
│  ┌──────────────┐        ┌──────────────────────────────┐  │
│  │  React SPA   │◄──────►│   Express REST API           │  │
│  │  (Frontend)  │        │   (Serverless / Vercel)      │  │
│  └──────────────┘        └──────────────┬───────────────┘  │
│                                         │                   │
│                              ┌──────────▼──────────┐        │
│                              │  MongoDB Atlas       │        │
│                              └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
      ▲                                        ▲
      │ Uses (browser)                         │ Connects (network)
  ┌───┴──────┐                         ┌───────┴─────────┐
  │  Coach   │                         │   MongoDB Cloud  │
  │  Member  │                         │   (Atlas SaaS)   │
  └──────────┘                         └─────────────────┘
```

## C4 Level 2 — Container Diagram

```
┌──────────────────── Vercel Platform ───────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               React SPA (src/)                       │  │
│  │                                                       │  │
│  │  ┌────────────┐  ┌───────────┐  ┌────────────────┐  │  │
│  │  │ AuthContext│  │App Router │  │  Components     │  │  │
│  │  │(localStorage│  │(RR DOM 7) │  │  Admin/User    │  │  │
│  │  │  session)  │  │           │  │  Dashboard     │  │  │
│  │  └────────────┘  └───────────┘  └────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                            │ fetch /api/*                   │
│  ┌─────────────────────────▼───────────────────────────┐  │
│  │          Express API Server (server/index.js)         │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │  │
│  │  │  /login  │  │ /users   │  │ /plans  /exercises  │ │  │
│  │  │  (auth)  │  │ (admin)  │  │ (core domain)       │ │  │
│  │  └──────────┘  └──────────┘  └────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │  Mongoose ODM → MongoDB Atlas                 │    │  │
│  │  │  Models: User, Plan, Exercise                 │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │        MongoDB Atlas          │
              │  Collections: users, plans,  │
              │  exercises                   │
              └─────────────────────────────┘
```

## Primary Request Flow — Member Logs Exercise Weight

```
Browser          React SPA        Express API      MongoDB Atlas
   │                │                  │                 │
   │─ Click Done ──►│                  │                 │
   │                │─ PATCH /api/plans/:planId ────────►│
   │                │  { exerciseIndex, done: true,      │
   │                │    weightKg, weightLbs, userNote } │
   │                │                  │─ Plan.findOne ─►│
   │                │                  │◄── plan doc ────│
   │                │                  │─ plan.save() ──►│
   │                │                  │◄── saved doc ───│
   │                │◄── updated plan ─│                 │
   │◄─ UI update ───│                  │                 │
```

## Technology Stack Matrix

| Component | Package | Version | Purpose |
|---|---|---|---|
| Frontend framework | react | 19.2.0 | UI rendering |
| Frontend framework | react-dom | 19.2.0 | DOM bindings |
| Client routing | react-router-dom | 7.10.1 | SPA navigation, protected routes |
| Build tool | rolldown-vite | 7.2.5 | Dev server, bundling, HMR |
| Backend framework | express | 5.2.1 | REST API, routing, middleware |
| ODM | mongoose | 9.0.1 | MongoDB schema validation, queries |
| Password hashing | bcryptjs | 3.0.3 | bcrypt (10 rounds) for User passwords |
| Body parsing | body-parser | 2.2.1 | JSON request body parsing |
| CORS | cors | 2.8.5 | Cross-origin requests (open policy) |
| Env config | dotenv | 17.2.3 | Load MONGO_URI from .env |
| Test runner | vitest | 4.0.15 | Unit/component tests |
| Test utilities | @testing-library/react | 16.3.0 | React component testing |
| DOM simulation | jsdom | 27.3.0 | Browser environment for tests |

## Architecture Decision Records

### ADR-001: Single Express File for All Routes

**Decision**: All API routes live in `server/index.js` (~415 lines).

**Rationale**: Small scope; separating routes into files adds overhead without benefit at this scale.

**Trade-off**: As the app grows, `server/index.js` will become hard to maintain. If the endpoint count exceeds ~20 routes, extract into `server/routes/` modules.

### ADR-002: Vercel Serverless via api/ Adapter

**Decision**: `api/index.js` re-exports the Express app; `vercel.json` routes `/api/*` to it.

**Rationale**: Vercel's serverless functions require a default export. The adapter pattern lets the same Express app run locally (via `node server/index.js`) and on Vercel.

**Trade-off**: Cold starts affect first-request latency. `connectDB()` is called per-request as a safeguard.

### ADR-003: LocalStorage for Session State

**Decision**: After login, the server returns the full user object (minus password); the client stores it in `localStorage` as `gym_user`.

**Rationale**: Simplest approach; avoids JWT infrastructure.

**Trade-off**: No server-side session invalidation. A deactivated user can continue using a cached session until they clear localStorage or their browser. See SECURITY_ARCHITECTURE.md.

### ADR-004: Numeric ID Field Alongside MongoDB _id

**Decision**: Each document has a numeric `id` field (set to `Date.now()`) used by the frontend for API calls.

**Rationale**: Migrated from a JSON-file backend; keeping the numeric ID avoided a full frontend refactor.

**Trade-off**: Risk of ID collision on rapid creation (millisecond-level). Should migrate to use MongoDB `_id` (ObjectId) in a future refactor.

## Cross-Cutting Concerns

| Concern | Implementation |
|---|---|
| **Auth** | Custom username/password; session in localStorage; no middleware guards on API routes |
| **Configuration** | `dotenv` loads `.env`; only `MONGO_URI` is required |
| **Error handling** | try/catch per route; `console.error` logging; generic 500 responses |
| **CORS** | Open (`cors()` with no options) — all origins allowed |
| **Password storage** | bcryptjs 10-round hash via Mongoose pre-save hook |
