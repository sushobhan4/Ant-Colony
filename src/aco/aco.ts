import type {
  AcoParams,
  AcoResult,
  AcoSnapshot,
  CostWeights,
  Hospital,
  PathMetrics,
  RegionMap,
  UrgencyLevel,
} from '../types';
import { type Adjacency, computePathMetrics, edgeCost } from './graph';
import { dijkstraNearestEligible } from './dijkstra';

function antWalk(
  source: number,
  destination: number,
  adjacency: Adjacency,
  pheromone: number[][],
  params: AcoParams,
  weights: CostWeights,
  maxHops = 14
): number[] | null {
  const path = [source];
  const visited = new Set<number>([source]);
  let current = source;

  for (let hop = 0; hop < maxHops; hop++) {
    if (current === destination) return path;

    const edges = (adjacency.get(current) ?? []).filter((e) => !visited.has(e.to));
    if (edges.length === 0) return null;

    // Transition probability: tau^alpha * eta^beta
    const scores = edges.map(({ to, road }) => {
      const tau = Math.max(0.01, pheromone[current][to] || 1.0);
      const cost = edgeCost(road, weights);
      const eta = 1.0 / Math.max(0.1, cost);
      return Math.pow(tau, params.alpha) * Math.pow(eta, params.beta);
    });

    const sumScore = scores.reduce((sum, s) => sum + s, 0);
    if (sumScore <= 0) {
      const randomChoice = edges[Math.floor(Math.random() * edges.length)].to;
      current = randomChoice;
      path.push(current);
      visited.add(current);
      continue;
    }

    let roll = Math.random() * sumScore;
    let chosen = 0;
    for (let i = 0; i < scores.length; i++) {
      roll -= scores[i];
      if (roll <= 0) {
        chosen = i;
        break;
      }
    }

    current = edges[chosen].to;
    path.push(current);
    visited.add(current);
  }

  return current === destination ? path : null;
}

export function runFullAco(options: {
  originNode: number;
  eligibleHospitals: Hospital[];
  region: RegionMap;
  adjacency: Adjacency;
  weights: CostWeights;
  params: AcoParams;
  urgency: UrgencyLevel;
}): AcoResult {
  const {
    originNode,
    eligibleHospitals,
    region,
    adjacency,
    weights,
    params,
    urgency,
  } = options;

  const nodeCount = region.nodes.length;
  const snapshots: AcoSnapshot[] = [];
  const history: number[] = [];
  const evaluatedCandidates: PathMetrics[] = [];

  let globalBestResult: PathMetrics | null = null;
  let globalBestCost = Infinity;

  // Run ACO exploration for eligible hospital candidates
  for (const hospital of eligibleHospitals) {
    const destNode = hospital.node;
    const pheromone: number[][] = Array.from({ length: nodeCount }, () =>
      new Array(nodeCount).fill(1.0)
    );

    let hospitalBestMetrics: PathMetrics | null = null;

    for (let iter = 0; iter < params.iterations; iter++) {
      const antPaths: number[][] = [];
      const iterationSolutions: { path: number[]; metrics: PathMetrics }[] = [];

      for (let ant = 0; ant < params.antCount; ant++) {
        const path = antWalk(
          originNode,
          destNode,
          adjacency,
          pheromone,
          params,
          weights
        );

        if (!path) continue;
        const metrics = computePathMetrics(path, hospital, region, weights, urgency);
        if (!metrics) continue;

        antPaths.push(path);
        iterationSolutions.push({ path, metrics });

        if (!hospitalBestMetrics || metrics.totalCost < hospitalBestMetrics.totalCost) {
          hospitalBestMetrics = metrics;
        }

        if (metrics.totalCost < globalBestCost) {
          globalBestCost = metrics.totalCost;
          globalBestResult = metrics;
        }
      }

      // Pheromone evaporation
      for (let i = 0; i < nodeCount; i++) {
        for (let j = 0; j < nodeCount; j++) {
          pheromone[i][j] *= 1.0 - params.rho;
          if (pheromone[i][j] < 0.02) pheromone[i][j] = 0.02;
        }
      }

      // Reinforce top solutions + elitist deposit
      iterationSolutions.sort((a, b) => a.metrics.totalCost - b.metrics.totalCost);
      const elite = iterationSolutions.slice(0, Math.max(2, Math.floor(params.antCount * 0.25)));

      for (const sol of elite) {
        const deposit = params.Q / Math.max(1, sol.metrics.totalCost);
        for (let idx = 0; idx < sol.path.length - 1; idx++) {
          const u = sol.path[idx];
          const v = sol.path[idx + 1];
          pheromone[u][v] += deposit;
          pheromone[v][u] += deposit;
        }
      }

      history.push(Number.isFinite(globalBestCost) ? globalBestCost : 0);

      // Record key snapshots for visual replay / inspection
      if (iter % 3 === 0 || iter === params.iterations - 1) {
        snapshots.push({
          iteration: iter + 1,
          bestCost: globalBestCost,
          bestCostHistory: [...history],
          bestPath: globalBestResult ? [...globalBestResult.path] : null,
          antPaths: antPaths.slice(0, 10),
        });
      }
    }

    if (hospitalBestMetrics) {
      evaluatedCandidates.push(hospitalBestMetrics);
    }
  }

  // Sort alternatives by ACO total cost score
  evaluatedCandidates.sort((a, b) => a.totalCost - b.totalCost);

  // Compute baseline benchmark using Dijkstra shortest physical road distance
  const dijkstraBaseline = dijkstraNearestEligible({
    originNode,
    eligibleHospitals,
    region,
    adjacency,
    weights,
    urgency,
  });

  return {
    snapshots,
    bestResult: globalBestResult ?? evaluatedCandidates[0] ?? null,
    dijkstraBaseline,
    alternatives: evaluatedCandidates,
    history,
  };
}

/**
 * Step runner state for individual ant progression (Next Ant button)
 */
export interface StepAntState {
  originNode: number;
  destNode: number;
  targetHospital: Hospital;
  pheromone: number[][];
  antCountDone: number;
  totalAnts: number;
  activePath: number[] | null;
  bestMetrics: PathMetrics | null;
  historyTrails: number[][];
  batchSolutions: { path: number[]; metrics: PathMetrics }[];
}

export function initStepRun(
  originNode: number,
  targetHospital: Hospital,
  region: RegionMap,
  totalAnts = 42 * 28
): StepAntState {
  const nodeCount = region.nodes.length;
  const pheromone: number[][] = Array.from({ length: nodeCount }, () =>
    new Array(nodeCount).fill(1.0)
  );

  return {
    originNode,
    destNode: targetHospital.node,
    targetHospital,
    pheromone,
    antCountDone: 0,
    totalAnts,
    activePath: null,
    bestMetrics: null,
    historyTrails: [],
    batchSolutions: [],
  };
}

export function stepAdvanceOneAnt(
  stepState: StepAntState,
  region: RegionMap,
  adjacency: Adjacency,
  weights: CostWeights,
  params: AcoParams,
  urgency: UrgencyLevel
): {
  nextState: StepAntState;
  newBest: boolean;
} {
  const { originNode, destNode, targetHospital, pheromone } = stepState;
  const nodeCount = region.nodes.length;

  let path = antWalk(originNode, destNode, adjacency, pheromone, params, weights);
  if (!path) {
    // If stochastic walk didn't reach directly, try a second attempt
    path = antWalk(originNode, destNode, adjacency, pheromone, params, weights, 20);
  }

  let metrics: PathMetrics | null = null;
  if (path) {
    metrics = computePathMetrics(path, targetHospital, region, weights, urgency);
  }

  const nextTrails = [...stepState.historyTrails];
  if (path) {
    nextTrails.push(path);
    if (nextTrails.length > 15) nextTrails.shift();
  }

  let newBest = false;
  let currentBest = stepState.bestMetrics;

  const nextBatch = [...stepState.batchSolutions];
  if (path && metrics) {
    nextBatch.push({ path, metrics });
    if (!currentBest || metrics.totalCost < currentBest.totalCost) {
      currentBest = metrics;
      newBest = true;
    }
  }

  const nextDone = stepState.antCountDone + 1;

  // Evaporation & deposit every 28 ants
  if (nextDone % 28 === 0 && nextBatch.length > 0) {
    for (let i = 0; i < nodeCount; i++) {
      for (let j = 0; j < nodeCount; j++) {
        pheromone[i][j] *= 1.0 - params.rho;
        if (pheromone[i][j] < 0.02) pheromone[i][j] = 0.02;
      }
    }

    nextBatch.sort((a, b) => a.metrics.totalCost - b.metrics.totalCost);
    const top = nextBatch.slice(0, 7);
    for (const sol of top) {
      const deposit = params.Q / Math.max(1, sol.metrics.totalCost);
      for (let idx = 0; idx < sol.path.length - 1; idx++) {
        const u = sol.path[idx];
        const v = sol.path[idx + 1];
        pheromone[u][v] += deposit;
        pheromone[v][u] += deposit;
      }
    }
    nextBatch.length = 0;
  }

  const nextState: StepAntState = {
    ...stepState,
    antCountDone: nextDone,
    activePath: path,
    historyTrails: nextTrails,
    bestMetrics: currentBest,
    batchSolutions: nextBatch,
  };

  return { nextState, newBest };
}
