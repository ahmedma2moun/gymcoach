---
description: "Review architecture impact of changes"
---
# Architecture Review Checklist

## 1. Which services are affected?

| Changed area | Impact |
|---|---|
| `src/components/` | Frontend only — no API impact |
| `server/index.js` | API routes — check request/response contracts |
| `server/models/` | Schema change — check all callers and MongoDB documents |
| `server/db.js` | DB connection — affects all routes |
| `api/index.js` | Vercel adapter — only change if Express export changes |
| `vercel.json` | Routing — affects all production traffic |

## 2. API contract changes?

- Did you add/remove/rename request fields? → Update `docs/architecture/API_SPECIFICATIONS.md`
- Did you change response shape? → Check all frontend fetch callers in `src/components/`
- Backward compatible? → Existing MongoDB documents and frontend state must still work

## 3. Database schema changes?

- Added new fields to a Mongoose model? → Existing documents won't have these fields; add defaults
- Changed field types? → Write a migration script in `server/scripts/`
- See `docs/architecture/DATA_ARCHITECTURE.md`

## 4. Security implications?

- Does the change expose data without authorization? (Remember: no API auth middleware exists)
- Does it handle user input safely? (No SQL/NoSQL injection; bcrypt for passwords)
- See `docs/architecture/SECURITY_ARCHITECTURE.md`

## 5. CSS/Design changes?

- Using CSS variables from `src/index.css` (not hardcoded colors)?
- Responsive? Test at 768px breakpoint
- Dark theme consistent with `--bg-dark`, `--bg-card`, `--primary` palette?

## Full architecture context: `docs/architecture/SYSTEM_ARCHITECTURE.md`
