import { useSimulationStore } from '../../store/simulationStore';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import './ControlPanel.css';

const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3];

export function ControlPanel() {
  const hasRun = useSimulationStore(s => s.hasRun);
  const steps = useSimulationStore(s => s.steps);
  const currentStepIndex = useSimulationStore(s => s.currentStepIndex);
  const isPlaying = useSimulationStore(s => s.isPlaying);
  const playbackSpeed = useSimulationStore(s => s.playbackSpeed);
  const nextStep = useSimulationStore(s => s.nextStep);
  const prevStep = useSimulationStore(s => s.prevStep);
  const goToStep = useSimulationStore(s => s.goToStep);
  const togglePlay = useSimulationStore(s => s.togglePlay);
  const setSpeed = useSimulationStore(s => s.setSpeed);

  const totalSteps = steps.length;
  const currentStep = hasRun && totalSteps > 0 ? steps[currentStepIndex] : null;
  const isAtStart = currentStepIndex === 0;
  const isAtEnd = currentStepIndex >= totalSteps - 1;
  const progress = totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="control-panel">
      {/* Timeline */}
      {hasRun && totalSteps > 0 && (
        <div className="timeline-row">
          <div
            className="timeline-track"
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
          >
            <input
              type="range"
              min="0"
              max={totalSteps - 1}
              value={currentStepIndex}
              onChange={(e) => goToStep(Number(e.target.value))}
              className="timeline-input"
            />
          </div>
        </div>
      )}

      <div className="controls-row">
        {/* Step navigation */}
        <div className="control-group nav-group">
          <button
            className="btn btn-icon btn-ghost tooltip"
            data-tooltip="First"
            onClick={() => goToStep(0)}
            disabled={!hasRun || isAtStart}
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            className="btn btn-icon btn-ghost tooltip"
            data-tooltip="Previous"
            onClick={() => prevStep()}
            disabled={!hasRun || isAtStart}
          >
            <SkipBack size={15} />
          </button>
          <button
            className="ctrl-play-btn tooltip"
            data-tooltip={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            disabled={!hasRun || totalSteps === 0}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            className="btn btn-icon btn-ghost tooltip"
            data-tooltip="Next"
            onClick={() => nextStep()}
            disabled={!hasRun || isAtEnd}
          >
            <SkipForward size={15} />
          </button>
          <button
            className="btn btn-icon btn-ghost tooltip"
            data-tooltip="Last"
            onClick={() => goToStep(totalSteps - 1)}
            disabled={!hasRun || isAtEnd}
          >
            <ChevronsRight size={15} />
          </button>
        </div>

        {/* Step description */}
        <div className="step-desc-area">
          <span className="step-desc-text">
            {currentStep ? currentStep.description : 'Press Run to start visualization'}
          </span>
        </div>

        {/* Speed selector */}
        <div className="control-group speed-group">
          <span className="control-label">Speed</span>
          <div className="speed-segmented">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                className={`speed-btn ${playbackSpeed === s ? 'speed-btn-active' : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Step counter */}
        <div className="control-group step-counter">
          <span className="step-badge">
            {hasRun ? (
              <>
                <span className="step-current">{currentStepIndex + 1}</span>
                <span className="step-sep">/</span>
                <span className="step-total">{totalSteps}</span>
              </>
            ) : (
              <span className="step-total">--</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
