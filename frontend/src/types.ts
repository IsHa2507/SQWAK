export type ComponentStatus = "safe" | "monitor" | "recheck" | "ground";
export type Severity = "low" | "medium" | "high" | "critical";

export interface DefectRecord {
  date: string;
  type: string;
  severity: Severity;
}

export interface FleetComponent {
  id: string;
  name: string;
  aircraft: string;
  tailNumber: string;
  status: ComponentStatus;
  riskScore: number;
  flightHours: number;
  stressCycles: number;
  tempExposure: number;
  lastInspection: string;
  defectHistory: DefectRecord[];
}

export interface Defect {
  id: string;
  type: string;
  severity: Severity;
  confidence: number;
  location: string;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface InspectionResult {
  id: string;
  componentId: string;
  componentName: string;
  aircraftModel: string;
  timestamp: string;
  riskScore: number;
  defects: Defect[];
  recommendation: string;
  maintenanceAction: string;
  imageUrl?: string;
}

export interface TrendPoint {
  date: string;
  riskScore: number;
  inspections: number;
  defectSize: number;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  componentId: string;
  hash: string;
  verified: boolean;
}
