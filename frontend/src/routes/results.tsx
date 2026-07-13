import { createFileRoute } from "@tanstack/react-router";
import { Download, Sparkles, Wrench, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityBadge } from "@/components/StatusBadge";
import { mockInspection } from "@/utils/mockData";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Inspection Results — SecureVision Edge" },
      { name: "description", content: "AI-detected defects, annotations, and maintenance recommendations." },
    ],
  }),
  component: Results,
});

const severityColor: Record<string, string> = {
  critical: "oklch(0.62 0.24 25)",
  high: "oklch(0.78 0.16 75)",
  medium: "oklch(0.63 0.19 258)",
  low: "oklch(0.68 0.16 155)",
};

function Results() {
  const r = mockInspection;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Inspection {r.id}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{r.componentName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{r.aircraftModel} · Component {r.componentId} · {new Date(r.timestamp).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast.success("Report downloaded (PDF)") }>
            <Download className="mr-2 h-4 w-4" /> Download Report
          </Button>
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-destructive">Risk Score</p>
            <p className="text-xl font-semibold text-destructive">{r.riskScore}/100</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 rounded-xl p-5">
          <h2 className="text-base font-semibold">Annotated Component View</h2>
          <p className="text-xs text-muted-foreground">AI-detected defect regions overlaid on source image</p>
          <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/60 bg-black">
            {r.imageUrl ? (
              <img src={r.imageUrl} alt="component" className="h-full w-full object-cover opacity-90" />
            ) : (
              <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 40% 40%, oklch(0.3 0.05 250), oklch(0.14 0.03 260))" }}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(oklch(1 0 0 / 0.1) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              </div>
            )}
            {r.defects.map((d, i) => (
              <div
                key={d.id}
                className="absolute rounded border-2 animate-pulse"
                style={{
                  left: `${d.bbox.x}%`,
                  top: `${d.bbox.y}%`,
                  width: `${d.bbox.w}%`,
                  height: `${d.bbox.h}%`,
                  borderColor: severityColor[d.severity],
                  boxShadow: `0 0 20px ${severityColor[d.severity]}`,
                  animationDelay: `${i * 300}ms`,
                }}
              >
                <span
                  className="absolute left-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white whitespace-nowrap"
                  style={{
                    background: severityColor[d.severity],
                    ...(d.bbox.y < 8
                      ? { top: "calc(100% + 2px)" }
                      : { bottom: "calc(100% + 2px)" }),
                  }}
                >
                  {d.type} · {Math.round(d.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">AI Recommendation</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.recommendation}</p>
          </div>

          <div className="glass-card rounded-xl p-5 border-warning/30">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 border border-warning/30">
                <Wrench className="h-4 w-4 text-warning" />
              </div>
              <h3 className="text-sm font-semibold">Maintenance Action</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.maintenanceAction}</p>
            <Button className="mt-4 w-full" variant="secondary">Create Work Order</Button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="text-base font-semibold">Detected Defects ({r.defects.length})</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead>Defect Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.defects.map((d) => (
                <TableRow key={d.id} className="border-border/60">
                  <TableCell className="font-medium">{d.type}</TableCell>
                  <TableCell><SeverityBadge severity={d.severity} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${d.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium">{Math.round(d.confidence * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.location}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm">Inspect</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
