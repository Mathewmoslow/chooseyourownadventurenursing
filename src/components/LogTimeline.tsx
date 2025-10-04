import clsx from 'clsx';
import type { ActionLogEntry } from '../types/simulation';
import styles from './LogTimeline.module.css';

interface LogTimelineProps {
  log: ActionLogEntry[];
  isPending: boolean;
}

export const LogTimeline = ({ log, isPending }: LogTimelineProps) => {
  const entries = log.slice().sort((a, b) => a.atMinute - b.atMinute);

  return (
    <div className={styles.timeline}>
      {entries.map((entry, index) => (
        <div key={`${entry.atMinute}-${entry.action}`} className={styles.exchange}>
          {/* User action - only show if not initial handoff */}
          {index > 0 && (
            <div className={styles.userMessage}>
              <div className={styles.messageHeader}>
                <span className={styles.badge}>You</span>
                <span className={styles.timeStamp}>T+{entry.atMinute} min</span>
              </div>
              <div className={styles.messageContent}>{entry.action || '…'}</div>
            </div>
          )}

          {/* System response */}
          <div className={clsx(styles.systemMessage, { [styles.initial]: index === 0 })}>
            <div className={styles.messageHeader}>
              <span className={styles.badge}>{index === 0 ? '📋 Handoff' : '🏥 Response'}</span>
              <span className={styles.timeStamp}>T+{entry.atMinute} min</span>
            </div>
            <div className={styles.messageContent}>
              <p className={styles.narration}>{entry.narration}</p>
              {entry.notices.length > 0 && (
                <ul className={styles.notices}>
                  {entry.notices.map((notice, noticeIndex) => (
                    <li key={noticeIndex}>{notice}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ))}
      {isPending && (
        <div className={styles.pendingMessage}>
          <div className={styles.spinner}></div>
          <span>Processing intervention...</span>
        </div>
      )}
    </div>
  );
};
