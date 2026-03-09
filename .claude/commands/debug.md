---
description: "Debug an issue in the Antigravity Gym app"
---
# Debugging Protocol

## 1. Reproduce the issue
Identify whether the bug is in the frontend (React), backend (Express), or database (MongoDB).

## 2. Check logs

**Local backend logs** (terminal running `node server/index.js`):
- DB connection errors: `MongoDB Connection Error:`
- Route-level errors: `console.error` output per handler

**Production logs**:
- Vercel Dashboard → Functions → Logs → filter by function name `api/index`

## 3. Service dependency map

| Symptom | Likely Layer | Check |
|---|---|---|
| Login page doesn't redirect | Frontend / AuthContext | `localStorage.getItem('gym_user')` in browser DevTools |
| 401 / blank response on /api/* | Backend | Run `node server/index.js` locally; check terminal |
| Plan not saving | Backend / DB | Check MongoDB Atlas → Browse Collections → plans |
| Exercise history empty | Backend aggregation | `GET /api/plans/user/:userId/exercise-history` directly |
| Build fails | Vite / rolldown | Run `npm run build` and read the error |
| DB connection fails | MongoDB | Verify `MONGO_URI` in .env; check Atlas IP allowlist |

## 4. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `require is not defined` | .js file in ESM project | Rename to .cjs or use `import` |
| Plans not visible | userId mismatch (numeric id vs _id) | Confirm API uses numeric `id` field |
| Login succeeds but redirects to /login | localStorage not set | Check `AuthContext.login()` stores `gym_user` |
| Duplicate ID error | Date.now() collision | Wait 1ms between creates; use ObjectId long-term |
| CORS error in browser | Open CORS not matching | `cors()` is open; check Vite proxy config locally |
| Exercise weight not pre-filled | Legacy `weight` field | Ensure `weightKg`/`weightLbs` are sent; fallback logic in GET exercise-history/:name |

## 5. If unresolved
- See `docs/architecture/OBSERVABILITY.md` for logging gaps
- See `docs/architecture/SECURITY_ARCHITECTURE.md` for auth flow
- Check `server/index.js` — all routes are in this single file
