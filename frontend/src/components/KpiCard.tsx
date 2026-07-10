import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive";
}

const toneStyles = {
  primary: "text-primary bg-primary/10 border-primary/20",
  success: "text-success bg-success/10 border-success/20",
  warning: "text-warning bg-warning/10 border-warning/20",
  destructive: "text-destructive bg-destructive/10 border-destructive/20",
};

export function KpiCard({ label, value, delta, icon: Icon, tone = "primary" }: KpiCardProps) {
  return (
    <div className="glass-card group relative overflow-hidden rounded-xl p-5 transition-all hover:border-primary/40 hover:-translate-y-0.5">
      <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "var(--gradient-glow)" }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg border", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
