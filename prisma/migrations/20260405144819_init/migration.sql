-- CreateTable
CREATE TABLE "users" (
    "id" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "video_url" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_exercises" (
    "id" SERIAL NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "exercise_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "sets" TEXT NOT NULL DEFAULT '',
    "reps" TEXT NOT NULL DEFAULT '',
    "video_url" TEXT NOT NULL DEFAULT '',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "weight" TEXT NOT NULL DEFAULT '',
    "weight_kg" TEXT NOT NULL DEFAULT '',
    "weight_lbs" TEXT NOT NULL DEFAULT '',
    "coach_note" TEXT NOT NULL DEFAULT '',
    "user_note" TEXT NOT NULL DEFAULT '',
    "superset_id" TEXT,

    CONSTRAINT "plan_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "plans_user_id_date_idx" ON "plans"("user_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "plan_exercises_plan_id_exercise_order_key" ON "plan_exercises"("plan_id", "exercise_order");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
