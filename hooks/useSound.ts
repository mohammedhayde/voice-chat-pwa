import { useCallback, useRef } from 'react';

export type SoundType = 'message' | 'join' | 'leave' | 'notification';

// Simple notification sounds using Web Audio API
const soundFrequencies: Record<SoundType, number[]> = {
  message: [800, 1000], // Two tones
  join: [600, 900, 1200], // Rising tones
  leave: [1200, 900, 600], // Falling tones
  notification: [1000, 800, 1000], // Alert pattern
};

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: SoundType) => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const frequencies = soundFrequencies[type];

      // Play each tone in sequence
      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        // Envelope for smooth sound
        const startTime = ctx.currentTime + (index * 0.1);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.1);
      });
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, []);

  return { playSound };
};
