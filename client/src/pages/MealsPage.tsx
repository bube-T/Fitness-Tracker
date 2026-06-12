import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { MacroBar } from "../components/ui/ProgressBar";
import { GlassCard, PageHeader } from "../components/ui/StatCard";
import { LordIcon } from "../components/ui/LordIcon";
import { createMeal, deleteMeal, fetchMeals, fetchWeeklyStats } from "../lib/api";
import { loadMacroGoals, todayIso } from "../lib/utils";
import type { Meal, MealType, WeeklyStats } from "../types/api";

const MEAL_TYPES: { key: MealType; label: string; icon: "meals" | "chart" | "fitness" }[] = [
  { key: "breakfast", label: "Breakfast", icon: "meals" },
  { key: "lunch", label: "Lunch", icon: "meals" },
  { key: "dinner", label: "Dinner", icon: "chart" },
  { key: "snack", label: "Snacks", icon: "fitness" },
];

export function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState<MealType | null>(null);
  const [form, setForm] = useState({ name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
  const [error, setError] = useState("");
  const goals = loadMacroGoals();

  async function reload() {
    const [m, s] = await Promise.all([fetchMeals(), fetchWeeklyStats()]);
    setMeals(m);
    setStats(s);
  }

  useEffect(() => {
    reload();
  }, []);

  const recentFoods = useMemo(() => {
    const seen = new Set<string>();
    return meals
      .filter((m) => {
        if (seen.has(m.name)) return false;
        seen.add(m.name);
        return true;
      })
      .slice(0, 4);
  }, [meals]);

  const filteredMeals = useMemo(() => {
    if (!search.trim()) return meals;
    return meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [meals, search]);

  const mealsByType = useMemo(() => {
    const today = todayIso();
    const map: Record<MealType, Meal[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    filteredMeals
      .filter((m) => m.log_date === today)
      .forEach((m) => {
        const t = (m.meal_type ?? "snack") as MealType;
        if (map[t]) map[t].push(m);
      });
    return map;
  }, [filteredMeals]);

  async function handleSubmit(e: FormEvent, mealType: MealType) {
    e.preventDefault();
    setError("");
    try {
      await createMeal({
        name: form.name.trim(),
        calories: Number(form.calories),
        meal_type: mealType,
        protein_g: form.protein_g ? Number(form.protein_g) : undefined,
        carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
        fat_g: form.fat_g ? Number(form.fat_g) : undefined,
        log_date: todayIso(),
      });
      setForm({ name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
      setShowForm(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add meal");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this meal?")) return;
    await deleteMeal(id);
    await reload();
  }

  return (
    <AppLayout streak={stats?.current_streak}>
      <PageHeader title="Nutrition Entry" subtitle="Track macros and log meals by time of day." icon="meals" />

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Protein", current: stats?.today_protein_g ?? 0, goal: goals.protein_g, color: "blue" as const },
          { label: "Carbs", current: stats?.today_carbs_g ?? 0, goal: goals.carbs_g, color: "orange" as const },
          { label: "Fats", current: stats?.today_fat_g ?? 0, goal: goals.fat_g, color: "pink" as const },
        ].map((m) => (
          <GlassCard key={m.label} padding="sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">{m.label}</p>
            <MacroBar label="" current={m.current} goal={m.goal} color={m.color} />
          </GlassCard>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div>
          <div className="relative mb-4">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <LordIcon name="search" size={20} color="muted" trigger="hover" />
            </div>
            <input
              className="apex-input pl-12"
              placeholder="Search foods…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {recentFoods.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {recentFoods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="chip rounded-full px-4 py-2 text-sm text-white/70"
                  onClick={() =>
                    setForm({
                      name: m.name,
                      calories: String(m.calories),
                      protein_g: String(m.protein_g ?? ""),
                      carbs_g: String(m.carbs_g ?? ""),
                      fat_g: String(m.fat_g ?? ""),
                    })
                  }
                >
                  {m.name} — {m.calories} kcal
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MEAL_TYPES.map(({ key, label, icon }) => (
              <GlassCard
                key={key}
                title={label}
                action={
                  <button
                    type="button"
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 transition hover:border-blue-500/40"
                    onClick={() => setShowForm(showForm === key ? null : key)}
                  >
                    <LordIcon name="plus" size={18} color="blue" trigger="hover" />
                  </button>
                }
              >
                {showForm === key && (
                  <form className="mb-4 space-y-2 border-b border-white/5 pb-4" onSubmit={(e) => handleSubmit(e, key)}>
                    <input className="apex-input" placeholder="Food name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input className="apex-input" type="number" placeholder="Calories" required value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
                    <div className="grid grid-cols-3 gap-2">
                      <input className="apex-input" type="number" placeholder="Protein g" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
                      <input className="apex-input" type="number" placeholder="Carbs g" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
                      <input className="apex-input" type="number" placeholder="Fat g" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} />
                    </div>
                    <button type="submit" className="apex-btn-primary w-full text-sm">Add to {label}</button>
                  </form>
                )}

                <ul className="space-y-2">
                  {mealsByType[key].length === 0 ? (
                    <li className="flex items-center gap-2 text-sm text-white/35">
                      <LordIcon name={icon} size={18} color="muted" />
                      No items logged
                    </li>
                  ) : (
                    mealsByType[key].map((m) => (
                      <li key={m.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm">
                        <span>{m.name} — {m.calories} kcal</span>
                        <button type="button" className="text-white/30 hover:text-red-400" onClick={() => handleDelete(m.id)}>×</button>
                      </li>
                    ))
                  )}
                </ul>
              </GlassCard>
            ))}
          </div>
        </div>

        <GlassCard title="Macro Progress" className="h-fit">
          <div className="space-y-4">
            <MacroBar label="Protein Goal" current={stats?.today_protein_g ?? 0} goal={goals.protein_g} color="blue" />
            <MacroBar label="Carbs Goal" current={stats?.today_carbs_g ?? 0} goal={goals.carbs_g} color="orange" />
            <MacroBar label="Fats Goal" current={stats?.today_fat_g ?? 0} goal={goals.fat_g} color="pink" />
            <MacroBar label="Calories Remaining" current={Math.max(0, goals.calories - (stats?.today_calories ?? 0))} goal={goals.calories} color="gray" />
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
