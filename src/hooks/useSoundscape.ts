import { useCallback, useRef, useState } from 'react';

interface AmbientHandle {
  oscillator: OscillatorNode;
  noise: OscillatorNode;
  gain: GainNode;
}

export const useSoundscape = () => {
  const contextRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<AmbientHandle | null>(null);
  const [ambientEnabled, setAmbientEnabled] = useState(false);

  const ensureContext = useCallback(async (): Promise<AudioContext> => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    const ctx = contextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  }, []);

  const playSuccess = useCallback(async () => {
    const ctx = await ensureContext();
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(680, now);
    oscillator.frequency.exponentialRampToValueAtTime(420, now + 0.26);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }, [ensureContext]);

  const startAmbient = useCallback(async () => {
    if (ambientRef.current) return;
    const ctx = await ensureContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(110, ctx.currentTime);

    const noise = ctx.createOscillator();
    noise.type = 'triangle';
    noise.frequency.value = 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.02;
    noise.connect(noiseGain);
    noiseGain.connect(gain);

    gain.gain.value = 0.0001;
    gain.connect(ctx.destination);

    oscillator.connect(gain);

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.08, now + 1.2);

    oscillator.start(now);
    noise.start(now);

    ambientRef.current = { oscillator, noise, gain };
    setAmbientEnabled(true);
  }, [ensureContext]);

  const stopAmbient = useCallback(async () => {
    if (!ambientRef.current || !contextRef.current) return;
    const { oscillator, gain, noise } = ambientRef.current;
    const ctx = contextRef.current;
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1);
    oscillator.stop(now + 1.05);
    noise.stop(now + 1.05);
    ambientRef.current = null;
    setAmbientEnabled(false);
  }, []);

  const toggleAmbient = useCallback(() => {
    if (ambientRef.current) {
      void stopAmbient();
    } else {
      void startAmbient();
    }
  }, [startAmbient, stopAmbient]);

  return {
    playSuccess,
    toggleAmbient,
    ambientEnabled,
  };
};
