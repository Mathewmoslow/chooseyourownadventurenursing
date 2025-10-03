import styles from './AppHeader.module.css';
import logo from '../../assets/logo.svg';

export const AppHeader = () => (
  <header className={styles.header}>
    <div className={styles.brand}> 
      <img src={logo} alt="CYOA Nursing" className={styles.logo} />
      <div>
        <h1>Choose Your Own Adventure: Nursing</h1>
        <p>Neutropenic sepsis triage simulator built for rapid decision practice.</p>
      </div>
    </div>
    <nav className={styles.nav}>
      <a href="https://github.com/Mathewmoslow/chooseyourownadventurenursing" target="_blank" rel="noreferrer">
        GitHub Repo
      </a>
      <span className={styles.badge}>Scenario v1.0</span>
    </nav>
  </header>
);
