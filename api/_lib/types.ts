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

export interface SimulationState {
  elapsedMinutes: number;
  severityScore: number;
  vitals: Vitals;
  labs: Labs;
  urineOutputTrend: 'adequate' | 'drop' | 'anuric';
  neuro: 'alert' | 'drowsy' | 'obtunded';
  skin: 'clammy' | 'mottled' | 'warm';
  infusions: Infusions;
  resources: ResourceState;
  flags: PatientFlags;
  outcome: Outcome;
  log: ActionLogEntry[];
}

export interface PublicState {
  elapsedMinutes: number;
  vitals: Vitals;
  labs: Labs;
  neuro: SimulationState['neuro'];
  skin: SimulationState['skin'];
  urineOutputTrend: SimulationState['urineOutputTrend'];
  infusions: Infusions;
  resources: ResourceState;
  flags: PatientFlags;
  outcome: Outcome;
  log: ActionLogEntry[];
}

export interface SimulationResponse {
  state: PublicState;
  token: string;
  logEntry: ActionLogEntry;
}

export interface ActionContext {
  actionText: string;
  normalized: string;
  minutesConsumed: number;
  notices: string[];
}

export interface ActionHandler {
  id: string;
  matches: (normalizedAction: string) => boolean;
  execute: (state: SimulationState, ctx: ActionContext) => void;
}
