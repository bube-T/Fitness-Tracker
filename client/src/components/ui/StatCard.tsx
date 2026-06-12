import type { ReactNode } from "react";
import { LordIcon, type LordIconProps } from "./LordIcon";

interface StatCardProps {
  label: string;
  children: ReactNode;
  icon?: LordIconProps["name"];
  iconColor?: LordIconProps["color"];
  accent?: "blue" | "orange" | "pink" | "green";
  footer?: ReactNode;
  className?: string;
}

const ACCENT_GLOW = {
  blue: "from-blue-500/20 via-blue-500/5 to-transparent shadow-[inset_0_1px_0_rgba(59,130,246,0.15)]",
  orange: "from-amber-500/20 via-amber-500/5 to-transparent shadow-[inset_0_1px_0_rgba(245,158,11,0.15)]",
  pink: "from-pink-500/20 via-pink-500/5 to-transparent shadow-[inset_0_1px_0_rgba(244,114,182,0.15)]",
  green: "from-emerald-500/20 via-emerald-500/5 to-transparent shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]",
};

export function StatCard({
  label,
  children,
  icon,
  iconColor = "blue",
  accent = "blue",
  footer,
  className = "",
}: StatCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${ACCENT_GLOW[accent]} p-6 backdrop-blur-xl transition hover:border-white/[0.14] ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.03] blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
        {icon && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-2">
            <LordIcon name={icon} size={28} color={iconColor} trigger="loop-on-hover" />
          </div>
        )}
      </div>
      <div className="relative mt-3">{children}</div>
      {footer && <div className="relative mt-4">{footer}</div>}
    </article>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LordIconProps["name"];
}

export function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  return (
    <header className="mb-8 flex items-start gap-4">
      {icon && (
        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:block">
          <LordIcon name={icon} size={36} trigger="loop-on-hover" />
        </div>
      )}
      <div>
        <h1 className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">{subtitle}</p>}
      </div>
    </header>
  );
}

interface GlassCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const PAD = { sm: "p-4", md: "p-6", lg: "p-8" };

export function GlassCard({ title, action, children, className = "", padding = "md" }: GlassCardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl ${PAD[padding]} ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/50">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
