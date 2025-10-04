import { clamp } from './utils.js';
import { createInitialState, cloneState } from './state.js';
import type { ActionContext, ActionHandler, ActionLogEntry, PublicState, SimulationState } from './types.js';
import { parseActionWithAI } from './ai-parser.js';
import { generateDynamicNarration } from './ai-narrator.js';

const waitActionId = 'WAIT';

const normalizeAction = (action: string) => action.trim().toLowerCase();

const baseHandlers: ActionHandler[] = [];
const handlersById = new Map<string, ActionHandler>();

const findHandler = (normalized: string): ActionHandler | null => {
  for (const handler of baseHandlers) {
    if (handler.matches(normalized)) {
      return handler;
    }
  }
  return null;
};

const findHandlerById = (id: string): ActionHandler | null => {
  return handlersById.get(id) ?? null;
};

const advanceTime = (state: SimulationState, minutes: number): string[] => {
  const notices: string[] = [];
  if (minutes <= 0) {
    return notices;
  }

  let remaining = minutes;
  while (remaining > 0) {
    const slice = Math.min(remaining, 5);
    remaining -= slice;
    state.elapsedMinutes += slice;

    if (state.resources.prbcEtaMinutes > 0) {
      const prevEta = state.resources.prbcEtaMinutes;
      state.resources.prbcEtaMinutes = Math.max(0, prevEta - slice);
      if (prevEta > 0 && state.resources.prbcEtaMinutes === 0) {
        notices.push('Blood bank sends the PRBC unit to the nurses\' station.');
      }
    }

    const infusionKeys: (keyof SimulationState['infusions'])[] = [
      'antibiotic',
      'fluids',
      'prbc',
      'platelets',
      'pressor',
    ];

    for (const key of infusionKeys) {
      const infusion = state.infusions[key];
      if (!infusion.active) continue;

      if (infusion.remainingMinutes === null) {
        continue;
      }

      infusion.remainingMinutes -= slice;
      if (infusion.remainingMinutes <= 0) {
        infusion.remainingMinutes = null;
        switch (key) {
          case 'antibiotic':
            notices.push('Antibiotic infusion completes; therapeutic levels remain on board.');
            break;
          case 'fluids':
            infusion.active = false;
            notices.push('Fluid bolus is in. Blood pressure response pending.');
            break;
          case 'prbc': {
            infusion.active = false;
            state.labs.hgb = parseFloat((state.labs.hgb + 1).toFixed(1));
            notices.push('PRBC transfusion completes; hemoglobin expected near ' + state.labs.hgb.toFixed(1) + ' g/dL.');
            break;
          }
          case 'platelets': {
            infusion.active = false;
            state.labs.platelets = Math.max(state.labs.platelets, 29);
            notices.push('Platelet transfusion finishes; repeat count expected ~' + state.labs.platelets + ' K/µL.');
            break;
          }
          case 'pressor':
            // Pressor runs until stopped explicitly; keep active but reset timer to null to avoid re-entry.
            break;
          default:
            break;
        }
      }
    }

    updateSeverity(state, slice);
    updateClinicalPresentation(state);
  }

  return notices;
};

const updateSeverity = (state: SimulationState, minutes: number) => {
  const antibioticActive = state.infusions.antibiotic.active;
  const fluidsActive = state.infusions.fluids.active;
  const pressorActive = state.infusions.pressor.active;

  let delta = 0.18 * minutes;

  if (antibioticActive) {
    delta -= 0.55 * minutes;
  } else {
    const delayPenalty = state.elapsedMinutes > 60 ? 0.35 : 0.22;
    delta += delayPenalty * minutes;
  }

  if (fluidsActive) {
    delta -= 0.25 * minutes;
  } else if (state.vitals.map < 60) {
    delta += 0.18 * minutes;
  }

  if (pressorActive) {
    delta -= 0.15 * minutes;
  } else if (state.vitals.map < 55 && !fluidsActive) {
    delta += 0.25 * minutes;
  }

  if (state.labs.hgb < 6.5) {
    delta += 0.12 * minutes;
  }

  if (state.labs.platelets < 10) {
    delta += 0.05 * minutes;
  }

  if (state.flags.rapidResponseCalled) {
    delta -= 0.05 * minutes;
  }

  state.severityScore = clamp(state.severityScore + delta, 0, 120);
};

const updateClinicalPresentation = (state: SimulationState) => {
  const s = state.severityScore;
  const fluidsActive = state.infusions.fluids.active;
  const pressorActive = state.infusions.pressor.active;
  const antibioticActive = state.infusions.antibiotic.active;

  // MORE DRAMATIC fluid/pressor response - these should work IMMEDIATELY
  const fluidBoost = fluidsActive ? 8 : 0; // Increased from 3
  const pressorBoost = pressorActive ? 15 : 0; // Increased from 8

  const mapBase = 76 - 0.2 * s + fluidBoost + pressorBoost;
  state.vitals.map = parseFloat(clamp(mapBase, 45, 85).toFixed(1));
  state.vitals.systolic = Math.round(state.vitals.map + 16);
  state.vitals.diastolic = Math.max(38, Math.round(state.vitals.map - 10));

  // More dramatic HR response to interventions
  const hrModifier = (pressorActive ? -10 : 0) + (antibioticActive ? -8 : 0) + (fluidsActive ? -5 : 0);
  state.vitals.heartRate = Math.round(clamp(100 + 0.7 * s + hrModifier, 80, 160));

  // Faster temp response to antibiotics
  const tempModifier = antibioticActive ? -0.8 : 0; // Doubled from -0.4
  state.vitals.temperatureC = parseFloat(clamp(37 + 0.055 * s + tempModifier, 36.3, 40.5).toFixed(1));

  state.vitals.respiratoryRate = Math.round(clamp(18 + 0.15 * s, 16, 36));

  // Better oxygenation response
  const spo2Modifier = (fluidsActive ? 1.2 : 0) + (state.labs.hgb >= 7 ? 0.8 : -0.7);
  state.vitals.spo2 = parseFloat(clamp(96 - 0.05 * s + spo2Modifier, 88, 99).toFixed(1));

  // More responsive lactate clearance with fluids
  const lactateReduction = fluidsActive ? 0.12 * Math.min(20, s) : 0; // Tripled effectiveness
  state.vitals.lactate = parseFloat(
    clamp(1.8 + 0.05 * s - lactateReduction, 1.4, 6.1).toFixed(1),
  );

  if (s >= 80) {
    state.neuro = 'obtunded';
    state.urineOutputTrend = 'anuric';
    state.skin = 'mottled';
  } else if (s >= 50) {
    state.neuro = 'drowsy';
    state.urineOutputTrend = 'drop';
    state.skin = 'clammy';
  } else {
    state.neuro = 'alert';
    state.urineOutputTrend = 'adequate';
    state.skin = 'warm';
  }

  if (state.outcome === 'ongoing') {
    if (s >= 95 || state.vitals.map < 50) {
      state.outcome = 'died';
      state.neuro = 'obtunded';
      state.skin = 'mottled';
      state.urineOutputTrend = 'anuric';
    } else if (
      s < 22 &&
      antibioticActive &&
      state.vitals.map >= 65 &&
      state.vitals.lactate <= 2.9 &&
      state.labs.hgb >= 7 &&
      state.labs.platelets >= 20
    ) {
      state.outcome = 'stabilized';
      state.neuro = 'alert';
      state.skin = 'warm';
      state.urineOutputTrend = 'adequate';
    }
  }
};

const registerHandler = (handler: ActionHandler) => {
  baseHandlers.push(handler);
  handlersById.set(handler.id, handler);
};

registerHandler({
  id: 'ANTIBIOTIC',
  matches: (text) => /antibiot|zosyn|cefepime|meropenem|pip(\s|-)?tazo/.test(text),
  execute: (state, ctx) => {
    if (!state.resources.antibioticAvailable && state.infusions.antibiotic.active) {
      ctx.notices.push('Antibiotic is already infusing; focus on reassessment.');
      return;
    }
    if (!state.resources.antibioticAvailable && !state.infusions.antibiotic.active) {
      ctx.notices.push('No antibiotic bag is available right now—call pharmacy.');
      return;
    }
    ctx.minutesConsumed = 6;
    state.infusions.antibiotic.active = true;
    state.infusions.antibiotic.startedAt = state.elapsedMinutes;
    state.infusions.antibiotic.remainingMinutes = 30;
    state.resources.antibioticAvailable = false;
    ctx.notices.push('Broad-spectrum antibiotic started through the port.');
  },
});

registerHandler({
  id: 'CULTURES',
  matches: (text) => /culture|blood draw|pan.{0,2}culture/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 5;
    if (state.flags.culturesDrawn) {
      ctx.notices.push('Cultures already sent earlier.');
      return;
    }
    state.flags.culturesDrawn = true;
    ctx.notices.push('Two sets of blood cultures obtained from port and peripheral site.');
  },
});

registerHandler({
  id: 'FLUID_BOLUS',
  matches: (text) => /fluid|bolus|lactated|ringer|ns|normal saline/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 4;
    if (state.infusions.fluids.active) {
      ctx.notices.push('Fluid bolus already running.');
      return;
    }
    state.infusions.fluids.active = true;
    state.infusions.fluids.startedAt = state.elapsedMinutes;
    state.infusions.fluids.remainingMinutes = 20;
    ctx.notices.push('1 L crystalloid bolus initiated wide open.');
  },
});

registerHandler({
  id: 'PRBC',
  matches: (text) => /prbc|blood (unit|transfusion)|start blood/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 10;
    if (state.infusions.prbc.active) {
      ctx.notices.push('PRBCs are already infusing.');
      return;
    }
    if (state.resources.prbcEtaMinutes > 0) {
      ctx.notices.push('Blood bank has not delivered the PRBC unit yet.');
      return;
    }
    state.infusions.prbc.active = true;
    state.infusions.prbc.startedAt = state.elapsedMinutes;
    state.infusions.prbc.remainingMinutes = 60;
    ctx.notices.push('PRBC transfusion started after dual verification.');
  },
});

registerHandler({
  id: 'PLATELETS',
  matches: (text) => /platelet/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 6;
    if (state.infusions.platelets.active) {
      ctx.notices.push('Platelets already infusing.');
      return;
    }
    if (!state.resources.plateletAvailable) {
      ctx.notices.push('No platelet product is present in the med room.');
      return;
    }
    state.infusions.platelets.active = true;
    state.infusions.platelets.startedAt = state.elapsedMinutes;
    state.infusions.platelets.remainingMinutes = 30;
    state.resources.plateletAvailable = false;
    ctx.notices.push('Platelet unit started via peripheral IV.');
  },
});

registerHandler({
  id: 'PRESSOR',
  matches: (text) => /norepinephrine|levophed|pressor|vasopressor/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 3;
    if (state.infusions.pressor.active) {
      ctx.notices.push('Pressor already titrating to maintain MAP.');
      return;
    }
    if (!state.infusions.fluids.active && state.vitals.map >= 60) {
      ctx.notices.push('MAP is borderline; initiate fluids before pressors per protocol.');
      return;
    }
    state.infusions.pressor.active = true;
    state.infusions.pressor.startedAt = state.elapsedMinutes;
    state.infusions.pressor.remainingMinutes = null;
    ctx.notices.push('Norepinephrine started at 0.05 µg/kg/min via port.');
  },
});

registerHandler({
  id: 'STOP_PRESSOR',
  matches: (text) => /stop (pressor|levophed|norepi)/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 1;
    if (!state.infusions.pressor.active) {
      ctx.notices.push('No pressor infusion to discontinue.');
      return;
    }
    state.infusions.pressor.active = false;
    state.infusions.pressor.startedAt = null;
    state.infusions.pressor.remainingMinutes = null;
    ctx.notices.push('Pressor discontinued; continue close MAP monitoring.');
  },
});

registerHandler({
  id: 'OXYGEN',
  matches: (text) => /oxygen|nasal cannula|nonrebreather|nc/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 2;
    state.vitals.spo2 = Math.max(state.vitals.spo2, 97);
    ctx.notices.push('Oxygen applied at 2 L nasal cannula; saturation improves.');
  },
});

registerHandler({
  id: 'NEUTROPENIC_PRECAUTIONS',
  matches: (text) => /neutropenic|isolation|mask|gown/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 2;
    if (state.flags.neutropenicPrecautions) {
      ctx.notices.push('Neutropenic precautions already in place.');
      return;
    }
    state.flags.neutropenicPrecautions = true;
    ctx.notices.push('Neutropenic precautions reinforced and signage updated.');
  },
});

registerHandler({
  id: 'PAGE_PROVIDER',
  matches: (text) => /page|call (provider|oncology|physician|doctor)/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 1;
    state.flags.providerPaged = true;
    ctx.notices.push('Primary provider paged with current vitals and interventions.');
  },
});

registerHandler({
  id: 'RAPID_RESPONSE',
  matches: (text) => /rapid response|rrt|code sepsis/.test(text),
  execute: (state, ctx) => {
    ctx.minutesConsumed = 1;
    state.flags.rapidResponseCalled = true;
    ctx.notices.push('Rapid response activated; critical care team en route.');
  },
});

registerHandler({
  id: 'CHECK_VITALS',
  matches: (text) => /check vitals|reassess|assess/.test(text),
  execute: (_state, ctx) => {
    ctx.minutesConsumed = 3;
    ctx.notices.push('Focused reassessment completed.');
  },
});

registerHandler({
  id: waitActionId,
  matches: (text) => /wait|hold|observe/.test(text),
  execute: (_state, ctx) => {
    ctx.minutesConsumed = 5;
    ctx.notices.push('Time passes while the patient remains under observation.');
  },
});

const unknownActionHandler: ActionHandler = {
  id: 'UNKNOWN',
  matches: () => true,
  execute: (_state, ctx) => {
    ctx.minutesConsumed = 3;
    ctx.notices.push('Action not recognized; precious minutes slip by.');
  },
};

const toPublicState = (state: SimulationState): PublicState => ({
  elapsedMinutes: state.elapsedMinutes,
  vitals: { ...state.vitals },
  labs: { ...state.labs },
  neuro: state.neuro,
  skin: state.skin,
  urineOutputTrend: state.urineOutputTrend,
  infusions: JSON.parse(JSON.stringify(state.infusions)),
  resources: { ...state.resources },
  flags: { ...state.flags },
  outcome: state.outcome,
  log: [...state.log],
});

export const advanceSimulation = async (
  actionText: string | null,
  existingState?: SimulationState,
): Promise<{ state: SimulationState; publicState: PublicState; logEntry: ActionLogEntry }> => {
  if (!existingState) {
    const fresh = createInitialState();
    return {
      state: fresh,
      publicState: toPublicState(fresh),
      logEntry: fresh.log[0],
    };
  }

  if (existingState.outcome !== 'ongoing') {
    return {
      state: existingState,
      publicState: toPublicState(existingState),
      logEntry: existingState.log[existingState.log.length - 1],
    };
  }

  const state = cloneState(existingState);
  const previousState = cloneState(existingState); // Save for comparison

  const normalized = actionText ? normalizeAction(actionText) : '';

  // Try AI parsing first, then fall back to regex
  let handler: ActionHandler | null = null;

  if (actionText && actionText.trim()) {
    // Try AI first
    const aiActionId = await parseActionWithAI(actionText);
    if (aiActionId !== 'UNKNOWN') {
      handler = findHandlerById(aiActionId);
    }

    // Fall back to regex if AI didn't find a match
    if (!handler) {
      handler = findHandler(normalized);
    }
  }

  // Use unknown handler if nothing matched
  if (!handler) {
    handler = unknownActionHandler;
  }

  const ctx: ActionContext = {
    actionText: actionText ?? '...',
    normalized,
    minutesConsumed: 3,
    notices: [],
  };

  handler.execute(state, ctx);
  const timeNotices = advanceTime(state, ctx.minutesConsumed);

  // Try AI narration for dynamic responses
  let aiNarration = await generateDynamicNarration(
    handler.id,
    actionText ?? '',
    state,
    previousState
  );

  const notices = aiNarration.notices.length > 0
    ? [...aiNarration.notices, ...timeNotices]
    : [...ctx.notices, ...timeNotices];

  // Use AI narration if available, otherwise use fallback
  let finalNarration = '';

  if (aiNarration.narration) {
    finalNarration = aiNarration.narration;
  } else {
    // Fallback narration
    const narrationPieces: string[] = [];
    switch (handler.id) {
      case 'ANTIBIOTIC':
        narrationPieces.push('Broad antimicrobial coverage starts flowing.');
        break;
      case 'FLUID_BOLUS':
        narrationPieces.push('Crystalloid bolus chases the hypotension.');
        break;
      case 'PRBC':
        narrationPieces.push('Packed red cells begin to run.');
        break;
      case 'PLATELETS':
        narrationPieces.push('Platelets infuse cautiously while you monitor for reactions.');
        break;
      case 'PRESSOR':
        narrationPieces.push('Pressor initiated to maintain perfusion.');
        break;
      case 'STOP_PRESSOR':
        narrationPieces.push('Pressor tapered as pressures sustain.');
        break;
      case 'CULTURES':
        narrationPieces.push('Cultures obtained without delaying therapy.');
        break;
      case 'RAPID_RESPONSE':
        narrationPieces.push('Critical care backup is mobilized.');
        break;
      case 'CHECK_VITALS':
        narrationPieces.push('Focused reassessment performed.');
        break;
      case waitActionId:
        narrationPieces.push('Moments pass while you observe the trend.');
        break;
      default:
        if (handler.id === 'UNKNOWN') {
          narrationPieces.push('Unclear intervention—clinical trajectory worsens with inaction.');
        } else {
          narrationPieces.push('Intervention carried out.');
        }
    }
    finalNarration = narrationPieces.join(' ');
  }

  const actionLog: ActionLogEntry = {
    atMinute: state.elapsedMinutes,
    action: actionText ?? '...',
    narration: finalNarration,
    notices,
  };

  state.log.push(actionLog);

  const outcomeAfterAction = state.outcome;

  if (outcomeAfterAction === 'died') {
    actionLog.notices.push('Patient progresses to pulseless electrical activity and expires.');
  } else if (outcomeAfterAction === 'stabilized') {
    actionLog.notices.push('Hemodynamics stabilize; patient prepared for ICU transfer.');
  }

  return {
    state,
    publicState: toPublicState(state),
    logEntry: actionLog,
  };
};
