import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
  streak?: number;
}

export function AppLayout({ children, streak }: AppLayoutProps) {
  return (
    <div className="app-shell min-h-screen">
      <div className="app-glow app-glow-blue" />
      <div className="app-glow app-glow-orange" />
      <Sidebar streak={streak} />
      <main className="relative ml-0 min-h-screen p-4 md:ml-64 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
