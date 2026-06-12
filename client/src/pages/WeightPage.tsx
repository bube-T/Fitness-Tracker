import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "../components/layout/AppLayout";
import { GlassCard, PageHeader, StatCard } from "../components/ui/StatCard";
import { LordIcon } from "../components/ui/LordIcon";
import { createWeight, deleteWeight, fetchWeeklyStats, fetchWeightHistory } from "../lib/api";
import { todayIso } from "../lib/utils";
import type { WeeklyStats, WeightEntry } from "../types/api";

type Range = 30 | 90 | 180;

export function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [range, setRange] = useState<Range>(90);
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  async function reload(days = range) {
    const [e, s] = await Promise.all([fetchWeightHistory(days), fetchWeeklyStats()]);
    setEntries(e);
    setStats(s);
  }

  useEffect(() => {
    reload(range);
  }, [range]);

  const chartData = useMemo(
    () => entries.map((e) => ({ date: e.log_date.slice(5), weight: e.weight_kg })),
    [entries],
  );

  const weights = entries.map((e) => e.weight_kg);
  const lowest = weights.length ? Math.min(...weights) : null;
  const highest = weights.length ? Math.max(...weights) : null;
  const avgChange =
    entries.length >= 2
      ? (entries[entries.length - 1].weight_kg - entries[0].weight_kg) / Math.max(1, entries.length / 7)
      : null;
  const latest = stats?.latest_weight_kg;
  const goalWeight = 82;
  const goalDistance = latest != null ? Math.abs(latest - goalWeight) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createWeight({ weight_kg: Number(weight), log_date: todayIso() });
      setWeight("");
      await reload(range);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log weight");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this entry?")) return;
    await deleteWeight(id);
    await reload(range);
  }

  return (
    <AppLayout streak={stats?.current_streak}>
      <PageHeader title="Progress & Trends" subtitle="Track weight over time and stay close to your goal." icon="weight" />

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Weight" icon="weight" iconColor="blue" accent="blue">
          <p className="text-4xl font-bold">{latest != null ? `${latest.toFixed(1)} KG` : "—"}</p>
        </StatCard>
        <StatCard label="Body Fat" icon="chart" iconColor="pink" accent="pink">
          <p className="text-4xl font-bold text-white/30">—</p>
          <p className="mt-1 text-xs text-white/35">Coming soon</p>
        </StatCard>
      </section>

      <GlassCard
        title="Weight Over Time"
        className="mb-6"
        padding="lg"
        action={
          <div className="flex gap-1 rounded-xl bg-black/30 p-1">
            {([30, 90, 180] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  range === r ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {r === 30 ? "1M" : r === 90 ? "3M" : "6M"}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-72">
          {chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-white/40">
              <LordIcon name="weight" size={48} color="muted" trigger="loop-on-hover" />
              Log weight to see your trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="weight" stroke="#3b82f6" fill="url(#weightGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Lowest Weight", value: lowest != null ? `${lowest.toFixed(1)} KG` : "—" },
          { label: "Highest Weight", value: highest != null ? `${highest.toFixed(1)} KG` : "—" },
          { label: "Avg Weekly Change", value: avgChange != null ? `${avgChange > 0 ? "+" : ""}${avgChange.toFixed(1)} KG` : "—" },
          { label: "Goal Distance", value: goalDistance != null ? `${goalDistance.toFixed(1)} KG` : "—" },
        ].map((s) => (
          <GlassCard key={s.label} padding="sm">
            <p className="text-xs text-white/40">{s.label}</p>
            <p className="mt-2 text-xl font-bold">{s.value}</p>
          </GlassCard>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard title="Log Weight" padding="lg">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <input
              className="apex-input flex-1"
              type="number"
              step="0.1"
              min="1"
              placeholder="Weight in kg"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <button type="submit" className="apex-btn-primary shrink-0 px-8">Save</button>
          </form>
        </GlassCard>

        <GlassCard title="Recent Entries" padding="lg">
          {entries.length === 0 ? (
            <p className="text-sm text-white/40">No entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...entries].reverse().slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm">
                  <span>{e.log_date} — {e.weight_kg} kg</span>
                  <button type="button" className="text-white/30 hover:text-red-400" onClick={() => handleDelete(e.id)}>×</button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <GlassCard title="Progress Photos" className="mt-6" padding="lg">
        <div className="flex items-center gap-3 text-white/40">
          <LordIcon name="user" size={32} color="muted" trigger="hover" />
          <p className="text-sm">Photo uploads coming in a future version.</p>
        </div>
      </GlassCard>
    </AppLayout>
  );
}
