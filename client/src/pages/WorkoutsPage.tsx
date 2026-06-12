import { type FormEvent, useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { GlassCard, PageHeader } from "../components/ui/StatCard";
import { LordIcon } from "../components/ui/LordIcon";
import { createWorkout, deleteWorkout, fetchWeeklyStats, fetchWorkouts } from "../lib/api";
import { todayIso } from "../lib/utils";
import type { WeeklyStats, Workout } from "../types/api";

const EXERCISES = [
  { name: "Bench Press", icon: "workouts" as const },
  { name: "Squat", icon: "fitness" as const },
  { name: "Deadlift", icon: "workouts" as const },
  { name: "Overhead Press", icon: "fitness" as const },
  { name: "HIIT", icon: "streak" as const },
  { name: "Running", icon: "chart" as const },
  { name: "Yoga", icon: "user" as const },
  { name: "Cycling", icon: "dashboard" as const },
];

export function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("Bench Press");
  const [duration, setDuration] = useState("45");
  const [error, setError] = useState("");

  async function reload() {
    const [w, s] = await Promise.all([fetchWorkouts(), fetchWeeklyStats()]);
    setWorkouts(w);
    setStats(s);
  }

  useEffect(() => {
    reload();
  }, []);

  const weekSessions = workouts.filter((w) => {
    const d = new Date(w.log_date);
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo;
  }).length;

  const weekVolume = weekSessions * 5000;
  const filtered = EXERCISES.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  async function handleFinish(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createWorkout({
        workout_type: selected,
        duration_minutes: Number(duration),
        log_date: todayIso(),
      });
      setDuration("45");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log workout");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this workout?")) return;
    await deleteWorkout(id);
    await reload();
  }

  return (
    <AppLayout streak={stats?.current_streak}>
      <PageHeader
        title="Log Your Session"
        subtitle={`Weekly Volume: ${weekVolume.toLocaleString()} kg / ${weekSessions} Sessions`}
        icon="workouts"
      />

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard title="Exercise Selection" padding="lg">
          <div className="relative mb-4">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <LordIcon name="search" size={20} color="muted" trigger="hover" />
            </div>
            <input
              className="apex-input pl-12"
              placeholder="Search Exercises…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((ex) => (
              <button
                key={ex.name}
                type="button"
                onClick={() => setSelected(ex.name)}
                className={`exercise-tile flex flex-col items-center gap-3 rounded-2xl p-5 ${selected === ex.name ? "selected" : ""}`}
              >
                <LordIcon name={ex.icon} size={36} trigger="loop-on-hover" color={selected === ex.name ? "blue" : "muted"} />
                <span className="text-sm font-medium">{ex.name}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Active Workout Panel" padding="lg">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent px-4 py-4">
            <LordIcon name="workouts" size={28} trigger="loop-on-hover" color="blue" />
            <span className="text-lg font-semibold">{selected}</span>
          </div>

          <form onSubmit={handleFinish} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-white/50">Duration (minutes)</label>
              <input className="apex-input" type="number" min={1} required value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <button type="submit" className="apex-btn-primary w-full">
              <LordIcon name="plus" size={20} color="white" trigger="hover" />
              Finish Workout
            </button>
          </form>
        </GlassCard>
      </div>

      <GlassCard title="Recent Workouts" className="mt-6" padding="lg">
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <LordIcon name="fitness" size={40} color="muted" trigger="loop-on-hover" />
            <p className="text-sm text-white/40">No workouts logged yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {workouts.slice(0, 5).map((w) => (
              <li key={w.id} className="activity-row flex items-center justify-between rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                    <LordIcon name="workouts" size={22} color="blue" trigger="hover" />
                  </div>
                  <div>
                    <p className="font-medium">{w.workout_type}</p>
                    <p className="text-sm text-white/45">{w.log_date} · {w.duration_minutes} min</p>
                  </div>
                </div>
                <button type="button" className="apex-btn-ghost" onClick={() => handleDelete(w.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </AppLayout>
  );
}
