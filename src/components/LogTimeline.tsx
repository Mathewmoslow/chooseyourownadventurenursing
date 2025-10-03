import clsx from 'clsx';
import type { ActionLogEntry } from '../types/simulation';
import styles from './LogTimeline.module.css';

interface LogTimelineProps {
  log: ActionLogEntry[];
  isPending: boolean;
}

export const LogTimeline = ({ log, isPending }: LogTimelineProps) => {
  const entries = log.slice().sort((a, b) => a.atMinute - b.atMinute);
  const last = entries[entries.length - 1]?.atMinute;

  return (
    <div className={styles.timeline}>
      {entries.map((entry) => (
        <article
          key={`${entry.atMinute}-${entry.action}`}
          className={clsx(styles.entry, { [styles.highlight]: entry.atMinute === last })}
        >
          <header>
            <span className={styles.timeStamp}>T+{entry.atMinute} min</span>
            <strong>{entry.action || '…'}</strong>
          </header>
          <p>{entry.narration}</p>
          <ul>
            {entry.notices.map((notice, index) => (
              <li key={index}>{notice}</li>
            ))}
          </ul>
        </article>
      ))}
      {isPending && <div className={styles.pending}>Processing intervention…</div>}
    </div>
  );
};
