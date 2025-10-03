import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AmbientScene } from '../visual/AmbientScene';
import styles from './AppLayout.module.css';

export const AppLayout = () => {
  return (
    <div className={styles.shell}>
      <AmbientScene />
      <AppHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <span>
          Educational simulation only. Verify against institutional policy before clinical use.
        </span>
      </footer>
    </div>
  );
};
