export function displayName(email: string): string {
  const name = email.split("@")[0].replace(/[._-]/g, " ");
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function initials(email: string): string {
  const name = email.split("@")[0].replace(/[._-]/g, " ");
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatLongDate(d = new Date()): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDay(isoDate: string): string {
  return new Date(isoDate + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
  }).toUpperCase();
}

export function formatTime(isoOrDate?: string): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function loadMacroGoals() {
  const raw = localStorage.getItem("apex_macro_goals");
  if (!raw) return { calories: 2500, protein_g: 180, carbs_g: 250, fat_g: 70 };
  try {
    return JSON.parse(raw) as { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  } catch {
    return { calories: 2500, protein_g: 180, carbs_g: 250, fat_g: 70 };
  }
}

export function saveMacroGoals(goals: { calories: number; protein_g: number; carbs_g: number; fat_g: number }) {
  localStorage.setItem("apex_macro_goals", JSON.stringify(goals));
}
