import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "../components/layout/AppLayout";
import { Sparkline } from "../components/charts/Sparkline";
import { ProgressBar } from "../components/ui/ProgressBar";
import { GlassCard, PageHeader, StatCard } from "../components/ui/StatCard";
import { LordIcon } from "../components/ui/LordIcon";
import { useAuth } from "../context/AuthContext";
import { fetchMeals, fetchWeeklyStats, fetchWeightHistory, fetchWorkouts } from "../lib/api";
import { displayName, formatLongDate, formatShortDay, loadMacroGoals } from "../lib/utils";
import type { Meal, WeeklyStats, Workout } from "../types/api";

interface ActivityItem {
  id: string;
  kind: "meal" | "workout" | "weight";
  title: string;
  subtitle: string;
  time: string;
}

const ACTIVITY_ICON = {
  meal: { name: "meals" as const, color: "orange" as const },
  workout: { name: "workouts" as const, color: "blue" as const },
  weight: { name: "weight" as const, color: "pink" as const },
};

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const goals = loadMacroGoals();

  useEffect(() => {
    Promise.all([fetchWeeklyStats(), fetchMeals(), fetchWorkouts(), fetchWeightHistory(7)]).then(
      ([s, m, w]) => {
        setStats(s);
        setMeals(m);
        setWorkouts(w);
      },
    );
  }, []);

  const firstName = user ? displayName(user.email).split(" ")[0] : "Athlete";
  const remaining = Math.max(0, goals.calories - (stats?.today_calories ?? 0));
  const caloriePct = goals.calories > 0 ? Math.round(((stats?.today_calories ?? 0) / goals.calories) * 100) : 0;

  const chartData = useMemo(
    () =>
      stats?.days.map((d) => ({
        day: formatShortDay(d.date),
        intake: d.total_calories,
        burn: d.total_workout_minutes * 12,
      })) ?? [],
    [stats],
  );

  const macroTotal =
    (stats?.today_protein_g ?? 0) + (stats?.today_carbs_g ?? 0) + (stats?.today_fat_g ?? 0);

  const macroPie = [
    { name: "Protein", value: stats?.today_protein_g ?? 0, color: "#3b82f6" },
    { name: "Carbs", value: stats?.today_carbs_g ?? 0, color: "#f59e0b" },
    { name: "Fat", value: stats?.today_fat_g ?? 0, color: "#f472b6" },
  ];

  const macroPct = macroTotal
    ? macroPie.map((m) => ({ ...m, pct: Math.round((m.value / macroTotal) * 100) }))
    : macroPie.map((m) => ({ ...m, pct: 0 }));

  const recentActivity: ActivityItem[] = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const items: ActivityItem[] = [];

    meals
      .filter((m) => m.log_date === today)
      .forEach((m) =>
        items.push({
          id: `meal-${m.id}`,
          kind: "meal",
          title: m.name,
          subtitle: `${m.meal_type ?? "Meal"} · ${m.calories} kcal`,
          time: "Today",
        }),
      );

    workouts
      .filter((w) => w.log_date === today)
      .forEach((w) =>
        items.push({
          id: `workout-${w.id}`,
          kind: "workout",
          title: w.workout_type,
          subtitle: `Workout · ${w.duration_minutes} min`,
          time: "Today",
        }),
      );

    if (stats?.latest_weight_kg) {
      items.push({
        id: "weight-latest",
        kind: "weight",
        title: "Weight Logged",
        subtitle: `Update · ${stats.latest_weight_kg} kg`,
        time: "Today",
      });
    }

    return items.slice(0, 5);
  }, [meals, workouts, stats]);

  const workoutSpark = stats?.days.map((d) => d.total_workout_minutes) ?? [];
  const weightSpark = stats?.days.map((_, i) => (stats.latest_weight_kg ?? 80) + (i - 3) * 0.1) ?? [];

  return (
    <AppLayout streak={stats?.current_streak}>
      <PageHeader
        title={`Push your limits, ${firstName}.`}
        subtitle={`${formatLongDate()} — Optimal performance state detected.`}
        icon="dashboard"
      />

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Daily Calories"
          icon="meals"
          iconColor="blue"
          accent="blue"
          footer={
            <div className="flex justify-between text-xs text-white/40">
              <span>Remaining: {remaining.toLocaleString()} kcal</span>
              <span>{caloriePct}% achieved</span>
            </div>
          }
        >
          <p className="text-3xl font-bold tracking-tight">
            {(stats?.today_calories ?? 0).toLocaleString()}
            <span className="text-lg font-normal text-white/35"> / {goals.calories.toLocaleString()} kcal</span>
          </p>
          <ProgressBar className="mt-4 h-2.5" value={stats?.today_calories ?? 0} max={goals.calories} />
        </StatCard>

        <StatCard label="Workout Time" icon="workouts" iconColor="orange" accent="orange">
          <p className="text-4xl font-bold tracking-tight">
            {stats?.today_workout_minutes ?? 0}
            <span className="ml-1 text-lg font-medium text-white/40">MIN</span>
          </p>
          <Sparkline data={workoutSpark.length ? workoutSpark : [0, 0, 0, 0, 0, 0, 0]} color="#f59e0b" />
        </StatCard>

        <StatCard label="Current Weight" icon="weight" iconColor="blue" accent="green">
          <p className="text-4xl font-bold tracking-tight">
            {stats?.latest_weight_kg != null ? stats.latest_weight_kg.toFixed(1) : "—"}
            <span className="ml-1 text-lg font-medium text-white/40">KG</span>
          </p>
          <Sparkline data={weightSpark} color="#3b82f6" />
        </StatCard>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard title="7-Day Performance History" className="lg:col-span-2" padding="lg">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="intake" name="Intake" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="burn" name="Burn (est.)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-5 text-xs text-white/45">
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Intake</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Burn</span>
          </div>
        </GlassCard>

        <GlassCard title="Macro Distribution" padding="lg">
          <div className="relative mx-auto h-48 max-w-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={macroPie} innerRadius={58} outerRadius={78} dataKey="value" stroke="none">
                  {macroPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{macroTotal}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Grams</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {macroPct.map((m) => (
              <div key={m.name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                <span className="flex items-center gap-2 text-white/60">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  {m.name}
                </span>
                <span className="font-semibold">{m.pct}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <GlassCard title="Recent Activity" padding="lg">
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <LordIcon name="chart" size={48} color="muted" trigger="loop-on-hover" />
            <p className="text-sm text-white/40">No activity logged today. Start with a meal or workout!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentActivity.map((item) => {
              const meta = ACTIVITY_ICON[item.kind];
              return (
                <li key={item.id} className="activity-row flex items-center justify-between rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                      <LordIcon name={meta.name} size={24} color={meta.color} trigger="hover" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-white/45">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-sm tabular-nums text-white/30">{item.time}</span>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </AppLayout>
  );
}
