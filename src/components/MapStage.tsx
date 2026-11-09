import React, { useRef, useState } from 'react';
import type { RegionMap } from '../types';

interface Props {
  region: RegionMap;
  selectedVillageId: string;
  onSelectVillage: (villageId: string) => void;
  acoPath: number[] | null;
  dijkstraPath: number[] | null;
  activeAntPath: number[] | null;
  antTrails: number[][];
  bestHospitalId?: string;
  isSimulationView?: boolean;
  mapToast?: string;
}

export const MapStage: React.FC<Props> = ({
  region,
  selectedVillageId,
  onSelectVillage,
  acoPath,
  dijkstraPath,
  activeAntPath,
  antTrails,
  bestHospitalId,
  isSimulationView = false,
  mapToast,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 960, h: 580 });
  const [isExpanded, setIsExpanded] = useState(false);

  const nodeMap = new Map(region.nodes.map((n) => [n.id, n]));

  function getPathD(nodes: number[]): string {
    if (nodes.length < 2) return '';
    const first = nodeMap.get(nodes[0]);
    if (!first) return '';
    let d = `M${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
    for (let i = 1; i < nodes.length; i++) {
      const pt = nodeMap.get(nodes[i]);
      if (pt) d += ` L${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }
    return d;
  }

  function handleZoom(direction: 'in' | 'out' | 'reset') {
    if (direction === 'reset') {
      setViewBox({ x: 0, y: 0, w: 960, h: 580 });
      return;
    }
    const factor = direction === 'in' ? 1.3 : 1 / 1.3;
    const w = Math.max(380, Math.min(960, viewBox.w / factor));
    const h = (w * 580) / 960;
    const x = Math.max(0, Math.min(960 - w, viewBox.x + (viewBox.w - w) / 2));
    const y = Math.max(0, Math.min(580 - h, viewBox.y + (viewBox.h - h) / 2));
    setViewBox({ x, y, w, h });
  }

  const selectedVillage = region.villages.find((v) => v.id === selectedVillageId);
  const patientPos = selectedVillage ? nodeMap.get(selectedVillage.node) : null;

  const parks: [number, number, number, number][] = [
    [90, 180, 76, 36],
    [320, 95, 64, 30],
    [525, 470, 86, 42],
    [815, 210, 71, 38],
    [380, 335, 51, 25],
    [130, 420, 50, 26],
    [710, 370, 68, 35],
  ];

  const riverD =
    'M75 -15 C160 83 159 154 326 207 S465 297 576 347 S745 476 860 600';

  const acoRouteD = acoPath ? getPathD(acoPath) : '';
  const dijkstraRouteD = dijkstraPath ? getPathD(dijkstraPath) : '';
  const activeAntMotionD = activeAntPath ? getPathD(activeAntPath) : '';
  const firstActiveNode = activeAntPath ? nodeMap.get(activeAntPath[0]) : null;

  return (
    <section className={`map-card ${isExpanded ? 'expanded' : ''}`} aria-label="Map card">
      <div className="map-toolbar">
        <div className="map-title">
          <span className="map-pin-mini">⌖</span>
          <div>
            <strong>
              {isSimulationView ? 'Ant Colony Referral Map' : 'Rural Road Network'}
            </strong>
            <small>
              {region.terrain === 'plains'
                ? 'Punjab plains'
                : region.terrain === 'river'
                ? 'River valley'
                : 'Rolling countryside'}{' '}
              · {region.regionId}
            </small>
          </div>
        </div>

        <div className="map-toolbar-right">
          <span className="map-status">
            <i></i> {isSimulationView ? 'ACO ROUTE VIEW' : 'NETWORK PREVIEW'}
          </span>
          <button
            className="map-expand"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore map' : 'Expand map'}
          >
            {isExpanded ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      <div className="map-stage">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          role="img"
          aria-label="Map graphic"
        >
          <defs>
            <pattern
              id="mapTexture"
              width="23"
              height="23"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="4" r="0.55" fill="#cdd5c8" />
              <circle cx="17" cy="16" r="0.45" fill="#d2d9ca" />
            </pattern>
            <filter
              id="routeShadow"
              x="-15%"
              y="-20%"
              width="130%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>

          {/* Background & Texture */}
          <rect width="960" height="580" fill="#eef1e7" />
          <rect width="960" height="580" fill="url(#mapTexture)" opacity="0.35" />

          {/* Park elements */}
          {parks.map(([x, y, rx, ry], idx) => (
            <path
              key={idx}
              d={`M${x - rx} ${y}q${14 + idx * 2} ${-ry} ${rx * 0.48} ${-ry * 0.65}t${rx * 0.65} ${ry * 0.1}q${rx * 0.38} ${ry * 0.7} ${-rx * 0.05} ${ry}t${-rx * 0.8} ${ry * 0.15}q${-rx * 0.75} ${-ry * 0.1} ${-rx * 0.85} ${-ry * 0.6}Z`}
              fill="#dfebd4"
              opacity="0.78"
            />
          ))}

          {/* River valley option */}
          {region.terrain === 'river' && (
            <>
              <path d={riverD} fill="none" stroke="#d6e9e7" strokeWidth="24" />
              <path
                d={riverD}
                fill="none"
                stroke="#b9d9d8"
                strokeWidth="12"
                opacity="0.87"
              />
            </>
          )}

          {/* Landmark text labels */}
          <text
            x="120"
            y="85"
            fill="#899586"
            opacity="0.75"
            fontFamily="DM Sans, sans-serif"
            fontSize="12"
            letterSpacing="2.1"
            fontWeight="700"
          >
            NABHA RURAL BELT
          </text>
          <text
            x="680"
            y="85"
            fill="#899586"
            opacity="0.75"
            fontFamily="DM Sans, sans-serif"
            fontSize="11"
            letterSpacing="2.1"
            fontWeight="700"
          >
            PATIALA DISTRICT
          </text>
          <text
            x="165"
            y="515"
            fill="#899586"
            opacity="0.75"
            fontFamily="DM Sans, sans-serif"
            fontSize="10"
            letterSpacing="2.1"
            fontWeight="700"
          >
            KISHANGARH CORRIDOR
          </text>
          <text
            x="800"
            y="470"
            fill="#899586"
            opacity="0.75"
            fontFamily="DM Sans, sans-serif"
            fontSize="10"
            letterSpacing="2.1"
            fontWeight="700"
          >
            BHADSON HIGHWAY
          </text>

          {/* Road Network */}
          {region.roads.map((road) => {
            const isCongested = road.traffic > 0.72;
            const w = road.major ? 5.2 : 3.4;
            return (
              <g key={road.id}>
                {/* Road outer white casing */}
                <path
                  d={road.d}
                  fill="none"
                  stroke="#fffdf8"
                  strokeWidth={w + 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Road inner lane */}
                <path
                  d={road.d}
                  fill="none"
                  stroke={isCongested ? '#e6b98c' : '#d3c4a7'}
                  strokeWidth={w}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Congestion indicator */}
                {isCongested && (
                  <path
                    d={road.d}
                    fill="none"
                    stroke="#dc8757"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeDasharray="4 5"
                    opacity="0.95"
                  />
                )}
              </g>
            );
          })}

          {/* Dijkstra baseline route (if present and in simulation view) */}
          {isSimulationView && dijkstraRouteD && (
            <g opacity="0.6">
              <path
                d={dijkstraRouteD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={dijkstraRouteD}
                fill="none"
                stroke="#477aa2"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5 5"
              />
            </g>
          )}

          {/* Fading ant exploration trails */}
          {isSimulationView &&
            antTrails.map((trail, idx) => (
              <path
                key={idx}
                className="ant-trail"
                d={getPathD(trail)}
                opacity={0.15 + (idx / antTrails.length) * 0.4}
              />
            ))}

          {/* Recommended ACO route */}
          {isSimulationView && acoRouteD && (
            <g>
              <path
                d={acoRouteD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.92"
              />
              <path
                d={acoRouteD}
                fill="none"
                stroke="#278764"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#routeShadow)"
                opacity="0.5"
              />
              <path
                d={acoRouteD}
                fill="none"
                stroke="#247c58"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="7 5"
              />
            </g>
          )}

          {/* Active ant animated motion */}
          {isSimulationView && activeAntMotionD && firstActiveNode && (
            <g>
              <circle
                className="active-ant"
                cx={firstActiveNode.x}
                cy={firstActiveNode.y}
                r="6.5"
              >
                <animateMotion
                  dur="1.1s"
                  fill="freeze"
                  path={activeAntMotionD}
                  repeatCount="1"
                />
              </circle>
            </g>
          )}

          {/* Patient Origin Pin */}
          {isSimulationView && patientPos && (
            <g transform={`translate(${patientPos.x} ${patientPos.y})`}>
              <circle r="18" fill="#5089c8" opacity="0.2" />
              <circle r="10" fill="#fff" />
              <circle r="7.5" fill="#437db8" />
              <circle r="2.5" fill="#fff" />
            </g>
          )}

          {/* Village Markers */}
          {region.villages.map((village, idx) => {
            const pt = nodeMap.get(village.node);
            if (!pt) return null;
            const isSelected = village.id === selectedVillageId;
            const nameDy = idx % 2 ? 22 : -14;

            return (
              <g
                key={village.id}
                className={`village-marker ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectVillage(village.id)}
              >
                <circle
                  className="village-halo"
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 16 : 10}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? '#377ec2' : '#4f8b5e'}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={pt.y + nameDy}
                  textAnchor="middle"
                  fill="#435943"
                  fontFamily="DM Sans, sans-serif"
                  fontSize="11"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="#f0f2e8"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                >
                  {village.name}
                </text>
              </g>
            );
          })}

          {/* Hospital Markers */}
          {region.hospitals.map((hospital, idx) => {
            const pt = nodeMap.get(hospital.node);
            if (!pt) return null;
            const isBest = hospital.id === bestHospitalId;
            const labelDy = idx % 2 ? -14 : 24;

            return (
              <g key={hospital.id} className="hospital-marker">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isBest ? 17 : 11}
                  fill="#ce795a"
                  opacity={isBest ? 0.3 : 0.15}
                />
                <rect
                  x={pt.x - 7.5}
                  y={pt.y - 7.5}
                  width="15"
                  height="15"
                  rx="3.5"
                  fill={isBest ? '#2a825b' : '#cb7152'}
                  stroke="#fff"
                  strokeWidth="1.8"
                />
                {/* White medical cross */}
                <path
                  d={`M${pt.x} ${pt.y - 4}v8m-4-4h8`}
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <text
                  x={pt.x}
                  y={pt.y + labelDy}
                  textAnchor="middle"
                  fill={isBest ? '#236544' : '#824c3d'}
                  fontFamily="DM Sans, sans-serif"
                  fontSize="10"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="#f0f2e8"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                >
                  {hospital.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Zoom Controls */}
        <div className="map-zoom-controls">
          <button type="button" onClick={() => handleZoom('in')} title="Zoom in">
            +
          </button>
          <button type="button" onClick={() => handleZoom('out')} title="Zoom out">
            −
          </button>
          <button type="button" onClick={() => handleZoom('reset')} title="Reset view">
            ↺
          </button>
        </div>

        {/* Compass & Scale */}
        <div className="map-compass">
          <span>N</span>
          <b>▲</b>
        </div>
        <div className="map-scale">
          <span></span>
          <small>5 km</small>
        </div>

        {/* Stage Note Banner */}
        {mapToast && <div className="map-note">{mapToast}</div>}
      </div>

      <div className="map-legend">
        <span>
          <i className="legend-village"></i> Village
        </span>
        <span>
          <i className="legend-hospital">+</i> Hospital
        </span>
        <span>
          <i className="legend-road"></i> Local road
        </span>
        <span>
          <i className="legend-traffic"></i> Congested segment
        </span>
        <span className="legend-route-key">
          <i></i> ACO recommended corridor
        </span>
        {isSimulationView && (
          <span className="legend-dijkstra-key">
            <i></i> Dijkstra baseline
          </span>
        )}
      </div>
    </section>
  );
};
