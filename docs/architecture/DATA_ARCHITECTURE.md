# Data Architecture

## Data Store Landscape

```
┌──────────────────────────────────────────────────────────────┐
│  MongoDB Atlas (cluster0.bdhlsff.mongodb.net)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    users     │  │    plans     │  │    exercises     │  │
│  │              │  │              │  │                  │  │
│  │  id (num)    │  │  id (num)    │  │  id (num)        │  │
│  │  username    │  │  userId(num) │  │  name            │  │
│  │  password    │  │  title       │  │  videoUrl        │  │
│  │  role        │  │  date        │  │                  │  │
│  │  isActive    │  │  status      │  │  (exercise lib)  │  │
│  └──────────────┘  │  exercises[] │  └──────────────────┘  │
│                    └──────────────┘                          │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Browser localStorage (client-side only)               │  │
│  │  Key: 'gym_user'  Value: JSON user object             │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Collection Schemas

### users

```
{
  id:       Number  (unique, required) — legacy numeric ID
  username: String  (unique, required)
  password: String  (required) — bcrypt hash
  role:     String  (default: 'user') — 'admin' | 'user'
  isActive: Boolean (default: true)
}
```

### plans

```
{
  id:     Number  (unique, required)
  userId: Number  (required) — references users.id
  title:  String  (required)
  date:   Date
  status: String  (default: 'active')
  exercises: [{
    name:      String
    sets:      String
    reps:      String
    videoUrl:  String
    done:      Boolean (default: false)
    weight:    String  (legacy — combined kg/lbs display)
    weightKg:  String  (preferred — kg value)
    weightLbs: String  (preferred — lbs value)
    coachNote: String  (set by admin)
    userNote:  String  (set by member)
    supersetId: String (null = standalone, same value = superset group)
  }]
}
```

### exercises

```
{
  id:       Number (unique, required)
  name:     String (required)
  videoUrl: String (optional) — YouTube or video link
}
```

## Data Flows

### Admin creates a plan for a member

```
AdminDashboard
  │
  ├── GET /api/users           → list users to assign
  ├── GET /api/exercises       → populate exercise picker
  │
  └── POST /api/plans {
        userId, title, date,
        exercises: [{ exerciseId, sets, reps, coachNote }]
      }
      → Plan.create({ id: Date.now(), userId, title, date,
                       status: 'active', exercises: [...mapped] })
```

### Member completes an exercise and logs weight

```
UserDashboard
  │
  ├── GET /api/plans/:userId     → load today's and past plans
  │
  └── PATCH /api/plans/:planId {
        exerciseIndex, done: true,
        weightKg, weightLbs, userNote
      }
      → Plan.findOne({ id: planId })
      → plan.exercises[exerciseIndex].done = true
      → plan.save()
```

### Exercise history aggregation

```
GET /api/plans/user/:userId/exercise-history
  │
  └── Plan.find({ userId }).sort({ date: 1 })
      → for each plan.exercises where done=true:
           historyMap[exercise.name].push({
             date, weightKg, weightLbs, weight, userNote
           })
      → returns { exerciseName: [{date, weights...}] }
```

## Weight Tracking Migration

The schema has three weight fields due to a migration:

| Field | Status | Notes |
|---|---|---|
| `weight` | Legacy | Combined display string (e.g., "80 kg / 176 lbs") |
| `weightKg` | Current | Numeric string, kg value |
| `weightLbs` | Current | Numeric string, lbs value |

History lookup prefers `weightKg`/`weightLbs`; falls back to `weight` if only legacy data exists. See `server/scripts/migrateWeights.js` for the migration script.

## Data Access Patterns

| Operation | Method | Notes |
|---|---|---|
| User login | `User.findOne({ username: regex })` | Case-insensitive; regex injection risk |
| Get user's plans | `Plan.find({ userId }).sort({ date: -1 })` | Returns all plans for user |
| Exercise history | `Plan.find({ userId }).sort({ date: 1 })` | In-memory aggregation |
| Exercise library | `Exercise.find({}).sort({ name: 1 })` | Full collection scan, sorted |

## Seed Data

`server/data/users.json` and `server/data/plans.json` are legacy JSON files from the pre-MongoDB version. They are not used by the current MongoDB implementation but serve as reference data samples.
