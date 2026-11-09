import { useCallback, useMemo, useState } from 'react';
import {
  initStepRun,
  runFullAco,
  stepAdvanceOneAnt,
  type StepAntState,
} from './aco/aco';
import { buildAdjacency } from './aco/graph';
import { AcoParametersModal } from './components/AcoParametersModal';
import { Header } from './components/Header';
import { MapGenerationCard } from './components/MapGenerationCard';
import { MapStage } from './components/MapStage';
import { PatientForm } from './components/PatientForm';
import { ResultsCard } from './components/ResultsCard';
import {
  CONDITIONS,
  generateRegionMap,
} from './data/mapGenerator';
import type {
  AcoParams,
  AcoResult,
  CostWeights,
  PatientProfile,
  RegionMap,
  TerrainType,
  TrafficLevel,
} from './types';

export default function App() {
  // Tabs: 'generation' | 'simulation'
  const [activeTab, setActiveTab] = useState<'generation' | 'simulation'>('generation');

  // Map generation state
  const [villageCount, setVillageCount] = useState<number>(8);
  const [hospitalCount, setHospitalCount] = useState<number>(4);
  const [density, setDensity] = useState<number>(0.65);
  const [terrain, setTerrain] = useState<TerrainType>('plains');
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>('moderate');

  // Region network map
  const [region, setRegion] = useState<RegionMap>(() =>
    generateRegionMap({
      villageCount: 8,
      hospitalCount: 4,
      density: 0.65,
      terrain: 'plains',
      trafficLevel: 'moderate',
    })
  );

  const adjacency = useMemo(() => buildAdjacency(region), [region]);

  // Patient profile
  const [patient, setPatient] = useState<PatientProfile>(() => ({
    villageId: region.villages[0]?.id || 'v0',
    category: 'Adult',
    age: '',
    conditionKey: 'cardiac',
    urgency: 'critical',
  }));

  // Hyperparameters & weights
  const [params, setParams] = useState<AcoParams>({
    alpha: 1.1,
    beta: 2.1,
    rho: 0.24,
    Q: 8,
    antCount: 28,
    iterations: 35,
  });

  const [weights, setWeights] = useState<CostWeights>({
    distance: 1.0,
    traffic: 1.2,
    bandwidth: 0.8,
    wait: 1.0,
  });

  // Simulation results
  const [simulationResult, setSimulationResult] = useState<AcoResult | null>(null);
  const [stepRun, setStepRun] = useState<StepAntState | null>(null);
  const [antTrails, setAntTrails] = useState<number[][]>([]);
  const [activeAntPath, setActiveAntPath] = useState<number[] | null>(null);

  // Modal and Toast
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3800);
  }, []);

  // Filter eligible hospitals that have the required on-duty specialist
  const requiredSpecialty =
    CONDITIONS[patient.conditionKey]?.specialty || 'General medicine';

  const eligibleHospitals = useMemo(() => {
    return region.hospitals.filter((h) => h.onDuty.includes(requiredSpecialty));
  }, [region.hospitals, requiredSpecialty]);

  // Generate new region
  const handleGenerate = useCallback(() => {
    const newRegion = generateRegionMap({
      villageCount,
      hospitalCount,
      density,
      terrain,
      trafficLevel,
    });
    setRegion(newRegion);
    setPatient((prev) => ({
      ...prev,
      villageId: newRegion.villages[0]?.id || 'v0',
    }));
    setSimulationResult(null);
    setStepRun(null);
    setAntTrails([]);
    setActiveAntPath(null);
    showToast(
      `New rural network generated · ${newRegion.roads.length} road segments`
    );
  }, [villageCount, hospitalCount, density, terrain, trafficLevel, showToast]);

  // Run full ACO simulation
  const handleRunSimulation = useCallback(() => {
    const village =
      region.villages.find((v) => v.id === patient.villageId) ||
      region.villages[0];
    if (!village) return;

    if (eligibleHospitals.length === 0) {
      showToast(`No hospital currently has an on-duty ${requiredSpecialty}!`);
      return;
    }

    const result = runFullAco({
      originNode: village.node,
      eligibleHospitals,
      region,
      adjacency,
      weights,
      params,
      urgency: patient.urgency,
    });

    setSimulationResult(result);
    setStepRun(null);
    setAntTrails([]);
    setActiveAntPath(null);

    if (result.bestResult) {
      showToast(
        `ACO Route found: ${result.bestResult.hospital.name} (${Math.round(
          result.bestResult.totalEtaMinutes
        )} min ETA)`
      );
    }
  }, [
    region,
    patient.villageId,
    patient.urgency,
    eligibleHospitals,
    requiredSpecialty,
    adjacency,
    weights,
    params,
    showToast,
  ]);

  // Advance 1 ant (Step mode)
  const handleAdvanceAnt = useCallback(() => {
    const village =
      region.villages.find((v) => v.id === patient.villageId) ||
      region.villages[0];
    if (!village) return;

    if (eligibleHospitals.length === 0) {
      showToast(`No hospital has an on-duty ${requiredSpecialty}.`);
      return;
    }

    // Determine target hospital to explore
    const targetHospital = simulationResult?.bestResult?.hospital || eligibleHospitals[0];

    let currentStep = stepRun;
    if (!currentStep || currentStep.originNode !== village.node) {
      currentStep = initStepRun(village.node, targetHospital, region, params.antCount * params.iterations);
    }

    const { nextState, newBest } = stepAdvanceOneAnt(
      currentStep,
      region,
      adjacency,
      weights,
      params,
      patient.urgency
    );

    setStepRun(nextState);
    setActiveAntPath(nextState.activePath);
    setAntTrails(nextState.historyTrails);

    if (newBest && nextState.bestMetrics) {
      setSimulationResult((prev) => {
        if (!prev) {
          return {
            snapshots: [],
            bestResult: nextState.bestMetrics,
            dijkstraBaseline: null,
            alternatives: nextState.bestMetrics ? [nextState.bestMetrics] : [],
            history: [nextState.bestMetrics?.totalCost || 0],
          };
        }
        return {
          ...prev,
          bestResult: nextState.bestMetrics,
        };
      });
    }
  }, [
    region,
    patient.villageId,
    patient.urgency,
    eligibleHospitals,
    requiredSpecialty,
    simulationResult,
    stepRun,
    adjacency,
    weights,
    params,
    showToast,
  ]);

  const stepProgressText = stepRun
    ? `${stepRun.antCountDone.toLocaleString()} / ${stepRun.totalAnts.toLocaleString()} ants · ${stepRun.targetHospital.name}`
    : '0 / 980 ants · Ready for step exploration';

  const bestPath = simulationResult?.bestResult?.path || null;
  const dijkstraPath = simulationResult?.dijkstraBaseline?.path || null;
  const bestHospitalId = simulationResult?.bestResult?.hospital.id;

  return (
    <div>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenParams={() => setIsParamsOpen(true)}
      />

      <main className="main-wrap">
        {activeTab === 'generation' ? (
          /* TAB 1: MAP GENERATION */
          <section className="page active" aria-label="Map Generation section">
            <div className="page-heading">
              <div>
                <div className="overline">
                  <span className="overline-rule"></span> NABHA-NET{' '}
                  <span className="overline-dot">/</span> ENVIRONMENT SETUP
                </div>
                <h1>Build a rural road network.</h1>
                <p>
                  Generate a realistic regional topography with road hierarchies,
                  congestion, and telemedicine facilities.
                </p>
              </div>
              <div className="map-version">
                <span className="version-pulse"></span>
                <span>SCENARIO</span>
                <strong>{region.regionId}</strong>
              </div>
            </div>

            <div className="generation-layout">
              <MapStage
                region={region}
                selectedVillageId={patient.villageId}
                onSelectVillage={(vid) =>
                  setPatient((prev) => ({ ...prev, villageId: vid }))
                }
                acoPath={null}
                dijkstraPath={null}
                activeAntPath={null}
                antTrails={[]}
                isSimulationView={false}
                mapToast={`Region: ${region.regionId} · ${region.roads.length} road corridors`}
              />

              <MapGenerationCard
                villageCount={villageCount}
                setVillageCount={setVillageCount}
                hospitalCount={hospitalCount}
                setHospitalCount={setHospitalCount}
                density={density}
                setDensity={setDensity}
                terrain={terrain}
                setTerrain={setTerrain}
                trafficLevel={trafficLevel}
                setTrafficLevel={setTrafficLevel}
                onGenerate={handleGenerate}
              />
            </div>

            {/* Generation Summary Bar */}
            <div className="generation-summary">
              <div>
                <span className="summary-icon">↝</span>
                <span>
                  <strong>{region.roads.length}</strong>
                  <small>road corridors</small>
                </span>
              </div>
              <span className="summary-divider"></span>
              <div>
                <span className="summary-icon">⌂</span>
                <span>
                  <strong>{region.villages.length}</strong>
                  <small>rural villages</small>
                </span>
              </div>
              <span className="summary-divider"></span>
              <div>
                <span className="summary-icon hospital-summary">+</span>
                <span>
                  <strong>{region.hospitals.length}</strong>
                  <small>hospitals & clinics</small>
                </span>
              </div>
              <span className="summary-location">
                {region.terrain === 'plains'
                  ? 'NABHA PLAINS'
                  : region.terrain === 'river'
                  ? 'RIVER VALLEY'
                  : 'ROLLING COUNTRYSIDE'}{' '}
                · SIMULATED
              </span>
            </div>
          </section>
        ) : (
          /* TAB 2: ANT SIMULATION */
          <section className="page active" aria-label="Ant Simulation section">
            <div className="page-heading">
              <div>
                <div className="overline">
                  <span className="overline-rule"></span> NABHA-NET{' '}
                  <span className="overline-dot">/</span> REFERRAL OPTIMIZATION
                </div>
                <h1>Find the optimal emergency referral route.</h1>
                <p>
                  Ant colony optimization balances drive distance, road traffic,
                  triage backlog, and telemedicine corridor bandwidth.
                </p>
              </div>
              <button
                className="params-btn"
                type="button"
                onClick={() => setActiveTab('generation')}
              >
                ← Edit Map Settings
              </button>
            </div>

            <div className="simulation-layout">
              <PatientForm
                profile={patient}
                setProfile={setPatient}
                region={region}
                onRunSimulation={handleRunSimulation}
                onAdvanceAnt={handleAdvanceAnt}
                stepProgressText={stepProgressText}
              />

              <div className="simulation-right">
                <MapStage
                  region={region}
                  selectedVillageId={patient.villageId}
                  onSelectVillage={(vid) =>
                    setPatient((prev) => ({ ...prev, villageId: vid }))
                  }
                  acoPath={bestPath}
                  dijkstraPath={dijkstraPath}
                  activeAntPath={activeAntPath}
                  antTrails={antTrails}
                  bestHospitalId={bestHospitalId}
                  isSimulationView={true}
                  mapToast={
                    simulationResult?.bestResult
                      ? `ACO route · ${simulationResult.bestResult.hospital.name} · ${Math.round(
                          simulationResult.bestResult.totalEtaMinutes
                        )} min ETA`
                      : 'Select patient details and run ACO simulation'
                  }
                />

                <ResultsCard
                  bestResult={simulationResult?.bestResult || null}
                  dijkstraBaseline={simulationResult?.dijkstraBaseline || null}
                  alternatives={simulationResult?.alternatives || []}
                  history={simulationResult?.history || []}
                  specialtyRequired={requiredSpecialty}
                />
              </div>
            </div>
          </section>
        )}

        <footer className="project-footer">
          <span>
            NABHA-NET <i>·</i> ANT COLONY OPTIMIZATION FOR RURAL TELEMEDICINE
          </span>
          <span>
            COMBINED EDITION <b>•</b> ACADEMIC BENCHMARK & SIMULATION
          </span>
        </footer>
      </main>

      {/* ACO Parameters Tuning Modal */}
      <AcoParametersModal
        isOpen={isParamsOpen}
        onClose={() => setIsParamsOpen(false)}
        params={params}
        setParams={setParams}
        weights={weights}
        setWeights={setWeights}
      />

      {/* Floating Notification Toast */}
      <div
        className={`toast ${isToastVisible ? 'visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>
    </div>
  );
}
