# Nabha-Net (Combined Edition)

**Ant Colony Optimization for Rural Telemedicine Referral Networks**

This edition unifies:
1. **The Visual Design & Immersion of `myApproach`**:
   - Custom typography (`DM Sans` + `Manrope`).
   - Authentic cartography: procedural Punjab plains, rolling countryside, and winding river valleys.
   - SVG texture background, multi-tier road styling with congestion dashing.
   - Distinct village nodes (green halos) and hospital facility markers with medical crosses and queue tags.
   - **Step-by-step single ant advance & press-and-hold animation** (`<animateMotion>`).
   - Interactive zoom/pan controls, compass rose, and scale bar.

2. **The Software Architecture & Algorithmic Rigor of `myFriendApproach`**:
   - Built with **React 18 + TypeScript + Vite**.
   - Modular engine structure (`aco.ts`, `graph.ts`, `dijkstra.ts`).
   - Strict TypeScript interfaces (`Facility`, `RoadEdge`, `CostWeights`, `AcoParams`, `PathMetrics`).
   - **Multi-objective optimization**: models physical road distance, road quality, congestion travel time, telemedicine bandwidth (Mbps), and triage backlog.
   - **Side-by-side benchmark comparison against Dijkstra**: displays physical shortest-path vs. ACO multi-objective route.
   - **Convergence tracking**: real-time SVG sparkline tracking best cost minimization across iterations.
   - **ACO Hyperparameters modal**: allows real-time tuning of $\alpha$, $\beta$, $\rho$, $Q$, and cost weights.

---

### Quick Start

```powershell
cd Combined
npm install
npm run dev
```

Server URL: **http://localhost:5174**
