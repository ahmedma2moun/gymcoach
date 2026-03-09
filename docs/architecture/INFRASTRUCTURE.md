# Infrastructure

## Deployment Architecture

```
┌───────────────────────── Vercel ─────────────────────────────┐
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CDN / Edge Network                                    │  │
│  │  - Serves built React SPA (dist/) as static files     │  │
│  │  - Routes /api/* to serverless function               │  │
│  │  - Routes /* to index.html (SPA fallback)             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Serverless Function: api/index.js                       │ │
│  │  - Node.js runtime                                       │ │
│  │  - Re-exports Express app from server/index.js           │ │
│  │  - Stateless; no persistent connections between invokes  │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │        MongoDB Atlas          │
              │  Free tier / M0 cluster      │
              │  cluster0.bdhlsff.mongodb.net│
              └─────────────────────────────┘
```

## Vercel Configuration (vercel.json)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)",     "destination": "/index.html"   }
  ]
}
```

- All `/api/*` paths route to the serverless function
- All other paths serve `index.html` (React Router handles client-side routing)

## Build Process

| Step | Command | Output |
|---|---|---|
| Install deps | `npm install` | `node_modules/` |
| Build frontend | `npm run build` (vite build) | `dist/` |
| Validate server | `npm run validate` | build + node syntax check |
| Run tests | `npm test` | vitest output |

## Environment Matrix

| Variable | Local Dev | Vercel Production |
|---|---|---|
| `MONGO_URI` | `.env` file (git-ignored) | Vercel Environment Variables UI |
| `NODE_ENV` | Not set (defaults to undefined) | Set by Vercel to `production` |
| API base URL | `http://localhost:3000` (via Vite proxy) | Same origin (`/api/*`) |

## Local Development Setup

**Prerequisites**: Node.js 18+, npm

```bash
# 1. Clone and install
git clone <repo-url>
cd Gym
npm install

# 2. Configure environment
cp .env.example .env        # (create .env.example manually if not present)
# Edit .env: MONGO_URI="mongodb+srv://..."

# 3. Start backend (in one terminal)
node server/index.js        # runs on http://localhost:3000

# 4. Start frontend (in another terminal)
npm run dev                 # runs on http://localhost:5173
# Vite proxies /api/* → http://localhost:3000
```

## Mobile App (mobile/)

The `mobile/` directory contains a React Native Android project. It has no `package.json` at the repository root and appears to be an independent/experimental project. It is not deployed via Vercel. See `mobile/android/` for Android build configuration.

## Known Infrastructure Gaps

- No `.env.example` file — developers must know to create `.env` manually
- No health check endpoint — Vercel cannot verify the serverless function is healthy
- `connectDB()` is called on every API request (necessary for serverless cold start, but adds latency)
- No staging environment — changes go directly from local to production
