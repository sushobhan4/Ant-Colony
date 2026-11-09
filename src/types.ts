export type TerrainType = 'plains' | 'rolling' | 'river';
export type TrafficLevel = 'light' | 'moderate' | 'heavy';
export type UrgencyLevel = 'critical' | 'urgent' | 'moderate' | 'low';
export type PatientCategory = 'Adult' | 'Child' | 'Senior' | 'Maternal';

export interface ConditionInfo {
  key: string;
  name: string;
  specialty: string;
  hint: string;
}

export interface NodePoint {
  id: number;
  x: number;
  y: number;
  edges: { to: number; roadId: string }[];
}

export interface RoadEdge {
  id: string;
  a: number;
  b: number;
  d: string;
  lengthKm: number;
  traffic: number; // 0 to 1
  major: boolean;
  roadQuality: number; // 0 to 1
  bandwidthMbps: number; // e.g. 5 to 100 Mbps
  travelMinutes: number;
}

export interface Village {
  id: string;
  name: string;
  node: number;
}

export interface Hospital {
  id: string;
  name: string;
  node: number;
  doctors: string[];
  onDuty: string[];
  queue: number; // patient count
  telemedicineHub: boolean;
}

export interface RegionMap {
  regionId: string;
  terrain: TerrainType;
  density: number;
  nodes: NodePoint[];
  roads: RoadEdge[];
  villages: Village[];
  hospitals: Hospital[];
}

export interface PatientProfile {
  villageId: string;
  category: PatientCategory;
  age: string;
  conditionKey: string;
  urgency: UrgencyLevel;
}

export interface CostWeights {
  distance: number;
  traffic: number;
  bandwidth: number;
  wait: number;
}

export interface AcoParams {
  alpha: number;
  beta: number;
  rho: number;
  Q: number;
  antCount: number;
  iterations: number;
}

export interface PathMetrics {
  path: number[];
  hospital: Hospital;
  totalCost: number;
  totalDistanceKm: number;
  driveTimeMinutes: number;
  triageWaitMinutes: number;
  totalEtaMinutes: number;
  avgBandwidthMbps: number;
  congestedCount: number;
  onDutySpecialists: string[];
  costBreakdown: {
    distance: number;
    traffic: number;
    bandwidth: number;
    wait: number;
  };
}

export interface AcoSnapshot {
  iteration: number;
  bestCost: number;
  bestCostHistory: number[];
  bestPath: number[] | null;
  antPaths: number[][];
}

export interface AcoResult {
  snapshots: AcoSnapshot[];
  bestResult: PathMetrics | null;
  dijkstraBaseline: PathMetrics | null;
  alternatives: PathMetrics[];
  history: number[];
}
