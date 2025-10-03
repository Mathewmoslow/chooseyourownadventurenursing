import { motion } from 'framer-motion';
import styles from './AmbientScene.module.css';

const floatingVariants = {
  animate: {
    y: [0, -20, 0],
    rotate: [0, 3, -3, 0],
    transition: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
  },
};

const glowVariants = {
  animate: {
    opacity: [0.45, 0.65, 0.45],
    scale: [1, 1.1, 1],
    transition: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const AmbientScene = () => {
  return (
    <div className={styles.scene}>
      <motion.div className={styles.pulse} variants={glowVariants} animate="animate" />
      <motion.div className={styles.ellipseOne} variants={floatingVariants} animate="animate" />
      <motion.div className={styles.ellipseTwo} variants={floatingVariants} animate="animate" transition={{ delay: 1.6 }} />
      <motion.div className={styles.ring} variants={glowVariants} animate="animate" transition={{ delay: 2 }} />
    </div>
  );
};
