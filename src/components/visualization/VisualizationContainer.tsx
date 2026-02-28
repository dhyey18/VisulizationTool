import { useSimulationStore } from '../../store/simulationStore';
import { CallStackViz } from './CallStackViz';
import { HeapViz } from './HeapViz';
import { WebAPIViz } from './WebAPIViz';
import { TaskQueueViz } from './TaskQueueViz';
import { MicrotaskQueueViz } from './MicrotaskQueueViz';
import { EventLoopViz } from './EventLoopViz';
import { OutputViz } from './OutputViz';
import { Play } from 'lucide-react';
import './visualizations.css';

export function VisualizationContainer() {
  const hasRun = useSimulationStore(s => s.hasRun);
  const steps = useSimulationStore(s => s.steps);
  const currentStepIndex = useSimulationStore(s => s.currentStepIndex);

  const step = hasRun && steps.length > 0 ? steps[currentStepIndex] : null;
  const snapshot = step?.snapshot;
  const highlight = step?.highlight;

  if (!snapshot) {
    return (
      <div className="viz-container viz-placeholder">
        <div className="viz-placeholder-content">
          <div className="viz-placeholder-icon">
            <Play size={24} />
          </div>
          <div className="viz-placeholder-title">Ready to Visualize</div>
          <div className="viz-placeholder-text">
            Write JavaScript code and click <strong>Run</strong> to watch the runtime
            execution step by step.
          </div>
          <div className="viz-placeholder-keys">
            <span className="viz-placeholder-key"><kbd>Space</kbd> Play/Pause</span>
            <span className="viz-placeholder-key"><kbd>&larr;</kbd><kbd>&rarr;</kbd> Step</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="viz-container">
      <CallStackViz
        frames={snapshot.callStack}
        highlightId={highlight?.component === 'callStack' ? highlight.itemId : undefined}
      />
      <HeapViz
        heap={snapshot.heap}
        highlightId={highlight?.component === 'heap' ? highlight.itemId : undefined}
      />
      <WebAPIViz
        timers={snapshot.webAPIs}
        highlightId={highlight?.component === 'webAPI' ? highlight.itemId : undefined}
      />
      <TaskQueueViz
        tasks={snapshot.taskQueue}
        highlightId={highlight?.component === 'taskQueue' ? highlight.itemId : undefined}
      />
      <MicrotaskQueueViz
        tasks={snapshot.microtaskQueue}
        highlightId={highlight?.component === 'microtaskQueue' ? highlight.itemId : undefined}
      />
      <EventLoopViz phase={snapshot.eventLoopPhase} />
      <OutputViz output={snapshot.output} />
    </div>
  );
}
