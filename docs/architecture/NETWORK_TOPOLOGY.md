# Network Topology

## Traffic Flow

```
Internet
    │ HTTPS (443)
    ▼
Vercel Edge CDN (global PoPs)
    │
    ├── Request path: /api/*
    │       │
    │       └── Vercel Serverless Function (Node.js)
    │               api/index.js → server/index.js
    │               │
    │               └── MongoDB Atlas (TCP/27017, TLS)
    │                   cluster0.bdhlsff.mongodb.net
    │
    └── Request path: /* (everything else)
            │
            └── Static files from dist/ (React SPA)
                    → Browser receives index.html
                    → React Router handles sub-navigation client-side
```

## Port Map

| Service | Port | Environment | Notes |
|---|---|---|---|
| Vite dev server (frontend) | 5173 | Local only | HMR enabled |
| Express API server | 3000 | Local only | Proxied from Vite |
| MongoDB Atlas | 27017 (TLS) | All | Cloud-hosted; no local port |
| Vercel (production) | 443 | Production | HTTPS only |

## Vite Proxy Configuration (vite.config.js)

```js
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

All `/api/*` requests from the React dev server are proxied to the local Express server. This mirrors the production Vercel rewrite behavior.

## Vercel Routing (vercel.json)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)",     "destination": "/index.html"   }
  ]
}
```

## DNS

DNS is managed by Vercel. The deployment URL is assigned automatically (e.g., `gym-xxxx.vercel.app`). Custom domains can be added via the Vercel dashboard.

## Network Security

| Aspect | Status |
|---|---|
| TLS (HTTPS) | Enforced by Vercel on all traffic |
| CORS | Open — all origins allowed (`cors()` with no options) |
| MongoDB TLS | Enabled — Atlas connection string includes TLS by default |
| API authentication | None — all endpoints accessible without credentials |
| Rate limiting | None |

**Action required**: Restrict CORS to the Vercel deployment domain in production:
```js
app.use(cors({ origin: 'https://your-domain.vercel.app' }));
```
