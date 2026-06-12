export interface User {
  id: number;
  email: string;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Meal {
  id: number;
  name: string;
  calories: number;
  meal_type: MealType | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  log_date: string;
  user_id: number;
}

export interface Workout {
  id: number;
  workout_type: string;
  duration_minutes: number;
  log_date: string;
  user_id: number;
}

export interface WeightEntry {
  id: number;
  weight_kg: number;
  log_date: string;
  user_id: number;
}

export interface DailyStats {
  date: string;
  total_calories: number;
  total_workout_minutes: number;
}

export interface WeeklyStats {
  days: DailyStats[];
  today_calories: number;
  today_workout_minutes: number;
  today_protein_g: number;
  today_carbs_g: number;
  today_fat_g: number;
  current_streak: number;
  latest_weight_kg: number | null;
}

export interface MacroGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const DEFAULT_MACRO_GOALS: MacroGoals = {
  calories: 2500,
  protein_g: 180,
  carbs_g: 250,
  fat_g: 70,
};

export interface MealCreateInput {
  name: string;
  calories: number;
  meal_type?: MealType;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  log_date?: string;
}

export interface WorkoutCreateInput {
  workout_type: string;
  duration_minutes: number;
  log_date?: string;
}

export interface WeightCreateInput {
  weight_kg: number;
  log_date?: string;
}
