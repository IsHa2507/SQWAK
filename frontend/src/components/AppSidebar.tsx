import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ScanLine, FileSearch, TrendingUp, Plane, ShieldCheck, Radar } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/new-inspection", label: "New Inspection", icon: ScanLine },
  { to: "/results", label: "Results", icon: FileSearch },
  { to: "/trends", label: "Trend Analysis", icon: TrendingUp },
  { to: "/fleet", label: "Fleet View", icon: Plane },
  { to: "/audit", label: "Audit Trail", icon: ShieldCheck },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border/50 bg-sidebar/60 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2.5 border-b border-border/50 px-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
          <Radar className="h-5 w-5 text-primary" />
          <span className="absolute inset-0 rounded-lg animate-pulse bg-primary/10" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">SecureVision</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80">Edge</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-[inset_0_0_20px_oklch(0.63_0.19_258/0.15)]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent"
              )}
            >
              <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <p className="text-xs font-medium">Edge AI Online</p>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Offline model v4.2.1</p>
      </div>
    </aside>
  );
}
