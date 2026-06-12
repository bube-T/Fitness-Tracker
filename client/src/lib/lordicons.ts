export const LORDICON_PATHS = {
  dashboard: "/icons/dashboard.json",
  meals: "/icons/meals.json",
  workouts: "/icons/workouts.json",
  weight: "/icons/weight.json",
  settings: "/icons/settings.json",
  support: "/icons/support.json",
  plus: "/icons/plus.json",
  streak: "/icons/streak.json",
  search: "/icons/search.json",
  chart: "/icons/chart.json",
  fitness: "/icons/fitness.json",
  user: "/icons/user.json",
} as const;

export type LordIconName = keyof typeof LORDICON_PATHS;

export const LORDICON_COLORS = {
  blue: "primary:#3b82f6,secondary:#93c5fd",
  orange: "primary:#f59e0b,secondary:#fcd34d",
  pink: "primary:#f472b6,secondary:#fbcfe8",
  white: "primary:#ffffff,secondary:#94a3b8",
  muted: "primary:#64748b,secondary:#334155",
  green: "primary:#10b981,secondary:#6ee7b7",
} as const;

export type LordIconColor = keyof typeof LORDICON_COLORS;
