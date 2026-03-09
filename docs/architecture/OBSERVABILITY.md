# Observability

## Current Observability Stack

```
┌──────────────────────────────────────────────────────┐
│  Logging                                              │
│  console.log / console.error (Node.js built-in)      │
│  → Vercel Function Logs (production)                  │
│  → Terminal stdout/stderr (local)                     │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  Tracing      — Not implemented                       │
│  Metrics      — Not implemented                       │
│  Alerting     — Not implemented                       │
│  Health Check — Not implemented                       │
└──────────────────────────────────────────────────────┘
```

## Logging Architecture

### What Is Logged

| Location | Event | Log Statement |
|---|---|---|
| `server/db.js` | Successful DB connection | `console.log('MongoDB Connected')` |
| `server/db.js` | DB connection error | `console.error('MongoDB Connection Error:', msg)` |
| `server/index.js` | Server startup (local only) | `console.log(`Server running on http://localhost:${PORT}`)` |
| `server/index.js` | Admin auto-created | `console.log('Default admin created (Mongo)')` |
| `server/index.js` | Login error | `console.error(e)` |
| `server/index.js` | Plan clone error | `console.error('Error cloning plan:', e)` |
| `server/index.js` | Exercise history error | `console.error('Error fetching exercise history:', e)` |

### What Is NOT Logged

- Incoming requests (no HTTP access log middleware)
- Successful API responses
- User actions (login, plan completion, weight entry)
- Performance / response time

## Error Handling Pattern

All route handlers follow this pattern:

```js
app.post('/api/plans', async (req, res) => {
    await connectDB();
    try {
        // ... operation
        res.json(result);
    } catch (e) {
        res.status(500).json({ message: 'Error creating plan' });
    }
});
```

Error details are not returned to the client (good for security). Most errors silently swallow the exception without logging it (bad for debugging).

## Vercel Function Logs

In production, `console.log` and `console.error` output appears in the Vercel dashboard under **Functions → Logs** for the deployed project. Retention is limited by the Vercel plan tier.

## Missing Observability (Recommended Additions)

| Gap | Recommended Fix |
|---|---|
| No request logging | Add `morgan` middleware: `app.use(morgan('combined'))` |
| No health endpoint | Add `GET /api/health → { status: 'ok', db: mongoose.connection.readyState }` |
| Swallowed exceptions | Add `console.error(e)` in every catch block |
| No performance metrics | Consider Vercel Analytics or a lightweight APM |
