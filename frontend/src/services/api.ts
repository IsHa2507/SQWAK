const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function mapComponent(c: any) {
  return {
    id: c.component_id,
    name: c.name,
    aircraft: c.aircraft_model,
    tailNumber: c.tail_number,
    status: c.status,
    riskScore: c.risk_score,
    flightHours: c.flight_hours,
    stressCycles: c.stress_cycles,
    tempExposure: c.temperature_exposure,
    lastInspection: c.created_at, // placeholder — see note below
    defectHistory: [],
  };
}

export const api = {
  async inspect(payload: { componentId: string; aircraft: string; notes: string; imageDataUrl?: string }) {
    const form = new FormData();
    form.append("component_id", payload.componentId);
    form.append("aircraft", payload.aircraft);
    form.append("notes", payload.notes);
    if (payload.imageDataUrl) {
      const blob = await (await fetch(payload.imageDataUrl)).blob();
      form.append("image", blob, "capture.jpg");
    }
    const res = await fetch(`${BASE_URL}/api/inspect`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Analysis failed");
    return res.json();
  },
  async getComponents() {
    const raw = await fetch(`${BASE_URL}/api/components`).then((r) => r.json());
    return raw.map(mapComponent);
  },
  async getFleet() {
    return this.getComponents();
  },
  async getComponent(id: string) {
    return fetch(`${BASE_URL}/api/components/${id}`).then((r) => r.json());
  },

  async getAudit() {
    return fetch(`${BASE_URL}/api/audit`).then((r) => r.json());
  },
  async getFleetSummary() {
    return fetch(`${BASE_URL}/api/fleet-summary`).then((r) => r.json());
  },
};