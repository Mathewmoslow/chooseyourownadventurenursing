import { GlassCard } from './GlassCard';
import styles from './InterventionsPanel.module.css';
import type { Infusions, PatientFlags, ResourceState } from '../types/simulation';

interface InterventionsPanelProps {
  infusions: Infusions;
  resources: ResourceState;
  flags: PatientFlags;
}

const infusionLabels: Record<keyof Infusions, string> = {
  antibiotic: 'Antibiotic',
  fluids: 'Crystalloid bolus',
  prbc: 'PRBC transfusion',
  platelets: 'Platelets',
  pressor: 'Pressor',
};

export const InterventionsPanel = ({ infusions, resources, flags }: InterventionsPanelProps) => {
  const infusionEntries = (Object.keys(infusions) as (keyof Infusions)[]).map((key) => ({
    label: infusionLabels[key],
    active: infusions[key].active,
    remaining: infusions[key].remainingMinutes,
  }));

  const resourceItems = [
    {
      label: 'PRBC ETA',
      value: resources.prbcEtaMinutes > 0 ? `${resources.prbcEtaMinutes} min` : 'Delivered',
    },
    { label: 'Platelets', value: resources.plateletAvailable ? 'Ready' : 'In use' },
    { label: 'Antibiotic bag', value: resources.antibioticAvailable ? 'In med room' : 'Running' },
  ];

  const flagItems = [
    { label: 'Blood cultures', value: flags.culturesDrawn ? 'Sent' : 'Pending' },
    { label: 'Neutropenic precautions', value: flags.neutropenicPrecautions ? 'Active' : 'Reinforce' },
    { label: 'Provider notified', value: flags.providerPaged ? 'Paged' : 'Update due' },
    { label: 'Rapid response', value: flags.rapidResponseCalled ? 'Mobilized' : 'On standby' },
  ];

  return (
    <GlassCard title="Interventions & Logistics">
      <div className={styles.section}>
        <h3>Infusions</h3>
        <ul>
          {infusionEntries.map((item) => (
            <li key={item.label} data-active={item.active}>
              <span>{item.label}</span>
              <strong>{item.active ? formatRemaining(item.remaining) : 'Stopped'}</strong>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.section}>
        <h3>Resources</h3>
        <ul>
          {resourceItems.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.section}>
        <h3>Team Signals</h3>
        <ul>
          {flagItems.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
};

const formatRemaining = (remaining: number | null) => {
  if (remaining === null) return 'Running';
  if (remaining <= 0) return 'Wrapping up';
  return `${Math.ceil(remaining)} min left`;
};
