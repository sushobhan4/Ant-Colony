import React from 'react';
import type { PathMetrics } from '../types';
import { ConvergenceChart } from './ConvergenceChart';

interface Props {
  bestResult: PathMetrics | null;
  dijkstraBaseline: PathMetrics | null;
  alternatives: PathMetrics[];
  history: number[];
  specialtyRequired: string;
}

export const ResultsCard: React.FC<Props> = ({
  bestResult,
  dijkstraBaseline,
  alternatives,
  history,
  specialtyRequired,
}) => {
  if (!bestResult) {
    return (
      <section className="results-card" aria-label="Referral results">
        <div className="results-heading">
          <h2>Awaiting patient details</h2>
          <span className="result-badge">
            <i></i> READY TO RUN
          </span>
        </div>
        <div className="results-content">
          <p style={{ color: '#7a857b', fontSize: '12px' }}>
            Choose a village, condition, and criticality, then run the simulation to discover the optimal referral path.
          </p>
        </div>
      </section>
    );
  }

  const { hospital } = bestResult;

  return (
    <section className="results-card" aria-label="Referral recommendation results">
      <div className="results-heading">
        <div>
          <span className="card-eyebrow">OPTIMIZATION RESULT</span>
          <h2>{hospital.name} is the best match</h2>
        </div>
        <span className="result-badge success">
          <i></i> BEST OF {alternatives.length} ELIGIBLE
        </span>
      </div>

      <div className="results-content">
        {/* Side-by-Side Comparison: ACO vs. Dijkstra */}
        <div className="benchmark-container">
          {/* ACO Card */}
          <div className="benchmark-card aco">
            <div className="benchmark-header">
              <span className="benchmark-tag">ACO RECOMMENDED</span>
              <small style={{ color: '#38734e', fontWeight: 700, fontSize: '10px' }}>
                Score: {bestResult.totalCost.toFixed(1)}
              </small>
            </div>
            <div className="benchmark-dest">{bestResult.hospital.name}</div>
            <div className="benchmark-metrics">
              <div className="b-metric">
                <span>DISTANCE</span>
                <strong>{Math.round(bestResult.totalDistanceKm)} km</strong>
              </div>
              <div className="b-metric">
                <span>DRIVE TIME</span>
                <strong>{Math.round(bestResult.driveTimeMinutes)} min</strong>
              </div>
              <div className="b-metric">
                <span>TRIAGE WAIT</span>
                <strong>{bestResult.triageWaitMinutes} min</strong>
              </div>
              <div className="b-metric">
                <span>TOTAL ETA</span>
                <strong>{Math.round(bestResult.totalEtaMinutes)} min</strong>
              </div>
              <div className="b-metric">
                <span>BANDWIDTH</span>
                <strong>{Math.round(bestResult.avgBandwidthMbps)} Mbps</strong>
              </div>
              <div className="b-metric">
                <span>QUEUE</span>
                <strong>{bestResult.hospital.queue} pts</strong>
              </div>
            </div>
          </div>

          {/* Dijkstra Baseline Card */}
          {dijkstraBaseline && (
            <div className="benchmark-card dijkstra">
              <div className="benchmark-header">
                <span className="benchmark-tag">DIJKSTRA (SHORTEST)</span>
                <small style={{ color: '#406f96', fontWeight: 700, fontSize: '10px' }}>
                  Score: {dijkstraBaseline.totalCost.toFixed(1)}
                </small>
              </div>
              <div className="benchmark-dest">{dijkstraBaseline.hospital.name}</div>
              <div className="benchmark-metrics">
                <div className="b-metric">
                  <span>DISTANCE</span>
                  <strong>{Math.round(dijkstraBaseline.totalDistanceKm)} km</strong>
                </div>
                <div className="b-metric">
                  <span>DRIVE TIME</span>
                  <strong>{Math.round(dijkstraBaseline.driveTimeMinutes)} min</strong>
                </div>
                <div className="b-metric">
                  <span>TRIAGE WAIT</span>
                  <strong>{dijkstraBaseline.triageWaitMinutes} min</strong>
                </div>
                <div className="b-metric">
                  <span>TOTAL ETA</span>
                  <strong>{Math.round(dijkstraBaseline.totalEtaMinutes)} min</strong>
                </div>
                <div className="b-metric">
                  <span>BANDWIDTH</span>
                  <strong>{Math.round(dijkstraBaseline.avgBandwidthMbps)} Mbps</strong>
                </div>
                <div className="b-metric">
                  <span>QUEUE</span>
                  <strong>{dijkstraBaseline.hospital.queue} pts</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Convergence Sparkline */}
        <ConvergenceChart history={history} />

        {/* Summary Info Subrow */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            padding: '6px 0',
            fontSize: '11px',
            color: '#657367',
          }}
        >
          <span>
            Required specialist: <strong>{specialtyRequired} ✓</strong>
          </span>
          <span>
            Congested road segments: <strong>{bestResult.congestedCount}</strong>
          </span>
          <span>
            Telemedicine hub corridor: <strong>{hospital.telemedicineHub ? 'Yes' : 'Standard'}</strong>
          </span>
        </div>

        {/* Ranked Eligible Facilities Table */}
        <div className="eligible-list">
          <div className="eligible-title">ELIGIBLE HOSPITALS · RANKED BY ACO COMPOSITE SCORE</div>
          <div className="eligible-row" style={{ fontWeight: 700 }}>
            <span>Hospital</span>
            <span>Distance</span>
            <span>Drive Time</span>
            <span>Wait</span>
            <span>Bandwidth</span>
          </div>
          {alternatives.slice(0, 4).map((alt, idx) => (
            <div key={alt.hospital.id} className="eligible-row">
              <strong className={idx === 0 ? 'selected-hospital' : ''}>
                {idx + 1}. {alt.hospital.name}
              </strong>
              <span>{Math.round(alt.totalDistanceKm)} km</span>
              <span>{Math.round(alt.driveTimeMinutes)} min</span>
              <span>{alt.triageWaitMinutes} min</span>
              <span>{Math.round(alt.avgBandwidthMbps)} Mbps</span>
            </div>
          ))}
        </div>

        {/* Clinical Rationale Box */}
        <div className="aco-explanation">
          <span>✳</span>
          <p>
            <strong>Why this referral?</strong> The ant colony explored multiple corridors and deposited pheromone along roads with lower congestion and higher bandwidth. While simple shortest-path sends referrals strictly to the nearest facility, ACO balanced drive time with hospital triage backlog and specialist coverage.
          </p>
        </div>
      </div>
    </section>
  );
};
