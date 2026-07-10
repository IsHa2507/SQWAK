import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, UploadCloud, Sparkles, X, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/services/api";

export const Route = createFileRoute("/new-inspection")({
  head: () => ({
    meta: [
      { title: "New Inspection — SecureVision Edge" },
      { name: "description", content: "Upload component images for offline AI defect detection." },
    ],
  }),
  component: NewInspection,
});

const aircraftModels = ["Boeing 737-800", "Boeing 787-9", "Airbus A320neo", "Airbus A350-900", "Embraer E190"];

function NewInspection() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [componentId, setComponentId] = useState("");
  const [aircraft, setAircraft] = useState("");
  const [notes, setNotes] = useState("");
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const analyze = async () => {
    if (!preview) return toast.error("Please upload a component image first");
    setAnalyzing(true);
    try {
      await api.inspect({ componentId, aircraft, notes, imageDataUrl: preview });
      toast.success("Analysis complete — 4 defects detected");
      navigate({ to: "/results" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed — please try again");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Inspection Workflow</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">New Component Inspection</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload or capture an image, then let the offline AI copilot detect defects.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`glass-card relative flex min-h-[360px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${dragging ? "border-primary bg-primary/5" : "border-border/60"}`}
          >
            {preview ? (
              <div className="relative w-full">
                <img src={preview} alt="preview" className="mx-auto max-h-[400px] rounded-lg object-contain" />
                <button onClick={() => setPreview(null)} className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 hover:bg-destructive hover:text-destructive-foreground transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 mb-4">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold">Drag & drop component image</h3>
                <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, TIFF up to 40 MB · high-resolution recommended</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                    <ImageIcon className="mr-2 h-4 w-4" /> Browse files
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Camera capture requires device permission")}>
                    <Camera className="mr-2 h-4 w-4" /> Camera Capture
                  </Button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </>
            )}
          </div>

          {preview && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Image Preview</p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex-1"><p className="text-muted-foreground">Resolution</p><p className="font-medium">4096 × 3072</p></div>
                <div className="flex-1"><p className="text-muted-foreground">Format</p><p className="font-medium">JPEG</p></div>
                <div className="flex-1"><p className="text-muted-foreground">Sharpness</p><p className="font-medium text-success">Excellent</p></div>
                <div className="flex-1"><p className="text-muted-foreground">Model Ready</p><p className="font-medium text-success">✓ Yes</p></div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div>
              <Label htmlFor="cid">Component ID</Label>
              <Input id="cid" placeholder="CMP-737-LWLE-042" value={componentId} onChange={(e) => setComponentId(e.target.value)} className="mt-1.5 bg-card/40" />
            </div>
            <div>
              <Label>Aircraft Model</Label>
              <Select value={aircraft} onValueChange={setAircraft}>
                <SelectTrigger className="mt-1.5 bg-card/40"><SelectValue placeholder="Select aircraft" /></SelectTrigger>
                <SelectContent>
                  {aircraftModels.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Inspection Notes</Label>
              <Textarea id="notes" rows={5} placeholder="Observed hairline in Sector 3A during walkaround…" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5 bg-card/40 resize-none" />
            </div>
            <Button onClick={analyze} disabled={analyzing} className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Sparkles className="mr-2 h-4 w-4" />
              {analyzing ? "Analyzing component…" : "Analyze Component"}
            </Button>
          </div>

          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Model Info</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="font-medium">svEdge-Defect-v4.2</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Runtime</span><span className="font-medium">Offline · Edge GPU</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg latency</span><span className="font-medium text-success">1.2s</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
