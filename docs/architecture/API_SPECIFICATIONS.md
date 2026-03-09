# API Specifications

## API Architecture

```
Vercel CDN
    │ /api/* rewrites
    ▼
api/index.js (re-exports Express app)
    │
    ▼
server/index.js (Express 5.2.1)
    │
    ├── POST   /api/login
    ├── GET    /api/users
    ├── POST   /api/users
    ├── PATCH  /api/users/:id/status
    ├── GET    /api/plans/:userId
    ├── POST   /api/plans
    ├── POST   /api/plans/clone
    ├── DELETE /api/plans/:planId
    ├── PUT    /api/plans/:planId
    ├── PATCH  /api/plans/:planId
    ├── GET    /api/plans/user/:userId/exercise-history
    ├── GET    /api/plans/user/:userId/exercise-history/:exerciseName
    ├── GET    /api/exercises
    ├── POST   /api/exercises
    ├── PUT    /api/exercises/:id
    └── DELETE /api/exercises/:id
```

**Base URL (local)**: `http://localhost:3000`
**Base URL (production)**: `https://<vercel-domain>`
**Auth**: None required — all endpoints are publicly accessible (see SECURITY_ARCHITECTURE.md)
**Content-Type**: `application/json`

## Error Response Format

```json
{ "message": "Human-readable error description" }
```

HTTP status codes used: 200, 400, 401, 403, 404, 500

---

## Authentication

### POST /api/login

Authenticate a user by username and password.

**Request**
```json
{ "username": "coach1", "password": "secret" }
```

**Response 200**
```json
{
  "_id": "...",
  "id": 1234567890,
  "username": "coach1",
  "role": "admin",
  "isActive": true
}
```

**Response 401**: `{ "message": "Invalid credentials" }`
**Response 403**: `{ "message": "Account is deactivated" }`

---

## Users

### GET /api/users

Returns all users (password excluded).

**Response 200**: Array of user objects (no `password` field)

### POST /api/users

Create a new user (admin operation).

**Request**
```json
{ "username": "member1", "password": "pass123", "role": "user" }
```

**Response 200**
```json
{ "id": 1234567890, "username": "member1", "role": "user", "isActive": true }
```

**Response 400**: `{ "message": "User already exists" }`

### PATCH /api/users/:id/status

Toggle a user's active/inactive status. `:id` is the numeric `id` field.

**Request**: `{ "isActive": false }`
**Response 200**: Updated user object (no password)

---

## Plans

### GET /api/plans/:userId

Get all plans for a user, sorted by date descending.

**Response 200**: Array of plan objects

### POST /api/plans

Create a new workout plan.

**Request**
```json
{
  "userId": 1234567890,
  "title": "Chest Day",
  "date": "2024-12-18",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": "4",
      "reps": "8-10",
      "coachNote": "Control the descent",
      "supersetId": null
    }
  ]
}
```

**Response 200**: Created plan object with `done: false` set on all exercises

### POST /api/plans/clone

Clone an existing plan to another user with a new date.

**Request**: `{ "planId": 1234, "targetUserId": 5678, "date": "2024-12-20" }`
**Response 200**: Newly created plan (all exercises reset: done=false, weights cleared)

### DELETE /api/plans/:planId

Delete a plan by numeric `id`.

**Response 200**: `{ "message": "Plan deleted" }`
**Response 404**: `{ "message": "Plan not found" }`

### PUT /api/plans/:planId

Replace a plan's title and exercises (admin edit).

**Request**: `{ "title": "Updated Title", "exercises": [...] }`
**Response 200**: Updated plan object

### PATCH /api/plans/:planId

Mark a single exercise done/undone and save weight/note.

**Request**
```json
{
  "exerciseIndex": 0,
  "done": true,
  "weightKg": "80",
  "weightLbs": "176.4",
  "userNote": "Felt strong today"
}
```

**Response 200**: Updated plan object

---

## Exercise History

### GET /api/plans/user/:userId/exercise-history

Returns all completed exercise history for a user, grouped by exercise name.

**Response 200**
```json
{
  "Bench Press": [
    { "date": "2024-12-18T00:00:00Z", "weightKg": "80", "weightLbs": "176.4", "weight": "", "userNote": "" }
  ]
}
```

### GET /api/plans/user/:userId/exercise-history/:exerciseName

Returns the most recent completed instance of a specific exercise (for pre-fill on next workout).

**Response 200**
```json
{ "weight": null, "weightKg": "80", "weightLbs": "176.4", "lastComment": "Felt strong" }
```

---

## Exercise Library

### GET /api/exercises

Returns all exercises sorted by name.

**Response 200**: Array of `{ id, name, videoUrl }`

### POST /api/exercises

Create a new exercise.

**Request**: `{ "name": "Squat", "videoUrl": "https://..." }`
**Response 200**: Created exercise object

### PUT /api/exercises/:id

Update exercise name and/or videoUrl.

**Request**: `{ "name": "Back Squat", "videoUrl": "https://..." }`
**Response 200**: Updated exercise object

### DELETE /api/exercises/:id

Delete an exercise from the library.

**Response 200**: `{ "message": "Exercise deleted" }`
