import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Clock, Gauge, Lightbulb } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { mockTrends } from "@/utils/mockData";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trend Analysis — SecureVision Edge" },
      { name: "description", content: "Defect growth trends, risk prediction, and safe operating window." },
    ],
  }),
  component: Trends,
});

const chartStyle = { background: "oklch(0.18 0.03 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 };

function Trends() {
  const insights = [
    { title: "Fatigue crack propagation", body: "Sector 3A shows 2.4× baseline growth over last quarter. Consider ultrasonic screening cadence increase." },
    { title: "Corrosion clusters correlate with humidity", body: "Coastal-based airframes trending 18% higher corrosion incidence vs inland fleet." },
    { title: "Predicted grounding risk", body: "3 components projected to cross critical threshold within 90 flight cycles." },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Predictive Analytics</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Trend Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historical defect evolution and forward-looking risk projections.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Component Health" value="72%" delta="Trending down 4%" icon={Gauge} tone="warning" />
        <KpiCard label="Safe Ops Window" value="184 hrs" delta="~ 42 flight cycles" icon={Clock} tone="primary" />
        <KpiCard label="Defect Growth Rate" value="+12%" delta="30-day rolling avg" icon={TrendingUp} tone="destructive" />
        <KpiCard label="Prediction Confidence" value="94%" delta="Model svEdge v4.2" icon={Lightbulb} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-base font-semibold">Defect Growth (mm)</h2>
          <p className="text-xs text-muted-foreground">Longest crack measurement over time</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrends}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="oklch(0.7 0.03 250)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.7 0.03 250)" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartStyle} />
                <Line type="monotone" dataKey="defectSize" stroke="oklch(0.62 0.24 25)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-base font-semibold">Risk Prediction</h2>
          <p className="text-xs text-muted-foreground">Projected risk score with critical threshold</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrends}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="oklch(0.7 0.03 250)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.7 0.03 250)" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartStyle} />
                <ReferenceLine y={80} stroke="oklch(0.62 0.24 25)" strokeDasharray="4 4" label={{ value: "Critical", fill: "oklch(0.62 0.24 25)", fontSize: 10, position: "right" }} />
                <Line type="monotone" dataKey="riskScore" stroke="oklch(0.63 0.19 258)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 rounded-xl p-5">
          <h2 className="text-base font-semibold">Historical Inspection Timeline</h2>
          <div className="mt-4 relative border-l-2 border-border/60 pl-6 space-y-6">
            {mockTrends.slice(-6).reverse().map((t, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-[0_0_0_4px_oklch(0.17_0.03_260)]" />
                <p className="text-xs text-muted-foreground">{t.date} 2026</p>
                <p className="mt-0.5 text-sm font-medium">Inspection cycle #{mockTrends.length - i}</p>
                <p className="text-xs text-muted-foreground">Defect size: {t.defectSize}mm · Risk: {t.riskScore} · {t.inspections} scans</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-base font-semibold">Trend Insights</h2>
          <div className="mt-4 space-y-4">
            {insights.map((ins, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  <p className="text-sm font-medium">{ins.title}</p>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{ins.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
