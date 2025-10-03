import type { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
}

export const GlassCard = ({ className, title, subtitle, children }: PropsWithChildren<GlassCardProps>) => {
  return (
    <section className={clsx(styles.card, className)}>
      {(title || subtitle) && (
        <header className={styles.header}>
          {typeof title === 'string' ? <h2>{title}</h2> : title}
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
      )}
      <div className={styles.content}>{children}</div>
    </section>
  );
};
