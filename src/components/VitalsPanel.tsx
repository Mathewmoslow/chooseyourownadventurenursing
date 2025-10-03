import type { Vitals } from '../types/simulation';
import { GlassCard } from './GlassCard';
import styles from './VitalsPanel.module.css';

interface VitalsPanelProps {
  vitals: Vitals;
  neuro: string;
  skin: string;
  urineOutputTrend: string;
  elapsedMinutes: number;
}

export const VitalsPanel = ({ vitals, neuro, skin, urineOutputTrend, elapsedMinutes }: VitalsPanelProps) => {
  const vitalsList = [
    { label: 'Temp', value: `${vitals.temperatureC.toFixed(1)} °C` },
    { label: 'HR', value: `${vitals.heartRate} bpm` },
    { label: 'BP', value: `${vitals.systolic}/${vitals.diastolic} (MAP ${vitals.map.toFixed(0)})` },
    { label: 'RR', value: `${vitals.respiratoryRate} /min` },
    { label: 'SpO₂', value: `${vitals.spo2.toFixed(1)} %` },
    { label: 'Lactate', value: `${vitals.lactate.toFixed(1)} mmol/L` },
  ];

  return (
    <GlassCard title="Live Vitals" subtitle={`Time elapsed: ${elapsedMinutes} min`}>
      <div className={styles.grid}>
        {vitalsList.map((item) => (
          <div key={item.label} className={styles.metric}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className={styles.statusStrip}>
        <span>Neuro: {capitalize(neuro)}</span>
        <span>Skin: {capitalize(skin)}</span>
        <span>Urine trend: {formatUrine(urineOutputTrend)}</span>
      </div>
    </GlassCard>
  );
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const formatUrine = (value: string) => {
  if (value === 'drop') return 'Decreasing';
  if (value === 'anuric') return 'Minimal';
  return capitalize(value);
};
