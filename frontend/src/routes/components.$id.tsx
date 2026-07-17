import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Thermometer, Gauge, Timer, Wrench } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge";
import { mockComponents } from "@/utils/mockData";
import { api } from "@/services/api";
import type { FleetComponent } from "@/types";

export const Route = createFileRoute("/components/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Component ${params.id} — SecureVision Edge` },
      { name: "description", content: "Component profile, flight hours, stress cycles, and defect history." },
    ],
  }),
  loader: async ({ params }) => {
    const profile = await api.getComponent(params.id);
    const c = profile.component;
    if (!c) throw notFound();
    return c;
  },
  notFoundComponent: ComponentNotFound,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">Error: {error.message}</div>,
  component: ComponentDetails,
});

function ComponentNotFound() {
  return (
    <div className="glass-card rounded-xl p-8 text-center">
      <p className="text-lg font-semibold">Component not found</p>
      <Link to="/fleet" className="mt-4 inline-block text-primary underline">Back to fleet</Link>
    </div>
  );
}

function ComponentDetails() {
  const c = Route.useLoaderData() as FleetComponent;

  return (
    <div className="space-y-6">
      <Link to="/fleet" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Fleet
      </Link>

      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Component Profile</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{c.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{c.id} · {c.aircraft} · Tail {c.tailNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={c.status} />
            <div className="rounded-lg border border-border/60 bg-card/40 px-4 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Risk</p>
              <p className={`text-xl font-semibold ${c.riskScore > 75 ? "text-destructive" : c.riskScore > 50 ? "text-warning" : "text-success"}`}>{c.riskScore}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Flight Hours" value={c.flightHours.toLocaleString()} delta="Since last overhaul" icon={Timer} tone="primary" />
        <KpiCard label="Stress Cycles" value={c.stressCycles.toLocaleString()} delta={`${Math.round(c.stressCycles / 30)} per day avg`} icon={Gauge} tone="warning" />
        <KpiCard label="Temp Exposure" value={`${c.tempExposure}°C`} delta="Peak this month" icon={Thermometer} tone="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-base font-semibold">Historical Inspection Records</h2>
          <div className="mt-4 space-y-3">
            {c.defectHistory.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Wrench className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{d.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <SeverityBadge severity={d.severity} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-base font-semibold">Defect History Timeline</h2>
          <div className="mt-4 relative border-l-2 border-border/60 pl-6 space-y-5">
            {c.defectHistory.map((d, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-[29px] top-1 h-4 w-4 rounded-full shadow-[0_0_0_4px_oklch(0.17_0.03_260)] ${d.severity === "critical" ? "bg-destructive" : d.severity === "high" ? "bg-warning" : d.severity === "medium" ? "bg-primary" : "bg-success"}`} />
                <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString()}</p>
                <p className="mt-0.5 text-sm font-medium">{d.type}</p>
                <p className="text-xs text-muted-foreground">Recorded during scheduled inspection cycle</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
