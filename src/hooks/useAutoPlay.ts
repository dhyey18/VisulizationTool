import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../store/simulationStore';

export function useAutoPlay() {
  const isPlaying = useSimulationStore(s => s.isPlaying);
  const playbackSpeed = useSimulationStore(s => s.playbackSpeed);
  const nextStep = useSimulationStore(s => s.nextStep);
  const pause = useSimulationStore(s => s.pause);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const ms = Math.max(100, 1200 / playbackSpeed);
    intervalRef.current = setInterval(() => {
      const canContinue = nextStep();
      if (!canContinue) pause();
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, nextStep, pause]);
}
