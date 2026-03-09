# Deployment Guide

## CI/CD Pipeline

There is no automated CI/CD pipeline. Deployment is manual via Vercel CLI or Git integration.

```
Local Development
      │
      │  git push main
      ▼
Vercel (Auto-deploy on push to main, if Git integration configured)
  OR
Vercel CLI: vercel --prod
```

## Build Process

```bash
npm install          # Install all dependencies
npm run build        # vite build → dist/
npm run validate     # build + node syntax check on server/index.js
```

Build output:
- `dist/` — React SPA static files (served by Vercel CDN)
- `api/index.js` — Serverless function entry point (Vercel detects automatically)

## Deploying to Vercel

### First Deploy

```bash
npm install -g vercel
vercel login
vercel                     # Follow prompts; link to project
```

Set environment variable in Vercel dashboard or CLI:
```bash
vercel env add MONGO_URI production
# Paste the MongoDB Atlas connection string when prompted
```

Deploy to production:
```bash
vercel --prod
```

### Subsequent Deploys

```bash
vercel --prod
```

Or push to the linked Git branch if Vercel Git integration is configured.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |

Set in Vercel: Project Settings → Environment Variables → Production

## Post-Deploy Checklist

- [ ] Verify `MONGO_URI` is set in Vercel environment variables
- [ ] Visit `/login` and confirm the page loads
- [ ] Login as admin (`admin` / `admin`) — then immediately change password
- [ ] Create a test user and assign a plan
- [ ] Log in as test user and verify plan visibility
- [ ] Mark an exercise done and verify persistence

## Rollback

Vercel keeps deployment history. To rollback:
1. Vercel Dashboard → Deployments
2. Find the last good deployment
3. Click **Promote to Production**

Or via CLI:
```bash
vercel rollback [deployment-url]
```

## Running Locally

```bash
# Terminal 1 — Backend
node server/index.js        # http://localhost:3000

# Terminal 2 — Frontend
npm run dev                 # http://localhost:5173
# Vite proxies /api/* → http://localhost:3000 automatically
```
