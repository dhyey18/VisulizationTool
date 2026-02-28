import { useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore';

export function useKeyboardShortcuts() {
  const nextStep = useSimulationStore(s => s.nextStep);
  const prevStep = useSimulationStore(s => s.prevStep);
  const togglePlay = useSimulationStore(s => s.togglePlay);
  const hasRun = useSimulationStore(s => s.hasRun);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't capture when typing in editor or inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // Monaco uses a special class
      if ((e.target as HTMLElement)?.closest('.monaco-editor')) return;

      if (!hasRun) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStep();
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasRun, nextStep, prevStep, togglePlay]);
}
