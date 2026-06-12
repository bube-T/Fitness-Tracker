import type {
  Meal,
  MealCreateInput,
  TokenResponse,
  User,
  WeeklyStats,
  WeightCreateInput,
  WeightEntry,
  Workout,
  WorkoutCreateInput,
} from "../types/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const isForm = options.body instanceof URLSearchParams;
  if (!isForm && options.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 204) return null as T;

  let data: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail))
        message = detail
          .map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : JSON.stringify(d)))
          .join(", ");
    }
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);
  const data = await apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  setToken(data.access_token);
  return data;
}

export async function register(email: string, password: string): Promise<User> {
  return apiRequest<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(): Promise<User> {
  return apiRequest<User>("/auth/me");
}

export async function fetchWeeklyStats(): Promise<WeeklyStats> {
  return apiRequest<WeeklyStats>("/stats/weekly");
}

export async function fetchMeals(): Promise<Meal[]> {
  return apiRequest<Meal[]>("/meals");
}

export async function createMeal(input: MealCreateInput): Promise<Meal> {
  return apiRequest<Meal>("/meals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteMeal(id: number): Promise<void> {
  await apiRequest<void>(`/meals/${id}`, { method: "DELETE" });
}

export async function fetchWorkouts(): Promise<Workout[]> {
  return apiRequest<Workout[]>("/workouts");
}

export async function createWorkout(input: WorkoutCreateInput): Promise<Workout> {
  return apiRequest<Workout>("/workouts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteWorkout(id: number): Promise<void> {
  await apiRequest<void>(`/workouts/${id}`, { method: "DELETE" });
}

export async function fetchWeightHistory(days = 90): Promise<WeightEntry[]> {
  return apiRequest<WeightEntry[]>(`/weight/history?days=${days}`);
}

export async function createWeight(input: WeightCreateInput): Promise<WeightEntry> {
  return apiRequest<WeightEntry>("/weight", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteWeight(id: number): Promise<void> {
  await apiRequest<void>(`/weight/${id}`, { method: "DELETE" });
}
