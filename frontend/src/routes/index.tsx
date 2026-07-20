import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Activity, Cpu, ShieldAlert, ArrowUpRight, Plane } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { SeverityBadge } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { mockTrends, recentActivity } from "@/utils/mockData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SecureVision Edge" },
      { name: "description", content: "Fleet overview, inspection activity, and risk score summary for SecureVision Edge." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: components = [] } = useQuery({ queryKey: ["components"], queryFn: api.getComponents });
  const { data: fleetSummaryData } = useQuery({ queryKey: ["fleet-summary"], queryFn: api.getFleetSummary });
  const critical = components.filter((c) => c.status === "ground").length;
  const fleetSummary = [
    { label: "Safe", count: components.filter((c) => c.status === "safe").length, tone: "text-success" },
    { label: "Monitor", count: components.filter((c) => c.status === "monitor").length, tone: "text-primary" },
    { label: "Recheck", count: components.filter((c) => c.status === "recheck").length, tone: "text-warning" },
    { label: "Grounded", count: critical, tone: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Command Center</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Fleet Inspection Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time AI defect intelligence across your operating fleet.</p>
        </div>
        <Link to="/new-inspection" className="group inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition">
          Start New Inspection
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Inspections" value={fleetSummaryData?.total_inspections ?? "…"} delta="" icon={Activity} tone="primary" />
        <KpiCard label="Critical Defects" value={critical} delta="Requires grounding" icon={AlertTriangle} tone="destructive" />
        <KpiCard label="Components Monitored" value={components.length.toLocaleString()} delta="Across 18 airframes" icon={Cpu} tone="primary" />
        <KpiCard label="Fleet Risk Score" value={fleetSummaryData?.fleet_risk_score ?? "…"} delta="" icon={ShieldAlert} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Risk Score Overview</h2>
              <p className="text-xs text-muted-foreground">12-month rolling risk & inspection volume</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Risk</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[oklch(0.75_0.18_195)]" />Inspections</span>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrends}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.63 0.19 258)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.63 0.19 258)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="inspGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.75 0.18 195)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.75 0.18 195)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="oklch(0.7 0.03 250)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.7 0.03 250)" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="riskScore" stroke="oklch(0.63 0.19 258)" strokeWidth={2} fill="url(#riskGrad)" />
                <Area type="monotone" dataKey="inspections" stroke="oklch(0.75 0.18 195)" strokeWidth={2} fill="url(#inspGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-base font-semibold">Fleet Health Summary</h2>
          <p className="text-xs text-muted-foreground">Component status distribution</p>
          <div className="mt-4 space-y-3">
            {fleetSummary.map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="flex items-center gap-3">
                  <Plane className={`h-4 w-4 ${s.tone}`} />
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <span className={`text-lg font-semibold ${s.tone}`}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Recent Inspection Activity</h2>
            <p className="text-xs text-muted-foreground">Latest AI-analyzed component scans</p>
          </div>
          <Link to="/fleet" className="text-xs font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="mt-4 divide-y divide-border/60">
          {recentActivity.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{a.component}</p>
                  <p className="text-xs text-muted-foreground">{a.id} · {a.aircraft}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SeverityBadge severity={a.severity} />
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
