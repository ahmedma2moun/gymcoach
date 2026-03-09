# Security Architecture

## Security Layers

```
┌────────────────────────────────────────────────────┐
│  Layer 1: Transport                                 │
│  HTTPS enforced by Vercel on all traffic           │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│  Layer 2: Authentication                            │
│  Username/password → bcrypt verify → user object   │
│  Session stored client-side in localStorage        │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│  Layer 3: Authorization (CLIENT-SIDE ONLY)          │
│  React Router ProtectedRoute checks user.role       │
│  API has NO auth middleware — all routes open       │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│  Layer 4: Data                                      │
│  Mongoose schema validation                         │
│  bcryptjs password hashing (10 rounds)              │
│  Password excluded from GET /api/users              │
└────────────────────────────────────────────────────┘
```

## Authentication Flow

```
Browser                       Express API                  MongoDB
  │                                │                           │
  │── POST /api/login ────────────►│                           │
  │   { username, password }       │                           │
  │                                │── User.findOne({          │
  │                                │   username: /^input$/i }) ►
  │                                │◄── user doc ──────────────│
  │                                │                           │
  │                                │── bcrypt.compare()        │
  │                                │   (candidatePassword,     │
  │                                │    user.password)         │
  │                                │                           │
  │                                │── check user.isActive     │
  │                                │                           │
  │◄── 200 { user without pass } ──│ (no token issued)        │
  │                                │                           │
  │── localStorage.setItem(        │                           │
  │   'gym_user', JSON.stringify(userObj))                      │
```

**Session management**: No JWT or server-side session. The user object is stored in `localStorage` and read on page load by `AuthContext`. Protected API routes check nothing server-side.

## RBAC Matrix

| Action | admin | user | Enforcement |
|---|---|---|---|
| Login | ✓ | ✓ | Server |
| View own plans | ✓ | ✓ | Client-only |
| Mark exercise done | ✓ | ✓ | Client-only |
| Create/edit/delete plans | ✓ | ✗ | Client-only |
| Create/delete users | ✓ | ✗ | Client-only |
| Toggle user active status | ✓ | ✗ | Client-only |
| Manage exercise library | ✓ | ✗ | Client-only |
| View all users' plans | ✓ | ✗ | Client-only |

**Critical gap**: Role enforcement is entirely client-side. Any user who knows the API contract can call admin endpoints directly.

## STRIDE Threat Model

| Threat | Category | Asset | Current Mitigation | Gap |
|---|---|---|---|---|
| Unauthenticated API access | Spoofing | All data | None — no server auth middleware | HIGH: Any request can read/modify data |
| Session persistence after deactivation | Auth bypass | User session | `isActive` checked at login only | Deactivated users keep active sessions |
| Default admin credentials | Elevation | Admin account | `ensureAdmin()` creates admin/admin | Admin password never rotated |
| MongoDB injection via regex | Tampering | User lookup | Case-insensitive regex on username input | Use exact match or parameterized query |
| Plaintext MongoDB URI in .env | Info disclosure | Database | .env is git-ignored | URI exposed if .env is committed accidentally |
| Open CORS policy | Spoofing | API | None (`cors()` with no options) | Any origin can make credentialed requests |
| ID collision on Date.now() | Tampering | All documents | None | Rapid creation can duplicate IDs |

## Secrets Architecture

| Secret | Location | Injection Method |
|---|---|---|
| `MONGO_URI` | `.env` (local) / Vercel Env Vars (prod) | `dotenv` / Vercel runtime |
| Admin default password | Hardcoded: `'admin'` in `ensureAdmin()` | N/A — must be changed post-deploy |

## Password Storage

- Algorithm: bcrypt via `bcryptjs` 3.0.3
- Rounds: 10 (in `userSchema.pre('save')`)
- Hash stored in MongoDB `users.password` field
- `comparePassword()` method on User model uses `bcrypt.compare()`
- Password excluded from `GET /api/users` with `.select('-password')`

## Known Security Gaps (Priority Order)

1. **No API authentication middleware** — All endpoints are unauthenticated. Add JWT or session tokens; add `requireAuth` and `requireAdmin` middleware.
2. **Default admin password** — `ensureAdmin()` creates admin/admin. Change immediately after first deploy.
3. **Username regex injection** — `{ $regex: new RegExp(\`^${username}$\`, 'i') }` can be abused if `username` contains regex metacharacters. Use exact match: `{ username: username.toLowerCase() }` with a lowercase index.
4. **Open CORS** — Restrict to the Vercel deployment origin in production.
5. **No rate limiting** — Login endpoint is vulnerable to brute force.
