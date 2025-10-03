export type Outcome = 'ongoing' | 'stabilized' | 'died';

export interface Vitals {
  heartRate: number;
  map: number;
  systolic: number;
  diastolic: number;
  temperatureC: number;
  respiratoryRate: number;
  spo2: number;
  lactate: number;
}

export interface Labs {
  hgb: number;
  platelets: number;
  anc: number;
  creatinine: number;
}

export interface InfusionState {
  active: boolean;
  startedAt: number | null;
  remainingMinutes: number | null;
}

export interface Infusions {
  antibiotic: InfusionState;
  fluids: InfusionState;
  prbc: InfusionState;
  platelets: InfusionState;
  pressor: InfusionState;
}

export interface ResourceState {
  antibioticAvailable: boolean;
  plateletAvailable: boolean;
  prbcEtaMinutes: number;
}

export interface ActionLogEntry {
  atMinute: number;
  action: string;
  narration: string;
  notices: string[];
}

export interface PatientFlags {
  culturesDrawn: boolean;
  neutropenicPrecautions: boolean;
  providerPaged: boolean;
  rapidResponseCalled: boolean;
}

export interface SimulationSnapshot {
  elapsedMinutes: number;
  vitals: Vitals;
  labs: Labs;
  neuro: 'alert' | 'drowsy' | 'obtunded';
  skin: 'clammy' | 'mottled' | 'warm';
  urineOutputTrend: 'adequate' | 'drop' | 'anuric';
  infusions: Infusions;
  resources: ResourceState;
  flags: PatientFlags;
  outcome: Outcome;
  log: ActionLogEntry[];
}

export interface SimulationPayload {
  state: SimulationSnapshot;
  token: string;
  logEntry: ActionLogEntry;
}

