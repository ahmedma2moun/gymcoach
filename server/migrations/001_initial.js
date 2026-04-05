// Migration 001: Initial schema
// Creates all application tables for the Antigravity Gym app.
// The migrations table itself is bootstrapped by server/migrate.js.

export const up = `
-- Users: coaches and members
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT      PRIMARY KEY,
    username    TEXT        NOT NULL UNIQUE,
    password    TEXT        NOT NULL,
    role        TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercise library (coach-managed list of exercises)
CREATE TABLE IF NOT EXISTS exercises (
    id          BIGINT  PRIMARY KEY,
    name        TEXT    NOT NULL,
    video_url   TEXT    NOT NULL DEFAULT ''
);

-- Workout plans assigned to users
CREATE TABLE IF NOT EXISTS plans (
    id          BIGINT      PRIMARY KEY,
    user_id     BIGINT      NOT NULL,
    title       TEXT        NOT NULL,
    date        TIMESTAMPTZ,
    status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_user_date ON plans (user_id, date DESC);

-- Exercises within a plan (normalised from the MongoDB embedded array).
-- exercise_order (0-based) preserves the original array index; the frontend
-- uses this index when marking exercises done via PATCH /api/plans/:planId.
CREATE TABLE IF NOT EXISTS plan_exercises (
    id              SERIAL      PRIMARY KEY,
    plan_id         BIGINT      NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    exercise_order  INT         NOT NULL,
    name            TEXT        NOT NULL DEFAULT '',
    sets            TEXT        NOT NULL DEFAULT '',
    reps            TEXT        NOT NULL DEFAULT '',
    video_url       TEXT        NOT NULL DEFAULT '',
    done            BOOLEAN     NOT NULL DEFAULT false,
    completed_at    TIMESTAMPTZ,
    weight          TEXT        NOT NULL DEFAULT '',
    weight_kg       TEXT        NOT NULL DEFAULT '',
    weight_lbs      TEXT        NOT NULL DEFAULT '',
    coach_note      TEXT        NOT NULL DEFAULT '',
    user_note       TEXT        NOT NULL DEFAULT '',
    superset_id     TEXT,
    UNIQUE (plan_id, exercise_order)
);
`;
