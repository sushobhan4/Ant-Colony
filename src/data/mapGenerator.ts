import type {
  ConditionInfo,
  Hospital,
  NodePoint,
  RegionMap,
  RoadEdge,
  TerrainType,
  TrafficLevel,
  Village,
} from '../types';

export const CONDITIONS: Record<string, ConditionInfo> = {
  cardiac: {
    key: 'cardiac',
    name: 'Cardiac emergency',
    specialty: 'Cardiology',
    hint: 'Requires an on-duty cardiologist.',
  },
  trauma: {
    key: 'trauma',
    name: 'Severe trauma',
    specialty: 'Trauma surgery',
    hint: 'Requires an on-duty trauma surgeon.',
  },
  neurology: {
    key: 'neurology',
    name: 'Stroke / neurological',
    specialty: 'Neurology',
    hint: 'Requires an on-duty neurologist.',
  },
  respiratory: {
    key: 'respiratory',
    name: 'Respiratory distress',
    specialty: 'Respiratory care',
    hint: 'Requires an on-duty respiratory specialist.',
  },
  obstetrics: {
    key: 'obstetrics',
    name: 'Pregnancy / obstetric',
    specialty: 'Obstetrics & Gynecology',
    hint: 'Requires an on-duty obstetrician/gynecologist.',
  },
  pediatrics: {
    key: 'pediatrics',
    name: 'Pediatric illness',
    specialty: 'Pediatrics',
    hint: 'Requires an on-duty pediatrician.',
  },
  general: {
    key: 'general',
    name: 'General illness',
    specialty: 'General medicine',
    hint: 'Requires a general physician on duty.',
  },
};

export const ALL_SPECIALTIES = [
  'Cardiology',
  'Emergency medicine',
  'Trauma surgery',
  'Neurology',
  'Respiratory care',
  'Obstetrics & Gynecology',
  'Pediatrics',
  'General medicine',
  'Orthopedics',
];

const VILLAGE_NAMES = [
  'Bhadson',
  'Chaswal',
  'Dittupur',
  'Ghanour',
  'Kakrala',
  'Kishangarh',
  'Lohar Majra',
  'Mehas',
  'Piplan',
  'Sahlon',
  'Thuhi',
  'Ageta',
  'Bina Heri',
  'Rohti',
];

const HOSPITAL_NAMES = [
  'Nabha Civil Hospital',
  'Bhadson Community Health Centre',
  'Patiala District Hospital',
  'A.P. Jain Hospital',
  'Rural Health Centre',
  'Sangrur Medical Centre',
  'Rajindra Hospital',
  'Nabha Telemedicine Clinic',
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateRegionMap(options: {
  villageCount: number;
  hospitalCount: number;
  density: number; // 0.3 to 1.0
  terrain: TerrainType;
  trafficLevel: TrafficLevel;
}): RegionMap {
  const { villageCount, hospitalCount, density, terrain, trafficLevel } = options;

  const view = { width: 960, height: 580, cols: 10, rows: 7, x0: 54, y0: 50, dx: 94, dy: 78 };
  const totalNodes = view.cols * view.rows;

  // 1. Create Grid Nodes with geographic organic jitter
  const nodes: NodePoint[] = Array.from({ length: totalNodes }, (_, index) => {
    const row = Math.floor(index / view.cols);
    const col = index % view.cols;
    return {
      id: index,
      x: view.x0 + col * view.dx + rand(-22, 22) + (row % 2 ? -10 : 10),
      y: view.y0 + row * view.dy + rand(-19, 19),
      edges: [],
    };
  });

  const roads: RoadEdge[] = [];
  const roadMap = new Map<string, RoadEdge>();

  const terrainDistFactor = terrain === 'rolling' ? 1.17 : terrain === 'river' ? 1.09 : 1.0;
  const trafficBase = trafficLevel === 'heavy' ? 0.48 : trafficLevel === 'light' ? 0.02 : 0.18;
  const trafficRange = trafficLevel === 'heavy' ? 0.5 : trafficLevel === 'light' ? 0.48 : 0.7;

  function addRoad(a: number, b: number) {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (roadMap.has(key)) return;

    const start = nodes[a];
    const end = nodes[b];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const euclidean = Math.hypot(dx, dy);

    const lengthKm = (euclidean / 10.5) * terrainDistFactor;
    const traffic = Math.min(1.0, trafficBase + Math.random() * trafficRange);
    const major = euclidean > 98 || Math.random() < 0.08;

    // Telemedicine bandwidth: major corridors have 40-100 Mbps, rural local roads have 8-25 Mbps
    const bandwidthMbps = major ? rand(45, 100) : rand(8, 30);
    const roadQuality = major ? 0.85 + Math.random() * 0.15 : 0.45 + Math.random() * 0.4;
    const travelMinutes = lengthKm * 0.88 * (1 + traffic * 1.3) * (terrain === 'rolling' ? 1.12 : 1.0);

    const road: RoadEdge = {
      id: `road_${key}`,
      a,
      b,
      d: `M${start.x.toFixed(1)} ${start.y.toFixed(1)} L${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
      lengthKm,
      traffic,
      major,
      roadQuality,
      bandwidthMbps,
      travelMinutes,
    };

    roads.push(road);
    roadMap.set(key, road);
    nodes[a].edges.push({ to: b, roadId: road.id });
    nodes[b].edges.push({ to: a, roadId: road.id });
  }

  // 2. Connect Grid Neighbors based on density
  for (let row = 0; row < view.rows; row++) {
    for (let col = 0; col < view.cols; col++) {
      const here = row * view.cols + col;
      // Horizontal road
      if (col < view.cols - 1) addRoad(here, here + 1);
      // Vertical road
      if (row < view.rows - 1 && (Math.random() < density || col % 3 === 0)) {
        addRoad(here, here + view.cols);
      }
      // Diagonal shortcut
      if (row < view.rows - 1 && col < view.cols - 1 && Math.random() < density * 0.15) {
        addRoad(here, here + view.cols + 1);
      }
    }
  }

  // 3. Assign Villages and Hospitals to Node Locations
  const shuffledNodes = shuffle(Array.from({ length: totalNodes }, (_, i) => i));
  const villageNodes = shuffledNodes.slice(0, villageCount);
  const hospitalNodes = shuffledNodes.slice(villageCount, villageCount + hospitalCount);

  const villages: Village[] = villageNodes.map((node, i) => ({
    id: `v${i}`,
    name: VILLAGE_NAMES[i % VILLAGE_NAMES.length],
    node,
  }));

  // Ensure all condition specialties exist across hospital network
  const diagnosticSpecialties = Object.values(CONDITIONS).map((c) => c.specialty);
  const teamSizes = hospitalNodes.map(() =>
    Math.max(rand(2, 4), Math.ceil(diagnosticSpecialties.length / hospitalCount))
  );
  const teams: string[][] = hospitalNodes.map(() => []);

  shuffle(diagnosticSpecialties).forEach((specialty) => {
    const available = teams
      .map((team, idx) => ({ team, idx }))
      .filter(({ team, idx }) => team.length < teamSizes[idx]);
    if (available.length > 0) {
      const target = available[Math.floor(Math.random() * available.length)];
      target.team.push(specialty);
    } else {
      teams[0].push(specialty);
    }
  });

  const hospitals: Hospital[] = hospitalNodes.map((node, i) => {
    const extras = shuffle(ALL_SPECIALTIES.filter((s) => !teams[i].includes(s))).slice(
      0,
      teamSizes[i] - teams[i].length
    );
    const doctors = shuffle([...teams[i], ...extras]);
    // Ensure diagnostic specialties assigned are on duty, others random
    const onDuty = doctors.filter(
      (spec) => diagnosticSpecialties.includes(spec) || Math.random() > 0.2
    );

    return {
      id: `h${i}`,
      name: HOSPITAL_NAMES[i % HOSPITAL_NAMES.length],
      node,
      doctors,
      onDuty,
      queue: rand(1, 15),
      telemedicineHub: i === 0 || Math.random() < 0.35,
    };
  });

  const regionId = `NN-${rand(110, 990)}-${String.fromCharCode(65 + rand(0, 25))}`;

  return {
    regionId,
    terrain,
    density,
    nodes,
    roads,
    villages,
    hospitals,
  };
}
