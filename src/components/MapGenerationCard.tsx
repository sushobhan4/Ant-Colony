import React from 'react';
import type { TerrainType, TrafficLevel } from '../types';

interface Props {
  villageCount: number;
  setVillageCount: (n: number) => void;
  hospitalCount: number;
  setHospitalCount: (n: number) => void;
  density: number;
  setDensity: (d: number) => void;
  terrain: TerrainType;
  setTerrain: (t: TerrainType) => void;
  trafficLevel: TrafficLevel;
  setTrafficLevel: (l: TrafficLevel) => void;
  onGenerate: () => void;
}

export const MapGenerationCard: React.FC<Props> = ({
  villageCount,
  setVillageCount,
  hospitalCount,
  setHospitalCount,
  density,
  setDensity,
  terrain,
  setTerrain,
  trafficLevel,
  setTrafficLevel,
  onGenerate,
}) => {
  const densityPercent = Math.round(density * 100);
  const previewText =
    densityPercent < 45
      ? 'Sparse rural road network'
      : densityPercent > 80
      ? 'Dense multi-lane network'
      : 'Balanced rural network';

  return (
    <aside className="settings-card" aria-label="Map generator controls">
      <div className="settings-heading">
        <span className="section-step">01</span>
        <div>
          <span className="card-eyebrow">MAP GENERATION</span>
          <h2>Shape your region</h2>
        </div>
      </div>
      <p className="settings-intro">
        Configure rural density, terrain landscape, and hospital facilities.
      </p>

      {/* Villages Slider */}
      <div className="slider-setting">
        <div className="setting-line">
          <label htmlFor="villages-slider">Villages</label>
          <output>{villageCount}</output>
        </div>
        <div className="slider-line">
          <span>4</span>
          <input
            id="villages-slider"
            type="range"
            min={4}
            max={14}
            value={villageCount}
            onChange={(e) => setVillageCount(Number(e.target.value))}
          />
          <span>14</span>
        </div>
      </div>

      {/* Hospitals Slider */}
      <div className="slider-setting">
        <div className="setting-line">
          <label htmlFor="hospitals-slider">Hospitals</label>
          <output>{hospitalCount}</output>
        </div>
        <div className="slider-line">
          <span>2</span>
          <input
            id="hospitals-slider"
            type="range"
            min={2}
            max={8}
            value={hospitalCount}
            onChange={(e) => setHospitalCount(Number(e.target.value))}
          />
          <span>8</span>
        </div>
      </div>

      {/* Road Density Slider */}
      <div className="slider-setting">
        <div className="setting-line">
          <label htmlFor="density-slider">Road density</label>
          <output>{densityPercent}%</output>
        </div>
        <div className="slider-line">
          <span>30%</span>
          <input
            id="density-slider"
            type="range"
            min={30}
            max={100}
            value={densityPercent}
            onChange={(e) => setDensity(Number(e.target.value) / 100)}
          />
          <span>100%</span>
        </div>
      </div>

      {/* Terrain Selector */}
      <div className="form-field">
        <label htmlFor="terrain-select">Landscape</label>
        <div className="select-shell">
          <select
            id="terrain-select"
            value={terrain}
            onChange={(e) => setTerrain(e.target.value as TerrainType)}
          >
            <option value="plains">Punjab plains</option>
            <option value="rolling">Rolling countryside</option>
            <option value="river">River valley</option>
          </select>
          <span>⌄</span>
        </div>
      </div>

      {/* Traffic Level */}
      <div className="form-field">
        <label htmlFor="traffic-select">Starting traffic</label>
        <div className="select-shell">
          <select
            id="traffic-select"
            value={trafficLevel}
            onChange={(e) => setTrafficLevel(e.target.value as TrafficLevel)}
          >
            <option value="moderate">Moderate</option>
            <option value="light">Light</option>
            <option value="heavy">Heavy</option>
          </select>
          <span>⌄</span>
        </div>
      </div>

      {/* Preview Pill */}
      <div className="network-preview">
        <span className="preview-icon">⌁</span>
        <span>
          <strong>{previewText}</strong>
          <small>Dynamic topography · randomized traffic · specialist teams</small>
        </span>
      </div>

      <button className="primary-button" type="button" onClick={onGenerate}>
        <span>Generate new map</span>
        <b>↗</b>
      </button>

      <p className="settings-footnote">
        Every generation reshuffles the road segments, facility queues, and on-duty specialists.
      </p>
    </aside>
  );
};
