import type { InfusionState, Infusions, Labs, ResourceState, SimulationState, Vitals } from './types';

const infusion = (): InfusionState => ({
  active: false,
  startedAt: null,
  remainingMinutes: null,
});

const initialVitals: Vitals = {
  heartRate: 128,
  map: 68,
  systolic: 92,
  diastolic: 56,
  temperatureC: 39.2,
  respiratoryRate: 24,
  spo2: 94,
  lactate: 3.8,
};

const initialLabs: Labs = {
  hgb: 6.1,
  platelets: 8,
  anc: 160,
  creatinine: 1.4,
};

const initialInfusions: Infusions = {
  antibiotic: infusion(),
  fluids: infusion(),
  prbc: infusion(),
  platelets: infusion(),
  pressor: infusion(),
};

const initialResources: ResourceState = {
  antibioticAvailable: true,
  plateletAvailable: true,
  prbcEtaMinutes: 15,
};

export const createInitialState = (): SimulationState => ({
  elapsedMinutes: 0,
  severityScore: 40,
  vitals: { ...initialVitals },
  labs: { ...initialLabs },
  urineOutputTrend: 'drop',
  neuro: 'drowsy',
  skin: 'clammy',
  infusions: JSON.parse(JSON.stringify(initialInfusions)),
  resources: { ...initialResources },
  flags: {
    culturesDrawn: false,
    neutropenicPrecautions: false,
    providerPaged: false,
    rapidResponseCalled: false,
  },
  outcome: 'ongoing',
  log: [
    {
      atMinute: 0,
      action: 'Handoff',
      narration:
        '61-year-old with AML day 10 post-induction, febrile and hypotensive. Antibiotic bag and platelets are on the unit; PRBCs ETA 15 minutes. No therapies have started yet.',
      notices: [
        'Monitor: drowsy but arousable, pale, clammy.',
        'Lines: Port-a-cath and 20G peripheral intact.',
      ],
    },
  ],
});

export const cloneState = (state: SimulationState): SimulationState =>
  JSON.parse(JSON.stringify(state));
