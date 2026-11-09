import type {
  CostWeights,
  Hospital,
  PathMetrics,
  RegionMap,
  UrgencyLevel,
} from '../types';
import { type Adjacency, computePathMetrics } from './graph';

export function dijkstraShortestPath(options: {
  originNode: number;
  targetHospital: Hospital;
  region: RegionMap;
  adjacency: Adjacency;
  weights: CostWeights;
  urgency: UrgencyLevel;
}): PathMetrics | null {
  const { originNode, targetHospital, region, adjacency, weights, urgency } = options;
  const destinationNode = targetHospital.node;

  const nodeCount = region.nodes.length;
  const dist = new Array(nodeCount).fill(Infinity);
  const prev = new Array<number | null>(nodeCount).fill(null);
  const visited = new Set<number>();

  dist[originNode] = 0;

  for (let i = 0; i < nodeCount; i++) {
    let u = -1;
    let best = Infinity;
    for (let j = 0; j < nodeCount; j++) {
      if (!visited.has(j) && dist[j] < best) {
        best = dist[j];
        u = j;
      }
    }

    if (u === -1 || !Number.isFinite(best)) break;
    if (u === destinationNode) break;

    visited.add(u);

    const neighbors = adjacency.get(u) ?? [];
    for (const edge of neighbors) {
      const v = edge.to;
      if (visited.has(v)) continue;
      // Standard baseline shortest path minimizes physical road distance
      const weight = edge.road.lengthKm;
      const alt = dist[u] + weight;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }

  if (!Number.isFinite(dist[destinationNode])) return null;

  const path: number[] = [];
  let curr: number | null = destinationNode;
  while (curr !== null) {
    path.push(curr);
    curr = prev[curr];
  }
  path.reverse();

  if (path[0] !== originNode) return null;

  return computePathMetrics(path, targetHospital, region, weights, urgency);
}

/**
 * Finds the nearest eligible hospital by standard physical road distance
 * to act as the classic routing baseline (naive shortest-path).
 */
export function dijkstraNearestEligible(options: {
  originNode: number;
  eligibleHospitals: Hospital[];
  region: RegionMap;
  adjacency: Adjacency;
  weights: CostWeights;
  urgency: UrgencyLevel;
}): PathMetrics | null {
  const { originNode, eligibleHospitals, region, adjacency, weights, urgency } = options;

  let bestMetrics: PathMetrics | null = null;
  let minPhysicalDistance = Infinity;

  for (const hospital of eligibleHospitals) {
    const metrics = dijkstraShortestPath({
      originNode,
      targetHospital: hospital,
      region,
      adjacency,
      weights,
      urgency,
    });
    if (metrics && metrics.totalDistanceKm < minPhysicalDistance) {
      minPhysicalDistance = metrics.totalDistanceKm;
      bestMetrics = metrics;
    }
  }

  return bestMetrics;
}
