import type { Labs } from '../types/simulation';
import { GlassCard } from './GlassCard';
import styles from './LabsPanel.module.css';
import clsx from 'clsx';

interface LabsPanelProps {
  labs: Labs;
}

const getLabStatus = (label: string, value: number): 'critical' | 'warning' | 'normal' => {
  switch (label) {
    case 'Hemoglobin':
      if (value < 6.5) return 'critical';
      if (value < 7.5) return 'warning';
      return 'normal';
    case 'Platelets':
      if (value < 10) return 'critical';
      if (value < 20) return 'warning';
      return 'normal';
    case 'ANC':
      if (value < 100) return 'critical';
      if (value < 500) return 'warning';
      return 'normal';
    case 'Creatinine':
      if (value > 2.0) return 'critical';
      if (value > 1.5) return 'warning';
      return 'normal';
    default:
      return 'normal';
  }
};

export const LabsPanel = ({ labs }: LabsPanelProps) => {
  const labRows = [
    { label: 'Hemoglobin', value: labs.hgb.toFixed(1), unit: 'g/dL', numericValue: labs.hgb, icon: '🩸' },
    { label: 'Platelets', value: `${labs.platelets}`, unit: 'K/µL', numericValue: labs.platelets, icon: '🔴' },
    { label: 'ANC', value: `${labs.anc}`, unit: '/µL', numericValue: labs.anc, icon: '⚪' },
    { label: 'Creatinine', value: labs.creatinine.toFixed(1), unit: 'mg/dL', numericValue: labs.creatinine, icon: '🫘' },
  ];

  return (
    <GlassCard title="Critical Labs" subtitle="🧪 Latest values">
      <ul className={styles.list}>
        {labRows.map((row) => {
          const status = getLabStatus(row.label, row.numericValue);
          return (
            <li
              key={row.label}
              className={clsx(styles.labItem, {
                [styles.critical]: status === 'critical',
                [styles.warning]: status === 'warning',
              })}
            >
              <div className={styles.labLabel}>
                <span className={styles.icon}>{row.icon}</span>
                <span className={styles.name}>{row.label}</span>
              </div>
              <div className={styles.labValue}>
                <strong>{row.value}</strong>
                <span className={styles.unit}>{row.unit}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
};
