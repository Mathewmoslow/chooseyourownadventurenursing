import type { Outcome } from '../types/simulation';
import styles from './OutcomeBanner.module.css';

interface OutcomeBannerProps {
  outcome: Outcome;
}

export const OutcomeBanner = ({ outcome }: OutcomeBannerProps) => {
  if (outcome === 'ongoing') {
    return (
      <div className={styles.banner}>
        <span className={styles.pulse} />
        <strong>Simulation live</strong>
        <p>Drive empiric therapy and perfusion—each minute matters.</p>
      </div>
    );
  }

  const tone = outcome === 'stabilized' ? 'stabilized' : 'died';
  const headline = outcome === 'stabilized' ? 'Stabilized' : 'Code blue';
  const body =
    outcome === 'stabilized'
      ? 'Antibiotics and hemodynamic support bought ICU transfer time. Reset to play alternative strategies.'
      : 'Shock spiraled beyond rescue. Review sequence, escalate earlier, and try again.';

  return (
    <div className={styles.banner} data-tone={tone}>
      <span className={styles.pulse} />
      <strong>{headline}</strong>
      <p>{body}</p>
    </div>
  );
};
