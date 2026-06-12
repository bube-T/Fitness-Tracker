interface ProgressBarProps {
  value: number;
  max: number;
  color?: "blue" | "orange" | "pink" | "gray";
  className?: string;
}

const COLORS = {
  blue: "bg-[#3b82f6]",
  orange: "bg-[#f59e0b]",
  pink: "bg-[#f472b6]",
  gray: "bg-white/20",
};

export function ProgressBar({ value, max, color = "blue", className = "" }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className={`h-2 overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${COLORS[color]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: "blue" | "orange" | "pink" | "gray";
}

export function MacroBar({ label, current, goal, color }: MacroBarProps) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className="font-medium">
          {current}g / {goal}g
        </span>
      </div>
      <ProgressBar value={current} max={goal} color={color} />
    </div>
  );
}
