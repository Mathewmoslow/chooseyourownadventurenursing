import { describe, expect, it } from 'vitest';
import { advanceSimulation } from './engine';
import { createInitialState } from './state';

const issueAction = (action: string, current = createInitialState()) => advanceSimulation(action, current).state;

describe('advanceSimulation', () => {
  it('constructs a fresh state when no prior state supplied', () => {
    const { state } = advanceSimulation(null, undefined);
    expect(state.elapsedMinutes).toBe(0);
    expect(state.vitals.map).toBeGreaterThan(60);
    expect(state.log).toHaveLength(1);
  });

  it('improves perfusion when antibiotics and fluids start early', () => {
    const initial = createInitialState();
    const antibioticState = issueAction('hang broad-spectrum antibiotic via port', initial);
    const resuscitated = issueAction('start 1 liter crystalloid bolus', antibioticState);

    expect(resuscitated.infusions.antibiotic.active).toBe(true);
    expect(resuscitated.infusions.fluids.active).toBe(true);
    expect(resuscitated.vitals.map).toBeGreaterThan(initial.vitals.map);
    expect(resuscitated.outcome).toBe('ongoing');
  });

  it('deteriorates to death with repeated inaction', () => {
    let state = createInitialState();
    for (let index = 0; index < 24; index += 1) {
      state = issueAction('wait', state);
      if (state.outcome === 'died') {
        break;
      }
    }
    expect(state.outcome).toBe('died');
  });
});
