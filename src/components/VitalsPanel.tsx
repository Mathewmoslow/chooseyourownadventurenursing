import type { Vitals } from '../types/simulation';
import { GlassCard } from './GlassCard';
import styles from './VitalsPanel.module.css';
import clsx from 'clsx';

interface VitalsPanelProps {
  vitals: Vitals;
  neuro: string;
  skin: string;
  urineOutputTrend: string;
  elapsedMinutes: number;
}

const getVitalStatus = (label: string, value: number): 'critical' | 'warning' | 'normal' => {
  switch (label) {
    case 'MAP':
      if (value < 55) return 'critical';
      if (value < 65) return 'warning';
      return 'normal';
    case 'HR':
      if (value > 140 || value < 50) return 'critical';
      if (value > 120 || value < 60) return 'warning';
      return 'normal';
    case 'Temp':
      if (value > 39.5 || value < 36) return 'critical';
      if (value > 38.5) return 'warning';
      return 'normal';
    case 'SpO₂':
      if (value < 90) return 'critical';
      if (value < 94) return 'warning';
      return 'normal';
    case 'Lactate':
      if (value > 4) return 'critical';
      if (value > 2.5) return 'warning';
      return 'normal';
    case 'RR':
      if (value > 30 || value < 8) return 'critical';
      if (value > 24 || value < 12) return 'warning';
      return 'normal';
    default:
      return 'normal';
  }
};

export const VitalsPanel = ({ vitals, neuro, skin, urineOutputTrend, elapsedMinutes }: VitalsPanelProps) => {
  const vitalsList = [
    { label: 'MAP', value: `${vitals.map.toFixed(0)}`, unit: 'mmHg', numericValue: vitals.map, priority: true },
    { label: 'HR', value: `${vitals.heartRate}`, unit: 'bpm', numericValue: vitals.heartRate, priority: true },
    { label: 'Lactate', value: `${vitals.lactate.toFixed(1)}`, unit: 'mmol/L', numericValue: vitals.lactate, priority: true },
    { label: 'SpO₂', value: `${vitals.spo2.toFixed(1)}`, unit: '%', numericValue: vitals.spo2, priority: false },
    { label: 'Temp', value: `${vitals.temperatureC.toFixed(1)}`, unit: '°C', numericValue: vitals.temperatureC, priority: false },
    { label: 'RR', value: `${vitals.respiratoryRate}`, unit: '/min', numericValue: vitals.respiratoryRate, priority: false },
  ];

  const bpDisplay = `${vitals.systolic}/${vitals.diastolic}`;
  const neuroStatus = neuro === 'obtunded' ? 'critical' : neuro === 'drowsy' ? 'warning' : 'normal';
  const skinStatus = skin === 'mottled' ? 'critical' : skin === 'clammy' ? 'warning' : 'normal';
  const urineStatus = urineOutputTrend === 'anuric' ? 'critical' : urineOutputTrend === 'drop' ? 'warning' : 'normal';

  return (
    <GlassCard title="Live Vitals" subtitle={`⏱ ${elapsedMinutes} min elapsed`}>
      <div className={styles.grid}>
        {vitalsList.map((item) => {
          const status = getVitalStatus(item.label, item.numericValue);
          return (
            <div
              key={item.label}
              className={clsx(styles.metric, {
                [styles.priority]: item.priority,
                [styles.critical]: status === 'critical',
                [styles.warning]: status === 'warning',
              })}
            >
              <span className={styles.label}>{item.label}</span>
              <strong className={styles.value}>{item.value}</strong>
              <span className={styles.unit}>{item.unit}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.bpRow}>
        <span className={styles.label}>BP</span>
        <strong>{bpDisplay}</strong>
      </div>
      <div className={styles.statusStrip}>
        <span className={clsx(styles.status, styles[neuroStatus])}>
          <strong>Neuro:</strong> {capitalize(neuro)}
        </span>
        <span className={clsx(styles.status, styles[skinStatus])}>
          <strong>Skin:</strong> {capitalize(skin)}
        </span>
        <span className={clsx(styles.status, styles[urineStatus])}>
          <strong>UOP:</strong> {formatUrine(urineOutputTrend)}
        </span>
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
