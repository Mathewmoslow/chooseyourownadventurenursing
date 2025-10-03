import type { Labs } from '../types/simulation';
import { GlassCard } from './GlassCard';
import styles from './LabsPanel.module.css';

interface LabsPanelProps {
  labs: Labs;
}

export const LabsPanel = ({ labs }: LabsPanelProps) => {
  const labRows = [
    { label: 'Hemoglobin', value: `${labs.hgb.toFixed(1)} g/dL` },
    { label: 'Platelets', value: `${labs.platelets} K/µL` },
    { label: 'ANC', value: `${labs.anc} /µL` },
    { label: 'Creatinine', value: `${labs.creatinine.toFixed(1)} mg/dL` },
  ];

  return (
    <GlassCard title="Key Labs" subtitle="Trend critical cytopenias">
      <ul className={styles.list}>
        {labRows.map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
};
