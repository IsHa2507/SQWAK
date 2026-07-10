import { mockAudit, mockComponents, mockInspection, mockTrends } from "@/utils/mockData";
import type { AuditRecord, FleetComponent, InspectionResult, TrendPoint } from "@/types";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const api = {
  async inspect(payload: { componentId: string; aircraft: string; notes: string; imageDataUrl?: string }): Promise<InspectionResult> {
    await delay(1200);
    return { ...mockInspection, componentId: payload.componentId || mockInspection.componentId, aircraftModel: payload.aircraft || mockInspection.aircraftModel, imageUrl: payload.imageDataUrl || "" };
  },
  async getComponents(): Promise<FleetComponent[]> {
    await delay(300);
    return mockComponents;
  },
  async getComponent(id: string): Promise<FleetComponent | undefined> {
    await delay(300);
    return mockComponents.find((c) => c.id === id) ?? mockComponents[0];
  },
  async getTrends(_id: string): Promise<TrendPoint[]> {
    await delay(300);
    return mockTrends;
  },
  async getFleet(): Promise<FleetComponent[]> {
    await delay(300);
    return mockComponents;
  },
  async getAudit(): Promise<AuditRecord[]> {
    await delay(300);
    return mockAudit;
  },
};
