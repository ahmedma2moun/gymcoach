---
description: "Deploy the Antigravity Gym application to Vercel"
---
# Deployment Checklist

## Pre-deploy

1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Validate build: `npm run validate`
4. Confirm `MONGO_URI` is set in Vercel Environment Variables (not committed to git)

## Deploy

```bash
vercel --prod
```

Or push to the linked Git branch if Vercel Git integration is active.

## Post-deploy

- [ ] Visit `/login` — page loads without error
- [ ] Login as `admin` / `admin` — succeeds and redirects to /admin
- [ ] **Change admin password immediately** (ensureAdmin creates a default one)
- [ ] Create a test member user
- [ ] Assign a plan to the test user
- [ ] Login as test user — plan is visible
- [ ] Mark an exercise done with weight — persists after page refresh

## Rollback

Vercel Dashboard → Deployments → find last good deploy → Promote to Production

See `docs/architecture/DEPLOYMENT_GUIDE.md` for full details.
