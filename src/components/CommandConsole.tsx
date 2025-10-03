import { useState } from 'react';
import type { FormEvent } from 'react';
import clsx from 'clsx';
import styles from './CommandConsole.module.css';

interface CommandConsoleProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions: string[];
  ambientEnabled: boolean;
  onToggleAmbient: () => void;
}

export const CommandConsole = ({
  onSubmit,
  disabled,
  placeholder = 'Type a clinical action…',
  suggestions,
  ambientEnabled,
  onToggleAmbient,
}: CommandConsoleProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <div className={styles.console}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !value.trim()}>
          Engage
        </button>
        <button
          type="button"
          className={clsx(styles.ambientToggle, { [styles.active]: ambientEnabled })}
          onClick={onToggleAmbient}
        >
          {ambientEnabled ? 'Ambient on' : 'Ambient off'}
        </button>
      </form>
      <div className={styles.suggestions}>
        <span>Try:</span>
        {suggestions.map((text) => (
          <button key={text} type="button" onClick={() => setValue(text)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};
