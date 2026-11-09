import React from 'react';

interface Props {
  history: number[];
}

export const ConvergenceChart: React.FC<Props> = ({ history }) => {
  const valid = history.filter((v) => Number.isFinite(v) && v > 0);
  if (valid.length < 2) return null;

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const w = 220;
  const h = 50;
  const pad = 6;
  const range = max - min || 1;

  const points = valid
    .map((v, i) => {
      const x = pad + (i / (valid.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const initialCost = valid[0].toFixed(1);
  const finalCost = valid[valid.length - 1].toFixed(1);

  return (
    <div className="convergence-box">
      <div className="convergence-info">
        <strong>Optimization Convergence</strong>
        <small>
          Initial: {initialCost} → Converged: {finalCost}
        </small>
      </div>
      <svg className="convergence-svg" viewBox={`0 0 ${w} ${h}`} aria-label="Convergence chart">
        <polyline
          fill="none"
          stroke="#2f7850"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <circle
          cx={pad}
          cy={h - pad - ((valid[0] - min) / range) * (h - pad * 2)}
          r="3"
          fill="#c97155"
        />
        <circle
          cx={w - pad}
          cy={h - pad - ((valid[valid.length - 1] - min) / range) * (h - pad * 2)}
          r="3"
          fill="#2f7850"
        />
      </svg>
    </div>
  );
};
