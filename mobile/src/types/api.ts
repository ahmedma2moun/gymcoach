export type UserRole = 'user' | 'admin';

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
};

export type PlanExercise = {
  name: string;
  sets: string;
  reps: string;
  videoUrl?: string;
  done: boolean;
  completedAt?: string;
  weight?: string;
  weightKg?: string;
  weightLbs?: string;
  coachNote?: string;
  userNote?: string;
  supersetId?: string;
};

export type Plan = {
  id: string;
  userId: string;
  title: string;
  date?: string;
  status: string;
  exercises: PlanExercise[];
  createdAt: string;
  updatedAt: string;
};

export type ExerciseHistoryEntry = {
  date: string;
  weightKg?: string;
  weightLbs?: string;
  weight?: string;
  userNote?: string;
};

export type ExerciseHistory = Record<string, ExerciseHistoryEntry[]>;

export type LibraryExercise = {
  id: string;
  name: string;
  videoUrl?: string;
};

export type LoginResponse = AuthUser;
