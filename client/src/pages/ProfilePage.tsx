import { type FormEvent, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { GlassCard, PageHeader } from "../components/ui/StatCard";
import { LordIcon } from "../components/ui/LordIcon";
import { loadMacroGoals, saveMacroGoals } from "../lib/utils";

export function ProfilePage() {
  const [goals, setGoals] = useState(loadMacroGoals);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMacroGoals(goals);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AppLayout>
      <PageHeader title="Settings" subtitle="Set your daily nutrition goals used across the dashboard." icon="settings" />

      <GlassCard className="max-w-lg" padding="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {[
            { key: "calories" as const, label: "Daily calorie goal" },
            { key: "protein_g" as const, label: "Protein goal (g)" },
            { key: "carbs_g" as const, label: "Carbs goal (g)" },
            { key: "fat_g" as const, label: "Fat goal (g)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm text-white/50">{label}</label>
              <input
                className="apex-input"
                type="number"
                min={0}
                required
                value={goals[key]}
                onChange={(e) => setGoals({ ...goals, [key]: Number(e.target.value) })}
              />
            </div>
          ))}
          <button type="submit" className="apex-btn-primary flex items-center gap-2">
            <LordIcon name="settings" size={20} color="white" trigger="hover" />
            Save goals
          </button>
          {saved && <p className="text-sm text-emerald-400">Goals saved!</p>}
        </form>
      </GlassCard>
    </AppLayout>
  );
}
