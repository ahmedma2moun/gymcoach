# Antigravity Gym — Architecture Documentation Index

Antigravity Gym is a full-stack gym management web app where coaches (admins) assign workout plans to members, who track exercise completion and weight progression over time.

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users (Browser)                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
                   ┌────────────▼────────────┐
                   │     Vercel Edge CDN      │
                   │  Static hosting + Routing│
                   └──────┬──────────┬────────┘
                          │          │ /api/* rewrites
               ┌──────────▼──┐  ┌───▼─────────────────┐
               │  React SPA  │  │  Express API Server   │
               │  (src/)     │  │  (api/ → server/)     │
               │  Port 5173  │  │  Port 3000 (local)    │
               └─────────────┘  └──────────┬────────────┘
                                           │ Mongoose ODM
                                 ┌─────────▼───────────┐
                                 │   MongoDB Atlas      │
                                 │  cluster0.bdhlsff    │
                                 └─────────────────────┘
```

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Deployment | Vercel | Zero-config; serverless API via `api/` adapter |
| Database | MongoDB Atlas | Flexible schema for evolving exercise/plan data |
| Auth | Username/password + localStorage | Simple; no third-party auth dependencies |
| Build | Vite (rolldown-vite 7.2.5) | Fast HMR; bundler-agnostic plugin API |
| ORM | Mongoose 9.0.1 | Schema validation, pre-save hooks for bcrypt |
| Routing | React Router DOM 7.10.1 | Client-side role-based routing |

## Reading Order by Role

| Role | Start Here |
|---|---|
| **New developer** | This index → SYSTEM_ARCHITECTURE.md → DATA_ARCHITECTURE.md → API_SPECIFICATIONS.md |
| **Ops / Deploy** | DEPLOYMENT_GUIDE.md → INFRASTRUCTURE.md |
| **Security reviewer** | SECURITY_ARCHITECTURE.md → API_SPECIFICATIONS.md |
| **Frontend dev** | SYSTEM_ARCHITECTURE.md → API_SPECIFICATIONS.md |

## Documents

| File | Contents |
|---|---|
| [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) | Component diagram, request flows, tech stack matrix, ADRs |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Vercel config, local dev setup, environment matrix |
| [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) | Auth flows, RBAC, STRIDE model, known security gaps |
| [DATA_ARCHITECTURE.md](DATA_ARCHITECTURE.md) | MongoDB schemas, data flows, exercise history patterns |
| [API_SPECIFICATIONS.md](API_SPECIFICATIONS.md) | All REST endpoints with request/response contracts |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Logging patterns, error handling, health check status |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Vercel deploy, local run, environment variables |
| [NETWORK_TOPOLOGY.md](NETWORK_TOPOLOGY.md) | Port map, proxy config, traffic flows |
