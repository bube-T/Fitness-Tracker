import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { displayName, initials } from "../../lib/utils";
import { LordIcon } from "../ui/LordIcon";

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard" as const },
  { to: "/meals", label: "Log Meal", icon: "meals" as const },
  { to: "/workouts", label: "Log Workout", icon: "workouts" as const },
  { to: "/weight", label: "Weight Trends", icon: "weight" as const },
];

interface SidebarProps {
  streak?: number;
}

export function Sidebar({ streak = 0 }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const name = displayName(user.email);
  const streakLabel = streak > 0 ? `${streak} Day Streak` : "Start your streak";

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-white/[0.06] bg-[#080808]/80 backdrop-blur-2xl">
      <div className="px-6 pb-1 pt-7">
        <div className="flex items-center gap-2">
          <LordIcon name="fitness" size={32} trigger="loop-on-hover" color="blue" />
          <span className="text-2xl font-extrabold tracking-tight text-white">APEX</span>
        </div>
      </div>

      <div className="mx-4 mt-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/10 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">
            {initials(user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-amber-300/90">
              {streak > 0 && <LordIcon name="streak" size={16} trigger="loop" color="orange" />}
              <span>{streakLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-3 py-5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border border-blue-500/30 bg-blue-500/10 text-blue-200 shadow-[0_0_24px_rgba(59,130,246,0.12)]"
                  : "border border-transparent text-white/50 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <LordIcon
                  name={icon}
                  size={22}
                  trigger={isActive ? "loop-on-hover" : "hover"}
                  color={isActive ? "blue" : "muted"}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}

        <div className="flex-1" />

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? "bg-white/[0.06] text-white" : "text-white/50 hover:bg-white/[0.04] hover:text-white"
            }`
          }
        >
          <LordIcon name="settings" size={22} color="muted" />
          Settings
        </NavLink>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/50 transition hover:bg-white/[0.04] hover:text-white"
          onClick={() => alert("Support chat coming soon!")}
        >
          <LordIcon name="support" size={22} color="muted" />
          Support
        </button>
      </nav>

      <div className="border-t border-white/[0.06] px-4 py-4">
        <p className="truncate text-xs text-white/30">{user.email}</p>
        <button type="button" className="apex-btn-ghost mt-2 w-full" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="p-4 pt-0">
        <button
          type="button"
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_8px_32px_rgba(59,130,246,0.35)] transition hover:brightness-110"
          onClick={() => navigate("/workouts")}
        >
          <LordIcon name="plus" size={20} color="white" trigger="hover" />
          New Workout
        </button>
      </div>
    </aside>
  );
}
