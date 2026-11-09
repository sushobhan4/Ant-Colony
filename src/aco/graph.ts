import type {
  CostWeights,
  Hospital,
  PathMetrics,
  RegionMap,
  RoadEdge,
  UrgencyLevel,
} from '../types';

export interface GraphEdge {
  to: number;
  road: RoadEdge;
}

export type Adjacency = Map<number, GraphEdge[]>;

export function buildAdjacency(region: RegionMap): Adjacency {
  const adj = new Map<number, GraphEdge[]>();
  const roadById = new Map<string, RoadEdge>();
  region.roads.forEach((r) => roadById.set(r.id, r));

  for (const node of region.nodes) {
    const edges: GraphEdge[] = [];
    for (const edge of node.edges) {
      const road = roadById.get(edge.roadId);
      if (road) {
        edges.push({ to: edge.to, road });
      }
    }
    adj.set(node.id, edges);
  }
  return adj;
}

export function getUrgencyMultiplier(urgency: UrgencyLevel): number {
  switch (urgency) {
    case 'critical':
      return 0.25; // wait is heavily penalized; needs immediate attention
    case 'urgent':
      return 0.55;
    case 'moderate':
      return 0.85;
    case 'low':
      return 1.1;
  }
}

export function edgeCost(
  road: RoadEdge,
  weights: CostWeights
): number {
  const distCost = (road.lengthKm / Math.max(0.3, road.roadQuality)) * weights.distance;
  const trafficCost = road.travelMinutes * weights.traffic;
  const bandwidthPenalty = (25 / Math.max(5, road.bandwidthMbps)) * weights.bandwidth;
  return Math.max(0.05, distCost + trafficCost + bandwidthPenalty);
}

export function computePathMetrics(
  path: number[],
  hospital: Hospital,
  region: RegionMap,
  weights: CostWeights,
  urgency: UrgencyLevel
): PathMetrics | null {
  if (path.length < 2) return null;

  const roadLookup = new Map<string, RoadEdge>();
  region.roads.forEach((r) => {
    const k1 = `${r.a}-${r.b}`;
    const k2 = `${r.b}-${r.a}`;
    roadLookup.set(k1, r);
    roadLookup.set(k2, r);
  });

  let totalDistanceKm = 0;
  let driveTimeMinutes = 0;
  let bandwidthSum = 0;
  let congestedCount = 0;
  let pathEdgeCost = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const road = roadLookup.get(`${u}-${v}`);
    if (!road) return null;

    totalDistanceKm += road.lengthKm;
    driveTimeMinutes += road.travelMinutes;
    bandwidthSum += road.bandwidthMbps;
    if (road.traffic > 0.7) congestedCount++;
    pathEdgeCost += edgeCost(road, weights);
  }

  const edgeCount = path.length - 1;
  const avgBandwidthMbps = edgeCount > 0 ? bandwidthSum / edgeCount : 20;

  // Hospital triage wait time based on queue and doctors
  const rawWait = (hospital.queue * 7.5) / Math.max(1, hospital.onDuty.length / 2);
  const triageWaitMinutes = Math.max(2, Math.round(rawWait * (1 / getUrgencyMultiplier(urgency))));
  const waitCost = triageWaitMinutes * weights.wait;

  const totalCost = pathEdgeCost + waitCost;
  const totalEtaMinutes = driveTimeMinutes + triageWaitMinutes;

  return {
    path,
    hospital,
    totalCost,
    totalDistanceKm,
    driveTimeMinutes,
    triageWaitMinutes,
    totalEtaMinutes,
    avgBandwidthMbps,
    congestedCount,
    onDutySpecialists: hospital.onDuty,
    costBreakdown: {
      distance: totalDistanceKm * weights.distance,
      traffic: driveTimeMinutes * weights.traffic,
      bandwidth: (25 / Math.max(5, avgBandwidthMbps)) * weights.bandwidth * edgeCount,
      wait: waitCost,
    },
  };
}
