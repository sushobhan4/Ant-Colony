import React from 'react';
import type { AcoParams, CostWeights } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  params: AcoParams;
  setParams: React.Dispatch<React.SetStateAction<AcoParams>>;
  weights: CostWeights;
  setWeights: React.Dispatch<React.SetStateAction<CostWeights>>;
}

export const AcoParametersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  params,
  setParams,
  weights,
  setWeights,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>ACO Hyperparameters & Cost Weights</h3>
          <button className="modal-close" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-section-title">Ant Colony Metaheuristic</div>

        <div className="slider-setting">
          <div className="setting-line">
            <label>Alpha (α) — Pheromone Weight</label>
            <output>{params.alpha.toFixed(1)}</output>
          </div>
          <div className="slider-line">
            <span>0.2</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={params.alpha}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, alpha: parseFloat(e.target.value) }))
              }
            />
            <span>3.0</span>
          </div>
        </div>

        <div className="slider-setting">
          <div className="setting-line">
            <label>Beta (β) — Heuristic Desirability</label>
            <output>{params.beta.toFixed(1)}</output>
          </div>
          <div className="slider-line">
            <span>0.5</span>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={params.beta}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, beta: parseFloat(e.target.value) }))
              }
            />
            <span>4.0</span>
          </div>
        </div>

        <div className="slider-setting">
          <div className="setting-line">
            <label>Rho (ρ) — Evaporation Rate</label>
            <output>{params.rho.toFixed(2)}</output>
          </div>
          <div className="slider-line">
            <span>0.05</span>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={params.rho}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, rho: parseFloat(e.target.value) }))
              }
            />
            <span>0.50</span>
          </div>
        </div>

        <div className="slider-setting">
          <div className="setting-line">
            <label>Ant Count per Iteration</label>
            <output>{params.antCount}</output>
          </div>
          <div className="slider-line">
            <span>10</span>
            <input
              type="range"
              min="10"
              max="40"
              step="2"
              value={params.antCount}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, antCount: parseInt(e.target.value, 10) }))
              }
            />
            <span>40</span>
          </div>
        </div>

        <div className="modal-section-title">Multi-Objective Cost Factors</div>

        <div className="slider-setting">
          <div className="setting-line">
            <label>Distance Weight</label>
            <output>{weights.distance.toFixed(1)}</output>
          </div>
          <div className="slider-line">
            <span>0.2</span>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={weights.distance}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, distance: parseFloat(e.target.value) }))
              }
            />
            <span>2.0</span>
          </div>
        </div>

        <div className="slider-setting">
          <div className="setting-line">
            <label>Telemedicine Bandwidth Importance</label>
            <output>{weights.bandwidth.toFixed(1)}</output>
          </div>
          <div className="slider-line">
            <span>0.1</span>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={weights.bandwidth}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, bandwidth: parseFloat(e.target.value) }))
              }
            />
            <span>2.0</span>
          </div>
        </div>

        <div className="slider-setting">
          <div className="setting-line">
            <label>Hospital Wait Penalty</label>
            <output>{weights.wait.toFixed(1)}</output>
          </div>
          <div className="slider-line">
            <span>0.1</span>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={weights.wait}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, wait: parseFloat(e.target.value) }))
              }
            />
            <span>2.0</span>
          </div>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={onClose}
          style={{ marginTop: '16px' }}
        >
          Save & Apply Parameters
        </button>
      </div>
    </div>
  );
};
