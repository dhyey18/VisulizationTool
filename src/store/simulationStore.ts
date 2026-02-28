import { create } from 'zustand';
import type { Step, SimulationResult } from '../types/simulation';
import { runSimulation } from '../core/engine';

interface SimulationState {
  code: string;
  steps: Step[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  error: string | null;
  hasRun: boolean;

  setCode: (code: string) => void;
  run: () => void;
  reset: () => void;
  goToStep: (index: number) => void;
  nextStep: () => boolean;
  prevStep: () => boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  code: `// Try one of the examples or write your own code!
function greet(name) {
  const message = "Hello, " + name + "!";
  console.log(message);
  return message;
}

const result = greet("World");
console.log("Done:", result);`,
  steps: [],
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  error: null,
  hasRun: false,

  setCode: (code) => set({ code, hasRun: false, steps: [], currentStepIndex: 0, error: null, isPlaying: false }),

  run: () => {
    const { code } = get();
    const result: SimulationResult = runSimulation(code);
    if (result.error) {
      set({ error: result.error, steps: [], hasRun: false, isPlaying: false });
    } else {
      set({
        steps: result.steps,
        currentStepIndex: 0,
        error: null,
        hasRun: true,
        isPlaying: false,
      });
    }
  },

  reset: () =>
    set({
      steps: [],
      currentStepIndex: 0,
      isPlaying: false,
      error: null,
      hasRun: false,
    }),

  goToStep: (index) => {
    const { steps } = get();
    if (index >= 0 && index < steps.length) {
      set({ currentStepIndex: index });
    }
  },

  nextStep: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
      return true;
    }
    set({ isPlaying: false });
    return false;
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
      return true;
    }
    return false;
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => {
    const { isPlaying, steps, hasRun } = get();
    if (!hasRun || steps.length === 0) return;
    set({ isPlaying: !isPlaying });
  },

  setSpeed: (speed) => set({ playbackSpeed: speed }),
}));
