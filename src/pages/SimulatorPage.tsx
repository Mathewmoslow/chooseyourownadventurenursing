import { useEffect, useMemo, useRef } from 'react';
import { CommandConsole } from '../components/CommandConsole';
import { GlassCard } from '../components/GlassCard';
import { InterventionsPanel } from '../components/InterventionsPanel';
import { LabsPanel } from '../components/LabsPanel';
import { LogTimeline } from '../components/LogTimeline';
import { OutcomeBanner } from '../components/OutcomeBanner';
import { VitalsPanel } from '../components/VitalsPanel';
import { useSimulation } from '../hooks/useSimulation';
import { useSoundscape } from '../hooks/useSoundscape';
import styles from './SimulatorPage.module.css';

const suggestions = [
  'Hang broad-spectrum antibiotic through the port',
  'Start 1 L lactated ringers bolus wide open',
  'Draw blood cultures from port and peripheral',
  'Start platelet transfusion now',
  'Page the oncology provider with current vitals',
];

export const SimulatorPage = () => {
  const { state, status, sendAction, resetSimulation } = useSimulation();
  const { playSuccess, toggleAmbient, ambientEnabled } = useSoundscape();
  const hasPlayedInitial = useRef(false);

  useEffect(() => {
    if (!status.lastLog) return;
    if (!hasPlayedInitial.current) {
      hasPlayedInitial.current = true;
      return;
    }
    void playSuccess();
  }, [playSuccess, status.lastLog]);

  const disabled = !status.isReady || status.isMutating || state?.outcome !== 'ongoing';

  const primaryMessage = useMemo(() => {
    if (!state) return 'Booting simulation…';
    if (status.error) return status.error.message;
    switch (state.outcome) {
      case 'ongoing':
        return 'Direct the resuscitation. Enter high-priority orders in natural language.';
      case 'stabilized':
        return 'Patient stabilized. Debrief your sequence or replay to explore alternate paths.';
      case 'died':
        return 'Patient coded. Reset and try an aggressive sequence sooner.';
      default:
        return '';
    }
  }, [state, status.error]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.hero}>
        <GlassCard className={styles.brief} title="Scenario Brief">
          <p>
            You take bedside report on a 61-year-old with AML day 10 post-induction. The patient is neutropenic,
            febrile, hypotensive, and no antimicrobials are hanging. Broad beta-lactam and platelets are on the unit;
            PRBCs arrive in ≈15 minutes. Drive the first hour of care.
          </p>
          <div className={styles.callout}>{primaryMessage}</div>
          {state?.outcome !== 'ongoing' && (
            <button
              type="button"
              className={styles.reset}
              onClick={() => {
                hasPlayedInitial.current = false;
                resetSimulation();
              }}
            >
              Reset scenario
            </button>
          )}
          {status.error && <span className={styles.error}>Service error: {status.error.message}</span>}
        </GlassCard>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          {state && (
            <>
              <VitalsPanel
                vitals={state.vitals}
                neuro={state.neuro}
                skin={state.skin}
                urineOutputTrend={state.urineOutputTrend}
                elapsedMinutes={state.elapsedMinutes}
              />
              <LabsPanel labs={state.labs} />
              <InterventionsPanel
                infusions={state.infusions}
                resources={state.resources}
                flags={state.flags}
              />
            </>
          )}
        </div>
        <div className={styles.rightColumn}>
          <OutcomeBanner outcome={state?.outcome ?? 'ongoing'} />
          <GlassCard title="Patient Response Log" subtitle="📝 Real-time feedback">
            {state && <LogTimeline log={state.log} isPending={status.isMutating} />}
          </GlassCard>
          <GlassCard title="Action Console" subtitle="💬 Type your interventions">
            <CommandConsole
              onSubmit={(command) => sendAction(command)}
              disabled={disabled || Boolean(status.error)}
              suggestions={suggestions}
              ambientEnabled={ambientEnabled}
              onToggleAmbient={toggleAmbient}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
