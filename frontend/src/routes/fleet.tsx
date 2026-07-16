import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Plane, Search, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { ComponentStatus } from "@/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet View — SecureVision Edge" },
      { name: "description", content: "All inspected aerospace components ranked by risk with fleet-wide statistics." },
    ],
  }),
  component: Fleet,
});

const filters: ("all" | ComponentStatus)[] = ["all", "safe", "monitor", "recheck", "ground"];

function Fleet() {
  const { data: components = [] } = useQuery({ queryKey: ["components"], queryFn: api.getComponents });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]>("all");

  const rows = useMemo(() => {
    return components
      .filter((c) => (status === "all" ? true : c.status === status))
      .filter((c) => `${c.name} ${c.aircraft} ${c.tailNumber} ${c.id}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [q, status, components]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Fleet Operations</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Fleet View</h1>
        <p className="mt-1 text-sm text-muted-foreground">All monitored components ranked by AI-computed risk score.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Components" value={components.length} icon={Plane} tone="primary" />
        <KpiCard label="Safe" value={components.filter(c => c.status === "safe").length} icon={ShieldCheck} tone="success" />
        <KpiCard label="Under Watch" value={components.filter(c => c.status === "recheck" || c.status === "monitor").length} icon={Activity} tone="warning" />
        <KpiCard label="Grounded" value={components.filter(c => c.status === "ground").length} icon={AlertTriangle} tone="destructive" />
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search components, tail numbers…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-card/40" />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/40 p-1">
            <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className={`rounded-md px-3 py-1 text-xs font-medium uppercase tracking-wide transition ${status === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead>Rank</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Tail #</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Inspection</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c, i) => (
                <TableRow key={c.id} className="border-border/60 hover:bg-primary/5">
                  <TableCell className="font-mono text-muted-foreground">#{i + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.aircraft}</TableCell>
                  <TableCell className="font-mono text-xs">{c.tailNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                        <div className={`h-full rounded-full ${c.riskScore > 75 ? "bg-destructive" : c.riskScore > 50 ? "bg-warning" : "bg-success"}`} style={{ width: `${c.riskScore}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{c.riskScore}</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.lastInspection).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/components/$id" params={{ id: c.id }}>Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
