import { cn } from "@/lib/utils";
import type { ComponentStatus, Severity } from "@/types";

const statusStyles: Record<ComponentStatus, string> = {
  safe: "bg-success/15 text-success border-success/30",
  monitor: "bg-primary/15 text-primary border-primary/30",
  recheck: "bg-warning/15 text-warning border-warning/30",
  ground: "bg-destructive/15 text-destructive border-destructive/40",
};

const severityStyles: Record<Severity, string> = {
  low: "bg-success/15 text-success border-success/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  high: "bg-warning/15 text-warning border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/40",
};

export function StatusBadge({ status }: { status: ComponentStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide", statusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide", severityStyles[severity])}>
      {severity}
    </span>
  );
}
