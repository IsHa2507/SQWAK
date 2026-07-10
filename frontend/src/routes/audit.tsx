import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Link2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockAudit } from "@/utils/mockData";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail — SecureVision Edge" },
      { name: "description", content: "Tamper-evident inspection records with cryptographic hash chain verification." },
    ],
  }),
  component: Audit,
});

function Audit() {
  const verifiedCount = mockAudit.filter((r) => r.verified).length;
  const integrity = Math.round((verifiedCount / mockAudit.length) * 100);
  const allValid = integrity === 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Compliance</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Audit Trail</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tamper-evident, hash-chained inspection ledger for regulatory review.</p>
        </div>
        <Button variant="outline" onClick={() => toast.success("Full hash chain re-verified · integrity OK")}>
          <ShieldCheck className="mr-2 h-4 w-4" /> Verify Chain
        </Button>
      </div>

      <div className={`glass-card rounded-xl p-6 ${allValid ? "border-success/40" : "border-warning/40"}`}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${allValid ? "bg-success/15 border-success/30 text-success" : "bg-warning/15 border-warning/30 text-warning"} border`}>
              {allValid ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Chain Integrity</p>
              <p className={`text-2xl font-semibold ${allValid ? "text-success" : "text-warning"}`}>{allValid ? "Fully Verified" : `${integrity}% Verified`}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{verifiedCount} of {mockAudit.length} records pass cryptographic verification</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-muted-foreground">Records</p><p className="text-xl font-semibold">{mockAudit.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Sealed</p><p className="text-xl font-semibold text-success">{verifiedCount}</p></div>
            <div><p className="text-xs text-muted-foreground">Anomalies</p><p className="text-xl font-semibold text-warning">{mockAudit.length - verifiedCount}</p></div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-base font-semibold">Hash Chain</h2>
        <p className="text-xs text-muted-foreground">Each record cryptographically links to the previous one</p>
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {mockAudit.slice(0, 8).map((r, i) => (
            <div key={r.id} className="flex items-center gap-2 flex-shrink-0">
              <div className={`rounded-lg border px-3 py-2 min-w-[120px] ${r.verified ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Block #{mockAudit.length - i}</p>
                <p className="font-mono text-xs truncate">{r.hash}</p>
                <div className="mt-1 flex items-center gap-1">
                  {r.verified ? <CheckCircle2 className="h-3 w-3 text-success" /> : <XCircle className="h-3 w-3 text-warning" />}
                  <span className={`text-[10px] ${r.verified ? "text-success" : "text-warning"}`}>{r.verified ? "OK" : "Anomaly"}</span>
                </div>
              </div>
              {i < 7 && <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-base font-semibold">Audit Logs</h2>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead>Record ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead className="text-right">Verify</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAudit.map((r) => (
                <TableRow key={r.id} className="border-border/60">
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="text-sm font-medium">{r.action}</TableCell>
                  <TableCell className="text-xs">{r.user}</TableCell>
                  <TableCell className="font-mono text-xs">{r.componentId}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[140px]">{r.hash}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={r.verified ? "ghost" : "outline"}
                      onClick={() => toast[r.verified ? "success" : "warning"](r.verified ? "Record signature valid" : "Anomaly detected — flagged for review")}
                    >
                      {r.verified ? (<><CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-success" />Valid</>) : (<><XCircle className="mr-1.5 h-3.5 w-3.5 text-warning" />Flag</>)}
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
